import * as THREE from 'three';
import { SCENE_MAP } from '../data/sceneMap.js';

/**
 * HotspotManager
 * Manages all 3D hotspot meshes in the panorama viewer.
 * Extracted from PanoramaViewer to reduce its class complexity.
 *
 * Responsibilities:
 *  - Create / remove / refresh hotspot meshes
 *  - Generate icon textures (canvas-based)
 *  - Position and orient labels beneath hotspots
 *  - Admin drag-and-drop (move hotspot on sphere surface)
 *  - Navigate to a new scene on click
 */
export class HotspotManager {
    /**
     * @param {THREE.Group} hotspotsGroup  - Group to add hotspot meshes into
     * @param {THREE.Mesh}  sphere         - The panorama sphere (for raycasting)
     * @param {TextureManager} texManager  - Shared texture loader
     * @param {Function} onNavigate        - Callback(target) when arrow/scene hotspot is clicked
     * @param {Function} onInfoOpen        - Callback(data) when info hotspot is clicked
     */
    constructor(hotspotsGroup, sphere, texManager, onNavigate, onInfoOpen) {
        this.hotspotsGroup = hotspotsGroup;
        this.sphere        = sphere;
        this.texManager    = texManager;
        this.onNavigate    = onNavigate;
        this.onInfoOpen    = onInfoOpen;

        /** @type {THREE.Mesh[]} */
        this.currentHotspots = [];

        // Icon texture cache is shared with TextureManager cache via a prefix key
        this._iconCache = new Map();

        // Admin state
        this.isAdminMode      = false;
        this.isDragging       = false;
        this.draggedMesh      = null;
        this.dragInitialState = null;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // PUBLIC API
    // ──────────────────────────────────────────────────────────────────────────

    /** Render a list of hotspot data objects (clear old ones first). */
    render(hotspots) {
        this.clear();
        if (!hotspots || hotspots.length === 0) return;

        hotspots.forEach(data => {
            const mesh = this._createMesh(data);
            if (mesh) {
                this.hotspotsGroup.add(mesh);
                this.currentHotspots.push(mesh);
            }
        });
    }

    /** Remove all current hotspot meshes and dispose their GPU resources. */
    clear() {
        while (this.hotspotsGroup.children.length > 0) {
            const child = this.hotspotsGroup.children[0];
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (child.material.map) child.material.map.dispose();
                child.material.dispose();
            }
            this.hotspotsGroup.remove(child);
        }
        this.currentHotspots = [];
    }

    /** Add a single hotspot at given yaw/pitch. Only works in admin mode. */
    addHotspot(yaw, pitch) {
        if (!this.isAdminMode) return;
        const data = { type: 'arrow', yaw, pitch, target: '', label: 'New Hotspot' };
        const mesh = this._createMesh(data);
        if (mesh) {
            this.hotspotsGroup.add(mesh);
            this.currentHotspots.push(mesh);
            window.adminPanel?.selectHotspot(data);
        }
    }

    /** Remove a specific hotspot by its data reference. */
    remove(data) {
        const mesh = this.currentHotspots.find(m => m.userData.hotspotData === data);
        if (!mesh) return;
        this._disposeMesh(mesh);
        this.currentHotspots = this.currentHotspots.filter(m => m !== mesh);
    }

    /** Refresh a hotspot mesh when its data changes (icon, size, color…). */
    refresh(data) {
        const old = this.currentHotspots.find(m => m.userData.hotspotData === data);
        if (old) {
            this._disposeMesh(old);
            this.currentHotspots = this.currentHotspots.filter(m => m !== old);
        }
        const mesh = this._createMesh(data);
        if (mesh) {
            this.hotspotsGroup.add(mesh);
            this.currentHotspots.push(mesh);
        }
    }

    /** Return a snapshot array of all current hotspot data for saving. */
    getSnapshotData(currentSceneId) {
        return this.currentHotspots.map(mesh => {
            const data = mesh.userData.hotspotData;
            const p    = mesh.position.clone().normalize();
            const pitch = THREE.MathUtils.radToDeg(Math.asin(p.y));
            let yaw = THREE.MathUtils.radToDeg(Math.atan2(p.x, -p.z)) - 90;
            if (yaw < -180) yaw += 360;
            if (yaw > 180)  yaw -= 360;

            const out = {
                yaw:         parseFloat(yaw.toFixed(2)),
                pitch:       parseFloat(pitch.toFixed(2)),
                target:      data.target      || '',
                target_name: (typeof data.label === 'string') ? data.label : (data.target_name || ''),
                type:        data.type        || 'arrow',
                label:       data.label       || '',
                size:        data.size        !== undefined ? data.size : 3,
                textSize:    data.textSize    !== undefined ? data.textSize : 1.0,
                color:       data.color       || null,
                icon_url:    data.icon_url    || null,
                labelOffset: data.labelOffset !== undefined ? data.labelOffset : 0,
                labelWrap:   data.labelWrap   || false,
            };
            if (out.type === 'info') {
                out.title       = data.title       || '';
                out.description = data.description || '';
                out.infoWidth   = data.infoWidth   || 1.0;
                out.infoHeight  = data.infoHeight  || 0.8;
                out.infoColor   = data.infoColor   || '#1e293b';
                out.infoOpacity = data.infoOpacity !== undefined ? data.infoOpacity : 0.95;
            } else if (out.type === 'photo') {
                out.description = data.description || '';
            }
            return out;
        });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ADMIN: CLICK / RIGHT-CLICK / DRAG
    // ──────────────────────────────────────────────────────────────────────────

    handleAdminClick(intersects) {
        if (!this.isAdminMode) return false;
        if (this.isDragging) { this.isDragging = false; this.draggedMesh = null; return true; }

        if (intersects.length > 0) {
            const obj = intersects[0].object;
            if (obj.userData.hotspotData) {
                window.adminPanel?.selectHotspot(obj.userData.hotspotData);
                return true;
            }
            if (obj === this.sphere) {
                window.adminPanel?.selectHotspot(null);
                return true;
            }
        }
        return false;
    }

    handleAdminRightClick(intersects) {
        if (!this.isAdminMode) return false;
        if (intersects.length > 0 && intersects[0].object === this.sphere) {
            const pt    = intersects[0].point.normalize();
            const pitch = THREE.MathUtils.radToDeg(Math.asin(pt.y));
            let yaw     = THREE.MathUtils.radToDeg(Math.atan2(pt.x, -pt.z)) - 90;
            if (yaw < -180) yaw += 360;
            if (yaw > 180)  yaw -= 360;
            this.addHotspot(parseFloat(yaw.toFixed(2)), parseFloat(pitch.toFixed(2)));
            return true;
        }
        return false;
    }

    handleAdminMouseDown(intersects) {
        if (!this.isAdminMode) return false;
        const hit = intersects.find(h => h.object.userData.hotspotData);
        if (hit) {
            this.isDragging    = true;
            this.draggedMesh   = hit.object;
            const data         = hit.object.userData.hotspotData;
            this.dragInitialState = { data, yaw: data.yaw, pitch: data.pitch };
            window.adminPanel?.selectHotspot(data);
            return true;
        }
        return false;
    }

    handleAdminMouseMove(raycaster) {
        if (!this.isAdminMode || !this.isDragging || !this.draggedMesh) return false;

        const intersects = raycaster.intersectObject(this.sphere);
        if (intersects.length === 0) return true;

        const point  = intersects[0].point;
        const radius = 45;
        const p      = point.clone().normalize().multiplyScalar(radius);
        this.draggedMesh.position.copy(p);

        const worldUp = new THREE.Vector3(0, 1, 0);
        const forward = p.clone().normalize().negate();
        const right   = new THREE.Vector3().crossVectors(worldUp, forward).normalize();
        const up      = new THREE.Vector3().crossVectors(forward, right).normalize();
        const matrix  = new THREE.Matrix4().makeBasis(right, up, forward);
        this.draggedMesh.setRotationFromMatrix(matrix);

        // Sync label position
        const label = this.draggedMesh.userData.labelSprite;
        if (label) {
            const data     = this.draggedMesh.userData.hotspotData;
            const size     = data.size || 3;
            const textSize = data.textSize || 1.0;
            const offset   = data.labelOffset !== undefined ? data.labelOffset : 0;
            const curPos   = p.clone().normalize();
            const curPitch = Math.asin(curPos.y);
            const curYaw   = Math.atan2(curPos.x, -curPos.z);
            const baseOff  = THREE.MathUtils.degToRad(size * 0.8 + 2 * textSize + offset);
            const lPitch   = curPitch - baseOff;

            label.position.set(
                radius * Math.sin(curYaw) * Math.cos(lPitch),
                radius * Math.sin(lPitch),
                -radius * Math.cos(curYaw) * Math.cos(lPitch)
            );
            const lFwd = new THREE.Vector3().copy(label.position).normalize().negate();
            const lR   = new THREE.Vector3().crossVectors(worldUp, lFwd).normalize();
            const lU   = new THREE.Vector3().crossVectors(lFwd, lR).normalize();
            label.setRotationFromMatrix(new THREE.Matrix4().makeBasis(lR, lU, lFwd));
        }
        return true;
    }

    handleAdminMouseUp() {
        if (!this.isDragging || !this.draggedMesh) return false;
        this.isDragging = false;

        const p = this.draggedMesh.position.clone().normalize();
        const pitch = THREE.MathUtils.radToDeg(Math.asin(p.y));
        let yaw     = THREE.MathUtils.radToDeg(Math.atan2(p.x, -p.z)) - 90;
        if (yaw < -180) yaw += 360;
        if (yaw > 180)  yaw -= 360;

        const data    = this.draggedMesh.userData.hotspotData;
        const newYaw  = parseFloat(yaw.toFixed(2));
        const newPitch = parseFloat(pitch.toFixed(2));

        if (this.dragInitialState?.yaw !== newYaw || this.dragInitialState?.pitch !== newPitch) {
            data.yaw   = newYaw;
            data.pitch = newPitch;
            window.adminPanel?.pushUndoCommand({
                type: 'move', hotspot: data,
                oldYaw: this.dragInitialState.yaw, oldPitch: this.dragInitialState.pitch,
                newYaw, newPitch
            });
            window.adminPanel?.selectHotspot(data);
            window.adminPanel?.markDirty();
        }
        this.draggedMesh   = null;
        this.dragInitialState = null;
        return true;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ──────────────────────────────────────────────────────────────────────────

    _disposeMesh(mesh) {
        if (mesh.userData.labelSprite) {
            const ls = mesh.userData.labelSprite;
            this.hotspotsGroup.remove(ls);
            ls.geometry?.dispose();
            ls.material?.dispose();
        }
        this.hotspotsGroup.remove(mesh);
        mesh.geometry?.dispose();
        mesh.material?.dispose();
    }

    _createMesh(data) {
        if (!data) return null;

        const type    = data.type  || 'arrow';
        const size    = data.size  || 3;
        const color   = data.color || null;
        const iconUrl = data.icon_url || null;

        const geometry = new THREE.PlaneGeometry(size, size);
        const material = new THREE.MeshBasicMaterial({
            transparent: true,
            side: THREE.DoubleSide,
            depthTest: false,
        });

        if (iconUrl) {
            this.texManager.load(iconUrl).then(tex => {
                material.map = tex;
                material.needsUpdate = true;
            }).catch(() => {
                material.map = this._getIconTexture(type, color);
                material.needsUpdate = true;
            });
        } else {
            material.map = this._getIconTexture(type, color);
        }

        const mesh = new THREE.Mesh(geometry, material);

        // Position on sphere surface
        const radius   = 45;
        const yawRad   = THREE.MathUtils.degToRad((data.yaw   || 0) + 90);
        const pitchRad = THREE.MathUtils.degToRad( data.pitch  || 0);

        mesh.position.set(
            radius * Math.sin(yawRad)  * Math.cos(pitchRad),
            radius * Math.sin(pitchRad),
            -radius * Math.cos(yawRad) * Math.cos(pitchRad)
        );

        // Rigid vertical orientation (face center, keep upright)
        const worldUp = new THREE.Vector3(0, 1, 0);
        const forward = mesh.position.clone().normalize().negate();
        const right   = new THREE.Vector3().crossVectors(worldUp, forward).normalize();
        const up      = new THREE.Vector3().crossVectors(forward, right).normalize();
        mesh.setRotationFromMatrix(new THREE.Matrix4().makeBasis(right, up, forward));

        mesh.userData.isInteractable = true;
        mesh.userData.label          = data.label || 'Hotspot';
        mesh.userData.hotspotData    = data;
        mesh.renderOrder             = 9999;

        // Hover scale animation bookkeeping
        mesh.userData.originalScale = new THREE.Vector3(1, 1, 1);
        mesh.userData.targetScale   = new THREE.Vector3(1, 1, 1);
        mesh.onHoverIn  = () => mesh.userData.targetScale.set(1.3, 1.3, 1.3);
        mesh.onHoverOut = () => mesh.userData.targetScale.copy(mesh.userData.originalScale);

        // Label
        if (data.label) {
            const labelMesh = this._createLabel(data.label, data.textSize || 1.0, data.labelWrap || false);
            const baseOff   = size * 0.8 + 2 * (data.textSize || 1.0);
            const finalOff  = THREE.MathUtils.degToRad((data.pitch || 0) - (baseOff + (data.labelOffset || 0)));
            labelMesh.position.set(
                radius * Math.sin(yawRad)  * Math.cos(finalOff),
                radius * Math.sin(finalOff),
                -radius * Math.cos(yawRad) * Math.cos(finalOff)
            );
            const lFwd = labelMesh.position.clone().normalize().negate();
            const lR   = new THREE.Vector3().crossVectors(worldUp, lFwd).normalize();
            const lU   = new THREE.Vector3().crossVectors(lFwd, lR).normalize();
            labelMesh.setRotationFromMatrix(new THREE.Matrix4().makeBasis(lR, lU, lFwd));
            labelMesh.renderOrder = 9999;
            this.hotspotsGroup.add(labelMesh);
            mesh.userData.labelSprite = labelMesh;
        }

        // Click handler
        mesh.onClick = () => {
            if (this.isAdminMode) return;
            if (data.type === 'scene' || data.target) {
                this.onNavigate?.(data.target, mesh.position.clone());
            } else if (data.type === 'info') {
                this.onInfoOpen?.(data);
            } else if (data.type === 'photo') {
                console.log('Open Photo:', data.target_name);
            }
        };

        return mesh;
    }

    _createLabel(text, scale = 1.0, wrap = false) {
        const baseFontSize = 42;
        const fontSize     = baseFontSize * scale;
        const padding      = 24 * scale;
        const lineHeight   = fontSize * 1.3;

        const canvas = document.createElement('canvas');
        const ctx    = canvas.getContext('2d');
        ctx.font     = `500 ${fontSize}px 'Roboto', sans-serif`;

        let lines = [text];
        let maxW;

        if (wrap && text.length > 12) {
            const maxWidth = 280 * scale;
            const words    = text.split(' ');
            lines = [];
            let current = '';
            for (const word of words) {
                const test = current ? current + ' ' + word : word;
                if (ctx.measureText(test).width > maxWidth && current) {
                    lines.push(current);
                    current = word;
                } else {
                    current = test;
                }
            }
            if (current) lines.push(current);
            maxW = Math.max(...lines.map(l => ctx.measureText(l).width));
        } else {
            maxW = ctx.measureText(text).width;
        }

        canvas.width  = maxW + padding * 2;
        canvas.height = lineHeight * lines.length + padding * 1.5;

        const w = canvas.width;
        const h = canvas.height;
        const r = lines.length > 1 ? 20 * scale : h / 2;
        const ctx2 = canvas.getContext('2d');

        ctx2.fillStyle = 'rgba(0,0,0,0.75)';
        ctx2.beginPath();
        ctx2.roundRect(0, 0, w, h, r);
        ctx2.fill();

        ctx2.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx2.lineWidth   = 1.5;
        ctx2.stroke();

        ctx2.font         = `500 ${fontSize}px 'Roboto', sans-serif`;
        ctx2.fillStyle    = '#ffffff';
        ctx2.textAlign    = 'center';
        ctx2.textBaseline = 'middle';
        ctx2.shadowColor  = 'rgba(0,0,0,0.5)';
        ctx2.shadowBlur   = 4;
        ctx2.shadowOffsetY = 1;

        if (lines.length === 1) {
            ctx2.fillText(text, w / 2, h / 2);
        } else {
            const startY = (h - lineHeight * lines.length) / 2 + lineHeight / 2;
            lines.forEach((line, i) => ctx2.fillText(line, w / 2, startY + i * lineHeight));
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        const geom = new THREE.PlaneGeometry(w * 0.018, h * 0.018);
        const mat  = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide, depthTest: false });
        return new THREE.Mesh(geom, mat);
    }

    _getIconTexture(type, customColor = null) {
        const key = `icon_${type}_${customColor || ''}`;
        if (this._iconCache.has(key)) return this._iconCache.get(key);

        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width  = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const cx  = size / 2;
        const cy  = size / 2;
        const rad = size / 2 - 8;

        const defaultColors = {
            arrow: '#4f46e5', scene: '#4f46e5', info: '#0ea5e9',
            plus: '#10b981',  home: '#8b5cf6',  back: '#64748b',
            photo: '#f59e0b', video: '#ef4444'
        };
        const color     = customColor || defaultColors[type] || '#64748b';
        const glowColor = this._hexToRgba(color, 0.6);

        ctx.lineCap  = 'round';
        ctx.lineJoin = 'round';

        const drawBase = () => {
            ctx.shadowColor = glowColor;
            ctx.shadowBlur  = 20;
            const grad = ctx.createRadialGradient(cx, cy * 0.8, 0, cx, cy, rad);
            grad.addColorStop(0, color);
            grad.addColorStop(1, this._adjustColor(color, -30));
            ctx.beginPath();
            ctx.arc(cx, cy, rad, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();
            ctx.shadowBlur   = 0;
            ctx.strokeStyle  = 'rgba(255,255,255,0.4)';
            ctx.lineWidth    = 3;
            ctx.beginPath();
            ctx.arc(cx, cy, rad - 6, 0, Math.PI * 2);
            ctx.stroke();
            ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            ctx.lineWidth   = 8;
            ctx.beginPath();
            ctx.arc(cx, cy, rad - 20, -Math.PI * 0.8, -Math.PI * 0.2);
            ctx.stroke();
        };

        drawBase();

        if (type === 'arrow' || type === 'scene' || type === 'location') {
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.moveTo(cx, cy + 50);
            ctx.bezierCurveTo(cx - 50, cy + 10, cx - 45, cy - 55, cx, cy - 55);
            ctx.bezierCurveTo(cx + 45, cy - 55, cx + 50, cy + 10, cx, cy + 50);
            ctx.fill();
            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath();
            ctx.arc(cx, cy - 15, 18, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalCompositeOperation = 'source-over';
        } else if (type === 'info') {
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(cx, cy - 45, 12, 0, Math.PI * 2); ctx.fill();
            ctx.fillRect(cx - 10, cy - 20, 20, 70);
            ctx.beginPath(); ctx.arc(cx, cy + 50, 10, 0, Math.PI * 2); ctx.fill();
        } else if (type === 'plus') {
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 16;
            ctx.beginPath();
            ctx.moveTo(cx, cy - 40); ctx.lineTo(cx, cy + 40);
            ctx.moveTo(cx - 40, cy); ctx.lineTo(cx + 40, cy);
            ctx.stroke();
        } else if (type === 'home') {
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.moveTo(cx, cy - 50); ctx.lineTo(cx + 55, cy); ctx.lineTo(cx - 55, cy); ctx.closePath(); ctx.fill();
            ctx.fillRect(cx - 40, cy, 80, 50);
            ctx.fillStyle = this._hexToRgba(color, 0.8);
            ctx.fillRect(cx - 15, cy + 15, 30, 35);
        } else if (type === 'back') {
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 14;
            ctx.beginPath();
            ctx.arc(cx + 10, cy - 10, 45, 0, -Math.PI * 0.75, true);
            ctx.stroke();
            const tipX = cx + 10 + 45 * Math.cos(-Math.PI * 0.75);
            const tipY = cy - 10 + 45 * Math.sin(-Math.PI * 0.75);
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.moveTo(tipX - 20, tipY - 8); ctx.lineTo(tipX + 2, tipY - 25); ctx.lineTo(tipX + 5, tipY + 12);
            ctx.closePath(); ctx.fill();
        } else if (type === 'photo') {
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.roundRect(cx - 50, cy - 25, 100, 65, 8); ctx.fill();
            ctx.fillStyle = this._hexToRgba(color, 0.9);
            ctx.beginPath(); ctx.arc(cx, cy + 5, 25, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(cx, cy + 5, 15, 0, Math.PI * 2); ctx.fill();
            ctx.fillRect(cx - 20, cy - 40, 40, 15);
        } else if (type === 'video') {
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.moveTo(cx - 25, cy - 40); ctx.lineTo(cx + 40, cy); ctx.lineTo(cx - 25, cy + 40);
            ctx.closePath(); ctx.fill();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        this._iconCache.set(key, texture);
        return texture;
    }

    _adjustColor(hex, amount) {
        const n = parseInt(hex.replace('#', ''), 16);
        const r = Math.min(255, Math.max(0, (n >> 16) + amount));
        const g = Math.min(255, Math.max(0, ((n >> 8) & 0x00FF) + amount));
        const b = Math.min(255, Math.max(0, (n & 0x0000FF) + amount));
        return `rgb(${r},${g},${b})`;
    }

    _hexToRgba(hex, alpha) {
        const n = parseInt(hex.replace('#', ''), 16);
        return `rgba(${(n >> 16) & 0xFF},${(n >> 8) & 0xFF},${n & 0xFF},${alpha})`;
    }

    dispose() {
        this.clear();
        this._iconCache.forEach(t => t.dispose());
        this._iconCache.clear();
    }
}

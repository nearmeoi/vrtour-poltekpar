import * as THREE from 'three';
import { TOUR_DATA } from '../data/tourData.js';
import { CanvasUI } from '../utils/CanvasUI.js';
import { AudioControls } from './AudioControls.js';
import { CONFIG, API_BASE } from '../config.js';
import HOTSPOTS_DATA from '../data/hotspots.json';
import { SCENE_MAP } from '../data/sceneMap.js';
import { TextureManager } from './TextureManager.js';
import { HotspotManager } from './HotspotManager.js';

/**
 * PanoramaViewer  (refactored)
 * ─────────────────────────────────────────────────────────────────────────────
 * Now a lean coordinator.  Heavy sub-responsibilities live in:
 *   · TextureManager  – loading / caching / preloading textures
 *   · HotspotManager  – mesh creation, icons, labels, admin drag
 *
 * Mobile optimisations applied:
 *   · SphereGeometry reduced to (50, 48, 24) – fewer verts on GPU
 *   · matrixAutoUpdate = false on the static sphere
 *   · Path encoding cleaned up (no double-encoding hack)
 *   · Gaze activation time lowered via CONFIG
 */
export class PanoramaViewer {
    constructor(scene, onBack, camera, renderer) {
        this.scene    = scene;
        this.onBack   = onBack;
        this.camera   = camera;
        this.renderer = renderer;

        this.panoramaBrightness = 1.0;
        this.group = new THREE.Group();
        this.group.position.set(0, 1.6, 0);
        this.scene.add(this.group);
        this.group.visible = false;

        // State
        this.currentPath    = null;
        this.currentSceneId = null;
        this.currentAudio   = null;
        this.currentLocation = null;
        this.isAdminMode    = false;
        this.dockCenterOffset = 0;

        // ── Panorama sphere (mobile-optimised segment count) ──────────────────
        const geometry = new THREE.SphereGeometry(50, 48, 24);
        geometry.scale(-1, 1, 1);

        this.basicMaterial = new THREE.MeshBasicMaterial({
            map: null,
            color: 0xffffff,
            toneMapped: false,
        });

        this.sphere = new THREE.Mesh(geometry, this.basicMaterial);
        this.sphere.matrixAutoUpdate = false; // Static mesh — skip matrix recalc each frame
        this.group.add(this.sphere);

        // ── Fade Transition Overlay ───────────────────────────────────────────
        const fadeGeo = new THREE.SphereGeometry(2, 32, 32); 
        fadeGeo.scale(-1, 1, 1);
        this.fadeMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0, depthTest: false, depthWrite: false });
        this.fadeMesh = new THREE.Mesh(fadeGeo, this.fadeMat);
        this.fadeMesh.renderOrder = 9999;
        this.group.add(this.fadeMesh);

        this.fadeState = 'idle'; // 'fading_out', 'loading', 'fading_in', 'idle'
        this.fadeOpacity = 0;
        this.pendingPath = null;
        this.onFadedOutCallback = null;

        // ── Control dock ──────────────────────────────────────────────────────
        this.controlDock = new THREE.Group();
        this.group.add(this.controlDock);

        this.createBackButton();
        this.audioControls = new AudioControls(this.controlDock);
        this.audioControls.setVisible(false);
        this.createLoadingIndicator();

        // ── Sub-modules ───────────────────────────────────────────────────────
        this.texManager = new TextureManager(this.renderer);

        this.hotspotsGroup = new THREE.Group();
        this.group.add(this.hotspotsGroup);

        this.hotspotManager = new HotspotManager(
            this.hotspotsGroup,
            this.sphere,
            this.texManager,
            (target, position) => this.navigateToScene(target, position),
            (data)   => this._handleInfoHotspot(data)
        );

        // Movement variables for transition
        this.movementOffset = new THREE.Vector3();
        this.movementProgress = 0;
        this.targetMovementVector = null;

        // Load hotspots from local JSON (no API call needed)
        this.hotspotsData = HOTSPOTS_DATA;
        console.log('Hotspots loaded locally:', Object.keys(this.hotspotsData).length, 'scenes');
    }

    // ──────────────────────────────────────────────────────────────────────────
    // EXTERNAL INJECTIONS
    // ──────────────────────────────────────────────────────────────────────────

    setInfoOverlay(overlay)   { this.infoOverlay  = overlay; }
    setInfoPanel3D(panel)     { this.infoPanel3D   = panel;  }
    setSubtitlePanel3D(panel) { this.subtitlePanel3D = panel; }

    _handleInfoHotspot(data) {
        if (this.infoPanel3D) {
            this.infoPanel3D.show(data);
        } else if (this.infoOverlay) {
            this.infoOverlay.show(data);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // LOADING
    // ──────────────────────────────────────────────────────────────────────────

    load(index) {
        const location = TOUR_DATA[index];
        if (!location) { console.error('Invalid location index:', index); return; }
        this.loadFromLocation(location);
    }

    loadFromLocation(location) {
        if (!location) { console.error('Invalid location'); return; }
        this.currentLocation = location;

        // Stop any playing audio
        if (this.currentAudio) { this.currentAudio.pause(); this.currentAudio = null; }
        this.subtitlePanel3D?.clear();

        if (location.audio) {
            this.currentAudio = new Audio(location.audio);
            this.currentAudio.loop   = false;
            this.currentAudio.volume = 0.5;
            this.audioControls.setAudio(this.currentAudio);
            this.subtitlePanel3D?.setTrack(this.currentAudio, location.subtitles || []);
            this.currentAudio.addEventListener('ended', () =>
                this.audioControls.setState(false, this.audioControls.isMuted)
            );
            this.currentAudio.play()
                .then(() => this.audioControls.setState(true, this.audioControls.isMuted))
                .catch(() => this.audioControls.setState(false, this.audioControls.isMuted));
        } else {
            this.audioControls.setAudio(null);
            this.audioControls.setState(false, false);
            this.subtitlePanel3D?.clear();
        }

        // Bersihkan state dari lokasi sebelumnya
        this.hotspotManager.clear();
        this.currentSceneId = null;

        if (location.scenes && location.scenes.length > 0) {
            this.loadScene(location.scenes[0]);
            // Background preload of linked scenes
            this.texManager.preload(location.scenes.slice(1).map(s => s.path).filter(Boolean));
        } else if (location.panorama) {
            this.loadTexture(location.panorama);
        }

        this.group.visible = true;
        this.resetControlDockRotation();
    }

    loadScene(sceneData) {
        console.log('Loading scene:', sceneData.id);
        this.currentSceneId = sceneData.id;
        
        this.loadTexture(sceneData.path, () => {
            this._executeTextureLoad(sceneData.path, () => {
                const adapted = (sceneData.links || []).map(h => ({
                    ...h,
                    type:  h.type  || 'arrow',
                    label: h.target_name || h.label,
                }));
                this.hotspotManager.render(adapted);
            });
        });

        // Preload linked scenes
        if (sceneData.links && this.currentLocation) {
            const paths = sceneData.links
                .map(l => this.currentLocation?.scenes?.find(s => s.id === l.target)?.path)
                .filter(Boolean);
            this.texManager.preload(paths);
        }
    }

    loadTexture(path, onFadedOut = null) {
        if (this.currentPath === path && this.fadeState === 'idle') return;

        if (this.fadeState === 'loading' || this.fadeState === 'fading_out') {
            if (this.fadeState === 'loading') {
                if (onFadedOut) onFadedOut();
                else this._executeTextureLoad(path);
            } else {
                this.pendingPath = path;
                this.onFadedOutCallback = onFadedOut;
            }
            return;
        }

        this.pendingPath = path;
        this.onFadedOutCallback = onFadedOut;
        this.fadeState = 'fading_out';
        
        // Hanya tampilkan 3D spinner jika user tidak memakai loading HTML sendiri (menghindari tumpukan)
        // this.showLoading(); 
    }


    _executeTextureLoad(path, onLoaded = null) {
        this.currentPath = path;

        if (path && path.startsWith('placeholder')) {
            this.loadFallbackTexture(path.replace('placeholder_', 'ZONE ').toUpperCase());
            this.hideLoading();
            if (onLoaded) onLoaded();
            this.fadeState = 'fading_in';
            return;
        }

        this.texManager.load(path)
            .then(texture => {
                this.basicMaterial.map = texture;
                this.basicMaterial.color.setScalar(this.panoramaBrightness);
                this.basicMaterial.needsUpdate = true;
                
                this.sphere.updateMatrix(); 
                this.hideLoading();
                
                if (onLoaded) {
                    onLoaded();
                } else {
                    this._loadHotspotsForPath(path);
                }
                
                // Mencegah lag (stuttering) saat production dengan upload texture ke GPU secara paksa
                if (this.renderer && typeof this.renderer.initTexture === 'function') {
                    this.renderer.initTexture(texture);
                }
                
                // Beri jeda 2 frame agar komputasi berat GPU selesai saat layar masih hitam
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        this.fadeState = 'fading_in';
                    });
                });
            })
            .catch(() => {
                console.warn('Failed to load panorama, using fallback:', path);
                this.loadFallbackTexture('ZONA ' + (this.currentLocation?.id || '?'));
                this.hideLoading();
                if (onLoaded) onLoaded();
                this.fadeState = 'fading_in';
            });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // NAVIGATION
    // ──────────────────────────────────────────────────────────────────────────

    navigateToScene(target, targetPosition = null) {
        if (!target) return;

        // Prevent concurrent transitions
        if (this.fadeState !== 'idle' && this.fadeState !== 'fading_in') {
            console.warn('Transition already in progress');
            return;
        }

        this.group.visible = true;
        if (this.infoOverlay) this.infoOverlay.hide();
        if (this.infoPanel3D) this.infoPanel3D.hide();

        // Save current hotspots to hotspotsData before leaving
        this._syncCurrentHotspots();

        // Setup movement towards hotspot if applicable
        this.targetMovementVector = null;
        this.movementProgress = 0;
        this.movementOffset.set(0, 0, 0);

        if (targetPosition) {
            // Calculate direction from camera to target position
            const camPos = new THREE.Vector3();
            if (this.camera) this.camera.getWorldPosition(camPos);
            this.targetMovementVector = targetPosition.clone().sub(camPos).normalize();
        }

        // Set state to fading out
        this.fadeState = 'fading_out';

        // When fade-out is complete, load the next scene
        this.onFadedOutCallback = () => {
            let sceneData = SCENE_MAP[target];

            // Try path-based lookup
            if (!sceneData && typeof target === 'string') {
                const entry = Object.entries(SCENE_MAP).find(([, d]) =>
                    d.path === target || d.path === `assets/${target}` || `assets/${d.path}` === target
                );
                if (entry) { target = entry[0]; sceneData = entry[1]; }
            }

            if (sceneData) {
                this.currentSceneId = target;
                this.loadTexture(sceneData.path);
            } else if (typeof target === 'string' && (target.includes('/') || target.includes('.'))) {
                this.currentSceneId = target;
                this.currentLocation = { path: target, id: null };
                this.loadTexture(target);
            } else {
                console.warn('Target scene invalid:', target);
                this.loadFallbackTexture('NOT FOUND: ' + target);
            }
        };
    }

    // ──────────────────────────────────────────────────────────────────────────
    // HOTSPOT DATA HELPERS
    // ──────────────────────────────────────────────────────────────────────────

    _loadHotspotsForPath(path) {
        let hotspots = this.currentSceneId ? this.hotspotsData[this.currentSceneId] : null;
        if (!hotspots) hotspots = this.hotspotsData[path];
        if (!hotspots) {
            const key = Object.keys(this.hotspotsData).find(k =>
                (path && path.includes(k)) || (k && k.includes(path))
            );
            if (key) hotspots = this.hotspotsData[key];
        }

        if (hotspots) {
            console.log(`Loaded ${hotspots.length} hotspots for: ${path}`);
            const adapted = hotspots.map(h => ({
                ...h,
                type:  h.type  || 'arrow',
                label: h.target_name || h.label,
            }));
            this.hotspotManager.render(adapted);
        } else {
            console.log('No hotspots found for:', path);
            this.hotspotManager.clear();
        }
    }

    _syncCurrentHotspots() {
        const id = this.currentSceneId || this.currentPath;
        if (!id) return;
        const snap = this.hotspotManager.getSnapshotData(id);
        if (snap.length > 0) {
            this.hotspotsData[id] = snap;
            console.log(`[Sync] Saved ${snap.length} hotspots for: ${id}`);
        }
    }

    // Public wrappers used by AdminPanel
    getCurrentSceneHotspots() {
        const id = this.currentSceneId || this.currentPath;
        return id ? { sceneId: id, hotspots: this.hotspotManager.getSnapshotData(id) } : null;
    }

    getAllHotspotsData() {
        const current = this.getCurrentSceneHotspots();
        if (!current) return this.hotspotsData;
        return { ...this.hotspotsData, [current.sceneId]: current.hotspots };
    }

    addHotspot(yaw, pitch) { this.hotspotManager.addHotspot(yaw, pitch); }
    removeHotspot(data)     { this.hotspotManager.remove(data); }
    refreshHotspot(data)    { this.hotspotManager.refresh(data); }

    get isDraggingHotspot() { return this.hotspotManager?.isDragging ?? false; }

    // Proxy admin interaction handlers to HotspotManager
    handleAdminClick(intersects)       { return this.hotspotManager.handleAdminClick(intersects); }
    handleAdminRightClick(intersects)  { return this.hotspotManager.handleAdminRightClick(intersects); }
    handleAdminMouseDown(intersects)   { return this.hotspotManager.handleAdminMouseDown(intersects); }
    handleAdminMouseMove(raycaster)    { return this.hotspotManager.handleAdminMouseMove(raycaster); }
    handleAdminMouseUp()               { return this.hotspotManager.handleAdminMouseUp(); }

    setAdminMode(isActive) {
        this.isAdminMode = isActive;
        this.hotspotManager.isAdminMode = isActive;
        if (!isActive && this.hotspotManager.isDragging) {
            this.hotspotManager.isDragging = false;
            this.hotspotManager.draggedMesh = null;
        }
        console.log('Admin Mode:', isActive ? 'Enabled' : 'Disabled');
    }

    // ──────────────────────────────────────────────────────────────────────────
    // BACK BUTTON
    // ──────────────────────────────────────────────────────────────────────────

    createBackButton() {
        const geometry = new THREE.PlaneGeometry(0.4, 0.18);
        const canvas   = CanvasUI.createButtonTexture('BACK', { width: 400, height: 180, radius: 40, fontSize: 40 });
        const texture  = new THREE.CanvasTexture(canvas);
        const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide });

        this.backBtn = new THREE.Mesh(geometry, material);
        this.backBtn.position.set(0, -1.0, -1.6);
        this.backBtn.lookAt(0, 0.6, 0);
        this.backBtn.userData.isInteractable = true;
        this.backBtn.userData.originalScale  = new THREE.Vector3(1, 1, 1);
        this.backBtn.userData.targetScale    = new THREE.Vector3(1, 1, 1);
        this.backBtn.userData.animProgress   = 1;
        this.backBtn.userData.label          = 'Back Button';
        this.backBtn.userData.activationTime = 2.5;
        this.backBtn.onHoverIn  = () => this.backBtn.userData.targetScale.set(1.1, 1.1, 1.1);
        this.backBtn.onHoverOut = () => this.backBtn.userData.targetScale.copy(this.backBtn.userData.originalScale);
        this.backBtn.onClick    = () => { if (this.onBack) this.onBack(); };
        this.backBtn.visible    = false;
        this.controlDock.add(this.backBtn);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // AUDIO DOCK POSITION
    // ──────────────────────────────────────────────────────────────────────────

    setAudioButtonsPosition(mode, subLocationCount = 0, lastItemTheta = undefined) {
        if (mode === 'with-dock') {
            this.dockCenterOffset = 0.2;
            this.audioControls.setPosition(mode, { subLocationCount, lastItemTheta });
        } else {
            this.dockCenterOffset = 0;
            this.audioControls.setPosition(mode);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // LOADING INDICATOR
    // ──────────────────────────────────────────────────────────────────────────

    createLoadingIndicator() {
        this.loadingGroup = new THREE.Group();
        this.loadingGroup.visible = false;

        const bgGeo = new THREE.SphereGeometry(49, 32, 32);
        bgGeo.scale(-1, 1, 1);
        this.loadingBg = new THREE.Mesh(bgGeo, new THREE.MeshBasicMaterial({ color: 0x000000, opacity: 0.7, transparent: true }));
        this.loadingGroup.add(this.loadingBg);

        const spinCanvas = CanvasUI.createLoadingTexture();
        const spinTex    = new THREE.CanvasTexture(spinCanvas);
        this.loadingSpinner = new THREE.Mesh(
            new THREE.PlaneGeometry(0.5, 0.5),
            new THREE.MeshBasicMaterial({ map: spinTex, transparent: true, depthTest: false })
        );
        this.loadingSpinner.position.set(0, 0, -2);
        this.loadingSpinner.renderOrder = 1000;
        this.loadingGroup.add(this.loadingSpinner);

        const txtCanvas = CanvasUI.createLoadingTextTexture();
        const txtTex    = new THREE.CanvasTexture(txtCanvas);
        this.loadingText = new THREE.Mesh(
            new THREE.PlaneGeometry(0.5, 0.125),
            new THREE.MeshBasicMaterial({ map: txtTex, transparent: true, depthTest: false })
        );
        this.loadingText.position.set(0, -0.4, -2);
        this.loadingText.renderOrder = 1000;
        this.loadingGroup.add(this.loadingText);

        this.group.add(this.loadingGroup);
    }

    showLoading()   { this.isLoading = true;  if (this.loadingGroup) this.loadingGroup.visible = true;  }
    hideLoading()   { this.isLoading = false; if (this.loadingGroup) this.loadingGroup.visible = false; }

    updateLoadingSpinner() {
        if (!this.loadingGroup?.visible || !this.loadingSpinner) return;
        this.loadingSpinner.rotation.z -= 0.1;
    }

    updateLoadingPosition() {
        if (!this.loadingGroup?.visible || !this.camera) return;
        const dir = new THREE.Vector3();
        this.camera.getWorldDirection(dir);
        const target = Math.atan2(dir.x, dir.z) + Math.PI;
        let current  = this.loadingGroup.rotation.y;
        let diff     = target - current;
        while (diff >  Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        this.loadingGroup.rotation.y += diff * 0.15;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // FALLBACK TEXTURE (no panorama image)
    // ──────────────────────────────────────────────────────────────────────────

    loadFallbackTexture(name) {
        const canvas = document.createElement('canvas');
        canvas.width  = 4096;
        canvas.height = 2048;
        const ctx = canvas.getContext('2d');
        const w = canvas.width, h = canvas.height;

        ctx.fillStyle = '#111111';
        ctx.fillRect(0, 0, w, h);

        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke();
        ctx.beginPath();
        for (let i = 0; i < w; i += w / 4) { ctx.moveTo(i, 0); ctx.lineTo(i, h); }
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.beginPath();
        ctx.moveTo(0, 0);   ctx.lineTo(w, 0);
        ctx.moveTo(0, h);   ctx.lineTo(w, h);
        ctx.stroke();

        ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = 'bold 140px Roboto, sans-serif';
        ctx.fillText(name, w * 0.25, h / 2 - 150);

        if (this.currentLocation?.description) {
            ctx.font = '70px Roboto, sans-serif';
            ctx.fillStyle = '#888888';
            ctx.fillText(this.currentLocation.description, w * 0.25, h / 2 + 150);
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        this.basicMaterial.map = texture;
        this.basicMaterial.color.setScalar(this.panoramaBrightness);
        this.basicMaterial.needsUpdate = true;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // VR MODE
    // ──────────────────────────────────────────────────────────────────────────

    setVRMode(isVR) {
        this.isVR = isVR;
        this.panoramaBrightness = isVR ? 1.5 : 1.0;
        if (this.basicMaterial && this.basicMaterial.map !== null) {
            this.basicMaterial.color.setScalar(this.panoramaBrightness);
        }
        if (this.backBtn) {
            this.backBtn.visible = false; // Always hidden (menu-less design)
            // Lower the button in VR — narrower FOV (50°) and reference-space
            // differences mean the default -1.0 appears too high in the headset.
            this.backBtn.position.y = isVR ? -1.5 : -1.0;
        }
        if (!isVR && this.infoPanel3D) this.infoPanel3D.hide();
        if (this.subtitlePanel3D) this.subtitlePanel3D.setVRMode(isVR);
    }


    // ──────────────────────────────────────────────────────────────────────────
    // CONTROL DOCK FOLLOW
    // ──────────────────────────────────────────────────────────────────────────

    updateControlDockRotation() {
        if (!this.camera || !this.controlDock) return;
        const dir = new THREE.Vector3();
        this.camera.getWorldDirection(dir);
        const pitch = Math.asin(dir.y);
        const targetAngle = Math.atan2(dir.x, dir.z) + Math.PI + this.dockCenterOffset;
        const threshold   = CONFIG.controlDock?.lookDownThreshold ?? -0.45;
        if (pitch > threshold) {
            let diff = targetAngle - this.controlDock.rotation.y;
            while (diff >  Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            this.controlDock.rotation.y += diff * (CONFIG.controlDock?.followEaseSpeed ?? 0.08);
        }
    }

    resetControlDockRotation() {
        if (!this.camera || !this.controlDock) return;
        const v = new THREE.Vector3();
        this.camera.getWorldDirection(v);
        this.controlDock.rotation.y = Math.atan2(v.x, v.z) + Math.PI + this.dockCenterOffset;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // UPDATE LOOP
    // ──────────────────────────────────────────────────────────────────────────

    update(delta) {
        const animSpeed = 6;

        const animateObj = (obj) => {
            if (!obj?.userData?.targetScale) return;
            const diff = obj.scale.distanceTo(obj.userData.targetScale);
            if (diff > 0.01 && obj.userData.animProgress >= 1) {
                obj.userData.animProgress = 0;
                obj.userData.startScale   = obj.scale.clone();
            }
            if (obj.userData.animProgress < 1 && obj.userData.startScale) {
                obj.userData.animProgress = Math.min(1, obj.userData.animProgress + delta * animSpeed);
                const t = obj.userData.animProgress;
                const ease = t * t * (3 - 2 * t);
                obj.scale.lerpVectors(obj.userData.startScale, obj.userData.targetScale, ease);
            }
        };

        animateObj(this.backBtn);
        this.hotspotManager.currentHotspots.forEach(animateObj);

        this.updateLoadingSpinner();
        this.updateLoadingPosition();
        this.updateControlDockRotation();
        this.subtitlePanel3D?.update(delta);

        // ── Zoom/Travel Transition Logic ─────────────────────────────────────────────
        if (this.fadeState === 'fading_out') {
            // Zoom effect before scene change
            if (this.targetMovementVector) {
                this.movementProgress += delta * 4.0; // Sped up from 1.5 to 4.0 for instant feel
                const dist = 28; // Adjusted zoom distance as requested
                
                // Ease-in cubic for a smoother acceleration
                const t = Math.min(1, this.movementProgress);
                const easeIn = t * t * t;
                
                this.movementOffset.copy(this.targetMovementVector).multiplyScalar(dist * easeIn);
            }

            // Using fadeOpacity as a virtual timer for the transition
            this.fadeOpacity += delta * 4.0; 
            if (this.fadeOpacity >= 1) {
                this.fadeOpacity = 1;
                this.movementProgress = 1; // Cap movement progress for the reverse phase
                this.fadeState = 'loading';
                
                // Hold position until new scene is fully loaded
                this.hotspotManager.clear();
                
                if (this.onFadedOutCallback) {
                    this.onFadedOutCallback();
                    this.onFadedOutCallback = null;
                } else if (this.pendingPath) {
                    this._executeTextureLoad(this.pendingPath);
                }
                this.pendingPath = null;
            }
            // Mencegah layar menjadi gelap
            if (this.fadeMat) this.fadeMat.opacity = 0;
            
        } else if (this.fadeState === 'fading_in') {
            // Reverse the zoom effect to simulate arriving in the new room
            if (this.targetMovementVector) {
                this.movementProgress -= delta * 4.0; 
                if (this.movementProgress < 0) this.movementProgress = 0;
                
                const dist = 28; // Must match distance from fading_out
                const t = this.movementProgress;
                const easeOutReversed = t * t * t;
                
                this.movementOffset.copy(this.targetMovementVector).multiplyScalar(dist * easeOutReversed);

                if (this.movementProgress === 0) {
                    this.targetMovementVector = null;
                }
            }

            this.fadeOpacity -= delta * 4.0;
            if (this.fadeOpacity <= 0) {
                this.fadeOpacity = 0;
                this.fadeState = 'idle';
            }
            // Tetap pastikan layar tidak gelap
            if (this.fadeMat) this.fadeMat.opacity = 0;
        }

        // ── Sync to Camera ────────────────────────────────────────────────────
        // Sphere radius is 50 units — the camera is always inside regardless of small offsets.
        // We do NOT follow the XR camera position to avoid incorrect placement in the first XR frame
        // (XR camera world matrix may not be ready). Instead we rely on the large sphere radius.
        const camPos = new THREE.Vector3();
        if (this.camera) {
            this.camera.getWorldPosition(camPos);
        }

        // sceneOffset: only applies the travel-transition movement; sphere stays at group origin otherwise
        const sceneOffset = new THREE.Vector3();
        if (this.movementOffset) {
            // Subtract movementOffset so the scene shifts toward the camera (zoom-in effect)
            sceneOffset.sub(this.movementOffset);
        }

        if (this.sphere) {
            this.sphere.position.copy(sceneOffset);
            this.sphere.updateMatrix();
        }

        if (this.hotspotsGroup) {
            this.hotspotsGroup.position.copy(sceneOffset);
        }

        if (this.fadeMesh) {
            // Fade mesh stays near the camera (close-range overlay)
            const camOffset = camPos.clone().sub(this.group.position);
            this.fadeMesh.position.copy(camOffset);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // VISIBILITY
    // ──────────────────────────────────────────────────────────────────────────

    hide() {
        if (this.currentAudio) { this.currentAudio.pause(); this.currentAudio = null; }
        this.subtitlePanel3D?.clear();
        this.group.visible = false;
    }

    setBackButtonVisibility(_visible) {
        // Intentionally forced off — menu-less design
        if (this.backBtn) this.backBtn.visible = false;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // DISPOSE
    // ──────────────────────────────────────────────────────────────────────────

    dispose() {
        this.hotspotManager.dispose();
        this.texManager.dispose();

        if (this.sphere) {
            this.sphere.geometry.dispose();
            this.sphere.material.dispose();
        }
        if (this.backBtn) {
            this.backBtn.geometry.dispose();
            this.backBtn.material.map?.dispose();
            this.backBtn.material.dispose();
        }
        if (this.loadingGroup) {
            this.loadingGroup.traverse(child => {
                if (child.isMesh) {
                    child.geometry.dispose();
                    child.material.map?.dispose();
                    child.material.dispose();
                }
            });
        }
        if (this.group && this.scene) this.scene.remove(this.group);
    }
}

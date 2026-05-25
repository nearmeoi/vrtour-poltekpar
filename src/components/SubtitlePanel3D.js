import * as THREE from 'three';
import { CanvasUI } from '../utils/CanvasUI.js';

// 3D subtitle panel that follows the camera and shows timed cues from an audio track.
// Note: This file must exist in the repo; Vercel/Linux builds are case-sensitive.
export class SubtitlePanel3D {
  constructor(camera, scene) {
    this.camera = camera;
    this.scene = scene;

    this.group = new THREE.Group();
    this.scene.add(this.group);
    this.group.visible = false;

    this.audio = null;
    this.cues = [];
    this.currentCueIndex = -1;

    this.isVR = false;
    this.forceVisible = true;

    this.width = 1.55;
    this.height = 0.34;

    this.typewriterSpeed = 28; // chars/sec
    this.currentFullText = '';
    this.currentVisibleText = '';
    this.typeElapsed = 0;

    this._init();
  }

  _init() {
    const geometry = new THREE.PlaneGeometry(this.width, this.height);
    const material = new THREE.MeshBasicMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      depthTest: false,
      depthWrite: false
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.renderOrder = 10001;
    this.group.add(this.mesh);
  }

  setVRMode(isVR) {
    this.isVR = !!isVR;
    if (!this.isVR && !this.forceVisible) this.hide();
  }

  setTrack(audio, cues = []) {
    this.audio = audio || null;
    this.cues = Array.isArray(cues) ? cues : [];

    this.currentCueIndex = -1;
    this.currentFullText = '';
    this.currentVisibleText = '';
    this.typeElapsed = 0;

    this._renderText('');
    this.hide();
  }

  clear() {
    this.setTrack(null, []);
  }

  hide() {
    this.group.visible = false;
  }

  _getActiveCueIndex(time) {
    for (let i = 0; i < this.cues.length; i++) {
      const cue = this.cues[i];
      if (time >= cue.start && time <= cue.end) return i;
    }
    return -1;
  }

  _renderText(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    CanvasUI.roundRect(ctx, 18, 18, canvas.width - 36, canvas.height - 36, 36);
    ctx.fillStyle = 'rgba(8, 15, 28, 0.78)';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
    ctx.stroke();

    ctx.fillStyle = 'rgba(94, 234, 212, 0.95)';
    ctx.font = '700 28px Roboto, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('NARASI', 58, 36);

    ctx.fillStyle = '#ffffff';
    ctx.font = '500 42px Roboto, sans-serif';
    this._wrapText(ctx, text || '', 58, 86, canvas.width - 116, 52, 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;

    if (this.mesh.material.map) this.mesh.material.map.dispose();
    this.mesh.material.map = texture;
    this.mesh.material.needsUpdate = true;
  }

  _wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
    const words = text.split(/\s+/).filter(Boolean);
    const lines = [];
    let line = '';

    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      const width = ctx.measureText(testLine).width;
      if (width > maxWidth && line) {
        lines.push(line);
        line = word;
        if (lines.length === maxLines - 1) break;
      } else {
        line = testLine;
      }
    }

    if (line && lines.length < maxLines) lines.push(line);

    const consumed = lines.join(' ').trim();
    if (consumed.length < text.trim().length && lines.length > 0) {
      lines[lines.length - 1] = `${lines[lines.length - 1].replace(/[. ]+$/, '')}...`;
    }

    lines.forEach((entry, index) => {
      ctx.fillText(entry, x, y + index * lineHeight);
    });
  }

  update(delta = 0) {
    if ((!this.isVR && !this.forceVisible) || !this.audio || this.cues.length === 0) {
      this.hide();
      return;
    }

    const time = this.audio.currentTime || 0;
    const cueIndex = this._getActiveCueIndex(time);

    if (cueIndex === -1 || this.audio.paused || this.audio.ended) {
      this.currentCueIndex = -1;
      this.hide();
      return;
    }

    if (cueIndex !== this.currentCueIndex) {
      this.currentCueIndex = cueIndex;
      this.currentFullText = this.cues[cueIndex]?.text || '';
      this.currentVisibleText = '';
      this.typeElapsed = 0;
      this._renderText('');
    }

    this.typeElapsed += delta;
    if (this.currentVisibleText !== this.currentFullText) {
      const targetChars = Math.min(
        this.currentFullText.length,
        Math.floor(this.typeElapsed * this.typewriterSpeed)
      );
      const nextText = this.currentFullText.slice(0, targetChars);
      if (nextText !== this.currentVisibleText) {
        this.currentVisibleText = nextText;
        this._renderText(this.currentVisibleText);
      }
    }

    const offset = new THREE.Vector3(0, -0.5, -1.35);
    offset.applyQuaternion(this.camera.quaternion);
    this.group.position.copy(this.camera.position).add(offset);
    this.group.quaternion.copy(this.camera.quaternion);
    this.group.visible = true;
  }

  dispose() {
    if (this.mesh?.material?.map) this.mesh.material.map.dispose();
    this.mesh?.material?.dispose();
    this.mesh?.geometry?.dispose();
    if (this.group && this.scene) this.scene.remove(this.group);
  }
}


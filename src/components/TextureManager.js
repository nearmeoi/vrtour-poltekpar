import * as THREE from 'three';

/**
 * TextureManager
 * Handles all texture loading, caching, and background preloading
 * for the panorama viewer. Extracted from PanoramaViewer to reduce
 * class complexity and improve mobile performance.
 */
export class TextureManager {
    constructor() {
        this.loader = new THREE.TextureLoader();
        this.cache = new Map();       // path -> THREE.Texture
        this.pending = new Set();     // paths currently being loaded
    }

    /**
     * Normalize a file path into a safely URL-encoded string.
     * Replaces the old double-encoding hack with a clean approach.
     */
    _encodePath(path) {
        // Split on '/' and encode each segment separately to handle spaces etc.
        return path.split('/').map(segment => encodeURIComponent(segment)).join('/');
    }

    /**
     * Load a texture by path. Returns a Promise that resolves with
     * the THREE.Texture. Uses cache to avoid duplicate network requests.
     */
    load(path) {
        if (this.cache.has(path)) {
            return Promise.resolve(this.cache.get(path));
        }

        return new Promise((resolve, reject) => {
            const encoded = this._encodePath(path);
            this.loader.load(
                encoded,
                (texture) => {
                    texture.colorSpace = THREE.SRGBColorSpace;
                    texture.minFilter = THREE.LinearFilter; // Mobile: skip mipmap gen
                    this.cache.set(path, texture);
                    this.pending.delete(path);
                    resolve(texture);
                },
                undefined,
                (err) => {
                    this.pending.delete(path);
                    reject(err);
                }
            );
        });
    }

    /**
     * Preload an array of paths in the background without blocking.
     * Safe to call multiple times — already-cached or in-flight paths are skipped.
     */
    preload(paths) {
        paths.forEach(path => {
            if (!path || this.cache.has(path) || this.pending.has(path)) return;
            this.pending.add(path);
            this.load(path).catch(() => {}); // Swallow errors for background loads
        });
    }

    /**
     * Check if a path is already cached (instant availability).
     */
    has(path) {
        return this.cache.has(path);
    }

    /**
     * Evict a specific path from cache and dispose its GPU memory.
     */
    evict(path) {
        if (this.cache.has(path)) {
            this.cache.get(path).dispose();
            this.cache.delete(path);
        }
    }

    /**
     * Dispose all cached textures and free GPU memory.
     */
    dispose() {
        this.cache.forEach(texture => texture.dispose());
        this.cache.clear();
        this.pending.clear();
    }
}

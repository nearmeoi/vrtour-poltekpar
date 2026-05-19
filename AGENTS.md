# AGENTS.md - Panduan AI & Pengembang

File ini merupakan panduan dan konteks utama bagi AI Agent maupun pengembang manusia yang akan berinteraksi dengan repositori **WebVR Museum Virtual (v3)**.

## 🎯 Tujuan Proyek
Mengembangkan aplikasi Virtual Reality (VR) berbasis web yang interaktif, ringan, dan dioptimasi untuk perangkat mobile dan *headset* VR. Proyek ini menyajikan tur virtual imersif untuk destinasi seperti **Museum Kota Makassar**, **Museum La Galigo**, dan **Pantai Losari**.

## 🛠 Tech Stack
- **Library Utama**: [Three.js](https://threejs.org/) (R128+) untuk rendering grafis 3D.
- **VR Framework**: WebXR API (via `VRButton` dari Three.js).
- **Build Tool**: [Vite](https://vitejs.dev/) untuk *bundling* dan Hot Module Replacement (HMR).
- **UI Canvas**: Pembuatan UI 3D menggunakan modul *CanvasUI* bawaan.

## 🏗 Arsitektur Kode
Arsitektur proyek ini difokuskan pada modularitas dan performa, terutama dengan menghindari *god object* (seperti `PanoramaViewer` yang terlalu besar).

- **`main.js`**: Titik masuk aplikasi, menginisialisasi Vite, *environment*, dan `AdminPanel`.
- **`src/components/PanoramaViewer.js`**: Core Controller. Mengelola *scene* Three.js, kamera, *renderer*, raycaster (Gaze), dan status navigasi antar-panorama.
- **`src/components/HotspotManager.js`**: Menangani siklus hidup *hotspot* (pembuatan *mesh*, penempatan *label*, logika *drag-and-drop* untuk mode Admin).
- **`src/components/TextureManager.js`**: Modul utilitas untuk memuat (loading), melakukan *caching*, dan menangani tekstur *equirectangular* secara efisien di memori.
- **`src/components/OrbitalMenu.js`**: Sistem navigasi menu melengkung bergaya *glassmorphism* di dalam dunia VR (Snap-to-View).
- **`src/data/tourData.js`**: *Single Source of Truth* untuk data struktur tur (ID, nama, *path* aset, posisi *hotspot*).

## 🚀 Panduan Pengembangan & Refactoring
1. **Performa Pertama (Mobile-First)**:
   - Hindari membuat geometri yang terlalu padat. *SphereGeometry* menggunakan resolusi `48x24` (bukan `64x32`) untuk menghemat *vertex*.
   - Minimalisasi pembaruan matriks objek statis (`matrixAutoUpdate = false`).
   - Gunakan `requestAnimationFrame` dengan bijak; hindari komputasi berat di dalam *render loop*.
2. **Keamanan Aset & Bundling**:
   - Kode terkait `AdminPanel` hanya disertakan pada *development* mode menggunakan fitur *tree-shaking* (`import.meta.env.PROD`).
   - Aset gambar (*panorama*, *thumbnail*) harus dalam format teroptimasi (misal `.webp` atau `.jpg` kompresi tinggi).
3. **Pemisahan Tanggung Jawab (SoC)**:
   - Jangan menambahkan logika rendering ke `PanoramaViewer`. Gunakan Manajer terpisah (`HotspotManager`, `TextureManager`).

## 📜 Perintah Terminal
- `npm run dev` : Menjalankan *development server*.
- `npm run build` : Membangun versi produksi yang telah di-*minify* (termasuk *tree-shaking* kode admin).
- `npm run preview` : Meninjau hasil *build* produksi secara lokal.

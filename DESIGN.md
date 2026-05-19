# DESIGN.md - Sistem Desain & Panduan UX/UI

File ini mendokumentasikan filosofi desain, palet visual, dan pertimbangan *User Experience* (UX) untuk aplikasi **WebVR Museum Virtual**.

## 🎨 Filosofi Desain (Glassmorphism & Immersive)
Karena antarmuka aplikasi ini berada di dalam ruang 3D (Virtual Reality), desain UI harus terasa terintegrasi dengan dunia, bukan menutupi pandangan pengguna. Kami mengadopsi gaya **Glassmorphism Premium** yang memungkinkan pemandangan (panorama) tetap terlihat tembus pandang di balik elemen UI.

### Elemen Utama Glassmorphism:
- **Latar Belakang**: Tembus pandang parsial (`rgba(20, 20, 35, 0.6)`) dengan efek *Gradient Overlay*.
- **Pencahayaan (Glow)**: Bayangan terang memendar (`shadowColor: rgba(255, 255, 255, 1.0)`) untuk menegaskan *depth* dan memberikan kesan bercahaya pada elemen yang dapat diinteraksikan.
- **Tepi (Border)**: Garis tipis dan bersih untuk memperjelas kontras di berbagai latar belakang panorama.

## 📐 Tipografi
- **Font Primary**: `Roboto, sans-serif` (diberikan ketebalan *bold* pada judul dan *italic* pada sub-judul).
- **Teks Menu**: Dirender pada kanvas transparan (`CanvasTexture`) yang dipisah dari *background box* sehingga teks melayang secara independen di atas/di bawah panel, menghindari distorsi lengkungan.

## 🎮 Interaksi & Ergonomi VR (UX)
Desain untuk VR *Headset* dan perangkat *Mobile* memiliki batasan ergonomi. Panduan berikut wajib dipatuhi:

1. **Gaze Interaction (Pandangan Mata)**:
   - Karena pengguna VR seluler tidak selalu memiliki kontroler, interaksi dilakukan dengan *menatap* objek.
   - **Waktu Aktivasi (Activation Time)**: Ditetapkan ke **0.8 detik**. Ini adalah "titik manis" (sweet spot) yang tidak terlalu cepat (mencegah klik tidak sengaja) dan tidak terlalu lambat (mencegah kelelahan leher pengguna).
2. **Perilaku Menu (Snap-to-View)**:
   - Menu utama tidak boleh melayang dan mengikuti kepala pengguna secara terus-menerus (*drifting*), karena ini menyebabkan mual (*motion sickness*).
   - Menggunakan sistem **Snap-to-View**: Menu tetap diam saat pengguna melihat sekeliling. Namun, jika pengguna menoleh lebih dari sudut tertentu (misal >117 derajat dari menu), menu akan beranimasi (*snap*) kembali ke tengah pandangan.
3. **Hover Animation**:
   - Skala (*scale*) objek menu membesar secara halus (`lerp` menuju 1.15x) ketika di-*hover* oleh pandangan, memberikan *feedback* visual yang instan sebelum kursor memuat penuh aktivasi klik.

## 🖼 Tata Letak (Layout) Spasial
- **Hotspot (Titik Navigasi)**:
  - Berbentuk lingkaran ikon atau teks melayang, ditempatkan secara melingkar di koordinat koordinat (x, y, z) dunia nyata.
  - Skala hotspot menggunakan jarak yang terkontrol agar tidak terasa terlalu jauh atau terlalu dekat, menghindari *clipping* pada lensa kamera VR.
- **Orbital Menu**:
  - Item menu disusun menyebar dalam lengkungan busur (arc) silinder (`curveGeometry`) agar semua elemen berjarak sama dari mata pengguna (radius konstan).

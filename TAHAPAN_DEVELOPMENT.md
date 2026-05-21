# Tahapan Pengembangan Virtual Tour Poltekpar
## Penjelasan Developer ke Client/Dosen

---

## 📌 Pendahuluan

Ketika mengembangkan aplikasi web VR seperti Virtual Tour Poltekpar, ada beberapa tahapan yang harus dilalui. Setiap tahapan penting untuk memastikan aplikasi yang dihasilkan berkualitas, stabil, dan mudah dikembangkan di masa depan.

Dokumen ini menjelaskan tahapan-tahapan tersebut dari perspektif developer, sehingga Anda (sebagai client/dosen) memahami apa yang dilakukan dan mengapa hal tersebut penting.

---

## 🎯 Tahapan Utama Pengembangan

### **TAHAP 1: REQUIREMENTS & PLANNING (Perencanaan)**

**Apa yang dilakukan?**
- Mengidentifikasi kebutuhan aplikasi
- Menentukan fitur apa saja yang diperlukan
- Memahami target user (mahasiswa Poltekpar)
- Menentukan platform yang akan didukung (Android, iOS, Desktop)

**Deliverable:**
- Dokumen requirements (apa yang harus dibuat)
- Scope project (batasan apa yang akan dikerjakan)
- Timeline & resource planning

**Contoh untuk Virtual Tour:**
```
Requirements:
✓ Aplikasi harus bisa menampilkan panorama 360° museum
✓ User bisa navigasi antar ruangan dengan gaze (pandangan mata)
✓ Harus support Android dan iOS
✓ Harus bisa offline (tidak perlu internet terus-menerus)
✓ Harus ringan di HP biasa (tidak butuh HP gaming)
```

**Mengapa penting?**
- Menghindari miscommunication antara developer dan client
- Menentukan scope yang jelas (tidak ada "scope creep")
- Memudahkan estimasi waktu dan biaya

---

### **TAHAP 2: DESIGN & ARCHITECTURE (Desain)**

**Apa yang dilakukan?**
- Merancang arsitektur aplikasi (bagaimana komponen-komponen bekerja)
- Menentukan technology stack (tools & library yang digunakan)
- Merancang UI/UX (tampilan & pengalaman user)
- Membuat wireframe atau mockup

**Deliverable:**
- Architecture diagram (struktur aplikasi)
- Technology stack documentation
- UI/UX design (Figma, Adobe XD, atau sketsa)
- Database schema (jika ada)

**Contoh untuk Virtual Tour:**

**Technology Stack yang dipilih:**
```
Frontend:
- Three.js (library 3D graphics)
- WebXR API (untuk VR support)
- Vite (build tool modern)
- JavaScript ES6+

Platform Support:
- Android (native WebXR)
- iOS (WebXR Polyfill)
- Desktop (untuk development & testing)
```

**Architecture:**
```
┌─────────────────────────────────────┐
│         User Interface              │
│  (Landing Screen, Menu, Info Panel) │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Core Components                │
│  - PanoramaViewer (scene 3D)        │
│  - HotspotManager (interaksi)       │
│  - OrbitalMenu (navigasi)           │
│  - GazeController (input)           │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Utilities & Managers           │
│  - TextureManager (loading gambar)  │
│  - DeviceDetection (tipe perangkat) │
│  - AudioManager (narasi)            │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      External Libraries             │
│  - Three.js, WebXR, Vite           │
└─────────────────────────────────────┘
```

**Mengapa penting?**
- Menentukan arah development yang jelas
- Memudahkan kolaborasi tim (jika ada)
- Menghindari redesign di tengah jalan
- Memastikan teknologi yang dipilih sesuai kebutuhan

---

### **TAHAP 3: DEVELOPMENT / CODING (Pengembangan)**

**Apa yang dilakukan?**
- Menulis kode sesuai dengan design yang sudah dibuat
- Mengimplementasikan fitur-fitur yang direncanakan
- Testing selama development (unit testing)
- Version control (Git) untuk tracking perubahan

**Deliverable:**
- Source code yang terstruktur
- Git repository dengan commit history yang jelas
- Development build yang bisa dijalankan

**Proses Development untuk Virtual Tour:**

**1. Setup Project**
```bash
# Initialize project dengan Vite
npm create vite@latest webvr-v3 -- --template vanilla

# Install dependencies
npm install three webxr-polyfill webvr-polyfill

# Start development server
npm run dev
```

**2. Implementasi Core Components**
```javascript
// 1. Setup Three.js scene
- Buat renderer, camera, scene
- Setup lighting & background

// 2. Implement PanoramaViewer
- Load panorama image (equirectangular)
- Setup sphere geometry untuk 360° view
- Implement camera controls

// 3. Implement HotspotManager
- Create interactive hotspots
- Implement click detection (raycasting)
- Handle navigation antar ruangan

// 4. Implement OrbitalMenu
- Create menu items dalam bentuk orbit
- Implement snap-to-view behavior
- Add hover animations

// 5. Implement GazeController
- Detect user gaze direction
- Implement gaze-based interaction
- Add activation timer (0.8 detik)
```

**3. Cross-Platform Support**
```javascript
// Detect device type
- iOS? → Use WebXR Polyfill
- Android? → Use native WebXR
- Desktop? → Use mouse/keyboard controls

// Implement fallbacks
- WebXR not available? → Use Cardboard mode
- Gyroscope not available? → Use mouse controls
```

**4. Optimization**
```javascript
// Performance optimization
- Reduce sphere geometry resolution (48x24 instead of 64x32)
- Implement texture caching
- Lazy load images
- Minimize draw calls
```

**Mengapa penting?**
- Menghasilkan kode yang berfungsi
- Tracking perubahan dengan Git
- Memudahkan debugging
- Memastikan kualitas kode

---

### **TAHAP 4: TESTING (Pengujian)**

**Apa yang dilakukan?**
- Unit testing (test individual components)
- Integration testing (test komponen bekerja bersama)
- Manual testing (test di berbagai device)
- Performance testing (test kecepatan & memory usage)
- User acceptance testing (UAT) - test dengan user sebenarnya

**Deliverable:**
- Test report
- Bug list & fixes
- Performance metrics

**Testing untuk Virtual Tour:**

**1. Functional Testing**
```
✓ Panorama bisa di-load dengan benar
✓ Hotspot bisa di-klik
✓ Navigation antar ruangan berfungsi
✓ Menu bisa di-akses
✓ Audio narasi berjalan
✓ Back button berfungsi
```

**2. Cross-Platform Testing**
```
Device yang ditest:
✓ Android (Samsung, Xiaomi, Oppo, dll)
✓ iOS (iPhone 12, 13, 14, dll)
✓ Desktop (Chrome, Firefox, Safari)
✓ Cardboard mode (fallback)

Hasil yang diharapkan:
✓ Semua fitur berfungsi di semua platform
✓ Tidak ada crash atau error
✓ Performance acceptable (60 FPS)
```

**3. Performance Testing**
```
Metrics yang diukur:
- FPS (Frame Per Second) → Target: 60 FPS
- Memory usage → Target: < 200MB
- Loading time → Target: < 3 detik
- Battery drain → Target: < 10% per jam

Tools:
- Chrome DevTools (profiling)
- Android Profiler (untuk Android)
- Xcode Instruments (untuk iOS)
```

**4. User Acceptance Testing (UAT)**
```
Melibatkan:
- Mahasiswa Poltekpar (end user)
- Dosen/pengelola (stakeholder)

Feedback yang dikumpulkan:
- Apakah UI intuitif?
- Apakah performa memuaskan?
- Apakah ada bug atau error?
- Apakah sesuai dengan ekspektasi?
```

**Mengapa penting?**
- Memastikan aplikasi berfungsi dengan baik
- Menangkap bug sebelum production
- Memastikan user experience yang baik
- Validasi bahwa requirements terpenuhi

---

### **TAHAP 5: OPTIMIZATION & REFINEMENT (Optimasi)**

**Apa yang dilakukan?**
- Mengoptimalkan performa (speed, memory, battery)
- Mengoptimalkan ukuran file (bundle size)
- Mengoptimalkan UX berdasarkan feedback
- Code refactoring (membersihkan kode)

**Deliverable:**
- Optimized build
- Performance improvement report
- Refactored codebase

**Optimasi untuk Virtual Tour:**

**1. Performance Optimization**
```javascript
// Sebelum optimasi:
- Sphere geometry: 64x32 (2048 vertices)
- Bundle size: 850KB
- Loading time: 5 detik
- Memory usage: 250MB

// Sesudah optimasi:
- Sphere geometry: 48x24 (1152 vertices) ✓ 44% lebih ringan
- Bundle size: 580KB ✓ 32% lebih kecil
- Loading time: 2 detik ✓ 60% lebih cepat
- Memory usage: 180MB ✓ 28% lebih hemat
```

**2. Code Optimization**
```javascript
// Tree-shaking: Hapus kode yang tidak dipakai
- Admin panel hanya di development
- Unused imports dihapus
- Dead code elimination

// Minification: Kompres kode
- Variable names diperpendek
- Whitespace dihapus
- Comments dihapus (di production)

// Lazy loading: Load resource saat dibutuhkan
- Gambar di-load saat user navigasi ke ruangan
- Bukan semua gambar di-load di awal
```

**3. UX Refinement**
```
Berdasarkan feedback UAT:
- Ubah waktu aktivasi gaze dari 1 detik → 0.8 detik
- Tambah visual feedback saat hover
- Perbaiki menu positioning untuk VR
- Tambah loading indicator
```

**Mengapa penting?**
- Aplikasi lebih cepat & responsif
- Hemat kuota internet & battery user
- User experience lebih baik
- Kode lebih maintainable

---

### **TAHAP 6: DEPLOYMENT & RELEASE (Peluncuran)**

**Apa yang dilakukan?**
- Build production version
- Deploy ke server/hosting
- Setup CI/CD pipeline (optional)
- Create release notes
- Monitor aplikasi di production

**Deliverable:**
- Production build
- Deployed application (live URL)
- Release notes
- Deployment documentation

**Deployment untuk Virtual Tour:**

**1. Build Production**
```bash
# Build optimized version
npm run build

# Output:
# dist/
# ├── index.html (minified)
# ├── assets/
# │   ├── main.xxxxx.js (bundled & minified)
# │   ├── style.xxxxx.css (minified)
# │   └── images/ (compressed)
```

**2. Deploy ke Hosting**
```
Opsi hosting:
- Vercel (recommended untuk Vite)
- Netlify
- GitHub Pages
- AWS S3 + CloudFront
- Self-hosted server

Untuk Virtual Tour:
- Deploy ke Vercel (free tier)
- URL: https://webvr-poltekpar.vercel.app
- Auto-deploy dari Git (setiap push ke main)
```

**3. Setup CI/CD Pipeline (Optional)**
```yaml
# GitHub Actions example
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run build
      - run: npm run deploy
```

**4. Monitoring & Maintenance**
```
Monitoring:
- Uptime monitoring (aplikasi tetap online)
- Error tracking (Sentry, LogRocket)
- Performance monitoring (Lighthouse, WebVitals)
- User analytics (Google Analytics)

Maintenance:
- Fix bugs yang ditemukan user
- Update dependencies (security patches)
- Backup data
- Monitor server resources
```

**Mengapa penting?**
- Aplikasi bisa diakses oleh user
- Monitoring untuk mendeteksi masalah
- Maintenance untuk menjaga stabilitas
- Documentation untuk future reference

---

### **TAHAP 7: MAINTENANCE & SUPPORT (Pemeliharaan)**

**Apa yang dilakukan?**
- Monitor aplikasi di production
- Fix bugs yang ditemukan
- Update dependencies & security patches
- Add new features berdasarkan feedback
- Provide support ke user

**Deliverable:**
- Bug fixes & patches
- Feature updates
- Documentation updates
- Support tickets resolution

**Maintenance untuk Virtual Tour:**

**1. Bug Fixes**
```
Contoh bug yang mungkin ditemukan:
- Panorama tidak load di iOS tertentu
  → Fix: Update WebXR polyfill version
  
- Menu tidak snap dengan benar
  → Fix: Adjust snap threshold angle
  
- Audio narasi tidak sinkron
  → Fix: Implement audio buffering
```

**2. Feature Updates**
```
Berdasarkan feedback user:
- Tambah museum baru (Pantai Losari, dll)
- Tambah subtitle/teks untuk narasi
- Tambah bahasa (Indonesia, English, dll)
- Tambah analytics dashboard
```

**3. Security Updates**
```
Regular maintenance:
- Update Three.js ke versi terbaru
- Update WebXR polyfill
- Update Vite build tool
- Security audit kode
```

**4. Performance Monitoring**
```
Metrics yang dimonitor:
- Uptime: Target 99.9%
- Response time: Target < 200ms
- Error rate: Target < 0.1%
- User satisfaction: Target > 4.5/5
```

**Mengapa penting?**
- Aplikasi tetap stabil & aman
- User tetap puas
- Mudah menambah fitur baru
- Prevent security vulnerabilities

---

## 📊 Timeline Pengembangan

```
TAHAP 1: Requirements & Planning
├─ Analisis kebutuhan: 1 minggu
├─ Dokumentasi requirements: 1 minggu
└─ Approval dari client: 1 minggu
   Total: 3 minggu

TAHAP 2: Design & Architecture
├─ Design UI/UX: 2 minggu
├─ Architecture design: 1 minggu
├─ Technology selection: 1 minggu
└─ Design review & approval: 1 minggu
   Total: 5 minggu

TAHAP 3: Development / Coding
├─ Setup project & infrastructure: 1 minggu
├─ Core components development: 4 minggu
├─ Feature implementation: 3 minggu
├─ Integration & testing: 2 minggu
└─ Code review & refinement: 1 minggu
   Total: 11 minggu

TAHAP 4: Testing
├─ Unit testing: 1 minggu
├─ Integration testing: 1 minggu
├─ Cross-platform testing: 2 minggu
├─ Performance testing: 1 minggu
└─ UAT dengan user: 2 minggu
   Total: 7 minggu

TAHAP 5: Optimization & Refinement
├─ Performance optimization: 1 minggu
├─ Code refactoring: 1 minggu
├─ UX refinement: 1 minggu
└─ Final testing: 1 minggu
   Total: 4 minggu

TAHAP 6: Deployment & Release
├─ Production build: 1 minggu
├─ Deployment setup: 1 minggu
├─ Release notes & documentation: 1 minggu
└─ Launch & monitoring: 1 minggu
   Total: 4 minggu

TAHAP 7: Maintenance & Support
├─ Ongoing (continuous)
└─ 1-2 jam per minggu untuk maintenance
   Total: Ongoing

TOTAL TIMELINE: ~34 minggu (8 bulan) untuk development
+ Ongoing maintenance
```

---

## 🔄 Iterative Development (Agile Approach)

Dalam praktik modern, tahapan-tahapan di atas tidak selalu linear. Sering menggunakan **Agile methodology** dengan sprint 2-4 minggu:

```
Sprint 1 (2 minggu):
├─ Requirements gathering
├─ Design core architecture
└─ Start development core components

Sprint 2 (2 minggu):
├─ Continue development
├─ Start unit testing
└─ First internal testing

Sprint 3 (2 minggu):
├─ Feature completion
├─ Integration testing
└─ Performance optimization

Sprint 4 (2 minggu):
├─ UAT dengan user
├─ Bug fixes
└─ Refinement

Sprint 5 (2 minggu):
├─ Final testing
├─ Deployment preparation
└─ Release

Post-Release:
├─ Monitoring & support
├─ Bug fixes
└─ Feature updates (Sprint 6+)
```

**Keuntungan Agile:**
- Feedback lebih cepat dari user
- Bisa adjust requirements di tengah jalan
- Risk lebih kecil (tidak semua di-develop di akhir)
- Delivery lebih cepat (MVP bisa di-release lebih awal)

---

## 📋 Deliverable di Setiap Tahapan

| Tahapan | Deliverable |
|---------|------------|
| **1. Planning** | Requirements doc, scope, timeline |
| **2. Design** | Architecture diagram, UI mockup, tech stack doc |
| **3. Development** | Source code, Git repo, development build |
| **4. Testing** | Test report, bug list, performance metrics |
| **5. Optimization** | Optimized build, performance report |
| **6. Deployment** | Production build, live URL, release notes |
| **7. Maintenance** | Bug fixes, updates, support tickets |

---

## 💡 Mengapa Semua Tahapan Ini Penting?

**Jika skip tahapan:**

```
❌ Skip Planning
→ Miscommunication, scope creep, timeline meleset

❌ Skip Design
→ Kode berantakan, sulit di-maintain, redesign di tengah jalan

❌ Skip Testing
→ Banyak bug, user tidak puas, crash di production

❌ Skip Optimization
→ Aplikasi lemot, boros battery, user experience buruk

❌ Skip Deployment planning
→ Downtime, data loss, security issues

❌ Skip Maintenance
→ Aplikasi outdated, security vulnerabilities, user churn
```

**Dengan semua tahapan:**
```
✅ Aplikasi berkualitas tinggi
✅ User experience yang baik
✅ Mudah di-maintain & develop
✅ Sustainable untuk jangka panjang
✅ Scalable untuk fitur baru
```

---

## 🎯 Kesimpulan

Pengembangan Virtual Tour Poltekpar melibatkan **7 tahapan utama** yang saling terkait:

1. **Planning** - Tentukan apa yang mau dibuat
2. **Design** - Tentukan bagaimana cara membuatnya
3. **Development** - Buat aplikasinya
4. **Testing** - Pastikan berfungsi dengan baik
5. **Optimization** - Buat lebih cepat & efisien
6. **Deployment** - Luncurkan ke production
7. **Maintenance** - Jaga & kembangkan

Setiap tahapan penting dan tidak bisa di-skip. Dengan mengikuti semua tahapan ini, aplikasi yang dihasilkan akan **berkualitas, stabil, dan sustainable** untuk jangka panjang.

---

## 📞 Pertanyaan yang Sering Diajukan

**Q: Berapa lama development aplikasi ini?**
A: Sekitar 8 bulan untuk development penuh (dari planning sampai launch). Bisa lebih cepat jika menggunakan MVP approach (launch fitur core dulu, fitur lain kemudian).

**Q: Apakah bisa di-accelerate?**
A: Bisa, tapi dengan trade-off:
- Kurangi testing → Lebih banyak bug
- Kurangi optimization → Aplikasi lebih lemot
- Kurangi documentation → Sulit di-maintain

**Q: Siapa yang bertanggung jawab di setiap tahapan?**
A: 
- Planning: Developer + Client
- Design: Developer (dengan input Client)
- Development: Developer
- Testing: Developer + QA + Client (UAT)
- Optimization: Developer
- Deployment: Developer + DevOps
- Maintenance: Developer + Support team

**Q: Bagaimana jika ada perubahan requirement di tengah jalan?**
A: Bisa, tapi perlu:
- Assess impact (berapa lama, berapa biaya)
- Update timeline & budget
- Adjust sprint planning
- Communicate dengan team


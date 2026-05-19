
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');

// Data from tourData.js (LAGALIGO_SCENES)
const LAGALIGO_SCENES = [
  { "order": 1, "file": "01_Pintu Masuk.jpg", "title": "Pintu Masuk" },
  { "order": 2, "file": "02_Halaman Depan.jpg", "title": "Halaman Depan" },
  { "order": 3, "file": "03_Lobby Utama.jpg", "title": "Lobby Utama" },
  { "order": 4, "file": "04_Area Resepsi.jpg", "title": "Area Resepsi" },
  { "order": 5, "file": "05_Galeri Prasejarah.jpg", "title": "Galeri Prasejarah" },
  { "order": 6, "file": "06_Budaya Pedalaman Perkampungan 1.jpg", "title": "Budaya Pedalaman Perkampungan 1" },
  { "order": 7, "file": "07_Budaya Pedalaman Perkampungan 2.jpg", "title": "Budaya Pedalaman Perkampungan 2" },
  { "order": 8, "file": "08_Budaya Pedalaman Perkampungan 3.jpg", "title": "Budaya Pedalaman Perkampungan 3" },
  { "order": 9, "file": "09_Budaya Pedalaman Perkampungan 4.jpg", "title": "Budaya Pedalaman Perkampungan 4" },
  { "order": 10, "file": "10_Budaya Pedalaman Perkampungan 5.jpg", "title": "Budaya Pedalaman Perkampungan 5" },
  { "order": 11, "file": "11_Budaya Pedalaman Perkampungan 6.jpg", "title": "Budaya Pedalaman Perkampungan 6" },
  { "order": 12, "file": "12_Budaya Pedalaman Perkampungan 7.jpg", "title": "Budaya Pedalaman Perkampungan 7" },
  { "order": 13, "file": "13_Budaya Pedalaman Perkampungan 8.jpg", "title": "Budaya Pedalaman Perkampungan 8" },
  { "order": 14, "file": "14_Budaya Pedalaman Perkampungan 9.jpg", "title": "Budaya Pedalaman Perkampungan 9" },
  { "order": 15, "file": "15_Budaya Pedalaman Perkampungan 10.jpg", "title": "Budaya Pedalaman Perkampungan 10" },
  { "order": 16, "file": "16_Budaya Pedalaman Perkampungan 11.jpg", "title": "Budaya Pedalaman Perkampungan 11" },
  { "order": 17, "file": "17_Budaya Pedalaman Perkampungan 12.jpg", "title": "Budaya Pedalaman Perkampungan 12" },
  { "order": 18, "file": "18_Budaya Pedalaman Perkampungan 13.jpg", "title": "Budaya Pedalaman Perkampungan 13" },
  { "order": 19, "file": "19_Budaya Pedalaman Perkampungan 14.jpg", "title": "Budaya Pedalaman Perkampungan 14" },
  { "order": 20, "file": "20_Budaya Pedalaman Perkampungan 15.jpg", "title": "Budaya Pedalaman Perkampungan 15" },
  { "order": 21, "file": "21_Budaya Pedalaman Perkampungan 16.jpg", "title": "Budaya Pedalaman Perkampungan 16" },
  { "order": 22, "file": "22_Budaya Pedalaman Perkampungan 17.jpg", "title": "Budaya Pedalaman Perkampungan 17" },
  { "order": 23, "file": "23_Budaya Pedalaman Agraris 1.jpg", "title": "Budaya Pedalaman Agraris 1" },
  { "order": 24, "file": "24_Budaya Pedalaman Agraris 2.jpg", "title": "Budaya Pedalaman Agraris 2" },
  { "order": 25, "file": "25_Budaya Pedalaman Agraris 3.jpg", "title": "Budaya Pedalaman Agraris 3" },
  { "order": 26, "file": "26_Budaya Pedalaman Agraris 4.jpg", "title": "Budaya Pedalaman Agraris 4" },
  { "order": 27, "file": "27_Budaya Pedalaman Agraris 5.jpg", "title": "Budaya Pedalaman Agraris 5" },
  { "order": 28, "file": "28_Budaya Pedalaman Agraris 6.jpg", "title": "Budaya Pedalaman Agraris 6" },
  { "order": 29, "file": "29_Budaya Pedalaman Agraris 7.jpg", "title": "Budaya Pedalaman Agraris 7" },
  { "order": 30, "file": "30_Budaya Pedalaman Agraris 8.jpg", "title": "Budaya Pedalaman Agraris 8" },
  { "order": 31, "file": "31_Budaya Pedalaman Agraris 9.jpg", "title": "Budaya Pedalaman Agraris 9" },
  { "order": 32, "file": "32_Budaya Pedalaman Agraris 10.jpg", "title": "Budaya Pedalaman Agraris 10" },
  { "order": 33, "file": "33_Budaya Pedalaman Agraris 11.jpg", "title": "Budaya Pedalaman Agraris 11" },
  { "order": 34, "file": "34_Budaya Pedalaman Agraris 12.jpg", "title": "Budaya Pedalaman Agraris 12" },
  { "order": 35, "file": "35_Budaya Pedalaman Agraris 13.jpg", "title": "Budaya Pedalaman Agraris 13" },
  { "order": 36, "file": "36_Budaya Pedalaman Agraris 14.jpg", "title": "Budaya Pedalaman Agraris 14" },
  { "order": 37, "file": "37_Budaya Pedalaman Agraris 15.jpg", "title": "Budaya Pedalaman Agraris 15" },
  { "order": 38, "file": "38_Budaya Pedalaman Agraris 16.jpg", "title": "Budaya Pedalaman Agraris 16" },
  { "order": 39, "file": "39_Budaya Pesisir (Bahari) 1.jpg", "title": "Budaya Pesisir (Bahari) 1" },
  { "order": 40, "file": "40_Budaya Pesisir (Bahari) 2.jpg", "title": "Budaya Pesisir (Bahari) 2" },
  { "order": 41, "file": "41_Budaya Pesisir (Bahari) 3.jpg", "title": "Budaya Pesisir (Bahari) 3" },
  { "order": 42, "file": "42_Budaya Pesisir (Bahari) 4.jpg", "title": "Budaya Pesisir (Bahari) 4" },
  { "order": 43, "file": "43_Budaya Pesisir (Bahari) 5.jpg", "title": "Budaya Pesisir (Bahari) 5" },
  { "order": 44, "file": "44_Budaya Pesisir (Bahari) 6.jpg", "title": "Budaya Pesisir (Bahari) 6" },
  { "order": 45, "file": "45_Budaya Pesisir (Bahari) 7.jpg", "title": "Budaya Pesisir (Bahari) 7" },
  { "order": 46, "file": "46_Budaya Pesisir (Bahari) 8.jpg", "title": "Budaya Pesisir (Bahari) 8" },
  { "order": 47, "file": "47_Budaya Pesisir (Bahari) 9.jpg", "title": "Budaya Pesisir (Bahari) 9" },
  { "order": 48, "file": "48_Budaya Pesisir (Bahari) 10.jpg", "title": "Budaya Pesisir (Bahari) 10" },
  { "order": 49, "file": "49_Budaya Pesisir (Bahari) 11.jpg", "title": "Budaya Pesisir (Bahari) 11" },
  { "order": 50, "file": "50_Budaya Pesisir (Bahari) 12.jpg", "title": "Budaya Pesisir (Bahari) 12" },
  { "order": 51, "file": "51_Budaya Pesisir (Bahari) 13.jpg", "title": "Budaya Pesisir (Bahari) 13" },
  { "order": 52, "file": "52_Perkembangan Kota 1.jpg", "title": "Perkembangan Kota 1" },
  { "order": 53, "file": "53_Perkembangan Kota 2.jpg", "title": "Perkembangan Kota 2" },
  { "order": 54, "file": "54_Perkembangan Kota 3.jpg", "title": "Perkembangan Kota 3" },
  { "order": 55, "file": "55_Perkembangan Kota 4.jpg", "title": "Perkembangan Kota 4" },
  { "order": 56, "file": "56_Perkembangan Kota 5.jpg", "title": "Perkembangan Kota 5" },
  { "order": 57, "file": "57_Perkembangan Kota 6.jpg", "title": "Perkembangan Kota 6" },
  { "order": 58, "file": "58_Perkembangan Kota 7.jpg", "title": "Perkembangan Kota 7" },
  { "order": 59, "file": "59_Perkembangan Kota 8.jpg", "title": "Perkembangan Kota 8" },
  { "order": 60, "file": "60_Perkembangan Kota 9.jpg", "title": "Perkembangan Kota 9" },
  { "order": 61, "file": "61_Perkembangan Kota 10.jpg", "title": "Perkembangan Kota 10" },
  { "order": 62, "file": "62_Perkembangan Kota 11.jpg", "title": "Perkembangan Kota 11" },
  { "order": 63, "file": "63_Gedung P (Gereja Kuno) 1.jpg", "title": "Gedung P (Gereja Kuno) 1" },
  { "order": 64, "file": "64_Gedung P (Gereja Kuno) 2.jpg", "title": "Gedung P (Gereja Kuno) 2" },
  { "order": 65, "file": "65_Gedung P (Gereja Kuno) 3.jpg", "title": "Gedung P (Gereja Kuno) 3" },
  { "order": 66, "file": "66_Gedung P (Gereja Kuno) 4.jpg", "title": "Gedung P (Gereja Kuno) 4" },
  { "order": 67, "file": "67_Gedung P (Gereja Kuno) 5.jpg", "title": "Gedung P (Gereja Kuno) 5" },
  { "order": 68, "file": "68_Gedung P (Gereja Kuno) 6.jpg", "title": "Gedung P (Gereja Kuno) 6" },
  { "order": 69, "file": "69_Gedung P (Gereja Kuno) 7.jpg", "title": "Gedung P (Gereja Kuno) 7" },
  { "order": 70, "file": "70_Gedung P (Gereja Kuno) 8.jpg", "title": "Gedung P (Gereja Kuno) 8" },
  { "order": 71, "file": "71_Gedung P (Gereja Kuno) 9.jpg", "title": "Gedung P (Gereja Kuno) 9" },
  { "order": 72, "file": "72_Gedung P (Gereja Kuno) 10.jpg", "title": "Gedung P (Gereja Kuno) 10" },
  { "order": 73, "file": "73_Gedung P (Gereja Kuno) 11.jpg", "title": "Gedung P (Gereja Kuno) 11" },
  { "order": 74, "file": "74_Gedung P (Gereja Kuno) 12.jpg", "title": "Gedung P (Gereja Kuno) 12" },
  { "order": 75, "file": "75_Gedung P (Gereja Kuno) 13.jpg", "title": "Gedung P (Gereja Kuno) 13" },
  { "order": 76, "file": "76_Gedung P (Gereja Kuno) 14.jpg", "title": "Gedung P (Gereja Kuno) 14" },
  { "order": 77, "file": "77_Gedung P (Gereja Kuno) 15.jpg", "title": "Gedung P (Gereja Kuno) 15" },
  { "order": 78, "file": "78_Gedung P (Gereja Kuno) 16.jpg", "title": "Gedung P (Gereja Kuno) 16" },
  { "order": 79, "file": "79_Gedung P (Gereja Kuno) 17.jpg", "title": "Gedung P (Gereja Kuno) 17" },
  { "order": 80, "file": "80_Gedung P (Gereja Kuno) 18.jpg", "title": "Gedung P (Gereja Kuno) 18" },
  { "order": 81, "file": "81_Galeri Naskah Kuno.jpg", "title": "Galeri Naskah Kuno" },
  { "order": 82, "file": "82_Galeri Keramik.jpg", "title": "Galeri Keramik" },
  { "order": 83, "file": "83_Galeri Perunggu.jpg", "title": "Galeri Perunggu" },
  { "order": 84, "file": "84_Koridor Lantai 1.jpg", "title": "Koridor Lantai 1" },
  { "order": 85, "file": "85_Area Pameran Khusus.jpg", "title": "Area Pameran Khusus" },
  { "order": 86, "file": "86_Ruang Spesial.jpg", "title": "Ruang Spesial" }
];

async function fixLaGaligo() {
    const lagaligoDir = path.join(ROOT_DIR, 'public', 'assets', 'Museum La Galigo');
    console.log('--- Fixing La Galigo ---');
    
    LAGALIGO_SCENES.forEach(scene => {
        const oldName = scene.order === 1 ? '01_Pintu Masuk.jpg' : `${scene.order.toString().padStart(2, '0')}_Scene ${scene.order}.jpg`;
        const newName = scene.file;
        
        const oldPath = path.join(lagaligoDir, oldName);
        const newPath = path.join(lagaligoDir, newName);
        
        if (fs.existsSync(oldPath) && oldName !== newName) {
            console.log(`Renaming: ${oldName} -> ${newName}`);
            fs.renameSync(oldPath, newPath);
        } else if (!fs.existsSync(newPath)) {
            console.warn(`File missing: ${oldName} or ${newName}`);
        }
    });

    // Update sceneMap_lagaligo.js
    const mapPath = path.join(ROOT_DIR, 'src', 'data', 'sceneMap_lagaligo.js');
    let content = 'export const LAGALIGO_SCENE_MAP = {\n';
    LAGALIGO_SCENES.forEach((scene, i) => {
        const id = `lagaligo_${scene.order.toString().padStart(3, '0')}`;
        content += `  "${id}": {\n`;
        content += `    "path": "assets/Museum La Galigo/${scene.file}",\n`;
        content += `    "title": "[La Galigo] ${scene.title}",\n`;
        content += `    "order": ${scene.order}\n`;
        content += `  }${i === LAGALIGO_SCENES.length - 1 ? '' : ','}\n`;
    });
    content += '};\n';
    fs.writeFileSync(mapPath, content);
    console.log('✅ Updated sceneMap_lagaligo.js');
}

async function fixMuseumKota() {
    console.log('--- Fixing Museum Kota ---');
    
    // 1. Update TOUR_DATA starting point in tourData.js
    const tourDataPath = path.join(ROOT_DIR, 'src', 'data', 'tourData.js');
    let tourContent = fs.readFileSync(tourDataPath, 'utf8');
    
    // Change "Museum Kota/01_Scene 1.jpg" to "Museum Kota Makassar/030_Halaman Depan_E6D21F.jpg"
    tourContent = tourContent.replace(
        'panorama: \'assets/Museum Kota/01_Scene 1.jpg\'',
        'panorama: \'assets/Museum Kota Makassar/030_Halaman Depan_E6D21F.jpg\''
    );
    
    fs.writeFileSync(tourDataPath, tourContent);
    console.log('✅ Updated tourData.js start point for Museum Kota Makassar');

    // 2. Update sceneMap_museumkota.js to use the folder with descriptive names
    const mapPath = path.join(ROOT_DIR, 'src', 'data', 'sceneMap_museumkota.js');
    const kotaDir = path.join(ROOT_DIR, 'public', 'assets', 'Museum Kota Makassar');
    const files = fs.readdirSync(kotaDir).filter(f => f.endsWith('.jpg'));
    
    let content = '// Auto-generated from descriptive folder content\n';
    content += 'export const MUSEUMKOTA_SCENE_MAP = {\n';
    files.forEach((file, i) => {
        const id = `museumkota_${(i + 1).toString().padStart(3, '0')}`;
        // Extract title from filename (e.g. "030_Halaman Depan_E6D21F.jpg" -> "Halaman Depan")
        const parts = file.split('_');
        const title = parts.length > 1 ? parts[1] : file.replace('.jpg', '');
        
        content += `  "${id}": {\n`;
        content += `    "path": "assets/Museum Kota Makassar/${file}",\n`;
        content += `    "title": "[Museum Kota] ${title}",\n`;
        content += `    "order": ${i + 1}\n`;
        content += `  }${i === files.length - 1 ? '' : ','}\n`;
    });
    content += '};\n';
    fs.writeFileSync(mapPath, content);
    console.log('✅ Updated sceneMap_museumkota.js to use descriptive folder');
}

async function main() {
    await fixLaGaligo();
    await fixMuseumKota();
}

main().catch(console.error);

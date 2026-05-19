/**
 * compress_assets.js
 * Kompres semua JPG di public/assets ke ukuran web-ready
 * Menulis ke folder output terpisah (public/assets_compressed)
 * lalu me-replace folder asli untuk menghindari masalah file lock di Windows.
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = path.join(__dirname, '../public/assets');
const COMPRESSED_DIR = path.join(__dirname, '../public/assets_compressed');

const TARGET_FOLDERS = [
  'Museum Kota Makassar',
  'Museum Kota',
  'Museum La Galigo',
  'Pantai Losari',
  'Fort Rotterdam',
  'Losari Beach',
  'Malino',
  'Toraja',
];

const QUALITY_MAP = {
  'Museum Kota Makassar': 60,
  'Museum Kota': 65,
  default: 70,
};

let totalBefore = 0;
let totalAfter = 0;
let totalFiles = 0;
let errors = 0;

async function compressFolder(folderName) {
  const sourceFolderPath = path.join(ASSETS_DIR, folderName);
  const targetFolderPath = path.join(COMPRESSED_DIR, folderName);

  if (!fs.existsSync(sourceFolderPath)) {
    console.log(`  ⚠️  Skip (tidak ditemukan): ${folderName}`);
    return;
  }

  if (!fs.existsSync(targetFolderPath)) {
    fs.mkdirSync(targetFolderPath, { recursive: true });
  }

  const quality = QUALITY_MAP[folderName] ?? QUALITY_MAP.default;
  const files = fs.readdirSync(sourceFolderPath);

  console.log(`\n📁 ${folderName} (${files.length} file, quality: ${quality}%)`);

  for (const file of files) {
    const sourceFilePath = path.join(sourceFolderPath, file);
    const targetFilePath = path.join(targetFolderPath, file);
    const stat = fs.statSync(sourceFilePath);

    if (stat.isDirectory()) {
      continue;
    }

    const sizeBefore = stat.size;
    totalBefore += sizeBefore;

    if (/\.(jpg|jpeg|JPG|JPEG)$/i.test(file)) {
      try {
        const buffer = await sharp(sourceFilePath)
          .jpeg({ quality, mozjpeg: true, progressive: true })
          .toBuffer();

        fs.writeFileSync(targetFilePath, buffer);
        const sizeAfter = buffer.length;
        totalAfter += sizeAfter;
        totalFiles++;

        const reduction = Math.round((1 - sizeAfter / sizeBefore) * 100);
        const beforeKB = Math.round(sizeBefore / 1024);
        const afterKB = Math.round(sizeAfter / 1024);

        if (beforeKB > 800) {
          console.log(`  ✓ ${file.substring(0, 42).padEnd(42)} ${String(beforeKB).padStart(5)}KB → ${String(afterKB).padStart(5)}KB  (-${reduction}%)`);
        }
      } catch (err) {
        console.error(`  ✗ Error kompresi ${file}: ${err.message}`);
        // Fallback copy file asli jika gagal kompres
        fs.copyFileSync(sourceFilePath, targetFilePath);
        totalAfter += sizeBefore;
        errors++;
      }
    } else {
      // Copy langsung untuk file non-JPG (seperti PNG, DOCX, dll)
      fs.copyFileSync(sourceFilePath, targetFilePath);
      totalAfter += sizeBefore;
    }
  }
}

async function main() {
  console.log('🗜️  Kompresi Aset Virtual Tour (Out-of-place)');
  console.log('==============================================');
  console.log(`📂 Source : ${ASSETS_DIR}`);
  console.log(`📂 Target : ${COMPRESSED_DIR}\n`);

  if (!fs.existsSync(COMPRESSED_DIR)) {
    fs.mkdirSync(COMPRESSED_DIR, { recursive: true });
  }

  // Copy root files di public/assets (seperti hero-bg.png, thumb_*.jpg)
  const rootFiles = fs.readdirSync(ASSETS_DIR);
  for (const file of rootFiles) {
    const sourceFilePath = path.join(ASSETS_DIR, file);
    const targetFilePath = path.join(COMPRESSED_DIR, file);
    const stat = fs.statSync(sourceFilePath);
    if (!stat.isDirectory()) {
      fs.copyFileSync(sourceFilePath, targetFilePath);
    }
  }

  const startTime = Date.now();

  for (const folder of TARGET_FOLDERS) {
    await compressFolder(folder);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const beforeMB = (totalBefore / 1024 / 1024).toFixed(1);
  const afterMB  = (totalAfter  / 1024 / 1024).toFixed(1);
  const savedMB  = ((totalBefore - totalAfter) / 1024 / 1024).toFixed(1);
  const reduction = Math.round((1 - totalAfter / totalBefore) * 100);

  console.log('\n==============================================');
  console.log(`✅ Kompresi selesai dalam ${elapsed}s`);
  console.log(`📊 File diproses : ${totalFiles}`);
  if (errors > 0) console.log(`❌ Error kompresi: ${errors} file (di-copy langsung)`);
  console.log(`📦 Sebelum       : ${beforeMB} MB`);
  console.log(`📦 Sesudah       : ${afterMB} MB`);
  console.log(`💾 Hemat         : ${savedMB} MB (-${reduction}%)`);

  console.log('\n🔄 Mengganti folder assets lama dengan yang baru...');
  try {
    const backupDir = path.join(__dirname, '../public/assets_backup');
    if (fs.existsSync(backupDir)) {
      fs.rmSync(backupDir, { recursive: true, force: true });
    }
    fs.renameSync(ASSETS_DIR, backupDir);
    fs.renameSync(COMPRESSED_DIR, ASSETS_DIR);
    console.log('✅ Folder assets berhasil diganti! (Backup ada di public/assets_backup)');
    console.log('🚀 Hapus folder backup jika sudah yakin hasilnya bagus.');
  } catch (renameErr) {
    console.error('❌ Gagal mengganti folder assets secara otomatis:', renameErr.message);
    console.log('👉 Silakan hapus/rename manual folder public/assets, lalu rename public/assets_compressed menjadi public/assets.');
  }
}

main().catch(console.error);

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');

const COMPRESSION_CONFIG = {
  maxWidth: 4096,
  quality: 82,
  progressive: true,
};

async function processTour(inputDir, assetFolderName, prefix, titlePrefix) {
  const assetsDir = path.join(ROOT_DIR, 'public', 'assets', assetFolderName);
  const outputSceneMap = path.join(ROOT_DIR, 'src', 'data', `sceneMap_${prefix}.js`);

  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  console.log(`Reading files from: ${inputDir}`);
  const files = fs.readdirSync(inputDir)
    .filter(f => f.toLowerCase().endsWith('.jpg'))
    .sort();

  console.log(`Found ${files.length} files to process.`);

  const sceneMap = {};

  for (let i = 0; i < files.length; i++) {
    const originalFilename = files[i];
    const inputPath = path.join(inputDir, originalFilename);
    
    // New filename: 01_Scene 1.jpg
    const newFilename = `${(i + 1).toString().padStart(2, '0')}_Scene ${i + 1}.jpg`;
    const outputPath = path.join(assetsDir, newFilename);
    
    const sceneId = `${prefix}_${(i + 1).toString().padStart(3, '0')}`;
    
    console.log(`[${i + 1}/${files.length}] Processing ${originalFilename} -> ${newFilename}...`);
    
    try {
      const metadata = await sharp(inputPath).metadata();
      
      let pipeline = sharp(inputPath);
      if (metadata.width > COMPRESSION_CONFIG.maxWidth) {
        pipeline = pipeline.resize(COMPRESSION_CONFIG.maxWidth);
      }
      
      await pipeline
        .jpeg({ quality: COMPRESSION_CONFIG.quality, progressive: COMPRESSION_CONFIG.progressive })
        .toFile(outputPath);
        
      // Add to scene map
      sceneMap[sceneId] = {
        path: `assets/${assetFolderName}/${newFilename}`,
        title: i === 0 ? `${titlePrefix} Pintu Masuk` : `${titlePrefix} Scene ${i + 1}`,
        order: i + 1
      };
      
    } catch (err) {
      console.error(`Error processing ${originalFilename}:`, err);
    }
  }

  // Write scene map
  const content = `// Auto-generated from existing folder content\nexport const ${prefix.toUpperCase()}_SCENE_MAP = ${JSON.stringify(sceneMap, null, 2)};\n`;
  fs.writeFileSync(outputSceneMap, content);
  console.log(`Updated sceneMap_${prefix}.js`);
}

async function main() {
  await processTour(
    'E:\\\\VTD\\\\Museum Kota\\\\Media',
    'Museum Kota',
    'museumkota',
    '[Museum Kota]'
  );

  await processTour(
    'E:\\\\VTD\\\\Panlos\\\\Media',
    'Pantai Losari',
    'panlos',
    '[Pantai Losari]'
  );
}

main().catch(console.error);

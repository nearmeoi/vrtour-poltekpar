
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const ASSETS_DIR = path.join(ROOT_DIR, 'public', 'assets', 'Museum La Galigo');
const OUTPUT_SCENE_MAP = path.join(ROOT_DIR, 'src', 'data', 'sceneMap_lagaligo.js');

const COMPRESSION_CONFIG = {
  maxWidth: 4096,
  quality: 82,
  progressive: true,
};

async function process() {
  console.log('Reading files from:', ASSETS_DIR);
  const files = fs.readdirSync(ASSETS_DIR)
    .filter(f => f.toLowerCase().endsWith('.jpg') && f.startsWith('IMG_'))
    .sort();

  console.log(`Found ${files.length} files to process.`);

  const sceneMap = {};
  
  for (let i = 0; i < files.length; i++) {
    const filename = files[i];
    const inputPath = path.join(ASSETS_DIR, filename);
    const tempPath = path.join(ASSETS_DIR, `temp_${filename}`);
    
    const id = `lagaligo_${i + 1}`.padStart(11, '0').replace('lagaligo_00', 'lagaligo_'); // Ensure lagaligo_001 format
    // Wait, let's just use simple lagaligo_001, lagaligo_002...
    const sceneId = `lagaligo_${(i + 1).toString().padStart(3, '0')}`;
    
    console.log(`[${i + 1}/${files.length}] Processing ${filename}...`);
    
    try {
      const metadata = await sharp(inputPath).metadata();
      
      let pipeline = sharp(inputPath);
      if (metadata.width > COMPRESSION_CONFIG.maxWidth) {
        pipeline = pipeline.resize(COMPRESSION_CONFIG.maxWidth);
      }
      
      await pipeline
        .jpeg({ quality: COMPRESSION_CONFIG.quality, progressive: COMPRESSION_CONFIG.progressive })
        .toFile(tempPath);
        
      // Replace original with compressed
      fs.unlinkSync(inputPath);
      fs.renameSync(tempPath, inputPath);
      
      // Add to scene map
      sceneMap[sceneId] = {
        path: `assets/Museum La Galigo/${filename}`,
        title: i === 0 ? 'Pintu Masuk' : `Scene ${i + 1}`,
        order: i + 1
      };
      
    } catch (err) {
      console.error(`Error processing ${filename}:`, err);
    }
  }

  // Write scene map
  const content = `// Auto-generated from existing folder content
export const LAGALIGO_SCENE_MAP = ${JSON.stringify(sceneMap, null, 2)};
`;
  fs.writeFileSync(OUTPUT_SCENE_MAP, content);
  console.log('Updated sceneMap_lagaligo.js');
}

process();

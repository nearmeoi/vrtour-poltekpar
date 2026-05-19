
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const ASSETS_DIR = path.join(ROOT_DIR, 'public', 'assets', 'Museum La Galigo');
const SCENE_MAP_PATH = path.join(ROOT_DIR, 'src', 'data', 'sceneMap_lagaligo.js');
const LANDING_SCREEN_PATH = path.join(ROOT_DIR, 'src', 'components', 'LandingScreen.js');

async function fixNaming() {
  const { LAGALIGO_SCENE_MAP } = await import('../src/data/sceneMap_lagaligo.js');
  
  const newSceneMap = {};
  const entries = Object.entries(LAGALIGO_SCENE_MAP).sort((a, b) => a[1].order - b[1].order);

  for (const [id, data] of entries) {
    const oldPath = path.join(ROOT_DIR, 'public', data.path);
    const orderStr = data.order.toString().padStart(2, '0');
    // Use spaces, and clean up the title (remove [La Galigo] prefix for filename)
    const cleanTitle = data.title.replace('[La Galigo] ', '');
    const newFileName = `${orderStr}_${cleanTitle}.jpg`;
    const newPathRelative = `assets/Museum La Galigo/${newFileName}`;
    const newPathAbsolute = path.join(ASSETS_DIR, newFileName);

    if (fs.existsSync(oldPath)) {
      console.log(`Renaming ${data.path} -> ${newPathRelative}`);
      fs.renameSync(oldPath, newPathAbsolute);
      
      newSceneMap[id] = {
        ...data,
        path: newPathRelative,
        title: `[La Galigo] ${cleanTitle}`
      };
    } else {
      console.warn(`File not found: ${oldPath}`);
      newSceneMap[id] = data;
    }
  }

  // Write scene map
  const content = `// Fixed naming (spaces)
export const LAGALIGO_SCENE_MAP = ${JSON.stringify(newSceneMap, null, 2)};
`;
  fs.writeFileSync(SCENE_MAP_PATH, content);

  // Update LandingScreen.js start scene
  let landingContent = fs.readFileSync(LANDING_SCREEN_PATH, 'utf8');
  landingContent = landingContent.replace(
    /assets\/Museum La Galigo\/03_Lobby Utama\.jpg/g,
    'assets/Museum La Galigo/01_Pintu Masuk.jpg'
  );
  fs.writeFileSync(LANDING_SCREEN_PATH, landingContent);
  console.log('Updated LandingScreen.js to start at 01_Pintu Masuk.jpg');

  console.log('Fix complete.');
}

fixNaming();

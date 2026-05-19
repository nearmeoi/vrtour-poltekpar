
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const ASSETS_DIR = path.join(ROOT_DIR, 'public', 'assets', 'Museum La Galigo');
const SCENE_MAP_PATH = path.join(ROOT_DIR, 'src', 'data', 'sceneMap_lagaligo.js');

async function renameFiles() {
  const { LAGALIGO_SCENE_MAP } = await import('../src/data/sceneMap_lagaligo.js');
  
  const newSceneMap = {};
  const entries = Object.entries(LAGALIGO_SCENE_MAP).sort((a, b) => a[1].order - b[1].order);

  for (const [id, data] of entries) {
    const oldPath = path.join(ROOT_DIR, 'public', data.path);
    const orderStr = data.order.toString().padStart(2, '0');
    const newFileName = `${orderStr}_${data.title}.jpg`.replace(/ /g, '_');
    const newPathRelative = `assets/Museum La Galigo/${newFileName}`;
    const newPathAbsolute = path.join(ASSETS_DIR, newFileName);

    if (fs.existsSync(oldPath)) {
      console.log(`Renaming ${data.path} -> ${newPathRelative}`);
      fs.renameSync(oldPath, newPathAbsolute);
      
      newSceneMap[id] = {
        ...data,
        path: newPathRelative,
        title: `[La Galigo] ${data.title}`
      };
    } else {
      console.warn(`File not found: ${oldPath}`);
      newSceneMap[id] = data;
    }
  }

  const content = `// Auto-generated after renaming
export const LAGALIGO_SCENE_MAP = ${JSON.stringify(newSceneMap, null, 2)};
`;
  fs.writeFileSync(SCENE_MAP_PATH, content);
  console.log('Renaming complete and scene map updated.');
}

renameFiles();

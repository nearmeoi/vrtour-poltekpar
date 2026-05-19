
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const HOTSPOTS_PATH = path.join(ROOT_DIR, 'src', 'data', 'hotspots.json');

async function main() {
    const { PANLOS_SCENE_MAP } = await import('../src/data/sceneMap_panlos.js');
    
    const scenes = Object.values(PANLOS_SCENE_MAP).sort((a, b) => a.order - b.order);
    console.log(`Found ${scenes.length} scenes in Pantai Losari map.`);

    let hotspots = {};
    if (fs.existsSync(HOTSPOTS_PATH)) {
        hotspots = JSON.parse(fs.readFileSync(HOTSPOTS_PATH, 'utf8'));
    }

    scenes.forEach((scene, index) => {
        const currentPath = scene.path;
        if (!hotspots[currentPath]) hotspots[currentPath] = [];

        // Only add if empty to avoid overwriting
        if (hotspots[currentPath].length === 0) {
            if (index < scenes.length - 1) {
                const next = scenes[index + 1];
                hotspots[currentPath].push({
                    yaw: 0, pitch: -10,
                    target: next.path,
                    target_name: next.title.replace('[Pantai Losari] ', ''),
                    type: 'arrow',
                    label: `Lanjut ke: ${next.title.replace('[Pantai Losari] ', '')}`
                });
            }
            if (index > 0) {
                const prev = scenes[index - 1];
                hotspots[currentPath].push({
                    yaw: 180, pitch: -10,
                    target: prev.path,
                    target_name: prev.title.replace('[Pantai Losari] ', ''),
                    type: 'arrow',
                    label: `Kembali ke: ${prev.title.replace('[Pantai Losari] ', '')}`
                });
            }
        }
    });

    fs.writeFileSync(HOTSPOTS_PATH, JSON.stringify(hotspots, null, 2));
    console.log(`✅ Pantai Losari hotspots added to hotspots.json`);
}

main().catch(console.error);

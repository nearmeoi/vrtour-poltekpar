
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const HOTSPOTS_PATH = path.join(ROOT_DIR, 'src', 'data', 'hotspots.json');

async function main() {
    const { LAGALIGO_SCENE_MAP } = await import('../src/data/sceneMap_lagaligo.js');
    
    // Convert map to sorted array
    const scenes = Object.values(LAGALIGO_SCENE_MAP).sort((a, b) => a.order - b.order);
    console.log(`Found ${scenes.length} scenes in map.`);

    let hotspots = {};
    if (fs.existsSync(HOTSPOTS_PATH)) {
        hotspots = JSON.parse(fs.readFileSync(HOTSPOTS_PATH, 'utf8'));
    }

    // Process each scene
    scenes.forEach((scene, index) => {
        const currentPath = scene.path;
        
        // Initialize or keep existing
        if (!hotspots[currentPath]) {
            hotspots[currentPath] = [];
        }

        // Only add auto-hotspots if empty
        if (hotspots[currentPath].length === 0) {
            // Add Next
            if (index < scenes.length - 1) {
                const nextScene = scenes[index + 1];
                hotspots[currentPath].push({
                    yaw: 10,
                    pitch: -15,
                    target: nextScene.path,
                    target_name: nextScene.title.replace('[La Galigo] ', ''),
                    type: 'arrow',
                    label: `Lanjut: ${nextScene.title.replace('[La Galigo] ', '')}`
                });
            }

            // Add Previous
            if (index > 0) {
                const prevScene = scenes[index - 1];
                hotspots[currentPath].push({
                    yaw: 170,
                    pitch: -15,
                    target: prevScene.path,
                    target_name: prevScene.title.replace('[La Galigo] ', ''),
                    type: 'arrow',
                    label: `Kembali: ${prevScene.title.replace('[La Galigo] ', '')}`
                });
            }
        }
    });

    // Save
    fs.writeFileSync(HOTSPOTS_PATH, JSON.stringify(hotspots, null, 2));
    console.log(`✅ Hotspots updated using paths as keys.`);
}

main().catch(console.error);

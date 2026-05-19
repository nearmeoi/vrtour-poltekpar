
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HOTSPOTS_PATH = path.join(__dirname, '..', 'src', 'data', 'hotspots.json');
const SCENE_MAP_PATH = path.join(__dirname, '..', 'src', 'data', 'sceneMap_lagaligo.js');

async function main() {
    // 1. Read Scene Map
    const sceneMapContent = fs.readFileSync(SCENE_MAP_PATH, 'utf8');
    // Extract titles and keys using regex since it's an export file
    const scenes = [];
    const regex = /"(lagaligo_\d+)":\s*{[\s\S]*?"title":\s*"(.*?)"/g;
    let match;
    while ((match = regex.exec(sceneMapContent)) !== null) {
        scenes.push({ id: match[1], title: match[2] });
    }

    console.log(`Found ${scenes.length} scenes in map.`);

    // 2. Read existing hotspots
    let hotspots = {};
    if (fs.existsSync(HOTSPOTS_PATH)) {
        hotspots = JSON.parse(fs.readFileSync(HOTSPOTS_PATH, 'utf8'));
    }

    // 3. Generate Hotspots
    scenes.forEach((scene, index) => {
        const id = scene.id;
        
        // Ensure we don't overwrite existing hotspots for this scene if they exist
        if (!hotspots[id]) {
            hotspots[id] = [];
        }

        // Only add auto-hotspots if the scene has no hotspots yet (to avoid duplication on reruns)
        // Or if we want to force add them. Let's add them only if there are 0 hotspots.
        if (hotspots[id].length === 0) {
            // Add Next
            if (index < scenes.length - 1) {
                const nextScene = scenes[index + 1];
                hotspots[id].push({
                    yaw: 10,
                    pitch: -15,
                    target: nextScene.id,
                    target_name: nextScene.title,
                    type: 'arrow',
                    label: `Lanjut: ${nextScene.title}`
                });
            }

            // Add Previous
            if (index > 0) {
                const prevScene = scenes[index - 1];
                hotspots[id].push({
                    yaw: 170,
                    pitch: -15,
                    target: prevScene.id,
                    target_name: prevScene.title,
                    type: 'arrow',
                    label: `Kembali: ${prevScene.title}`
                });
            }
        }
    });

    // 4. Save
    fs.writeFileSync(HOTSPOTS_PATH, JSON.stringify(hotspots, null, 2));
    console.log(`✅ Hotspots updated in ${HOTSPOTS_PATH}`);
}

main().catch(console.error);

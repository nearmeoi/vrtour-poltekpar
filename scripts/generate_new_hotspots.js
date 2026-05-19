import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const HOTSPOTS_PATH = path.join(ROOT_DIR, 'src', 'data', 'hotspots.json');

async function main() {
    const { MUSEUMKOTA_SCENE_MAP } = await import('../src/data/sceneMap_museumkota.js');
    const { PANLOS_SCENE_MAP } = await import('../src/data/sceneMap_panlos.js');
    
    let hotspots = {};
    if (fs.existsSync(HOTSPOTS_PATH)) {
        hotspots = JSON.parse(fs.readFileSync(HOTSPOTS_PATH, 'utf8'));
    }

    // Process Museum Kota
    const museumKotaScenes = Object.values(MUSEUMKOTA_SCENE_MAP).sort((a, b) => a.order - b.order);
    const mkPrefix = 'museumkota';
    
    museumKotaScenes.forEach((scene, index) => {
        const sceneId = `${mkPrefix}_${(index + 1).toString().padStart(3, '0')}`;
        
        if (!hotspots[sceneId]) {
            hotspots[sceneId] = [];
        }
        
        // If empty, generate sequential links
        if (hotspots[sceneId].length === 0) {
            // Next scene
            if (index < museumKotaScenes.length - 1) {
                const nextId = `${mkPrefix}_${(index + 2).toString().padStart(3, '0')}`;
                hotspots[sceneId].push({
                    id: `${sceneId}_to_${nextId}`,
                    pitch: 0,
                    yaw: 15,
                    targetScene: nextId,
                    label: museumKotaScenes[index + 1].title
                });
            }
            // Prev scene
            if (index > 0) {
                const prevId = `${mkPrefix}_${(index).toString().padStart(3, '0')}`;
                hotspots[sceneId].push({
                    id: `${sceneId}_to_${prevId}`,
                    pitch: 0,
                    yaw: -15,
                    targetScene: prevId,
                    label: museumKotaScenes[index - 1].title
                });
            }
        }
    });

    // Process Pantai Losari
    const panlosScenes = Object.values(PANLOS_SCENE_MAP).sort((a, b) => a.order - b.order);
    const plPrefix = 'panlos';
    
    panlosScenes.forEach((scene, index) => {
        const sceneId = `${plPrefix}_${(index + 1).toString().padStart(3, '0')}`;
        
        if (!hotspots[sceneId]) {
            hotspots[sceneId] = [];
        }
        
        // If empty, generate sequential links
        if (hotspots[sceneId].length === 0) {
            // Next scene
            if (index < panlosScenes.length - 1) {
                const nextId = `${plPrefix}_${(index + 2).toString().padStart(3, '0')}`;
                hotspots[sceneId].push({
                    id: `${sceneId}_to_${nextId}`,
                    pitch: 0,
                    yaw: 15,
                    targetScene: nextId,
                    label: panlosScenes[index + 1].title
                });
            }
            // Prev scene
            if (index > 0) {
                const prevId = `${plPrefix}_${(index).toString().padStart(3, '0')}`;
                hotspots[sceneId].push({
                    id: `${sceneId}_to_${prevId}`,
                    pitch: 0,
                    yaw: -15,
                    targetScene: prevId,
                    label: panlosScenes[index - 1].title
                });
            }
        }
    });

    fs.writeFileSync(HOTSPOTS_PATH, JSON.stringify(hotspots, null, 2));
    console.log('Successfully updated hotspots.json with Museum Kota and Pantai Losari.');
}

main().catch(console.error);

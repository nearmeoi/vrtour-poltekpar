"""
Generate hotspots_lagaligo.json
- Setiap scene punya hotspot: Maju (next) dan Kembali (prev)
- Hotspot type "arrow" dengan posisi default (bisa disesuaikan manual)
- Narasi dikosongkan (diisi belakangan)
"""

import json, os, re

PUBLIC_PATH  = r"d:\02 MAGANG POLTEKPAR\pc GO\webvr-v3\public\assets\Museum La Galigo"
OUTPUT_JSON  = r"d:\02 MAGANG POLTEKPAR\pc GO\webvr-v3\src\data\hotspots_lagaligo.json"
ASSET_PREFIX = "assets/Museum La Galigo"

files = sorted([f for f in os.listdir(PUBLIC_PATH) if f.lower().endswith(".jpg")])
paths = [f"{ASSET_PREFIX}/{f}" for f in files]
N = len(paths)

hotspots = {}
for i, path in enumerate(paths):
    scene_hotspots = []

    # Hotspot MAJU (ke scene berikutnya)
    if i < N - 1:
        scene_hotspots.append({
            "yaw": 0.0,        # arah lurus depan
            "pitch": -10.0,    # sedikit ke bawah (eye-level)
            "target": paths[i + 1],
            "target_name": f"Maju",
            "type": "arrow",
            "label": "Maju"
        })

    # Hotspot KEMBALI (ke scene sebelumnya)
    if i > 0:
        scene_hotspots.append({
            "yaw": 180.0,      # belakang
            "pitch": -10.0,
            "target": paths[i - 1],
            "target_name": "Kembali",
            "type": "arrow",
            "label": "Kembali"
        })

    hotspots[path] = scene_hotspots

with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
    json.dump(hotspots, f, ensure_ascii=False, indent=2)

print(f"Generated hotspots for {N} scenes -> {OUTPUT_JSON}")
print(f"First scene:  {paths[0]}")
print(f"Last scene:   {paths[-1]}")
print(f"\nSample entry [{paths[2]}]:")
print(json.dumps(hotspots[paths[2]], ensure_ascii=False, indent=2))

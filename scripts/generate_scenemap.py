"""
Generate sceneMap_lagaligo.js dari file yang ADA di public/assets/Museum La Galigo/
Semua 90 file sudah dikompres dan siap pakai.
"""

import os, re

PUBLIC_PATH = r"d:\02 MAGANG POLTEKPAR\pc GO\webvr-v3\public\assets\Museum La Galigo"
OUTPUT_JS   = r"d:\02 MAGANG POLTEKPAR\pc GO\webvr-v3\src\data\sceneMap_lagaligo.js"
ASSET_PREFIX = "assets/Museum La Galigo"

# Ambil semua file jpg, urut
files = sorted([f for f in os.listdir(PUBLIC_PATH) if f.lower().endswith(".jpg")])

# Generate judul dari nama file (hapus nomor prefix & .jpg)
def make_title(filename):
    name = re.sub(r'^\d+_', '', filename)   # hapus "01_"
    name = re.sub(r'\.jpg$', '', name, flags=re.IGNORECASE)
    return name

lines = ["export const LAGALIGO_SCENE_MAP = {\n"]
for i, filename in enumerate(files):
    order = i + 1
    key   = f"lagaligo_{order:03d}"
    path  = f"{ASSET_PREFIX}/{filename}"
    title = f"[La Galigo] {make_title(filename)}"
    comma = "" if i == len(files) - 1 else ","
    lines += [
        f'  "{key}": {{\n',
        f'    "path": "{path}",\n',
        f'    "title": "{title}",\n',
        f'    "order": {order}\n',
        f'  }}{comma}\n',
    ]
lines.append("};\n")

with open(OUTPUT_JS, "w", encoding="utf-8") as f:
    f.writelines(lines)

print(f"Generated {len(files)} scenes -> {OUTPUT_JS}")
for i, f in enumerate(files, 1):
    print(f"  [{i:3d}] {f}")

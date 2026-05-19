import os, re

folders = {
    'lagaligo': r'E:\VTD\Lagaligo\Media',
    'museumkota': r'E:\VTD\Museum Kota\Media',
    'panlos': r'E:\VTD\Panlos\Media'
}

# Narasi mapping from document (file code -> scene name)
narasi_lagaligo = {
    '094': '01_Galeri Prasejarah',
    '096': '02_Budaya Pedalaman Perkampungan 1',
    '097': '03_Budaya Pedalaman Perkampungan 2',
    '098': '04_Budaya Pedalaman Perkampungan 3',
    '099': '05_Budaya Pedalaman Perkampungan 4',
    '101': '06_Budaya Pedalaman Perkampungan 5',
    '102': '07_Budaya Pedalaman Perkampungan 6',
    '103': '08_Budaya Pedalaman Perkampungan 7',
    '105': '09_Budaya Pedalaman Perkampungan 8',
    '106': '10_Perdagangan',
    '107': '11_Dapur Tradisional',
    '108': '12_Kelahiran (lanjutan)',
    '110': '13_Kelahiran',
    '112': '14_Upacara Khitanan',
    '116': '15_Alat Musik Tradisional',
    '125': '16_Arca Tipe Polinesia',
    '126': '17_Kerajaan Luwu',
    '127': '18_Zaman Budaya Islam',
    '128': '19_Zaman Kolonial',
    '129': '20_Kerajaan Gowa-Tallo',
    '130': '21_Kerajaan Bone',
    '132': '22_Budaya Pedalaman Agraris',
    '133': '23_Budaya Pedalaman Agraris 2',
    '134': '24_Peralatan Membajak',
    '135': '25_Peralatan Pemeliharaan Padi',
    '136': '26_Kepercayaan Tradisional',
    '137': '27_Lapi Patteke',
    '140': '28_Peralatan ke Ladang',
    '142': '29_Peralatan Pembuatan Kopra',
    '144': '30_Lesung Panjang',
    '145': '31_Peralatan Pembuatan Sagu',
    '146': '32_Miniatur Balla Assung',
    '147': '33_Ruangan Budaya Pesisir Bahari',
    '148': '34_Perahu Pinisi 1',
    '149': '34_Perahu Pinisi 2',
    '151': '35_Lepa-Lepa',
    '152': '36_Peralatan Berlayar',
    '153': '37_Bahan Pembuatan Perahu',
    '154': '38_Bagang Perahu',
    '156': '39_Peralatan Menangkap Ikan',
    '159': '40_Bagan Tancap',
    '160': '41_Pertumbuhan Kota 1',
    '161': '41_Pertumbuhan Kota 2',
    '162': '41_Pertumbuhan Kota 3',
    '163': '42_Bendi',
    '164': '43_Etnis Pendatang',
    '165': '44_Wattapone',
    '166': '45_Kota Palopo',
    '168': '46_Etnis Melayu',
    '169': '47_Peta Sulawesi Selatan',
    '170': '48_Pintu Keluar Gedung M',
}

for name, path in folders.items():
    files = sorted(os.listdir(path))
    print(f"\n{'='*60}")
    print(f"FOLDER: {name} ({path})")
    print(f"{'='*60}")
    print(f"Total files: {len(files)}")
    print(f"\nFile list with index number:")
    for i, f in enumerate(files, 1):
        m = re.search(r'_(\d{2})_(\d{3})', f)
        seq = m.group(2) if m else '???'
        hint = ''
        if name == 'lagaligo' and seq in narasi_lagaligo:
            hint = f'  -> {narasi_lagaligo[seq]}'
        print(f"  [{i:3d}] {f}{hint}")

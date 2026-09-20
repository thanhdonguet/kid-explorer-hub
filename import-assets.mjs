// Import the curated subset from the original Kenney archives in .asset-cache.
// Embed each palette so a model is one self-contained, offline-ready GLB.
import fs from 'node:fs';
import path from 'node:path';
const packs = {
  food: { folder: 'GLB format', files: ['apple', 'banana', 'orange', 'lemon', 'grapes', 'watermelon', 'pear', 'avocado', 'pineapple', 'tomato', 'carrot', 'bread', 'donut', 'ice-cream', 'cake', 'eggplant', 'egg', 'corn', 'strawberry', 'burger', 'cheese', 'mushroom'] },
  car: { folder: 'GLB format', files: ['ambulance', 'firetruck', 'garbage-truck', 'police', 'race', 'sedan', 'taxi', 'tractor', 'tractor-shovel', 'truck', 'van'] },
  nature: { folder: 'GLTF format', files: ['tree_palm', 'tree_palmBend', 'tree_oak', 'tree_pineRoundA', 'rock_largeA', 'flower_redA', 'mushroom_red', 'tent_smallOpen'] },
};
const out = 'www/img/models';
fs.mkdirSync(out, { recursive: true });
const manifest = {};
for (const [pack, spec] of Object.entries(packs)) {
  fs.copyFileSync(`.asset-cache/${pack}/License.txt`, `${out}/LICENSE-${pack}.txt`);
  for (const name of spec.files) {
    // Kenney spells the cut-open avocado file "advocado-half".
    const sourceName = pack === 'food' && name === 'avocado' ? 'advocado-half' : name;
    const source = `.asset-cache/${pack}/Models/${spec.folder}/${sourceName}.glb`;
    if (!fs.existsSync(source)) throw new Error(`Missing source: ${source}`);
    const original = fs.readFileSync(source);
    const jsonLength = original.readUInt32LE(12);
    const json = JSON.parse(original.subarray(20, 20 + jsonLength));
    for (const image of json.images || []) {
      if (image.uri && !image.uri.startsWith('data:')) {
        const bytes = fs.readFileSync(path.join(path.dirname(source), image.uri));
        image.uri = `data:image/png;base64,${bytes.toString('base64')}`;
      }
    }
    const raw = Buffer.from(JSON.stringify(json));
    const padded = Buffer.alloc(Math.ceil(raw.length / 4) * 4, 0x20);
    raw.copy(padded);
    const rest = original.subarray(20 + jsonLength);
    const header = Buffer.from(original.subarray(0, 20));
    header.writeUInt32LE(20 + padded.length + rest.length, 8);
    header.writeUInt32LE(padded.length, 12);
    const filename = `${pack}-${name}.glb`;
    fs.writeFileSync(`${out}/${filename}`, Buffer.concat([header, padded, rest]));
    manifest[name] = `img/models/${filename}`;
  }
}
fs.writeFileSync(`${out}/manifest.json`, JSON.stringify(manifest, null, 2) + '\n');
console.log(`Imported ${Object.keys(manifest).length} self-contained models.`);

import { build } from 'esbuild';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
await build({ entryPoints: ['www/js/explorer-3d.js'], outfile: 'www/js/explorer-3d.bundle.js', bundle: true, minify: true, format: 'iife', target: ['es2020'], legalComments: 'eof' });
// The static www directory remains the deploy artifact, including on Pages.
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(`${dir}/${e.name}`) : [`${dir}/${e.name}`]);
const files = walk('www').filter(p =>
  !p.endsWith('/sw.js') &&
  !p.endsWith('/asset-list.js') &&
  !p.endsWith('/explorer-3d.js') &&
  !p.includes('/audio/music/')
);
const hash = createHash('sha256');
files.forEach(file => { hash.update(file); hash.update(fs.readFileSync(file)); });
fs.writeFileSync('www/asset-list.js', `self.KID_ASSET_VERSION = '${hash.digest('hex').slice(0, 12)}';\nself.KID_ASSETS = ${JSON.stringify(files.map(p => p.slice(4)))};\n`);
console.log(`Built 3D runtime and offline manifest (${files.length} files).`);

// Writes dist/preview.html showing dist/skyline.svg at native width, at README width on GitHub dark, and at 2x.

import { readFile, writeFile } from 'node:fs/promises';
import { WIDTH } from '../src/config.js';

const svg = await readFile('dist/skyline.svg', 'utf8');
const src = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
const block = (label, width, bg) => `<h2>${label}</h2><div style="background:${bg};padding:16px;width:${width}px">`
  + `<img src="${src}" style="width:${width}px;display:block"></div>`;

await writeFile('dist/preview.html', `<!doctype html><meta charset="utf-8"><title>Skyline preview</title>
<body style="font-family:system-ui;background:#222;color:#ddd;margin:24px">
${block(`Native (${WIDTH}px)`, WIDTH, '#000')}
${block('README width on GitHub dark (840px)', 840, '#0d1117')}
${block('README width on GitHub light (840px)', 840, '#ffffff')}
${block('2x', WIDTH * 2, '#000')}
</body>`);
console.log('wrote dist/preview.html');

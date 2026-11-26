import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderSkyline } from '../src/svg.js';
import { parseCalendar } from '../src/fetch.js';
import { makeCalendarJson } from './helpers.mjs';
import { PALETTE } from '../src/config.js';

const cal = (opts) => parseCalendar(makeCalendarJson(opts));
const year = (count) => cal({ start: '2025-11-23', days: 369, count });
const mixed = year((i) => (i % 3 === 0 ? 0 : (i * 7) % 40));

test('same input gives a byte-identical svg', () => {
  assert.equal(renderSkyline(mixed, { user: 'octo' }), renderSkyline(mixed, { user: 'octo' }));
});

test('output is a self-contained svg with no script or links', () => {
  const svg = renderSkyline(mixed, { user: 'octo' });
  assert.match(svg, /^<svg[\s\S]*<\/svg>$/);
  assert.doesNotMatch(svg, /<script|href=|NaN|undefined/);
  assert.match(svg, /shape-rendering="crispEdges"/);
  assert.match(svg, /prefers-reduced-motion: no-preference/);
});

test('all-max year stays under 250 KB', () => {
  const svg = renderSkyline(year(() => 83), { user: 'octo' });
  assert.ok(Buffer.byteLength(svg) < 250_000, `${Buffer.byteLength(svg)} bytes`);
});

test('all-zero year: no lit windows, title says 0 contributions', () => {
  const svg = renderSkyline(year(() => 0), { user: 'octo' });
  assert.ok(!svg.includes(PALETTE.windowLit));
  assert.match(svg, /<title id="t">octo: 0 contributions in the last year<\/title>/);
  assert.doesNotMatch(svg, /NaN|undefined/);
});

test('partial first and last weeks render', () => {
  const svg = renderSkyline(cal({ start: '2025-11-27', days: 361, count: (i) => i % 5 }), { user: 'octo' });
  assert.match(svg, /<\/svg>$/);
});

test('user is XML-escaped in the title', () => {
  const svg = renderSkyline(mixed, { user: 'a<b&c' });
  assert.match(svg, /a&lt;b&amp;c/);
});

test('16 windows flicker when enough are lit', () => {
  const svg = renderSkyline(mixed, { user: 'octo' });
  assert.equal((svg.match(/class="flicker"/g) ?? []).length, 16);
});

/** Decodes the stroke paths of an SVG into a Map "x,y" → color. */
function staticPixels(svg) {
  const px = new Map();
  for (const [, color, d] of svg.matchAll(/<path stroke="([^"]+)" d="([^"]+)"\/>/g)) {
    let x = 0, y = 0;
    for (const [, cmd, a, b] of d.matchAll(/([Mmh])(-?[\d.]+)(?: (-?[\d.]+))?/g)) {
      if (cmd === 'M') { x = Number(a); y = Number(b) - 0.5; }
      else if (cmd === 'm') { x += Number(a); y += Number(b); }
      else { for (let i = 0; i < Number(a); i++) px.set(`${x + i},${y}`, color); x += Number(a); }
    }
  }
  return px;
}

const animated = (svg) => [...svg.matchAll(/<rect x="(\d+)" y="(\d+)"[^>]*fill="([^"]+)" class="(\w+)"/g)]
  .map(([, x, y, fill, cls]) => ({ x: Number(x), y: Number(y), fill, cls }));

test('flicker windows sit on visible lit windows and turn them off', () => {
  const svg = renderSkyline(mixed, { user: 'octo' });
  const px = staticPixels(svg);
  const flick = animated(svg).filter((a) => a.cls === 'flicker');
  assert.ok(flick.length > 0);
  for (const a of flick) {
    assert.equal(px.get(`${a.x},${a.y}`), PALETTE.windowLit, `flicker at ${a.x},${a.y}`);
    assert.equal(a.fill, PALETTE.windowOff);
  }
});

test('blinking lights and twinkling stars only sit on open sky', () => {
  for (const cal of [mixed, year(() => 83)]) {
    const svg = renderSkyline(cal, { user: 'octo' });
    const px = staticPixels(svg);
    for (const a of animated(svg).filter((r) => r.cls !== 'flicker')) {
      assert.ok(PALETTE.sky.includes(px.get(`${a.x},${a.y}`)), `${a.cls} at ${a.x},${a.y} over ${px.get(`${a.x},${a.y}`)}`);
    }
  }
});

test('flicker overlay is hidden unless animated, so reduced motion shows lit windows', () => {
  const svg = renderSkyline(mixed, { user: 'octo' });
  assert.match(svg, /\.flicker \{ opacity: 0 \}[\s\S]*@media \(prefers-reduced-motion: no-preference\)/);
});

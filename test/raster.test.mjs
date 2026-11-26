import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rasterize, animatedRects } from '../src/raster.js';

/** Interprets stroke path data (M/m moves, h runs on half-pixel rows) back into a Set of "x,y". */
function pixelsOf(d) {
  const set = new Set();
  let x = 0, y = 0;
  for (const [, cmd, a, b] of d.matchAll(/([Mmh])(-?[\d.]+)(?: (-?[\d.]+))?/g)) {
    if (cmd === 'M') { x = Number(a); y = Number(b); }
    else if (cmd === 'm') { x += Number(a); y += Number(b); }
    else { for (let i = 0; i < Number(a); i++) set.add(`${x + i},${y - 0.5}`); x += Number(a); }
  }
  return set;
}

test('a 3x2 op covers exactly its 6 pixels', () => {
  const paths = rasterize([{ x: 1, y: 2, w: 3, h: 2, color: '#fff' }], 10, 10);
  assert.deepEqual([...pixelsOf(paths.get('#fff'))].sort(), ['1,2', '1,3', '2,2', '2,3', '3,2', '3,3']);
});

test('a later overlapping op wins on shared pixels', () => {
  const paths = rasterize([
    { x: 0, y: 0, w: 4, h: 1, color: '#aaa' },
    { x: 2, y: 0, w: 1, h: 1, color: '#bbb' },
  ], 10, 10);
  assert.deepEqual([...pixelsOf(paths.get('#aaa'))].sort(), ['0,0', '1,0', '3,0']);
  assert.deepEqual([...pixelsOf(paths.get('#bbb'))], ['2,0']);
});

test('ops outside the canvas are clipped', () => {
  const paths = rasterize([{ x: -2, y: -1, w: 4, h: 3, color: '#ccc' }], 5, 5);
  const px = pixelsOf(paths.get('#ccc'));
  assert.deepEqual([...px].sort(), ['0,0', '0,1', '1,0', '1,1']);
  assert.doesNotMatch(paths.get('#ccc'), /^M-/);
});

test('ops with a class are left out of paths and emitted as rects', () => {
  const ops = [{ x: 1, y: 1, w: 1, h: 1, color: '#f00', cls: 'blink', delay: 0.5 }];
  assert.equal(rasterize(ops, 5, 5).size, 0);
  assert.equal(
    animatedRects(ops),
    '<rect x="1" y="1" width="1" height="1" fill="#f00" class="blink" style="animation-delay:0.5s"/>',
  );
});

test('rasterize does not mutate the ops', () => {
  const ops = [{ x: 0, y: 0, w: 2, h: 2, color: '#123' }];
  const before = structuredClone(ops);
  rasterize(ops, 4, 4);
  assert.deepEqual(ops, before);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { textOps, textWidth, hasGlyph } from '../src/font.js';

test('textWidth is 4 px per char minus the trailing gap', () => {
  assert.equal(textWidth('834'), 11);
});

test('glyph 1 draws its 7 pixels at the given origin', () => {
  const ops = textOps('1', 10, 20, '#fff');
  const px = ops.map((o) => `${o.x},${o.y}`).sort();
  assert.deepEqual(px, ['10,21', '11,20', '11,21', '11,22', '11,23', '10,24', '11,24', '12,24'].sort());
  assert.ok(ops.every((o) => o.w === 1 && o.h === 1 && o.color === '#fff'));
});

test('every character of the caption has a glyph', () => {
  for (const ch of '0123456789 CONTRIBUTIONS IN THE LAST YEAR') assert.ok(hasGlyph(ch), ch);
});

test('lowercase input is uppercased', () => {
  assert.deepEqual(textOps('year', 0, 0, '#fff'), textOps('YEAR', 0, 0, '#fff'));
});

test('unknown characters render as ?', () => {
  assert.deepEqual(textOps('@', 0, 0, '#fff'), textOps('?', 0, 0, '#fff'));
});

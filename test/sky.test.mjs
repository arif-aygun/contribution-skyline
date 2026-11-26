import { test } from 'node:test';
import assert from 'node:assert/strict';
import { skyOps } from '../src/sky.js';
import { WIDTH, HEIGHT, SKY_H, PALETTE, GROUND_Y } from '../src/config.js';

const ops = skyOps(WIDTH, HEIGHT);
const stars = ops.filter((o) => o.color === PALETTE.star);

test('sky is deterministic', () => {
  assert.deepEqual(skyOps(WIDTH, HEIGHT), ops);
});

test('70 stars, 24 of them twinkle', () => {
  assert.equal(stars.length, 70);
  assert.equal(stars.filter((o) => o.cls === 'twinkle').length, 24);
});

test('stars stay in the top SKY_H rows', () => {
  for (const s of stars) assert.ok(s.y < SKY_H, `${s.y}`);
});

test('moon lies inside the canvas', () => {
  for (const m of ops.filter((o) => o.color === PALETTE.moon)) {
    assert.ok(m.x >= 0 && m.y >= 0 && m.x + m.w <= WIDTH && m.y + m.h <= HEIGHT);
  }
  assert.ok(ops.some((o) => o.color === PALETTE.moon));
});

test('ground band covers from GROUND_Y to the bottom', () => {
  assert.ok(ops.some((o) => o.color === PALETTE.street && o.y === GROUND_Y && o.y + o.h === HEIGHT && o.w === WIDTH));
});

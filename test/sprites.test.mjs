import { test } from 'node:test';
import assert from 'node:assert/strict';
import { plotOps, flickerCandidates } from '../src/sprites.js';
import { PALETTE, GROUND_Y, WINDOW_COLS } from '../src/config.js';

const plot = (over) => ({
  date: '2026-03-03', count: 1, week: 10, weekday: 6, x: 164, baseY: GROUND_Y,
  kind: 'house', floors: 1, lit: 1, capacity: WINDOW_COLS, today: false, seed: '2026-03-03', ...over,
});
const litOps = (ops) => ops.filter((o) => o.color === PALETTE.windowLit);

test('the same plot always gives the same ops', () => {
  const p = plot({ kind: 'apartment', floors: 6, count: 7, lit: 7, capacity: 18 });
  assert.deepEqual(plotOps(p), plotOps(p));
});

test('a 14-floor tower with 83 contributions is fully lit with 42 windows', () => {
  const ops = plotOps(plot({ kind: 'tower', floors: 14, count: 83, lit: 42, capacity: 42 }));
  assert.equal(litOps(ops).length, 42);
});

test('an apartment with 5 lit gives exactly 5 lit windows', () => {
  const ops = plotOps(plot({ kind: 'apartment', floors: 5, count: 5, lit: 5, capacity: 15 }));
  assert.equal(litOps(ops).length, 5);
});

test('a park has trees and no lit windows', () => {
  const ops = plotOps(plot({ kind: 'park', floors: 0, count: 0, lit: 0, capacity: 0 }));
  assert.equal(litOps(ops).length, 0);
  assert.ok(ops.some((o) => o.color === PALETTE.canopy || o.color === PALETTE.canopyDark));
});

test('today gets a crane, even on a park', () => {
  const ops = plotOps(plot({ kind: 'park', floors: 0, count: 0, lit: 0, capacity: 0, today: true }));
  assert.ok(ops.some((o) => o.color === PALETTE.crane));
});

test('only towers have a blinking antenna light', () => {
  for (const kind of ['house', 'apartment', 'park', 'empty']) {
    const floors = kind === 'apartment' ? 5 : kind === 'house' ? 2 : 0;
    assert.ok(!plotOps(plot({ kind, floors, lit: 0 })).some((o) => o.cls === 'blink'), kind);
  }
  const tower = plotOps(plot({ kind: 'tower', floors: 10, lit: 3, capacity: 30 }));
  assert.equal(tower.filter((o) => o.cls === 'blink').length, 1);
});

test('no op extends below the plot baseline', () => {
  for (const kind of ['house', 'apartment', 'tower', 'park', 'empty']) {
    const ops = plotOps(plot({ kind, floors: kind === 'park' || kind === 'empty' ? 0 : 9, today: true }));
    for (const o of ops) assert.ok(o.y + o.h <= GROUND_Y, `${kind} ${JSON.stringify(o)}`);
  }
});

test('flickerCandidates returns the lit windows of all plots', () => {
  const plots = [
    plot({ kind: 'apartment', floors: 5, lit: 4, capacity: 15 }),
    plot({ kind: 'park', floors: 0, lit: 0, seed: 'p' }),
  ];
  assert.equal(flickerCandidates(plots).length, 4);
});

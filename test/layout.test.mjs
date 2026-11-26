import { test } from 'node:test';
import assert from 'node:assert/strict';
import { floorsFor, layoutCity, kindFor } from '../src/layout.js';
import { parseCalendar } from '../src/fetch.js';
import { makeCalendarJson } from './helpers.mjs';
import { MARGIN, GROUND_Y, BLOCK_W, DX, DY, WINDOW_COLS, WEEKS } from '../src/config.js';

const daysOf = (opts) => parseCalendar(makeCalendarJson(opts)).days;

test('floorsFor maps 0 to 0, max to 14, 1 to 1', () => {
  assert.equal(floorsFor(0, 83), 0);
  assert.equal(floorsFor(83, 83), 14);
  assert.equal(floorsFor(1, 83), 1);
});

test('floorsFor is monotonic from 1 to 83', () => {
  for (let c = 2; c <= 83; c++) assert.ok(floorsFor(c, 83) >= floorsFor(c - 1, 83), `at ${c}`);
});

test('floorsFor(1, 1) is 1 when every active day has one contribution', () => {
  assert.equal(floorsFor(1, 1), 1);
});

test('kindFor picks park, house, apartment and tower by floors', () => {
  assert.equal(kindFor(0), 'park');
  assert.equal(kindFor(1), 'house');
  assert.equal(kindFor(3), 'house');
  assert.equal(kindFor(4), 'apartment');
  assert.equal(kindFor(8), 'apartment');
  assert.equal(kindFor(9), 'tower');
});

test('capacity and lit follow floors and count', () => {
  const plots = layoutCity(daysOf({ start: '2026-01-04', days: 7, count: (i) => [0, 1, 5, 83, 2, 0, 40][i] }));
  for (const p of plots.filter((p) => p.kind !== 'empty')) {
    assert.equal(p.capacity, p.floors * WINDOW_COLS);
    assert.equal(p.lit, Math.min(p.count, p.capacity));
  }
});

test('only the last day is today', () => {
  const plots = layoutCity(daysOf({ start: '2026-01-04', days: 10, count: () => 1 }));
  const todays = plots.filter((p) => p.today);
  assert.equal(todays.length, 1);
  assert.equal(todays[0].date, '2026-01-13');
});

test('a first week starting on Wednesday gets empty plots Sun-Tue', () => {
  const plots = layoutCity(daysOf({ start: '2026-01-07', days: 10, count: () => 1 }));
  const week0 = plots.filter((p) => p.week === 0);
  assert.equal(week0.length, 7);
  assert.deepEqual(week0.filter((p) => p.kind === 'empty').map((p) => p.weekday), [0, 1, 2]);
});

test('positions follow the oblique projection', () => {
  const plots = layoutCity(daysOf({ start: '2026-01-04', days: 14, count: () => 1 }));
  const sat0 = plots.find((p) => p.week === 0 && p.weekday === 6);
  assert.equal(sat0.x, MARGIN);
  assert.equal(sat0.baseY, GROUND_Y);
  const sun1 = plots.find((p) => p.week === 1 && p.weekday === 0);
  assert.equal(sun1.x, MARGIN + BLOCK_W + 6 * DX);
  assert.equal(sun1.baseY, GROUND_Y - 6 * DY);
});

test('plots come in draw order: back rows first, then left to right', () => {
  const plots = layoutCity(daysOf({ start: '2026-01-04', days: 21, count: () => 1 }));
  const keys = plots.map((p) => p.weekday * 1000 + p.week);
  assert.deepEqual(keys, [...keys].sort((a, b) => a - b));
});

test('more than 53 weeks keeps only the newest 53', () => {
  const plots = layoutCity(daysOf({ start: '2025-11-08', days: 371 + 7, count: () => 1 }));
  const weeks = new Set(plots.map((p) => p.week));
  assert.equal(weeks.size, WEEKS);
  assert.ok(plots.some((p) => p.today));
});

test('does not mutate the input days', () => {
  const days = daysOf({ start: '2026-01-04', days: 7, count: () => 2 });
  const before = structuredClone(days);
  layoutCity(days);
  assert.deepEqual(days, before);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rng, int, pick } from '../src/prng.js';

const take = (r, n) => Array.from({ length: n }, () => r());

test('same seed gives the same sequence', () => {
  assert.deepEqual(take(rng('2026-01-01'), 5), take(rng('2026-01-01'), 5));
});

test('different seeds give different first values', () => {
  assert.notEqual(rng('2026-01-01')(), rng('2026-01-02')());
});

test('values stay in [0, 1)', () => {
  const r = rng('range');
  for (const v of take(r, 1000)) assert.ok(v >= 0 && v < 1, `${v}`);
});

test('int yields only values within inclusive bounds', () => {
  const r = rng('int');
  const seen = new Set(Array.from({ length: 300 }, () => int(r, 2, 4)));
  assert.deepEqual([...seen].sort(), [2, 3, 4]);
});

test('pick returns an element of the array', () => {
  const r = rng('pick');
  const arr = ['a', 'b', 'c'];
  for (let i = 0; i < 50; i++) assert.ok(arr.includes(pick(r, arr)));
});

test('shuffled returns a permutation and leaves the input untouched', async () => {
  const { shuffled } = await import('../src/prng.js');
  const input = [1, 2, 3, 4, 5];
  const out = shuffled(rng('s'), input);
  assert.deepEqual(input, [1, 2, 3, 4, 5]);
  assert.deepEqual([...out].sort(), [1, 2, 3, 4, 5]);
});

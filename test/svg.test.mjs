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

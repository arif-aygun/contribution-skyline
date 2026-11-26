import { test } from 'node:test';
import assert from 'node:assert/strict';
import { main } from '../scripts/render.mjs';
import { makeCalendarJson } from './helpers.mjs';

const json = makeCalendarJson({ start: '2026-01-04', days: 30, count: (i) => i % 4 });

function harness({ env = {}, argv = [], fetchImpl, readFile } = {}) {
  const logs = [];
  const writes = [];
  let fetched = 0;
  const deps = {
    env,
    argv,
    fetchImpl: fetchImpl ?? (async () => { fetched++; return { ok: true, status: 200, json: async () => json }; }),
    writeFile: async (path, data) => { writes.push({ path, data }); },
    mkdir: async () => {},
    readFile: readFile ?? (async () => JSON.stringify(json)),
    log: (m) => logs.push(m),
  };
  return { deps, logs, writes, fetched: () => fetched };
}

test('no token: exits 1 before any network call', async () => {
  const h = harness();
  assert.equal(await main(h.deps), 1);
  assert.equal(h.fetched(), 0);
  assert.ok(h.logs.some((l) => l.includes('No token: set SKYLINE_TOKEN (read:user PAT)')));
  assert.equal(h.writes.length, 0);
});

test('GITHUB_TOKEN only: warns that private contributions are missing', async () => {
  const h = harness({ env: { GITHUB_TOKEN: 't' } });
  assert.equal(await main(h.deps), 0);
  assert.ok(h.logs.some((l) => /private contributions/i.test(l)));
});

test('SKYLINE_TOKEN: writes dist/skyline.svg and logs totals', async () => {
  const h = harness({ env: { SKYLINE_TOKEN: 't', SKYLINE_USER: 'octo' } });
  assert.equal(await main(h.deps), 0);
  assert.equal(h.writes[0].path, 'dist/skyline.svg');
  assert.match(h.writes[0].data, /^<svg/);
  assert.ok(h.logs.some((l) => /total=\d+ restricted=\d+ days=30 bytes=\d+/.test(l)));
});

test('--fixture renders without a token or network', async () => {
  const h = harness({ argv: ['--fixture', 'fixtures/real.json'] });
  assert.equal(await main(h.deps), 0);
  assert.equal(h.fetched(), 0);
  assert.equal(h.writes[0].path, 'dist/skyline.svg');
});

test('fetch failure: exits 1 and writes nothing', async () => {
  const h = harness({ env: { SKYLINE_TOKEN: 't' }, fetchImpl: async () => { throw new Error('boom'); } });
  assert.equal(await main(h.deps), 1);
  assert.equal(h.writes.length, 0);
  assert.ok(h.logs.some((l) => l.includes('boom')));
});

// CLI: fetch the calendar (or read --fixture) and write dist/skyline.svg.

import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { fetchCalendar, parseCalendar } from '../src/fetch.js';
import { renderSkyline } from '../src/svg.js';

const OUT = 'dist/skyline.svg';
const DEFAULT_USER = 'arif-aygun';

async function loadCalendar({ env, argv, fetchImpl, readFile: read, log }) {
  const fixtureAt = argv.indexOf('--fixture');
  if (fixtureAt !== -1) return parseCalendar(JSON.parse(await read(argv[fixtureAt + 1], 'utf8')));
  const token = env.SKYLINE_TOKEN || env.GITHUB_TOKEN;
  if (!token) throw new Error('No token: set SKYLINE_TOKEN (read:user PAT)');
  if (!env.SKYLINE_TOKEN) {
    log('note: using GITHUB_TOKEN; private days are counted only if the "Private contributions" profile setting is on');
  }
  return fetchCalendar({ user: env.SKYLINE_USER || DEFAULT_USER, token, fetchImpl });
}

export async function main(deps) {
  const { env, writeFile: write, mkdir: mk, log } = deps;
  try {
    const calendar = await loadCalendar(deps);
    const svg = renderSkyline(calendar, { user: env.SKYLINE_USER || DEFAULT_USER });
    await mk('dist', { recursive: true });
    await write(OUT, svg);
    log(`total=${calendar.total} restricted=${calendar.restricted} days=${calendar.days.length} bytes=${Buffer.byteLength(svg)}`);
    return 0;
  } catch (err) {
    log(`error: ${err.message}`);
    return 1;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const code = await main({
    env: process.env, argv: process.argv.slice(2), fetchImpl: fetch,
    writeFile, mkdir, readFile, log: (m) => console.log(m),
  });
  process.exitCode = code;
}

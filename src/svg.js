// Composes the final SVG: sky → plots (back to front) → caption → animated overlays.

import { WIDTH, HEIGHT, MARGIN, GROUND_Y, PALETTE } from './config.js';
import { layoutCity } from './layout.js';
import { plotOps, flickerCandidates } from './sprites.js';
import { skyOps } from './sky.js';
import { textOps } from './font.js';
import { rasterize, animatedRects } from './raster.js';
import { rng, shuffled, int } from './prng.js';

const FLICKERING = 16;

const STYLE = `@media (prefers-reduced-motion: no-preference) {
  .twinkle { animation: tw 3s steps(1) infinite; }
  .flicker { animation: fl 7s steps(1) infinite; }
  .blink   { animation: bl 2s steps(1) infinite; }
  @keyframes tw { 0%,100% { opacity: 1 } 50% { opacity: .25 } }
  @keyframes fl { 0%,85% { opacity: 1 } 86%,100% { opacity: 0 } }
  @keyframes bl { 0%,60% { opacity: 1 } 61%,100% { opacity: .15 } }
}`;

const escapeXml = (s) => String(s).replace(/[<>&"']/g, (c) => (
  { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]
));

const plural = (n) => `${n} contribution${n === 1 ? '' : 's'}`;

function flickerOps(plots) {
  const r = rng('flicker');
  return shuffled(r, flickerCandidates(plots))
    .slice(0, FLICKERING)
    .map((o) => ({ ...o, cls: 'flicker', delay: int(r, 0, 60) / 10 }));
}

export function renderSkyline({ total, days }, { user }) {
  const plots = layoutCity(days);
  const caption = `${plural(total)} in the last year`;
  const ops = [
    ...skyOps(WIDTH, HEIGHT),
    ...plots.flatMap(plotOps),
    ...textOps(caption, MARGIN, GROUND_Y + 8, PALETTE.text),
    ...flickerOps(plots),
  ];
  const paths = [...rasterize(ops, WIDTH, HEIGHT)]
    .map(([color, d]) => `<path stroke="${color}" d="${d}"/>`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="100%" `
    + `fill="none" stroke-width="1" shape-rendering="crispEdges" role="img" aria-labelledby="t">`
    + `<title id="t">${escapeXml(user)}: ${caption}</title><style>${STYLE}</style>`
    + `${paths}${animatedRects(ops)}</svg>`;
}

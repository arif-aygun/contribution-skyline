// Plot → pixel ops. Each sprite stands on a 2px ground tile ending at plot.baseY.

import { PALETTE, PLOT_W, DX, DY, FLOOR_H, WINDOW_XS } from './config.js';
import { rng, int, pick, shuffled } from './prng.js';

const rect = (x, y, w, h, color, extra = {}) => ({ x, y, w, h, color, ...extra });

function groundTile(p, color) {
  return [rect(p.x, p.baseY - DY, PLOT_W + DX, DY, color)];
}

/** Top y of the building body (the first wall row of the highest floor). */
const bodyTop = (p) => p.baseY - DY - p.floors * FLOOR_H;

function windows(p) {
  const top = bodyTop(p);
  const slots = Array.from({ length: p.floors }, (_, f) => WINDOW_XS.map((wx) => [p.x + wx, top + f * FLOOR_H + 1])).flat();
  const litSet = new Set(shuffled(rng(`${p.seed}:windows`), slots.map((_, i) => i)).slice(0, p.lit));
  return slots.map(([x, y], i) => rect(x, y, 1, 1, litSet.has(i) ? PALETTE.windowLit : PALETTE.windowOff));
}

function body(p, tints) {
  const r = rng(`${p.seed}:tint`);
  return [rect(p.x, bodyTop(p), PLOT_W, p.floors * FLOOR_H, pick(r, tints)), ...windows(p)];
}

function house(p) {
  const roof = pick(rng(`${p.seed}:roof`), PALETTE.roof);
  const top = bodyTop(p);
  const rows = [0, 1, 2, 3, 4].map((i) => rect(p.x + i, top - 1 - i, PLOT_W - 2 * i, 1, roof));
  return [...groundTile(p, PALETTE.ground), ...body(p, PALETTE.house), ...rows];
}

function apartment(p) {
  const r = rng(`${p.seed}:roof`);
  const top = bodyTop(p);
  const tank = r() < 0.4 ? [rect(p.x + int(r, 1, 5), top - 3, 3, 2, PALETTE.antenna)] : [];
  return [...groundTile(p, PALETTE.ground), ...body(p, PALETTE.apartment),
    rect(p.x, top - 1, PLOT_W, 1, PALETTE.antenna), ...tank];
}

function tower(p) {
  const top = bodyTop(p);
  const ax = p.x + 4;
  const delay = int(rng(`${p.seed}:blink`), 0, 19) / 10;
  return [...groundTile(p, PALETTE.ground), ...body(p, PALETTE.tower),
    rect(p.x + 1, top - 1, PLOT_W - 2, 1, PALETTE.antenna),
    rect(ax, top - 4, 1, 3, PALETTE.antenna),
    rect(ax, top - 5, 1, 1, PALETTE.antennaLight, { cls: 'blink', delay })];
}

function tree(x, baseY, r) {
  const canopy = pick(r, [PALETTE.canopy, PALETTE.canopyDark]);
  const h = int(r, 1, 2);
  return [rect(x + 1, baseY - DY - h, 1, h, PALETTE.trunk), rect(x, baseY - DY - h - 3, 3, 3, canopy)];
}

function extra(p, r) {
  const roll = r();
  const g = p.baseY - DY;
  if (roll < 0.25) return [rect(p.x + 5, g - 1, 3, 1, PALETTE.bench)];
  if (roll < 0.45) return [rect(p.x + 7, g - 5, 1, 5, PALETTE.lampPost), rect(p.x + 6, g - 6, 2, 1, PALETTE.lampLight)];
  return [];
}

function park(p) {
  const r = rng(`${p.seed}:park`);
  const trees = r() < 0.5 ? [tree(p.x + int(r, 0, 6), p.baseY, r)] : [tree(p.x, p.baseY, r), tree(p.x + 5, p.baseY, r)];
  return [...groundTile(p, PALETTE.grass), ...trees.flat(), ...extra(p, r)];
}

function crane(p) {
  const top = p.floors > 0 ? bodyTop(p) - 6 : p.baseY - DY - 14;
  const mx = p.x + PLOT_W - 2;
  return [
    rect(mx, top, 1, p.baseY - DY - top, PALETTE.crane),
    rect(mx - 7, top, 10, 1, PALETTE.crane),
    rect(mx - 6, top + 1, 1, 3, PALETTE.antenna),
  ];
}

const SPRITES = { house, apartment, tower, park, empty: (p) => groundTile(p, PALETTE.ground) };

export function plotOps(p) {
  const ops = SPRITES[p.kind](p);
  return p.today ? [...ops, ...crane(p)] : ops;
}

export function flickerCandidates(plots) {
  return plots.flatMap(plotOps).filter((o) => o.color === PALETTE.windowLit);
}

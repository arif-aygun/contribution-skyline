// Night sky: banded gradient, seeded stars (some twinkle), a pixel moon and the ground band.

import { PALETTE, SKY_H, GROUND_Y } from './config.js';
import { rng, int } from './prng.js';

const STARS = 70;
const TWINKLING = 24;
const MOON = ['..###..', '.####..', '###....', '###....', '###....', '.####..', '..###..'];

function bands(width) {
  const n = PALETTE.sky.length;
  const h = Math.ceil(GROUND_Y / n);
  return PALETTE.sky.map((color, i) => ({ x: 0, y: i * h, w: width, h: Math.min(h, GROUND_Y - i * h), color }));
}

function stars(width) {
  const r = rng('stars');
  return Array.from({ length: STARS }, (_, i) => {
    const star = { x: int(r, 0, width - 1), y: int(r, 0, SKY_H - 1), w: 1, h: 1, color: PALETTE.star };
    return i < TWINKLING ? { ...star, cls: 'twinkle', delay: int(r, 0, 40) / 10 } : star;
  });
}

function moon(width) {
  const ox = width - 40;
  const oy = 8;
  return MOON.flatMap((row, y) => [...row].flatMap((p, x) => (
    p === '#' ? [{ x: ox + x, y: oy + y, w: 1, h: 1, color: PALETTE.moon }] : []
  )));
}

export function skyOps(width, height) {
  return [
    ...bands(width),
    ...stars(width),
    ...moon(width),
    { x: 0, y: GROUND_Y, w: width, h: height - GROUND_Y, color: PALETTE.street },
  ];
}

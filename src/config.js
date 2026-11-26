// Fixed geometry and palette. Every module agrees on these.

export const MARGIN = 4;
export const PLOT_W = 9;
export const DX = 1; // back rows shift right per depth row
export const DY = 2; // back rows shift up per depth row
export const BLOCK_W = PLOT_W + 6 * DX + 1; // 16, includes a 1px street
export const WEEKS = 53;
export const WIDTH = MARGIN * 2 + WEEKS * BLOCK_W; // 856
export const FLOOR_H = 3;
export const MAX_FLOORS = 14;
export const WINDOW_COLS = 3;
export const WINDOW_XS = [2, 4, 6];
export const SKY_H = 64;
export const GROUND_H = 18;
export const HEIGHT = SKY_H + 6 * DY + MAX_FLOORS * FLOOR_H + GROUND_H; // 136
export const GROUND_Y = HEIGHT - GROUND_H;
export const HOUSE_MAX_FLOORS = 3;
export const APARTMENT_MAX_FLOORS = 8;

export const PALETTE = Object.freeze({
  sky: Object.freeze(['#070a1c', '#0b1026', '#111739', '#1b2350']),
  star: '#e8ecff',
  moon: '#f4f1d0',
  moonShade: '#c9c4a0',
  ground: '#141826',
  street: '#0e111c',
  grass: '#1d3b2a',
  canopy: '#2f6b45',
  canopyDark: '#24543a',
  trunk: '#4a3222',
  bench: '#6b5a48',
  lampPost: '#3a3f55',
  lampLight: '#ffe9a8',
  house: Object.freeze(['#3b3350', '#43394f', '#353a52']),
  roof: Object.freeze(['#6b2f3a', '#5a3a2e', '#4a3a5e']),
  apartment: Object.freeze(['#2c3350', '#33304a', '#2a3a4c']),
  tower: Object.freeze(['#232a45', '#262f4f', '#1f2740']),
  windowOff: '#1c2236',
  windowLit: '#ffd66b',
  antenna: '#5a6080',
  antennaLight: '#ff3b3b',
  crane: '#e0a526',
  text: '#8b93b8',
});

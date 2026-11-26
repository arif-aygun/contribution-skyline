// Calendar days → city plots: one plot per day, 7 deep per week block, in back-to-front draw order.

import {
  MARGIN, BLOCK_W, DX, DY, GROUND_Y, MAX_FLOORS, WINDOW_COLS, WEEKS,
  HOUSE_MAX_FLOORS, APARTMENT_MAX_FLOORS,
} from './config.js';

/** Log-scaled floor count, normalized so the year's busiest day reaches MAX_FLOORS. */
export function floorsFor(count, max) {
  if (count <= 0) return 0;
  const k = max <= 1 ? 0 : (MAX_FLOORS - 1) / Math.log2(max);
  return Math.min(MAX_FLOORS, 1 + Math.round(k * Math.log2(count)));
}

export function kindFor(floors) {
  if (floors === 0) return 'park';
  if (floors <= HOUSE_MAX_FLOORS) return 'house';
  if (floors <= APARTMENT_MAX_FLOORS) return 'apartment';
  return 'tower';
}

function groupWeeks(days) {
  const weeks = [];
  for (const day of days) {
    if (weeks.length === 0 || day.weekday === 0) weeks.push([]);
    weeks.at(-1).push(day);
  }
  return weeks.slice(-WEEKS);
}

function position(week, weekday) {
  const depth = 6 - weekday;
  return { x: MARGIN + week * BLOCK_W + depth * DX, baseY: GROUND_Y - depth * DY };
}

function emptyPlot(week, weekday) {
  return {
    date: null, count: 0, week, weekday, ...position(week, weekday),
    kind: 'empty', floors: 0, lit: 0, capacity: 0, today: false, seed: `empty-${week}-${weekday}`,
  };
}

function dayPlot(day, week, max, isToday) {
  const floors = floorsFor(day.count, max);
  const capacity = floors * WINDOW_COLS;
  return {
    date: day.date, count: day.count, week, weekday: day.weekday, ...position(week, day.weekday),
    kind: kindFor(floors), floors, lit: Math.min(day.count, capacity), capacity,
    today: isToday, seed: day.date,
  };
}

export function layoutCity(days) {
  const weeks = groupWeeks(days);
  const kept = weeks.flat();
  const max = kept.reduce((m, d) => Math.max(m, d.count), 0);
  const lastDate = kept.at(-1)?.date;
  const plots = weeks.flatMap((weekDays, week) => {
    const byWeekday = new Map(weekDays.map((d) => [d.weekday, d]));
    return [0, 1, 2, 3, 4, 5, 6].map((wd) => {
      const day = byWeekday.get(wd);
      return day ? dayPlot(day, week, max, day.date === lastDate) : emptyPlot(week, wd);
    });
  });
  return plots.sort((a, b) => a.weekday - b.weekday || a.week - b.week);
}

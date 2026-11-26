// Pixel ops → one SVG stroke path per color (horizontal runs), plus individual rects for animated ops.

/** Paints ops in order onto a local index grid; later ops overwrite earlier ones. */
function paint(ops, width, height) {
  const colors = [];
  const indexOf = new Map();
  const grid = new Uint16Array(width * height); // 0 = transparent
  for (const op of ops) {
    if (op.cls) continue;
    if (!indexOf.has(op.color)) {
      colors.push(op.color);
      indexOf.set(op.color, colors.length);
    }
    const idx = indexOf.get(op.color);
    const x0 = Math.max(0, op.x), x1 = Math.min(width, op.x + op.w);
    const y0 = Math.max(0, op.y), y1 = Math.min(height, op.y + op.h);
    for (let y = y0; y < y1; y++) grid.fill(idx, y * width + x0, y * width + Math.max(x0, x1));
  }
  return { colors, grid };
}

/**
 * One path per color, drawn as 1px-wide strokes on half-pixel rows (`stroke-width` 1, butt caps):
 * `M{x} {y}.5h{n}` for the first run, then `m{dx} {dy}h{n}` relative to the pen.
 */
/** Final static color at a pixel (or undefined), after all non-animated ops are painted. */
export function paintedColors(ops, width, height) {
  const { colors, grid } = paint(ops, width, height);
  return (x, y) => (x < 0 || y < 0 || x >= width || y >= height ? undefined : colors[grid[y * width + x] - 1]);
}

export function rasterize(ops, width, height) {
  const { colors, grid } = paint(ops, width, height);
  const pens = colors.map(() => ({ d: '', x: 0, y: 0 }));
  for (let y = 0; y < height; y++) {
    let x = 0;
    while (x < width) {
      const idx = grid[y * width + x];
      let end = x + 1;
      while (end < width && grid[y * width + end] === idx) end++;
      if (idx !== 0) {
        const pen = pens[idx - 1];
        const move = pen.d === '' ? `M${x} ${y}.5` : `m${x - pen.x} ${y - pen.y}`;
        pens[idx - 1] = { d: `${pen.d}${move}h${end - x}`, x: end, y };
      }
      x = end;
    }
  }
  return new Map(colors.map((c, i) => [c, pens[i].d]).filter(([, d]) => d.length > 0));
}

const fmt = (n) => String(Math.round(n * 100) / 100);

export function animatedRects(ops) {
  return ops
    .filter((op) => op.cls)
    .map((op) => `<rect x="${op.x}" y="${op.y}" width="${op.w}" height="${op.h}" fill="${op.color}" `
      + `class="${op.cls}" style="animation-delay:${fmt(op.delay ?? 0)}s"/>`)
    .join('');
}

// Seeded randomness: every visual choice derives from a string seed, so the same input renders the same SVG.

function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32 seeded by an FNV-1a hash of `seed`. Returns floats in [0, 1). */
export function rng(seed) {
  let a = fnv1a(String(seed));
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Integer in [min, maxInclusive]. */
export function int(r, min, maxInclusive) {
  return min + Math.floor(r() * (maxInclusive - min + 1));
}

export function pick(r, array) {
  return array[Math.floor(r() * array.length)];
}

/** Fisher-Yates on a copy. */
export function shuffled(r, array) {
  const out = [...array];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function hash(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}

function random(seed: string) {
  let a = hash(seed);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick<T>(groups: T[][], size: number, seed: string): T[] {
  const next = random(seed);
  const order = groups.filter((g) => g.length > 0);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [order[i], order[j]] = [order[j] as T[], order[i] as T[]];
  }
  return order
    .slice(0, size)
    .sort((a, b) => groups.indexOf(a) - groups.indexOf(b))
    .map((g) => g[Math.floor(next() * g.length)] as T);
}

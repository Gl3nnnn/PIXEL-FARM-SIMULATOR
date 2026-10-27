/** Small shared helpers. */

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function tileKey(x: number, y: number): string {
  return `${x},${y}`;
}

export function parseTileKey(key: string): { x: number; y: number } {
  const [x, y] = key.split(',').map(Number);
  return { x, y };
}

let uidCounter = 0;

export function uid(prefix = 'id'): string {
  uidCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${uidCounter.toString(36)}`;
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 10_000) return `${(n / 1000).toFixed(1)}K`;
  return Math.floor(n).toLocaleString('en-US');
}

export function formatTime(minute: number): string {
  const h = Math.floor(minute / 60) % 24;
  const m = Math.floor(minute % 60);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m.toString().padStart(2, '0')} ${suffix}`;
}

export function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function pick<T>(arr: readonly T[], rng: () => number = Math.random): T {
  return arr[Math.floor(rng() * arr.length) % arr.length];
}

export function randomInt(min: number, max: number, rng: () => number = Math.random): number {
  return min + Math.floor(rng() * (max - min + 1));
}

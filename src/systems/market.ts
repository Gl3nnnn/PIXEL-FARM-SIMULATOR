import type { SaveData } from '../types';

type MarketDate = Pick<SaveData, 'year' | 'season' | 'day'>;

function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic per-item, per-day price multiplier in the range 0.85-1.25. */
export function marketMultiplier(itemId: string, date: MarketDate): number {
  const key = `${date.year}:${date.season}:${date.day}:${itemId}`;
  return (85 + (hash(key) % 9) * 5) / 100;
}

export function marketTrendPercent(itemId: string, date: MarketDate): number {
  return Math.round((marketMultiplier(itemId, date) - 1) * 100);
}

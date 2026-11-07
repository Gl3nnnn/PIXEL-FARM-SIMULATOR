import { CROPS, ITEMS } from '../data/definitions';
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

/** Every crop that can be sold, in definition order. */
const SELLABLE_CROPS = Object.values(CROPS)
  .map((crop) => crop.harvestId)
  .filter((itemId) => ITEMS[itemId] !== undefined);

/**
 * The one crop the town is mad for today. It pays double, it changes every
 * morning, and it turns "sell later" into "sell today".
 */
export function hotDemandItem(date: MarketDate): string {
  if (SELLABLE_CROPS.length === 0) return '';
  const key = `${date.year}:${date.season}:${date.day}:hot`;
  return SELLABLE_CROPS[hash(key) % SELLABLE_CROPS.length];
}

/** Bonus multiplier for the hot item, 1 for everything else. */
export function hotDemandMultiplier(itemId: string, date: MarketDate): number {
  return itemId === hotDemandItem(date) ? 2 : 1;
}

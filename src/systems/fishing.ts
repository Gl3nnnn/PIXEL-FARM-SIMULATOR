import { FISH, ITEMS, SEASONS } from '../data/definitions';
import type { FishDef, SaveData } from '../types';

export const FISH_IDS = Object.values(FISH).map((fish) => fish.id);

export function fishById(id: string): FishDef | undefined {
  return FISH[id];
}

export function eligibleFish(save: SaveData): FishDef[] {
  const hour = Math.floor(save.minute / 60);
  const pool = Object.values(FISH).filter(
    (fish) =>
      fish.seasons.includes(save.season) &&
      fish.weathers.includes(save.weather) &&
      hour >= fish.minHour &&
      hour < fish.maxHour
  );
  return pool.length > 0 ? pool : [FISH.minnow];
}

export function selectFish(save: SaveData, rng: () => number = Math.random, luck = 0): FishDef {
  const pool = eligibleFish(save);
  // A better rod makes the rarer fish a little more likely.
  const weight = (fish: FishDef) => Math.pow(fish.rarity, 1 - Math.min(0.8, luck));
  const total = pool.reduce((sum, fish) => sum + weight(fish), 0);
  let roll = rng() * Math.max(0.0001, total);
  for (const fish of pool) {
    roll -= weight(fish);
    if (roll <= 0) return fish;
  }
  return pool[pool.length - 1];
}

export function fishSeasonLabel(fish: FishDef): string {
  return fish.seasons.map((season) => SEASONS.indexOf(season)).includes(0) && fish.seasons.length === 4
    ? 'All seasons'
    : fish.seasons.map((season) => season.charAt(0).toUpperCase() + season.slice(1)).join(', ');
}

export function fishValue(fish: FishDef): number {
  return ITEMS[fish.itemId]?.sell ?? fish.minSell;
}

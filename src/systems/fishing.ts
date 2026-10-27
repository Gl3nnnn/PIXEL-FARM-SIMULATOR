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

export function selectFish(save: SaveData, rng: () => number = Math.random): FishDef {
  const pool = eligibleFish(save);
  const total = pool.reduce((sum, fish) => sum + fish.rarity, 0);
  let roll = rng() * Math.max(0.0001, total);
  for (const fish of pool) {
    roll -= fish.rarity;
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

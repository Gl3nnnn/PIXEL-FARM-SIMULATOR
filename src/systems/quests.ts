import { BUILDINGS, DAILY_TEMPLATES, levelFromXp } from '../data/definitions';
import type { DailySave, QuestDef, QuestMetric, SaveData, Stats } from '../types';

export function functionalBuildingCount(data: SaveData): number {
  return data.buildings.filter((b) => {
    const def = BUILDINGS[b.id];
    return !!def && def.kind !== 'decor' && def.kind !== 'farmhouse';
  }).length;
}

export function totalXp(data: SaveData): number {
  return (Object.values(data.xp) as number[]).reduce((a, b) => a + b, 0);
}

export function overallLevel(data: SaveData): number {
  return levelFromXp(totalXp(data));
}

export function metricValue(data: SaveData, metric: QuestMetric): number {
  switch (metric) {
    case 'level':
      return overallLevel(data);
    case 'farmingLevel':
      return levelFromXp(data.xp.farming);
    case 'animalsOwned':
      return data.animals.length;
    case 'buildingsOwned':
      return functionalBuildingCount(data);
    default:
      return (data.stats as unknown as Record<string, number>)[metric] ?? 0;
  }
}

export function questProgress(data: SaveData, quest: QuestDef): number {
  return metricValue(data, quest.metric);
}

export function isQuestComplete(data: SaveData, quest: QuestDef): boolean {
  return questProgress(data, quest) >= quest.target;
}

export function dailyProgress(data: SaveData, metric: QuestMetric, startStats: Stats): number {
  const cumulative: QuestMetric[] = [
    'harvests',
    'cropsSold',
    'productsCollected',
    'coinsEarned',
    'buildingsBuilt',
    'crafts',
    'waters',
    'tills',
    'planted',
    'goldHarvests',
    'carrotsHarvested',
    'eggsCollected'
  ];
  if (cumulative.includes(metric)) {
    const stats = data.stats as unknown as Record<string, number>;
    const start = startStats as unknown as Record<string, number>;
    return Math.max(0, (stats[metric] ?? 0) - (start[metric] ?? 0));
  }
  return metricValue(data, metric);
}

export function generateDaily(
  day: number,
  startStats: Stats,
  rng: () => number = Math.random
): DailySave {
  const pool = [...DAILY_TEMPLATES];
  const chosen: DailySave['list'] = [];
  for (let i = 0; i < 3 && pool.length > 0; i++) {
    const idx = Math.floor(rng() * pool.length) % pool.length;
    const [template] = pool.splice(idx, 1);
    const scale = 1 + Math.floor((day - 1) / 14) * 0.15;
    chosen.push({
      id: template.id,
      target: template.target,
      coins: Math.round(template.coins * scale),
      xp: Math.round(template.xp * scale),
      claimed: false
    });
  }
  return { day, list: chosen, startStats: { ...startStats } };
}

export function readDailyTemplate(id: string) {
  return DAILY_TEMPLATES.find((d) => d.id === id);
}

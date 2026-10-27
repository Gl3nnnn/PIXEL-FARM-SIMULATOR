import { describe, expect, it } from 'vitest';
import {
  ACHIEVEMENTS,
  ANIMALS,
  BUILDINGS,
  CROPS,
  DAILY_TEMPLATES,
  ITEMS,
  MAIN_QUESTS,
  PLOTS,
  RECIPES,
  SEASONS,
  SEED_IDS,
  UPGRADES,
  levelFromXp,
  xpForLevel,
  xpProgress
} from '../src/data/definitions';
import type { QuestDef } from '../src/types';

const quests: QuestDef[] = [...MAIN_QUESTS, ...ACHIEVEMENTS, ...DAILY_TEMPLATES.map((q) => ({ ...q, tier: 'daily' as const }))];

describe('content definitions', () => {
  it('ships ten crops and ten matching seeds', () => {
    expect(Object.keys(CROPS)).toHaveLength(10);
    expect(SEED_IDS).toHaveLength(10);
    for (const seedId of SEED_IDS) {
      const item = ITEMS[seedId];
      expect(item.type).toBe('seed');
      expect(Object.values(CROPS).some((crop) => crop.seedId === seedId)).toBe(true);
    }
  });

  it('ships five animals and all required buildings', () => {
    expect(Object.keys(ANIMALS)).toHaveLength(5);
    expect(Object.keys(ANIMALS)).toEqual(
      expect.arrayContaining(['chicken', 'duck', 'cow', 'sheep', 'pig'])
    );
    expect(Object.keys(BUILDINGS)).toEqual(
      expect.arrayContaining([
        'farmhouse',
        'coop',
        'barn',
        'shed',
        'workshop',
        'greenhouse',
        'well',
        'sprinkler',
        'fence',
        'path'
      ])
    );
  });

  it('has a coherent economy across items, recipes and upgrades', () => {
    for (const item of Object.values(ITEMS)) {
      expect(item.name.length).toBeGreaterThan(0);
      expect(item.stack).toBeGreaterThan(0);
      if (item.type !== 'tool') expect(item.price).toBeGreaterThan(0);
    }
    for (const recipe of RECIPES) {
      expect(ITEMS[recipe.output.itemId]).toBeDefined();
      for (const input of recipe.inputs) expect(ITEMS[input.itemId]).toBeDefined();
    }
    expect(UPGRADES).toHaveLength(4);
    expect(PLOTS).toHaveLength(6);
    expect(SEASONS).toHaveLength(4);
  });

  it('uses valid quest metrics and positive targets', () => {
    for (const quest of quests) {
      expect(quest.title.length).toBeGreaterThan(0);
      expect(quest.target).toBeGreaterThan(0);
      expect(quest.metric.length).toBeGreaterThan(0);
    }
  });

  it('computes consistent level thresholds', () => {
    expect(levelFromXp(0)).toBe(1);
    expect(xpForLevel(1)).toBe(0);
    expect(levelFromXp(xpForLevel(2))).toBe(2);

    const totalForFive = xpForLevel(2) + xpForLevel(3) + xpForLevel(4) + xpForLevel(5);
    expect(levelFromXp(totalForFive)).toBe(5);
    expect(xpProgress(totalForFive)).toMatchObject({ level: 5, into: 0 });
  });
});

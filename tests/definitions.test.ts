import { describe, expect, it } from 'vitest';
import {
  ACHIEVEMENTS,
  ANIMALS,
  BUILDINGS,
  CROPS,
  DAILY_TEMPLATES,
  FESTIVALS,
  ITEMS,
  MAIN_QUESTS,
  PLOTS,
  RECIPES,
  SEASONS,
  SEED_IDS,
  TOOLS,
  UPGRADES,
  levelFromXp,
  xpForLevel,
  xpProgress
} from '../src/data/definitions';
import type { QuestDef } from '../src/types';

const quests: QuestDef[] = [...MAIN_QUESTS, ...ACHIEVEMENTS, ...DAILY_TEMPLATES.map((q) => ({ ...q, tier: 'daily' as const }))];

describe('content definitions', () => {
  it('ships sixty crops and sixty matching seeds', () => {
    expect(Object.keys(CROPS)).toHaveLength(60);
    expect(SEED_IDS).toHaveLength(60);
    for (const seedId of SEED_IDS) {
      const item = ITEMS[seedId];
      expect(item.type).toBe('seed');
      expect(Object.values(CROPS).some((crop) => crop.seedId === seedId)).toBe(true);
    }
  });

  it('ships fifty-five animals, fifty farm tools and all required buildings', () => {
    expect(Object.keys(ANIMALS)).toHaveLength(55);
    expect(TOOLS).toHaveLength(50);
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

  it('gives every animal a home and a product that can be sold', () => {
    for (const animal of Object.values(ANIMALS)) {
      expect(ITEMS[animal.productId]).toBeDefined();
      expect(ITEMS[animal.productId].sell).toBeGreaterThan(0);
      expect(
        Object.values(BUILDINGS).some((b) => b.kind === 'housing' && b.houses === animal.housing)
      ).toBe(true);
    }
  });

  it('gives every tool a unique job, price and level', () => {
    const ids = new Set<string>();
    for (const tool of TOOLS) {
      expect(ids.has(tool.id)).toBe(false);
      ids.add(tool.id);
      expect(tool.price).toBeGreaterThan(0);
      expect(tool.bonus).toBeGreaterThan(0);
      expect(tool.unlockLevel).toBeGreaterThanOrEqual(1);
      expect(['till', 'water', 'speed', 'bag', 'luck', 'rod', 'mine']).toContain(tool.effect);
    }
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

  it('ships one festival with three valid contracts per season', () => {
    const ids = new Set<string>();
    for (const season of SEASONS) {
      const festival = FESTIVALS[season];
      expect(festival.season).toBe(season);
      expect(festival.name.length).toBeGreaterThan(0);
      expect(festival.bonusCoins).toBeGreaterThan(0);
      expect(festival.bonusXp).toBeGreaterThan(0);
      expect(festival.contracts).toHaveLength(3);
      for (const contract of festival.contracts) {
        expect(contract.title.length).toBeGreaterThan(0);
        expect(contract.metric.length).toBeGreaterThan(0);
        expect(contract.target).toBeGreaterThan(0);
        expect(contract.coins).toBeGreaterThan(0);
        expect(contract.xp).toBeGreaterThan(0);
        expect(ids.has(contract.id)).toBe(false);
        ids.add(contract.id);
      }
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

import { describe, expect, it } from 'vitest';
import { CROPS, SEED_IDS } from '../src/data/definitions';
import { prepareTilledTile, makeState, FIELD_X, FIELD_Y } from './helpers';

describe('crop lifecycle', () => {
  it('tills, plants, waters and grows a crop overnight', () => {
    const state = makeState();
    prepareTilledTile(state);
    const tile = state.tileAt(FIELD_X, FIELD_Y);
    expect(tile?.tilled).toBe(true);
    expect(state.data.stats.tills).toBe(1);

    const planted = state.plantAt(FIELD_X, FIELD_Y, 'carrot_seed');
    expect(planted.ok).toBe(true);
    expect(tile?.crop?.id).toBe('carrots');
    expect(state.countItem('carrot_seed')).toBe(4);

    const watered = state.waterAt(FIELD_X, FIELD_Y);
    expect(watered.ok).toBe(true);
    expect(tile?.watered).toBe(true);

    const summary = state.advanceDay();
    expect(summary.grown).toBe(1);
    expect(tile?.crop?.growth).toBe(1);
    expect(tile?.watered).toBe(false);
  });

  it('harvests a mature crop, grants produce and clears the tile', () => {
    const state = makeState();
    prepareTilledTile(state);
    state.plantAt(FIELD_X, FIELD_Y, 'carrot_seed');
    const tile = state.tileAt(FIELD_X, FIELD_Y);
    expect(tile?.crop).toBeTruthy();
    tile!.crop!.growth = CROPS.carrots.growthDays;

    expect(state.cropMature(FIELD_X, FIELD_Y)).toBe(true);
    const harvested = state.harvestAt(FIELD_X, FIELD_Y);
    expect(harvested.ok).toBe(true);
    expect(harvested.items).toBeGreaterThanOrEqual(CROPS.carrots.yieldMin);
    expect(state.countItem('carrots')).toBeGreaterThanOrEqual(CROPS.carrots.yieldMin);
    expect(state.data.stats.harvests).toBe(1);
    expect(state.data.stats.carrotsHarvested).toBeGreaterThanOrEqual(2);
    expect(state.tileAt(FIELD_X, FIELD_Y)?.crop).toBeUndefined();
  });

  it('keeps regrowing crops alive after harvest', () => {
    const state = makeState();
    state.data.season = 'summer';
    prepareTilledTile(state);
    state.addItem('tomato_seed', 1);
    expect(state.plantAt(FIELD_X, FIELD_Y, 'tomato_seed').ok).toBe(true);
    const tile = state.tileAt(FIELD_X, FIELD_Y)!;
    tile.crop!.growth = CROPS.tomatoes.growthDays;

    expect(state.harvestAt(FIELD_X, FIELD_Y).ok).toBe(true);
    expect(tile.crop).toBeTruthy();
    expect(tile.crop!.growth).toBeLessThan(CROPS.tomatoes.growthDays);
    expect(tile.crop!.regrows).toBe(1);
  });

  it('blocks planting crops that are out of season without a greenhouse', () => {
    const state = makeState();
    state.data.season = 'winter';
    prepareTilledTile(state);
    state.addItem('tomato_seed', 2);

    const blocked = state.plantAt(FIELD_X, FIELD_Y, 'tomato_seed');
    expect(blocked.ok).toBe(false);
    expect(blocked.message).toMatch(/grows in/i);

    state.data.buildings.push({ uid: 'b_greenhouse_test', id: 'greenhouse', x: 20, y: 3 });
    expect(state.hasGreenhouse()).toBe(true);
    const allowed = state.plantAt(FIELD_X, FIELD_Y, 'tomato_seed');
    expect(allowed.ok).toBe(true);
  });

  it('requires watering to grow and wilts after three dry days', () => {
    const state = makeState();
    prepareTilledTile(state);
    state.plantAt(FIELD_X, FIELD_Y, 'carrot_seed');
    const tile = state.tileAt(FIELD_X, FIELD_Y)!;

    for (let i = 0; i < 3; i++) state.advanceDay();
    expect(tile.crop).toBeUndefined();
    expect(state.data.stats.harvests).toBe(0);
  });

  it('applies fertilizer and consumes one bag', () => {
    const state = makeState();
    prepareTilledTile(state);
    expect(state.countItem('fertilizer')).toBe(3);
    const result = state.fertilizeAt(FIELD_X, FIELD_Y);
    expect(result.ok).toBe(true);
    expect(state.countItem('fertilizer')).toBe(2);
    expect(state.tileAt(FIELD_X, FIELD_Y)?.fertilized).toBe(true);
    expect(state.fertilizeAt(FIELD_X, FIELD_Y).ok).toBe(false);
  });

  it('exposes all ten seeds with valid crop definitions', () => {
    expect(SEED_IDS).toHaveLength(10);
    expect(Object.keys(CROPS)).toHaveLength(10);
    for (const seedId of SEED_IDS) {
      expect(stateCanPlant(seedId)).toBeDefined();
    }
  });
});

function stateCanPlant(seedId: string) {
  return Object.values(CROPS).find((crop) => crop.seedId === seedId);
}

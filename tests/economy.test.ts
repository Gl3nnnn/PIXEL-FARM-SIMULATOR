import { describe, expect, it } from 'vitest';
import { BUILDINGS } from '../src/data/definitions';
import { findBuildSpot, fillInventory, makeState } from './helpers';

describe('economy and inventory', () => {
  it('buys and sells items, tracking coins and stats', () => {
    const state = makeState();
    expect(state.data.coins).toBe(400);

    const bought = state.buyItem('wheat_seed', 2);
    expect(bought.ok).toBe(true);
    expect(state.data.coins).toBe(380);
    expect(state.countItem('wheat_seed')).toBe(10);

    const index = state.data.inventory.findIndex((stack) => stack?.itemId === 'wheat_seed');
    const sold = state.sellStack(index, 3);
    expect(sold.ok).toBe(true);
    expect(sold.total).toBe(9);
    expect(state.data.coins).toBe(389);
    expect(state.countItem('wheat_seed')).toBe(7);
    expect(state.data.stats.cropsSold).toBe(3);
  });

  it('rejects purchases without coins or with a full backpack', () => {
    const broke = makeState();
    broke.data.coins = 3;
    expect(broke.buyItem('pumpkin_seed', 1).ok).toBe(false);

    const full = makeState();
    fillInventory(full.data);
    const result = full.buyItem('wheat_seed', 1);
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/full/i);
  });

  it('cannot sell tools', () => {
    const state = makeState();
    const index = state.data.inventory.findIndex((stack) => stack?.itemId === 'hoe');
    expect(state.sellStack(index, 1).ok).toBe(false);
  });

  it('sells everything except tools', () => {
    const state = makeState();
    const result = state.sellAll();
    expect(result.ok).toBe(true);
    expect(result.total).toBeGreaterThan(0);
    expect(state.countItem('hoe')).toBe(1);
    expect(state.countItem('watering_can')).toBe(1);
    expect(state.countItem('wheat_seed')).toBe(0);
  });

  it('builds a coop on clear ground and charges coins', () => {
    const state = makeState();
    state.data.coins = 5000;
    const spot = findBuildSpot(state, 'coop');
    const before = state.data.coins;
    const build = state.build('coop', spot.x, spot.y);
    expect(build.ok).toBe(true);
    expect(state.data.coins).toBe(before - BUILDINGS.coop.cost);
    expect(state.data.buildings.filter((b) => b.id === 'coop')).toHaveLength(1);
    expect(state.data.stats.buildingsBuilt).toBe(1);
    expect(state.canPlaceBuilding('coop', spot.x, spot.y).ok).toBe(false);
  });

  it('enforces building levels, water, fields and paths', () => {
    const state = makeState();
    state.data.coins = 50000;
    const spot = findBuildSpot(state, 'coop');
    expect(state.canPlaceBuilding('sprinkler', spot.x, spot.y).message).toMatch(/level 6/i);
    expect(state.canPlaceBuilding('well', spot.x, spot.y).message).toMatch(/level 2/i);

    state.data.xp.farming = 2000;
    expect(state.level).toBeGreaterThanOrEqual(6);
    expect(state.canPlaceBuilding('sprinkler', spot.x, spot.y).ok).toBe(true);

    const water = state.canPlaceBuilding('coop', 37, 4);
    expect(water.ok).toBe(false);

    const field = state.canPlaceBuilding('coop', 8, 10);
    expect(field.ok).toBe(false);
    expect(field.message).toMatch(/field/i);

    const path = state.canPlaceBuilding('path', spot.x, spot.y);
    expect(path.ok).toBe(true);
  });

  it('expands land and upgrades the farmhouse', () => {
    const state = makeState();
    state.data.coins = 50000;
    expect(state.data.unlockedPlots).toBe(1);
    const expanded = state.expandLand();
    expect(expanded.ok).toBe(true);
    expect(state.data.unlockedPlots).toBe(2);
    expect(state.data.coins).toBe(50000 - 600);

    const cost = state.farmhouseUpgradeCost();
    const upgraded = state.upgradeFarmhouse();
    expect(upgraded.ok).toBe(true);
    expect(state.data.farmhouseLevel).toBe(2);
    expect(state.data.coins).toBe(50000 - 600 - cost);
    expect(state.capacity()).toBeGreaterThan(24);
  });

  it('upgrades tools up to their maximum level', () => {
    const state = makeState();
    state.data.coins = 10000;
    expect(state.upgradeTool('hoe').ok).toBe(true);
    expect(state.data.upgrades.hoe).toBe(1);
    expect(state.upgradeTool('hoe').ok).toBe(true);
    expect(state.data.upgrades.hoe).toBe(2);
    expect(state.upgradeTool('hoe').ok).toBe(false);
  });
});

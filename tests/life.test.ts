import { describe, expect, it } from 'vitest';
import { MUSEUM_REWARDS } from '../src/data/definitions';
import { createNewSave } from '../src/systems/gameState';
import { deserializeSave, serializeSave } from '../src/systems/save';
import { makeState } from './helpers';

describe('new life systems', () => {
  it('starts a fresh save with the homestead defaults', () => {
    const save = createNewSave();
    expect(save.mineRun.maxHp).toBeGreaterThan(0);
    expect(save.family.children).toEqual([]);
    expect(save.pet.type).toBeNull();
    expect(save.house.furniture).toEqual([]);
    expect(save.museum.donated).toEqual([]);
    expect(save.shipping.items).toEqual([]);
    expect(save.horseOwned).toBe(false);
    expect(save.buildings.some((entry) => entry.id === 'shipping_bin')).toBe(true);
  });

  it('ships goods overnight at market price', () => {
    const state = makeState();
    state.data.coins = 0;
    state.data.shipping.items = [];
    state.addItem('carrots', 5);
    const index = state.data.inventory.findIndex((stack) => stack?.itemId === 'carrots');
    expect(index).toBeGreaterThanOrEqual(0);
    expect(state.queueForShipping(index, 3).ok).toBe(true);
    expect(state.data.shipping.items[0]).toMatchObject({ itemId: 'carrots', qty: 3 });
    const value = state.shippingValue();
    expect(value).toBeGreaterThan(0);

    state.advanceDay();
    expect(state.data.shipping.items).toEqual([]);
    expect(state.data.coins).toBe(value);
    expect(state.data.stats.itemsShipped).toBe(3);
  });

  it('adopts a pet and rewards daily attention', () => {
    const state = makeState();
    state.data.coins = 1000;
    expect(state.adoptPet('dog').ok).toBe(true);
    expect(state.petState().type).toBe('dog');
    expect(state.adoptPet('cat').ok).toBe(false);
    expect(state.petPet().ok).toBe(true);
    expect(state.petPet().ok).toBe(false);
    state.advanceDay();
    expect(state.petPet().ok).toBe(true);
  });

  it('places furniture and applies its bonus', () => {
    const state = makeState();
    state.data.coins = 5000;
    const before = state.maxEnergy();
    expect(state.buyFurniture('oak_bed').ok).toBe(true);
    expect(state.maxEnergy()).toBe(before + 10);
    expect(state.houseState().bonuses.energy).toBe(10);
    expect(state.buyFurniture('oak_bed').ok).toBe(false);
  });

  it('donates artifacts and claims curator rewards', () => {
    const state = makeState();
    state.addItem('artifact_coin', 1);
    state.addItem('artifact_bone', 1);
    expect(state.donateArtifact('artifact_coin').ok).toBe(true);
    expect(state.donateArtifact('artifact_coin').ok).toBe(false);
    expect(state.claimMuseumReward('museum_2').ok).toBe(false);
    expect(state.donateArtifact('artifact_bone').ok).toBe(true);
    const before = state.data.coins;
    const reward = MUSEUM_REWARDS.find((entry) => entry.id === 'museum_2')!;
    expect(state.claimMuseumReward('museum_2').ok).toBe(true);
    expect(state.data.coins).toBe(before + reward.coins);
    expect(state.claimMuseumReward('museum_2').ok).toBe(false);
  });

  it('explores the mine and returns to the surface', () => {
    const state = makeState();
    state.addItem('pickaxe', 1);
    expect(state.enterMine(1).ok).toBe(true);
    expect(state.data.mineRun.floor).toBe(1);
    const moved = [
      state.mineStep(1, 0),
      state.mineStep(-1, 0),
      state.mineStep(0, 1),
      state.mineStep(0, -1)
    ].some((result) => result.ok);
    expect(moved).toBe(true);
    expect(state.useElevator(5).ok).toBe(false);
    expect(state.returnToSurface().ok).toBe(true);
    expect(state.returnToSurface().ok).toBe(false);
  });

  it('round-trips the new save fields', () => {
    const save = createNewSave();
    save.horseOwned = true;
    save.pet = { type: 'cat', name: 'Mittens', affection: 50, lastPetDay: 3 };
    save.family.children.push({ id: 'child_1', name: 'Robin', ageDays: 4 });
    save.museum.donated.push('artifact_coin');
    save.house.furniture.push('oak_bed');
    save.mineRun.maxFloor = 7;
    save.mineRun.elevator.push(6);
    save.shipping.items.push({ itemId: 'carrots', qty: 2, quality: 'normal' });

    const restored = deserializeSave(serializeSave(save));
    expect(restored.horseOwned).toBe(true);
    expect(restored.pet).toMatchObject({ type: 'cat', name: 'Mittens', affection: 50 });
    expect(restored.family.children[0]).toMatchObject({ name: 'Robin', ageDays: 4 });
    expect(restored.museum.donated).toContain('artifact_coin');
    expect(restored.house.furniture).toContain('oak_bed');
    expect(restored.mineRun.maxFloor).toBe(7);
    expect(restored.mineRun.elevator).toContain(6);
    expect(restored.shipping.items[0]).toMatchObject({ itemId: 'carrots', qty: 2 });
  });
});

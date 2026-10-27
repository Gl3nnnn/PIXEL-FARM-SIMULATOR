import { describe, expect, it } from 'vitest';
import { ANIMALS } from '../src/data/definitions';
import { findBuildSpot, makeState } from './helpers';

function stateWithCoop() {
  const state = makeState();
  state.data.coins = 5000;
  const spot = findBuildSpot(state, 'coop');
  expect(state.build('coop', spot.x, spot.y).ok).toBe(true);
  return state;
}

describe('animal husbandry', () => {
  it('requires housing before buying an animal', () => {
    const state = makeState();
    state.data.coins = 5000;
    const result = state.buyAnimal('chicken');
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/coop|barn/i);
  });

  it('buys a chicken once a coop exists and respects capacity', () => {
    const state = stateWithCoop();
    const bought = state.buyAnimal('chicken');
    expect(bought.ok).toBe(true);
    expect(state.data.animals).toHaveLength(1);
    expect(state.data.stats.animalsOwned).toBe(1);
    expect(state.animalsInHousing('coop')).toBe(1);
    expect(state.animalMature(state.data.animals[0])).toBe(false);
  });

  it('feeds, pets and produces a daily egg', () => {
    const state = stateWithCoop();
    state.buyAnimal('chicken');
    const animal = state.data.animals[0];

    expect(state.feedAnimal(animal.uid).ok).toBe(true);
    expect(animal.fed).toBe(true);
    expect(state.feedAnimal(animal.uid).ok).toBe(false);

    expect(state.petAnimal(animal.uid).ok).toBe(true);
    expect(animal.happiness).toBeGreaterThan(65);
    expect(state.petAnimal(animal.uid).ok).toBe(false);

    animal.ageDays = ANIMALS.chicken.maturityDays;
    animal.happiness = 80;
    animal.fed = true;
    state.advanceDay();
    expect(animal.productReady).toBe(true);
    expect(animal.fed).toBe(false);

    const collected = state.collectAnimal(animal.uid);
    expect(collected.ok).toBe(true);
    expect(state.countItem('egg')).toBe(1);
    expect(state.data.stats.productsCollected).toBe(1);
    expect(state.data.stats.eggsCollected).toBe(1);
    expect(animal.productReady).toBe(false);
  });

  it('loses happiness when animals are not fed', () => {
    const state = stateWithCoop();
    state.buyAnimal('chicken');
    const animal = state.data.animals[0];
    const before = animal.happiness;
    state.advanceDay();
    expect(animal.happiness).toBeLessThan(before);
  });

  it('breeds two mature animals of the same species', () => {
    const state = stateWithCoop();
    state.data.coins = 5000;
    state.buyAnimal('chicken');
    state.buyAnimal('chicken');
    expect(state.data.animals).toHaveLength(2);
    for (const animal of state.data.animals) {
      animal.ageDays = ANIMALS.chicken.maturityDays;
      animal.happiness = 90;
    }
    state.addItem('feed', 10);

    const bred = state.breedAnimals(state.data.animals[0].uid, state.data.animals[1].uid);
    expect(bred.ok).toBe(true);
    expect(state.data.animals).toHaveLength(3);
    expect(state.data.animals[2].ageDays).toBe(0);
  });

  it('does not breed different species', () => {
    const state = stateWithCoop();
    state.data.coins = 5000;
    state.buyAnimal('chicken');
    state.buyAnimal('duck');
    const result = state.breedAnimals(state.data.animals[0].uid, state.data.animals[1].uid);
    expect(result.ok).toBe(false);
  });
});

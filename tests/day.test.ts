import { describe, expect, it } from 'vitest';
import { CROPS } from '../src/data/definitions';
import { FIELD_X, FIELD_Y, findBuildSpot, makeState, prepareTilledTile } from './helpers';

describe('overnight chores', () => {
  it('counts unwatered immature crops only', () => {
    const state = makeState();
    prepareTilledTile(state);
    state.plantAt(FIELD_X, FIELD_Y, 'carrot_seed');
    const tile = state.tileAt(FIELD_X, FIELD_Y)!;

    expect(state.overnightChores().unwateredCrops).toBe(1);
    state.waterAt(FIELD_X, FIELD_Y);
    expect(state.overnightChores().unwateredCrops).toBe(0);

    tile.watered = false;
    tile.crop!.growth = CROPS.carrots.growthDays;
    expect(state.overnightChores().unwateredCrops).toBe(0);
  });

  it('counts animals that have not been fed', () => {
    const state = makeState();
    state.data.coins = 5000;
    const spot = findBuildSpot(state, 'coop');
    expect(state.build('coop', spot.x, spot.y).ok).toBe(true);
    expect(state.buyAnimal('chicken').ok).toBe(true);

    expect(state.overnightChores().unfedAnimals).toBe(1);
    state.feedAnimal(state.data.animals[0].uid);
    expect(state.overnightChores().unfedAnimals).toBe(0);
  });
});

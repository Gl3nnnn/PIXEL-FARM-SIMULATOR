import { describe, expect, it } from 'vitest';
import { ANIMALS, CROPS } from '../src/data/definitions';
import { animalEconomics, cropEconomics } from '../src/systems/almanac';

describe('farm almanac economics', () => {
  it('estimates first-harvest and replant crop profits', () => {
    const wheat = cropEconomics(CROPS.wheat);
    expect(wheat.seedCost).toBe(10);
    expect(wheat.sellPrice).toBe(14);
    expect(wheat.averageYield).toBe(2.5);
    expect(wheat.firstHarvestProfit).toBe(25);
    expect(wheat.firstHarvestProfitPerDay).toBeCloseTo(6.25);
    expect(wheat.regrowProfitPerDay).toBeNull();
  });

  it('estimates regrowing crop profits without another seed cost', () => {
    const tomatoes = cropEconomics(CROPS.tomatoes);
    expect(tomatoes.firstHarvestProfit).toBe(53);
    expect(tomatoes.firstHarvestProfitPerDay).toBeCloseTo(10.6);
    expect(tomatoes.regrowProfitPerDay).toBeCloseTo(42.5);
    expect(tomatoes.regrowProfitPerDay).toBeGreaterThan(tomatoes.firstHarvestProfitPerDay);
  });

  it('handles high-value single-yield crops', () => {
    const pumpkins = cropEconomics(CROPS.pumpkins);
    expect(pumpkins.averageYield).toBe(1);
    expect(pumpkins.firstHarvestProfit).toBe(100);
    expect(pumpkins.firstHarvestProfitPerDay).toBeCloseTo(100 / 7);
  });

  it('estimates livestock returns after feed costs', () => {
    expect(animalEconomics(ANIMALS.chicken)).toMatchObject({
      productSellPrice: 24,
      feedCost: 14,
      netPerDay: 10
    });
    expect(animalEconomics(ANIMALS.pig)).toMatchObject({
      productSellPrice: 140,
      feedCost: 14,
      netPerDay: 126
    });
  });
});

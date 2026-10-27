import { ITEMS } from '../data/definitions';
import type { AnimalDef, CropDef } from '../types';

export interface CropEconomics {
  seedCost: number;
  sellPrice: number;
  averageYield: number;
  grossPerHarvest: number;
  firstHarvestProfit: number;
  firstHarvestProfitPerDay: number;
  regrowProfitPerDay: number | null;
}

export interface AnimalEconomics {
  productSellPrice: number;
  feedCost: number;
  netPerDay: number;
}

/** Estimates crop returns using base prices, normal quality, and average yield. */
export function cropEconomics(crop: CropDef): CropEconomics {
  const seedCost = ITEMS[crop.seedId]?.price ?? 0;
  const sellPrice = ITEMS[crop.harvestId]?.sell ?? 0;
  const averageYield = (crop.yieldMin + crop.yieldMax) / 2;
  const grossPerHarvest = sellPrice * averageYield;
  const firstHarvestProfit = grossPerHarvest - seedCost;

  return {
    seedCost,
    sellPrice,
    averageYield,
    grossPerHarvest,
    firstHarvestProfit,
    firstHarvestProfitPerDay:
      crop.growthDays > 0 ? firstHarvestProfit / crop.growthDays : firstHarvestProfit,
    regrowProfitPerDay: crop.regrowDays > 0 ? grossPerHarvest / crop.regrowDays : null
  };
}

/** Estimates daily livestock returns after maturity, including feed cost. */
export function animalEconomics(animal: AnimalDef): AnimalEconomics {
  const productSellPrice = ITEMS[animal.productId]?.sell ?? 0;
  const feedCost = ITEMS.feed?.price ?? 0;

  return {
    productSellPrice,
    feedCost,
    netPerDay: productSellPrice - feedCost
  };
}

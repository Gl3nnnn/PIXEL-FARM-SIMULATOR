import { describe, expect, it } from 'vitest';
import { ITEMS } from '../src/data/definitions';
import { marketMultiplier, marketTrendPercent } from '../src/systems/market';
import { makeState } from './helpers';

describe('daily market prices', () => {
  it('is deterministic and stays within the advertised range', () => {
    const items = ['wheat_seed', 'egg', 'bread', 'fertilizer'];
    for (const day of [1, 2, 7, 14, 28]) {
      for (const itemId of items) {
        const date = { year: 1, season: 'spring' as const, day };
        const first = marketMultiplier(itemId, date);
        expect(first).toBe(marketMultiplier(itemId, date));
        expect(first).toBeGreaterThanOrEqual(0.85);
        expect(first).toBeLessThanOrEqual(1.25);
        expect(marketTrendPercent(itemId, date)).toBe(Math.round((first - 1) * 100));
      }
    }
  });

  it('changes prices across days', () => {
    const values = new Set(
      Array.from({ length: 14 }, (_, i) =>
        marketMultiplier('wheat_seed', { year: 1, season: 'spring', day: i + 1 })
      )
    );
    expect(values.size).toBeGreaterThan(1);
  });

  it('stacks the daily modifier with quality bonuses', () => {
    const state = makeState();
    state.data.day = 9;
    const base = ITEMS.wheat.sell;
    const modifier = marketMultiplier('wheat', state.data);

    expect(state.sellPrice('wheat')).toBe(Math.max(1, Math.round(base * modifier)));
    expect(state.sellPrice('wheat', 'gold')).toBe(
      Math.max(1, Math.round(base * 1.75 * modifier))
    );
  });
});

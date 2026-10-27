import { describe, expect, it } from 'vitest';
import { DAYS_PER_SEASON, FESTIVALS } from '../src/data/definitions';
import {
  generateSeasonal,
  readSeasonalContract,
  seasonalScale,
  seasonalBoardMatches
} from '../src/systems/festivals';
import { makeState } from './helpers';

describe('seasonal festival board', () => {
  it('generates three themed contracts from the season snapshot', () => {
    const state = makeState();
    const board = generateSeasonal('spring', 1, state.data.stats);

    expect(board.season).toBe('spring');
    expect(board.year).toBe(1);
    expect(board.list).toHaveLength(3);
    expect(board.list.every((entry) => !entry.claimed)).toBe(true);
    expect(board.bonusCoins).toBe(FESTIVALS.spring.bonusCoins);
    expect(board.bonusXp).toBe(FESTIVALS.spring.bonusXp);
    expect(board.startStats).not.toBe(state.data.stats);
    expect(seasonalBoardMatches(board, 'spring', 1)).toBe(true);
    expect(seasonalBoardMatches(board, 'summer', 1)).toBe(false);
    expect(seasonalBoardMatches(board, 'spring', 2)).toBe(false);
  });

  it('scales targets and rewards with the year', () => {
    const state = makeState();
    const board = generateSeasonal('spring', 3, state.data.stats);
    const plant = board.list.find((entry) => entry.id === 's_spring_plant');

    expect(seasonalScale(3)).toBeCloseTo(1.2);
    expect(plant?.target).toBe(15);
    expect(plant?.coins).toBe(216);
    expect(board.bonusCoins).toBe(600);
  });

  it('tracks progress from the start of the season and claims once', () => {
    const state = makeState();
    const board = state.data.seasonal!;
    const entry = board.list.find((item) => item.id === 's_spring_plant')!;
    state.data.stats.planted = board.startStats.planted + entry.target;

    expect(state.seasonalContractState(entry.id)?.complete).toBe(true);
    const first = state.claimSeasonalContract(entry.id);
    expect(first.ok).toBe(true);
    expect(state.data.seasonal?.list.find((item) => item.id === entry.id)?.claimed).toBe(true);

    const second = state.claimSeasonalContract(entry.id);
    expect(second.ok).toBe(false);
  });

  it('only unlocks the festival bonus after all contracts are claimed', () => {
    const state = makeState();
    const board = state.data.seasonal!;
    expect(state.seasonalBoardState()?.bonusReady).toBe(false);
    expect(state.claimSeasonalBonus().ok).toBe(false);

    for (const entry of board.list) {
      const contract = readSeasonalContract(board.season, entry.id)!;
      const stats = state.data.stats as unknown as Record<string, number>;
      const start = board.startStats as unknown as Record<string, number>;
      stats[contract.metric] = (start[contract.metric] ?? 0) + entry.target;
      expect(state.claimSeasonalContract(entry.id).ok).toBe(true);
    }

    expect(state.seasonalBoardState()?.bonusReady).toBe(true);
    const bonus = state.claimSeasonalBonus();
    expect(bonus.ok).toBe(true);
    expect(state.data.seasonal?.bonusClaimed).toBe(true);
    expect(state.claimSeasonalBonus().ok).toBe(false);
  });

  it('refreshes the festival board when the season changes', () => {
    const state = makeState();
    state.data.day = DAYS_PER_SEASON;
    const summary = state.advanceDay();

    expect(state.data.season).toBe('summer');
    expect(state.data.seasonal?.season).toBe('summer');
    expect(state.data.seasonal?.bonusCoins).toBe(FESTIVALS.summer.bonusCoins);
    expect(state.data.seasonal?.list.every((entry) => !entry.claimed)).toBe(true);
    expect(summary.messages.join(' ')).toMatch(/Sunfest/);
  });
});

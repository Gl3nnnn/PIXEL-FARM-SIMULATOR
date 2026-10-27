import { describe, expect, it } from 'vitest';
import { DAILY_TEMPLATES, MAIN_QUESTS } from '../src/data/definitions';
import type { DailySave } from '../src/types';
import { makeState } from './helpers';

describe('quests and achievements', () => {
  it('claims a completed main quest exactly once', () => {
    const state = makeState();
    state.data.stats.planted = 5;
    const coins = state.data.coins;

    const first = state.claimMainQuest('q_plant');
    expect(first.ok).toBe(true);
    expect(state.data.coins).toBeGreaterThan(coins);
    expect(state.data.claimedQuests).toContain('q_plant');

    const second = state.claimMainQuest('q_plant');
    expect(second.ok).toBe(false);
    expect(second.message).toMatch(/already/i);
  });

  it('does not allow claiming an incomplete quest', () => {
    const state = makeState();
    const result = state.claimMainQuest('q_plant');
    expect(result.ok).toBe(false);
  });

  it('awards achievements once and grants bonus coins', () => {
    const state = makeState();
    const coins = state.data.coins;
    state.data.stats.harvests = 1;
    state.checkAchievements();
    expect(state.data.achievements).toContain('a_first');
    const afterFirst = state.data.coins;
    expect(afterFirst).toBeGreaterThan(coins);

    state.checkAchievements();
    expect(state.data.achievements.filter((id) => id === 'a_first')).toHaveLength(1);
    expect(state.data.coins).toBe(afterFirst);
  });

  it('tracks and claims daily quests based on the day-start snapshot', () => {
    const state = makeState();
    const template = DAILY_TEMPLATES.find((entry) => entry.id === 'd_harvest')!;
    const daily: DailySave = {
      day: state.data.day,
      list: [{ id: template.id, target: template.target, coins: template.coins, xp: template.xp, claimed: false }],
      startStats: { ...state.data.stats }
    };
    state.data.daily = daily;

    state.data.stats.harvests = template.target;
    const progress = state.dailyState(template.id);
    expect(progress?.complete).toBe(true);

    const first = state.claimDailyQuest(template.id);
    expect(first.ok).toBe(true);
    expect(state.data.daily?.list[0].claimed).toBe(true);

    const second = state.claimDailyQuest(template.id);
    expect(second.ok).toBe(false);
  });

  it('provides a full main quest chain reaching level 10', () => {
    expect(MAIN_QUESTS.length).toBeGreaterThanOrEqual(10);
    expect(MAIN_QUESTS.some((quest) => quest.metric === 'level' && quest.target === 10)).toBe(true);
  });
});

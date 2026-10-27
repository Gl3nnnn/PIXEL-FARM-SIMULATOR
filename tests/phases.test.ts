import { describe, expect, it } from 'vitest';
import { COLLECTION_SETS, DAYS_PER_SEASON, ITEMS, TILE } from '../src/data/definitions';
import { makeState, findBuildSpot } from './helpers';

describe('collection album', () => {
  it('records items as they enter the inventory and pays milestones once', () => {
    const state = makeState(() => 0.5);
    const crops = COLLECTION_SETS.find((set) => set.id === 'crops')!;
    for (const itemId of crops.itemIds) state.addItem(itemId, 1);

    const info = state.collectionState().sets.find((set) => set.def.id === 'crops')!;
    expect(info.found).toBe(crops.itemIds.length);
    expect(info.complete).toBe(true);

    const coins = state.data.coins;
    const final = crops.milestones[crops.milestones.length - 1];
    expect(state.claimCollectionMilestone('crops', final.id).ok).toBe(true);
    expect(state.data.coins).toBe(coins + final.coins);
    expect(state.data.collection.claimedRewards).toContain(final.id);
    expect(state.claimCollectionMilestone('crops', final.id).ok).toBe(false);
  });

  it('tracks quality variants for a collected item', () => {
    const state = makeState(() => 0.5);
    state.addItem('wheat', 1, 'normal');
    state.addItem('wheat', 1, 'gold');
    const entry = state.data.collection.entries.find((item) => item.itemId === 'wheat');
    expect(entry?.qualities).toEqual(['normal', 'gold']);
  });
});

describe('automation helpers', () => {
  it('requires the cottage and level before hiring', () => {
    const state = makeState(() => 0.5);
    state.data.coins = 100000;
    expect(state.buyAutomation('auto_collect').ok).toBe(false);

    state.data.xp.farming = 2000;
    const spot = findBuildSpot(state, 'helper_hut');
    expect(state.build('helper_hut', spot.x, spot.y).ok).toBe(true);
    expect(state.hasHelperHut()).toBe(true);

    expect(state.buyAutomation('auto_collect').ok).toBe(true);
    expect(state.automationState('auto_collect')).toMatchObject({ purchased: true, enabled: true });

    expect(state.toggleAutomation('auto_collect').ok).toBe(true);
    expect(state.automationState('auto_collect')?.enabled).toBe(false);
    expect(state.toggleAutomation('auto_collect').ok).toBe(true);
    expect(state.automationState('auto_collect')?.enabled).toBe(true);
  });
});

describe('festival day', () => {
  it('opens on day 28, judges entries and awards a ribbon', () => {
    const state = makeState(() => 0.5);
    state.data.day = DAYS_PER_SEASON;
    state.ensureFestivalDay();
    for (const itemId of ['sunflowers', 'strawberries', 'cabbage']) {
      state.addItem(itemId, 1);
    }
    const before = state.data.coins;
    expect(state.festivalAvailable()).toBe(true);
    expect(state.festivalState()?.selection.totalItems).toBe(3);

    const result = state.submitFestival();
    expect(result.ok).toBe(true);
    expect(state.data.festival?.submitted).toBe(true);
    expect(state.data.festival?.tier).toBe('bronze');

    expect(state.claimFestivalReward().ok).toBe(true);
    expect(state.data.coins).toBe(before + 300);
    expect(state.data.ribbons).toContain('ribbon_spring_bronze');
    expect(state.claimFestivalReward().ok).toBe(false);
  });

  it('does not hold judging on ordinary days', () => {
    const state = makeState();
    state.ensureFestivalDay();
    expect(state.festivalAvailable()).toBe(false);
    expect(state.submitFestival().ok).toBe(false);
  });
});

describe('fishing', () => {
  it('consumes bait, catches a seasonal fish and grants fishing XP', () => {
    const state = makeState(() => 0.5);
    state.addItem('fishing_rod', 1);
    state.addItem('bait', 2);
    const cast = state.registerFishingCast();
    expect(cast.ok).toBe(true);
    expect(cast.baitUsed).toBe(true);
    expect(state.countItem('bait')).toBe(1);
    expect(state.data.stats.fishingCasts).toBe(1);

    const caught = state.catchFish();
    expect(caught.ok).toBe(true);
    expect(caught.fishId).toBeTruthy();
    expect(state.data.stats.fishCaught).toBe(1);
    expect(state.data.xp.fishing).toBeGreaterThan(0);
    expect(ITEMS[caught.fishId!]?.type).toBe('fish');
  });
});

describe('mining', () => {
  it('breaks a quarry node, yields loot and respawns after two days', () => {
    const state = makeState(() => 0.5);
    state.addItem('pickaxe', 1);
    state.setPlayer(37 * TILE, 27 * TILE, 'down');

    expect(state.mineNode('q1').ok).toBe(true);
    expect(state.mineNode('q1').ok).toBe(true);
    const final = state.mineNode('q1');
    expect(final.ok).toBe(true);
    expect(final.broke).toBe(true);
    expect(state.data.stats.rocksMined).toBe(1);
    expect(state.data.mineNodes.q1?.hp).toBe(0);
    expect(state.data.mineNodes.q1?.respawnDay).toBe(state.today + 2);

    state.data.day += 2;
    expect(state.mineNodeState('q1')?.hp).toBe(3);
  });
});

describe('npc relationships', () => {
  it('talks, gives gifts, tracks hearts and allows marriage', () => {
    const state = makeState(() => 0.5);
    state.data.minute = 10 * 60;
    state.addItem('sunflowers', 1);

    const talk = state.npcTalk('mira');
    expect(talk.ok).toBe(true);
    expect(state.data.npcs.mira?.met).toBe(true);
    expect(state.data.npcs.mira?.friendship).toBe(8);

    const gift = state.giftNpc('mira', 'sunflowers');
    expect(gift.ok).toBe(true);
    expect(state.data.npcs.mira?.friendship).toBe(88);
    expect(state.data.npcs.mira?.giftedDay).toBe(state.today);

    expect(state.marryNpc('mira').ok).toBe(false);
    state.data.npcs.mira!.friendship = 1000;
    expect(state.npcList().find((entry) => entry.npc.id === 'mira')?.hearts).toBe(10);
    expect(state.marryNpc('mira').ok).toBe(true);
    expect(state.spouseName).toBe('Mira');
  });

  it('generates and completes a weekly request once per week', () => {
    const state = makeState(() => 0.5);
    state.data.minute = 10 * 60;
    const entry = state.npcList().find((item) => item.npc.id === 'mira')!;
    expect(entry.request.completed).toBe(false);

    state.addItem(entry.request.itemId, entry.request.qty);
    const before = state.data.coins;
    const result = state.completeNpcRequest('mira');
    expect(result.ok).toBe(true);
    expect(state.data.coins).toBe(before + entry.request.coins);
    expect(state.data.npcs.mira?.requestWeek).toBe(entry.request.week);
    expect(state.completeNpcRequest('mira').ok).toBe(false);

    const nextWeek = state.npcList().find((item) => item.npc.id === 'mira')!;
    expect(nextWeek.request.completed).toBe(true);
    state.data.day += 7;
    expect(state.npcList().find((item) => item.npc.id === 'mira')?.request.completed).toBe(false);
  });
});

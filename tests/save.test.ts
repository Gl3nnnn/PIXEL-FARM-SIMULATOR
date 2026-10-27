import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, CURRENT_SAVE_VERSION } from '../src/data/definitions';
import { createNewSave } from '../src/systems/gameState';
import { generateSeasonal } from '../src/systems/festivals';
import {
  MAX_SAVE_FILE_BYTES,
  deserializeSave,
  exportSaveText,
  importSaveText,
  loadSettings,
  migrateSave,
  sanitizeSave,
  saveSettings,
  serializeSave
} from '../src/systems/save';

describe('saves', () => {
  it('round-trips a save through serialization', () => {
    const save = createNewSave();
    save.coins = 1234;
    save.day = 9;
    save.season = 'fall';
    save.stats.harvests = 42;
    const restored = deserializeSave(serializeSave(save));
    expect(restored.coins).toBe(1234);
    expect(restored.day).toBe(9);
    expect(restored.season).toBe('fall');
    expect(restored.stats.harvests).toBe(42);
    expect(restored.version).toBe(CURRENT_SAVE_VERSION);
  });

  it('migrates v1 inventories to the quality-aware format', () => {
    const migrated = migrateSave({
      version: 1,
      coins: 123,
      day: 2,
      season: 'summer',
      player: { x: 100, y: 200, facing: 'left' },
      inventory: [
        { id: 'wheat_seed', quantity: 5 },
        { itemId: 'hoe', qty: 1 }
      ]
    });
    expect(migrated.version).toBe(CURRENT_SAVE_VERSION);
    expect(migrated.coins).toBe(123);
    expect(migrated.season).toBe('summer');
    expect(migrated.player).toEqual({ x: 100, y: 200, facing: 'left' });
    expect(migrated.inventory[0]).toEqual({ itemId: 'wheat_seed', qty: 5, quality: 'normal' });
    expect(migrated.inventory[1]).toEqual({ itemId: 'hoe', qty: 1, quality: 'normal' });
  });

  it('migrates v2 saves with no seasonal board', () => {
    const migrated = migrateSave({
      version: 2,
      coins: 10,
      day: 1,
      season: 'winter',
      player: { x: 100, y: 200, facing: 'down' }
    });
    expect(migrated.version).toBe(CURRENT_SAVE_VERSION);
    expect(migrated.seasonal).toBeNull();
  });

  it('round-trips seasonal board progress', () => {
    const save = createNewSave();
    save.seasonal = generateSeasonal('fall', 1, save.stats);
    save.seasonal.list[0].claimed = true;

    const restored = deserializeSave(serializeSave(save));
    expect(restored.seasonal?.season).toBe('fall');
    expect(restored.seasonal?.year).toBe(1);
    expect(restored.seasonal?.list[0].claimed).toBe(true);
    expect(restored.seasonal?.bonusCoins).toBe(700);
  });

  it('drops invalid seasonal boards and clamps valid fields', () => {
    const invalid = sanitizeSave({
      seasonal: { season: 'monsoon', list: [], startStats: {} }
    });
    expect(invalid.seasonal).toBeNull();

    const repaired = sanitizeSave({
      seasonal: {
        season: 'winter',
        year: 0,
        list: [
          { id: 's_winter_craft', target: -2, coins: -5, xp: -1, claimed: 'no' },
          { id: '', target: 3 }
        ],
        startStats: { harvests: -4 },
        bonusCoins: -5,
        bonusXp: -1
      }
    });
    expect(repaired.seasonal).toMatchObject({
      season: 'winter',
      year: 1,
      bonusCoins: 0,
      bonusXp: 0,
      bonusClaimed: false
    });
    expect(repaired.seasonal?.list).toHaveLength(1);
    expect(repaired.seasonal?.list[0]).toMatchObject({
      id: 's_winter_craft',
      target: 1,
      coins: 0,
      xp: 0,
      claimed: false
    });
    expect(repaired.seasonal?.startStats.harvests).toBe(0);
  });

  it('repairs and clamps invalid save values', () => {
    const repaired = sanitizeSave({
      coins: -50,
      day: 99,
      minute: 5000,
      season: 'monsoon',
      weather: 'meteor',
      player: { x: 'nope', y: null, facing: 'sideways' },
      inventory: [{ itemId: 'wheat_seed', qty: 'x', quality: 'legendary' }, null, 42]
    });
    expect(repaired.coins).toBe(0);
    expect(repaired.day).toBe(28);
    expect(repaired.minute).toBe(1439);
    expect(repaired.season).toBe('spring');
    expect(repaired.weather).toBe('sunny');
    expect(repaired.player.facing).toBe('down');
    expect(repaired.player.x).toBe(6 * 32);
    expect(repaired.inventory).toHaveLength(3);
    expect(repaired.inventory[1]).toBeNull();
    expect(repaired.inventory[2]).toBeNull();
    expect(repaired.inventory[0]?.quality).toBe('normal');
  });

  it('falls back to defaults for an empty save object', () => {
    const empty = sanitizeSave({});
    expect(empty.coins).toBe(250);
    expect(empty.day).toBe(1);
    expect(empty.season).toBe('spring');
    expect(empty.unlockedPlots).toBe(1);
    expect(empty.farmhouseLevel).toBe(1);
    expect(empty.inventory).toEqual([]);
  });

  it('round-trips a human-readable export through import', () => {
    const save = createNewSave();
    save.coins = 9876;
    save.day = 12;
    save.season = 'winter';
    const text = exportSaveText(save);
    expect(text).toContain('\n');

    const imported = importSaveText(text);
    expect(imported.coins).toBe(9876);
    expect(imported.day).toBe(12);
    expect(imported.season).toBe('winter');
  });

  it('migrates older backups on import', () => {
    const imported = importSaveText(
      JSON.stringify({
        version: 1,
        coins: 50,
        day: 3,
        season: 'fall',
        player: { x: 100, y: 200, facing: 'left' },
        inventory: [{ id: 'wheat_seed', quantity: 2 }]
      })
    );
    expect(imported.version).toBe(CURRENT_SAVE_VERSION);
    expect(imported.coins).toBe(50);
    expect(imported.season).toBe('fall');
    expect(imported.inventory[0]).toEqual({ itemId: 'wheat_seed', qty: 2, quality: 'normal' });
  });

  it('rejects invalid, foreign, oversized, and newer save files', () => {
    expect(() => importSaveText('')).toThrow(/empty/i);
    expect(() => importSaveText('{not json')).toThrow(/valid JSON/i);
    expect(() => importSaveText('[]')).toThrow(/not valid/i);
    expect(() => importSaveText('{"hello":"world"}')).toThrow(/does not look like/i);
    expect(() => importSaveText('x'.repeat(MAX_SAVE_FILE_BYTES + 1))).toThrow(/too large/i);
    expect(() =>
      importSaveText(
        JSON.stringify({ version: CURRENT_SAVE_VERSION + 1, player: {}, coins: 1 })
      )
    ).toThrow(/newer version/i);
  });

  it('persists and validates settings', () => {
    localStorage.clear();
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
    saveSettings({ music: true, sfx: false, volume: 0.85 });
    expect(loadSettings()).toEqual({ music: true, sfx: false, volume: 0.85 });

    localStorage.setItem('pfs:settings', '{not valid json');
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });
});

describe('phase save data', () => {
  it('round-trips collection, automation, festivals, quarry and npc state', () => {
    const save = createNewSave();
    save.collection.entries.push({ itemId: 'wheat', qualities: ['normal', 'gold'] });
    save.collection.claimedRewards.push('crops_1');
    save.automation.purchased.push('auto_collect');
    save.automation.disabled.push('auto_collect');
    save.festival = {
      season: 'spring',
      year: 1,
      submitted: true,
      score: 290,
      tier: 'silver',
      claimed: true
    };
    save.ribbons.push('ribbon_spring_silver');
    save.mineNodes.q1 = { hp: 0, respawnDay: 12 };
    save.npcs.mira = { id: 'mira', friendship: 640, talkedDay: 3, giftedDay: 2, met: true, requestWeek: 4 };
    save.spouseId = 'mira';

    const restored = deserializeSave(serializeSave(save));
    expect(restored.collection.entries[0]).toEqual({ itemId: 'wheat', qualities: ['normal', 'gold'] });
    expect(restored.collection.claimedRewards).toContain('crops_1');
    expect(restored.automation).toEqual({ purchased: ['auto_collect'], disabled: ['auto_collect'] });
    expect(restored.festival).toMatchObject({ score: 290, tier: 'silver', claimed: true });
    expect(restored.ribbons).toContain('ribbon_spring_silver');
    expect(restored.mineNodes.q1).toEqual({ hp: 0, respawnDay: 12 });
    expect(restored.npcs.mira).toMatchObject({ friendship: 640, met: true });
    expect(restored.spouseId).toBe('mira');
  });

  it('sanitizes invalid phase data safely', () => {
    const repaired = sanitizeSave({
      collection: {
        entries: [
          { itemId: 'wheat', qualities: ['gold', 'legendary'] },
          { itemId: '', qualities: [] }
        ],
        claimedRewards: ['crops_1', '']
      },
      automation: { purchased: ['auto_collect', 'bogus'], disabled: ['bogus'] },
      festival: { season: 'monsoon', year: -1, score: -4, tier: 'platinum' },
      ribbons: ['ribbon_spring_silver', 'bogus'],
      mineNodes: { q1: { hp: 99, respawnDay: -3 }, bogus: { hp: 1 } },
      npcs: {
        mira: { id: 'mira', friendship: 5000, talkedDay: -2, giftedDay: -1, met: 'yes', requestWeek: -5 },
        bogus: { id: 'bogus', friendship: 10 }
      },
      spouseId: 'bogus'
    });
    expect(repaired.collection.entries).toHaveLength(1);
    expect(repaired.collection.entries[0].qualities).toEqual(['gold']);
    expect(repaired.automation.purchased).toEqual(['auto_collect']);
    expect(repaired.festival).toBeNull();
    expect(repaired.ribbons).toEqual(['ribbon_spring_silver']);
    expect(repaired.mineNodes.q1?.hp).toBe(3);
    expect(repaired.mineNodes.q1?.respawnDay).toBe(0);
    expect(repaired.npcs.mira).toMatchObject({
      friendship: 1000,
      talkedDay: 0,
      met: false,
      requestWeek: 0
    });
    expect(repaired.npcs.bogus).toBeUndefined();
    expect(repaired.spouseId).toBeNull();
  });

  it('migrates version 3 saves with empty phase state', () => {
    const migrated = migrateSave({
      version: 3,
      coins: 10,
      day: 1,
      season: 'winter',
      player: { x: 100, y: 200, facing: 'down' }
    });
    expect(migrated.version).toBe(CURRENT_SAVE_VERSION);
    expect(migrated.collection).toEqual({ entries: [], claimedRewards: [] });
    expect(migrated.automation).toEqual({ purchased: [], disabled: [] });
    expect(migrated.festival).toBeNull();
    expect(migrated.mineNodes).toEqual({});
    expect(migrated.npcs).toEqual({});
    expect(migrated.spouseId).toBeNull();
  });
});

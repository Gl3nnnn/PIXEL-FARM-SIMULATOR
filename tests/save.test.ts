import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, CURRENT_SAVE_VERSION } from '../src/data/definitions';
import { createNewSave } from '../src/systems/gameState';
import {
  deserializeSave,
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

  it('persists and validates settings', () => {
    localStorage.clear();
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
    saveSettings({ music: true, sfx: false, volume: 0.85 });
    expect(loadSettings()).toEqual({ music: true, sfx: false, volume: 0.85 });

    localStorage.setItem('pfs:settings', '{not valid json');
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });
});

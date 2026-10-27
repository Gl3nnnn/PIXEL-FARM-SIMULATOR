import { CURRENT_SAVE_VERSION, DEFAULT_SETTINGS, levelFromXp } from '../data/definitions';
import type { InventoryStack, Quality, SaveData, SaveSlotInfo, Settings } from '../types';

const DB_NAME = 'pixel-farm-simulator';
const DB_STORE = 'saves';
const DB_VERSION = 1;
const LAST_SLOT_KEY = 'pfs:lastSlot';
const SETTINGS_KEY = 'pfs:settings';
export const SLOT_COUNT = 3;

interface StoredRecord {
  slot: number;
  data: SaveData;
}

function hasIndexedDB(): boolean {
  try {
    return typeof indexedDB !== 'undefined' && indexedDB !== null;
  } catch {
    return false;
  }
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!hasIndexedDB()) {
      reject(new Error('IndexedDB is not available in this browser.'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(DB_STORE)) {
        db.createObjectStore(DB_STORE, { keyPath: 'slot' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open save database.'));
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('Save transaction failed.'));
    tx.onabort = () => reject(tx.error ?? new Error('Save transaction aborted.'));
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toFinite(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function toBool(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

/** Upgrades older save shapes. Exported for tests. */
export function migrateSave(raw: unknown): SaveData {
  if (!isRecord(raw)) throw new Error('Save data is not an object.');
  const data: Record<string, unknown> = { ...raw };
  const version = toFinite(data.version, 1);

  if (version < 2) {
    // v1 stored inventory as a plain list of { itemId, qty } with no quality.
    if (Array.isArray(data.inventory)) {
      data.inventory = (data.inventory as unknown[]).map((entry) => {
        if (!isRecord(entry)) return null;
        return {
          itemId: String(entry.itemId ?? entry.id ?? ''),
          qty: Math.max(1, toFinite(entry.qty ?? entry.quantity, 1)),
          quality: 'normal'
        };
      });
    }
    if (!isRecord(data.upgrades)) data.upgrades = { hoe: 0, can: 0, boots: 0, backpack: 0 };
    if (!isRecord(data.xp)) data.xp = { farming: 0, animal: 0, crafting: 0, business: 0 };
    if (!Array.isArray(data.claimedQuests)) data.claimedQuests = [];
    if (!Array.isArray(data.achievements)) data.achievements = [];
    if (typeof data.tutorialDone !== 'boolean') data.tutorialDone = false;
    if (typeof data.tutorialStep !== 'number') data.tutorialStep = 0;
    data.version = 2;
  }

  data.version = CURRENT_SAVE_VERSION;
  return sanitizeSave(data);
}

/** Repairs and validates a save object, filling defaults and clamping values. */
export function sanitizeSave(raw: Record<string, unknown>): SaveData {
  const now = Date.now();
  const d = raw as Partial<SaveData> & Record<string, unknown>;
  const inventory: (InventoryStack | null)[] = Array.isArray(d.inventory)
    ? d.inventory.map((entry) => {
        if (!isRecord(entry)) return null;
        const itemId = typeof entry.itemId === 'string' ? entry.itemId : '';
        if (!itemId) return null;
        const quality: Quality =
          entry.quality === 'silver' || entry.quality === 'gold' ? entry.quality : 'normal';
        return {
          itemId,
          qty: Math.max(0, Math.floor(toFinite(entry.qty, 0))),
          quality
        };
      })
    : [];

  const stats: Record<string, unknown> = isRecord(d.stats) ? d.stats : {};
  const seasons = ['spring', 'summer', 'fall', 'winter'] as const;
  const weathers = ['sunny', 'cloudy', 'rain', 'storm'] as const;
  const facings = ['down', 'up', 'left', 'right'] as const;
  const playerRecord: Record<string, unknown> = isRecord(d.player) ? d.player : {};
  const facingValue = playerRecord.facing;

  const save: SaveData = {
    version: CURRENT_SAVE_VERSION,
    createdAt: toFinite(d.createdAt, now),
    savedAt: toFinite(d.savedAt, now),
    player: {
      x: toFinite(playerRecord.x, 6 * 32),
      y: toFinite(playerRecord.y, 7 * 32),
      facing: facings.includes(facingValue as never)
        ? (facingValue as SaveData['player']['facing'])
        : 'down'
    },
    coins: Math.max(0, Math.floor(toFinite(d.coins, 250))),
    day: Math.min(28, Math.max(1, Math.floor(toFinite(d.day, 1)))),
    season: seasons.includes(d.season as never) ? (d.season as SaveData['season']) : 'spring',
    year: Math.max(1, Math.floor(toFinite(d.year, 1))),
    minute: Math.min(1439, Math.max(0, Math.floor(toFinite(d.minute, 360)))),
    weather: weathers.includes(d.weather as never)
      ? (d.weather as SaveData['weather'])
      : 'sunny',
    tiles: isRecord(d.tiles) ? (d.tiles as SaveData['tiles']) : {},
    buildings: Array.isArray(d.buildings)
      ? d.buildings.filter((b): b is SaveData['buildings'][number] => isRecord(b) && typeof b.id === 'string')
      : [],
    animals: Array.isArray(d.animals)
      ? d.animals.filter((a): a is SaveData['animals'][number] => isRecord(a) && typeof a.species === 'string')
      : [],
    inventory,
    unlockedPlots: Math.max(1, Math.floor(toFinite(d.unlockedPlots, 1))),
    farmhouseLevel: Math.max(1, Math.floor(toFinite(d.farmhouseLevel, 1))),
    xp: {
      farming: Math.max(0, toFinite(isRecord(d.xp) ? d.xp.farming : 0, 0)),
      animal: Math.max(0, toFinite(isRecord(d.xp) ? d.xp.animal : 0, 0)),
      crafting: Math.max(0, toFinite(isRecord(d.xp) ? d.xp.crafting : 0, 0)),
      business: Math.max(0, toFinite(isRecord(d.xp) ? d.xp.business : 0, 0))
    },
    upgrades: {
      hoe: Math.max(0, Math.floor(toFinite(isRecord(d.upgrades) ? d.upgrades.hoe : 0, 0))),
      can: Math.max(0, Math.floor(toFinite(isRecord(d.upgrades) ? d.upgrades.can : 0, 0))),
      boots: Math.max(0, Math.floor(toFinite(isRecord(d.upgrades) ? d.upgrades.boots : 0, 0))),
      backpack: Math.max(0, Math.floor(toFinite(isRecord(d.upgrades) ? d.upgrades.backpack : 0, 0)))
    },
    stats: {
      harvests: Math.max(0, toFinite(stats.harvests, 0)),
      cropsSold: Math.max(0, toFinite(stats.cropsSold, 0)),
      productsCollected: Math.max(0, toFinite(stats.productsCollected, 0)),
      coinsEarned: Math.max(0, toFinite(stats.coinsEarned, 0)),
      buildingsBuilt: Math.max(0, toFinite(stats.buildingsBuilt, 0)),
      crafts: Math.max(0, toFinite(stats.crafts, 0)),
      waters: Math.max(0, toFinite(stats.waters, 0)),
      tills: Math.max(0, toFinite(stats.tills, 0)),
      planted: Math.max(0, toFinite(stats.planted, 0)),
      animalsOwned: Math.max(0, toFinite(stats.animalsOwned, 0)),
      goldHarvests: Math.max(0, toFinite(stats.goldHarvests, 0)),
      daysPlayed: Math.max(0, toFinite(stats.daysPlayed, 0)),
      carrotsHarvested: Math.max(0, toFinite(stats.carrotsHarvested, 0)),
      eggsCollected: Math.max(0, toFinite(stats.eggsCollected, 0))
    },
    claimedQuests: Array.isArray(d.claimedQuests)
      ? d.claimedQuests.filter((q): q is string => typeof q === 'string')
      : [],
    achievements: Array.isArray(d.achievements)
      ? d.achievements.filter((q): q is string => typeof q === 'string')
      : [],
    daily: isRecord(d.daily) && Array.isArray(d.daily.list)
      ? (d.daily as unknown as SaveData['daily'])
      : null,
    tutorialStep: Math.max(0, Math.floor(toFinite(d.tutorialStep, 0))),
    tutorialDone: toBool(d.tutorialDone, false),
    selectedItemId: typeof d.selectedItemId === 'string' ? d.selectedItemId : 'hoe'
  };

  return save;
}

export function serializeSave(data: SaveData): string {
  return JSON.stringify(data);
}

export function deserializeSave(text: string): SaveData {
  const parsed: unknown = JSON.parse(text);
  return migrateSave(parsed);
}

export class SaveManager {
  static available(): boolean {
    return hasIndexedDB();
  }

  static async save(slot: number, data: SaveData): Promise<void> {
    const db = await openDb();
    const record: StoredRecord = { slot, data: { ...data, savedAt: Date.now() } };
    const tx = db.transaction(DB_STORE, 'readwrite');
    tx.objectStore(DB_STORE).put(record);
    await txDone(tx);
    db.close();
    localStorage.setItem(LAST_SLOT_KEY, String(slot));
  }

  static async load(slot: number): Promise<SaveData | null> {
    const db = await openDb();
    const tx = db.transaction(DB_STORE, 'readonly');
    const request = tx.objectStore(DB_STORE).get(slot);
    const result = await new Promise<StoredRecord | undefined>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result as StoredRecord | undefined);
      request.onerror = () => reject(request.error);
    });
    await txDone(tx);
    db.close();
    if (!result || !result.data) return null;
    return migrateSave(result.data);
  }

  static async listSlots(): Promise<SaveSlotInfo[]> {
    const slots: SaveSlotInfo[] = [];
    if (!hasIndexedDB()) {
      for (let i = 1; i <= SLOT_COUNT; i++) slots.push({ slot: i, exists: false });
      return slots;
    }
    let records: StoredRecord[] = [];
    try {
      const db = await openDb();
      const tx = db.transaction(DB_STORE, 'readonly');
      const request = tx.objectStore(DB_STORE).getAll();
      records = await new Promise<StoredRecord[]>((resolve, reject) => {
        request.onsuccess = () => resolve((request.result as StoredRecord[]) ?? []);
        request.onerror = () => reject(request.error);
      });
      await txDone(tx);
      db.close();
    } catch {
      records = [];
    }
    for (let i = 1; i <= SLOT_COUNT; i++) {
      const rec = records.find((r) => r.slot === i);
      if (!rec) {
        slots.push({ slot: i, exists: false });
      } else {
        let data = rec.data;
        try {
          data = migrateSave(rec.data);
        } catch {
          /* keep raw */
        }
        slots.push({
          slot: i,
          exists: true,
          savedAt: data.savedAt,
          day: data.day,
          season: data.season,
          year: data.year,
          coins: data.coins,
          level: levelFromXp(
            Object.values(data.xp ?? {}).reduce((a, b) => a + (b ?? 0), 0) as number
          )
        });
      }
    }
    return slots;
  }

  static async remove(slot: number): Promise<void> {
    const db = await openDb();
    const tx = db.transaction(DB_STORE, 'readwrite');
    tx.objectStore(DB_STORE).delete(slot);
    await txDone(tx);
    db.close();
  }

  static lastSlot(): number | null {
    const raw = localStorage.getItem(LAST_SLOT_KEY);
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) && n >= 1 && n <= SLOT_COUNT ? n : null;
  }
}

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return {
      music: typeof parsed.music === 'boolean' ? parsed.music : DEFAULT_SETTINGS.music,
      sfx: typeof parsed.sfx === 'boolean' ? parsed.sfx : DEFAULT_SETTINGS.sfx,
      volume:
        typeof parsed.volume === 'number' && parsed.volume >= 0 && parsed.volume <= 1
          ? parsed.volume
          : DEFAULT_SETTINGS.volume
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* storage unavailable */
  }
}

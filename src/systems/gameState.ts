import {
  ANIMALS,
  BUILDINGS,
  CROPS,
  CURRENT_SAVE_VERSION,
  DAYS_PER_SEASON,
  ITEMS,
  MAIN_QUESTS,
  MINUTES_PER_REAL_SECOND,
  PLOTS,
  QUALITY_MULTIPLIER,
  RECIPES,
  SEASONS,
  SEASON_INFO,
  SEED_IDS,
  START_MINUTE,
  TILE,
  UPGRADES,
  WORLD_H,
  WORLD_W,
  cropForSeed,
  levelFromXp,
  xpProgress
} from '../data/definitions';
import type {
  ActionResult,
  AnimalSave,
  BuildingSave,
  Quality,
  QuestDef,
  SaveData,
  Season,
  SkillKey,
  Stats,
  TileSave,
  Weather
} from '../types';
import {
  functionalBuildingCount,
  generateDaily,
  metricValue,
  overallLevel,
  dailyProgress,
  isQuestComplete
} from './quests';
import { marketMultiplier } from './market';
import {
  inBounds,
  isObstacleTile,
  isPathTile,
  isUnlockedTile,
  isWaterTile,
  plotIndexAt,
  tileToWorld
} from './world';
import { clamp, pick, randomInt, tileKey, uid } from './util';

export const BASE_CAPACITY = 24;

const EMPTY_STATS: Stats = {
  harvests: 0,
  cropsSold: 0,
  productsCollected: 0,
  coinsEarned: 0,
  buildingsBuilt: 0,
  crafts: 0,
  waters: 0,
  tills: 0,
  planted: 0,
  animalsOwned: 0,
  goldHarvests: 0,
  daysPlayed: 0,
  carrotsHarvested: 0,
  eggsCollected: 0
};

type Handler = (payload?: unknown) => void;

export class Emitter {
  private handlers = new Map<string, Set<Handler>>();

  on(event: string, fn: Handler): () => void {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(fn);
    return () => this.off(event, fn);
  }

  off(event: string, fn: Handler): void {
    this.handlers.get(event)?.delete(fn);
  }

  emit(event: string, payload?: unknown): void {
    this.handlers.get(event)?.forEach((fn) => fn(payload));
  }
}

export function createNewSave(): SaveData {
  const inventory: SaveData['inventory'] = Array.from({ length: BASE_CAPACITY }, () => null);
  inventory[0] = { itemId: 'hoe', qty: 1, quality: 'normal' };
  inventory[1] = { itemId: 'watering_can', qty: 1, quality: 'normal' };
  inventory[2] = { itemId: 'wheat_seed', qty: 8, quality: 'normal' };
  inventory[3] = { itemId: 'carrot_seed', qty: 5, quality: 'normal' };
  inventory[4] = { itemId: 'fertilizer', qty: 3, quality: 'normal' };
  inventory[5] = { itemId: 'feed', qty: 4, quality: 'normal' };

  return {
    version: CURRENT_SAVE_VERSION,
    createdAt: Date.now(),
    savedAt: Date.now(),
    player: { x: 6 * TILE, y: 7 * TILE, facing: 'down' },
    coins: 400,
    day: 1,
    season: 'spring',
    year: 1,
    minute: START_MINUTE,
    weather: 'sunny',
    tiles: {},
    buildings: [{ uid: uid('b'), id: 'farmhouse', x: 4, y: 3 }],
    animals: [],
    inventory,
    unlockedPlots: 1,
    farmhouseLevel: 1,
    xp: { farming: 0, animal: 0, crafting: 0, business: 0 },
    upgrades: { hoe: 0, can: 0, boots: 0, backpack: 0 },
    stats: { ...EMPTY_STATS },
    claimedQuests: [],
    achievements: [],
    daily: null,
    tutorialStep: 0,
    tutorialDone: false,
    selectedItemId: 'hoe'
  };
}

export class GameState {
  data: SaveData;
  emitter = new Emitter();
  /** True while a menu is open; the world simulation is paused. */
  paused = false;
  rng: () => number;
  private checkingAchievements = false;
  private lastLevel = 1;

  constructor(data: SaveData, rng: () => number = Math.random) {
    this.data = data;
    this.rng = rng;
    this.ensureCapacity();
    this.lastLevel = this.level;
    if (!this.data.daily) {
      this.data.daily = generateDaily(this.data.day, this.data.stats, this.rng);
    }
  }

  // ---------------------------------------------------------------- getters

  get level(): number {
    return overallLevel(this.data);
  }

  get xpInfo() {
    return xpProgress(this.totalXp());
  }

  totalXp(): number {
    return (Object.values(this.data.xp) as number[]).reduce((a, b) => a + b, 0);
  }

  skillLevel(skill: SkillKey): number {
    return levelFromXp(this.data.xp[skill]);
  }

  hasGreenhouse(): boolean {
    return this.data.buildings.some((b) => b.id === 'greenhouse');
  }

  hasWorkshop(): boolean {
    return this.data.buildings.some((b) => b.id === 'workshop');
  }

  capacity(): number {
    const sheds = this.data.buildings.filter((b) => b.id === 'shed').length;
    return (
      BASE_CAPACITY +
      (this.data.upgrades.backpack ?? 0) * 6 +
      sheds * 24 +
      (this.data.farmhouseLevel - 1) * 4
    );
  }

  ensureCapacity(): void {
    const cap = this.capacity();
    while (this.data.inventory.length < cap) this.data.inventory.push(null);
  }

  countItem(itemId: string): number {
    return this.data.inventory.reduce(
      (sum, stack) => (stack && stack.itemId === itemId ? sum + stack.qty : sum),
      0
    );
  }

  countQuality(itemId: string, quality: Quality): number {
    return this.data.inventory.reduce(
      (sum, stack) =>
        stack && stack.itemId === itemId && stack.quality === quality ? sum + stack.qty : sum,
      0
    );
  }

  freeSpaceFor(itemId: string, quality: Quality = 'normal'): number {
    const def = ITEMS[itemId];
    if (!def) return 0;
    let space = 0;
    for (const stack of this.data.inventory) {
      if (!stack) space += def.stack;
      else if (stack.itemId === itemId && stack.quality === quality && stack.qty < def.stack) {
        space += def.stack - stack.qty;
      }
    }
    return space;
  }

  // -------------------------------------------------------------- inventory

  addItem(itemId: string, qty: number, quality: Quality = 'normal'): boolean {
    const def = ITEMS[itemId];
    if (!def || qty <= 0) return false;
    const amount = def.stack <= 1 ? 1 : Math.floor(qty);
    if (this.freeSpaceFor(itemId, quality) < amount) return false;

    let left = amount;
    for (const stack of this.data.inventory) {
      if (left <= 0) break;
      if (stack && stack.itemId === itemId && stack.quality === quality && stack.qty < def.stack) {
        const add = Math.min(def.stack - stack.qty, left);
        stack.qty += add;
        left -= add;
      }
    }
    for (let i = 0; i < this.data.inventory.length && left > 0; i++) {
      if (this.data.inventory[i] === null) {
        const add = Math.min(def.stack, left);
        this.data.inventory[i] = { itemId, qty: add, quality };
        left -= add;
      }
    }
    this.emitChange();
    return left === 0;
  }

  removeItem(itemId: string, qty: number, quality?: Quality): boolean {
    if (qty <= 0) return false;
    if (this.countItem(itemId) < qty) return false;
    if (quality && this.countQuality(itemId, quality) < qty) return false;
    let left = qty;
    const order: Quality[] = quality ? [quality] : ['normal', 'silver', 'gold'];
    for (const q of order) {
      for (let i = 0; i < this.data.inventory.length && left > 0; i++) {
        const stack = this.data.inventory[i];
        if (!stack || stack.itemId !== itemId || stack.quality !== q) continue;
        const take = Math.min(stack.qty, left);
        stack.qty -= take;
        left -= take;
        if (stack.qty <= 0) this.data.inventory[i] = null;
      }
    }
    this.emitChange();
    return left === 0;
  }

  hasItem(itemId: string, qty = 1): boolean {
    return this.countItem(itemId) >= qty;
  }

  hotbarItems(): string[] {
    const ids: string[] = ['hoe', 'watering_can'];
    if (this.hasItem('fertilizer')) ids.push('fertilizer');
    for (const seedId of SEED_IDS) {
      if (this.hasItem(seedId) && !ids.includes(seedId)) ids.push(seedId);
    }
    return ids.slice(0, 10);
  }

  selectedItem(): string {
    const usable = this.hotbarItems();
    if (usable.includes(this.data.selectedItemId)) return this.data.selectedItemId;
    return usable[0] ?? 'hoe';
  }

  selectItem(itemId: string): void {
    this.data.selectedItemId = itemId;
    this.emit('selection', itemId);
  }

  get upgrades() {
    return this.data.upgrades;
  }

  // -------------------------------------------------------------- tile state

  tileAt(x: number, y: number): TileSave | undefined {
    return this.data.tiles[tileKey(x, y)];
  }

  ensureTile(x: number, y: number): TileSave {
    const key = tileKey(x, y);
    if (!this.data.tiles[key]) {
      this.data.tiles[key] = { tilled: false, watered: false, fertilized: false };
    }
    return this.data.tiles[key];
  }

  cleanupTile(x: number, y: number): void {
    const key = tileKey(x, y);
    const t = this.data.tiles[key];
    if (!t) return;
    if (!t.tilled && !t.watered && !t.fertilized && !t.crop) delete this.data.tiles[key];
  }

  isFarmable(x: number, y: number): boolean {
    if (!inBounds(x, y)) return false;
    if (!isUnlockedTile(this.data, x, y)) return false;
    if (isWaterTile(x, y) || isObstacleTile(x, y) || isPathTile(x, y)) return false;
    return plotIndexAt(x, y) >= 0;
  }

  canPlantCrop(cropId: string): boolean {
    const def = CROPS[cropId];
    if (!def) return false;
    if (this.hasGreenhouse()) return true;
    return def.seasons.includes(this.data.season);
  }

  // ------------------------------------------------------------------- farm

  tillAt(cx: number, cy: number): ActionResult & { tiles: number } {
    const radius = this.data.upgrades.hoe ?? 0;
    let count = 0;
    for (let y = cy - radius; y <= cy + radius; y++) {
      for (let x = cx - radius; x <= cx + radius; x++) {
        if (!this.isFarmable(x, y)) continue;
        const tile = this.tileAt(x, y);
        if (tile?.tilled) continue;
        if (!this.isWithinInteraction(x, y)) continue;
        const t = this.ensureTile(x, y);
        t.tilled = true;
        this.data.stats.tills += 1;
        this.addXp('farming', 1, false);
        count += 1;
      }
    }
    if (count === 0) return { ok: false, tiles: 0, message: 'You can only till unlocked field soil.' };
    this.emitChange();
    this.emit('till', { x: cx, y: cy, tiles: count });
    this.checkProgress();
    return { ok: true, tiles: count };
  }

  waterAt(cx: number, cy: number): ActionResult & { tiles: number } {
    const radius = this.data.upgrades.can ?? 0;
    let count = 0;
    for (let y = cy - radius; y <= cy + radius; y++) {
      for (let x = cx - radius; x <= cx + radius; x++) {
        if (!inBounds(x, y) || !this.isWithinInteraction(x, y)) continue;
        const tile = this.tileAt(x, y);
        if (!tile || !tile.tilled || tile.watered) continue;
        tile.watered = true;
        this.data.stats.waters += 1;
        this.addXp('farming', 1, false);
        count += 1;
      }
    }
    if (count === 0) return { ok: false, tiles: 0, message: 'Nothing nearby needs water.' };
    this.emitChange();
    this.emit('water', { x: cx, y: cy, tiles: count });
    this.checkProgress();
    return { ok: true, tiles: count };
  }

  fertilizeAt(x: number, y: number): ActionResult {
    if (!this.isFarmable(x, y)) return { ok: false, message: 'Only field soil can be fertilized.' };
    if (!this.isWithinInteraction(x, y)) return { ok: false, message: 'Move closer.' };
    const tile = this.tileAt(x, y);
    if (!tile?.tilled) return { ok: false, message: 'Till the soil first.' };
    if (tile.fertilized) return { ok: false, message: 'This tile is already fertilized.' };
    if (!this.hasItem('fertilizer')) return { ok: false, message: 'You have no fertilizer.' };
    this.removeItem('fertilizer', 1);
    tile.fertilized = true;
    this.addXp('farming', 1, false);
    this.emitChange();
    return { ok: true, message: 'Fertilizer applied. Better harvests ahead!' };
  }

  plantAt(x: number, y: number, seedId: string): ActionResult {
    const cropDef = cropForSeed(seedId);
    if (!cropDef) return { ok: false, message: 'That is not a seed.' };
    if (!this.isFarmable(x, y)) return { ok: false, message: 'You can only plant in unlocked fields.' };
    if (!this.isWithinInteraction(x, y)) return { ok: false, message: 'Move closer to plant.' };
    const tile = this.tileAt(x, y);
    if (!tile?.tilled) return { ok: false, message: 'Till the soil first.' };
    if (tile.crop) return { ok: false, message: 'Something is already growing here.' };
    if (!this.canPlantCrop(cropDef.id)) {
      const seasons = cropDef.seasons.map((s) => SEASON_INFO[s].name).join(' or ');
      return { ok: false, message: `${cropDef.name} grows in ${seasons}. Build a greenhouse to plant it now.` };
    }
    if (!this.hasItem(seedId)) return { ok: false, message: 'You are out of those seeds.' };
    this.removeItem(seedId, 1);
    tile.crop = { id: cropDef.id, growth: 0, dryDays: 0, regrows: 0 };
    this.data.stats.planted += 1;
    this.addXp('farming', 2, false);
    this.emitChange();
    this.emit('plant', { x, y, cropId: cropDef.id });
    this.checkProgress();
    return { ok: true, message: `${cropDef.name} planted. Water it before you sleep!` };
  }

  cropMature(x: number, y: number): boolean {
    const tile = this.tileAt(x, y);
    if (!tile?.crop) return false;
    const def = CROPS[tile.crop.id];
    return !!def && tile.crop.growth >= def.growthDays;
  }

  harvestAt(x: number, y: number): ActionResult & { items?: number } {
    if (!this.isWithinInteraction(x, y)) return { ok: false, message: 'Move closer to harvest.' };
    const tile = this.tileAt(x, y);
    if (!tile?.crop) return { ok: false, message: 'Nothing to harvest here.' };
    const def = CROPS[tile.crop.id];
    if (!def) return { ok: false, message: 'Unknown crop.' };
    if (tile.crop.growth < def.growthDays) {
      return { ok: false, message: `${def.name} is still growing (${tile.crop.growth}/${def.growthDays} days).` };
    }

    const quality = this.rollQuality(tile);
    const yieldQty = randomInt(def.yieldMin, def.yieldMax, this.rng);
    if (this.freeSpaceFor(def.harvestId, quality) < yieldQty) {
      return { ok: false, message: 'Your inventory is full!' };
    }
    this.addItem(def.harvestId, yieldQty, quality);
    this.data.stats.harvests += 1;
    if (def.id === 'carrots') this.data.stats.carrotsHarvested += yieldQty;
    if (quality === 'gold') this.data.stats.goldHarvests += 1;
    this.addXp('farming', 6 + yieldQty, false);

    if (def.regrowDays > 0) {
      tile.crop.growth = Math.max(0, def.growthDays - def.regrowDays);
      tile.crop.regrows += 1;
      tile.crop.dryDays = 0;
      tile.watered = false;
      tile.fertilized = false;
    } else {
      tile.crop = undefined;
      tile.watered = false;
      tile.fertilized = false;
      this.cleanupTile(x, y);
    }

    const label = quality === 'normal' ? '' : ` ${quality}`;
    this.emitChange();
    this.emit('harvest', { x, y, cropId: def.id, qty: yieldQty, quality });
    this.checkProgress();
    return {
      ok: true,
      items: yieldQty,
      message: `Harvested ${yieldQty} ${def.name}${label}!`
    };
  }

  private rollQuality(tile: TileSave): Quality {
    const level = levelFromXp(this.data.xp.farming);
    const fert = tile.fertilized ? 0.16 : 0;
    const goldChance = 0.02 + fert + level * 0.008;
    const silverChance = 0.2 + fert * 1.4 + level * 0.015;
    const roll = this.rng();
    if (roll < goldChance) return 'gold';
    if (roll < goldChance + silverChance) return 'silver';
    return 'normal';
  }

  // ---------------------------------------------------------------- economy

  buyItem(itemId: string, qty: number): ActionResult {
    const def = ITEMS[itemId];
    if (!def) return { ok: false, message: 'Unknown item.' };
    if (qty <= 0 || !Number.isFinite(qty)) return { ok: false, message: 'Invalid quantity.' };
    const total = def.price * qty;
    if (def.price <= 0) return { ok: false, message: 'That item is not for sale.' };
    if (this.data.coins < total) return { ok: false, message: 'Not enough coins.' };
    if (this.freeSpaceFor(itemId) < qty) return { ok: false, message: 'Your inventory is full.' };
    this.data.coins -= total;
    if (!this.addItem(itemId, qty)) {
      this.data.coins += total;
      return { ok: false, message: 'Your inventory is full.' };
    }
    this.addXp('business', 2, false);
    this.emitChange();
    this.emit('buy', { itemId, qty, total });
    this.checkProgress();
    return { ok: true, message: `Bought ${qty} × ${def.name} for ${total} coins.` };
  }

  sellPrice(itemId: string, quality: Quality = 'normal'): number {
    const def = ITEMS[itemId];
    if (!def) return 0;
    const base = def.sell || def.price;
    return Math.max(1, Math.round(base * QUALITY_MULTIPLIER[quality] * this.marketTrend(itemId)));
  }

  marketTrend(itemId: string): number {
    return marketMultiplier(itemId, this.data);
  }

  sellStack(index: number, qty: number): ActionResult & { total?: number } {
    const stack = this.data.inventory[index];
    if (!stack) return { ok: false, message: 'Nothing to sell.' };
    const def = ITEMS[stack.itemId];
    if (!def) return { ok: false, message: 'Unknown item.' };
    if (def.type === 'tool') return { ok: false, message: 'You cannot sell your tools.' };
    const amount = Math.floor(qty);
    if (amount <= 0 || amount > stack.qty) return { ok: false, message: 'Invalid quantity.' };
    const unit = this.sellPrice(stack.itemId, stack.quality);
    const total = unit * amount;
    stack.qty -= amount;
    if (stack.qty <= 0) this.data.inventory[index] = null;
    this.data.coins += total;
    this.data.stats.coinsEarned += total;
    this.data.stats.cropsSold += amount;
    this.addXp('business', Math.max(1, Math.round(amount * 1.5)), false);
    this.emitChange();
    this.emit('sell', { itemId: def.id, qty: amount, total });
    this.checkProgress();
    return { ok: true, total, message: `Sold ${amount} × ${def.name} for ${total} coins.` };
  }

  sellAll(): ActionResult & { total?: number } {
    let total = 0;
    let count = 0;
    for (let i = 0; i < this.data.inventory.length; i++) {
      const stack = this.data.inventory[i];
      if (!stack) continue;
      const def = ITEMS[stack.itemId];
      if (!def || def.type === 'tool') continue;
      total += this.sellPrice(stack.itemId, stack.quality) * stack.qty;
      count += stack.qty;
      this.data.inventory[i] = null;
    }
    if (count === 0) return { ok: false, message: 'Nothing to sell.' };
    this.data.coins += total;
    this.data.stats.coinsEarned += total;
    this.data.stats.cropsSold += count;
    this.addXp('business', Math.max(1, Math.round(count * 1.2)), false);
    this.emitChange();
    this.emit('sell', { itemId: 'all', qty: count, total });
    this.checkProgress();
    return { ok: true, total, message: `Sold ${count} goods for ${total} coins.` };
  }

  // --------------------------------------------------------------- crafting

  canCraft(recipeId: string): boolean {
    const recipe = RECIPES.find((r) => r.id === recipeId);
    if (!recipe || !this.hasWorkshop()) return false;
    if (this.level < recipe.unlockLevel) return false;
    return true;
  }

  craft(recipeId: string): ActionResult {
    const recipe = RECIPES.find((r) => r.id === recipeId);
    if (!recipe) return { ok: false, message: 'Unknown recipe.' };
    if (!this.hasWorkshop()) return { ok: false, message: 'Build a workshop to craft goods.' };
    if (this.level < recipe.unlockLevel) {
      return { ok: false, message: `Unlocks at farmer level ${recipe.unlockLevel}.` };
    }
    for (const input of recipe.inputs) {
      if (this.countItem(input.itemId) < input.qty) {
        return { ok: false, message: `Need ${input.qty} × ${ITEMS[input.itemId]?.name ?? input.itemId}.` };
      }
    }
    if (this.data.coins < recipe.coins) return { ok: false, message: 'Not enough coins.' };
    if (this.freeSpaceFor(recipe.output.itemId) < recipe.output.qty) {
      return { ok: false, message: 'Your inventory is full.' };
    }
    for (const input of recipe.inputs) this.removeItem(input.itemId, input.qty);
    this.data.coins -= recipe.coins;
    this.addItem(recipe.output.itemId, recipe.output.qty);
    this.data.stats.crafts += 1;
    this.addXp('crafting', 8, false);
    this.emitChange();
    this.emit('craft', { recipeId });
    this.checkProgress();
    return {
      ok: true,
      message: `Crafted ${ITEMS[recipe.output.itemId]?.name ?? recipe.output.itemId}.`
    };
  }

  // -------------------------------------------------------------- buildings

  buildingAt(x: number, y: number): BuildingSave | undefined {
    return this.data.buildings.find((b) => {
      const def = BUILDINGS[b.id];
      if (!def) return false;
      return x >= b.x && x < b.x + def.w && y >= b.y && y < b.y + def.h;
    });
  }

  buildingOccupies(x: number, y: number, w: number, h: number): BuildingSave | undefined {
    return this.data.buildings.find((b) => {
      const def = BUILDINGS[b.id];
      if (!def) return false;
      return x < b.x + def.w && x + w > b.x && y < b.y + def.h && y + h > b.y;
    });
  }

  canPlaceBuilding(buildingId: string, x: number, y: number): ActionResult {
    const def = BUILDINGS[buildingId];
    if (!def) return { ok: false, message: 'Unknown building.' };
    if (buildingId === 'farmhouse') return { ok: false, message: 'The farmhouse is already built.' };
    if (this.level < def.unlockLevel) {
      return { ok: false, message: `Unlocks at farmer level ${def.unlockLevel}.` };
    }
    if (this.data.coins < def.cost) return { ok: false, message: 'Not enough coins.' };
    if (x < 0 || y < 0 || x + def.w > WORLD_W || y + def.h > WORLD_H) {
      return { ok: false, message: 'Does not fit here.' };
    }
    if (this.buildingOccupies(x, y, def.w, def.h)) {
      return { ok: false, message: 'Something is already built here.' };
    }
    for (let ty = y; ty < y + def.h; ty++) {
      for (let tx = x; tx < x + def.w; tx++) {
        if (isWaterTile(tx, ty) || isObstacleTile(tx, ty)) {
          return { ok: false, message: 'Clear ground is required.' };
        }
        const idx = plotIndexAt(tx, ty);
        if (idx >= 0) {
          if (!isUnlockedTile(this.data, tx, ty)) return { ok: false, message: 'Buy this field first.' };
          const tile = this.tileAt(tx, ty);
          if (def.kind !== 'decor' && tile?.tilled) {
            return { ok: false, message: 'That field is in use.' };
          }
          if (def.kind === 'decor' && def.id === 'path') {
            // Paths are allowed over field tiles only when empty.
            if (tile?.crop) return { ok: false, message: 'Something is growing there.' };
          } else if (def.kind !== 'decor') {
            return { ok: false, message: 'Build off the crop field.' };
          }
        }
        if (isPathTile(tx, ty) && def.kind !== 'decor') {
          return { ok: false, message: 'Do not build over the farm path.' };
        }
        if (def.kind === 'decor' && isPathTile(tx, ty)) {
          return { ok: false, message: 'There is already a path here.' };
        }
      }
    }
    return { ok: true };
  }

  build(buildingId: string, x: number, y: number): ActionResult {
    const check = this.canPlaceBuilding(buildingId, x, y);
    if (!check.ok) return check;
    const def = BUILDINGS[buildingId];
    this.data.coins -= def.cost;
    this.data.buildings.push({ uid: uid('b'), id: buildingId, x, y });
    this.data.stats.buildingsBuilt += 1;
    this.ensureCapacity();
    this.addXp('business', 10, false);
    this.emitChange();
    this.emit('build', { buildingId, x, y });
    this.checkProgress();
    return {
      ok: true,
      message: def.kind === 'decor' ? `${def.name} placed.` : `${def.name} built!`
    };
  }

  nextPlot() {
    return PLOTS[this.data.unlockedPlots] ?? null;
  }

  expandLand(): ActionResult {
    const plot = this.nextPlot();
    if (!plot) return { ok: false, message: 'All land is already yours.' };
    if (this.data.coins < plot.cost) {
      return { ok: false, message: `Need ${plot.cost} coins to buy ${plot.name}.` };
    }
    this.data.coins -= plot.cost;
    this.data.unlockedPlots += 1;
    this.addXp('business', 25, false);
    this.emitChange();
    this.emit('expand', { plot: plot.id });
    this.checkProgress();
    return { ok: true, message: `${plot.name} unlocked!` };
  }

  farmhouseUpgradeCost(): number {
    return 900 * this.data.farmhouseLevel;
  }

  upgradeFarmhouse(): ActionResult {
    if (this.data.farmhouseLevel >= 3) return { ok: false, message: 'The farmhouse is fully upgraded.' };
    const cost = this.farmhouseUpgradeCost();
    if (this.data.coins < cost) return { ok: false, message: `Need ${cost} coins.` };
    this.data.coins -= cost;
    this.data.farmhouseLevel += 1;
    this.ensureCapacity();
    this.addXp('business', 30, false);
    this.emitChange();
    this.emit('farmhouse', { level: this.data.farmhouseLevel });
    return { ok: true, message: `Farmhouse upgraded to level ${this.data.farmhouseLevel}.` };
  }

  upgradeTool(id: string): ActionResult {
    const def = UPGRADES.find((u) => u.id === id);
    if (!def) return { ok: false, message: 'Unknown upgrade.' };
    const level = this.data.upgrades[id] ?? 0;
    if (level >= def.maxLevel) return { ok: false, message: 'Already fully upgraded.' };
    if (this.level < def.unlockLevel) {
      return { ok: false, message: `Unlocks at farmer level ${def.unlockLevel}.` };
    }
    const cost = def.baseCost * (level + 1);
    if (this.data.coins < cost) return { ok: false, message: `Need ${cost} coins.` };
    this.data.coins -= cost;
    this.data.upgrades[id] = level + 1;
    this.ensureCapacity();
    this.addXp('business', 12, false);
    this.emitChange();
    this.emit('upgrade', { id, level: level + 1 });
    return { ok: true, message: `${def.name} upgraded to level ${level + 1}.` };
  }

  // ---------------------------------------------------------------- animals

  housingCapacity(kind: 'coop' | 'barn'): number {
    return this.data.buildings.reduce((sum, b) => {
      const def = BUILDINGS[b.id];
      if (def?.kind === 'housing' && def.id === kind) return sum + (def.capacity ?? 0);
      return sum;
    }, 0);
  }

  animalsInHousing(kind: 'coop' | 'barn'): number {
    return this.data.animals.filter((a) => ANIMALS[a.species]?.housing === kind).length;
  }

  nextHousingBuilding(species: string): BuildingSave | undefined {
    const def = ANIMALS[species];
    if (!def) return undefined;
    return this.data.buildings.find(
      (b) => b.id === def.housing && this.animalsInHousing(def.housing) < this.housingCapacity(def.housing)
    );
  }

  buyAnimal(species: string): ActionResult {
    const def = ANIMALS[species];
    if (!def) return { ok: false, message: 'Unknown animal.' };
    if (this.animalsInHousing(def.housing) >= this.housingCapacity(def.housing)) {
      return {
        ok: false,
        message: `Build a ${def.housing === 'coop' ? 'chicken coop' : 'barn'} with free space first.`
      };
    }
    if (this.data.coins < def.price) return { ok: false, message: 'Not enough coins.' };
    const housing = this.nextHousingBuilding(species);
    if (!housing) return { ok: false, message: 'No free housing available.' };
    const hdef = BUILDINGS[housing.id];
    const cx = housing.x + Math.floor((hdef?.w ?? 2) / 2);
    const cy = housing.y + (hdef?.h ?? 2) + 1;
    const pos = tileToWorld(cx, cy);
    this.data.coins -= def.price;
    this.data.animals.push({
      uid: uid('a'),
      species,
      x: pos.x + randomInt(-12, 12, this.rng),
      y: pos.y + randomInt(-8, 8, this.rng),
      ageDays: 0,
      happiness: 65,
      health: 100,
      fed: false,
      petted: false,
      productReady: false
    });
    this.data.stats.animalsOwned = this.data.animals.length;
    this.addXp('animal', 12, false);
    this.emitChange();
    this.emit('animalBought', { species });
    this.checkProgress();
    return { ok: true, message: `${def.name} welcomed to the farm!` };
  }

  getAnimal(animalUid: string): AnimalSave | undefined {
    return this.data.animals.find((a) => a.uid === animalUid);
  }

  animalMature(animal: AnimalSave): boolean {
    return animal.ageDays >= (ANIMALS[animal.species]?.maturityDays ?? 3);
  }

  feedAnimal(animalUid: string): ActionResult {
    const animal = this.getAnimal(animalUid);
    if (!animal) return { ok: false, message: 'Animal not found.' };
    if (animal.fed) return { ok: false, message: 'This animal is already fed today.' };
    if (!this.hasItem('feed')) return { ok: false, message: 'You need animal feed.' };
    this.removeItem('feed', 1);
    animal.fed = true;
    this.addXp('animal', 3, false);
    this.emitChange();
    return { ok: true, message: `${ANIMALS[animal.species]?.name ?? 'Animal'} fed.` };
  }

  feedAll(): ActionResult {
    const hungry = this.data.animals.filter((a) => !a.fed);
    if (hungry.length === 0) return { ok: false, message: 'All animals are already fed.' };
    const available = this.countItem('feed');
    if (available <= 0) return { ok: false, message: 'You need animal feed.' };
    const count = Math.min(available, hungry.length);
    this.removeItem('feed', count);
    for (let i = 0; i < count; i++) {
      hungry[i].fed = true;
    }
    this.addXp('animal', 2 * count, false);
    this.emitChange();
    return { ok: true, message: `Fed ${count} animal${count === 1 ? '' : 's'}.` };
  }

  petAnimal(animalUid: string): ActionResult {
    const animal = this.getAnimal(animalUid);
    if (!animal) return { ok: false, message: 'Animal not found.' };
    if (animal.petted) return { ok: false, message: 'Already petted today. Give it some space!' };
    animal.petted = true;
    animal.happiness = clamp(animal.happiness + 8, 0, 100);
    this.addXp('animal', 2, false);
    this.emitChange();
    return { ok: true, message: 'The animal looks happier.' };
  }

  collectAnimal(animalUid: string): ActionResult {
    const animal = this.getAnimal(animalUid);
    if (!animal) return { ok: false, message: 'Animal not found.' };
    const def = ANIMALS[animal.species];
    if (!def) return { ok: false, message: 'Unknown animal.' };
    if (!animal.productReady) return { ok: false, message: 'No product ready yet.' };
    if (this.freeSpaceFor(def.productId) < 1) return { ok: false, message: 'Your inventory is full.' };
    this.addItem(def.productId, 1);
    animal.productReady = false;
    this.data.stats.productsCollected += 1;
    if (def.productId === 'egg' || def.productId === 'duck_egg') {
      this.data.stats.eggsCollected += 1;
    }
    this.addXp('animal', 8, false);
    this.emitChange();
    this.emit('collect', { animalUid, itemId: def.productId });
    this.checkProgress();
    return { ok: true, message: `Collected ${ITEMS[def.productId]?.name ?? 'product'}.` };
  }

  breedAnimals(aUid: string, bUid: string): ActionResult {
    const a = this.getAnimal(aUid);
    const b = this.getAnimal(bUid);
    if (!a || !b || a.species !== b.species) {
      return { ok: false, message: 'Choose two animals of the same species.' };
    }
    const def = ANIMALS[a.species];
    if (!def) return { ok: false, message: 'Unknown animal.' };
    if (!this.animalMature(a) || !this.animalMature(b)) {
      return { ok: false, message: 'Both animals must be fully grown.' };
    }
    if (a.happiness < 70 || b.happiness < 70) {
      return { ok: false, message: 'Both animals need high happiness (70+).' };
    }
    if (!this.hasItem('feed', 3)) return { ok: false, message: 'Breeding requires 3 animal feed.' };
    if (this.animalsInHousing(def.housing) >= this.housingCapacity(def.housing)) {
      return { ok: false, message: 'No free housing space for a baby.' };
    }
    this.removeItem('feed', 3);
    a.happiness = clamp(a.happiness - 10, 0, 100);
    b.happiness = clamp(b.happiness - 10, 0, 100);
    this.data.animals.push({
      uid: uid('a'),
      species: a.species,
      x: a.x + 24,
      y: a.y + 8,
      ageDays: 0,
      happiness: 70,
      health: 100,
      fed: false,
      petted: false,
      productReady: false
    });
    this.data.stats.animalsOwned = this.data.animals.length;
    this.addXp('animal', 25, false);
    this.emitChange();
    this.emit('birth', { species: a.species });
    this.checkProgress();
    return { ok: true, message: `A baby ${def.name.toLowerCase()} was born!` };
  }

  // ------------------------------------------------------------------- time

  tickClock(realMs: number): boolean {
    if (this.paused) return false;
    this.data.minute += (realMs / 1000) * MINUTES_PER_REAL_SECOND;
    if (this.data.minute >= 1440) {
      this.data.minute = 1439;
      return true;
    }
    return false;
  }

  weatherForSeason(season: Season): Weather {
    const table: Record<Season, Array<[Weather, number]>> = {
      spring: [
        ['sunny', 0.45],
        ['cloudy', 0.23],
        ['rain', 0.27],
        ['storm', 0.05]
      ],
      summer: [
        ['sunny', 0.62],
        ['cloudy', 0.16],
        ['rain', 0.16],
        ['storm', 0.06]
      ],
      fall: [
        ['sunny', 0.4],
        ['cloudy', 0.28],
        ['rain', 0.27],
        ['storm', 0.05]
      ],
      winter: [
        ['sunny', 0.3],
        ['cloudy', 0.34],
        ['rain', 0.26],
        ['storm', 0.1]
      ]
    };
    const roll = this.rng();
    let acc = 0;
    for (const [weather, chance] of table[season]) {
      acc += chance;
      if (roll <= acc) return weather;
    }
    return 'sunny';
  }

  private waterAroundBuilding(b: BuildingSave, radius: number): number {
    const def = BUILDINGS[b.id];
    if (!def) return 0;
    const cx = b.x + Math.floor(def.w / 2);
    const cy = b.y + Math.floor(def.h / 2);
    let watered = 0;
    for (let y = cy - radius; y <= cy + radius; y++) {
      for (let x = cx - radius; x <= cx + radius; x++) {
        const tile = this.tileAt(x, y);
        if (tile?.tilled && !tile.watered) {
          tile.watered = true;
          watered += 1;
        }
      }
    }
    return watered;
  }

  isWithinInteraction(x: number, y: number, range = 3): boolean {
    const px = this.data.player.x / TILE;
    const py = this.data.player.y / TILE;
    return Math.abs(x + 0.5 - px) <= range && Math.abs(y + 0.5 - py) <= range;
  }

  overnightChores(): { unwateredCrops: number; unfedAnimals: number } {
    let unwateredCrops = 0;
    for (const tile of Object.values(this.data.tiles)) {
      if (!tile.crop || tile.watered) continue;
      const def = CROPS[tile.crop.id];
      if (def && tile.crop.growth < def.growthDays) unwateredCrops += 1;
    }
    return {
      unwateredCrops,
      unfedAnimals: this.data.animals.filter((animal) => !animal.fed).length
    };
  }

  advanceDay(): {
    day: number;
    season: Season;
    weather: Weather;
    grown: number;
    wilted: number;
    products: number;
    messages: string[];
  } {
    const d = this.data;
    const messages: string[] = [];
    let grown = 0;
    let wilted = 0;
    let products = 0;

    // 1) Grow crops using the watering state from the day that just ended.
    for (const [key, tile] of Object.entries(d.tiles)) {
      if (!tile.crop) {
        tile.watered = false;
        continue;
      }
      const def = CROPS[tile.crop.id];
      if (!def) {
        tile.crop = undefined;
        continue;
      }
      const mature = tile.crop.growth >= def.growthDays;
      if (!mature) {
        if (tile.watered) {
          tile.crop.growth += 1;
          tile.crop.dryDays = 0;
          grown += 1;
        } else {
          tile.crop.dryDays += 1;
          if (tile.crop.dryDays >= 3) {
            tile.crop = undefined;
            tile.fertilized = false;
            wilted += 1;
          }
        }
      }
      tile.watered = false;
      if (!tile.crop) d.tiles[key] = { ...tile, crop: undefined };
    }

    // 2) Animals produce from the care they received during the day.
    for (const animal of d.animals) {
      const def = ANIMALS[animal.species];
      if (!def) continue;
      if (animal.fed) {
        animal.happiness = clamp(animal.happiness + 6, 0, 100);
        animal.health = clamp(animal.health + 3, 0, 100);
      } else {
        animal.happiness = clamp(animal.happiness - 18, 0, 100);
        animal.health = clamp(animal.health - 8, 0, 100);
      }
      const mature = animal.ageDays >= def.maturityDays;
      if (mature && animal.fed && animal.health > 0 && animal.happiness >= 40 && !animal.productReady) {
        animal.productReady = true;
        products += 1;
      }
      animal.ageDays += 1;
      animal.fed = false;
      animal.petted = false;
    }

    // 3) Advance the calendar and roll the new day's weather.
    d.minute = START_MINUTE;
    d.day += 1;
    if (d.day > DAYS_PER_SEASON) {
      d.day = 1;
      const idx = SEASONS.indexOf(d.season);
      d.season = SEASONS[(idx + 1) % 4];
      if (idx === 3) d.year += 1;
      messages.push(`${SEASON_INFO[d.season].name} has arrived.`);
    }
    d.weather = this.weatherForSeason(d.season);
    d.stats.daysPlayed += 1;

    // 4) Rain waters everything that is tilled.
    if (d.weather === 'rain' || d.weather === 'storm') {
      for (const tile of Object.values(d.tiles)) {
        if (tile.tilled) tile.watered = true;
      }
      messages.push(d.weather === 'rain' ? 'Rain waters your fields overnight.' : 'A storm soaks the fields.');
    }

    // 5) Wells and sprinklers water their surroundings.
    for (const b of d.buildings) {
      const def = BUILDINGS[b.id];
      if (def?.kind === 'well') this.waterAroundBuilding(b, def.radius ?? 3);
      if (def?.kind === 'sprinkler') this.waterAroundBuilding(b, def.radius ?? 1);
    }

    // 6) Storm damage.
    if (d.weather === 'storm') {
      let damaged = 0;
      for (const tile of Object.values(d.tiles)) {
        if (!tile.crop) continue;
        const def = CROPS[tile.crop.id];
        if (!def) continue;
        if (tile.crop.growth >= def.growthDays) continue;
        if (this.rng() < 0.08) {
          tile.crop = undefined;
          tile.fertilized = false;
          damaged += 1;
        }
      }
      if (damaged > 0) {
        wilted += damaged;
        messages.push(`${damaged} crop${damaged === 1 ? '' : 's'} were damaged by the storm.`);
      }
    }

    // 7) Fresh daily quests, achievement check.
    d.daily = generateDaily(d.day, d.stats, this.rng);
    this.checkProgress();

    this.emitChange();
    this.emit('day', { day: d.day, season: d.season, weather: d.weather });
    this.checkAchievements();

    return {
      day: d.day,
      season: d.season,
      weather: d.weather,
      grown,
      wilted,
      products,
      messages
    };
  }

  // -------------------------------------------------------------- progress

  addXp(skill: SkillKey, amount: number, check = true): void {
    if (amount <= 0) return;
    const beforeSkill = this.skillLevel(skill);
    const beforeLevel = this.level;
    this.data.xp[skill] += amount;
    const afterSkill = this.skillLevel(skill);
    const afterLevel = this.level;

    if (afterSkill > beforeSkill) {
      this.emit('levelup', { type: skill, level: afterSkill, skill });
    }
    if (afterLevel > beforeLevel) {
      this.lastLevel = afterLevel;
      this.emit('levelup', { type: 'farmer', level: afterLevel });
    }
    if (check) this.checkAchievements();
  }

  grantXp(total: number): void {
    const each = Math.max(1, Math.round(total / 4));
    (['farming', 'animal', 'crafting', 'business'] as SkillKey[]).forEach((skill) => {
      this.addXp(skill, each, false);
    });
    this.checkAchievements();
  }

  private checkProgress(): void {
    this.checkAchievements();
  }

  checkAchievements(): void {
    if (this.checkingAchievements) return;
    this.checkingAchievements = true;
    try {
      for (const ach of ACHIEVEMENTS) {
        if (this.data.achievements.includes(ach.id)) continue;
        if (metricValue(this.data, ach.metric) >= ach.target) {
          this.data.achievements.push(ach.id);
          this.data.coins += ach.coins;
          this.data.stats.coinsEarned += ach.coins;
          this.emit('achievement', { quest: ach });
          this.grantXpNoCheck(ach.xp);
        }
      }
    } finally {
      this.checkingAchievements = false;
    }
  }

  private grantXpNoCheck(total: number): void {
    if (total <= 0) return;
    const each = Math.max(1, Math.round(total / 4));
    (['farming', 'animal', 'crafting', 'business'] as SkillKey[]).forEach((skill) => {
      this.addXp(skill, each, false);
    });
  }

  mainQuestState(quest: QuestDef): { progress: number; claimed: boolean; complete: boolean } {
    const progress = metricValue(this.data, quest.metric);
    const claimed = this.data.claimedQuests.includes(quest.id);
    return { progress, claimed, complete: progress >= quest.target };
  }

  claimMainQuest(id: string): ActionResult {
    const quest = MAIN_QUESTS.find((q) => q.id === id);
    if (!quest) return { ok: false, message: 'Unknown quest.' };
    if (this.data.claimedQuests.includes(id)) return { ok: false, message: 'Reward already claimed.' };
    if (!isQuestComplete(this.data, quest)) return { ok: false, message: 'Quest is not complete yet.' };
    this.data.claimedQuests.push(id);
    this.data.coins += quest.coins;
    this.data.stats.coinsEarned += quest.coins;
    this.grantXp(quest.xp);
    this.emitChange();
    this.emit('questClaimed', { id, quest });
    return { ok: true, message: `Quest complete! +${quest.coins} coins.` };
  }

  dailyState(entryId: string): { progress: number; complete: boolean; claimed: boolean; target: number } | null {
    const daily = this.data.daily;
    if (!daily) return null;
    const entry = daily.list.find((e) => e.id === entryId);
    if (!entry) return null;
    const template = DAILY_TEMPLATES.find((t) => t.id === entryId);
    if (!template) return null;
    const progress = dailyProgress(this.data, template.metric, daily.startStats);
    return {
      progress,
      target: entry.target,
      claimed: entry.claimed,
      complete: progress >= entry.target
    };
  }

  claimDailyQuest(id: string): ActionResult {
    const daily = this.data.daily;
    if (!daily) return { ok: false, message: 'No daily quests today.' };
    const entry = daily.list.find((e) => e.id === id);
    if (!entry) return { ok: false, message: 'Unknown daily quest.' };
    if (entry.claimed) return { ok: false, message: 'Daily reward already claimed.' };
    const state = this.dailyState(id);
    if (!state?.complete) return { ok: false, message: 'Daily quest is not complete yet.' };
    entry.claimed = true;
    this.data.coins += entry.coins;
    this.data.stats.coinsEarned += entry.coins;
    this.grantXp(entry.xp);
    this.emitChange();
    this.emit('dailyClaimed', { id, coins: entry.coins });
    return { ok: true, message: `Daily complete! +${entry.coins} coins.` };
  }

  // --------------------------------------------------------------- tutorial

  setTutorialStep(step: number): void {
    this.data.tutorialStep = step;
    this.emit('tutorial', step);
  }

  finishTutorial(): void {
    if (this.data.tutorialDone) return;
    this.data.tutorialDone = true;
    this.data.coins += 75;
    this.emitChange();
    this.emit('tutorialDone');
  }

  // ----------------------------------------------------------------- saving

  setPlayer(x: number, y: number, facing: SaveData['player']['facing']): void {
    this.data.player = { x, y, facing };
  }

  dailyBuildingsOwned(): number {
    return functionalBuildingCount(this.data);
  }

  emitChange(): void {
    this.emit('change');
  }

  emit(event: string, payload?: unknown): void {
    this.emitter.emit(event, payload);
  }

  serialize(): SaveData {
    return JSON.parse(JSON.stringify(this.data)) as SaveData;
  }
}

// Imported last to avoid a circular import surprise in some bundlers.
import { ACHIEVEMENTS, DAILY_TEMPLATES } from '../data/definitions';

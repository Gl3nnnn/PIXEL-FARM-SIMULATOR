import {
  ANIMALS,
  APPEARANCE_DEFAULT,
  AUTOMATION,
  BASE_MAX_ENERGY,
  BUFFS,
  BUILDINGS,
  BUNDLE_SETS,
  COLLECTION_SETS,
  CROPS,
  CURRENT_SAVE_VERSION,
  DAYS_PER_SEASON,
  ENERGY_COST,
  EVALUATION_GOALS,
  EVALUATION_CANDLE_POINTS,
  FESTIVAL_CONTESTS,
  FESTIVALS,
  FISH,
  FORAGE,
  FURNITURE,
  ITEMS,
  LETTERS,
  LOST_ITEM_FEE_RATE,
  LOST_ITEM_KEEP_DAYS,
  LOST_ITEM_MAX,
  LOST_ITEM_MIN_FEE,
  LOST_ITEM_RESCUE_VALUE,
  MAIN_QUESTS,
  MINE_FLOOR_H,
  MINE_FLOOR_W,
  MINE_MAX_FLOOR,
  MINE_SUMMIT,
  MINUTES_PER_REAL_SECOND,
  MUSEUM_REWARDS,
  NPCS,
  PLOTS,
  PROFESSIONS,
  professionsFor,
  QUALITY_MULTIPLIER,
  RECIPES,
  SEASONS,
  SEASON_INFO,
  SEED_IDS,
  START_MINUTE,
  TILE,
  TOOLS,
  TV_FORECASTS,
  UPGRADES,
  WEAPONS,
  WORLD_H,
  WORLD_W,
  cropForSeed,
  levelFromXp,
  xpProgress
} from '../data/definitions';
import type {
  ActionResult,
  AnimalSave,
  BuildingDef,
  BuildingSave,
  ChildSave,
  FestivalTier,
  MineNodeSave,
  NpcSave,
  HousingId,
  MailDef,
  Quality,
  QuestDef,
  SaveData,
  Season,
  SkillKey,
  Stats,
  TileSave,
  ToolEffect,
  Weather,
  WeeklySave
} from '../types';
import {
  functionalBuildingCount,
  generateDaily,
  metricValue,
  overallLevel,
  dailyProgress,
  isQuestComplete
} from './quests';
import {
  festivalBestSelection,
  festivalContest,
  festivalTierFor,
  generateSeasonal,
  readSeasonalContract,
  seasonalBoardMatches
} from './festivals';
import { marketMultiplier } from './market';
import {
  inBounds,
  isFenceTile,
  isMineNodeTile,
  isObstacleTile,
  isPathTile,
  isUnlockedTile,
  isWaterTile,
  mineNodeAt,
  plotIndexAt,
  tileToWorld
} from './world';
import { absoluteDay, dayOfWeek } from './calendar';
import {
  WEEKLY_BONUS,
  advanceLoginStreak,
  defaultEngagement,
  generateWeekly,
  localDateKey,
  loginGiftAmount,
  readWeeklyGoal,
  weekNumber,
  weeklyGoalProgress
} from './engagement';
import { collectionSetState, collectionTotal, recordCollection } from './collections';
import { eligibleFish, selectFish } from './fishing';
import { MINE_NODE_MAX_HP, mineNodeById, miningLoot, nodeHp } from './mining';
import {
  createMineRun,
  equippedWeapon,
  generateMineFloor,
  maxMineHp,
  monsterAt,
  monsterDamage,
  rockAt,
  rockLoot,
  weaponById
} from './adventure';
import type { MineFloorState } from './adventure';
import {
  canAdopt,
  childStageLabel,
  furnitureById,
  growChildren,
  houseBonus,
  museumMilestones,
  nextMuseumMilestone,
  ownedFurniture,
  petBonus,
  petMood,
  randomChildName
} from './homestead';
import {
  birthdayLabel,
  ensureNpcSave,
  friendshipHearts,
  heartEventLine,
  isNpcBirthday,
  npcAvailable,
  npcById,
  npcLine,
  npcStatus,
  npcWeeklyRequest
} from './npcs';
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
  eggsCollected: 0,
  fishCaught: 0,
  fishingCasts: 0,
  rocksMined: 0,
  oresMined: 0,
  foragePicked: 0,
  cropsLost: 0,
  monstersDefeated: 0,
  artifactsFound: 0,
  itemsShipped: 0
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
    player: { x: 7 * TILE + TILE / 2, y: 8 * TILE, facing: 'down' },
    coins: 400,
    day: 1,
    season: 'spring',
    year: 1,
    minute: START_MINUTE,
    weather: 'sunny',
    tiles: {},
    buildings: [
      { uid: uid('b'), id: 'farmhouse', x: 4, y: 3 },
      { uid: uid('b'), id: 'shipping_bin', x: 11, y: 6 }
    ],
    animals: [],
    inventory,
    unlockedPlots: 1,
    farmhouseLevel: 1,
    xp: { farming: 0, animal: 0, crafting: 0, business: 0, fishing: 0, mining: 0 },
    upgrades: { hoe: 0, can: 0, boots: 0, backpack: 0 },
    stats: { ...EMPTY_STATS },
    claimedQuests: [],
    achievements: [],
    daily: null,
    seasonal: null,
    collection: { entries: [], claimedRewards: [] },
    automation: { purchased: [], disabled: [] },
    festival: null,
    ribbons: [],
    mineNodes: {},
    npcs: {},
    spouseId: null,
    tutorialStep: 0,
    tutorialDone: false,
    selectedItemId: 'hoe',
    toolsOwned: [],
    energy: BASE_MAX_ENERGY,
    professions: {},
    forage: [],
    mail: [],
    bundles: [],
    buffs: [],
    mineRun: createMineRun(),
    shipping: { items: [] },
    family: { children: [] },
    house: { furniture: [] },
    museum: { donated: [], claimed: [] },
    pet: { type: null, name: '', affection: 0, lastPetDay: 0 },
    horseOwned: false,
    festivalGame: { season: 'spring', year: 1, played: false, score: 0 },
    appearance: { ...APPEARANCE_DEFAULT },
    dailyLuck: 0,
    dailyForecast: '',
    daysAway: 0,
    engagement: defaultEngagement(),
    lostItems: [],
    summitClaimed: [],
    evaluation: null
  };
}

export class GameState {
  data: SaveData;
  emitter = new Emitter();
  /** True while a menu is open; the world simulation is paused. */
  paused = false;
  rng: () => number;
  /** The mine floor currently being explored, if any. */
  mineFloor: MineFloorState | null = null;
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
    this.ensureSeasonalBoard();
    this.ensureFestivalDay();
    this.ensureEngagement();
    this.ensureNpcs();
    this.ensureLifeState();
    this.ensureDailyLife();
    this.syncCollectionFromInventory();
  }

  private ensureNpcs(): void {
    for (const id of Object.keys(NPCS)) {
      if (!this.data.npcs[id]) {
        this.data.npcs[id] = {
          id,
          friendship: 0,
          talkedDay: 0,
          giftedDay: 0,
          met: false,
          requestWeek: 0,
          heartEvents: []
        };
      }
    }
  }

  // ----------------------------------------------------------------- energy

  /** Total energy a full day holds. Professions and furniture can raise it. */
  maxEnergy(): number {
    return (
      BASE_MAX_ENERGY +
      this.professionSum('maxEnergy') +
      houseBonus(this.data.house ?? { furniture: [] }, 'energy')
    );
  }

  energy(): number {
    return clamp(this.data.energy, 0, this.maxEnergy());
  }

  /** How much energy an action costs, after professions. */
  energyCost(key: keyof typeof ENERGY_COST): number {
    const base = ENERGY_COST[key] ?? 1;
    const discount = clamp(this.professionSum('energyCost'), 0, 0.6);
    return Math.max(0, Math.floor(base * (1 - discount)));
  }

  hasEnergy(amount: number): boolean {
    return this.energy() >= amount;
  }

  spendEnergy(amount: number): void {
    if (amount <= 0) return;
    this.data.energy = Math.max(0, this.energy() - amount);
  }

  restoreEnergy(amount: number): void {
    this.data.energy = clamp(this.energy() + amount, 0, this.maxEnergy());
  }

  /** "Not enough energy" message used by every action. */
  private outOfEnergy(cost: number): ActionResult {
    this.emitChange();
    return {
      ok: false,
      message: `You are too tired (${cost} energy needed). Sleep to refill, or eat a cooked dish.`
    };
  }

  // ------------------------------------------------------------ professions

  /** Adds up the chosen professions that improve one thing. */
  professionSum(kind: string): number {
    let total = 0;
    for (const chosen of Object.values(this.data.professions ?? {})) {
      for (const id of chosen) {
        const def = PROFESSIONS.find((p) => p.id === id);
        if (def && def.kind === kind) total += def.value;
      }
    }
    return total;
  }

  hasProfession(id: string): boolean {
    return Object.values(this.data.professions ?? {}).some((list) => list.includes(id));
  }

  /** The two options offered at a skill level, or empty when already chosen. */
  professionChoices(skill: SkillKey, level: number) {
    const chosen = this.data.professions?.[skill] ?? [];
    const unlocked = this.skillLevel(skill) >= level;
    return professionsFor(skill, level).map((def) => ({
      def,
      chosen: chosen.includes(def.id),
      unlocked
    }));
  }

  chooseProfession(id: string): ActionResult {
    const def = PROFESSIONS.find((p) => p.id === id);
    if (!def) return { ok: false, message: 'Unknown profession.' };
    if (this.hasProfession(id)) return { ok: false, message: 'You already chose that profession.' };
    if (this.skillLevel(def.skill) < def.level) {
      return { ok: false, message: `Reach ${def.skill} level ${def.level} first.` };
    }
    if (!this.data.professions) this.data.professions = {};
    const list = this.data.professions[def.skill] ?? [];
    const sameTier = list.some(
      (id) => PROFESSIONS.find((p) => p.id === id)?.level === def.level
    );
    if (sameTier) {
      return { ok: false, message: 'You already chose a profession for this skill at that level.' };
    }
    this.data.professions[def.skill] = [...list, id];
    if (def.kind === 'maxEnergy') this.data.energy = this.maxEnergy();
    this.emitChange();
    this.emit('profession', { id });
    this.checkAchievements();
    return { ok: true, message: `You are now a ${def.name}. ${def.desc}` };
  }

  // ------------------------------------------------------------------ buffs

  /** Eat a cooked dish for a one-day buff. */
  eat(itemId: string): ActionResult {
    const buff = BUFFS.find((b) => b.itemId === itemId);
    if (!buff) return { ok: false, message: 'That is not a cooked dish.' };
    if (!this.hasItem(itemId)) return { ok: false, message: 'You do not have that dish.' };
    if (buff.kind === 'energy' && this.energy() >= this.maxEnergy()) {
      return { ok: false, message: 'You are already full of energy.' };
    }
    this.removeItem(itemId, 1);
    if (buff.kind === 'energy') {
      this.restoreEnergy(buff.value);
      this.emitChange();
      return { ok: true, message: `${buff.name}! You feel refreshed.` };
    }
    this.data.buffs = [{ id: buff.id, day: this.today }];
    this.emitChange();
    return { ok: true, message: `${buff.name} for today: ${buff.desc}` };
  }

  /** Buffs that are still active today. */
  activeBuffs() {
    const today = this.today;
    return (this.data.buffs ?? [])
      .filter((entry) => entry.day === today)
      .map((entry) => BUFFS.find((b) => b.id === entry.id))
      .filter((b): b is NonNullable<typeof b> => !!b);
  }

  buffSum(kind: 'speed' | 'luck'): number {
    return this.activeBuffs()
      .filter((b) => b.kind === kind)
      .reduce((sum, b) => sum + b.value, 0);
  }

  // ----------------------------------------------------------------- forage

  /** Rolls the wild plants that appear on the farm this morning. */
  private spawnForage(): number {
    const list = FORAGE.filter((f) => f.seasons.includes(this.data.season));
    if (list.length === 0) {
      this.data.forage = [];
      return 0;
    }
    const total = list.reduce((sum, f) => sum + f.weight, 0);
    const count = randomInt(2, 4, this.rng);
    const spawned: SaveData['forage'] = [];
    const used = new Set<string>();
    for (let i = 0; i < count; i++) {
      let roll = this.rng() * total;
      let pickDef = list[0];
      for (const f of list) {
        roll -= f.weight;
        if (roll <= 0) {
          pickDef = f;
          break;
        }
      }
      for (let tries = 0; tries < 40; tries++) {
        const x = randomInt(2, WORLD_W - 3, this.rng);
        const y = randomInt(3, WORLD_H - 3, this.rng);
        const key = `${x},${y}`;
        if (used.has(key)) continue;
        if (!this.isForageSpot(x, y)) continue;
        used.add(key);
        spawned.push({ uid: uid('f'), itemId: pickDef.itemId, x, y, day: this.data.day });
        break;
      }
    }
    this.data.forage = spawned;
    return spawned.length;
  }

  /** Wild plants only grow on open, walkable, unowned ground. */
  isForageSpot(x: number, y: number): boolean {
    if (!inBounds(x, y)) return false;
    if (isWaterTile(x, y) || isObstacleTile(x, y) || isPathTile(x, y)) return false;
    if (isMineNodeTile(x, y) || isFenceTile(x, y)) return false;
    if (plotIndexAt(x, y) >= 0) return false;
    if (this.buildingAt(x, y)) return false;
    return true;
  }

  forageAt(x: number, y: number) {
    return (this.data.forage ?? []).find((f) => f.x === x && f.y === y);
  }

  pickForage(forageUid: string): ActionResult {
    const list = this.data.forage ?? [];
    const spot = list.find((f) => f.uid === forageUid);
    if (!spot) return { ok: false, message: 'Nothing to pick there.' };
    const cost = this.energyCost('forage');
    if (!this.hasEnergy(cost)) return this.outOfEnergy(cost);
    if (this.freeSpaceFor(spot.itemId) < 1) return { ok: false, message: 'Your backpack is full.' };
    this.spendEnergy(cost);
    this.addItem(spot.itemId, 1);
    this.data.forage = list.filter((f) => f.uid !== forageUid);
    this.data.stats.foragePicked += 1;
    this.addXp('farming', 3, false);
    this.emitChange();
    this.emit('forage', { x: spot.x, y: spot.y });
    return { ok: true, message: `Picked ${ITEMS[spot.itemId]?.name ?? 'a wild plant'}.` };
  }

  // ------------------------------------------------------------------- mail

  /** Letters waiting in the mailbox. */
  unreadMail(): number {
    return (this.data.mail ?? []).filter((m) => !m.read).length;
  }

  /** Marks a letter read without taking anything, so its unread dot clears. */
  markLetterRead(id: string): ActionResult {
    const entry = (this.data.mail ?? []).find((m) => m.id === id);
    if (!entry) return { ok: false, message: 'That letter has not arrived yet.' };
    if (entry.read) return { ok: false, message: 'That letter is already read.' };
    entry.read = true;
    this.emitChange();
    return { ok: true, message: 'Letter read.' };
  }

  claimLetter(id: string): ActionResult {
    const def = LETTERS.find((l) => l.id === id);
    if (!def) return { ok: false, message: 'Unknown letter.' };
    const entry = (this.data.mail ?? []).find((m) => m.id === id);
    if (!entry) return { ok: false, message: 'That letter has not arrived yet.' };
    if (entry.claimed) return { ok: false, message: 'You already took what was enclosed.' };
    if (def.itemId && this.freeSpaceFor(def.itemId) < (def.itemQty ?? 1)) {
      return { ok: false, message: 'Make room in your backpack first.' };
    }
    entry.claimed = true;
    entry.read = true;
    if (def.coins > 0) {
      this.data.coins += def.coins;
      this.data.stats.coinsEarned += def.coins;
    }
    if (def.itemId) this.addItem(def.itemId, def.itemQty ?? 1);
    this.emitChange();
    const parts: string[] = [];
    if (def.coins > 0) parts.push(`${def.coins} coins`);
    if (def.itemId) parts.push(`${def.itemQty ?? 1} × ${ITEMS[def.itemId]?.name ?? def.itemId}`);
    return { ok: true, message: parts.length ? `Took ${parts.join(' and ')}.` : 'Letter read.' };
  }

  /** New letters arrive as the farm grows: by level, and by day for the guide. */
  private deliverLetters(): string[] {
    const arrived: string[] = [];
    if (!this.data.mail) this.data.mail = [];
    const playDay = this.data.stats.daysPlayed + 1;
    const due: MailDef[] = [];
    for (const letter of LETTERS) {
      if (this.data.mail.some((m) => m.id === letter.id)) continue;
      if (this.level < letter.atLevel) continue;
      if (letter.atDay !== undefined) {
        if (playDay >= letter.atDay) due.push(letter);
        continue;
      }
      this.data.mail.push({ id: letter.id, read: false, claimed: false, day: this.data.day });
      arrived.push(letter.subject);
    }
    // The guided letters arrive one per day, oldest first, so a new farmer reads
    // one useful thing at a time instead of a mailbox full of advice.
    due.sort((a, b) => (a.atDay ?? 0) - (b.atDay ?? 0));
    const next = due[0];
    if (next) {
      this.data.mail.push({ id: next.id, read: false, claimed: false, day: this.data.day });
      arrived.push(next.subject);
    }
    return arrived;
  }

  // --------------------------------------------------------------- bundles

  bundleState(id: string) {
    const def = BUNDLE_SETS.find((b) => b.id === id);
    if (!def) return null;
    const saved = (this.data.bundles ?? []).find((b) => b.id === id);
    const donated = saved?.donated ?? {};
    const requirements = def.requirements.map((req) => ({
      ...req,
      donated: Math.min(req.qty, donated[req.itemId] ?? 0),
      done: (donated[req.itemId] ?? 0) >= req.qty
    }));
    return {
      def,
      requirements,
      complete: requirements.every((r) => r.done),
      claimed: saved?.claimed ?? false
    };
  }

  /** Hands goods from the backpack to a community bundle. */
  donateToBundle(id: string, itemId: string): ActionResult {
    const state = this.bundleState(id);
    if (!state) return { ok: false, message: 'Unknown bundle.' };
    if (state.claimed) return { ok: false, message: 'That bundle is already complete.' };
    const req = state.requirements.find((r) => r.itemId === itemId);
    if (!req) return { ok: false, message: 'That bundle does not ask for this.' };
    if (req.done) return { ok: false, message: 'That part of the bundle is already filled.' };
    if (!this.hasItem(itemId)) return { ok: false, message: 'You do not have that item.' };
    const need = req.qty - req.donated;
    const qty = Math.min(need, this.countItem(itemId));
    this.removeItem(itemId, qty);
    if (!this.data.bundles) this.data.bundles = [];
    let saved = this.data.bundles.find((b) => b.id === id);
    if (!saved) {
      saved = { id, donated: {}, claimed: false };
      this.data.bundles.push(saved);
    }
    saved.donated[itemId] = (saved.donated[itemId] ?? 0) + qty;
    this.emitChange();
    const name = ITEMS[itemId]?.name ?? itemId;
    if (this.bundleState(id)?.complete) {
      return { ok: true, message: `${name} donated. The ${state.def.name} bundle is complete! Claim your reward.` };
    }
    return { ok: true, message: `Donated ${qty} × ${name}.` };
  }

  claimBundle(id: string): ActionResult {
    const state = this.bundleState(id);
    if (!state) return { ok: false, message: 'Unknown bundle.' };
    if (state.claimed) return { ok: false, message: 'Reward already claimed.' };
    if (!state.complete) return { ok: false, message: 'Fill every line of the bundle first.' };
    const saved = (this.data.bundles ?? []).find((b) => b.id === id);
    if (saved) saved.claimed = true;
    if (state.def.rewardItemId) {
      if (this.freeSpaceFor(state.def.rewardItemId) < (state.def.rewardQty ?? 1)) {
        return { ok: false, message: 'Make room in your backpack first.' };
      }
      this.addItem(state.def.rewardItemId, state.def.rewardQty ?? 1);
    }
    this.data.coins += state.def.coins;
    this.data.stats.coinsEarned += state.def.coins;
    this.grantXp(state.def.xp);
    this.emitChange();
    this.emit('bundle', { id });
    return { ok: true, message: `Bundle complete! +${state.def.coins} coins.` };
  }

  bundlesCompleted(): number {
    return (this.data.bundles ?? []).filter((b) => b.claimed).length;
  }

  /** Fills in anything a save from an older version is missing. */
  private ensureDailyLife(): void {
    if (!this.data.professions) this.data.professions = {};
    if (!Array.isArray(this.data.forage)) this.data.forage = [];
    if (!Array.isArray(this.data.mail)) this.data.mail = [];
    if (!Array.isArray(this.data.bundles)) this.data.bundles = [];
    if (!Array.isArray(this.data.buffs)) this.data.buffs = [];
    const max = this.maxEnergy();
    if (typeof this.data.energy !== 'number' || !Number.isFinite(this.data.energy)) {
      this.data.energy = max;
    }
    this.data.energy = clamp(this.data.energy, 0, max);
    this.deliverLetters();
  }

  private syncCollectionFromInventory(): void {
    for (const stack of this.data.inventory) {
      if (!stack) continue;
      recordCollection(this.data, stack.itemId, stack.quality);
    }
  }

  private ensureSeasonalBoard(): void {
    const d = this.data;
    if (!seasonalBoardMatches(d.seasonal, d.season, d.year)) {
      d.seasonal = generateSeasonal(d.season, d.year, d.stats);
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

  hasHelperHut(): boolean {
    return this.data.buildings.some((b) => BUILDINGS[b.id]?.kind === 'automation');
  }

  // ------------------------------------------------------------------ tools

  /** The bonus of the best tool owned for a job. Only one tool per job counts. */
  toolBonus(effect: ToolEffect): number {
    let best = 0;
    for (const tool of TOOLS) {
      if (tool.effect !== effect || tool.bonus <= best) continue;
      if (!this.data.toolsOwned.includes(tool.id)) continue;
      best = tool.bonus;
    }
    return best;
  }

  hasTool(toolId: string): boolean {
    return this.data.toolsOwned.includes(toolId);
  }

  buyTool(toolId: string): ActionResult {
    const def = TOOLS.find((tool) => tool.id === toolId);
    if (!def) return { ok: false, message: 'Unknown tool.' };
    if (this.hasTool(toolId)) return { ok: false, message: 'You already own this tool.' };
    if (this.level < def.unlockLevel) {
      return { ok: false, message: `Unlocks at farmer level ${def.unlockLevel}.` };
    }
    if (this.data.coins < def.price) return { ok: false, message: 'Not enough coins.' };
    this.data.coins -= def.price;
    this.data.toolsOwned.push(toolId);
    this.ensureCapacity();
    this.addXp('business', 6, false);
    this.emitChange();
    this.emit('tool', { toolId });
    this.checkProgress();
    return { ok: true, message: `${def.name} equipped. ${def.desc}` };
  }

  get today(): number {
    return absoluteDay(this.data.season, this.data.year, this.data.day);
  }

  get spouseName(): string | null {
    return this.data.spouseId ? NPCS[this.data.spouseId]?.name ?? null : null;
  }

  capacity(): number {
    const sheds = this.data.buildings.reduce((sum, b) => sum + (BUILDINGS[b.id]?.slots ?? 0), 0);
    return (
      BASE_CAPACITY +
      (this.data.upgrades.backpack ?? 0) * 6 +
      sheds +
      this.toolBonus('bag') +
      (this.data.farmhouseLevel - 1) * 4 +
      houseBonus(this.data.house ?? { furniture: [] }, 'capacity')
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
      else if (!stack.locked && stack.itemId === itemId && stack.quality === quality && stack.qty < def.stack) {
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
      if (stack && !stack.locked && stack.itemId === itemId && stack.quality === quality && stack.qty < def.stack) {
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
    if (left === 0) recordCollection(this.data, itemId, quality);
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
    if (this.hasItem('fishing_rod')) ids.push('fishing_rod');
    if (this.hasItem('pickaxe')) ids.push('pickaxe');
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
    const radius = (this.data.upgrades.hoe ?? 0) + this.toolBonus('till');
    const perTile = this.energyCost('till');
    if (!this.hasEnergy(perTile)) return { ...this.outOfEnergy(perTile), tiles: 0 };
    let count = 0;
    for (let y = cy - radius; y <= cy + radius; y++) {
      for (let x = cx - radius; x <= cx + radius; x++) {
        if (!this.isFarmable(x, y)) continue;
        const tile = this.tileAt(x, y);
        if (tile?.tilled) continue;
        if (!this.isWithinInteraction(x, y)) continue;
        if (!this.hasEnergy(perTile)) break;
        const t = this.ensureTile(x, y);
        t.tilled = true;
        this.spendEnergy(perTile);
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
    const radius = (this.data.upgrades.can ?? 0) + this.toolBonus('water');
    const perTile = this.energyCost('water');
    if (!this.hasEnergy(perTile)) return { ...this.outOfEnergy(perTile), tiles: 0 };
    let count = 0;
    for (let y = cy - radius; y <= cy + radius; y++) {
      for (let x = cx - radius; x <= cx + radius; x++) {
        if (!inBounds(x, y) || !this.isWithinInteraction(x, y)) continue;
        const tile = this.tileAt(x, y);
        if (!tile || !tile.tilled || tile.watered) continue;
        if (!this.hasEnergy(perTile)) break;
        tile.watered = true;
        this.spendEnergy(perTile);
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
    const fertCost = this.energyCost('fertilize');
    if (!this.hasEnergy(fertCost)) return this.outOfEnergy(fertCost);
    this.spendEnergy(fertCost);
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
    const plantCost = this.energyCost('plant');
    if (!this.hasEnergy(plantCost)) return this.outOfEnergy(plantCost);
    this.spendEnergy(plantCost);
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
    const harvestCost = this.energyCost('harvest');
    if (!this.hasEnergy(harvestCost)) return this.outOfEnergy(harvestCost);
    let yieldQty = randomInt(def.yieldMin, def.yieldMax, this.rng);
    if (this.professionSum('extraYield') > 0 && this.rng() < 0.25) yieldQty += 1;
    if (this.freeSpaceFor(def.harvestId, quality) < yieldQty) {
      return { ok: false, message: 'Your inventory is full!' };
    }
    this.spendEnergy(harvestCost);
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

  // Plant the same seed across every empty, tilled tile within reach.
  plantSweep(cx: number, cy: number, seedId: string): ActionResult & { tiles: number } {
    const cropDef = cropForSeed(seedId);
    if (!cropDef) return { ok: false, tiles: 0, message: 'That is not a seed.' };
    if (!this.hasItem(seedId)) return { ok: false, tiles: 0, message: 'You are out of those seeds.' };
    const plantCost = this.energyCost('plant');
    if (!this.hasEnergy(plantCost)) return { ...this.outOfEnergy(plantCost), tiles: 0 };
    if (!this.canPlantCrop(cropDef.id)) {
      const seasons = cropDef.seasons.map((s) => SEASON_INFO[s].name).join(' or ');
      return { ok: false, tiles: 0, message: `${cropDef.name} grows in ${seasons}. Build a greenhouse to plant it now.` };
    }
    const radius = (this.data.upgrades.can ?? 0) + this.toolBonus('plant');
    let count = 0;
    for (let y = cy - radius; y <= cy + radius; y++) {
      for (let x = cx - radius; x <= cx + radius; x++) {
        if (!inBounds(x, y) || !this.isWithinInteraction(x, y)) continue;
        const tile = this.tileAt(x, y);
        if (!tile?.tilled || tile.crop) continue;
        if (!this.isFarmable(x, y)) continue;
        if (!this.hasItem(seedId)) break;
        if (!this.hasEnergy(plantCost)) break;
        this.spendEnergy(plantCost);
        this.removeItem(seedId, 1);
        tile.crop = { id: cropDef.id, growth: 0, dryDays: 0, regrows: 0 };
        this.data.stats.planted += 1;
        this.addXp('farming', 2, false);
        count += 1;
      }
    }
    if (count === 0) return { ok: false, tiles: 0, message: 'No empty tilled soil nearby.' };
    this.emitChange();
    this.emit('plant', { x: cx, y: cy, cropId: cropDef.id });
    this.checkProgress();
    return { ok: true, tiles: count, message: `Planted ${count} ${cropDef.name}${count === 1 ? '' : 's'}.` };
  }

  // Harvest every ripe crop on one field, if the farmer can reach the gate.
  harvestField(plotId: number): ActionResult & { tiles: number; kinds: number } {
    const plot = PLOTS[plotId];
    if (!plot) return { ok: false, tiles: 0, kinds: 0, message: 'Unknown field.' };
    if (plotId >= this.data.unlockedPlots) {
      return { ok: false, tiles: 0, kinds: 0, message: 'Buy this field first.' };
    }
    const gateX = plot.x + Math.floor(plot.w / 2);
    const gateY = plot.y + plot.h - 1;
    if (!this.isWithinInteraction(gateX, gateY)) {
      return { ok: false, tiles: 0, kinds: 0, message: 'Stand next to this field\u2019s gate to harvest it.' };
    }
    const harvestCost = this.energyCost('harvest');
    const ready: Array<{ x: number; y: number; crop: string }> = [];
    for (let y = plot.y; y < plot.y + plot.h; y++) {
      for (let x = plot.x; x < plot.x + plot.w; x++) {
        if (this.cropMature(x, y)) ready.push({ x, y, crop: this.tileAt(x, y)!.crop!.id });
      }
    }
    if (ready.length === 0) {
      return { ok: false, tiles: 0, kinds: 0, message: 'Nothing on this field is ready yet.' };
    }
    let harvested = 0;
    const kinds = new Set<string>();
    for (const spot of ready) {
      if (!this.hasEnergy(harvestCost)) break;
      const tile = this.tileAt(spot.x, spot.y);
      const def = tile?.crop ? CROPS[tile.crop.id] : undefined;
      if (!tile?.crop || !def) continue;
      const quality = this.rollQuality(tile);
      let yieldQty = randomInt(def.yieldMin, def.yieldMax, this.rng);
      if (this.professionSum('extraYield') > 0 && this.rng() < 0.25) yieldQty += 1;
      if (this.freeSpaceFor(def.harvestId, quality) < yieldQty) break;
      this.spendEnergy(harvestCost);
      this.addItem(def.harvestId, yieldQty, quality);
      this.data.stats.harvests += 1;
      if (def.id === 'carrots') this.data.stats.carrotsHarvested += yieldQty;
      if (quality === 'gold') this.data.stats.goldHarvests += 1;
      this.addXp('farming', 6 + yieldQty, false);
      kinds.add(def.id);
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
        this.cleanupTile(spot.x, spot.y);
      }
      this.emit('harvest', { x: spot.x, y: spot.y, cropId: def.id, qty: yieldQty, quality });
      harvested += 1;
    }
    if (harvested === 0) {
      return { ok: false, tiles: 0, kinds: 0, message: 'Your backpack is full or you are out of energy.' };
    }
    this.emitChange();
    this.checkProgress();
    return {
      ok: true,
      tiles: harvested,
      kinds: kinds.size,
      message: `Harvested ${harvested} pile${harvested === 1 ? '' : 's'} from ${plot.name}.`
    };
  }

  private rollQuality(tile: TileSave): Quality {
    const level = levelFromXp(this.data.xp.farming);
    const fert = tile.fertilized ? 0.16 : 0;
    const luck =
      this.toolBonus('luck') +
      this.professionSum('luck') +
      this.buffSum('luck') +
      houseBonus(this.data.house ?? { furniture: [] }, 'luck') +
      petBonus(this.data.pet ?? { type: null, name: '', affection: 0, lastPetDay: 0 }) +
      (this.data.dailyLuck ?? 0);
    const goldChance = 0.02 + fert + level * 0.008 + luck;
    const silverChance = 0.2 + fert * 1.4 + level * 0.015 + luck;
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
    if (def.stack <= 1) qty = 1;
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
    const bonus = 1 + this.professionSum('sellPrice');
    return Math.max(1, Math.round(base * QUALITY_MULTIPLIER[quality] * this.marketTrend(itemId) * bonus));
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
    if (stack.locked) return { ok: false, message: 'This item is locked. Unlock it to sell.' };
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
      if (stack.locked) continue;
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

  private placementOk(def: BuildingDef, x: number, y: number, ignoreUid: string | null): ActionResult {
    if (x < 0 || y < 0 || x + def.w > WORLD_W || y + def.h > WORLD_H) {
      return { ok: false, message: 'Does not fit here.' };
    }
    const clash = this.data.buildings.find((b) => {
      if (b.uid === ignoreUid) return false;
      const other = BUILDINGS[b.id];
      if (!other) return false;
      return x < b.x + other.w && x + def.w > b.x && y < b.y + other.h && y + def.h > b.y;
    });
    if (clash) return { ok: false, message: 'Something is already built here.' };
    for (let ty = y; ty < y + def.h; ty++) {
      for (let tx = x; tx < x + def.w; tx++) {
        if (isWaterTile(tx, ty) || isObstacleTile(tx, ty) || isMineNodeTile(tx, ty)) {
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

  canPlaceBuilding(buildingId: string, x: number, y: number): ActionResult {
    const def = BUILDINGS[buildingId];
    if (!def) return { ok: false, message: 'Unknown building.' };
    if (buildingId === 'farmhouse') return { ok: false, message: 'The farmhouse is already built.' };
    if (this.level < def.unlockLevel) {
      return { ok: false, message: `Unlocks at farmer level ${def.unlockLevel}.` };
    }
    if (this.data.coins < def.cost) return { ok: false, message: 'Not enough coins.' };
    return this.placementOk(def, x, y, null);
  }

  canMoveBuilding(uid: string, x: number, y: number): ActionResult {
    const b = this.data.buildings.find((entry) => entry.uid === uid);
    if (!b) return { ok: false, message: 'Building not found.' };
    const def = BUILDINGS[b.id];
    if (!def) return { ok: false, message: 'Unknown building.' };
    return this.placementOk(def, x, y, uid);
  }

  moveBuilding(uid: string, x: number, y: number): ActionResult {
    const b = this.data.buildings.find((entry) => entry.uid === uid);
    if (!b) return { ok: false, message: 'Building not found.' };
    const def = BUILDINGS[b.id];
    if (!def) return { ok: false, message: 'Unknown building.' };
    if (b.x === x && b.y === y) return { ok: false, message: 'It is already there.' };
    const check = this.canMoveBuilding(uid, x, y);
    if (!check.ok) return check;
    b.x = x;
    b.y = y;
    this.emitChange();
    this.emit('build', { buildingId: b.id, x, y });
    return { ok: true, message: `${def.name} moved.` };
  }

  removeBuilding(uid: string): ActionResult & { refund?: number } {
    const index = this.data.buildings.findIndex((entry) => entry.uid === uid);
    if (index < 0) return { ok: false, message: 'Building not found.' };
    const b = this.data.buildings[index];
    const def = BUILDINGS[b.id];
    if (!def) return { ok: false, message: 'Unknown building.' };
    if (b.id === 'farmhouse') return { ok: false, message: 'You cannot remove your own farmhouse.' };
    const x0 = b.x * TILE;
    const y0 = b.y * TILE;
    const x1 = (b.x + def.w) * TILE;
    const y1 = (b.y + def.h) * TILE;
    const inside = this.data.animals.find((a) => a.x >= x0 && a.x < x1 && a.y >= y0 && a.y < y1);
    if (inside) {
      const species = ANIMALS[inside.species]?.name ?? 'animal';
      return { ok: false, message: `Move your ${species} out of the way first.` };
    }
    const refund = Math.floor(def.cost * 0.5);
    this.data.buildings.splice(index, 1);
    this.data.coins += refund;
    this.ensureCapacity();
    this.emitChange();
    this.emit('build', { buildingId: b.id, x: b.x, y: b.y });
    return { ok: true, refund, message: `${def.name} removed. ${refund} coins refunded.` };
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

  housingCapacity(kind: HousingId): number {
    return this.data.buildings.reduce((sum, b) => {
      const def = BUILDINGS[b.id];
      if (def?.kind === 'housing' && def.houses === kind) return sum + (def.capacity ?? 0);
      return sum;
    }, 0);
  }

  animalsInHousing(kind: HousingId): number {
    return this.data.animals.filter((a) => ANIMALS[a.species]?.housing === kind).length;
  }

  nextHousingBuilding(species: string): BuildingSave | undefined {
    const def = ANIMALS[species];
    if (!def) return undefined;
    return this.data.buildings.find(
      (b) => BUILDINGS[b.id]?.houses === def.housing && this.animalsInHousing(def.housing) < this.housingCapacity(def.housing)
    );
  }

  buyAnimal(species: string): ActionResult {
    const def = ANIMALS[species];
    if (!def) return { ok: false, message: 'Unknown animal.' };
    if (this.animalsInHousing(def.housing) >= this.housingCapacity(def.housing)) {
      return {
        ok: false,
        message: `You need more ${def.housing} housing with free space first.`
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

  petAll(): ActionResult {
    const lonely = this.data.animals.filter((a) => !a.petted);
    if (lonely.length === 0) return { ok: false, message: 'All animals have been petted today.' };
    for (const animal of lonely) {
      animal.petted = true;
      animal.happiness = clamp(animal.happiness + 8, 0, 100);
    }
    this.addXp('animal', 2 * lonely.length, false);
    this.emitChange();
    return { ok: true, message: `Petted ${lonely.length} animal${lonely.length === 1 ? '' : 's'}.` };
  }

  collectAnimal(animalUid: string): ActionResult {
    const animal = this.getAnimal(animalUid);
    if (!animal) return { ok: false, message: 'Animal not found.' };
    const def = ANIMALS[animal.species];
    if (!def) return { ok: false, message: 'Unknown animal.' };
    if (!animal.productReady) return { ok: false, message: 'No product ready yet.' };
    let qty = 1;
    if (this.professionSum('extraYield') > 0 && this.rng() < 0.25) qty = 2;
    if (this.freeSpaceFor(def.productId) < qty) return { ok: false, message: 'Your inventory is full.' };
    this.addItem(def.productId, qty);
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


  // ------------------------------------------------------------- collection

  collectionState() {
    const sets = COLLECTION_SETS.map((set) => collectionSetState(this.data, set));
    return { sets, total: collectionTotal(this.data), ribbons: this.data.ribbons.slice() };
  }

  claimCollectionMilestone(setId: string, milestoneId: string): ActionResult {
    const set = COLLECTION_SETS.find((entry) => entry.id === setId);
    if (!set) return { ok: false, message: 'Unknown collection.' };
    const state = collectionSetState(this.data, set);
    const milestone = state.milestones.find((entry) => entry.def.id === milestoneId);
    if (!milestone) return { ok: false, message: 'Unknown collection reward.' };
    if (milestone.claimed) return { ok: false, message: 'That reward is already claimed.' };
    if (state.found < milestone.def.count) {
      return { ok: false, message: `Collect ${milestone.def.count - state.found} more entries first.` };
    }
    this.data.collection.claimedRewards.push(milestoneId);
    this.data.coins += milestone.def.coins;
    this.data.stats.coinsEarned += milestone.def.coins;
    this.grantXp(milestone.def.xp);
    this.emitChange();
    return {
      ok: true,
      message: `Collection reward claimed: +${milestone.def.coins} coins and ${milestone.def.xp} XP.`
    };
  }

  // -------------------------------------------------------------- automation

  automationState(id: string) {
    const def = AUTOMATION.find((entry) => entry.id === id);
    if (!def) return null;
    const purchased = this.data.automation.purchased.includes(id);
    const enabled = purchased && !this.data.automation.disabled.includes(id);
    return { def, purchased, enabled };
  }

  buyAutomation(id: string): ActionResult {
    const def = AUTOMATION.find((entry) => entry.id === id);
    if (!def) return { ok: false, message: 'Unknown helper.' };
    if (!this.hasHelperHut()) return { ok: false, message: "Build the Helper's Cottage first." };
    if (this.data.automation.purchased.includes(id)) return { ok: false, message: 'That helper is already hired.' };
    if (this.level < def.unlockLevel) return { ok: false, message: `Unlocks at farmer level ${def.unlockLevel}.` };
    if (this.data.coins < def.cost) return { ok: false, message: 'Not enough coins.' };
    this.data.coins -= def.cost;
    this.data.automation.purchased.push(id);
    this.data.automation.disabled = this.data.automation.disabled.filter((entry) => entry !== id);
    this.addXp('business', 15, false);
    this.emitChange();
    return { ok: true, message: `${def.name} hired. It runs overnight while enabled.` };
  }

  toggleAutomation(id: string): ActionResult {
    const def = AUTOMATION.find((entry) => entry.id === id);
    if (!def) return { ok: false, message: 'Unknown helper.' };
    if (!this.data.automation.purchased.includes(id)) return { ok: false, message: 'Hire that helper first.' };
    const disabled = this.data.automation.disabled.includes(id);
    if (disabled) {
      this.data.automation.disabled = this.data.automation.disabled.filter((entry) => entry !== id);
    } else {
      this.data.automation.disabled.push(id);
    }
    this.emitChange();
    return { ok: true, message: `${def.name} ${disabled ? 'enabled' : 'paused'}.` };
  }

  private runAutomation(messages: string[]): void {
    if (!this.hasHelperHut()) return;
    const enabled = (id: string): boolean =>
      this.data.automation.purchased.includes(id) && !this.data.automation.disabled.includes(id);

    if (enabled('auto_collect')) {
      let collected = 0;
      for (const animal of this.data.animals) {
        const def = ANIMALS[animal.species];
        if (!def || !animal.productReady) continue;
        if (this.freeSpaceFor(def.productId) < 1) break;
        this.addItem(def.productId, 1);
        animal.productReady = false;
        this.data.stats.productsCollected += 1;
        if (def.productId === 'egg' || def.productId === 'duck_egg') this.data.stats.eggsCollected += 1;
        collected += 1;
      }
      if (collected > 0) messages.push(`Helper collected ${collected} animal product${collected === 1 ? '' : 's'}.`);
    }

    if (enabled('auto_harvest')) {
      let harvested = 0;
      for (const [key, tile] of Object.entries(this.data.tiles)) {
        if (!tile.crop) continue;
        const def = CROPS[tile.crop.id];
        if (!def || tile.crop.growth < def.growthDays) continue;
        const qty = randomInt(def.yieldMin, def.yieldMax, this.rng);
        if (this.freeSpaceFor(def.harvestId, 'normal') < qty) break;
        this.addItem(def.harvestId, qty, 'normal');
        this.data.stats.harvests += 1;
        if (def.id === 'carrots') this.data.stats.carrotsHarvested += qty;
        if (def.regrowDays > 0) {
          tile.crop.growth = Math.max(0, def.growthDays - def.regrowDays);
          tile.crop.regrows += 1;
          tile.crop.dryDays = 0;
          tile.watered = false;
        } else {
          tile.crop = undefined;
          tile.watered = false;
          tile.fertilized = false;
          if (!tile.tilled) delete this.data.tiles[key];
        }
        harvested += 1;
      }
      if (harvested > 0) messages.push(`Helper harvested ${harvested} crop${harvested === 1 ? '' : 's'}.`);
    }

    if (enabled('auto_replant')) {
      let planted = 0;
      for (const tile of Object.values(this.data.tiles)) {
        if (!tile.tilled || tile.crop) continue;
        const seed = SEED_IDS.find((seedId) => {
          const crop = cropForSeed(seedId);
          return !!crop && this.hasItem(seedId) && this.canPlantCrop(crop.id);
        });
        if (!seed) break;
        const crop = cropForSeed(seed);
        if (!crop) continue;
        this.removeItem(seed, 1);
        tile.crop = { id: crop.id, growth: 0, dryDays: 0, regrows: 0 };
        this.data.stats.planted += 1;
        planted += 1;
      }
      if (planted > 0) messages.push(`Helper replanted ${planted} tile${planted === 1 ? '' : 's'}.`);
    }

    if (enabled('auto_feed')) {
      const hungry = this.data.animals.filter((animal) => !animal.fed);
      const count = Math.min(hungry.length, this.countItem('feed'));
      if (count > 0) {
        this.removeItem('feed', count);
        for (let i = 0; i < count; i++) hungry[i].fed = true;
        messages.push(`Helper fed ${count} animal${count === 1 ? '' : 's'}.`);
      }
    }
  }

  // ---------------------------------------------------------------- festival

  ensureFestivalDay(): void {
    const d = this.data;
    if (d.day !== DAYS_PER_SEASON) {
      if (d.festival && d.festival.season !== d.season) d.festival = null;
      return;
    }
    if (!d.festival || d.festival.season !== d.season || d.festival.year !== d.year) {
      d.festival = {
        season: d.season,
        year: d.year,
        submitted: false,
        score: 0,
        tier: 'none',
        claimed: false
      };
    }
  }

  festivalAvailable(): boolean {
    return this.data.day === DAYS_PER_SEASON && !!this.data.festival;
  }

  festivalState() {
    if (!this.festivalAvailable() || !this.data.festival) return null;
    const contest = festivalContest(this.data.season);
    const selection = festivalBestSelection(this.data);
    return {
      contest,
      festival: this.data.festival,
      selection,
      tier: this.data.festival.tier,
      score: this.data.festival.score
    };
  }

  submitFestival(): ActionResult {
    if (!this.festivalAvailable() || !this.data.festival) {
      return { ok: false, message: 'The judging stand is only open on the last day of the season.' };
    }
    const festival = this.data.festival;
    if (festival.submitted) return { ok: false, message: 'You have already submitted this year.' };
    const selection = festivalBestSelection(this.data);
    const contest = festivalContest(this.data.season);
    if (selection.totalItems < contest.count) {
      return {
        ok: false,
        message: `The judges need ${contest.count} eligible ${contest.itemType} items.`
      };
    }
    for (const candidate of selection.candidates) {
      const stack = this.data.inventory[candidate.index];
      if (!stack || stack.itemId !== candidate.itemId) continue;
      stack.qty -= candidate.take;
      if (stack.qty <= 0) this.data.inventory[candidate.index] = null;
    }
    const tier = festivalTierFor(selection.score, contest);
    festival.submitted = true;
    festival.score = selection.score;
    festival.tier = tier;
    festival.claimed = false;
    this.emitChange();
    return {
      ok: true,
      message: `${contest.name}: score ${selection.score}. ${tier === 'none' ? 'No ribbon this year.' : `${tier.toUpperCase()} ribbon!`}`
    };
  }

  claimFestivalReward(): ActionResult {
    const festival = this.data.festival;
    if (!festival || !festival.submitted) return { ok: false, message: 'Submit an entry first.' };
    if (festival.claimed) return { ok: false, message: 'Festival reward already claimed.' };
    if (festival.tier === 'none') return { ok: false, message: 'No ribbon, no prize. Try again next year.' };
    const contest = festivalContest(festival.season);
    festival.claimed = true;
    this.data.coins += contest.coins;
    this.data.stats.coinsEarned += contest.coins;
    this.grantXp(contest.xp);
    const ribbon = `${contest.ribbon}_${festival.tier}`;
    if (!this.data.ribbons.includes(ribbon)) this.data.ribbons.push(ribbon);
    this.emitChange();
    return {
      ok: true,
      message: `Festival prize: +${contest.coins} coins, ${contest.xp} XP, and a ${festival.tier} ribbon.`
    };
  }

  // ----------------------------------------------------------------- fishing

  currentFishPool() {
    return eligibleFish(this.data);
  }

  registerFishingCast(): { ok: boolean; message?: string; baitUsed: boolean } {
    if (!this.hasItem('fishing_rod')) return { ok: false, message: 'You need a fishing rod.', baitUsed: false };
    const baitUsed = this.hasItem('bait');
    if (baitUsed) this.removeItem('bait', 1);
    this.data.stats.fishingCasts += 1;
    this.emitChange();
    return { ok: true, baitUsed };
  }

  catchFish(): ActionResult & { fishId?: string; name?: string } {
    if (!this.hasItem('fishing_rod')) return { ok: false, message: 'You need a fishing rod.' };
    const fish = selectFish(this.data, this.rng, this.toolBonus('rod'));
    const item = ITEMS[fish.itemId];
    if (!item) return { ok: false, message: 'Unknown fish.' };
    if (this.freeSpaceFor(fish.itemId) < 1) return { ok: false, message: 'Your inventory is full.' };
    this.addItem(fish.itemId, 1, 'normal');
    this.data.stats.fishCaught += 1;
    this.addXp('fishing', 10, false);
    this.emitChange();
    return { ok: true, fishId: fish.id, name: fish.name, message: `You caught a ${fish.name}!` };
  }

  // ------------------------------------------------------------------ mining

  mineNodeState(nodeId: string) {
    const node = mineNodeById(nodeId);
    if (!node) return null;
    return {
      node,
      hp: nodeHp(this.data, node),
      maxHp: MINE_NODE_MAX_HP
    };
  }

  mineNodeAtTile(x: number, y: number) {
    return mineNodeAt(x, y);
  }

  mineNode(nodeId: string): ActionResult & { broke?: boolean; loot?: Array<{ itemId: string; qty: number }> } {
    const node = mineNodeById(nodeId);
    if (!node) return { ok: false, message: 'That rock is gone.' };
    if (!this.hasItem('pickaxe')) return { ok: false, message: 'You need a pickaxe.' };
    if (!this.isWithinInteraction(node.x, node.y)) return { ok: false, message: 'Move closer to the rock.' };
    const mineCost = this.energyCost('mine');
    if (!this.hasEnergy(mineCost)) return this.outOfEnergy(mineCost);
    const hp = nodeHp(this.data, node);
    if (hp <= 0) return { ok: false, message: 'This rock needs time to reform.' };
    const nextHp = hp - (1 + this.toolBonus('mine'));
    const finalHit = nextHp <= 0;
    const loot = miningLoot(node.kind, finalHit, this.rng);
    if (this.professionSum('extraYield') > 0 && this.rng() < 0.25) {
      const ore = loot.find((entry) => ITEMS[entry.itemId]?.type === 'ore');
      if (ore) ore.qty += 1;
    }
    for (const entry of loot) {
      const def = ITEMS[entry.itemId];
      if (def && this.freeSpaceFor(entry.itemId) < entry.qty) {
        return { ok: false, message: 'Your inventory is full.' };
      }
    }
    for (const entry of loot) this.addItem(entry.itemId, entry.qty);
    this.spendEnergy(mineCost);
    const state: MineNodeSave = {
      hp: nextHp,
      respawnDay: finalHit ? this.today + 2 : 0
    };
    this.data.mineNodes[node.id] = state;
    this.data.stats.rocksMined += finalHit ? 1 : 0;
    this.data.stats.oresMined += loot.filter((entry) => ITEMS[entry.itemId]?.type === 'ore').reduce((sum, entry) => sum + entry.qty, 0);
    this.addXp('mining', finalHit ? 5 : 1, false);
    this.emitChange();
    return {
      ok: true,
      broke: finalHit,
      loot,
      message: finalHit ? `You broke the ${node.kind === 'stone' ? 'rock' : `${node.kind} vein`}!` : 'The rock cracks.'
    };
  }

  // ----------------------------------------------------------- old mine / town

  private ensureLifeState(): void {
    const d = this.data;
    if (!d.mineRun) d.mineRun = createMineRun();
    if (!d.shipping) d.shipping = { items: [] };
    if (!Array.isArray(d.lostItems)) d.lostItems = [];
    if (!Array.isArray(d.summitClaimed)) d.summitClaimed = [];
    if (d.evaluation === undefined) d.evaluation = null;
    if (!d.family) d.family = { children: [] };
    if (!d.house) d.house = { furniture: [] };
    if (!d.museum) d.museum = { donated: [], claimed: [] };
    if (!d.pet) d.pet = { type: null, name: '', affection: 0, lastPetDay: 0 };
    if (typeof d.horseOwned !== 'boolean') d.horseOwned = false;
    if (!d.festivalGame) {
      d.festivalGame = { season: d.season, year: d.year, played: false, score: 0 };
    }
    for (const npc of Object.values(d.npcs ?? {})) {
      if (!Array.isArray(npc.heartEvents)) npc.heartEvents = [];
    }
    this.syncMineStats();
  }

  private syncMineStats(): void {
    const run = this.data.mineRun;
    const max = maxMineHp(this.skillLevel('mining'), houseBonus(this.data.house, 'energy'));
    run.maxHp = max;
    if (!Number.isFinite(run.hp) || run.hp <= 0) run.hp = max;
    run.hp = clamp(run.hp, 0, max);
  }

  /** Current mine status for the HUD and the mine panel. */
  mineState() {
    const run = this.data.mineRun;
    return {
      run,
      weapon: equippedWeapon(run),
      active: !!this.mineFloor,
      floor: this.mineFloor
        ? {
            number: this.mineFloor.floor,
            tiles: this.mineFloor.tiles,
            rocks: this.mineFloor.rocks,
            monsters: this.mineFloor.monsters,
            ladder: this.mineFloor.ladder,
            player: this.mineFloor.player,
            steps: this.mineFloor.steps
          }
        : null
    };
  }

  enterMine(floor = this.data.mineRun.floor): ActionResult {
    if (!this.hasItem('pickaxe')) return { ok: false, message: 'You need a pickaxe to explore the old mine.' };
    const target = clamp(Math.floor(floor), 1, MINE_MAX_FLOOR);
    this.syncMineStats();
    this.data.mineRun.floor = target;
    this.data.mineRun.maxFloor = Math.max(this.data.mineRun.maxFloor, target);
    this.data.mineRun.hp = this.data.mineRun.maxHp;
    this.mineFloor = generateMineFloor(target, this.data, this.rng);
    this.emitChange();
    return { ok: true, message: `You climb down to mine floor ${target}.` };
  }

  private mineRescue(reason: string): string {
    const run = this.data.mineRun;
    const lost = Math.floor(this.data.coins * 0.1);
    this.data.coins = Math.max(0, this.data.coins - lost);
    run.floor = 1;
    run.hp = run.maxHp;
    this.mineFloor = null;
    this.emitChange();
    return `${reason} You wake at the mine entrance${lost > 0 ? `, ${lost} coins lighter` : ''}.`;
  }

  private grantMineLoot(
    loot: Array<{ itemId: string; qty: number }>
  ): { ok: boolean; message?: string } {
    for (const entry of loot) {
      if (this.freeSpaceFor(entry.itemId) < entry.qty) {
        return { ok: false, message: 'Your backpack is full — leave some room before mining.' };
      }
    }
    for (const entry of loot) {
      this.addItem(entry.itemId, entry.qty);
      if (ITEMS[entry.itemId]?.type === 'artifact') {
        this.data.stats.artifactsFound += entry.qty;
      }
    }
    return { ok: true };
  }

  mineStep(dx: number, dy: number): ActionResult {
    if (!this.mineFloor) return this.enterMine();
    const floor = this.mineFloor;
    const run = this.data.mineRun;
    const nx = floor.player.x + dx;
    const ny = floor.player.y + dy;
    if (nx <= 0 || ny <= 0 || nx >= MINE_FLOOR_W - 1 || ny >= MINE_FLOOR_H - 1) {
      return { ok: false, message: 'A rock wall blocks the way.' };
    }

    const rock = rockAt(floor, nx, ny);
    if (rock) {
      const cost = this.energyCost('mine');
      if (!this.hasEnergy(cost)) return this.outOfEnergy(cost);
      const damage = 1 + this.toolBonus('mine');
      rock.hp -= damage;
      this.spendEnergy(cost);
      this.addXp('mining', 1, false);
      if (rock.hp > 0) {
        this.emitChange();
        return { ok: true, message: `The ${rock.kind} rock cracks (${rock.hp}/${rock.maxHp}).` };
      }
      const loot = rockLoot(rock.kind, this.rng);
      const granted = this.grantMineLoot(loot);
      if (!granted.ok) {
        rock.hp = 1;
        this.emitChange();
        return { ok: false, message: granted.message };
      }
      floor.rocks = floor.rocks.filter((entry) => entry.id !== rock.id);
      floor.tiles[ny][nx] = 'floor';
      this.data.stats.rocksMined += 1;
      this.data.stats.oresMined += loot.filter((entry) => ITEMS[entry.itemId]?.type === 'ore').length;
      this.addXp('mining', 5, false);
      this.emitChange();
      return {
        ok: true,
        message: `You break the ${rock.kind === 'stone' ? 'rock' : `${rock.kind} vein`}!`
      };
    }

    const monster = monsterAt(floor, nx, ny);
    if (monster) {
      const cost = 2;
      if (!this.hasEnergy(cost)) return this.outOfEnergy(cost);
      this.spendEnergy(cost);
      const weapon = equippedWeapon(run);
      const damage =
        weapon.damage + Math.floor(this.skillLevel('mining') / 2) + randomInt(0, 2, this.rng);
      monster.hp -= damage;
      this.addXp('mining', 1, false);
      if (monster.hp > 0) {
        const hurt = monsterDamage(monster.def, floor.floor);
        run.hp = Math.max(0, run.hp - hurt);
        this.emitChange();
        if (run.hp <= 0) {
          return { ok: false, message: this.mineRescue(`A ${monster.def.name} knocks you out.`) };
        }
        return {
          ok: true,
          message: `You hit the ${monster.def.name} for ${damage}. It strikes back for ${hurt}.`
        };
      }
      const loot = monster.def.loot.map((itemId) => ({
        itemId,
        qty: 1 + (this.rng() < 0.35 ? 1 : 0)
      }));
      if (this.rng() < 0.12) {
        const artifacts = ['artifact_coin', 'artifact_bone', 'artifact_doll', 'artifact_scroll'];
        loot.push({ itemId: artifacts[Math.floor(this.rng() * artifacts.length)], qty: 1 });
      }
      this.grantMineLoot(loot);
      floor.monsters = floor.monsters.filter((entry) => entry.uid !== monster.uid);
      run.monstersDefeated += 1;
      this.data.stats.monstersDefeated += 1;
      this.addXp('mining', monster.def.xp, false);
      this.emitChange();
      return { ok: true, message: `You defeat the ${monster.def.name}!` };
    }

    floor.player = { x: nx, y: ny };
    floor.steps += 1;
    this.emitChange();
    if (floor.tiles[ny][nx] === 'ladder') {
      return { ok: true, message: 'A ladder leads deeper. Use Descend when you are ready.' };
    }
    return { ok: true };
  }

  descendMine(): ActionResult {
    if (!this.mineFloor) return this.enterMine();
    const floor = this.mineFloor;
    if (floor.player.x !== floor.ladder.x || floor.player.y !== floor.ladder.y) {
      return { ok: false, message: 'Stand on the ladder before descending.' };
    }
    if (floor.floor >= MINE_MAX_FLOOR) {
      return { ok: false, message: 'You have reached the bottom of the old mine.' };
    }
    const cost = 3;
    if (!this.hasEnergy(cost)) return this.outOfEnergy(cost);
    this.spendEnergy(cost);
    const next = floor.floor + 1;
    const run = this.data.mineRun;
    run.floor = next;
    run.maxFloor = Math.max(run.maxFloor, next);
    run.hp = Math.min(run.maxHp, run.hp + 6);
    if ((next - 1) % 5 === 0 && !run.elevator.includes(next)) run.elevator.push(next);
    this.mineFloor = generateMineFloor(next, this.data, this.rng);
    this.emitChange();
    return { ok: true, message: `You climb down to floor ${next}.` };
  }

  useElevator(floor: number): ActionResult {
    const run = this.data.mineRun;
    const target = Math.floor(floor);
    if (!run.elevator.includes(target)) return { ok: false, message: 'The elevator does not stop there yet.' };
    if (target > run.maxFloor) return { ok: false, message: 'You have not reached that floor.' };
    return this.enterMine(target);
  }

  returnToSurface(): ActionResult {
    if (!this.mineFloor) return { ok: false, message: 'You are already on the surface.' };
    this.data.mineRun.floor = this.mineFloor.floor;
    this.mineFloor = null;
    this.emitChange();
    return { ok: true, message: 'You climb back into the daylight.' };
  }

  buyWeapon(weaponId: string): ActionResult {
    const def = weaponById(weaponId);
    if (!def) return { ok: false, message: 'Unknown weapon.' };
    const run = this.data.mineRun;
    if (run.weapons.includes(weaponId)) return { ok: false, message: 'You already own that weapon.' };
    if (this.level < def.unlockLevel) {
      return { ok: false, message: `Unlocks at farmer level ${def.unlockLevel}.` };
    }
    if (this.data.coins < def.price) return { ok: false, message: 'Not enough coins.' };
    this.data.coins -= def.price;
    run.weapons.push(weaponId);
    run.weapon = weaponId;
    this.emitChange();
    return { ok: true, message: `${def.name} equipped. ${def.desc}` };
  }

  equipWeapon(weaponId: string): ActionResult {
    const run = this.data.mineRun;
    if (!run.weapons.includes(weaponId)) return { ok: false, message: 'You do not own that weapon.' };
    run.weapon = weaponId;
    this.emitChange();
    return { ok: true, message: `${weaponById(weaponId)?.name ?? 'Weapon'} equipped.` };
  }

  // ------------------------------------------------------------- shipping bin

  hasShippingBin(): boolean {
    return this.data.buildings.some((building) => building.id === 'shipping_bin');
  }

  shippingValue(): number {
    return this.data.shipping.items.reduce(
      (sum, stack) => sum + this.sellPrice(stack.itemId, stack.quality) * stack.qty,
      0
    );
  }

  shippingState() {
    return {
      bin: this.hasShippingBin(),
      items: this.data.shipping.items,
      value: this.shippingValue(),
      capacity: 24
    };
  }

  queueForShipping(index: number, qty: number): ActionResult {
    if (!this.hasShippingBin()) return { ok: false, message: 'Build a Shipping Bin first.' };
    const stack = this.data.inventory[index];
    if (!stack) return { ok: false, message: 'Nothing to ship.' };
    const def = ITEMS[stack.itemId];
    if (!def) return { ok: false, message: 'Unknown item.' };
    if (def.type === 'tool') return { ok: false, message: 'You cannot ship your tools.' };
    if (stack.locked) return { ok: false, message: 'This item is locked.' };
    const amount = Math.max(1, Math.min(stack.qty, Math.floor(qty)));
    stack.qty -= amount;
    if (stack.qty <= 0) this.data.inventory[index] = null;
    const existing = this.data.shipping.items.find(
      (entry) => entry.itemId === stack.itemId && entry.quality === stack.quality
    );
    if (existing) existing.qty += amount;
    else
      this.data.shipping.items.push({
        itemId: stack.itemId,
        qty: amount,
        quality: stack.quality
      });
    this.emitChange();
    return { ok: true, message: `${amount} × ${def.name} left in the shipping bin.` };
  }

  shipAll(): ActionResult {
    if (!this.hasShippingBin()) return { ok: false, message: 'Build a Shipping Bin first.' };
    let count = 0;
    for (let i = 0; i < this.data.inventory.length; i++) {
      const stack = this.data.inventory[i];
      if (!stack || stack.locked) continue;
      const def = ITEMS[stack.itemId];
      if (!def || def.type === 'tool') continue;
      const amount = stack.qty;
      count += amount;
      this.data.inventory[i] = null;
      const existing = this.data.shipping.items.find(
        (entry) => entry.itemId === stack.itemId && entry.quality === stack.quality
      );
      if (existing) existing.qty += amount;
      else
        this.data.shipping.items.push({
          itemId: stack.itemId,
          qty: amount,
          quality: stack.quality
        });
    }
    if (count === 0) return { ok: false, message: 'Nothing to ship.' };
    this.emitChange();
    return { ok: true, message: `Left ${count} goods in the shipping bin.` };
  }

  takeBackShipping(index: number): ActionResult {
    const stack = this.data.shipping.items[index];
    if (!stack) return { ok: false, message: 'Nothing there.' };
    if (this.freeSpaceFor(stack.itemId, stack.quality) < 1) {
      return { ok: false, message: 'Your backpack is full.' };
    }
    this.addItem(stack.itemId, 1, stack.quality);
    stack.qty -= 1;
    if (stack.qty <= 0) this.data.shipping.items.splice(index, 1);
    this.emitChange();
    return { ok: true, message: `Took one ${ITEMS[stack.itemId]?.name ?? 'item'} back.` };
  }

  private sellShipping(): { total: number; count: number } {
    const items = this.data.shipping.items;
    let total = 0;
    let count = 0;
    for (const stack of items) {
      total += this.sellPrice(stack.itemId, stack.quality) * stack.qty;
      count += stack.qty;
      this.rescueLostItem(stack.itemId, stack.qty, stack.quality);
    }
    if (count > 0) {
      this.data.coins += total;
      this.data.stats.coinsEarned += total;
      this.data.stats.cropsSold += count;
      this.data.stats.itemsShipped += count;
      this.addXp('business', Math.max(1, Math.round(count * 1.2)), false);
    }
    this.data.shipping.items = [];
    return { total, count };
  }

  // ------------------------------------------------------ lost item storehouse

  /**
   * Remember goods that leave the farm by accident. Only things worth a real
   * amount are kept, so a basket of turnips does not clog the shelf.
   */
  private rescueLostItem(itemId: string, qty: number, quality: Quality): void {
    const def = ITEMS[itemId];
    if (!def || def.type === 'tool' || qty <= 0) return;
    const value = this.sellPrice(itemId, quality) * qty;
    if (value < LOST_ITEM_RESCUE_VALUE) return;
    if (!Array.isArray(this.data.lostItems)) this.data.lostItems = [];
    const existing = this.data.lostItems.find(
      (entry) => entry.itemId === itemId && entry.quality === quality
    );
    if (existing) {
      existing.qty += qty;
      return;
    }
    this.data.lostItems.push({
      itemId,
      qty,
      quality,
      day: absoluteDay(this.data.season, this.data.year, this.data.day)
    });
    while (this.data.lostItems.length > LOST_ITEM_MAX) this.data.lostItems.shift();
  }

  /**
   * The reclaim fee, always worked out at today's price so buying something back
   * can never cost less than it is worth - the market swings, the rule does not.
   */
  lostItemFee(entry: { itemId: string; qty: number; quality: Quality }): number {
    const unit = Math.max(
      LOST_ITEM_MIN_FEE,
      Math.round(this.sellPrice(entry.itemId, entry.quality) * LOST_ITEM_FEE_RATE)
    );
    return unit * entry.qty;
  }

  /** The storehouse shelf, oldest entries cleared out. */
  lostItemState() {
    if (!Array.isArray(this.data.lostItems)) this.data.lostItems = [];
    const today = absoluteDay(this.data.season, this.data.year, this.data.day);
    this.data.lostItems = this.data.lostItems.filter(
      (entry) => today - entry.day < LOST_ITEM_KEEP_DAYS && !!ITEMS[entry.itemId]
    );
    return {
      items: this.data.lostItems.map((entry, index) => ({
        index,
        entry,
        def: ITEMS[entry.itemId],
        fee: this.lostItemFee(entry),
        daysLeft: Math.max(0, LOST_ITEM_KEEP_DAYS - (today - entry.day))
      })),
      keepDays: LOST_ITEM_KEEP_DAYS
    };
  }

  /** Buys back one entry from the storehouse. */
  reclaimLostItem(index: number): ActionResult {
    const entry = (this.data.lostItems ?? [])[index];
    if (!entry) return { ok: false, message: 'That is not on the shelf any more.' };
    const def = ITEMS[entry.itemId];
    if (!def) return { ok: false, message: 'Unknown item.' };
    const fee = this.lostItemFee(entry);
    if (this.data.coins < fee) return { ok: false, message: `You need ${fee} coins for that.` };
    if (this.freeSpaceFor(entry.itemId, entry.quality) < entry.qty) {
      return { ok: false, message: 'Make room in your backpack first.' };
    }
    this.data.coins -= fee;
    this.addItem(entry.itemId, entry.qty, entry.quality);
    this.data.lostItems.splice(index, 1);
    this.emitChange();
    return { ok: true, message: `Reclaimed ${entry.qty} × ${def.name} for ${fee} coins.` };
  }

  // ------------------------------------------------------- farm evaluation

  /** What the old farmer looks at when he grades the farm. */
  evaluationReport() {
    const collection = this.collectionState().total;
    const lines = [
      { label: `Coins earned (${EVALUATION_GOALS.coinsEarned.toLocaleString()})`, value: this.data.stats.coinsEarned, goal: EVALUATION_GOALS.coinsEarned },
      { label: `Buildings (${EVALUATION_GOALS.buildings})`, value: functionalBuildingCount(this.data), goal: EVALUATION_GOALS.buildings },
      { label: `Animals (${EVALUATION_GOALS.animals})`, value: this.data.animals.length, goal: EVALUATION_GOALS.animals },
      { label: `Community bundles (${EVALUATION_GOALS.bundles})`, value: this.bundlesCompleted(), goal: EVALUATION_GOALS.bundles },
      { label: `Collection entries (${EVALUATION_GOALS.collection})`, value: collection.found, goal: EVALUATION_GOALS.collection },
      { label: `Farmer level (${EVALUATION_GOALS.level})`, value: this.level, goal: EVALUATION_GOALS.level },
      { label: `Festival ribbons (${EVALUATION_GOALS.ribbons})`, value: this.data.ribbons.length, goal: EVALUATION_GOALS.ribbons },
      { label: `Museum donations (${EVALUATION_GOALS.museum})`, value: this.data.museum.donated.length, goal: EVALUATION_GOALS.museum }
    ];
    let points = 0;
    const reasons: string[] = [];
    for (const line of lines) {
      const done = line.value >= line.goal;
      if (done) {
        points += 1;
        reasons.push(line.label);
      }
    }
    const candles = Math.min(4, Math.floor(points / EVALUATION_CANDLE_POINTS));
    const seen = !!this.data.evaluation;
    return { lines, points, candles, reasons, seen, saved: this.data.evaluation };
  }

  /**
   * The old farmer calls on the first day of year 2. Returns the visit message,
   * or null when he is not due.
   */
  private holdEvaluation(messages: string[]): void {
    const due = this.data.year > 1 && !this.data.evaluation;
    if (!due) return;
    const report = this.evaluationReport();
    this.data.evaluation = {
      candles: report.candles,
      reasons: report.reasons,
      day: absoluteDay(this.data.season, this.data.year, this.data.day)
    };
    const reward = report.candles * 750;
    this.data.coins += reward;
    this.data.stats.coinsEarned += reward;
    this.grantXpNoCheck(report.candles * 60);
    messages.push(
      `The old farmer came by and lit ${report.candles} of 4 candles on his shrine. He left ${reward} coins behind.`
    );
    this.emit('evaluation', { candles: report.candles });
  }

  // ------------------------------------------------------------------ family

  familyState() {
    const child = canAdopt(this.data);
    return {
      spouse: this.spouseName,
      children: this.data.family.children.map((entry) => ({
        ...entry,
        stage: childStageLabel(entry.ageDays)
      })),
      canAdopt: child.ok,
      reason: child.reason,
      farmhouseLevel: this.data.farmhouseLevel
    };
  }

  adoptChild(): ActionResult {
    const check = canAdopt(this.data);
    if (!check.ok) return { ok: false, message: check.reason };
    if (this.data.coins < 1200) return { ok: false, message: 'You need 1,200 coins for the adoption papers.' };
    this.data.coins -= 1200;
    const name = randomChildName(
      this.data.family.children.map((entry) => entry.name),
      this.rng
    );
    const child: ChildSave = { id: uid('child'), name, ageDays: 0 };
    this.data.family.children.push(child);
    this.emitChange();
    return { ok: true, message: `${name} joins the family! The whole valley celebrates.` };
  }

  /** Pay the town clinic for a pick-me-up. */
  clinicRestore(cost = 200, amount = 80): ActionResult {
    if (this.energy() >= this.maxEnergy()) return { ok: false, message: 'You are already full of energy.' };
    if (this.data.coins < cost) return { ok: false, message: `The clinic asks ${cost} coins.` };
    this.data.coins -= cost;
    this.restoreEnergy(amount);
    this.emitChange();
    return { ok: true, message: `The clinic patches you up (+${amount} energy).` };
  }

  /** A hot meal at the saloon: a little energy and a spring in your step. */
  buySaloonMeal(cost = 220): ActionResult {
    if (this.data.coins < cost) return { ok: false, message: `The meal costs ${cost} coins.` };
    this.data.coins -= cost;
    this.restoreEnergy(40);
    this.data.buffs = [{ id: 'buff_speed', day: this.today }];
    this.emitChange();
    return { ok: true, message: 'A hearty saloon stew: +40 energy and faster feet today.' };
  }

  // -------------------------------------------------------------------- house

  houseState() {
    const owned = ownedFurniture(this.data.house).map((entry) => entry.id);
    return {
      owned,
      items: FURNITURE.map((entry) => ({ def: entry, owned: owned.includes(entry.id) })),
      bonuses: {
        energy: houseBonus(this.data.house, 'energy'),
        luck: houseBonus(this.data.house, 'luck'),
        capacity: houseBonus(this.data.house, 'capacity'),
        friendship: houseBonus(this.data.house, 'friendship')
      }
    };
  }

  buyFurniture(furnitureId: string): ActionResult {
    const def = furnitureById(furnitureId);
    if (!def) return { ok: false, message: 'Unknown furniture.' };
    if (this.data.house.furniture.includes(furnitureId)) {
      return { ok: false, message: 'You already own that piece.' };
    }
    if (this.data.coins < def.cost) return { ok: false, message: 'Not enough coins.' };
    this.data.coins -= def.cost;
    this.data.house.furniture.push(furnitureId);
    this.ensureCapacity();
    if (def.bonus === 'energy') this.data.energy += def.value;
    this.emitChange();
    return { ok: true, message: `${def.name} placed in the farmhouse. ${def.desc}` };
  }

  // -------------------------------------------------------------------- pet

  petState() {
    return {
      ...this.data.pet,
      mood: petMood(this.data.pet),
      bonus: petBonus(this.data.pet)
    };
  }

  adoptPet(type: 'dog' | 'cat', name?: string): ActionResult {
    if (this.data.pet.type) return { ok: false, message: 'You already have a pet.' };
    if (this.data.coins < 500) return { ok: false, message: 'The shelter asks for a 500 coin donation.' };
    this.data.coins -= 500;
    this.data.pet = {
      type,
      name: name?.trim() || (type === 'dog' ? 'Biscuit' : 'Mittens'),
      affection: 25,
      lastPetDay: 0
    };
    this.emitChange();
    return { ok: true, message: `${this.data.pet.name} the ${type} moves in!` };
  }

  petPet(): ActionResult {
    const pet = this.data.pet;
    if (!pet.type) return { ok: false, message: 'You do not have a pet yet.' };
    if (pet.lastPetDay === this.today) return { ok: false, message: `${pet.name} has had enough attention today.` };
    pet.lastPetDay = this.today;
    pet.affection = clamp(pet.affection + 14, 0, 100);
    this.emitChange();
    return { ok: true, message: `You pet ${pet.name}. ${petMood(pet)}.` };
  }

  buyHorse(): ActionResult {
    if (this.data.horseOwned) return { ok: false, message: 'Your stable already has a horse.' };
    if (!this.data.buildings.some((b) => BUILDINGS[b.id]?.houses === 'stable')) {
      return { ok: false, message: 'Build a stable first.' };
    }
    if (this.data.coins < 1600) return { ok: false, message: 'A horse costs 1,600 coins.' };
    this.data.coins -= 1600;
    this.data.horseOwned = true;
    this.emitChange();
    return { ok: true, message: 'A horse now lives in your stable. You move much faster on the farm.' };
  }

  horseSpeedBonus(): number {
    return this.data.horseOwned ? 0.35 : 0;
  }

  // ------------------------------------------------------------------ museum

  museumState() {
    const donated = this.data.museum.donated;
    const artifacts = Object.values(ITEMS).filter((item) => item.type === 'artifact');
    return {
      donated,
      artifacts: artifacts.map((item) => ({
        item,
        donated: donated.includes(item.id),
        held: this.countItem(item.id)
      })),
      total: artifacts.length,
      rewards: MUSEUM_REWARDS.map((reward) => ({
        def: reward,
        unlocked: donated.length >= reward.count,
        claimed: this.data.museum.claimed.includes(reward.id)
      })),
      next: nextMuseumMilestone(donated.length)
    };
  }

  donateArtifact(itemId: string): ActionResult {
    const item = ITEMS[itemId];
    if (!item || item.type !== 'artifact') return { ok: false, message: 'The museum only takes artifacts.' };
    if (this.data.museum.donated.includes(itemId)) {
      return { ok: false, message: 'That artifact is already on display.' };
    }
    if (!this.hasItem(itemId)) return { ok: false, message: 'You do not have that artifact.' };
    this.removeItem(itemId, 1);
    this.data.museum.donated.push(itemId);
    this.addXp('mining', 12, false);
    this.emitChange();
    return { ok: true, message: `${item.name} donated to the museum.` };
  }

  claimMuseumReward(rewardId: string): ActionResult {
    const reward = MUSEUM_REWARDS.find((entry) => entry.id === rewardId);
    if (!reward) return { ok: false, message: 'Unknown museum reward.' };
    if (this.data.museum.claimed.includes(rewardId)) {
      return { ok: false, message: 'That reward is already claimed.' };
    }
    if (this.data.museum.donated.length < reward.count) {
      return { ok: false, message: `Donate ${reward.count} artifacts first.` };
    }
    this.data.coins += reward.coins;
    this.data.stats.coinsEarned += reward.coins;
    if (reward.itemId) this.addItem(reward.itemId, reward.itemQty ?? 1);
    this.grantXp(reward.xp);
    this.data.museum.claimed.push(rewardId);
    this.emitChange();
    return { ok: true, message: `Museum reward claimed: ${reward.coins} coins and ${reward.xp} XP.` };
  }

  // --------------------------------------------------------- festival minigame

  festivalGameState() {
    const game = this.data.festivalGame;
    const fresh = game.season === this.data.season && game.year === this.data.year;
    return {
      played: fresh && game.played,
      score: fresh ? game.score : 0,
      available: this.festivalAvailable(),
      luck: this.toolBonus('luck') + this.professionSum('luck') + this.buffSum('luck') + (this.data.dailyLuck ?? 0)
    };
  }

  /** Three festival crates hide one prize. Luck improves the odds of a good pick. */
  playFestivalGame(pick: number): ActionResult & { score?: number } {
    if (!this.festivalAvailable()) {
      return { ok: false, message: 'The festival games only open on the last day of the season.' };
    }
    const game = this.data.festivalGame;
    if (game.season !== this.data.season || game.year !== this.data.year) {
      game.season = this.data.season;
      game.year = this.data.year;
      game.played = false;
      game.score = 0;
    }
    if (game.played) return { ok: false, message: 'You already played today.' };
    const luck = this.toolBonus('luck') + this.professionSum('luck') + this.buffSum('luck');
    const prize = Math.floor(this.rng() * 3);
    const choice = clamp(Math.floor(pick), 0, 2);
    const hit = choice === prize || this.rng() < luck;
    game.played = true;
    game.score = hit ? 100 : 35;
    const coins = hit ? 300 : 60;
    const xp = hit ? 40 : 10;
    this.data.coins += coins;
    this.data.stats.coinsEarned += coins;
    this.grantXp(xp);
    this.emitChange();
    return {
      ok: true,
      score: game.score,
      message: hit
        ? `You found the prize crate! +${coins} coins and +${xp} XP.`
        : `No prize this time, but the crowd cheers. +${coins} coins and +${xp} XP.`
    };
  }

  // -------------------------------------------------------------------- npcs

  npcList() {
    return Object.values(NPCS).map((npc) => {
      const record = this.data.npcs[npc.id] ?? ensureNpcSave(this.data, npc.id);
      const availability = npcAvailable(npc, this.data);
      const request = npcWeeklyRequest(npc, this.data);
      return {
        npc,
        record,
        hearts: friendshipHearts(record.friendship),
        status: npcStatus(this.data, npc),
        birthday: birthdayLabel(npc),
        birthdayToday: isNpcBirthday(npc, this.data),
        available: availability.available,
        reason: availability.reason,
        request,
        requestReady: this.countItem(request.itemId) >= request.qty
      };
    });
  }

  npcTalk(id: string): ActionResult {
    const npc = npcById(id);
    if (!npc) return { ok: false, message: 'Unknown visitor.' };
    const availability = npcAvailable(npc, this.data);
    if (!availability.available) return { ok: false, message: `${npc.name} is not here. ${availability.reason}` };
    const record = ensureNpcSave(this.data, id);
    if (record.talkedDay === this.today) return { ok: false, message: `You already talked with ${npc.name} today.` };
    const before = record.friendship;
    record.talkedDay = this.today;
    record.met = true;
    const warmth = 1 + houseBonus(this.data.house ?? { furniture: [] }, 'friendship');
    const gain = Math.round((isNpcBirthday(npc, this.data) ? 16 : 8) * warmth);
    record.friendship = clamp(record.friendship + gain, 0, 1000);
    if (!Array.isArray(record.heartEvents)) record.heartEvents = [];
    const thresholds = [200, 400, 600, 800, 1000];
    const crossed = thresholds.findIndex(
      (threshold) => before < threshold && record.friendship >= threshold
    );
    let message = `${npc.name}: ${npcLine(npc, this.data)}`;
    if (crossed >= 0 && !record.heartEvents!.includes(thresholds[crossed])) {
      record.heartEvents!.push(thresholds[crossed]);
      message = heartEventLine(npc, before, record.friendship) ?? message;
      const gift = 80 + thresholds[crossed] / 5;
      this.data.coins += gift;
      this.data.stats.coinsEarned += gift;
      message += ` (+${gift} coins from the moment you shared.)`;
    }
    this.emitChange();
    return { ok: true, message };
  }

  completeNpcRequest(id: string): ActionResult {
    const npc = npcById(id);
    if (!npc) return { ok: false, message: 'Unknown visitor.' };
    const availability = npcAvailable(npc, this.data);
    if (!availability.available) return { ok: false, message: `${npc.name} is not here. ${availability.reason}` };
    const record = ensureNpcSave(this.data, id);
    const request = npcWeeklyRequest(npc, this.data);
    if (request.completed) return { ok: false, message: `${npc.name}'s request is already complete this week.` };
    if (!this.hasItem(request.itemId, request.qty)) {
      return { ok: false, message: `Need ${request.qty} x ${request.itemName}.` };
    }
    this.removeItem(request.itemId, request.qty);
    record.requestWeek = request.week;
    record.met = true;
    record.friendship = clamp(record.friendship + 25, 0, 1000);
    this.data.coins += request.coins;
    this.data.stats.coinsEarned += request.coins;
    this.addXp('business', request.xp, false);
    this.emitChange();
    this.checkProgress();
    return {
      ok: true,
      message: `${npc.name}'s requested donation complete: +${request.coins} coins and +${request.xp} XP.`
    };
  }

  marryNpc(id: string): ActionResult {
    const npc = npcById(id);
    if (!npc) return { ok: false, message: 'Unknown visitor.' };
    if (!npc.romanceable) return { ok: false, message: `${npc.name} is not looking for romance.` };
    if (this.data.spouseId) return { ok: false, message: 'You are already married.' };
    const record = ensureNpcSave(this.data, id);
    if (record.friendship < 1000) return { ok: false, message: `${npc.name} needs 10 hearts first.` };
    this.data.spouseId = id;
    record.met = true;
    this.emitChange();
    return { ok: true, message: `You and ${npc.name} are married!` };
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
        ['sunny', 0.42],
        ['cloudy', 0.2],
        ['rain', 0.24],
        ['storm', 0.05],
        ['wind', 0.05],
        ['fog', 0.04]
      ],
      summer: [
        ['sunny', 0.58],
        ['cloudy', 0.14],
        ['rain', 0.14],
        ['storm', 0.05],
        ['wind', 0.05],
        ['fog', 0.04]
      ],
      fall: [
        ['sunny', 0.34],
        ['cloudy', 0.24],
        ['rain', 0.22],
        ['storm', 0.05],
        ['wind', 0.09],
        ['fog', 0.06]
      ],
      winter: [
        ['sunny', 0.2],
        ['cloudy', 0.26],
        ['snow', 0.34],
        ['storm', 0.04],
        ['wind', 0.08],
        ['fog', 0.08]
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
    forecast: string;
  } {
    const d = this.data;
    const messages: string[] = [];
    let grown = 0;
    let wilted = 0;
    let products = 0;

    // 0) The shipping bin sells whatever was left in it during the night.
    const shipped = this.sellShipping();
    if (shipped.count > 0) {
      messages.push(
        `The trader collected ${shipped.count} goods from your shipping bin for ${shipped.total} coins.`
      );
    }

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
    const previousSeason = d.season;
    d.minute = START_MINUTE;
    d.day += 1;
    if (d.day > DAYS_PER_SEASON) {
      d.day = 1;
      const idx = SEASONS.indexOf(d.season);
      d.season = SEASONS[(idx + 1) % 4];
      if (idx === 3) d.year += 1;
      messages.push(`${SEASON_INFO[d.season].name} has arrived.`);
    }
    const seasonChanged = d.season !== previousSeason;
    d.weather = this.weatherForSeason(d.season);
    d.stats.daysPlayed += 1;
    this.ensureSeasonalBoard();
    if (seasonChanged) {
      d.festival = null;
      d.festivalGame = { season: d.season, year: d.year, played: false, score: 0 };
      messages.push(`${FESTIVALS[d.season].name} is now open on the festival board.`);
    }
    this.ensureFestivalDay();

    // 4) Rain waters everything that is tilled.
    if (d.weather === 'rain' || d.weather === 'storm') {
      for (const tile of Object.values(d.tiles)) {
        if (tile.tilled) tile.watered = true;
      }
      messages.push(d.weather === 'rain' ? 'Rain waters your fields overnight.' : 'A storm soaks the fields.');
    } else if (d.weather === 'snow') {
      // Melting snow keeps the soil damp, so nothing dries out overnight.
      for (const tile of Object.values(d.tiles)) {
        if (tile.tilled) tile.watered = true;
      }
      messages.push('Snow covers the fields. The meltwater soaks the soil.');
    } else if (d.weather === 'fog') {
      messages.push('A thick fog rolls over the valley.');
    } else if (d.weather === 'wind') {
      messages.push('A stiff wind blows across the farm.');
    }

    // 5) Wells and sprinklers water their surroundings.
    for (const b of d.buildings) {
      const def = BUILDINGS[b.id];
      if (def?.kind === 'well') this.waterAroundBuilding(b, def.radius ?? 3);
      if (def?.kind === 'sprinkler') this.waterAroundBuilding(b, def.radius ?? 1);
    }

    // 5b) A good night's sleep refills the day's energy.
    d.energy = this.maxEnergy();
    d.buffs = [];

    // 5c) Wild plants appear on open ground, and crows look for a meal.
    this.spawnForage();
    const crows = this.crowAttack();
    if (crows.eaten > 0) {
      wilted += crows.eaten;
      messages.push(
        crows.scared
          ? `Crows pecked ${crows.eaten} crop${crows.eaten === 1 ? '' : 's'}, but your scarecrow kept most of them away.`
          : `${crows.eaten} crop${crows.eaten === 1 ? ' was' : 's were'} eaten by crows overnight. A scarecrow would protect your fields.`
      );
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

    // 7) Helper automation runs after the morning chores are ready.
    this.runAutomation(messages);

    if (d.spouseId) {
      const spouse = NPCS[d.spouseId];
      if (spouse) {
        d.coins += 30;
        d.stats.coinsEarned += 30;
        messages.push(`${spouse.name} left 30 coins and a warm breakfast by the door.`);
      }
    }

    // 7b) Children grow, and the farm pet misses you when you forget it.
    for (const growth of growChildren(d.family.children)) messages.push(growth);
    if (d.pet.type) {
      if (d.pet.lastPetDay < this.today - 1) {
        d.pet.affection = clamp(d.pet.affection - 5, 0, 100);
      }
      if (d.pet.affection >= 60 && this.rng() < 0.25) {
        d.coins += 25;
        d.stats.coinsEarned += 25;
        messages.push(`${d.pet.name} found 25 coins under the porch.`);
      }
    }
    if (d.family.children.length > 0 && this.rng() < 0.2) {
      d.coins += 20;
      d.stats.coinsEarned += 20;
      messages.push(`Your child left a little hand-picked gift and 20 coins on the table.`);
    }

    // 8) Fresh daily quests, achievement check, festival reminder.
    if (d.day === DAYS_PER_SEASON) {
      messages.push(`${FESTIVALS[d.season].name} judging is open today!`);
    }
    d.daily = generateDaily(d.day, d.stats, this.rng);
    this.ensureEngagement();
    const newLetters = this.deliverLetters();
    if (newLetters.length > 0) messages.push(`New mail: ${newLetters.join(', ')}.`);
    this.checkProgress();

    // 9) The morning TV forecast rolls the day's luck.
    const forecast = TV_FORECASTS[Math.floor(this.rng() * TV_FORECASTS.length)] ?? TV_FORECASTS[2];
    d.dailyLuck = forecast.luck;
    d.dailyForecast = `${forecast.label}: ${forecast.text}`;
    messages.push(`TV forecast - ${forecast.label.toLowerCase()}. ${forecast.text}`);

    // 10) A farm left alone for a while greets you back with a small gift.
    this.greetReturningFarmer(messages);

    // 11) The old farmer grades the farm once year two begins.
    this.holdEvaluation(messages);

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
      messages,
      forecast: d.dailyForecast
    };
  }

  /**
   * The treasure room at the bottom of the old mine. It pays out once, so the
   * long climb ends in something you can hold.
   */
  summitState() {
    const run = this.data.mineRun;
    const claimed = (this.data.summitClaimed ?? []).includes(MINE_SUMMIT.floor);
    return {
      maxFloor: MINE_MAX_FLOOR,
      reached: !!run && run.maxFloor >= MINE_SUMMIT.floor,
      claimed,
      coins: MINE_SUMMIT.coins,
      itemId: MINE_SUMMIT.itemId,
      itemName: ITEMS[MINE_SUMMIT.itemId]?.name ?? 'Summit Key',
      itemQty: MINE_SUMMIT.itemQty,
      xp: MINE_SUMMIT.xp
    };
  }

  /** Hand over the treasure room prize, once. */
  claimSummit(): ActionResult {
    const run = this.data.mineRun;
    if (!run || run.maxFloor < MINE_SUMMIT.floor) {
      return { ok: false, message: `Reach floor ${MINE_SUMMIT.floor} first.` };
    }
    if (!Array.isArray(this.data.summitClaimed)) this.data.summitClaimed = [];
    if (this.data.summitClaimed.includes(MINE_SUMMIT.floor)) {
      return { ok: false, message: 'The treasure room is already empty.' };
    }
    const room = this.freeSpaceFor(MINE_SUMMIT.itemId) >= MINE_SUMMIT.itemQty;
    this.data.summitClaimed.push(MINE_SUMMIT.floor);
    this.data.coins += MINE_SUMMIT.coins;
    this.data.stats.coinsEarned += MINE_SUMMIT.coins;
    if (room) this.addItem(MINE_SUMMIT.itemId, MINE_SUMMIT.itemQty);
    this.grantXpNoCheck(MINE_SUMMIT.xp);
    this.emit('summit', { floor: MINE_SUMMIT.floor });
    if (!room) {
      // Nothing is ever dropped for good: the key waits on the storehouse shelf.
      this.rescueLostItem(MINE_SUMMIT.itemId, MINE_SUMMIT.itemQty, 'normal');
      return {
        ok: true,
        message: `The treasury held ${MINE_SUMMIT.coins} coins. Your backpack was full, so the key waits in lost and found.`
      };
    }
    return {
      ok: true,
      message: `The treasury held ${MINE_SUMMIT.coins} coins and the ${ITEMS[MINE_SUMMIT.itemId]?.name ?? 'Summit Key'}.`
    };
  }

  // -------------------------------------------------------------- progress

  /**
   * Welcome a farmer back after a few days away. Stardew never notices a break;
   * here the farm does, with a small gift waiting in the mailbox.
   */
  private greetReturningFarmer(messages: string[]): void {
    const away = this.data.daysAway ?? 0;
    this.data.daysAway = 0;
    if (away < 3) return;
    if (!this.data.mail) this.data.mail = [];
    const id = 'letter_welcome_back';
    if (!this.data.mail.some((m) => m.id === id)) {
      this.data.mail.push({ id, read: false, claimed: false, day: this.data.day });
    }
    this.data.coins += 60;
    this.data.stats.coinsEarned += 60;
    messages.push(
      `Welcome back! You were away ${away} days. Your neighbours kept an eye on things and left 60 coins in the mailbox.`
    );
  }

  /** Crows try to eat crops overnight. Scarecrows keep them off nearby fields. */
  crowAttack(): { eaten: number; scared: boolean } {
    // Give a new farm a few calm nights before the birds find it.
    if (this.data.stats.daysPlayed < 3) return { eaten: 0, scared: false };
    const scarecrows = this.data.buildings.filter((b) => b.id === 'scarecrow');
    let eaten = 0;
    let scared = false;
    for (const [key, tile] of Object.entries(this.data.tiles)) {
      if (!tile.crop) continue;
      const def = CROPS[tile.crop.id];
      if (!def || tile.crop.growth >= def.growthDays) continue;
      const [sx, sy] = key.split(',').map(Number);
      const guarded = scarecrows.some(
        (s) => Math.abs(s.x - sx) <= 4 && Math.abs(s.y - sy) <= 4
      );
      const chance = guarded ? 0.02 : 0.06;
      if (guarded) scared = true;
      if (this.rng() < chance) {
        tile.crop = undefined;
        tile.fertilized = false;
        eaten += 1;
      }
    }
    this.data.stats.cropsLost += eaten;
    return { eaten, scared };
  }

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
    const each = Math.max(1, Math.round(total / 6));
    (['farming', 'animal', 'crafting', 'business', 'fishing', 'mining'] as SkillKey[]).forEach((skill) => {
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
    const each = Math.max(1, Math.round(total / 6));
    (['farming', 'animal', 'crafting', 'business', 'fishing', 'mining'] as SkillKey[]).forEach((skill) => {
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

  seasonalContractState(
    entryId: string
  ): { progress: number; complete: boolean; claimed: boolean; target: number } | null {
    const board = this.data.seasonal;
    if (!board) return null;
    const entry = board.list.find((e) => e.id === entryId);
    if (!entry) return null;
    const contract = readSeasonalContract(board.season, entryId);
    if (!contract) return null;
    const progress = dailyProgress(this.data, contract.metric, board.startStats);
    return {
      progress,
      target: entry.target,
      claimed: entry.claimed,
      complete: progress >= entry.target
    };
  }

  seasonalBoardState(): {
    season: Season;
    year: number;
    name: string;
    desc: string;
    daysLeft: number;
    claimedCount: number;
    total: number;
    bonusCoins: number;
    bonusXp: number;
    bonusClaimed: boolean;
    bonusReady: boolean;
  } | null {
    const board = this.data.seasonal;
    if (!board) return null;
    const festival = FESTIVALS[board.season];
    const claimedCount = board.list.filter((entry) => entry.claimed).length;
    return {
      season: board.season,
      year: board.year,
      name: festival.name,
      desc: festival.desc,
      daysLeft: Math.max(0, DAYS_PER_SEASON - this.data.day + 1),
      claimedCount,
      total: board.list.length,
      bonusCoins: board.bonusCoins,
      bonusXp: board.bonusXp,
      bonusClaimed: board.bonusClaimed,
      bonusReady:
        board.list.length > 0 &&
        claimedCount === board.list.length &&
        !board.bonusClaimed
    };
  }

  claimSeasonalContract(id: string): ActionResult {
    const board = this.data.seasonal;
    if (!board) return { ok: false, message: 'No seasonal contracts available.' };
    const entry = board.list.find((e) => e.id === id);
    if (!entry) return { ok: false, message: 'Unknown seasonal contract.' };
    if (entry.claimed) return { ok: false, message: 'Contract reward already claimed.' };
    const state = this.seasonalContractState(id);
    if (!state?.complete) return { ok: false, message: 'Contract is not complete yet.' };
    entry.claimed = true;
    this.data.coins += entry.coins;
    this.data.stats.coinsEarned += entry.coins;
    this.grantXp(entry.xp);
    this.emitChange();
    this.emit('seasonalClaimed', { id, coins: entry.coins });
    return { ok: true, message: `Contract complete! +${entry.coins} coins.` };
  }

  claimSeasonalBonus(): ActionResult {
    const board = this.data.seasonal;
    if (!board) return { ok: false, message: 'No festival board available.' };
    if (board.bonusClaimed) return { ok: false, message: 'Festival bonus already claimed.' };
    if (board.list.length === 0 || !board.list.every((entry) => entry.claimed)) {
      return { ok: false, message: 'Claim all three contracts first.' };
    }
    board.bonusClaimed = true;
    this.data.coins += board.bonusCoins;
    this.data.stats.coinsEarned += board.bonusCoins;
    this.grantXp(board.bonusXp);
    this.emitChange();
    this.emit('seasonalBonusClaimed', { coins: board.bonusCoins });
    return { ok: true, message: `Festival complete! +${board.bonusCoins} coins.` };
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

  /**
   * Keeps the login streak and the weekly board current. The streak counts
   * real calendar days, so coming back tomorrow keeps it alive.
   */
  private ensureEngagement(): WeeklySave {
    if (!this.data.engagement) this.data.engagement = defaultEngagement();
    const eng = this.data.engagement;
    advanceLoginStreak(eng, new Date());
    const week = weekNumber(this.data.season, this.data.year, this.data.day);
    const board =
      eng.weekly && eng.weekly.week === week ? eng.weekly : generateWeekly(week, this.data.stats);
    eng.weekly = board;
    return board;
  }

  /** Today's login gift: how big it is and whether it is already claimed. */
  loginGiftState(): { streak: number; claimedToday: boolean; coins: number; xp: number } {
    this.ensureEngagement();
    const eng = this.data.engagement;
    const amount = loginGiftAmount(eng.loginStreak);
    return {
      streak: eng.loginStreak,
      claimedToday: eng.loginClaimDate === localDateKey(new Date()),
      coins: amount.coins,
      xp: amount.xp
    };
  }

  /** Hands over today's login gift, once per real day. */
  claimLoginGift(): ActionResult {
    this.ensureEngagement();
    const eng = this.data.engagement;
    const today = localDateKey(new Date());
    if (eng.loginClaimDate === today) {
      return { ok: false, message: "Today's gift is already claimed. Come back tomorrow." };
    }
    const amount = loginGiftAmount(eng.loginStreak);
    eng.loginClaimDate = today;
    this.data.coins += amount.coins;
    this.data.stats.coinsEarned += amount.coins;
    this.grantXp(amount.xp);
    this.emitChange();
    this.emit('loginGift', { coins: amount.coins });
    const days = eng.loginStreak === 1 ? 'day' : 'days';
    return {
      ok: true,
      message: `Login gift! +${amount.coins} coins. Streak: ${eng.loginStreak} ${days}.`
    };
  }

  /** This week's goal board. A fresh board replaces the old one when the week turns. */
  weeklyBoard(): WeeklySave {
    return this.ensureEngagement();
  }

  /** Hands over the reward for one finished weekly goal. */
  claimWeeklyGoal(id: string): ActionResult {
    const board = this.weeklyBoard();
    const entry = board.list.find((item) => item.id === id);
    const goal = readWeeklyGoal(id);
    if (!entry || !goal) return { ok: false, message: 'Unknown weekly goal.' };
    if (entry.claimed) return { ok: false, message: 'Goal reward already claimed.' };
    if (weeklyGoalProgress(this.data, goal, board.startStats) < goal.target) {
      return { ok: false, message: 'Goal is not complete yet.' };
    }
    entry.claimed = true;
    this.data.coins += goal.coins;
    this.data.stats.coinsEarned += goal.coins;
    this.grantXp(goal.xp);
    this.emitChange();
    this.emit('weeklyClaimed', { id, coins: goal.coins });
    return { ok: true, message: `Goal complete! +${goal.coins} coins.` };
  }

  /**
   * Counts the rewards waiting to be claimed, split by where they are. The red
   * reminder badge on the Quests button shows the total.
   */
  rewardsReady(): {
    daily: number;
    main: number;
    seasonal: number;
    weekly: number;
    login: number;
    total: number;
  } {
    let daily = 0;
    for (const entry of this.data.daily?.list ?? []) {
      const info = this.dailyState(entry.id);
      if (info?.complete && !info.claimed) daily += 1;
    }
    let main = 0;
    for (const quest of MAIN_QUESTS) {
      const info = this.mainQuestState(quest);
      if (info.complete && !info.claimed) main += 1;
    }
    let seasonal = 0;
    for (const entry of this.data.seasonal?.list ?? []) {
      const info = this.seasonalContractState(entry.id);
      if (info?.complete && !info.claimed) seasonal += 1;
    }
    if (this.seasonalBoardState()?.bonusReady) seasonal += 1;
    let weekly = 0;
    const board = this.weeklyBoard();
    for (const entry of board.list) {
      const goal = readWeeklyGoal(entry.id);
      if (!goal || entry.claimed) continue;
      if (weeklyGoalProgress(this.data, goal, board.startStats) >= goal.target) weekly += 1;
    }
    if (board.list.length > 0 && board.list.every((entry) => entry.claimed) && !board.bonusClaimed) {
      weekly += 1;
    }
    const login = this.loginGiftState().claimedToday ? 0 : 1;
    const total = daily + main + seasonal + weekly + login;
    return { daily, main, seasonal, weekly, login, total };
  }

  /**
   * Counts the rewards waiting behind the More menu, so its own red dot can
   * point at them. People covers visitor requests you can hand in right now;
   * Town covers the museum rewards, the festival prize and the mine treasury;
   * Mail covers unread letters waiting in the Community mailbox.
   */
  moreRewardsReady(): { people: number; town: number; mail: number; total: number } {
    const people = this.npcList().filter(
      (entry) => entry.requestReady && !entry.request.completed
    ).length;
    const mail = this.unreadMail();

    let town = 0;
    for (const reward of this.museumState().rewards) {
      if (reward.unlocked && !reward.claimed) town += 1;
    }
    const festival = this.data.festival;
    if (festival && festival.submitted && !festival.claimed && festival.tier !== 'none') {
      town += 1;
    }
    const summit = this.summitState();
    if (summit.reached && !summit.claimed) town += 1;

    return { people, town, mail, total: people + town + mail };
  }

  /** Hands over the weekly bonus once all three goals are claimed. */
  claimWeeklyBonus(): ActionResult {
    const board = this.weeklyBoard();
    if (board.bonusClaimed) return { ok: false, message: 'Weekly bonus already claimed.' };
    if (!board.list.every((entry) => entry.claimed)) {
      return { ok: false, message: 'Claim all three weekly goals first.' };
    }
    board.bonusClaimed = true;
    this.data.coins += WEEKLY_BONUS.coins;
    this.data.stats.coinsEarned += WEEKLY_BONUS.coins;
    this.grantXp(WEEKLY_BONUS.xp);
    this.emitChange();
    this.emit('weeklyBonusClaimed', { coins: WEEKLY_BONUS.coins });
    return { ok: true, message: `Weekly bonus! +${WEEKLY_BONUS.coins} coins.` };
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

/** Core shared types for Pixel Farm Simulator. */

export type Season = 'spring' | 'summer' | 'fall' | 'winter';
export type Weather = 'sunny' | 'cloudy' | 'rain' | 'storm';
export type Quality = 'normal' | 'silver' | 'gold';
export type Facing = 'down' | 'up' | 'left' | 'right';
export type SkillKey = 'farming' | 'animal' | 'crafting' | 'business' | 'fishing' | 'mining';

export type ItemType =
  | 'seed'
  | 'crop'
  | 'tool'
  | 'material'
  | 'product'
  | 'crafted'
  | 'feed'
  | 'fertilizer'
  | 'fish'
  | 'ore';

export type AnimalHousing = 'coop' | 'barn';

export interface ItemDef {
  id: string;
  name: string;
  type: ItemType;
  price: number;
  sell: number;
  stack: number;
  desc: string;
  /** Texture key used for the icon (defaults to item id). */
  icon?: string;
  /** Accent colour used when generating icons. */
  color?: number;
  /** Secondary colour. */
  color2?: number;
  cropId?: string;
}

export type CropShape =
  | 'wheat'
  | 'carrot'
  | 'potato'
  | 'tomato'
  | 'corn'
  | 'strawberry'
  | 'pumpkin'
  | 'cabbage'
  | 'rice'
  | 'sunflower';

export interface CropDef {
  id: string;
  name: string;
  seedId: string;
  harvestId: string;
  seasons: Season[];
  growthDays: number;
  /** Days to regrow after harvest. 0 = must replant. */
  regrowDays: number;
  yieldMin: number;
  yieldMax: number;
  shape: CropShape;
  palette: number[];
  desc: string;
}

export interface AnimalDef {
  id: string;
  name: string;
  housing: AnimalHousing;
  price: number;
  productId: string;
  maturityDays: number;
  desc: string;
  colors: number[];
}

export type BuildingKind =
  | 'housing'
  | 'craft'
  | 'storage'
  | 'greenhouse'
  | 'well'
  | 'sprinkler'
  | 'decor'
  | 'farmhouse'
  | 'automation';

export interface BuildingDef {
  id: string;
  name: string;
  w: number;
  h: number;
  cost: number;
  unlockLevel: number;
  kind: BuildingKind;
  desc: string;
  /** Animal slots for housing buildings. */
  capacity?: number;
  /** Watering radius in tiles (well / sprinkler). */
  radius?: number;
  /** Inventory slots for storage buildings. */
  storage?: number;
}

export interface RecipeDef {
  id: string;
  name: string;
  inputs: Array<{ itemId: string; qty: number }>;
  output: { itemId: string; qty: number };
  coins: number;
  unlockLevel: number;
  desc: string;
}

export type QuestMetric =
  | 'harvests'
  | 'cropsSold'
  | 'productsCollected'
  | 'coinsEarned'
  | 'buildingsBuilt'
  | 'crafts'
  | 'waters'
  | 'tills'
  | 'planted'
  | 'animalsOwned'
  | 'goldHarvests'
  | 'farmingLevel'
  | 'level'
  | 'carrotsHarvested'
  | 'eggsCollected'
  | 'buildingsOwned';

export interface QuestDef {
  id: string;
  title: string;
  desc: string;
  metric: QuestMetric;
  target: number;
  coins: number;
  xp: number;
  tier: 'main' | 'daily' | 'achievement';
}

export interface SeasonContractDef {
  id: string;
  title: string;
  desc: string;
  metric: QuestMetric;
  target: number;
  coins: number;
  xp: number;
}

export interface FestivalDef {
  season: Season;
  name: string;
  desc: string;
  bonusCoins: number;
  bonusXp: number;
  contracts: SeasonContractDef[];
}

export interface CollectionMilestoneDef {
  id: string;
  count: number;
  coins: number;
  xp: number;
}

export interface CollectionSetDef {
  id: string;
  name: string;
  desc: string;
  itemIds: string[];
  milestones: CollectionMilestoneDef[];
}

export interface CollectionEntrySave {
  itemId: string;
  qualities: Quality[];
}

export interface CollectionSave {
  entries: CollectionEntrySave[];
  claimedRewards: string[];
}

export interface AutomationDef {
  id: string;
  name: string;
  desc: string;
  cost: number;
  unlockLevel: number;
}

export interface AutomationSave {
  purchased: string[];
  disabled: string[];
}

export type FestivalTier = 'none' | 'bronze' | 'silver' | 'gold';

export interface FestivalContestDef {
  season: Season;
  name: string;
  desc: string;
  itemType: ItemType;
  count: number;
  themeBonuses: string[];
  bronze: number;
  silver: number;
  gold: number;
  coins: number;
  xp: number;
  ribbon: string;
}

export interface FestivalSave {
  season: Season;
  year: number;
  submitted: boolean;
  score: number;
  tier: FestivalTier;
  claimed: boolean;
}

export interface FishDef {
  id: string;
  name: string;
  itemId: string;
  seasons: Season[];
  weathers: Weather[];
  minHour: number;
  maxHour: number;
  rarity: number;
  minSell: number;
  desc: string;
}

export type MineNodeKind = 'stone' | 'copper' | 'iron' | 'gold' | 'gem';

export interface MineNodeDef {
  id: string;
  x: number;
  y: number;
  kind: MineNodeKind;
}

export interface MineNodeSave {
  hp: number;
  respawnDay: number;
}

export interface NpcDef {
  id: string;
  name: string;
  role: string;
  birthdaySeason: Season;
  birthdayDay: number;
  visitDays: number[];
  romanceable: boolean;
  colors: number[];
  loves: string[];
  likes: string[];
  hates: string[];
  lines: string[];
  heartLines: string[];
  desc: string;
}

export interface NpcSave {
  id: string;
  friendship: number;
  talkedDay: number;
  giftedDay: number;
  met: boolean;
  requestWeek: number;
}

export interface UpgradeDef {
  id: 'hoe' | 'can' | 'boots' | 'backpack';
  name: string;
  desc: string;
  baseCost: number;
  maxLevel: number;
  unlockLevel: number;
}

export interface InventoryStack {
  itemId: string;
  qty: number;
  quality: Quality;
}

export interface CropSave {
  id: string;
  growth: number;
  dryDays: number;
  regrows: number;
}

export interface TileSave {
  tilled: boolean;
  watered: boolean;
  fertilized: boolean;
  crop?: CropSave;
}

export interface BuildingSave {
  uid: string;
  id: string;
  x: number;
  y: number;
}

export interface AnimalSave {
  uid: string;
  species: string;
  x: number;
  y: number;
  ageDays: number;
  happiness: number;
  health: number;
  fed: boolean;
  petted: boolean;
  productReady: boolean;
}

export type QuestDailySave = {
  id: string;
  target: number;
  coins: number;
  xp: number;
  claimed: boolean;
};

export interface DailySave {
  day: number;
  list: QuestDailySave[];
  startStats: Stats;
}

export interface SeasonalSave {
  season: Season;
  year: number;
  list: QuestDailySave[];
  startStats: Stats;
  bonusCoins: number;
  bonusXp: number;
  bonusClaimed: boolean;
}

export interface Stats {
  harvests: number;
  cropsSold: number;
  productsCollected: number;
  coinsEarned: number;
  buildingsBuilt: number;
  crafts: number;
  waters: number;
  tills: number;
  planted: number;
  animalsOwned: number;
  goldHarvests: number;
  daysPlayed: number;
  carrotsHarvested: number;
  eggsCollected: number;
  fishCaught: number;
  fishingCasts: number;
  rocksMined: number;
  oresMined: number;
}

export interface PlayerSave {
  x: number;
  y: number;
  facing: Facing;
}

export interface SaveData {
  version: number;
  createdAt: number;
  savedAt: number;
  player: PlayerSave;
  coins: number;
  day: number;
  season: Season;
  year: number;
  minute: number;
  weather: Weather;
  tiles: Record<string, TileSave>;
  buildings: BuildingSave[];
  animals: AnimalSave[];
  inventory: Array<InventoryStack | null>;
  unlockedPlots: number;
  farmhouseLevel: number;
  xp: Record<SkillKey, number>;
  upgrades: Record<string, number>;
  stats: Stats;
  claimedQuests: string[];
  achievements: string[];
  daily: DailySave | null;
  seasonal: SeasonalSave | null;
  collection: CollectionSave;
  automation: AutomationSave;
  festival: FestivalSave | null;
  ribbons: string[];
  mineNodes: Record<string, MineNodeSave>;
  npcs: Record<string, NpcSave>;
  spouseId: string | null;
  tutorialStep: number;
  tutorialDone: boolean;
  selectedItemId: string;
}

export interface Settings {
  music: boolean;
  sfx: boolean;
  reduceFlashing?: boolean;
  volume: number;
}

export interface ActionResult {
  ok: boolean;
  message?: string;
}

export interface SaleEntry {
  itemId: string;
  qty: number;
  quality: Quality;
  unitPrice: number;
  total: number;
}

export interface DaySummary {
  day: number;
  season: Season;
  year: number;
  weather: Weather;
  grown: number;
  wilted: number;
  products: number;
  messages: string[];
}

export interface SaveSlotInfo {
  slot: number;
  exists: boolean;
  savedAt?: number;
  day?: number;
  season?: Season;
  year?: number;
  coins?: number;
  level?: number;
}

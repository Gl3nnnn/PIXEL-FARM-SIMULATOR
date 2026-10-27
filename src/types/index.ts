/** Core shared types for Pixel Farm Simulator. */

export type Season = 'spring' | 'summer' | 'fall' | 'winter';
export type Weather = 'sunny' | 'cloudy' | 'rain' | 'storm';
export type Quality = 'normal' | 'silver' | 'gold';
export type Facing = 'down' | 'up' | 'left' | 'right';
export type SkillKey = 'farming' | 'animal' | 'crafting' | 'business';

export type ItemType =
  | 'seed'
  | 'crop'
  | 'tool'
  | 'material'
  | 'product'
  | 'crafted'
  | 'feed'
  | 'fertilizer';

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
  | 'farmhouse';

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
  tutorialStep: number;
  tutorialDone: boolean;
  selectedItemId: string;
}

export interface Settings {
  music: boolean;
  sfx: boolean;
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

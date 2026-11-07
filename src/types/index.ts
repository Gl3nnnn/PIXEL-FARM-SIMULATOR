/** Core shared types for Pixel Farm Simulator. */

export type Season = 'spring' | 'summer' | 'fall' | 'winter';
export type Weather = 'sunny' | 'cloudy' | 'rain' | 'storm' | 'snow' | 'wind' | 'fog';
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
  | 'ore'
  | 'artifact';

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

/** How a crop or animal is drawn from its colour palette. */
export type PlantArchetype =
  | 'grain'
  | 'root'
  | 'bush'
  | 'vine'
  | 'tall'
  | 'head'
  | 'tree'
  | 'flower';

/** Housing a species lives in. */
export type HousingId = 'coop' | 'barn' | 'pond' | 'stable' | 'apiary' | 'hutch' | 'kennel' | 'aviary' | 'pasture';

/** What a tool improves. */
export type ToolEffect = 'till' | 'water' | 'plant' | 'speed' | 'bag' | 'luck' | 'rod' | 'mine';

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
  /** Art style used for the classic ten crops. */
  shape?: CropShape;
  /** Art style for every other crop, drawn in the crop's palette. */
  art?: PlantArchetype;
  palette: number[];
  desc: string;
}

export interface AnimalDef {
  id: string;
  name: string;
  housing: HousingId;
  price: number;
  productId: string;
  maturityDays: number;
  desc: string;
  colors: number[];
  /** Art style used for the classic five animals. */
  shape?: string;
  /** Art style for every other animal, drawn in the animal's colours. */
  art?: PlantArchetype;
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
  | 'automation'
  | 'shipping';

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
  /** The kind of animal this building houses. */
  houses?: HousingId;
  /** Watering radius in tiles (well / sprinkler). */
  radius?: number;
  /** Inventory slots for storage buildings. */
  storage?: number;
  /** Extra backpack slots from storage buildings. */
  slots?: number;
  /** Art style used for the classic buildings. */
  art?: string;
  /** Rooftop colour for other buildings. */
  colors?: number[];
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
  | 'buildingsOwned'
  | 'deepestFloor'
  | 'museumDonations';

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
  /** Friendship thresholds whose heart event has already played. */
  heartEvents?: number[];
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
  /** True when the player keeps this stack out of sales. */
  locked?: boolean;
  itemId: string;
  qty: number;
  quality: Quality;
}

export interface ToolDef {
  id: string;
  name: string;
  desc: string;
  price: number;
  unlockLevel: number;
  effect: ToolEffect;
  bonus: number;
  colors: number[];
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

// ------------------------------------------------------- cozy farm life types

/** What a chosen profession improves. */
export type ProfessionKind = 'maxEnergy' | 'energyCost' | 'sellPrice' | 'extraYield' | 'luck';

export interface ProfessionDef {
  id: string;
  skill: SkillKey;
  /** 5 or 10: the skill level that offers this choice. */
  level: number;
  name: string;
  desc: string;
  kind: ProfessionKind;
  value: number;
}

export interface ForageDef {
  id: string;
  itemId: string;
  seasons: Season[];
  /** Higher means it appears more often. */
  weight: number;
}

export interface ForageSave {
  uid: string;
  itemId: string;
  x: number;
  y: number;
  day: number;
}

export interface MailDef {
  id: string;
  from: string;
  subject: string;
  body: string;
  coins: number;
  /** Appears once the farmer reaches this level (1 = any time). */
  atLevel: number;
  /**
   * Tutorial letters instead wait for a number of days played, and only the
   * earliest due one is delivered each day so the mailbox never floods.
   */
  atDay?: number;
  itemId?: string;
  itemQty?: number;
}

export interface MailSave {
  id: string;
  read: boolean;
  claimed: boolean;
  day: number;
}

/** A one-day food buff that is active on a given day. */
export interface BuffEntry {
  id: string;
  day: number;
}

export interface BundleRequirement {
  itemId: string;
  qty: number;
}

export interface BundleDef {
  id: string;
  name: string;
  desc: string;
  requirements: BundleRequirement[];
  coins: number;
  xp: number;
  rewardItemId?: string;
  rewardQty?: number;
}

export interface BundleSave {
  id: string;
  donated: Record<string, number>;
  claimed: boolean;
}

// ------------------------------------------------------- adventure & town life

/** A weapon carried into the old mine. */
export interface WeaponDef {
  id: string;
  name: string;
  damage: number;
  price: number;
  unlockLevel: number;
  desc: string;
  color: number;
}

export type MineMonsterKind = 'slime' | 'bat' | 'crab' | 'shadow' | 'golem';

export interface MineMonsterDef {
  id: MineMonsterKind;
  name: string;
  minFloor: number;
  hp: number;
  damage: number;
  xp: number;
  loot: string[];
  color: number;
}

/** Persistent progress for the multi-floor old mine. */
export interface MineRunSave {
  floor: number;
  maxFloor: number;
  hp: number;
  maxHp: number;
  weapon: string;
  weapons: string[];
  elevator: number[];
  monstersDefeated: number;
}

export interface ShippingSave {
  items: InventoryStack[];
}

/** One entry in the lost item storehouse. */
export interface LostItemSave {
  itemId: string;
  qty: number;
  quality: Quality;
  /** Absolute day the entry was stored, so it can be forgotten after a while. */
  day: number;
}

/** The final farm evaluation left behind by the old farmer. */
export interface EvaluationSave {
  /** How many of the four candles were lit. */
  candles: number;
  /** The lines that made up the score. */
  reasons: string[];
  /** Absolute day the visit happened. */
  day: number;
}

export interface ChildSave {
  id: string;
  name: string;
  ageDays: number;
}

export interface FamilySave {
  children: ChildSave[];
}

export interface HouseSave {
  furniture: string[];
}

export type FurnitureBonus = 'energy' | 'luck' | 'capacity' | 'friendship';

export interface FurnitureDef {
  id: string;
  name: string;
  cost: number;
  bonus: FurnitureBonus;
  value: number;
  desc: string;
  color: number;
}

export interface MuseumSave {
  donated: string[];
  claimed: string[];
}

export interface MuseumRewardDef {
  id: string;
  count: number;
  coins: number;
  xp: number;
  itemId?: string;
  itemQty?: number;
  desc: string;
}

export interface PetSave {
  type: 'dog' | 'cat' | null;
  name: string;
  affection: number;
  lastPetDay: number;
}

export interface FestivalGameSave {
  season: Season;
  year: number;
  played: boolean;
  score: number;
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
  /** Rare surprise harvests that paid double coins. */
  luckyHarvests: number;
  daysPlayed: number;
  carrotsHarvested: number;
  eggsCollected: number;
  fishCaught: number;
  fishingCasts: number;
  rocksMined: number;
  oresMined: number;
  foragePicked: number;
  cropsLost: number;
  monstersDefeated: number;
  artifactsFound: number;
  itemsShipped: number;
}

export interface PlayerSave {
  x: number;
  y: number;
  facing: Facing;
}

/** The farmer's look: indexes into the matching appearance colour/style lists. */
export interface AppearanceSave {
  skin: number;
  hairStyle: number;
  hair: number;
  eye: number;
  eyeStyle: number;
  face: number;
  facialHair: number;
  /** 0 slim, 1 average, 2 broad. */
  build: number;
  /** Player-chosen name, empty when the player skips it. */
  name: string;
  /** Index into PRONOUNS. */
  pronouns: number;
  shirt: number;
  pattern: number;
  outfit: number;
  pants: number;
  boots: number;
  /** Hat colour index; -1 means no hat. */
  hat: number;
  /** 0 is no hat, then the styles in HAT_STYLES. */
  hatStyle: number;
  accessory: number;
}

/** One goal on the weekly board. */
export interface WeeklyEntrySave {
  id: string;
  claimed: boolean;
}

/** The weekly goal board. A new board starts every seven in-game days. */
export interface WeeklySave {
  /** Week number counted from the first day of the game. */
  week: number;
  list: WeeklyEntrySave[];
  /** Stats when the week began, so progress counts only this week. */
  startStats: Stats;
  bonusClaimed: boolean;
}

/** Login streak, daily gift and weekly goals: the reasons to come back. */
export interface EngagementSave {
  /** Real calendar day (YYYY-MM-DD) that the login streak last counted. */
  loginDate: string;
  loginStreak: number;
  /** Real calendar day (YYYY-MM-DD) the login gift was last claimed. */
  loginClaimDate: string;
  weekly: WeeklySave | null;
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
  /** Ids of the farm tools bought so far (see TOOLS). */
  toolsOwned: string[];
  /** Day energy left. Sleep refills it. */
  energy: number;
  /** Chosen profession ids, keyed by skill. */
  professions: Record<string, string[]>;
  /** Wild plants waiting to be picked on the map. */
  forage: ForageSave[];
  /** Letters that have arrived in the mailbox. */
  mail: MailSave[];
  /** Community bundle progress. */
  bundles: BundleSave[];
  /** Food buffs, cleared when the day ends. */
  buffs: BuffEntry[];
  /** Progress in the old mine. */
  mineRun: MineRunSave;
  /** Goods waiting to be sold by the shipping bin overnight. */
  shipping: ShippingSave;
  /** Items handed back by the lost item storehouse. */
  lostItems: LostItemSave[];
  /** Floors of the old mine already paid out as a summit prize. */
  summitClaimed: number[];
  /** The farm evaluation, once the old farmer comes to visit. */
  evaluation: EvaluationSave | null;
  /** Spouse, children and the family home. */
  family: FamilySave;
  /** Furniture placed inside the farmhouse. */
  house: HouseSave;
  /** Artifacts donated to the town museum. */
  museum: MuseumSave;
  /** The farm pet. */
  pet: PetSave;
  /** Whether a horse lives in the stable. */
  horseOwned: boolean;
  /** Festival minigame progress for the current season. */
  festivalGame: FestivalGameSave;
  /** The farmer's chosen look. */
  appearance: AppearanceSave;
  /** Luck rolled by the morning TV forecast, -0.05 to 0.05. */
  dailyLuck: number;
  /** Text of the day's TV forecast, shown in the farm report. */
  dailyForecast: string;
  /** Days since the farm was last played, 0 when you played yesterday. */
  daysAway: number;
  /** Login streak, daily gift and weekly goals. */
  engagement: EngagementSave;
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
  /** The morning TV forecast for the new day. */
  forecast?: string;
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

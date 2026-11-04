import type {
  AnimalDef,
  AutomationDef,
  BuildingDef,
  BundleDef,
  CollectionSetDef,
  CropDef,
  FestivalContestDef,
  FestivalDef,
  FishDef,
  ForageDef,
  FurnitureDef,
  HousingId,
  ItemDef,
  MailDef,
  MineMonsterDef,
  MuseumRewardDef,
  NpcDef,
  PlantArchetype,
  ProfessionDef,
  QuestDef,
  RecipeDef,
  Season,
  Settings,
  SkillKey,
  ToolDef,
  UpgradeDef,
  WeaponDef,
  Weather
} from '../types';

export const TILE = 32;
export const WORLD_W = 64;
export const WORLD_H = 48;
export const DAYS_PER_SEASON = 28;
export const START_MINUTE = 6 * 60;
export const MINUTES_PER_REAL_SECOND = 3;
export const CURRENT_SAVE_VERSION = 11;

export const SEASONS: Season[] = ['spring', 'summer', 'fall', 'winter'];
export const SKILLS = ['farming', 'animal', 'crafting', 'business', 'fishing', 'mining'] as const;

export const SEASON_INFO: Record<
  Season,
  { name: string; grass: number; grass2: number; tree: number; tree2: number; accent: string }
> = {
  spring: { name: 'Spring', grass: 0x6fae4f, grass2: 0x629e45, tree: 0x3f7d3a, tree2: 0x559b45, accent: '#8dd36b' },
  summer: { name: 'Summer', grass: 0x63a844, grass2: 0x56963b, tree: 0x2f6f33, tree2: 0x3f8a3d, accent: '#9fe06f' },
  fall: { name: 'Fall', grass: 0x9aa24a, grass2: 0x8a9442, tree: 0x9a5d2c, tree2: 0xb97a36, accent: '#e5b45c' },
  winter: { name: 'Winter', grass: 0x9fb8ab, grass2: 0x8fa89c, tree: 0x5e7c72, tree2: 0x759287, accent: '#cfe5e0' }
};

export const WEATHER_INFO: Record<Weather, { name: string; icon: string }> = {
  sunny: { name: 'Sunny', icon: '☀' },
  cloudy: { name: 'Cloudy', icon: '☁' },
  rain: { name: 'Rain', icon: '☂' },
  storm: { name: 'Storm', icon: '⚡' },
  snow: { name: 'Snow', icon: '❄' },
  wind: { name: 'Windy', icon: '≈' },
  fog: { name: 'Fog', icon: '≋' }
};

export const QUALITY_MULTIPLIER = { normal: 1, silver: 1.3, gold: 1.75 } as const;
export const QUALITY_LABEL = { normal: '', silver: 'Silver', gold: 'Gold' } as const;

export const DEFAULT_SETTINGS: Settings = { music: false, sfx: true, volume: 0.5 };

export const PLOTS = [
  { id: 0, x: 6, y: 10, w: 9, h: 6, cost: 0, name: 'Home Field' },
  { id: 1, x: 18, y: 10, w: 7, h: 6, cost: 600, name: 'East Field' },
  { id: 2, x: 28, y: 10, w: 7, h: 6, cost: 1800, name: 'River Field' },
  { id: 3, x: 38, y: 10, w: 9, h: 6, cost: 3200, name: 'Plum Field' },
  { id: 4, x: 6, y: 19, w: 9, h: 6, cost: 4500, name: 'South Field' },
  { id: 5, x: 18, y: 19, w: 7, h: 6, cost: 7000, name: 'Meadow Field' },
  { id: 6, x: 28, y: 19, w: 7, h: 6, cost: 9000, name: 'Sunset Field' },
  { id: 7, x: 38, y: 19, w: 9, h: 6, cost: 12000, name: 'Clover Field' },
  { id: 8, x: 6, y: 28, w: 9, h: 7, cost: 16000, name: 'Willow Field' },
  { id: 9, x: 18, y: 28, w: 7, h: 7, cost: 21000, name: 'Terrace Field' },
  { id: 10, x: 28, y: 28, w: 7, h: 7, cost: 26000, name: 'Lakeside Field' },
  { id: 11, x: 38, y: 28, w: 9, h: 7, cost: 32000, name: 'Hollow Field' }
] as const;

export const FARMHOUSE = { x: 5, y: 2, w: 5, h: 5 };

export const ITEMS: Record<string, ItemDef> = {
  hoe: { id: 'hoe', name: 'Hoe', type: 'tool', price: 0, sell: 0, stack: 1, desc: 'Tills grass into soil. Click a field tile.' },
  watering_can: { id: 'watering_can', name: 'Watering Can', type: 'tool', price: 0, sell: 0, stack: 1, desc: 'Waters soil so crops grow overnight.' },
  feed: { id: 'feed', name: 'Animal Feed', type: 'feed', price: 14, sell: 3, stack: 99, desc: 'Feed one animal each morning.', color: 0xd9b35a, color2: 0x8a6327 },
  fertilizer: { id: 'fertilizer', name: 'Fertilizer', type: 'fertilizer', price: 22, sell: 6, stack: 99, desc: 'Improves harvest quality on one soil tile.', color: 0x9ccf6a, color2: 0x6b4b2a },

  wheat_seed: { id: 'wheat_seed', name: 'Wheat Seeds', type: 'seed', price: 10, sell: 3, stack: 99, desc: 'Spring/Summer crop. Ready in 4 days.', cropId: 'wheat', color: 0xe0c15a },
  carrot_seed: { id: 'carrot_seed', name: 'Carrot Seeds', type: 'seed', price: 18, sell: 6, stack: 99, desc: 'Spring/Fall crop. Ready in 3 days.', cropId: 'carrots', color: 0xe08b3a },
  potato_seed: { id: 'potato_seed', name: 'Potato Seeds', type: 'seed', price: 24, sell: 8, stack: 99, desc: 'Spring crop. Ready in 4 days.', cropId: 'potatoes', color: 0xc09a5a },
  tomato_seed: { id: 'tomato_seed', name: 'Tomato Seeds', type: 'seed', price: 32, sell: 10, stack: 99, desc: 'Summer crop, regrows. Ready in 5 days.', cropId: 'tomatoes', color: 0xd84c3f },
  corn_seed: { id: 'corn_seed', name: 'Corn Seeds', type: 'seed', price: 36, sell: 12, stack: 99, desc: 'Summer/Fall crop. Ready in 6 days.', cropId: 'corn', color: 0xe8c84a },
  strawberry_seed: { id: 'strawberry_seed', name: 'Strawberry Seeds', type: 'seed', price: 48, sell: 16, stack: 99, desc: 'Spring crop, regrows. Ready in 5 days.', cropId: 'strawberries', color: 0xe0485c },
  pumpkin_seed: { id: 'pumpkin_seed', name: 'Pumpkin Seeds', type: 'seed', price: 60, sell: 20, stack: 99, desc: 'Fall crop. Ready in 7 days.', cropId: 'pumpkins', color: 0xe8892f },
  cabbage_seed: { id: 'cabbage_seed', name: 'Cabbage Seeds', type: 'seed', price: 30, sell: 10, stack: 99, desc: 'Spring/Fall crop. Ready in 4 days.', cropId: 'cabbage', color: 0x8fc466 },
  rice_seed: { id: 'rice_seed', name: 'Rice Seeds', type: 'seed', price: 28, sell: 9, stack: 99, desc: 'Summer crop. Ready in 5 days.', cropId: 'rice', color: 0xc8d07a },
  sunflower_seed: { id: 'sunflower_seed', name: 'Sunflower Seeds', type: 'seed', price: 40, sell: 13, stack: 99, desc: 'Summer/Fall crop. Ready in 4 days.', cropId: 'sunflowers', color: 0xf0c43a },

  wheat: { id: 'wheat', name: 'Wheat', type: 'crop', price: 14, sell: 14, stack: 99, desc: 'Golden wheat. Used in flour.', cropId: 'wheat', color: 0xe0c15a },
  carrots: { id: 'carrots', name: 'Carrots', type: 'crop', price: 20, sell: 20, stack: 99, desc: 'Crunchy carrots.', cropId: 'carrots', color: 0xe08b3a },
  potatoes: { id: 'potatoes', name: 'Potatoes', type: 'crop', price: 16, sell: 16, stack: 99, desc: 'Hearty potatoes.', cropId: 'potatoes', color: 0xc09a5a },
  tomatoes: { id: 'tomatoes', name: 'Tomatoes', type: 'crop', price: 34, sell: 34, stack: 99, desc: 'Ripe tomatoes.', cropId: 'tomatoes', color: 0xd84c3f },
  corn: { id: 'corn', name: 'Corn', type: 'crop', price: 42, sell: 42, stack: 99, desc: 'Sweet corn.', cropId: 'corn', color: 0xe8c84a },
  strawberries: { id: 'strawberries', name: 'Strawberries', type: 'crop', price: 38, sell: 38, stack: 99, desc: 'Sweet berries.', cropId: 'strawberries', color: 0xe0485c },
  pumpkins: { id: 'pumpkins', name: 'Pumpkin', type: 'crop', price: 160, sell: 160, stack: 99, desc: 'A prize pumpkin.', cropId: 'pumpkins', color: 0xe8892f },
  cabbage: { id: 'cabbage', name: 'Cabbage', type: 'crop', price: 70, sell: 70, stack: 99, desc: 'Crisp cabbage.', cropId: 'cabbage', color: 0x8fc466 },
  rice: { id: 'rice', name: 'Rice', type: 'crop', price: 20, sell: 20, stack: 99, desc: 'Grains of rice.', cropId: 'rice', color: 0xe8e3c0 },
  sunflowers: { id: 'sunflowers', name: 'Sunflower', type: 'crop', price: 90, sell: 90, stack: 99, desc: 'A bright sunflower.', cropId: 'sunflowers', color: 0xf0c43a },

  egg: { id: 'egg', name: 'Egg', type: 'product', price: 24, sell: 24, stack: 99, desc: 'Farm fresh egg.', color: 0xf7efd8, color2: 0xd9c9a0 },
  duck_egg: { id: 'duck_egg', name: 'Duck Egg', type: 'product', price: 32, sell: 32, stack: 99, desc: 'Rich duck egg.', color: 0xcfe4de, color2: 0x9fc0b8 },
  milk: { id: 'milk', name: 'Milk', type: 'product', price: 48, sell: 48, stack: 99, desc: 'Fresh milk.', color: 0xf5f3ea, color2: 0xb9c8d8 },
  wool: { id: 'wool', name: 'Wool', type: 'product', price: 62, sell: 62, stack: 99, desc: 'Soft wool.', color: 0xe8e2d0, color2: 0xb8ad92 },
  truffle: { id: 'truffle', name: 'Truffle', type: 'product', price: 140, sell: 140, stack: 99, desc: 'A rare find!', color: 0x6e4a34, color2: 0x3f2a1e },

  flour: { id: 'flour', name: 'Flour', type: 'crafted', price: 46, sell: 46, stack: 99, desc: 'Milled wheat.', color: 0xf0e6d2, color2: 0xd9c9a0 },
  bread: { id: 'bread', name: 'Bread', type: 'crafted', price: 120, sell: 120, stack: 99, desc: 'Warm loaf.', color: 0xd9a45a, color2: 0xa87433 },
  cheese: { id: 'cheese', name: 'Cheese', type: 'crafted', price: 110, sell: 110, stack: 99, desc: 'Aged cheese.', color: 0xf0c84a, color2: 0xd9a02f },
  jam: { id: 'jam', name: 'Berry Jam', type: 'crafted', price: 150, sell: 150, stack: 99, desc: 'Sweet preserves.', color: 0xc0344c, color2: 0x8a2038 },
  cloth: { id: 'cloth', name: 'Wool Cloth', type: 'crafted', price: 130, sell: 130, stack: 99, desc: 'Woven cloth.', color: 0xd8d0bc, color2: 0xa89e86 },
  pumpkin_pie: { id: 'pumpkin_pie', name: 'Pumpkin Pie', type: 'crafted', price: 400, sell: 400, stack: 99, desc: 'Festival favourite.', color: 0xe8a24a, color2: 0xb9762c },
  omelette: { id: 'omelette', name: 'Omelette', type: 'crafted', price: 70, sell: 70, stack: 99, desc: 'Fluffy breakfast.', color: 0xf0cc5c, color2: 0xd9a52f },
  truffle_oil: { id: 'truffle_oil', name: 'Truffle Oil', type: 'crafted', price: 300, sell: 300, stack: 99, desc: 'Luxury cooking oil.', color: 0xc8a44a, color2: 0x7a5a2a },

  fishing_rod: { id: 'fishing_rod', name: 'Fishing Rod', type: 'tool', price: 450, sell: 0, stack: 1, desc: 'Cast at the pond edge to catch seasonal fish.', color: 0x9a6a3a, color2: 0xd8d8d8 },
  pickaxe: { id: 'pickaxe', name: 'Pickaxe', type: 'tool', price: 500, sell: 0, stack: 1, desc: 'Break quarry rocks for stone and ore.', color: 0x9aa4ac, color2: 0x8a5a34 },
  bait: { id: 'bait', name: 'Fishing Bait', type: 'material', price: 8, sell: 2, stack: 99, desc: 'Improves your chance in the fishing minigame.', color: 0xc06a4a, color2: 0x8a4a3a },

  minnow: { id: 'minnow', name: 'Minnow', type: 'fish', price: 18, sell: 18, stack: 99, desc: 'A tiny, quick pond fish.', color: 0x9ab8c8, color2: 0x6a8a9a },
  carp: { id: 'carp', name: 'Carp', type: 'fish', price: 32, sell: 32, stack: 99, desc: 'A common pond fish.', color: 0xc8a86a, color2: 0x8a6a3a },
  bass: { id: 'bass', name: 'Bass', type: 'fish', price: 55, sell: 55, stack: 99, desc: 'A feisty freshwater fish.', color: 0x6a8a5a, color2: 0x3f5a3a },
  trout: { id: 'trout', name: 'Trout', type: 'fish', price: 75, sell: 75, stack: 99, desc: 'A spotted river fish.', color: 0xb8c8a8, color2: 0x6a8a6a },
  catfish: { id: 'catfish', name: 'Catfish', type: 'fish', price: 110, sell: 110, stack: 99, desc: 'A whiskered night fish.', color: 0x7a6a5a, color2: 0x4a3a2a },
  salmon: { id: 'salmon', name: 'Salmon', type: 'fish', price: 150, sell: 150, stack: 99, desc: 'A prized autumn catch.', color: 0xe89a7a, color2: 0xb85a4a },
  koi: { id: 'koi', name: 'Koi', type: 'fish', price: 260, sell: 260, stack: 99, desc: 'A beautiful ornamental fish.', color: 0xf0e8d8, color2: 0xe06a3a },
  golden_carp: { id: 'golden_carp', name: 'Golden Carp', type: 'fish', price: 600, sell: 600, stack: 99, desc: 'A legendary golden catch.', color: 0xf0c84a, color2: 0xd89a2a },

  stone: { id: 'stone', name: 'Stone', type: 'ore', price: 12, sell: 12, stack: 99, desc: 'A sturdy building stone.', color: 0x9aa0a6, color2: 0x6a7076 },
  copper_ore: { id: 'copper_ore', name: 'Copper Ore', type: 'ore', price: 35, sell: 35, stack: 99, desc: 'A warm copper nugget.', color: 0xd8844a, color2: 0x9a5a2a },
  iron_ore: { id: 'iron_ore', name: 'Iron Ore', type: 'ore', price: 70, sell: 70, stack: 99, desc: 'A heavy iron nugget.', color: 0xb8c0c8, color2: 0x7a828a },
  gold_ore: { id: 'gold_ore', name: 'Gold Ore', type: 'ore', price: 160, sell: 160, stack: 99, desc: 'A glittering gold nugget.', color: 0xf0c84a, color2: 0xb8902a },
  gem: { id: 'gem', name: 'Gemstone', type: 'ore', price: 400, sell: 400, stack: 99, desc: 'A rare, flawless gem.', color: 0x9ad8f0, color2: 0x5a8ac8 },

  grilled_fish: { id: 'grilled_fish', name: 'Grilled Fish', type: 'crafted', price: 160, sell: 160, stack: 99, desc: 'A simple, filling fish dish.', color: 0xd8a05a, color2: 0x9a6a2a },
  fish_stew: { id: 'fish_stew', name: 'Fish Stew', type: 'crafted', price: 360, sell: 360, stack: 99, desc: 'A hearty fisherman\'s stew.', color: 0xe8b86a, color2: 0xb87a3a },
  salmon_dinner: { id: 'salmon_dinner', name: 'Salmon Dinner', type: 'crafted', price: 430, sell: 430, stack: 99, desc: 'A celebratory salmon plate.', color: 0xe88a6a, color2: 0xa85a3a },

  daffodil: { id: 'daffodil', name: 'Daffodil', type: 'crop', price: 38, sell: 38, stack: 99, desc: 'A bright spring wildflower.', color: 0xf0d84a, color2: 0x5b9b3a },
  leek: { id: 'leek', name: 'Wild Leek', type: 'crop', price: 46, sell: 46, stack: 99, desc: 'A mild wild onion from the hedgerow.', color: 0x8fc466, color2: 0xe8e8d8 },
  mushroom: { id: 'mushroom', name: 'Wild Mushroom', type: 'crop', price: 60, sell: 60, stack: 99, desc: 'Found under the old trees.', color: 0xc06a4a, color2: 0xf0e2c8 },
  spice_berry: { id: 'spice_berry', name: 'Spice Berry', type: 'crop', price: 52, sell: 52, stack: 99, desc: 'A warm, peppery summer berry.', color: 0xd8546a, color2: 0x9a3448 },
  grapes: { id: 'grapes', name: 'Wild Grapes', type: 'crop', price: 70, sell: 70, stack: 99, desc: 'A cluster of small sweet grapes.', color: 0x8a5ab8, color2: 0x5a3a7a },
  hazelnut: { id: 'hazelnut', name: 'Hazelnut', type: 'crop', price: 80, sell: 80, stack: 99, desc: 'A fallen autumn nut.', color: 0xb8905a, color2: 0x7a5a34 },
  winter_root: { id: 'winter_root', name: 'Winter Root', type: 'crop', price: 65, sell: 65, stack: 99, desc: 'A pale root that survives the frost.', color: 0xe8dcc0, color2: 0x9a8a6a },
  snow_yam: { id: 'snow_yam', name: 'Snow Yam', type: 'crop', price: 95, sell: 95, stack: 99, desc: 'Sweet, rare and buried in snow.', color: 0xf0ece0, color2: 0xc0b89a },

  artifact_pottery: { id: 'artifact_pottery', name: 'Ancient Pottery', type: 'artifact', price: 180, sell: 180, stack: 99, desc: 'A painted shard from a forgotten farmstead.', color: 0xc08a5a, color2: 0x8a5a34 },
  artifact_coin: { id: 'artifact_coin', name: 'Old Coin', type: 'artifact', price: 260, sell: 260, stack: 99, desc: 'A coin stamped with a valley that no longer exists.', color: 0xe8c84a, color2: 0xa8862a },
  artifact_bone: { id: 'artifact_bone', name: 'Fossil Bone', type: 'artifact', price: 340, sell: 340, stack: 99, desc: 'Something very old slept in the quarry.', color: 0xe8e0c8, color2: 0xb0a888 },
  summit_key: { id: 'summit_key', name: 'Summit Key', type: 'artifact', price: 2500, sell: 1200, stack: 1, desc: 'A heavy brass key from the treasure room at the very bottom of the old mine.', color: 0xd8b040, color2: 0x8a6a20 },
  artifact_doll: { id: 'artifact_doll', name: 'Porcelain Doll', type: 'artifact', price: 440, sell: 440, stack: 99, desc: 'Its painted smile is still perfect.', color: 0xf0d8dc, color2: 0xc88a9a },
  artifact_scroll: { id: 'artifact_scroll', name: 'Sealed Scroll', type: 'artifact', price: 560, sell: 560, stack: 99, desc: 'Words written in a hand nobody reads anymore.', color: 0xe8d8b0, color2: 0xa88a5a },
  artifact_seed: { id: 'artifact_seed', name: 'Ancient Seed', type: 'artifact', price: 800, sell: 800, stack: 99, desc: 'A seed that waited centuries for a farmer.', color: 0x8a6a3a, color2: 0x5a9a3a }
};

// ----------------------------------------------------------------- weapons / mine
/** Melee weapons used in the old mine. */
export const WEAPONS: WeaponDef[] = [
  { id: 'rusty_sword', name: 'Rusty Sword', damage: 3, price: 0, unlockLevel: 1, desc: 'A chipped blade from the tool shed.', color: 0x9a9a8a },
  { id: 'iron_sword', name: 'Iron Sword', damage: 6, price: 1200, unlockLevel: 3, desc: 'A plain, dependable blade for the upper floors.', color: 0xb8c0c8 },
  { id: 'steel_sword', name: 'Steel Sword', damage: 10, price: 3000, unlockLevel: 5, desc: 'Cuts through the dark like a lantern.', color: 0xd8e0e8 },
  { id: 'crystal_sword', name: 'Crystal Sword', damage: 16, price: 7000, unlockLevel: 8, desc: 'A humming blade found deep beneath the valley.', color: 0x9ad8f0 }
];

/** Monsters that roam the lower mine floors. */
export const MINE_MONSTERS: MineMonsterDef[] = [
  { id: 'slime', name: 'Green Slime', minFloor: 1, hp: 10, damage: 4, xp: 4, loot: ['stone'], color: 0x6fae4f },
  { id: 'bat', name: 'Cave Bat', minFloor: 5, hp: 14, damage: 6, xp: 6, loot: ['stone'], color: 0x7a6a8a },
  { id: 'crab', name: 'Rock Crab', minFloor: 15, hp: 24, damage: 9, xp: 9, loot: ['stone', 'copper_ore'], color: 0x9a7a5a },
  { id: 'shadow', name: 'Shadow Brute', minFloor: 35, hp: 40, damage: 13, xp: 14, loot: ['iron_ore', 'gem'], color: 0x3a2a4a },
  { id: 'golem', name: 'Stone Golem', minFloor: 65, hp: 70, damage: 18, xp: 20, loot: ['gold_ore', 'gem'], color: 0x8a8a8a }
];

export const MINE_MAX_FLOOR = 120;
export const MINE_FLOOR_W = 9;
export const MINE_FLOOR_H = 7;

/** The treasure room waiting at the bottom of the old mine. */
export const MINE_SUMMIT = {
  floor: MINE_MAX_FLOOR,
  coins: 5000,
  xp: 300,
  itemId: 'summit_key',
  itemQty: 1
};

// ------------------------------------------------------- lost item storehouse
/**
 * The storehouse in town hands back goods you sold or lost by mistake, for a
 * small fee. Stardew simply forgets them, so this is deliberately kinder.
 */
export const LOST_ITEM_MAX = 10;
/**
 * A reclaim costs this much of the item's sell value, so it stings a little and
 * can never be abused as a money loop - the fee is always above market price.
 */
export const LOST_ITEM_FEE_RATE = 1.5;
/** A fee never drops below this, so the storehouse stays worth visiting. */
export const LOST_ITEM_MIN_FEE = 5;
/**
 * Only a real loss is rescued, so ordinary harvests are not swept up and the
 * shelf stays a place for things you would actually miss.
 */
export const LOST_ITEM_RESCUE_VALUE = 400;
/** Entries older than this are quietly cleared away. */
export const LOST_ITEM_KEEP_DAYS = 28;

// ---------------------------------------------------------- farm evaluation
/** The old farmer visits on the first day of year 2 and grades the farm. */
export const EVALUATION_GOALS = {
  coinsEarned: 25000,
  buildings: 8,
  animals: 6,
  bundles: 3,
  collection: 30,
  level: 12,
  ribbons: 2,
  museum: 4
};
/** Points needed for one lit candle, so four candles light a perfect farm. */
export const EVALUATION_CANDLE_POINTS = 2.5;

// ------------------------------------------------------------ house furniture
/** Furniture sold by the town carpenter. Each piece gives a small permanent perk. */
export const FURNITURE: FurnitureDef[] = [
  { id: 'cozy_rug', name: 'Cozy Rug', cost: 260, bonus: 'luck', value: 0.02, desc: 'Warm feet, better harvests.', color: 0xb85a4a },
  { id: 'oak_bed', name: 'Oak Bed', cost: 420, bonus: 'energy', value: 10, desc: 'A deeper sleep: +10 max energy.', color: 0xa87a4a },
  { id: 'kitchen_table', name: 'Kitchen Table', cost: 640, bonus: 'energy', value: 12, desc: 'Long breakfasts: +12 max energy.', color: 0xd8b878 },
  { id: 'flower_vase', name: 'Flower Vase', cost: 380, bonus: 'friendship', value: 0.05, desc: 'Guests feel welcome: friendship grows faster.', color: 0xe87a9a },
  { id: 'bookshelf', name: 'Bookshelf', cost: 720, bonus: 'luck', value: 0.03, desc: 'Good reading sharpens your eye.', color: 0x8a5a34 },
  { id: 'pantry', name: 'Pantry Cupboard', cost: 900, bonus: 'capacity', value: 6, desc: '+6 backpack slots for the household.', color: 0xc8a878 },
  { id: 'fireplace', name: 'Stone Fireplace', cost: 1200, bonus: 'energy', value: 18, desc: 'A crackling fire: +18 max energy.', color: 0x9a8a7a },
  { id: 'piano', name: 'Old Piano', cost: 1800, bonus: 'friendship', value: 0.1, desc: 'Evenings become occasions: friendship grows faster.', color: 0x3a3a3a },
  { id: 'aquarium', name: 'Home Aquarium', cost: 1500, bonus: 'luck', value: 0.04, desc: 'Watching the fish clears your mind.', color: 0x5a9aa8 },
  { id: 'hearth_clock', name: 'Hearth Clock', cost: 2200, bonus: 'energy', value: 24, desc: 'You never waste a minute: +24 max energy.', color: 0xc89a4a }
];

// ------------------------------------------------------------- town museum
/** Rewards for donating artifacts to the town museum. */
export const MUSEUM_REWARDS: MuseumRewardDef[] = [
  { id: 'museum_2', count: 2, coins: 400, xp: 30, desc: 'The curator frames your first finds.' },
  { id: 'museum_4', count: 4, coins: 900, xp: 75, itemId: 'gem', itemQty: 1, desc: 'A small display case opens.' },
  { id: 'museum_6', count: 6, coins: 2000, xp: 150, itemId: 'artifact_seed', itemQty: 1, desc: 'The whole collection is on display.' }
];

export const CROPS: Record<string, CropDef> = {
  wheat: { id: 'wheat', name: 'Wheat', seedId: 'wheat_seed', harvestId: 'wheat', seasons: ['spring', 'summer'], growthDays: 4, regrowDays: 0, yieldMin: 2, yieldMax: 3, shape: 'wheat', palette: [0x6f9b3a, 0x88b447, 0xe0c15a, 0xb8972f], desc: 'A reliable staple crop.' },
  carrots: { id: 'carrots', name: 'Carrots', seedId: 'carrot_seed', harvestId: 'carrots', seasons: ['spring', 'fall'], growthDays: 3, regrowDays: 0, yieldMin: 2, yieldMax: 3, shape: 'carrot', palette: [0x4f8c38, 0x76b34a, 0xe08b3a, 0xb86924], desc: 'Sweet root vegetables.' },
  potatoes: { id: 'potatoes', name: 'Potatoes', seedId: 'potato_seed', harvestId: 'potatoes', seasons: ['spring'], growthDays: 4, regrowDays: 0, yieldMin: 2, yieldMax: 4, shape: 'potato', palette: [0x4f8c38, 0x6f9b3a, 0xc09a5a, 0x8f6d3a], desc: 'Hearty and filling.' },
  tomatoes: { id: 'tomatoes', name: 'Tomatoes', seedId: 'tomato_seed', harvestId: 'tomatoes', seasons: ['summer'], growthDays: 5, regrowDays: 2, yieldMin: 2, yieldMax: 3, shape: 'tomato', palette: [0x3f7d3a, 0x5b9b3a, 0xd84c3f, 0xa82f2f], desc: 'Keeps producing after harvest.' },
  corn: { id: 'corn', name: 'Corn', seedId: 'corn_seed', harvestId: 'corn', seasons: ['summer', 'fall'], growthDays: 6, regrowDays: 0, yieldMin: 2, yieldMax: 3, shape: 'corn', palette: [0x4f8c38, 0x6f9b3a, 0xe8c84a, 0xb99b2f], desc: 'Tall summer stalks.' },
  strawberries: { id: 'strawberries', name: 'Strawberries', seedId: 'strawberry_seed', harvestId: 'strawberries', seasons: ['spring'], growthDays: 5, regrowDays: 2, yieldMin: 2, yieldMax: 3, shape: 'strawberry', palette: [0x3f7d3a, 0x5b9b3a, 0xe0485c, 0xa83048], desc: 'Regrows every couple of days.' },
  pumpkins: { id: 'pumpkins', name: 'Pumpkins', seedId: 'pumpkin_seed', harvestId: 'pumpkins', seasons: ['fall'], growthDays: 7, regrowDays: 0, yieldMin: 1, yieldMax: 1, shape: 'pumpkin', palette: [0x4f8c38, 0x6f9b3a, 0xe8892f, 0xc0671f], desc: 'Big autumn profits.' },
  cabbage: { id: 'cabbage', name: 'Cabbage', seedId: 'cabbage_seed', harvestId: 'cabbage', seasons: ['spring', 'fall'], growthDays: 4, regrowDays: 0, yieldMin: 1, yieldMax: 1, shape: 'cabbage', palette: [0x4f8c38, 0x76b34a, 0xa8d878, 0x6f9b3a], desc: 'Dense leafy heads.' },
  rice: { id: 'rice', name: 'Rice', seedId: 'rice_seed', harvestId: 'rice', seasons: ['summer'], growthDays: 5, regrowDays: 0, yieldMin: 2, yieldMax: 4, shape: 'rice', palette: [0x6f9b3a, 0x9bb85a, 0xe8e3c0, 0xc0bb98], desc: 'Loves the summer sun.' },
  sunflowers: { id: 'sunflowers', name: 'Sunflowers', seedId: 'sunflower_seed', harvestId: 'sunflowers', seasons: ['summer', 'fall'], growthDays: 4, regrowDays: 0, yieldMin: 1, yieldMax: 1, shape: 'sunflower', palette: [0x4f8c38, 0x6f9b3a, 0xf0c43a, 0xb8902a], desc: 'Bright and valuable.' }
};

// --------------------------------------------------- cozy life: energy, jobs
/** A farmer's day holds this much energy. Sleep refills it. */
export const BASE_MAX_ENERGY = 220;

/** Energy spent by each kind of work. */
export const ENERGY_COST = {
  till: 4,
  water: 2,
  plant: 1,
  harvest: 2,
  fertilize: 2,
  mine: 5,
  fish: 3,
  forage: 1
} as const;

export interface EnergyCostItem {
  key: keyof typeof ENERGY_COST;
  label: string;
}

export const ENERGY_ACTIONS: EnergyCostItem[] = [
  { key: 'till', label: 'Till soil' },
  { key: 'water', label: 'Water crops' },
  { key: 'plant', label: 'Plant a seed' },
  { key: 'harvest', label: 'Harvest' },
  { key: 'fertilize', label: 'Fertilize' },
  { key: 'mine', label: 'Mine a rock' },
  { key: 'fish', label: 'Cast the rod' },
  { key: 'forage', label: 'Pick wild plants' }
];

/** A one-day buff from eating a cooked dish. */
export interface BuffDef {
  id: string;
  itemId: string;
  name: string;
  kind: 'speed' | 'luck' | 'energy';
  value: number;
  desc: string;
}

export const BUFFS: BuffDef[] = [
  { id: 'buff_speed', itemId: 'grilled_fish', name: 'Light Feet', kind: 'speed', value: 0.2, desc: 'Walk 20% faster for the rest of the day.' },
  { id: 'buff_luck', itemId: 'bread', name: 'Good Fortune', kind: 'luck', value: 0.06, desc: 'Better harvest quality for the rest of the day.' },
  { id: 'buff_energy', itemId: 'omelette', name: 'Hearty Meal', kind: 'energy', value: 60, desc: 'Restores 60 energy right away.' },
  { id: 'buff_luck_stew', itemId: 'fish_stew', name: "Angler's Luck", kind: 'luck', value: 0.1, desc: 'Better harvest quality for the rest of the day.' },
  { id: 'buff_speed_pie', itemId: 'pumpkin_pie', name: 'Festival Spirit', kind: 'speed', value: 0.15, desc: 'Walk 15% faster for the rest of the day.' }
];

export const PROFESSIONS: ProfessionDef[] = [
  { id: 'tiller', skill: 'farming', level: 5, name: 'Tiller', kind: 'extraYield', value: 1, desc: 'Crops have a chance to yield one extra item.' },
  { id: 'rancher', skill: 'farming', level: 5, name: 'Rancher', kind: 'sellPrice', value: 0.1, desc: 'Animal products and crops sell for 10% more.' },
  { id: 'botanist', skill: 'farming', level: 10, name: 'Botanist', kind: 'luck', value: 0.06, desc: 'Harvests are more likely to be silver or gold.' },
  { id: 'homesteader', skill: 'farming', level: 10, name: 'Homesteader', kind: 'maxEnergy', value: 40, desc: 'Your day holds 40 more energy.' },

  { id: 'shepherd', skill: 'animal', level: 5, name: 'Shepherd', kind: 'extraYield', value: 1, desc: 'Animals have a chance to give a second product.' },
  { id: 'cowhand', skill: 'animal', level: 5, name: 'Cowhand', kind: 'sellPrice', value: 0.1, desc: 'Animal products sell for 10% more.' },
  { id: 'breeder', skill: 'animal', level: 10, name: 'Breeder', kind: 'luck', value: 0.05, desc: 'Animals stay happier and give better products.' },
  { id: 'early_bird', skill: 'animal', level: 10, name: 'Early Bird', kind: 'energyCost', value: 0.2, desc: 'All farm work costs 20% less energy.' },

  { id: 'artisan', skill: 'crafting', level: 5, name: 'Artisan', kind: 'sellPrice', value: 0.15, desc: 'Everything you craft sells for 15% more.' },
  { id: 'tinkerer', skill: 'crafting', level: 5, name: 'Tinkerer', kind: 'luck', value: 0.05, desc: 'A little extra luck in everything you do.' },
  { id: 'blacksmith', skill: 'crafting', level: 10, name: 'Blacksmith', kind: 'extraYield', value: 1, desc: 'Mining rocks can drop one extra ore.' },
  { id: 'architect', skill: 'crafting', level: 10, name: 'Architect', kind: 'maxEnergy', value: 30, desc: 'Your day holds 30 more energy.' },

  { id: 'merchant', skill: 'business', level: 5, name: 'Merchant', kind: 'sellPrice', value: 0.15, desc: 'Everything you sell is worth 15% more.' },
  { id: 'haggler', skill: 'business', level: 5, name: 'Haggler', kind: 'energyCost', value: 0.1, desc: 'Farm work costs 10% less energy.' },
  { id: 'tycoon', skill: 'business', level: 10, name: 'Tycoon', kind: 'sellPrice', value: 0.2, desc: 'Everything you sell is worth 20% more.' },
  { id: 'innkeeper', skill: 'business', level: 10, name: 'Innkeeper', kind: 'maxEnergy', value: 30, desc: 'Your day holds 30 more energy.' },

  { id: 'angler', skill: 'fishing', level: 5, name: 'Angler', kind: 'extraYield', value: 1, desc: 'Fishing can land an extra fish.' },
  { id: 'spear_fisher', skill: 'fishing', level: 5, name: 'Spear Fisher', kind: 'energyCost', value: 0.15, desc: 'Casting the rod costs less energy.' },
  { id: 'pond_keeper', skill: 'fishing', level: 10, name: 'Pond Keeper', kind: 'luck', value: 0.05, desc: 'Better luck with every catch.' },
  { id: 'lure_master', skill: 'fishing', level: 10, name: 'Lure Master', kind: 'extraYield', value: 1, desc: 'Fish are more likely to come in pairs.' },

  { id: 'prospector', skill: 'mining', level: 5, name: 'Prospector', kind: 'extraYield', value: 1, desc: 'Rocks can drop an extra stone or ore.' },
  { id: 'miner', skill: 'mining', level: 5, name: 'Miner', kind: 'energyCost', value: 0.15, desc: 'Mining costs less energy.' },
  { id: 'gem_hunter', skill: 'mining', level: 10, name: 'Gem Hunter', kind: 'luck', value: 0.06, desc: 'Gems are more likely from rocks.' },
  { id: 'foreman', skill: 'mining', level: 10, name: 'Foreman', kind: 'maxEnergy', value: 30, desc: 'Your day holds 30 more energy.' }
];

export function professionsFor(skill: SkillKey, level: number): ProfessionDef[] {
  return PROFESSIONS.filter((p) => p.skill === skill && p.level === level);
}

// ------------------------------------------------------------------ foraging
/** Wild plants that appear on the farm each morning and can be picked up. */
export const FORAGE: ForageDef[] = [
  { id: 'daffodil', itemId: 'daffodil', seasons: ['spring'], weight: 5 },
  { id: 'leek', itemId: 'leek', seasons: ['spring'], weight: 4 },
  { id: 'mushroom', itemId: 'mushroom', seasons: ['spring', 'fall'], weight: 4 },
  { id: 'spice_berry', itemId: 'spice_berry', seasons: ['summer'], weight: 5 },
  { id: 'grapes', itemId: 'grapes', seasons: ['summer', 'fall'], weight: 3 },
  { id: 'hazelnut', itemId: 'hazelnut', seasons: ['fall'], weight: 4 },
  { id: 'winter_root', itemId: 'winter_root', seasons: ['winter'], weight: 5 },
  { id: 'snow_yam', itemId: 'snow_yam', seasons: ['winter'], weight: 3 }
];

// ---------------------------------------------------------------------- look

/** Colours the farmer can pick at the start. The first entry of each list is the default. */
export const SKIN_TONES = ['#f0c9a0', '#e0ac82', '#c88a58', '#a86a42', '#7a4a2c', '#5a3520'];
export const HAIR_COLORS = ['#5a3a22', '#8a6a3a', '#2a2a2a', '#c8a050', '#a8502a', '#6a3a8a'];
export const SHIRT_COLORS = ['#4f86c8', '#c85a4a', '#4a9a6a', '#c8a03a', '#8a5ac8', '#3a3a4a'];
export const HAT_COLORS = ['#d9b35a', '#b84a3a', '#3a6ab8', '#4a8a4a', '#e8e0d0', '#6a3a2a'];

/** The look a brand-new farmer starts with. Hat -1 means no hat. */
export const APPEARANCE_DEFAULT = { skin: 0, hair: 0, shirt: 0, hat: 0 };

/** One morning TV forecast. `luck` is added to harvest quality and fishing for the day. */
export interface TVForecast {
  label: string;
  luck: number;
  text: string;
}

export const TV_FORECASTS: TVForecast[] = [
  { label: 'Very good spirits', luck: 0.05, text: 'The spirits are in a very good mood today. You feel lucky.' },
  { label: 'Good spirits', luck: 0.02, text: 'The spirits are in good humour today.' },
  { label: 'Neutral spirits', luck: 0, text: 'The spirits are neutral today. A steady day ahead.' },
  { label: 'Slightly low spirits', luck: -0.01, text: 'The spirits are a little low today. Take care out there.' },
  { label: 'Low spirits', luck: -0.02, text: 'The spirits are quite displeased today. Not a lucky day.' }
];

// ---------------------------------------------------------------------- mail
/** Letters that arrive in the mailbox as the farm grows. */
export const LETTERS: MailDef[] = [
  {
    id: 'letter_welcome', from: 'Village Council', subject: 'Welcome to your new farm',
    body: 'The whole village is glad you took over the old plot. Here is a little something to help you start. Press Sleep in the top bar to end the day, and remember to water your crops.',
    coins: 150, atLevel: 1
  },
  {
    id: 'letter_scarecrow', from: 'Rowan', subject: 'Crows love fresh seeds',
    body: 'A friendly warning: crows will try to eat your crops overnight. Build a Scarecrow in the Build menu and the birds keep their distance from the crops around it.',
    coins: 0, atLevel: 2
  },
  {
    id: 'letter_professions', from: 'Village Council', subject: 'Your skills are growing',
    body: 'Once a skill reaches level 5 you may pick a profession. Open Community to choose one. Professions never expire, so pick the life that suits you.',
    coins: 0, atLevel: 3, itemId: 'bread', itemQty: 1
  },
  {
    id: 'letter_bundles', from: 'Old Town Hall', subject: 'The empty bundles',
    body: 'The old community bundles have sat empty for years. Bring the village its favourite goods and it will remember how to celebrate again.',
    coins: 0, atLevel: 4
  },
  {
    id: 'letter_kitchen', from: 'Tessa', subject: 'Eat well, work well',
    body: 'A cooked dish at the Workshop fills you up or gives you a day of good luck. Try a grilled fish before a long day in the field.',
    coins: 0, atLevel: 5, itemId: 'grilled_fish', itemQty: 1
  },
  {
    id: 'letter_stars', from: 'Orin', subject: 'The pond is quiet tonight',
    body: 'Some nights the pond is so calm you can see the stars in it. If you find a lucky charm out there, keep it. Come fish with me some time.',
    coins: 200, atLevel: 7
  },
  {
    id: 'letter_welcome_back', from: 'Rowan', subject: 'Good to see you again',
    body: 'You were gone a while, so a few of us watered what we could and swept the porch. The farm is glad you are back - take these coins as a welcome-home gift.',
    coins: 0, atLevel: 99
  },
  // A short guided course for a new farmer: one system explained per day, so a
  // first week here never has to guess what to do next.
  {
    id: 'letter_guide_shop', from: 'Rowan', subject: 'Start with a few seeds',
    body: 'Your fields are already tilled, so you only need seeds. Open the Shop and buy a handful of spring seeds - turnips are cheap and quick. Then stand on a field, pick the seed in your backpack and press Plant.',
    coins: 80, atLevel: 1, atDay: 1
  },
  {
    id: 'letter_guide_water', from: 'Marisol', subject: 'Water them every morning',
    body: 'Seeds only grow on watered soil, and rain waters the whole farm for you. Fill your watering can at the pond when it runs dry. A crop is ready when it starts to shine - walk up and press Harvest.',
    coins: 0, atLevel: 1, atDay: 2
  },
  {
    id: 'letter_guide_sleep', from: 'Village Council', subject: 'Sleep, and the day ends',
    body: 'Press Sleep in the top bar when you are finished for the day. Crops grow overnight, the shipping bin sells what you left in it, and the morning report tells you what happened. Your energy refills too.',
    coins: 60, atLevel: 1, atDay: 3
  },
  {
    id: 'letter_guide_build', from: 'Tomas', subject: 'Build a coop, then buy a hen',
    body: 'Open Build and place a Coop. Once it stands, open Animals and buy a hen for it. Feed her from the trough each day, and she will leave an egg for you to collect.',
    coins: 0, atLevel: 1, atDay: 4, itemId: 'animal_feed', itemQty: 5
  },
  {
    id: 'letter_guide_mine', from: 'Orin', subject: 'There is ore under the farm',
    body: 'The quarry rocks on your land break open for stone and copper, and the Old Mine in town goes much deeper. Take a pickaxe, clear rocks to find the ladder, and watch your health down there.',
    coins: 0, atLevel: 1, atDay: 5
  },
  {
    id: 'letter_guide_map', from: 'Rowan', subject: 'The long walk back',
    body: 'Our farm is a big one, so do not walk it twice. Press M for the map and click anywhere to walk there yourself, or use the home button to head straight back to the porch.',
    coins: 0, atLevel: 1, atDay: 6
  },
  {
    id: 'letter_guide_help', from: 'Village Council', subject: 'Everything else is in the menus',
    body: 'Community holds your bundles, professions and the mail. Stats shows your skills. Almanac lists every crop. Press H for the shop, B for building and C for crafting. Ask any villager for a hint and they will help.',
    coins: 120, atLevel: 1, atDay: 7
  }
];

// ----------------------------------------------------------- community bundles
export const BUNDLE_SETS: BundleDef[] = [
  {
    id: 'spring_bundle', name: 'Spring Pantry',
    desc: 'The village pantry is bare after winter. A few spring crops would fill it again.',
    requirements: [
      { itemId: 'carrots', qty: 5 },
      { itemId: 'cabbage', qty: 3 },
      { itemId: 'strawberries', qty: 3 }
    ],
    coins: 600, xp: 60
  },
  {
    id: 'craft_bundle', name: "Builder's Bundle",
    desc: 'Rowan needs material for the new bridge. Any sturdy goods will do.',
    requirements: [
      { itemId: 'stone', qty: 20 },
      { itemId: 'copper_ore', qty: 5 },
      { itemId: 'flour', qty: 2 }
    ],
    coins: 900, xp: 90
  },
  {
    id: 'kitchen_bundle', name: 'Kitchen Bundle',
    desc: 'Long tables are being set out for the feast. The cooks are short of ingredients.',
    requirements: [
      { itemId: 'egg', qty: 5 },
      { itemId: 'milk', qty: 3 },
      { itemId: 'bread', qty: 2 },
      { itemId: 'cheese', qty: 1 }
    ],
    coins: 1200, xp: 120
  },
  {
    id: 'pond_bundle', name: 'Pond Bundle',
    desc: 'Orin is restocking the village pond and asks for a few catches.',
    requirements: [
      { itemId: 'minnow', qty: 3 },
      { itemId: 'carp', qty: 3 },
      { itemId: 'bass', qty: 2 },
      { itemId: 'trout', qty: 1 }
    ],
    coins: 1500, xp: 150
  },
  {
    id: 'artisan_bundle', name: 'Artisan Bundle',
    desc: "June wants to show the village what a good farm can make.",
    requirements: [
      { itemId: 'cloth', qty: 2 },
      { itemId: 'jam', qty: 2 },
      { itemId: 'truffle_oil', qty: 1 }
    ],
    coins: 2000, xp: 200
  },
  {
    id: 'miner_bundle', name: "Miner's Bundle",
    desc: 'The quarry families are rebuilding. Ore and gems go a long way.',
    requirements: [
      { itemId: 'iron_ore', qty: 8 },
      { itemId: 'gold_ore', qty: 3 },
      { itemId: 'gem', qty: 1 }
    ],
    coins: 2600, xp: 260, rewardItemId: 'gem', rewardQty: 1
  },
  {
    id: 'harvest_bundle', name: 'Autumn Harvest',
    desc: 'A warm autumn feast needs the best of the autumn fields.',
    requirements: [
      { itemId: 'pumpkins', qty: 2 },
      { itemId: 'corn', qty: 5 },
      { itemId: 'sunflowers', qty: 2 },
      { itemId: 'rice', qty: 3 }
    ],
    coins: 2200, xp: 220
  },
  {
    id: 'rare_bundle', name: 'Rare Finds',
    desc: 'The museum display has three empty cases. Only the finest will do.',
    requirements: [
      { itemId: 'golden_carp', qty: 1 },
      { itemId: 'koi', qty: 1 },
      { itemId: 'truffle', qty: 2 }
    ],
    coins: 4000, xp: 400, rewardItemId: 'gem', rewardQty: 2
  }
];

// ------------------------------------------------------------- expanded crops
/** Extra crops beyond the classic ten. Each one gets a seed and a harvest item. */
const EXTRA_CROP_SPECS: Array<{
  id: string;
  name: string;
  seedPrice: number;
  sell: number;
  seasons: Season[];
  days: number;
  regrow: number;
  min: number;
  max: number;
  art: PlantArchetype;
  palette: number[];
  desc: string;
}> = [
  { id: 'zucchini', name: 'Zucchini', seedPrice: 44, sell: 62, seasons: ['summer'], days: 5, regrow: 0, min: 2, max: 3, art: 'bush', palette: [0x4f8c38, 0x6fae4f, 0x4f9a44, 0x2f6a30], desc: 'A long green squash that loves the heat.' },
  { id: 'eggplant', name: 'Eggplant', seedPrice: 54, sell: 78, seasons: ['summer', 'fall'], days: 6, regrow: 2, min: 2, max: 3, art: 'bush', palette: [0x4f8c38, 0x6fae4f, 0x6a3f8a, 0x452559], desc: 'Glossy purple fruit that keeps producing.' },
  { id: 'okra', name: 'Okra', seedPrice: 34, sell: 48, seasons: ['summer'], days: 4, regrow: 2, min: 2, max: 3, art: 'tall', palette: [0x4f8c38, 0x76b34a, 0x7aa84a, 0x4f7a30], desc: 'Slim pods picked while still tender.' },
  { id: 'bellpepper', name: 'Bell Pepper', seedPrice: 58, sell: 84, seasons: ['summer'], days: 5, regrow: 2, min: 2, max: 3, art: 'bush', palette: [0x3f7d3a, 0x5b9b3a, 0xe04a2f, 0xa8321f], desc: 'Crisp, bright and sweet.' },
  { id: 'chili', name: 'Chili', seedPrice: 30, sell: 44, seasons: ['summer', 'fall'], days: 4, regrow: 2, min: 3, max: 4, art: 'bush', palette: [0x3f7d3a, 0x5b9b3a, 0xd83a2a, 0x9a2418], desc: 'Small, fiery peppers. Handle with care.' },
  { id: 'artichoke', name: 'Artichoke', seedPrice: 86, sell: 132, seasons: ['spring', 'fall'], days: 7, regrow: 0, min: 1, max: 2, art: 'head', palette: [0x4f8c38, 0x76b34a, 0x7a9a6a, 0x4f6a48], desc: 'A slow, showy thistle head.' },
  { id: 'asparagus', name: 'Asparagus', seedPrice: 96, sell: 150, seasons: ['spring'], days: 6, regrow: 3, min: 2, max: 3, art: 'tall', palette: [0x4f8c38, 0x76b34a, 0x8aa84a, 0x5a7a30], desc: 'Spears that return every few days.' },
  { id: 'kale', name: 'Kale', seedPrice: 40, sell: 58, seasons: ['spring', 'winter'], days: 4, regrow: 2, min: 2, max: 3, art: 'head', palette: [0x2f6f33, 0x4f8c38, 0x3f7a44, 0x25522a], desc: 'A hardy leafy green for cold mornings.' },
  { id: 'radish', name: 'Radish', seedPrice: 20, sell: 28, seasons: ['spring', 'fall'], days: 3, regrow: 0, min: 2, max: 4, art: 'root', palette: [0x4f8c38, 0x6fae4f, 0xd8546a, 0x9a3448], desc: 'Quick, peppery roots.' },
  { id: 'onion', name: 'Onion', seedPrice: 28, sell: 40, seasons: ['spring', 'summer'], days: 4, regrow: 0, min: 2, max: 3, art: 'root', palette: [0x6f9b3a, 0x88b447, 0xd8b878, 0xa8866a], desc: 'Sweet bulbs with papery skin.' },
  { id: 'garlic', name: 'Garlic', seedPrice: 32, sell: 46, seasons: ['fall', 'winter'], days: 5, regrow: 0, min: 2, max: 3, art: 'root', palette: [0x5b8c38, 0x76b34a, 0xe8e0d0, 0xb8ad9a], desc: 'Fat cloves that store all winter.' },
  { id: 'turnip', name: 'Turnip', seedPrice: 26, sell: 36, seasons: ['fall', 'winter'], days: 3, regrow: 0, min: 2, max: 3, art: 'root', palette: [0x4f8c38, 0x6fae4f, 0xe8dcc0, 0x9a7fa8], desc: 'A cold-weather root with a purple crown.' },
  { id: 'beetroot', name: 'Beetroot', seedPrice: 38, sell: 54, seasons: ['fall'], days: 4, regrow: 0, min: 2, max: 3, art: 'root', palette: [0x4f8c38, 0x6fae4f, 0x9a2a4a, 0x6a1530], desc: 'Deep red and earthy.' },
  { id: 'sweetpotato', name: 'Sweet Potato', seedPrice: 52, sell: 76, seasons: ['summer', 'fall'], days: 6, regrow: 0, min: 2, max: 3, art: 'root', palette: [0x4f8c38, 0x76b34a, 0xc8794a, 0x9a4f2a], desc: 'Sweet orange flesh under rough skin.' },
  { id: 'ginger', name: 'Ginger', seedPrice: 66, sell: 96, seasons: ['summer'], days: 6, regrow: 0, min: 2, max: 3, art: 'root', palette: [0x5b8c38, 0x76b34a, 0xd8b878, 0xa8866a], desc: 'A warm, knobbly spice root.' },
  { id: 'peanut', name: 'Peanut', seedPrice: 40, sell: 58, seasons: ['summer'], days: 5, regrow: 0, min: 2, max: 4, art: 'root', palette: [0x4f8c38, 0x76b34a, 0xc8a86a, 0x8a6a3a], desc: 'Pods that ripen underground.' },
  { id: 'soybean', name: 'Soybean', seedPrice: 34, sell: 48, seasons: ['summer', 'fall'], days: 5, regrow: 0, min: 3, max: 4, art: 'grain', palette: [0x6f9b3a, 0x88b447, 0xd8d8a8, 0xa8a878], desc: 'Protein-rich pods in tidy rows.' },
  { id: 'barley', name: 'Barley', seedPrice: 24, sell: 34, seasons: ['spring', 'fall'], days: 4, regrow: 0, min: 3, max: 4, art: 'grain', palette: [0x6f9b3a, 0x88b447, 0xd8c878, 0xa89a4a], desc: 'A sturdy grain for malting.' },
  { id: 'oat', name: 'Oat', seedPrice: 22, sell: 32, seasons: ['spring'], days: 4, regrow: 0, min: 3, max: 4, art: 'grain', palette: [0x6f9b3a, 0x88b447, 0xe0d8a8, 0xb0a878], desc: 'Soft golden heads that sway.' },
  { id: 'rye', name: 'Rye', seedPrice: 30, sell: 44, seasons: ['fall', 'winter'], days: 5, regrow: 0, min: 3, max: 4, art: 'grain', palette: [0x6f9b3a, 0x88b447, 0xc8b878, 0x9a8a4a], desc: 'Tough grain that shrugs off frost.' },
  { id: 'millet', name: 'Millet', seedPrice: 20, sell: 28, seasons: ['summer'], days: 3, regrow: 0, min: 3, max: 4, art: 'grain', palette: [0x6f9b3a, 0x88b447, 0xe8d878, 0xb8a848], desc: 'Tiny grains, quick harvests.' },
  { id: 'quinoa', name: 'Quinoa', seedPrice: 76, sell: 112, seasons: ['fall'], days: 7, regrow: 0, min: 2, max: 3, art: 'grain', palette: [0x8a5a3a, 0xb07848, 0xe8c8a8, 0xb89478], desc: 'A tall plant crowned in warm colour.' },
  { id: 'sugarcane', name: 'Sugarcane', seedPrice: 88, sell: 126, seasons: ['summer'], days: 7, regrow: 3, min: 2, max: 3, art: 'tall', palette: [0x4f8c38, 0x76b34a, 0xa8b84a, 0x7a8a30], desc: 'Tall sweet canes that regrow.' },
  { id: 'cotton', name: 'Cotton', seedPrice: 92, sell: 130, seasons: ['summer', 'fall'], days: 8, regrow: 0, min: 2, max: 3, art: 'bush', palette: [0x4f8c38, 0x6fae4f, 0xf0f0e8, 0xc8c8bc], desc: 'Fluffy white bolls ready for spinning.' },
  { id: 'flax', name: 'Flax', seedPrice: 46, sell: 68, seasons: ['spring', 'summer'], days: 5, regrow: 0, min: 2, max: 3, art: 'flower', palette: [0x4f8c38, 0x76b34a, 0x6a9ad8, 0x3f6a9a], desc: 'Blue flowers that become fine linen.' },
  { id: 'lavender', name: 'Lavender', seedPrice: 70, sell: 102, seasons: ['summer'], days: 6, regrow: 2, min: 1, max: 2, art: 'flower', palette: [0x5b8c38, 0x76b34a, 0x9a7ad8, 0x6a4a9a], desc: 'Fragrant purple spikes.' },
  { id: 'rose', name: 'Rose', seedPrice: 64, sell: 94, seasons: ['spring', 'summer'], days: 5, regrow: 2, min: 1, max: 2, art: 'flower', palette: [0x3f7d3a, 0x5b9b3a, 0xd83a5a, 0x9a1f38], desc: 'Velvet petals with a strong perfume.' },
  { id: 'tulip', name: 'Tulip', seedPrice: 38, sell: 54, seasons: ['spring'], days: 4, regrow: 0, min: 1, max: 2, art: 'flower', palette: [0x4f8c38, 0x76b34a, 0xe8743a, 0xb04a1f], desc: 'Bright spring cups on straight stems.' },
  { id: 'daisy', name: 'Daisy', seedPrice: 28, sell: 40, seasons: ['spring', 'summer'], days: 3, regrow: 2, min: 1, max: 2, art: 'flower', palette: [0x4f8c38, 0x76b34a, 0xf5f0e0, 0xd8c88a], desc: 'Cheerful white flowers that keep coming.' },
  { id: 'chrysanthemum', name: 'Chrysanthemum', seedPrice: 58, sell: 86, seasons: ['fall'], days: 5, regrow: 0, min: 1, max: 2, art: 'flower', palette: [0x4f8c38, 0x76b34a, 0xe8b83a, 0xb08a1f], desc: 'Autumn blooms in deep gold.' },
  { id: 'peony', name: 'Peony', seedPrice: 74, sell: 110, seasons: ['spring'], days: 6, regrow: 0, min: 1, max: 2, art: 'flower', palette: [0x3f7d3a, 0x5b9b3a, 0xf0a8c0, 0xc07a94], desc: 'Huge ruffled blooms worth the wait.' },
  { id: 'grape', name: 'Grape', seedPrice: 130, sell: 190, seasons: ['summer', 'fall'], days: 8, regrow: 3, min: 2, max: 4, art: 'vine', palette: [0x3f7d3a, 0x5b9b3a, 0x7a4a9a, 0x4f2a6a], desc: 'Heavy bunches on a climbing vine.' },
  { id: 'blueberry', name: 'Blueberry', seedPrice: 96, sell: 140, seasons: ['summer'], days: 7, regrow: 2, min: 3, max: 5, art: 'bush', palette: [0x3f7d3a, 0x5b9b3a, 0x4a6ab8, 0x2a3f7a], desc: 'Bushes loaded with little blue berries.' },
  { id: 'blackberry', name: 'Blackberry', seedPrice: 62, sell: 90, seasons: ['summer', 'fall'], days: 5, regrow: 2, min: 3, max: 4, art: 'bush', palette: [0x3f7d3a, 0x5b9b3a, 0x3a2a4a, 0x1f1528], desc: 'Dark, thorny and very sweet.' },
  { id: 'raspberry', name: 'Raspberry', seedPrice: 58, sell: 86, seasons: ['spring', 'summer'], days: 5, regrow: 2, min: 3, max: 4, art: 'bush', palette: [0x3f7d3a, 0x5b9b3a, 0xc83a5a, 0x8a1f38], desc: 'Delicate red berries, picked daily.' },
  { id: 'cranberry', name: 'Cranberry', seedPrice: 80, sell: 118, seasons: ['fall', 'winter'], days: 7, regrow: 3, min: 3, max: 4, art: 'bush', palette: [0x3f6a3a, 0x4f7d3a, 0xb82a3a, 0x7a1524], desc: 'Tart red berries for cold seasons.' },
  { id: 'gooseberry', name: 'Gooseberry', seedPrice: 54, sell: 80, seasons: ['spring', 'summer'], days: 5, regrow: 2, min: 3, max: 4, art: 'bush', palette: [0x3f7d3a, 0x5b9b3a, 0xa8d84a, 0x6a9a28], desc: 'Green berries with a sharp bite.' },
  { id: 'melon', name: 'Melon', seedPrice: 100, sell: 150, seasons: ['summer'], days: 7, regrow: 0, min: 1, max: 2, art: 'vine', palette: [0x4f8c38, 0x6fae4f, 0xd8b84a, 0xa8862a], desc: 'Golden flesh under a netted rind.' },
  { id: 'watermelon', name: 'Watermelon', seedPrice: 150, sell: 220, seasons: ['summer'], days: 9, regrow: 0, min: 1, max: 1, art: 'vine', palette: [0x4f8c38, 0x6fae4f, 0x3f8a4a, 0xd84a5a], desc: 'A giant melon worth the wait.' },
  { id: 'honeydew', name: 'Honeydew', seedPrice: 94, sell: 140, seasons: ['summer'], days: 7, regrow: 0, min: 1, max: 2, art: 'vine', palette: [0x4f8c38, 0x6fae4f, 0xe8e8b8, 0xb8b878], desc: 'Pale, honey-sweet melon.' },
  { id: 'cucumber', name: 'Cucumber', seedPrice: 40, sell: 58, seasons: ['summer'], days: 4, regrow: 2, min: 2, max: 3, art: 'vine', palette: [0x4f8c38, 0x6fae4f, 0x5a9a3a, 0x3a6a24], desc: 'Cool green fruit on a trailing vine.' },
  { id: 'squash', name: 'Squash', seedPrice: 66, sell: 96, seasons: ['fall'], days: 6, regrow: 0, min: 1, max: 2, art: 'vine', palette: [0x4f8c38, 0x6fae4f, 0xd8a03a, 0x9a6a1f], desc: 'A sturdy autumn fruit with pale flesh.' },
  { id: 'broccoli', name: 'Broccoli', seedPrice: 60, sell: 88, seasons: ['spring', 'fall'], days: 6, regrow: 0, min: 1, max: 2, art: 'head', palette: [0x3f7d3a, 0x5b9b3a, 0x4a8a3a, 0x2a5f24], desc: 'Dense green heads on thick stalks.' },
  { id: 'cauliflower', name: 'Cauliflower', seedPrice: 68, sell: 100, seasons: ['fall', 'winter'], days: 7, regrow: 0, min: 1, max: 2, art: 'head', palette: [0x4f8c38, 0x6fae4f, 0xf0ead8, 0xc8c0a8], desc: 'Creamy white heads wrapped in leaves.' },
  { id: 'brussels', name: 'Brussels Sprout', seedPrice: 78, sell: 116, seasons: ['fall', 'winter'], days: 8, regrow: 0, min: 2, max: 3, art: 'head', palette: [0x4f8c38, 0x6fae4f, 0x5a9a3a, 0x2f6a24], desc: 'Little green sprouts on a tall stalk.' },
  { id: 'leek', name: 'Leek', seedPrice: 42, sell: 62, seasons: ['spring', 'winter'], days: 5, regrow: 0, min: 2, max: 3, art: 'tall', palette: [0x4f8c38, 0x76b34a, 0xa8d878, 0xe0e8c8], desc: 'Long white stems with flat green tops.' },
  { id: 'celery', name: 'Celery', seedPrice: 36, sell: 52, seasons: ['summer', 'fall'], days: 5, regrow: 0, min: 2, max: 3, art: 'tall', palette: [0x4f8c38, 0x76b34a, 0x8ab84a, 0x5a8a2a], desc: 'Crisp ribs that grow best in cool soil.' },
  { id: 'spinach', name: 'Spinach', seedPrice: 24, sell: 34, seasons: ['spring', 'winter'], days: 3, regrow: 2, min: 2, max: 3, art: 'head', palette: [0x2f6f33, 0x4f8c38, 0x3a7a34, 0x25522a], desc: 'Tender leaves that grow back fast.' },
  { id: 'vanilla', name: 'Vanilla', seedPrice: 210, sell: 320, seasons: ['summer'], days: 10, regrow: 0, min: 1, max: 1, art: 'vine', palette: [0x3f7d3a, 0x5b9b3a, 0x6a4a2a, 0x3f2a15], desc: 'Long pods cured into the finest spice.' },
  { id: 'saffron', name: 'Saffron', seedPrice: 240, sell: 360, seasons: ['fall'], days: 9, regrow: 0, min: 1, max: 1, art: 'flower', palette: [0x5b8c38, 0x76b34a, 0xe87a3a, 0xb04a1f], desc: 'Precious red threads from purple flowers.' },

  // ------------------------------------------------- new land, richer harvests
  // Fruit trees: slow to start, then they keep fruiting again and again.
  { id: 'pear', name: 'Pear', seedPrice: 118, sell: 172, seasons: ['spring', 'fall'], days: 7, regrow: 4, min: 1, max: 2, art: 'tree', palette: [0x4f8c38, 0x76b34a, 0xd8d84a, 0xa8a82a], desc: 'A small orchard tree that fruits year after year.' },
  { id: 'peach', name: 'Peach', seedPrice: 132, sell: 192, seasons: ['summer'], days: 8, regrow: 4, min: 1, max: 2, art: 'tree', palette: [0x4f8c38, 0x76b34a, 0xf0a070, 0xc07048], desc: 'Soft, sun-warmed fruit from a summer tree.' },
  { id: 'apple', name: 'Apple', seedPrice: 126, sell: 184, seasons: ['fall'], days: 8, regrow: 4, min: 1, max: 2, art: 'tree', palette: [0x3f7d3a, 0x5b9b3a, 0xd83a3a, 0x9a2020], desc: 'Crisp red apples, the pride of any orchard.' },
  { id: 'cherry', name: 'Cherry', seedPrice: 140, sell: 204, seasons: ['spring', 'summer'], days: 8, regrow: 4, min: 1, max: 2, art: 'tree', palette: [0x3f7d3a, 0x5b9b3a, 0xc81f3a, 0x8a1028], desc: 'Sweet pairs of fruit on a slender tree.' },
  { id: 'plum', name: 'Plum', seedPrice: 112, sell: 164, seasons: ['fall'], days: 7, regrow: 4, min: 1, max: 2, art: 'tree', palette: [0x4f8c38, 0x6fae4f, 0x7a3a8a, 0x4f2058], desc: 'Deep purple fruit with a dusty bloom.' },
  { id: 'apricot', name: 'Apricot', seedPrice: 124, sell: 180, seasons: ['spring'], days: 7, regrow: 4, min: 1, max: 2, art: 'tree', palette: [0x4f8c38, 0x76b34a, 0xe88a3a, 0xb05a1f], desc: 'Golden fruit that ripens early in the year.' },
  { id: 'coconut', name: 'Coconut', seedPrice: 200, sell: 290, seasons: ['summer'], days: 10, regrow: 5, min: 1, max: 1, art: 'tree', palette: [0x2f6f33, 0x4f8c38, 0x8a6a44, 0x5a4028], desc: 'A tall palm that gives one heavy nut at a time.' },
  { id: 'fig', name: 'Fig', seedPrice: 160, sell: 232, seasons: ['summer', 'fall'], days: 8, regrow: 4, min: 1, max: 2, art: 'tree', palette: [0x3f7d3a, 0x5b9b3a, 0x8a3a5a, 0x5a2038], desc: 'Sweet fruit hidden under broad leaves.' },
  { id: 'persimmon', name: 'Persimmon', seedPrice: 148, sell: 216, seasons: ['fall'], days: 8, regrow: 4, min: 1, max: 2, art: 'tree', palette: [0x6f9b3a, 0x88b447, 0xe86a2a, 0xb0401a], desc: 'Bright orange fruit that hangs into winter.' },
  { id: 'avocado', name: 'Avocado', seedPrice: 210, sell: 300, seasons: ['summer'], days: 10, regrow: 5, min: 1, max: 1, art: 'tree', palette: [0x2f6f33, 0x4f8c38, 0x3a5a2a, 0xc8d878], desc: 'Creamy green fruit worth the long wait.' },
  { id: 'lemon', name: 'Lemon', seedPrice: 136, sell: 198, seasons: ['summer'], days: 8, regrow: 4, min: 1, max: 2, art: 'tree', palette: [0x3f7d3a, 0x5b9b3a, 0xf0d83a, 0xc0a81f], desc: 'Sharp, sunny citrus from a tidy tree.' },
  { id: 'lime', name: 'Lime', seedPrice: 108, sell: 158, seasons: ['summer'], days: 7, regrow: 3, min: 1, max: 2, art: 'tree', palette: [0x3f7d3a, 0x5b9b3a, 0x8ad83a, 0x4f8a1f], desc: 'Small green citrus with a bright bite.' },
  { id: 'cocoa', name: 'Cocoa', seedPrice: 230, sell: 330, seasons: ['summer'], days: 11, regrow: 5, min: 1, max: 1, art: 'tree', palette: [0x2f6f33, 0x4f8c38, 0x8a5a2a, 0x4f2a10], desc: 'Pods full of beans for the finest chocolate.' },
  // Tall plants.
  { id: 'banana', name: 'Banana', seedPrice: 176, sell: 256, seasons: ['summer'], days: 9, regrow: 4, min: 2, max: 3, art: 'tall', palette: [0x3f7d3a, 0x5b9b3a, 0xf0d84a, 0xb0a02a], desc: 'Bunches of fruit on a broad-leafed plant.' },
  { id: 'hops', name: 'Hops', seedPrice: 104, sell: 152, seasons: ['summer', 'fall'], days: 7, regrow: 3, min: 2, max: 3, art: 'tall', palette: [0x4f8c38, 0x76b34a, 0x8aa84a, 0x5a7a24], desc: 'Climbing cones for brewing.' },
  { id: 'scallion', name: 'Scallion', seedPrice: 22, sell: 32, seasons: ['spring', 'summer'], days: 3, regrow: 2, min: 2, max: 4, art: 'tall', palette: [0x4f8c38, 0x76b34a, 0x9ad878, 0x5a8a3a], desc: 'Quick green stems that come back again.' },
  { id: 'fennel', name: 'Fennel', seedPrice: 48, sell: 70, seasons: ['spring', 'fall'], days: 5, regrow: 0, min: 1, max: 2, art: 'tall', palette: [0x4f8c38, 0x76b34a, 0xc8d89a, 0x8a9a5a], desc: 'Feathery tops over a crunchy bulb.' },
  { id: 'cardamom', name: 'Cardamom', seedPrice: 168, sell: 242, seasons: ['summer'], days: 9, regrow: 4, min: 1, max: 2, art: 'tall', palette: [0x3f7d3a, 0x5b9b3a, 0xa8c878, 0x6a8a3a], desc: 'A rare spice plant with fragrant pods.' },
  // Bushes and leafy plants.
  { id: 'mushroom', name: 'Mushroom', seedPrice: 56, sell: 82, seasons: ['fall', 'winter'], days: 3, regrow: 2, min: 2, max: 3, art: 'bush', palette: [0x8a7a5a, 0xb0a080, 0xc86a4a, 0x8a3a24], desc: 'Grows fast in cool, damp shade.' },
  { id: 'lemongrass', name: 'Lemongrass', seedPrice: 26, sell: 38, seasons: ['summer'], days: 4, regrow: 2, min: 2, max: 3, art: 'bush', palette: [0x5b8c38, 0x88b447, 0xc8d87a, 0x8a9a4a], desc: 'Sharp green blades with a citrus scent.' },
  { id: 'rosemary', name: 'Rosemary', seedPrice: 44, sell: 64, seasons: ['spring', 'winter'], days: 5, regrow: 3, min: 2, max: 3, art: 'bush', palette: [0x2f6f33, 0x4f8c38, 0x5a9aa8, 0x2f6a78], desc: 'A woody herb that grows all year.' },
  { id: 'mint', name: 'Mint', seedPrice: 24, sell: 34, seasons: ['spring', 'summer'], days: 3, regrow: 2, min: 2, max: 4, art: 'bush', palette: [0x3f7d3a, 0x6fae4f, 0x6ad89a, 0x2f8a5a], desc: 'Cool, spreading leaves.' },
  { id: 'aloe', name: 'Aloe', seedPrice: 72, sell: 104, seasons: ['summer', 'fall'], days: 6, regrow: 3, min: 1, max: 2, art: 'bush', palette: [0x4f8c38, 0x76b34a, 0x6a9a7a, 0x3a6a4a], desc: 'Thick leaves full of soothing gel.' },
  { id: 'blackcurrant', name: 'Blackcurrant', seedPrice: 74, sell: 108, seasons: ['summer'], days: 6, regrow: 2, min: 3, max: 4, art: 'bush', palette: [0x3f7d3a, 0x5b9b3a, 0x4a2a4a, 0x2a1528], desc: 'Small dark berries on a heavy bush.' },
  // Flowers.
  { id: 'mustard', name: 'Mustard', seedPrice: 36, sell: 52, seasons: ['spring', 'fall'], days: 4, regrow: 0, min: 2, max: 3, art: 'flower', palette: [0x6f9b3a, 0x88b447, 0xf0d83a, 0xb8a81f], desc: 'A field of yellow flowers and sharp seeds.' },
  { id: 'lotus', name: 'Lotus', seedPrice: 130, sell: 188, seasons: ['summer'], days: 7, regrow: 0, min: 1, max: 1, art: 'flower', palette: [0x4f8c38, 0x6fae4f, 0xf0a8c8, 0xc07a9a], desc: 'A pale pink bloom that opens at dawn.' },
  { id: 'jasmine', name: 'Jasmine', seedPrice: 84, sell: 122, seasons: ['summer'], days: 5, regrow: 2, min: 1, max: 2, art: 'flower', palette: [0x4f8c38, 0x76b34a, 0xf8f4e8, 0xd8d0b8], desc: 'Small white flowers with a sweet scent.' },
  { id: 'clover', name: 'Clover', seedPrice: 18, sell: 26, seasons: ['spring'], days: 2, regrow: 1, min: 3, max: 5, art: 'flower', palette: [0x4f8c38, 0x76b34a, 0xe8a8d8, 0xb078a8], desc: 'Fast little flowers that keep returning.' },
  // Grains and roots.
  { id: 'chickpea', name: 'Chickpea', seedPrice: 42, sell: 60, seasons: ['spring', 'fall'], days: 5, regrow: 0, min: 3, max: 4, art: 'grain', palette: [0x6f9b3a, 0x88b447, 0xd8c89a, 0xa89a6a], desc: 'Sturdy pods full of round seeds.' },
  { id: 'tapioca', name: 'Cassava', seedPrice: 70, sell: 100, seasons: ['summer'], days: 7, regrow: 0, min: 1, max: 2, art: 'root', palette: [0x4f8c38, 0x76b34a, 0xb89a7a, 0x8a6a4a], desc: 'Big starchy roots dug at season end.' },
  { id: 'taro', name: 'Taro', seedPrice: 62, sell: 90, seasons: ['summer', 'fall'], days: 6, regrow: 0, min: 1, max: 2, art: 'root', palette: [0x3f7d3a, 0x5b9b3a, 0x9a8a9a, 0x6a5a6a], desc: 'Broad leaves over a nutty root.' },
  { id: 'parsnip', name: 'Parsnip', seedPrice: 34, sell: 48, seasons: ['fall', 'winter'], days: 4, regrow: 0, min: 2, max: 3, art: 'root', palette: [0x4f8c38, 0x6fae4f, 0xe8dcc0, 0xb0a080], desc: 'Sweet roots that taste best after frost.' },
  { id: 'jicama', name: 'Jicama', seedPrice: 58, sell: 84, seasons: ['summer'], days: 6, regrow: 0, min: 1, max: 2, art: 'root', palette: [0x4f8c38, 0x76b34a, 0xcdb894, 0x9a8260], desc: 'A crisp, watery root from warm soil.' },
  { id: 'turmeric', name: 'Turmeric', seedPrice: 110, sell: 160, seasons: ['summer', 'fall'], days: 8, regrow: 0, min: 1, max: 2, art: 'root', palette: [0x4f8c38, 0x76b34a, 0xe8a02a, 0xb06a10], desc: 'Bold golden roots used for dye and spice.' }
];

function seasonLabel(seasons: Season[]): string {
  return seasons.map((season) => SEASON_INFO[season].name).join(' or ');
}

for (const spec of EXTRA_CROP_SPECS) {
  const seedId = `${spec.id}_seed`;
  ITEMS[seedId] = {
    id: seedId,
    name: `${spec.name} Seeds`,
    type: 'seed',
    price: spec.seedPrice,
    sell: Math.max(1, Math.round(spec.seedPrice / 3)),
    stack: 99,
    desc: `${seasonLabel(spec.seasons)} crop. Ready in ${spec.days} days.${spec.regrow > 0 ? ' Regrows after harvest.' : ''}`,
    cropId: spec.id,
    color: spec.palette[2]
  };
  ITEMS[spec.id] = {
    id: spec.id,
    name: spec.name,
    type: 'crop',
    price: spec.sell,
    sell: spec.sell,
    stack: 99,
    desc: spec.desc,
    cropId: spec.id,
    color: spec.palette[2],
    color2: spec.palette[3]
  };
  CROPS[spec.id] = {
    id: spec.id,
    name: spec.name,
    seedId,
    harvestId: spec.id,
    seasons: spec.seasons,
    growthDays: spec.days,
    regrowDays: spec.regrow,
    yieldMin: spec.min,
    yieldMax: spec.max,
    art: spec.art,
    palette: spec.palette,
    desc: spec.desc
  };
}

export const ANIMALS: Record<string, AnimalDef> = {
  chicken: { id: 'chicken', name: 'Chicken', housing: 'coop', price: 180, productId: 'egg', maturityDays: 3, desc: 'Lays an egg almost every day.', colors: [0xf5f0e2, 0xd8cfb8, 0xd84c3f] },
  duck: { id: 'duck', name: 'Duck', housing: 'coop', price: 260, productId: 'duck_egg', maturityDays: 3, desc: 'Produces rich duck eggs.', colors: [0xf0f0e0, 0xd8d8b8, 0xe8a23a] },
  cow: { id: 'cow', name: 'Cow', housing: 'barn', price: 700, productId: 'milk', maturityDays: 4, desc: 'Needs a barn. Produces milk.', colors: [0xf2efe6, 0x3a3a3a, 0xe8a8a8] },
  sheep: { id: 'sheep', name: 'Sheep', housing: 'barn', price: 520, productId: 'wool', maturityDays: 4, desc: 'Fluffy wool producer.', colors: [0xf5f2e8, 0xd8d0bc, 0x5a4a42] },
  pig: { id: 'pig', name: 'Pig', housing: 'barn', price: 900, productId: 'truffle', maturityDays: 5, desc: 'Sniffs out valuable truffles.', colors: [0xf0b8b8, 0xd89898, 0xc07070] }
};

// ----------------------------------------------------------- expanded animals
/** Extra farm animals beyond the classic five, each with its own product. */
const EXTRA_ANIMAL_SPECS: Array<{
  id: string;
  name: string;
  housing: HousingId;
  price: number;
  productId: string;
  productName: string;
  productSell: number;
  maturityDays: number;
  art: PlantArchetype;
  colors: number[];
  desc: string;
}> = [
  { id: 'goat', name: 'Goat', housing: 'barn', price: 620, productId: 'goat_milk', productName: 'Goat Milk', productSell: 76, maturityDays: 4, art: 'bush', colors: [0xe8e2d0, 0xc8c0aa, 0x8a8070], desc: 'Curious climbers that give rich milk.' },
  { id: 'rabbit', name: 'Rabbit', housing: 'hutch', price: 420, productId: 'rabbit_wool', productName: 'Rabbit Wool', productSell: 58, maturityDays: 3, art: 'bush', colors: [0xf0e8dc, 0xd8ccbc, 0xe8b8c0], desc: 'Soft fur that regrows quickly.' },
  { id: 'turkey', name: 'Turkey', housing: 'coop', price: 380, productId: 'turkey_egg', productName: 'Turkey Egg', productSell: 52, maturityDays: 4, art: 'bush', colors: [0xb8784a, 0x8a5a34, 0xd84040], desc: 'A proud bird with speckled eggs.' },
  { id: 'quail', name: 'Quail', housing: 'aviary', price: 300, productId: 'quail_egg', productName: 'Quail Egg', productSell: 42, maturityDays: 3, art: 'bush', colors: [0xc8b89a, 0x9a8a6a, 0x6a5a44], desc: 'Tiny eggs, laid almost daily.' },
  { id: 'goose', name: 'Goose', housing: 'coop', price: 460, productId: 'goose_egg', productName: 'Goose Egg', productSell: 60, maturityDays: 4, art: 'bush', colors: [0xf5f2e8, 0xd8d4c4, 0xe8a23a], desc: 'Big eggs and a loud honk.' },
  { id: 'horse', name: 'Horse', housing: 'stable', price: 1600, productId: 'horse_hair', productName: 'Horse Hair', productSell: 95, maturityDays: 6, art: 'tall', colors: [0x8a5a34, 0x6b4426, 0x3a2a1a], desc: 'Strong, gentle and a fine companion.' },
  { id: 'bee', name: 'Bee Swarm', housing: 'apiary', price: 540, productId: 'honey', productName: 'Honey', productSell: 96, maturityDays: 2, art: 'bush', colors: [0xf0c84a, 0x2a2a2a, 0xd8a02a], desc: 'Busy workers that fill the hive.' },
  { id: 'silkworm', name: 'Silkworm', housing: 'hutch', price: 480, productId: 'silk', productName: 'Silk', productSell: 120, maturityDays: 3, art: 'bush', colors: [0xf0ead8, 0xd0c8b0, 0xfff8e0], desc: 'Spins fine silk thread each day.' },
  { id: 'bull', name: 'Bull', housing: 'pasture', price: 1900, productId: 'bull_butter', productName: 'Rich Butter', productSell: 130, maturityDays: 6, art: 'tall', colors: [0x5a4a3a, 0x3a2a1a, 0xd8d0c0], desc: 'A heavy beast for rich butter.' },
  { id: 'donkey', name: 'Donkey', housing: 'stable', price: 1100, productId: 'donkey_wool', productName: 'Coarse Wool', productSell: 84, maturityDays: 5, art: 'tall', colors: [0x9a8a7a, 0x7a6a5a, 0xd8d0c0], desc: 'Stubborn, sturdy and very loyal.' },
  { id: 'alpaca', name: 'Alpaca', housing: 'pasture', price: 940, productId: 'alpaca_fiber', productName: 'Alpaca Fiber', productSell: 116, maturityDays: 5, art: 'bush', colors: [0xe8dcc8, 0xc8b89a, 0x8a7a6a], desc: 'Extra-soft fibre for fine cloth.' },
  { id: 'llama', name: 'Llama', housing: 'pasture', price: 1020, productId: 'llama_wool', productName: 'Llama Wool', productSell: 108, maturityDays: 5, art: 'tall', colors: [0xd8c8b0, 0xb8a890, 0x7a6a5a], desc: 'Tall woolly guards for the flock.' },
  { id: 'ostrich', name: 'Ostrich', housing: 'pasture', price: 2100, productId: 'ostrich_egg', productName: 'Ostrich Egg', productSell: 260, maturityDays: 7, art: 'tall', colors: [0x6a5a4a, 0x4a3a2a, 0xe8d8b8], desc: 'The biggest eggs on the farm.' },
  { id: 'emu', name: 'Emu', housing: 'pasture', price: 1500, productId: 'emu_egg', productName: 'Emu Egg', productSell: 175, maturityDays: 6, art: 'tall', colors: [0x5a4a3a, 0x3a2a1a, 0x8a9a7a], desc: 'Dark green eggs with a thick shell.' },
  { id: 'peacock', name: 'Peacock', housing: 'aviary', price: 1300, productId: 'peacock_feather', productName: 'Peacock Feather', productSell: 190, maturityDays: 6, art: 'bush', colors: [0x2f6a9a, 0x1f4a7a, 0x4aa870], desc: 'Trails eyes of blue and green.' },
  { id: 'swan', name: 'Swan', housing: 'pond', price: 1200, productId: 'swan_down', productName: 'Swan Down', productSell: 200, maturityDays: 6, art: 'bush', colors: [0xf8f6f0, 0xe0dcd0, 0xe8a23a], desc: 'Graceful and calm on the water.' },
  { id: 'frog', name: 'Bullfrog', housing: 'pond', price: 260, productId: 'frog_spawn', productName: 'Frog Spawn', productSell: 44, maturityDays: 2, art: 'bush', colors: [0x6a9a4a, 0x4a7a2a, 0xe8e8a8], desc: 'Sits by the reeds and croaks at dusk.' },
  { id: 'turtle', name: 'Turtle', housing: 'pond', price: 780, productId: 'turtle_shell', productName: 'Shell Fragment', productSell: 150, maturityDays: 8, art: 'bush', colors: [0x4a7a4a, 0x2f5a30, 0xc8b878], desc: 'Slow, old and unexpectedly valuable.' },
  { id: 'crab', name: 'Mud Crab', housing: 'pond', price: 340, productId: 'crab_shell', productName: 'Crab Shell', productSell: 66, maturityDays: 3, art: 'bush', colors: [0xc86a4a, 0x9a4a30, 0xe8b8a8], desc: 'Sidles sideways along the bank.' },
  { id: 'shrimp', name: 'Freshwater Shrimp', housing: 'pond', price: 210, productId: 'shrimp_roe', productName: 'Shrimp Roe', productSell: 38, maturityDays: 2, art: 'bush', colors: [0xe89a8a, 0xc87a6a, 0xf8d8c8], desc: 'Tiny, quick and endlessly busy.' },
  { id: 'catfish_pet', name: 'Pond Catfish', housing: 'pond', price: 560, productId: 'catfish_roe', productName: 'Catfish Roe', productSell: 128, maturityDays: 5, art: 'tall', colors: [0x6a5a4a, 0x4a3a2a, 0x2a1a0a], desc: 'A whiskered tenant of the deep water.' },
  { id: 'carp_pet', name: 'Koi Carp', housing: 'pond', price: 890, productId: 'koi_scale', productName: 'Koi Scale', productSell: 144, maturityDays: 5, art: 'bush', colors: [0xf0e8d8, 0xe06a3a, 0xd84a3a], desc: 'Bright scales that catch the light.' },
  { id: 'otter', name: 'Otter', housing: 'pond', price: 1700, productId: 'otter_pearl', productName: 'River Pearl', productSell: 280, maturityDays: 7, art: 'tall', colors: [0x8a6a4a, 0x6a4a2a, 0xf0e8d0], desc: 'Dives for pearls on warm afternoons.' },
  { id: 'beaver', name: 'Beaver', housing: 'pond', price: 1250, productId: 'beaver_pelt', productName: 'Beaver Pelt', productSell: 172, maturityDays: 6, art: 'tall', colors: [0x8a6a44, 0x6a4a28, 0x3a2a1a], desc: 'Always building something in the mud.' },
  { id: 'mink', name: 'Mink', housing: 'pond', price: 980, productId: 'mink_fur', productName: 'Mink Fur', productSell: 156, maturityDays: 5, art: 'bush', colors: [0x4a3a2a, 0x2a1a0a, 0x6a5a4a], desc: 'Dark, sleek and quick as a shadow.' },
  { id: 'fox', name: 'Fox', housing: 'kennel', price: 1600, productId: 'fox_fur', productName: 'Fox Fur', productSell: 210, maturityDays: 7, art: 'tall', colors: [0xe07a3a, 0xc05a1f, 0xf0e8d8], desc: 'Clever and quick. Watch the coop.' },
  { id: 'dog', name: 'Sheepdog', housing: 'kennel', price: 1400, productId: 'dog_hair', productName: 'Dog Hair', productSell: 180, maturityDays: 6, art: 'bush', colors: [0xd8c8a8, 0xb0a080, 0x4a3a2a], desc: 'Herds the flock and keeps watch.' },
  { id: 'woof_hound', name: 'Hound', housing: 'kennel', price: 1150, productId: 'hound_pelt', productName: 'Hound Pelt', productSell: 168, maturityDays: 5, art: 'tall', colors: [0x8a7a6a, 0x6a5a4a, 0xd8d0c0], desc: 'A deep bark and a soft coat.' },
  { id: 'ferret', name: 'Ferret', housing: 'kennel', price: 720, productId: 'ferret_down', productName: 'Ferret Down', productSell: 112, maturityDays: 4, art: 'bush', colors: [0xc8b89a, 0xa89878, 0x3a2a1a], desc: 'Curious burrower with fine down.' },
  { id: 'yak', name: 'Yak', housing: 'pasture', price: 2400, productId: 'yak_milk', productName: 'Yak Milk', productSell: 240, maturityDays: 8, art: 'tall', colors: [0x3a2a1a, 0x2a1a0a, 0xe8e0d0], desc: 'Shaggy and stoic in any weather.' },
  { id: 'buffalo', name: 'Buffalo', housing: 'pasture', price: 2900, productId: 'buffalo_milk', productName: 'Buffalo Milk', productSell: 290, maturityDays: 8, art: 'tall', colors: [0x4a3a3a, 0x2a1a1a, 0x6a5a5a], desc: 'Rich milk for the best cheese.' },
  { id: 'reindeer', name: 'Reindeer', housing: 'pasture', price: 2650, productId: 'reindeer_antler', productName: 'Antler Velvet', productSell: 320, maturityDays: 8, art: 'tall', colors: [0x8a7a5a, 0x6a5a3a, 0xe8e0c8], desc: 'Grows a new set of antlers yearly.' },
  { id: 'camel', name: 'Camel', housing: 'pasture', price: 3400, productId: 'camel_milk', productName: 'Camel Milk', productSell: 340, maturityDays: 9, art: 'tall', colors: [0xd8b878, 0xb89858, 0x8a6a3a], desc: 'Thrives where nothing else can.' },
  { id: 'deer', name: 'Deer', housing: 'pasture', price: 1850, productId: 'deer_antler', productName: 'Deer Antler', productSell: 268, maturityDays: 7, art: 'tall', colors: [0xa87a4a, 0x8a5a2a, 0xf0e8d8], desc: 'Shy, quick and gently elegant.' },
  { id: 'moose', name: 'Moose', housing: 'pasture', price: 3900, productId: 'moose_antler', productName: 'Moose Antler', productSell: 420, maturityDays: 9, art: 'tall', colors: [0x4a3a2a, 0x2a1a0a, 0x8a7a5a], desc: 'Huge, flat antlers and a slow gait.' },
  { id: 'zebra', name: 'Zebra', housing: 'pasture', price: 4200, productId: 'zebra_hair', productName: 'Zebra Hair', productSell: 460, maturityDays: 9, art: 'tall', colors: [0xf0f0e8, 0x2a2a2a, 0xd8d8d0], desc: 'Stripes that dazzle in the sun.' },
  { id: 'pony', name: 'Pony', housing: 'stable', price: 1300, productId: 'pony_hair', productName: 'Pony Hair', productSell: 136, maturityDays: 5, art: 'tall', colors: [0xc8a878, 0xa8885a, 0xf0e0c0], desc: 'Small, sturdy and full of spirit.' },
  { id: 'mule', name: 'Mule', housing: 'stable', price: 1550, productId: 'mule_hair', productName: 'Mule Hair', productSell: 158, maturityDays: 6, art: 'tall', colors: [0x9a8a7a, 0x7a6a5a, 0x3a2a1a], desc: 'Patient and strong under a heavy load.' },
  { id: 'pheasant', name: 'Pheasant', housing: 'aviary', price: 640, productId: 'pheasant_egg', productName: 'Pheasant Egg', productSell: 88, maturityDays: 4, art: 'bush', colors: [0xb8784a, 0x8a5a2a, 0xe8d8b8], desc: 'A shy bird with a bright copper coat.' },
  { id: 'partridge', name: 'Partridge', housing: 'aviary', price: 420, productId: 'partridge_egg', productName: 'Partridge Egg', productSell: 72, maturityDays: 3, art: 'bush', colors: [0xa89878, 0x887858, 0xd8c8a8], desc: 'Small speckled eggs in spring.' },
  { id: 'pigeon', name: 'Pigeon', housing: 'aviary', price: 360, productId: 'pigeon_feather', productName: 'Pigeon Feather', productSell: 64, maturityDays: 3, art: 'bush', colors: [0x9a9aa8, 0x7a7a88, 0xc8c8d8], desc: 'Wheels across the sky each morning.' },
  { id: 'owl', name: 'Owl', housing: 'aviary', price: 1450, productId: 'owl_feather', productName: 'Owl Feather', productSell: 226, maturityDays: 7, art: 'bush', colors: [0xc8b89a, 0x9a8a6a, 0xf0e8d0], desc: 'Silent at night and always watching.' },
  { id: 'buffle_goat', name: 'Pygora Goat', housing: 'barn', price: 780, productId: 'goat_fiber', productName: 'Goat Fiber', productSell: 94, maturityDays: 4, art: 'bush', colors: [0xf0e8dc, 0xd8c8b8, 0x8a7a6a], desc: 'Rare soft fibre from a small goat.' },
  { id: 'yak_calf', name: 'Yak Calf', housing: 'barn', price: 640, productId: 'calf_milk', productName: 'Calf Milk', productSell: 86, maturityDays: 3, art: 'bush', colors: [0x6a5a4a, 0x4a3a2a, 0xe8e0d0], desc: 'Gentle, warm and always hungry.' },
  { id: 'sheepdog_pup', name: 'Puppy', housing: 'kennel', price: 560, productId: 'puppy_hair', productName: 'Puppy Hair', productSell: 74, maturityDays: 3, art: 'bush', colors: [0xd8c8a8, 0xb0a080, 0x4a3a2a], desc: 'A bundle of energy in the yard.' },
  { id: 'hedgehog', name: 'Hedgehog', housing: 'kennel', price: 480, productId: 'hedgehog_spine', productName: 'Hedgehog Spine', productSell: 78, maturityDays: 4, art: 'bush', colors: [0x8a6a4a, 0x6a4a2a, 0xd8c8a8], desc: 'Rolls up when the wind picks up.' },
  { id: 'boar', name: 'Boar', housing: 'pasture', price: 1750, productId: 'boar_tusk', productName: 'Boar Tusk', productSell: 244, maturityDays: 7, art: 'tall', colors: [0x4a3a2a, 0x2a1a0a, 0xf0e8d8], desc: 'Tough, proud and fond of mud.' },
  { id: 'yak_ox', name: 'Ox', housing: 'pasture', price: 2600, productId: 'ox_horn', productName: 'Ox Horn', productSell: 288, maturityDays: 8, art: 'tall', colors: [0x3a2a1a, 0x2a1a0a, 0xd8c8a8], desc: 'Steady, patient workhorse of the farm.' },
  { id: 'wildebeest', name: 'Wildebeest', housing: 'pasture', price: 3300, productId: 'beest_horn', productName: 'Beest Horn', productSell: 356, maturityDays: 9, art: 'tall', colors: [0x5a4a3a, 0x3a2a1a, 0x2a1a0a], desc: 'Born to run across open country.' },
  { id: 'moth', name: 'Silk Moth', housing: 'hutch', price: 580, productId: 'moth_thread', productName: 'Moth Thread', productSell: 98, maturityDays: 3, art: 'bush', colors: [0xe8dcc8, 0xc8b8a0, 0xf8f0dc], desc: 'Spins a glimmering thread by night.' },

  // --------------------------------------- new faces for the wide-open land
  // Pond crew.
  { id: 'eel', name: 'Eel', housing: 'pond', price: 700, productId: 'eel_oil', productName: 'Eel Oil', productSell: 118, maturityDays: 4, art: 'tall', colors: [0x3a4a3a, 0x2a3a2a, 0xc8d8a8], desc: 'Slippery, patient and rich in oil.' },
  { id: 'whitefish', name: 'Whitefish', housing: 'pond', price: 430, productId: 'whitefish_roe', productName: 'Whitefish Roe', productSell: 72, maturityDays: 3, art: 'bush', colors: [0xd8dcd0, 0xb0b4a8, 0xe8e8d8], desc: 'A pale, quick little pond fish.' },
  { id: 'tadpole', name: 'Tadpole Pool', housing: 'pond', price: 165, productId: 'tadpole_roe', productName: 'Tadpole Roe', productSell: 44, maturityDays: 2, art: 'bush', colors: [0x5a8a3a, 0x3a6a24, 0xc8e8a8], desc: 'A busy pool of tiny swimmers.' },
  { id: 'kiwi_bird', name: 'Kiwi Bird', housing: 'aviary', price: 980, productId: 'kiwi_egg', productName: 'Kiwi Egg', productSell: 176, maturityDays: 6, art: 'bush', colors: [0x6a4a2a, 0x4a2a12, 0xc8a878], desc: 'Round, shy and full of surprises.' },
  // Prairie grazers.
  { id: 'bison', name: 'Bison', housing: 'pasture', price: 3100, productId: 'bison_wool', productName: 'Bison Wool', productSell: 292, maturityDays: 8, art: 'tall', colors: [0x4a3a2a, 0x2a1a0a, 0xd8c8a8], desc: 'A shaggy giant that keeps the cold out.' },
  { id: 'gazelle', name: 'Gazelle', housing: 'pasture', price: 1600, productId: 'gazelle_horn', productName: 'Gazelle Horn', productSell: 216, maturityDays: 6, art: 'tall', colors: [0xc8a878, 0xa88858, 0x3a2a1a], desc: 'Light on its feet, always ready to run.' },
  { id: 'antelope', name: 'Antelope', housing: 'pasture', price: 1950, productId: 'antelope_horn', productName: 'Antelope Horn', productSell: 254, maturityDays: 7, art: 'tall', colors: [0xb08050, 0x8a5a2a, 0xf0e8d8], desc: 'Long sweeping horns and a steady gaze.' },
  { id: 'bighorn_sheep', name: 'Bighorn Sheep', housing: 'pasture', price: 2250, productId: 'bighorn_wool', productName: 'Bighorn Wool', productSell: 248, maturityDays: 7, art: 'tall', colors: [0xa89478, 0x8a7658, 0x6a5a44], desc: 'Curled horns and a thick warm coat.' },
  { id: 'cow_highland', name: 'Highland Cow', housing: 'pasture', price: 2500, productId: 'highland_milk', productName: 'Highland Milk', productSell: 262, maturityDays: 7, art: 'tall', colors: [0xb06a3a, 0x8a4a1a, 0xf0e0c8], desc: 'Long fringe, gentle eyes, rich milk.' },
  { id: 'ram', name: 'Ram', housing: 'pasture', price: 1800, productId: 'ram_wool', productName: 'Ram Wool', productSell: 224, maturityDays: 7, art: 'tall', colors: [0xf0ece0, 0xc8c4b8, 0x6a5a4a], desc: 'Heavy curled horns and thick fleece.' },
  { id: 'wombat', name: 'Wombat', housing: 'pasture', price: 1500, productId: 'wombat_fur', productName: 'Wombat Fur', productSell: 196, maturityDays: 6, art: 'bush', colors: [0x8a7a5a, 0x6a5a3a, 0x3a2a1a], desc: 'Short legs, big heart, excellent digging.' },
  { id: 'emu_chick', name: 'Emu Chick', housing: 'pasture', price: 720, productId: 'chick_down', productName: 'Chick Down', productSell: 112, maturityDays: 4, art: 'bush', colors: [0x9a8a6a, 0x7a6a4a, 0xe8dcc0], desc: 'Striped and wobbly, but growing fast.' },
  // Additions for the smaller homes.
  { id: 'pheasant_gold', name: 'Golden Pheasant', housing: 'aviary', price: 1550, productId: 'golden_feather', productName: 'Golden Feather', productSell: 236, maturityDays: 6, art: 'bush', colors: [0xe8b83a, 0xd8902a, 0xd83a2a], desc: 'A flash of gold across the aviary.' },
  { id: 'parrot', name: 'Parrot', housing: 'aviary', price: 1750, productId: 'parrot_feather', productName: 'Parrot Feather', productSell: 254, maturityDays: 7, art: 'bush', colors: [0x3aa86a, 0x2a8a4a, 0xe8d83a], desc: 'Loud, clever and endlessly colourful.' },
  { id: 'chinchilla', name: 'Chinchilla', housing: 'hutch', price: 880, productId: 'chinchilla_fur', productName: 'Chinchilla Fur', productSell: 142, maturityDays: 5, art: 'bush', colors: [0xa8a8b0, 0x888890, 0xe8e8f0], desc: 'Cloud-soft fur and a nervous hop.' },
  { id: 'honeybee', name: 'Wild Honeybee', housing: 'apiary', price: 430, productId: 'wild_honey', productName: 'Wild Honey', productSell: 88, maturityDays: 2, art: 'bush', colors: [0xf0d84a, 0x3a2a1a, 0xe8b83a], desc: 'Stronger honey from a wilder hive.' },
  { id: 'turkey_royal', name: 'Royal Turkey', housing: 'coop', price: 620, productId: 'royal_egg', productName: 'Royal Egg', productSell: 96, maturityDays: 4, art: 'bush', colors: [0xd8d0c0, 0xb0a898, 0xc83a3a], desc: 'Struts about like it owns the coop.' },
  { id: 'calf_orphan', name: 'Orphan Calf', housing: 'barn', price: 640, productId: 'orphan_milk', productName: 'Orphan Milk', productSell: 86, maturityDays: 3, art: 'bush', colors: [0xe8e0d0, 0xc8c0b0, 0x6a5a4a], desc: 'A warm little calf that needs a barn.' },
  { id: 'greyhound', name: 'Greyhound', housing: 'kennel', price: 1580, productId: 'greyhound_hair', productName: 'Greyhound Hair', productSell: 214, maturityDays: 6, art: 'tall', colors: [0x9a9aa0, 0x7a7a80, 0x3a3a40], desc: 'Built like an arrow and twice as fast.' },
  { id: 'corgi', name: 'Corgi', housing: 'kennel', price: 980, productId: 'corgi_fur', productName: 'Corgi Fur', productSell: 154, maturityDays: 5, art: 'bush', colors: [0xe8b84a, 0xc8982a, 0xf8f4e8], desc: 'Short legs, big bark, endless cheer.' }
];

for (const spec of EXTRA_ANIMAL_SPECS) {
  ITEMS[spec.productId] = {
    id: spec.productId,
    name: spec.productName,
    type: 'product',
    price: spec.productSell,
    sell: spec.productSell,
    stack: 99,
    desc: `Produced by your ${spec.name.toLowerCase()}.`,
    color: spec.colors[0],
    color2: spec.colors[1]
  };
  ANIMALS[spec.id] = {
    id: spec.id,
    name: spec.name,
    housing: spec.housing,
    price: spec.price,
    productId: spec.productId,
    maturityDays: spec.maturityDays,
    desc: spec.desc,
    colors: spec.colors,
    art: spec.art
  };
}

export const BUILDINGS: Record<string, BuildingDef> = {
  farmhouse: { id: 'farmhouse', name: 'Farmhouse', w: 4, h: 3, cost: 0, unlockLevel: 1, kind: 'farmhouse', desc: 'Your home. Upgrade it for extra storage.' },
  coop: { id: 'coop', name: 'Chicken Coop', w: 3, h: 2, cost: 320, unlockLevel: 1, kind: 'housing', houses: 'coop', capacity: 4, desc: 'Houses up to 4 chickens or ducks.' },
  barn: { id: 'barn', name: 'Barn', w: 4, h: 3, cost: 900, unlockLevel: 3, kind: 'housing', houses: 'barn', capacity: 4, desc: 'Houses up to 4 cows, sheep or pigs.' },
  shed: { id: 'shed', name: 'Storage Shed', w: 3, h: 2, cost: 650, unlockLevel: 2, kind: 'storage', storage: 24, desc: 'Adds 24 inventory slots.' },
  workshop: { id: 'workshop', name: 'Workshop', w: 3, h: 2, cost: 950, unlockLevel: 4, kind: 'craft', desc: 'Unlocks crafting recipes.' },
  greenhouse: { id: 'greenhouse', name: 'Greenhouse', w: 3, h: 2, cost: 1400, unlockLevel: 5, kind: 'greenhouse', desc: 'Allows planting any crop in any season.' },
  well: { id: 'well', name: 'Water Well', w: 2, h: 2, cost: 280, unlockLevel: 2, kind: 'well', radius: 3, desc: 'Waters nearby crops every morning.' },
  sprinkler: { id: 'sprinkler', name: 'Sprinkler', w: 1, h: 1, cost: 450, unlockLevel: 6, kind: 'sprinkler', radius: 1, desc: 'Automatically waters a 3x3 area.' },
  helper_hut: { id: 'helper_hut', name: "Helper's Cottage", w: 2, h: 2, cost: 2500, unlockLevel: 6, kind: 'automation', desc: 'Unlocks farm helpers: auto-feed, auto-collect, auto-harvest and auto-replant.' },
  fence: { id: 'fence', name: 'Fence', w: 1, h: 1, cost: 18, unlockLevel: 1, kind: 'decor', desc: 'A cosy wooden fence.' },
  path: { id: 'path', name: 'Stone Path', w: 1, h: 1, cost: 8, unlockLevel: 1, kind: 'decor', desc: 'Walk 25% faster on paths.' },
  shipping_bin: { id: 'shipping_bin', name: 'Shipping Bin', w: 1, h: 1, cost: 250, unlockLevel: 1, kind: 'shipping', colors: [0xb8996a, 0x8a6a44, 0x5a8a4a], desc: 'Leave goods overnight and the trader sells them by morning.' }
};

// --------------------------------------------------------- expanded buildings
/** Extra homes and storage. New animal homes are added automatically. */
const EXTRA_BUILDING_SPECS: Array<{
  id: string;
  name: string;
  w: number;
  h: number;
  cost: number;
  unlockLevel: number;
  kind: BuildingDef['kind'];
  houses?: HousingId;
  capacity?: number;
  storage?: number;
  radius?: number;
  colors: number[];
  desc: string;
}> = [
  { id: 'pond', name: 'Duck Pond', w: 3, h: 2, cost: 760, unlockLevel: 3, kind: 'housing', houses: 'pond', capacity: 4, colors: [0x4a8ab8, 0x3a6a98, 0x8ed8f0], desc: 'A pond for swans, frogs and other water animals.' },
  { id: 'stable', name: 'Stable', w: 3, h: 3, cost: 1500, unlockLevel: 4, kind: 'housing', houses: 'stable', capacity: 3, colors: [0x8a5a34, 0x6b4426, 0xd8b878], desc: 'A timber stable for horses and donkeys.' },
  { id: 'apiary', name: 'Apiary', w: 2, h: 2, cost: 520, unlockLevel: 2, kind: 'housing', houses: 'apiary', capacity: 4, colors: [0xe8b83a, 0xb8901f, 0xf0e0a8], desc: 'Beehives stacked for honey.' },
  { id: 'hutch', name: 'Rabbit Hutch', w: 2, h: 2, cost: 460, unlockLevel: 2, kind: 'housing', houses: 'hutch', capacity: 4, colors: [0xb8996a, 0x8a6a44, 0xe8d8b8], desc: 'A cosy hutch for rabbits and silk worms.' },
  { id: 'kennel', name: 'Kennel', w: 2, h: 2, cost: 680, unlockLevel: 3, kind: 'housing', houses: 'kennel', capacity: 3, colors: [0xa87a4a, 0x7a5a34, 0x6a3a2a], desc: 'A snug kennel for dogs and other hunters.' },
  { id: 'aviary', name: 'Aviary', w: 3, h: 2, cost: 980, unlockLevel: 4, kind: 'housing', houses: 'aviary', capacity: 4, colors: [0x8aa8b8, 0x6a8898, 0xd8e8f0], desc: 'A tall mesh home for exotic birds.' },
  { id: 'pasture', name: 'Open Pasture', w: 4, h: 3, cost: 1400, unlockLevel: 5, kind: 'housing', houses: 'pasture', capacity: 4, colors: [0x6fae4f, 0x4f8c38, 0xb8d888], desc: 'Fenced grazing land for big animals.' },
  { id: 'granary', name: 'Granary', w: 2, h: 2, cost: 900, unlockLevel: 3, kind: 'storage', storage: 12, colors: [0xd8b878, 0xa8865a, 0xb85a4a], desc: 'An extra 12 backpack slots.' },
  { id: 'cellar', name: 'Root Cellar', w: 2, h: 2, cost: 1300, unlockLevel: 4, kind: 'storage', storage: 18, colors: [0x8a8a8a, 0x6a6a6a, 0xa8a8a8], desc: 'A cool cellar worth 18 backpack slots.' },
  { id: 'warehouse', name: 'Warehouse', w: 4, h: 3, cost: 2600, unlockLevel: 6, kind: 'storage', storage: 36, colors: [0xa8b0b8, 0x808890, 0x5a8a4a], desc: 'A big building with 36 extra slots.' },
  { id: 'coop_big', name: 'Deluxe Coop', w: 3, h: 2, cost: 1250, unlockLevel: 4, kind: 'housing', houses: 'coop', capacity: 6, colors: [0xd8b98a, 0xb8996a, 0xb85a4a], desc: 'Room for six chickens or ducks.' },
  { id: 'barn_big', name: 'Deluxe Barn', w: 4, h: 3, cost: 2400, unlockLevel: 5, kind: 'housing', houses: 'barn', capacity: 6, colors: [0xb0483c, 0x8a3428, 0xf0e2c8], desc: 'Room for six barn animals.' },
  { id: 'bakery', name: 'Bakery', w: 3, h: 2, cost: 1850, unlockLevel: 4, kind: 'craft', colors: [0xe8d0a8, 0xc8b088, 0xc87a4a], desc: 'A warm bakery for flour and bread.' },
  { id: 'kitchen', name: 'Farm Kitchen', w: 3, h: 2, cost: 1650, unlockLevel: 4, kind: 'craft', colors: [0xf0e8d8, 0xd0c8b8, 0xd87a5a], desc: 'A kitchen for pies, stews and feasts.' },
  { id: 'dairy', name: 'Dairy', w: 3, h: 2, cost: 2100, unlockLevel: 5, kind: 'craft', colors: [0xe8f0f8, 0xc8d8e8, 0x8aa8c8], desc: 'Turns milk into cheese and butter.' },
  { id: 'pond_big', name: 'Great Pond', w: 4, h: 3, cost: 1600, unlockLevel: 5, kind: 'housing', houses: 'pond', capacity: 6, colors: [0x3a7aa8, 0x2a5a88, 0x8ed8f0], desc: 'A large pond for six water animals.' },
  { id: 'stable_big', name: 'Great Stable', w: 4, h: 3, cost: 2900, unlockLevel: 6, kind: 'housing', houses: 'stable', capacity: 5, colors: [0x7a4a2a, 0x5a3418, 0xe8c878], desc: 'A big stable for five fine horses.' },
  { id: 'apiary_big', name: 'Meadow Apiary', w: 3, h: 2, cost: 1100, unlockLevel: 4, kind: 'housing', houses: 'apiary', capacity: 6, colors: [0xf0c84a, 0xd0a82a, 0xf8ecb8], desc: 'Six beehives humming in a row.' },
  { id: 'hutch_big', name: 'Meadow Hutch', w: 3, h: 2, cost: 980, unlockLevel: 4, kind: 'housing', houses: 'hutch', capacity: 6, colors: [0xc8a878, 0xa88858, 0xf0e0c0], desc: 'A wide hutch for six small animals.' },
  { id: 'kennel_big', name: 'Great Kennel', w: 3, h: 2, cost: 1500, unlockLevel: 5, kind: 'housing', houses: 'kennel', capacity: 5, colors: [0x9a6a3a, 0x7a4a1a, 0x5a2a1a], desc: 'A roomy kennel for five good dogs.' },
  { id: 'aviary_big', name: 'Great Aviary', w: 4, h: 2, cost: 1900, unlockLevel: 5, kind: 'housing', houses: 'aviary', capacity: 6, colors: [0x7a98a8, 0x5a7888, 0xe8f4f8], desc: 'A long flight cage for six birds.' },
  { id: 'pasture_big', name: 'Great Pasture', w: 5, h: 4, cost: 2800, unlockLevel: 6, kind: 'housing', houses: 'pasture', capacity: 6, colors: [0x6fae4f, 0x4f8c38, 0xa8d878], desc: 'Wide grazing land for six big animals.' },
  { id: 'mill', name: 'Windmill', w: 3, h: 4, cost: 3200, unlockLevel: 6, kind: 'craft', colors: [0xe8e0d0, 0xc8c0a8, 0x8a9aa8], desc: 'Grinds grain right on the farm.' },
  { id: 'pottery', name: 'Pottery Kiln', w: 2, h: 2, cost: 1250, unlockLevel: 4, kind: 'craft', colors: [0xb87a4a, 0x985a2a, 0xe8b878], desc: 'Fires clay pots and jars.' },
  { id: 'loom', name: 'Weaving Loom', w: 2, h: 2, cost: 1450, unlockLevel: 5, kind: 'craft', colors: [0xc8b898, 0xa89878, 0x8a6a44], desc: 'Turns fibre into cloth.' },
  { id: 'smelter', name: 'Smelter', w: 2, h: 2, cost: 1750, unlockLevel: 5, kind: 'craft', colors: [0x9a9a9a, 0x7a7a7a, 0xe88a3a], desc: 'Smelts ore into bars.' },
  { id: 'deck', name: 'Wooden Deck', w: 2, h: 2, cost: 260, unlockLevel: 1, kind: 'decor', colors: [0xb8996a, 0x8a6a44, 0xd8b878], desc: 'A neat deck for the yard.' },
  { id: 'lamp_post', name: 'Lamp Post', w: 1, h: 1, cost: 140, unlockLevel: 1, kind: 'decor', colors: [0x4a4a4a, 0x2a2a2a, 0xffe08a], desc: 'A warm light for late nights.' },
  { id: 'flower_bed', name: 'Flower Bed', w: 2, h: 1, cost: 160, unlockLevel: 1, kind: 'decor', colors: [0xb8996a, 0x8a6a44, 0xe87a9a], desc: 'Colour for the front of the house.' },
  { id: 'bench', name: 'Garden Bench', w: 2, h: 1, cost: 120, unlockLevel: 1, kind: 'decor', colors: [0xa87a4a, 0x7a5a34, 0xd8c8a8], desc: 'Somewhere to sit and watch the field.' },
  { id: 'scarecrow', name: 'Scarecrow', w: 1, h: 2, cost: 180, unlockLevel: 1, kind: 'decor', colors: [0xd8b878, 0x8a6a44, 0xb85a4a], desc: 'Guards the crops in style.' },
  { id: 'well_stone', name: 'Stone Well', w: 2, h: 2, cost: 620, unlockLevel: 3, kind: 'well', radius: 4, colors: [0xa8a8a8, 0x888888, 0x5a5a5a], desc: 'Waters a wide area every morning.' },
  { id: 'sprinkler_big', name: 'Big Sprinkler', w: 1, h: 1, cost: 950, unlockLevel: 6, kind: 'sprinkler', radius: 2, colors: [0xb0b8c0, 0x8a949c, 0x8ed8f0], desc: 'Waters a wide patch on its own.' },
  { id: 'pump_station', name: 'Pump Station', w: 2, h: 2, cost: 1550, unlockLevel: 6, kind: 'sprinkler', radius: 3, colors: [0x8a9aa8, 0x6a7a88, 0x5aa8d8], desc: 'A pump that keeps a large area wet.' },
  { id: 'bee_greenhouse', name: 'Pollinator Greenhouse', w: 3, h: 2, cost: 2200, unlockLevel: 6, kind: 'greenhouse', colors: [0xcfe8d8, 0x9ab8a8, 0xf0c84a], desc: 'Grow any crop in any season, with bees.' },
  { id: 'seed_library', name: 'Seed Library', w: 2, h: 2, cost: 3100, unlockLevel: 6, kind: 'greenhouse', colors: [0xd8c8a8, 0xb0a080, 0x6a8a4a], desc: 'A library for growing out-of-season crops.' },
  { id: 'great_greenhouse', name: 'Great Greenhouse', w: 4, h: 3, cost: 3900, unlockLevel: 7, kind: 'greenhouse', colors: [0xd8f0e0, 0x9ab8a8, 0xa8e8b8], desc: 'A huge glasshouse for every season.' },
  { id: 'cottage', name: 'Caretaker Cottage', w: 3, h: 2, cost: 2700, unlockLevel: 6, kind: 'automation', colors: [0xd8c09a, 0xb89a72, 0x4f7a6a], desc: 'Unlocks the overnight helpers, like the Helper\'s Cottage.' },
  { id: 'workshop_big', name: 'Great Workshop', w: 4, h: 3, cost: 3200, unlockLevel: 7, kind: 'craft', colors: [0x9aa4ac, 0x7a848c, 0xe8c86a], desc: 'A big workshop for ambitious makers.' },
  { id: 'shed_big', name: 'Great Shed', w: 4, h: 3, cost: 3400, unlockLevel: 7, kind: 'storage', storage: 48, colors: [0xb8996a, 0x8a6a44, 0x7a5a3a], desc: 'A huge shed worth 48 extra slots.' },
  { id: 'tanning_rack', name: 'Tanning Rack', w: 2, h: 1, cost: 780, unlockLevel: 4, kind: 'craft', colors: [0x8a6a44, 0x6a4a28, 0xd8c8a8], desc: 'Cures hides and pelts.' },
  { id: 'aquarium', name: 'Fish Hatchery', w: 3, h: 2, cost: 2050, unlockLevel: 6, kind: 'housing', houses: 'pond', capacity: 3, colors: [0x5a9aa8, 0x3a7a88, 0xb8e8f0], desc: 'A small tank for three water animals.' },
  { id: 'orchard', name: 'Orchard Plot', w: 4, h: 3, cost: 2300, unlockLevel: 5, kind: 'housing', houses: 'pasture', capacity: 3, colors: [0x5a9a3a, 0x3f7a2a, 0xd8b84a], desc: 'Shaded ground for three large animals.' },
  { id: 'ranch', name: 'Big Ranch', w: 5, h: 4, cost: 4200, unlockLevel: 7, kind: 'housing', houses: 'pasture', capacity: 8, colors: [0x7aa84a, 0x5a8a34, 0xc8d878], desc: 'Wide open land for eight big animals.' },
  { id: 'pond_farm', name: 'Farm Pond', w: 4, h: 3, cost: 2400, unlockLevel: 6, kind: 'housing', houses: 'pond', capacity: 8, colors: [0x3a8ab8, 0x2a6a98, 0x9ae0f4], desc: 'A deep pond that holds eight water animals.' },
  { id: 'gazebo', name: 'Gazebo', w: 3, h: 2, cost: 1450, unlockLevel: 3, kind: 'decor', colors: [0xf0e8d8, 0xc8c0a8, 0x6a8a5a], desc: 'A pretty shelter for the garden.' },
  { id: 'statue', name: 'Farm Statue', w: 1, h: 2, cost: 980, unlockLevel: 3, kind: 'decor', colors: [0xb8b8b0, 0x8a8a82, 0xd8d8d0], desc: 'A stone reminder of your hard work.' },
  { id: 'fountain', name: 'Fountain', w: 2, h: 2, cost: 1650, unlockLevel: 4, kind: 'decor', colors: [0xa8b0b8, 0x88909a, 0x8ed8f0], desc: 'Moving water and a soft sound.' },
  { id: 'hot_spring', name: 'Hot Spring', w: 2, h: 2, cost: 2400, unlockLevel: 6, kind: 'decor', colors: [0x8a9a9a, 0x6a7a7a, 0xe8f0f0], desc: 'Steam rising from warm stone.' },
  { id: 'watchtower', name: 'Watchtower', w: 2, h: 3, cost: 1900, unlockLevel: 5, kind: 'decor', colors: [0x9a7a5a, 0x7a5a3a, 0xb85a4a], desc: 'See the whole valley from the top.' },
  { id: 'fence_stone', name: 'Stone Wall', w: 1, h: 1, cost: 30, unlockLevel: 1, kind: 'decor', colors: [0xa8a8a8, 0x888888, 0xc8c8c8], desc: 'A low dry-stone wall for the field.' },
  { id: 'bridge', name: 'Pond Bridge', w: 2, h: 1, cost: 340, unlockLevel: 2, kind: 'decor', colors: [0xb8996a, 0x8a6a44, 0x6a4a28], desc: 'A small arched bridge.' }
];

// One home for every new kind of animal still missing a building.
for (const animal of Object.values(ANIMALS)) {
  if (animal.art && !Object.values(BUILDINGS).some((b) => b.houses === animal.housing)) {
    const home: BuildingDef = {
      id: `home_${animal.housing}`,
      name: `${animal.housing.charAt(0).toUpperCase()}${animal.housing.slice(1)} Home`,
      w: 3,
      h: 2,
      cost: 700,
      unlockLevel: 3,
      kind: 'housing',
      houses: animal.housing,
      capacity: 4,
      colors: [0xc8a878, 0x9a7a52, 0xe8d8b8],
      desc: `A basic home for ${animal.housing} animals.`
    };
    BUILDINGS[home.id] = home;
  }
}

for (const spec of EXTRA_BUILDING_SPECS) {
  BUILDINGS[spec.id] = {
    id: spec.id,
    name: spec.name,
    w: spec.w,
    h: spec.h,
    cost: spec.cost,
    unlockLevel: spec.unlockLevel,
    kind: spec.kind,
    houses: spec.houses,
    capacity: spec.capacity,
    radius: spec.radius,
    slots: spec.storage,
    colors: spec.colors,
    desc: spec.desc
  };
}

// ------------------------------------------------------------- expanded tools
/** Tools that sharpen your farming. Only the best owned tool for each job counts. */
export const TOOLS: ToolDef[] = [
  { id: 'bronze_hoe', name: 'Bronze Hoe', effect: 'till', bonus: 1, price: 620, unlockLevel: 2, desc: 'Tills a wider patch than the old hoe.', colors: [0xc8843a, 0x8a5a20] },
  { id: 'steel_hoe', name: 'Steel Hoe', effect: 'till', bonus: 2, price: 1800, unlockLevel: 4, desc: 'A broad steel blade that turns more soil.', colors: [0xb8c0c8, 0x7a828a] },
  { id: 'golden_hoe', name: 'Golden Hoe', effect: 'till', bonus: 3, price: 4200, unlockLevel: 7, desc: 'Tills a whole patch of the field at once.', colors: [0xf0c84a, 0xb8902a] },
  { id: 'copper_can', name: 'Copper Can', effect: 'water', bonus: 1, price: 540, unlockLevel: 2, desc: 'Waters more tiles with each pour.', colors: [0xd8844a, 0x9a5a2a] },
  { id: 'iron_can', name: 'Iron Can', effect: 'water', bonus: 2, price: 1650, unlockLevel: 4, desc: 'A heavy can that covers a wide patch.', colors: [0xa8b0b8, 0x707880] },
  { id: 'golden_can', name: 'Golden Can', effect: 'water', bonus: 3, price: 3900, unlockLevel: 7, desc: 'Soaks a whole field in one walk.', colors: [0xf0c84a, 0xb8902a] },
  { id: 'leather_boots', name: 'Leather Boots', effect: 'speed', bonus: 0.15, price: 420, unlockLevel: 1, desc: 'Walk 15% faster around the farm.', colors: [0x9a6a3a, 0x6a4420] },
  { id: 'rubber_boots', name: 'Rubber Boots', effect: 'speed', bonus: 0.3, price: 1100, unlockLevel: 3, desc: 'Walk 30% faster, even in the rain.', colors: [0x3a5a4a, 0x25402f] },
  { id: 'trail_boots', name: 'Trail Boots', effect: 'speed', bonus: 0.45, price: 2600, unlockLevel: 5, desc: 'Walk 45% faster over rough ground.', colors: [0x4a6a8a, 0x2f4a6a] },
  { id: 'winged_boots', name: 'Winged Boots', effect: 'speed', bonus: 0.65, price: 5200, unlockLevel: 8, desc: 'Walk 65% faster. Almost flying.', colors: [0xf0e8d8, 0xc8b890] },
  { id: 'linen_bag', name: 'Linen Bag', effect: 'bag', bonus: 6, price: 380, unlockLevel: 1, desc: 'Six extra backpack slots.', colors: [0xd8c8a8, 0xa89878] },
  { id: 'leather_satchel', name: 'Leather Satchel', effect: 'bag', bonus: 12, price: 1250, unlockLevel: 3, desc: 'Twelve extra backpack slots.', colors: [0x8a5a34, 0x5a3a1a] },
  { id: 'merchant_pack', name: 'Merchant Pack', effect: 'bag', bonus: 24, price: 3800, unlockLevel: 6, desc: 'Twenty-four extra backpack slots.', colors: [0x6a4a2a, 0x4a2a10] },
  { id: 'lucky_charm', name: 'Lucky Charm', effect: 'luck', bonus: 0.03, price: 900, unlockLevel: 3, desc: 'A small charm for better harvests.', colors: [0xe8b83a, 0x9a6a1f] },
  { id: 'lucky_clover', name: 'Lucky Clover', effect: 'luck', bonus: 0.05, price: 1900, unlockLevel: 5, desc: 'Good luck rides on your belt.', colors: [0x5ba83a, 0x2f6a20] },
  { id: 'four_leaf', name: 'Four-Leaf Charm', effect: 'luck', bonus: 0.08, price: 3600, unlockLevel: 7, desc: 'Rare luck for rare harvests.', colors: [0x8ad84a, 0x4a9a2a] },
  { id: 'lucky_rabbit', name: "Rabbit's Foot Charm", effect: 'luck', bonus: 0.12, price: 6200, unlockLevel: 9, desc: 'The luckiest charm on the farm.', colors: [0xf0e8d8, 0xc8b8a8] },
  { id: 'bamboo_rod', name: 'Bamboo Rod', effect: 'rod', bonus: 0.04, price: 700, unlockLevel: 2, desc: 'A light rod that lands better catches.', colors: [0xa8b83a, 0x6f8a20] },
  { id: 'carbon_rod', name: 'Carbon Rod', effect: 'rod', bonus: 0.08, price: 2100, unlockLevel: 4, desc: 'A fast rod for keen anglers.', colors: [0x3a3a3a, 0x1a1a1a] },
  { id: 'master_rod', name: 'Master Rod', effect: 'rod', bonus: 0.14, price: 4800, unlockLevel: 7, desc: 'The rod of a true angler.', colors: [0x4a6a8a, 0x2a4a6a] },
  { id: 'sower_pouch', name: 'Sower Pouch', effect: 'plant', bonus: 1, price: 700, unlockLevel: 2, desc: 'Sows a wider patch from one handful of seeds.', colors: [0xc8b48a, 0x8a7a4a] },
  { id: 'seeder_gloves', name: 'Seeder Gloves', effect: 'plant', bonus: 2, price: 2200, unlockLevel: 4, desc: 'Plant three tiles wide with each scoop.', colors: [0x9a8a5a, 0x6a5a30] },
  { id: 'broadcaster', name: 'Master Broadcaster', effect: 'plant', bonus: 3, price: 5200, unlockLevel: 7, desc: 'Scatters seed across a whole patch.', colors: [0xe0c15a, 0x9a7a2a] },
  { id: 'copper_pick', name: 'Copper Pickaxe', effect: 'mine', bonus: 1, price: 820, unlockLevel: 3, desc: 'Breaks rocks in fewer swings.', colors: [0xd8844a, 0x9a5a2a] },
  { id: 'steel_pick', name: 'Steel Pickaxe', effect: 'mine', bonus: 2, price: 2400, unlockLevel: 5, desc: 'Cracks stone and ore quickly.', colors: [0xb8c0c8, 0x7a828a] },
  { id: 'golden_pick', name: 'Golden Pickaxe', effect: 'mine', bonus: 3, price: 5600, unlockLevel: 8, desc: 'Shatters rock in a single hit.', colors: [0xf0c84a, 0xb8902a] },
  { id: 'diamond_pick', name: 'Diamond Pickaxe', effect: 'mine', bonus: 4, price: 8400, unlockLevel: 10, desc: 'The final word in quarry work.', colors: [0x9ad8f0, 0x5a8ac8] },
  { id: 'bee_suit', name: 'Beekeeper Suit', effect: 'luck', bonus: 0.02, price: 450, unlockLevel: 2, desc: 'Keeps the bees calm. Tiny luck bonus.', colors: [0xf0e8d0, 0xc8c0a8] },
  { id: 'gardening_apron', name: 'Gardening Apron', effect: 'rod', bonus: 0.02, price: 400, unlockLevel: 1, desc: 'A tidy apron. Slightly better catches.', colors: [0x8a9a6a, 0x5a6a44] },
  { id: 'straw_hat', name: 'Straw Hat', effect: 'speed', bonus: 0.08, price: 260, unlockLevel: 1, desc: 'Keep the sun off. Move a little quicker.', colors: [0xe8cc78, 0xb89a4a] },
  { id: 'wheat_staff', name: 'Wheat Staff', effect: 'till', bonus: 1, price: 1000, unlockLevel: 3, desc: 'A staff that reads the soil.', colors: [0xe0c15a, 0x9a7a2a] },
  { id: 'watering_tank', name: 'Water Tank', effect: 'water', bonus: 1, price: 1400, unlockLevel: 4, desc: 'Carries more water at once.', colors: [0x6ab0d8, 0x3a7a98] },
  { id: 'trail_map', name: 'Trail Map', effect: 'speed', bonus: 0.2, price: 950, unlockLevel: 3, desc: 'Knows every short cut on the farm.', colors: [0xe8dcc0, 0xb8ac90] },
  { id: 'seed_pouch', name: 'Seed Pouch', effect: 'bag', bonus: 4, price: 320, unlockLevel: 1, desc: 'Four extra slots for seeds and goods.', colors: [0xb89a6a, 0x8a6a3a] },
  { id: 'harvest_charm', name: 'Harvest Charm', effect: 'luck', bonus: 0.04, price: 1600, unlockLevel: 4, desc: 'A charm for richer harvests.', colors: [0xe8a23a, 0xb87a1f] },
  { id: 'fisher_charm', name: "Fisher's Charm", effect: 'rod', bonus: 0.06, price: 1500, unlockLevel: 4, desc: 'Fish find the hook a little easier.', colors: [0x8ac8d8, 0x4a8898] },
  { id: 'miner_charm', name: "Miner's Charm", effect: 'mine', bonus: 1, price: 1750, unlockLevel: 4, desc: 'A charm for steady hands.', colors: [0xb8b0a8, 0x8a8278] },
  { id: 'rain_coat', name: 'Rain Coat', effect: 'speed', bonus: 0.12, price: 780, unlockLevel: 2, desc: 'Light on the feet in wet weather.', colors: [0xd8b83a, 0x9a7a1f] },
  { id: 'field_gloves', name: 'Field Gloves', effect: 'till', bonus: 1, price: 860, unlockLevel: 3, desc: 'Hard-wearing gloves for the hoe.', colors: [0xc8a878, 0x9a7a4a] },
  { id: 'canvas_tote', name: 'Canvas Tote', effect: 'bag', bonus: 8, price: 640, unlockLevel: 2, desc: 'Eight extra backpack slots.', colors: [0xd8ccb0, 0xa89c80] },
  { id: 'sturdy_basket', name: 'Sturdy Basket', effect: 'bag', bonus: 10, price: 980, unlockLevel: 3, desc: 'Ten extra backpack slots.', colors: [0xc0a060, 0x907030] },
  { id: 'lucky_coin', name: 'Lucky Coin', effect: 'luck', bonus: 0.06, price: 2400, unlockLevel: 5, desc: 'A coin that always lands heads up.', colors: [0xf0d84a, 0xb89a2a] },
  { id: 'grinding_stone', name: 'Grinding Stone', effect: 'till', bonus: 1, price: 1250, unlockLevel: 4, desc: 'Keeps tools sharp through the day.', colors: [0x9a9a9a, 0x6a6a6a] },
  { id: 'deep_bucket', name: 'Deep Bucket', effect: 'water', bonus: 1, price: 1100, unlockLevel: 3, desc: 'Holds more water for long fields.', colors: [0x7a8a9a, 0x4a5a6a] },
  { id: 'swift_ribbon', name: 'Swift Ribbon', effect: 'speed', bonus: 0.25, price: 2100, unlockLevel: 5, desc: 'A ribbon that makes the walk easier.', colors: [0xd84a6a, 0x9a1f38] },
  { id: 'reed_hook', name: 'Reed Hook', effect: 'rod', bonus: 0.05, price: 1150, unlockLevel: 3, desc: 'Reaches into the reeds for shy fish.', colors: [0xa8b83a, 0x6f8a20] },
  { id: 'granite_hammer', name: 'Granite Hammer', effect: 'mine', bonus: 2, price: 3100, unlockLevel: 6, desc: 'Heavy, but it does not bounce.', colors: [0x8a8a8a, 0x5a5a5a] },
  { id: 'farmers_pack', name: "Farmer's Pack", effect: 'bag', bonus: 16, price: 2200, unlockLevel: 5, desc: 'Sixteen extra backpack slots.', colors: [0x8a6a44, 0x5a3a1a] },
  { id: 'golden_charm', name: 'Golden Charm', effect: 'luck', bonus: 0.1, price: 4400, unlockLevel: 8, desc: 'Pure gold luck for the harvest.', colors: [0xf0c84a, 0xc89a1f] },
  { id: 'spade_pro', name: 'Pro Spade', effect: 'till', bonus: 2, price: 2600, unlockLevel: 6, desc: 'A spade that cuts a wide furrow.', colors: [0xb8c0c8, 0x707880] },
  { id: 'canister_pro', name: 'Pro Canister', effect: 'water', bonus: 2, price: 2900, unlockLevel: 6, desc: 'Waters a large block of soil.', colors: [0x5a9ab8, 0x2f6a88] },
  { id: 'sprint_wraps', name: 'Sprint Wraps', effect: 'speed', bonus: 0.55, price: 3900, unlockLevel: 7, desc: 'Walk more than half again as fast.', colors: [0xd8d8d0, 0xa8a8a0] },
  { id: 'anglers_pack', name: "Angler's Pack", effect: 'bag', bonus: 20, price: 2900, unlockLevel: 6, desc: 'Twenty extra slots for long trips.', colors: [0x4a6a8a, 0x2a4a6a] }
];

export const RECIPES: RecipeDef[] = [
  { id: 'flour', name: 'Flour', inputs: [{ itemId: 'wheat', qty: 2 }], output: { itemId: 'flour', qty: 1 }, coins: 0, unlockLevel: 1, desc: 'Mill wheat into flour.' },
  { id: 'bread', name: 'Bread', inputs: [{ itemId: 'flour', qty: 2 }], output: { itemId: 'bread', qty: 1 }, coins: 10, unlockLevel: 2, desc: 'Bake a warm loaf.' },
  { id: 'cheese', name: 'Cheese', inputs: [{ itemId: 'milk', qty: 2 }], output: { itemId: 'cheese', qty: 1 }, coins: 0, unlockLevel: 2, desc: 'Age milk into cheese.' },
  { id: 'jam', name: 'Berry Jam', inputs: [{ itemId: 'strawberries', qty: 3 }], output: { itemId: 'jam', qty: 1 }, coins: 5, unlockLevel: 2, desc: 'Preserve fresh berries.' },
  { id: 'cloth', name: 'Wool Cloth', inputs: [{ itemId: 'wool', qty: 2 }], output: { itemId: 'cloth', qty: 1 }, coins: 0, unlockLevel: 3, desc: 'Weave wool into cloth.' },
  { id: 'omelette', name: 'Omelette', inputs: [{ itemId: 'egg', qty: 2 }], output: { itemId: 'omelette', qty: 1 }, coins: 0, unlockLevel: 1, desc: 'Cook breakfast.' },
  { id: 'pumpkin_pie', name: 'Pumpkin Pie', inputs: [{ itemId: 'pumpkins', qty: 1 }, { itemId: 'flour', qty: 1 }, { itemId: 'egg', qty: 1 }], output: { itemId: 'pumpkin_pie', qty: 1 }, coins: 25, unlockLevel: 4, desc: 'A festival treat.' },
  { id: 'truffle_oil', name: 'Truffle Oil', inputs: [{ itemId: 'truffle', qty: 1 }, { itemId: 'sunflowers', qty: 1 }], output: { itemId: 'truffle_oil', qty: 1 }, coins: 30, unlockLevel: 5, desc: 'Bottle luxury.' },
  { id: 'grilled_fish', name: 'Grilled Fish', inputs: [{ itemId: 'bass', qty: 2 }], output: { itemId: 'grilled_fish', qty: 1 }, coins: 15, unlockLevel: 3, desc: 'Grill a fresh catch over the fire.' },
  { id: 'fish_stew', name: 'Fish Stew', inputs: [{ itemId: 'trout', qty: 1 }, { itemId: 'carrots', qty: 2 }, { itemId: 'potatoes', qty: 1 }], output: { itemId: 'fish_stew', qty: 1 }, coins: 25, unlockLevel: 5, desc: 'A hearty stew for cold evenings.' },
  { id: 'salmon_dinner', name: 'Salmon Dinner', inputs: [{ itemId: 'salmon', qty: 1 }, { itemId: 'rice', qty: 2 }, { itemId: 'carrots', qty: 1 }], output: { itemId: 'salmon_dinner', qty: 1 }, coins: 30, unlockLevel: 6, desc: 'A celebratory plate built around a fresh salmon.' }
];

export const UPGRADES: UpgradeDef[] = [
  { id: 'hoe', name: 'Reinforced Hoe', desc: 'Tills a wider area each level.', baseCost: 180, maxLevel: 2, unlockLevel: 1 },
  { id: 'can', name: 'Bigger Watering Can', desc: 'Waters a wider area each level.', baseCost: 180, maxLevel: 2, unlockLevel: 1 },
  { id: 'boots', name: 'Farm Boots', desc: 'Move faster around the farm.', baseCost: 220, maxLevel: 3, unlockLevel: 2 },
  { id: 'backpack', name: 'Bigger Backpack', desc: 'Adds 6 inventory slots per level.', baseCost: 260, maxLevel: 4, unlockLevel: 2 }
];

export const MAIN_QUESTS: QuestDef[] = [
  { id: 'q_plant', title: 'First Seeds', desc: 'Plant 5 crops on your land.', metric: 'planted', target: 5, coins: 100, xp: 20, tier: 'main' },
  { id: 'q_carrots', title: 'Carrot Harvest', desc: 'Harvest 10 carrots.', metric: 'carrotsHarvested', target: 10, coins: 150, xp: 30, tier: 'main' },
  { id: 'q_sell', title: 'Market Day', desc: 'Sell 20 goods at the market.', metric: 'cropsSold', target: 20, coins: 250, xp: 40, tier: 'main' },
  { id: 'q_eggs', title: 'Egg Basket', desc: 'Collect 5 eggs from your animals.', metric: 'eggsCollected', target: 5, coins: 200, xp: 40, tier: 'main' },
  { id: 'q_build', title: 'Homesteader', desc: 'Construct your first building.', metric: 'buildingsOwned', target: 1, coins: 150, xp: 30, tier: 'main' },
  { id: 'q_coins', title: 'Coin Purse', desc: 'Earn 1,000 coins in total.', metric: 'coinsEarned', target: 1000, coins: 300, xp: 50, tier: 'main' },
  { id: 'q_farm5', title: 'Green Thumb', desc: 'Reach farming level 5.', metric: 'farmingLevel', target: 5, coins: 500, xp: 0, tier: 'main' },
  { id: 'q_animals', title: 'Animal Friend', desc: 'Own 3 animals at once.', metric: 'animalsOwned', target: 3, coins: 400, xp: 60, tier: 'main' },
  { id: 'q_craft', title: 'Master Crafter', desc: 'Craft 5 goods at the workshop.', metric: 'crafts', target: 5, coins: 350, xp: 60, tier: 'main' },
  { id: 'q_build5', title: 'Growing Estate', desc: 'Construct 5 buildings.', metric: 'buildingsOwned', target: 5, coins: 800, xp: 100, tier: 'main' },
  { id: 'q_gold', title: 'Golden Harvest', desc: 'Harvest 10 gold-quality crops.', metric: 'goldHarvests', target: 10, coins: 600, xp: 80, tier: 'main' },
  { id: 'q_empire', title: 'Farming Empire', desc: 'Reach farmer level 10.', metric: 'level', target: 10, coins: 2000, xp: 0, tier: 'main' }
];

export const ACHIEVEMENTS: QuestDef[] = [
  { id: 'a_first', title: 'First Harvest', desc: 'Harvest your first crop.', metric: 'harvests', target: 1, coins: 50, xp: 10, tier: 'achievement' },
  { id: 'a_100', title: 'Century Harvest', desc: 'Harvest 100 crops.', metric: 'harvests', target: 100, coins: 500, xp: 80, tier: 'achievement' },
  { id: 'a_rich', title: 'Wealthy Farmer', desc: 'Earn 10,000 coins total.', metric: 'coinsEarned', target: 10000, coins: 1000, xp: 100, tier: 'achievement' },
  { id: 'a_seller', title: 'Market Legend', desc: 'Sell 100 goods.', metric: 'cropsSold', target: 100, coins: 700, xp: 90, tier: 'achievement' },
  { id: 'a_builder', title: 'Master Builder', desc: 'Construct 5 buildings.', metric: 'buildingsOwned', target: 5, coins: 600, xp: 70, tier: 'achievement' },
  { id: 'a_animals', title: 'Full House', desc: 'Own 5 animals at once.', metric: 'animalsOwned', target: 5, coins: 600, xp: 70, tier: 'achievement' },
  { id: 'a_gold', title: 'Gold Standard', desc: 'Harvest 20 gold-quality crops.', metric: 'goldHarvests', target: 20, coins: 900, xp: 100, tier: 'achievement' },
  { id: 'a_crafts', title: 'Artisan', desc: 'Craft 20 goods.', metric: 'crafts', target: 20, coins: 800, xp: 100, tier: 'achievement' },
  { id: 'a_level10', title: 'Seasoned Farmer', desc: 'Reach farmer level 10.', metric: 'level', target: 10, coins: 1500, xp: 0, tier: 'achievement' },
  { id: 'a_summit', title: 'To the Very Bottom', desc: 'Reach the deepest floor of the old mine.', metric: 'deepestFloor', target: MINE_MAX_FLOOR, coins: 2000, xp: 150, tier: 'achievement' }
];

export const DAILY_TEMPLATES: Array<Omit<QuestDef, 'tier'>> = [
  { id: 'd_harvest', title: 'Fresh Picks', desc: 'Harvest 5 crops today.', metric: 'harvests', target: 5, coins: 120, xp: 15 },
  { id: 'd_water', title: 'Well Watered', desc: 'Water 8 tiles today.', metric: 'waters', target: 8, coins: 90, xp: 10 },
  { id: 'd_sell', title: 'Market Run', desc: 'Sell 3 goods today.', metric: 'cropsSold', target: 3, coins: 100, xp: 12 },
  { id: 'd_plant', title: 'Sow the Seeds', desc: 'Plant 4 crops today.', metric: 'planted', target: 4, coins: 100, xp: 12 },
  { id: 'd_earn', title: 'Pocket Money', desc: 'Earn 200 coins today.', metric: 'coinsEarned', target: 200, coins: 120, xp: 15 },
  { id: 'd_collect', title: 'Morning Chores', desc: 'Collect 2 animal products today.', metric: 'productsCollected', target: 2, coins: 130, xp: 15 }
];

export const FESTIVALS: Record<Season, FestivalDef> = {
  spring: {
    season: 'spring',
    name: 'Blossom Fair',
    desc: 'Celebrate new growth with planting, harvesting, and market stalls.',
    bonusCoins: 500,
    bonusXp: 80,
    contracts: [
      { id: 's_spring_plant', title: 'First Planting', desc: 'Plant 12 crops this season.', metric: 'planted', target: 12, coins: 180, xp: 30 },
      { id: 's_spring_harvest', title: 'Fresh Picks', desc: 'Harvest 10 crops this season.', metric: 'harvests', target: 10, coins: 220, xp: 35 },
      { id: 's_spring_earn', title: 'Market Bloom', desc: 'Earn 600 coins this season.', metric: 'coinsEarned', target: 600, coins: 260, xp: 40 }
    ]
  },
  summer: {
    season: 'summer',
    name: 'Sunfest',
    desc: 'A bright festival of bumper harvests, animal produce, and crafts.',
    bonusCoins: 600,
    bonusXp: 90,
    contracts: [
      { id: 's_summer_harvest', title: 'Sun-Cured Bounty', desc: 'Harvest 12 crops this season.', metric: 'harvests', target: 12, coins: 240, xp: 40 },
      { id: 's_summer_products', title: 'Dairy Dash', desc: 'Collect 6 animal products this season.', metric: 'productsCollected', target: 6, coins: 240, xp: 40 },
      { id: 's_summer_craft', title: 'Craft Stall', desc: 'Craft 4 goods this season.', metric: 'crafts', target: 4, coins: 280, xp: 45 }
    ]
  },
  fall: {
    season: 'fall',
    name: 'Harvest Moon Fair',
    desc: 'Bring in the bounty and show off the finest goods of the year.',
    bonusCoins: 700,
    bonusXp: 100,
    contracts: [
      { id: 's_fall_harvest', title: 'Bountiful Harvest', desc: 'Harvest 15 crops this season.', metric: 'harvests', target: 15, coins: 300, xp: 50 },
      { id: 's_fall_gold', title: 'Golden Ears', desc: 'Harvest 3 gold-quality crops this season.', metric: 'goldHarvests', target: 3, coins: 320, xp: 55 },
      { id: 's_fall_sell', title: 'Festival Feast', desc: 'Sell 15 goods this season.', metric: 'cropsSold', target: 15, coins: 300, xp: 50 }
    ]
  },
  winter: {
    season: 'winter',
    name: 'Lantern Festival',
    desc: 'Warm the farm with glowing crafts, barn care, and winter trade.',
    bonusCoins: 700,
    bonusXp: 100,
    contracts: [
      { id: 's_winter_products', title: 'Barn Care', desc: 'Collect 8 animal products this season.', metric: 'productsCollected', target: 8, coins: 300, xp: 50 },
      { id: 's_winter_craft', title: 'Lantern Crafts', desc: 'Craft 5 goods this season.', metric: 'crafts', target: 5, coins: 320, xp: 55 },
      { id: 's_winter_earn', title: 'Winter Market', desc: 'Earn 800 coins this season.', metric: 'coinsEarned', target: 800, coins: 350, xp: 60 }
    ]
  }
};


export const FISH: Record<string, FishDef> = {
  minnow: { id: 'minnow', name: 'Minnow', itemId: 'minnow', seasons: ['spring', 'summer', 'fall', 'winter'], weathers: ['sunny', 'cloudy', 'rain', 'snow', 'wind', 'fog'], minHour: 6, maxHour: 18, rarity: 0.34, minSell: 18, desc: 'A tiny fish that nibbles at the shallows.' },
  carp: { id: 'carp', name: 'Carp', itemId: 'carp', seasons: ['spring', 'summer'], weathers: ['sunny', 'cloudy', 'rain', 'storm', 'snow', 'wind', 'fog'], minHour: 6, maxHour: 20, rarity: 0.26, minSell: 32, desc: 'A patient bottom-feeder.' },
  bass: { id: 'bass', name: 'Bass', itemId: 'bass', seasons: ['spring', 'fall'], weathers: ['sunny', 'cloudy', 'rain', 'wind', 'fog'], minHour: 6, maxHour: 19, rarity: 0.18, minSell: 55, desc: 'A strong fighter on the line.' },
  trout: { id: 'trout', name: 'Trout', itemId: 'trout', seasons: ['fall', 'winter'], weathers: ['cloudy', 'rain', 'storm', 'snow', 'fog'], minHour: 6, maxHour: 18, rarity: 0.13, minSell: 75, desc: 'Prefers cool, cloudy water.' },
  catfish: { id: 'catfish', name: 'Catfish', itemId: 'catfish', seasons: ['summer', 'fall'], weathers: ['cloudy', 'rain', 'storm', 'fog'], minHour: 18, maxHour: 24, rarity: 0.1, minSell: 110, desc: 'A whiskered night hunter.' },
  salmon: { id: 'salmon', name: 'Salmon', itemId: 'salmon', seasons: ['fall'], weathers: ['sunny', 'cloudy', 'rain', 'wind'], minHour: 6, maxHour: 18, rarity: 0.11, minSell: 150, desc: 'A prized autumn catch.' },
  koi: { id: 'koi', name: 'Koi', itemId: 'koi', seasons: ['spring', 'summer'], weathers: ['sunny', 'wind'], minHour: 6, maxHour: 12, rarity: 0.05, minSell: 260, desc: 'A beautiful ornamental fish.' },
  golden_carp: { id: 'golden_carp', name: 'Golden Carp', itemId: 'golden_carp', seasons: ['spring', 'summer', 'fall', 'winter'], weathers: ['sunny'], minHour: 6, maxHour: 18, rarity: 0.015, minSell: 600, desc: 'A legendary golden catch. Very rare.' }
};

export const AUTOMATION: AutomationDef[] = [
  { id: 'auto_feed', name: 'Auto-Feed', desc: 'Feeds every unfed animal each morning using feed from your inventory.', cost: 600, unlockLevel: 6 },
  { id: 'auto_collect', name: 'Auto-Collect', desc: 'Collects ready animal products each morning.', cost: 900, unlockLevel: 6 },
  { id: 'auto_harvest', name: 'Auto-Harvest', desc: 'Harvests mature crops each morning. Automated harvests are normal quality and grant no XP.', cost: 1200, unlockLevel: 6 },
  { id: 'auto_replant', name: 'Auto-Replant', desc: 'Replants harvested tiles using seeds from your inventory.', cost: 700, unlockLevel: 6 }
];

function collectionMilestones(setId: string, count: number): CollectionSetDef['milestones'] {
  const counts = [Math.ceil(count * 0.25), Math.ceil(count * 0.5), Math.ceil(count * 0.75), count];
  return counts.map((target, index) => ({
    id: `${setId}_${index + 1}`,
    count: target,
    coins: [250, 500, 900, 1500][index],
    xp: [30, 50, 80, 120][index]
  }));
}

export const COLLECTION_SETS: CollectionSetDef[] = [
  {
    id: 'crops',
    name: 'Crop Album',
    desc: 'Every crop harvested on the farm.',
    itemIds: Object.values(CROPS).map((crop) => crop.harvestId),
    milestones: collectionMilestones('crops', Object.keys(CROPS).length)
  },
  {
    id: 'products',
    name: 'Barn & Coop',
    desc: 'Animal products collected from your livestock.',
    itemIds: Object.values(ANIMALS).map((animal) => animal.productId),
    milestones: collectionMilestones('products', Object.keys(ANIMALS).length)
  },
  {
    id: 'crafted',
    name: 'Artisan Goods',
    desc: 'Everything crafted at the workshop.',
    itemIds: RECIPES.map((recipe) => recipe.output.itemId),
    milestones: collectionMilestones('crafted', RECIPES.length)
  },
  {
    id: 'fish',
    name: 'Fish Album',
    desc: 'Seasonal fish caught from the pond.',
    itemIds: Object.values(FISH).map((fish) => fish.itemId),
    milestones: collectionMilestones('fish', Object.keys(FISH).length)
  },
  {
    id: 'minerals',
    name: 'Minerals',
    desc: 'Stone, ore and gemstones from the quarry.',
    itemIds: ['stone', 'copper_ore', 'iron_ore', 'gold_ore', 'gem'],
    milestones: collectionMilestones('minerals', 5)
  }
];

export const FESTIVAL_CONTESTS: Record<Season, FestivalContestDef> = {
  spring: {
    season: 'spring',
    name: 'Blossom Crop Show',
    desc: 'Bring three of your finest spring crops to the judging stand.',
    itemType: 'crop',
    count: 3,
    themeBonuses: ['sunflowers', 'strawberries', 'cabbage'],
    bronze: 120,
    silver: 260,
    gold: 450,
    coins: 300,
    xp: 60,
    ribbon: 'ribbon_spring'
  },
  summer: {
    season: 'summer',
    name: 'Sunfest Cook-Off',
    desc: 'Submit two artisan goods for the summer cook-off.',
    itemType: 'crafted',
    count: 2,
    themeBonuses: ['jam', 'cheese', 'omelette'],
    bronze: 180,
    silver: 360,
    gold: 600,
    coins: 360,
    xp: 70,
    ribbon: 'ribbon_summer'
  },
  fall: {
    season: 'fall',
    name: 'Harvest Moon Show',
    desc: 'Show three prize fall crops to the harvest judges.',
    itemType: 'crop',
    count: 3,
    themeBonuses: ['pumpkins', 'corn', 'sunflowers'],
    bronze: 220,
    silver: 450,
    gold: 750,
    coins: 420,
    xp: 80,
    ribbon: 'ribbon_fall'
  },
  winter: {
    season: 'winter',
    name: 'Lantern Display',
    desc: 'Present three glowing artisan goods for the lantern display.',
    itemType: 'crafted',
    count: 3,
    themeBonuses: ['pumpkin_pie', 'fish_stew', 'truffle_oil'],
    bronze: 300,
    silver: 600,
    gold: 1000,
    coins: 500,
    xp: 90,
    ribbon: 'ribbon_winter'
  }
};

export const FESTIVAL_RIBBONS: Array<{ id: string; name: string; season: Season; tier: 'bronze' | 'silver' | 'gold' }> = [];
for (const season of SEASONS) {
  for (const tier of ['bronze', 'silver', 'gold'] as const) {
    FESTIVAL_RIBBONS.push({
      id: `ribbon_${season}_${tier}`,
      name: `${SEASON_INFO[season].name} ${tier.charAt(0).toUpperCase() + tier.slice(1)} Ribbon`,
      season,
      tier
    });
  }
}

export const NPCS: Record<string, NpcDef> = {
  mira: {
    id: 'mira', name: 'Mira', role: 'Florist', birthdaySeason: 'spring', birthdayDay: 12,
    visitDays: [1, 3, 5], romanceable: true, colors: [0x6a9a5a, 0xe8b8c8, 0x8a5a3a],
    loves: ['sunflowers', 'jam', 'koi'], likes: ['strawberries', 'cabbage', 'grilled_fish'], hates: ['stone', 'truffle'],
    lines: ['The flowers are waking up.', 'A farm always smells like possibility.', 'Have you seen the pond in the morning light?'],
    heartLines: ['Mira smiles when you arrive.', 'Mira saves you a flower from her cart.', 'Mira tells you about her dream garden.', 'Mira asks if you would walk with her at sunset.', 'Mira says the farm feels like home when you are here.'],
    desc: 'A gentle florist who visits the farm to sketch wildflowers.'
  },
  rowan: {
    id: 'rowan', name: 'Rowan', role: 'Carpenter', birthdaySeason: 'summer', birthdayDay: 8,
    visitDays: [2, 4, 6], romanceable: true, colors: [0x4f7a8a, 0xd8b88a, 0x8a5a34],
    loves: ['bread', 'cheese', 'iron_ore'], likes: ['stone', 'copper_ore', 'corn'], hates: ['jam', 'sunflowers'],
    lines: ['That fence could use a stronger joint.', 'Good timber makes a good farm.', 'I like the sound of a hammer at dawn.'],
    heartLines: ['Rowan nods approvingly at your work.', 'Rowan offers to fix a loose hinge.', 'Rowan shows you a sketch for a shared porch.', 'Rowan admits he looks forward to your visits.', 'Rowan says he would build a home anywhere with you.'],
    desc: 'A practical carpenter with sawdust on his sleeves.'
  },
  tessa: {
    id: 'tessa', name: 'Tessa', role: 'Rancher', birthdaySeason: 'fall', birthdayDay: 22,
    visitDays: [1, 4, 7], romanceable: true, colors: [0xb85a4a, 0xf0e2c8, 0x5a3a24],
    loves: ['wool', 'milk', 'pumpkin_pie'], likes: ['egg', 'cheese', 'truffle'], hates: ['fish_stew', 'gem'],
    lines: ['Your animals look well cared for.', 'A happy cow gives the best milk.', 'The barn is my favourite place.'],
    heartLines: ['Tessa gives you a warm grin.', 'Tessa shares her grandmother\'s recipe.', 'Tessa asks for your opinion on a new calf name.', 'Tessa saves you a seat by the barn fire.', 'Tessa says she cannot imagine a better partner.'],
    desc: 'A cheerful rancher who knows every animal by name.'
  },
  orin: {
    id: 'orin', name: 'Orin', role: 'Angler', birthdaySeason: 'winter', birthdayDay: 5,
    visitDays: [2, 5, 7], romanceable: false, colors: [0x3f6a8a, 0x9ad8f0, 0x5a4a3a],
    loves: ['catfish', 'salmon', 'golden_carp'], likes: ['bait', 'grilled_fish', 'fish_stew'], hates: ['wool', 'pumpkin_pie'],
    lines: ['The pond is quiet today.', 'A patient angler always eats well.', 'Did you see the ripple by the reeds?'],
    heartLines: ['Orin shares a fishing spot.', 'Orin teaches you a new knot.', 'Orin tells a tall tale about a golden carp.', 'Orin calls you a true angler.', 'Orin says you are the best fishing partner he has had.'],
    desc: 'A quiet angler who visits the pond and trades fishing stories.'
  },
  june: {
    id: 'june', name: 'June', role: 'Artist', birthdaySeason: 'spring', birthdayDay: 26,
    visitDays: [3, 6, 7], romanceable: false, colors: [0x8a6aa8, 0xf0c84a, 0x4a3a5a],
    loves: ['truffle_oil', 'pumpkin_pie', 'gem'], likes: ['sunflowers', 'koi', 'cloth'], hates: ['stone', 'feed'],
    lines: ['The light is perfect right now.', 'I am painting the farm from memory.', 'Every season is a different palette.'],
    heartLines: ['June shows you a tiny sketch.', 'June asks to paint your portrait.', 'June gives you a hand-made card.', 'June calls you her favourite subject.', 'June says your farm is her favourite place to paint.'],
    desc: 'A dreamy artist who paints the farm through the seasons.'
  }
};

export const NPC_SPOTS: Record<string, { x: number; y: number }> = {
  mira: { x: 11, y: 17 },
  rowan: { x: 22, y: 8 },
  tessa: { x: 33, y: 17 },
  june: { x: 44, y: 8 },
  orin: { x: 33, y: 26 }
};

export const SEED_IDS = Object.values(ITEMS)
  .filter((i) => i.type === 'seed')
  .map((i) => i.id);

export function cropForSeed(seedId: string): CropDef | undefined {
  return Object.values(CROPS).find((c) => c.seedId === seedId);
}

export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return 100 + (level - 1) * 80;
}

export function levelFromXp(totalXp: number): number {
  let level = 1;
  let needed = xpForLevel(2);
  let remaining = totalXp;
  while (remaining >= needed && level < 99) {
    remaining -= needed;
    level += 1;
    needed = xpForLevel(level + 1);
  }
  return level;
}

export function xpProgress(totalXp: number): { level: number; into: number; need: number } {
  let level = 1;
  let remaining = totalXp;
  let need = xpForLevel(2);
  while (remaining >= need && level < 99) {
    remaining -= need;
    level += 1;
    need = xpForLevel(level + 1);
  }
  return { level, into: remaining, need };
}

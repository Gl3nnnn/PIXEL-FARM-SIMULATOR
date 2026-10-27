import type {
  AnimalDef,
  BuildingDef,
  CropDef,
  ItemDef,
  QuestDef,
  RecipeDef,
  Season,
  Settings,
  UpgradeDef,
  Weather
} from '../types';

export const TILE = 32;
export const WORLD_W = 44;
export const WORLD_H = 34;
export const DAYS_PER_SEASON = 28;
export const START_MINUTE = 6 * 60;
export const MINUTES_PER_REAL_SECOND = 3;
export const CURRENT_SAVE_VERSION = 2;

export const SEASONS: Season[] = ['spring', 'summer', 'fall', 'winter'];

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
  storm: { name: 'Storm', icon: '⚡' }
};

export const QUALITY_MULTIPLIER = { normal: 1, silver: 1.3, gold: 1.75 } as const;
export const QUALITY_LABEL = { normal: '', silver: 'Silver', gold: 'Gold' } as const;

export const DEFAULT_SETTINGS: Settings = { music: false, sfx: true, volume: 0.5 };

export const PLOTS = [
  { id: 0, x: 6, y: 9, w: 9, h: 6, cost: 0, name: 'Home Field' },
  { id: 1, x: 17, y: 9, w: 9, h: 6, cost: 600, name: 'East Field' },
  { id: 2, x: 28, y: 10, w: 8, h: 6, cost: 1800, name: 'River Field' },
  { id: 3, x: 6, y: 19, w: 9, h: 6, cost: 4500, name: 'South Field' },
  { id: 4, x: 18, y: 19, w: 9, h: 6, cost: 9000, name: 'Meadow Field' },
  { id: 5, x: 30, y: 21, w: 8, h: 6, cost: 16000, name: 'Sunset Field' }
] as const;

export const FARMHOUSE = { x: 4, y: 3, w: 4, h: 3 };

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
  truffle_oil: { id: 'truffle_oil', name: 'Truffle Oil', type: 'crafted', price: 300, sell: 300, stack: 99, desc: 'Luxury cooking oil.', color: 0xc8a44a, color2: 0x7a5a2a }
};

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

export const ANIMALS: Record<string, AnimalDef> = {
  chicken: { id: 'chicken', name: 'Chicken', housing: 'coop', price: 180, productId: 'egg', maturityDays: 3, desc: 'Lays an egg almost every day.', colors: [0xf5f0e2, 0xd8cfb8, 0xd84c3f] },
  duck: { id: 'duck', name: 'Duck', housing: 'coop', price: 260, productId: 'duck_egg', maturityDays: 3, desc: 'Produces rich duck eggs.', colors: [0xf0f0e0, 0xd8d8b8, 0xe8a23a] },
  cow: { id: 'cow', name: 'Cow', housing: 'barn', price: 700, productId: 'milk', maturityDays: 4, desc: 'Needs a barn. Produces milk.', colors: [0xf2efe6, 0x3a3a3a, 0xe8a8a8] },
  sheep: { id: 'sheep', name: 'Sheep', housing: 'barn', price: 520, productId: 'wool', maturityDays: 4, desc: 'Fluffy wool producer.', colors: [0xf5f2e8, 0xd8d0bc, 0x5a4a42] },
  pig: { id: 'pig', name: 'Pig', housing: 'barn', price: 900, productId: 'truffle', maturityDays: 5, desc: 'Sniffs out valuable truffles.', colors: [0xf0b8b8, 0xd89898, 0xc07070] }
};

export const BUILDINGS: Record<string, BuildingDef> = {
  farmhouse: { id: 'farmhouse', name: 'Farmhouse', w: 4, h: 3, cost: 0, unlockLevel: 1, kind: 'farmhouse', desc: 'Your home. Upgrade it for extra storage.' },
  coop: { id: 'coop', name: 'Chicken Coop', w: 3, h: 2, cost: 320, unlockLevel: 1, kind: 'housing', capacity: 4, desc: 'Houses up to 4 chickens or ducks.' },
  barn: { id: 'barn', name: 'Barn', w: 4, h: 3, cost: 900, unlockLevel: 3, kind: 'housing', capacity: 4, desc: 'Houses up to 4 cows, sheep or pigs.' },
  shed: { id: 'shed', name: 'Storage Shed', w: 3, h: 2, cost: 650, unlockLevel: 2, kind: 'storage', storage: 24, desc: 'Adds 24 inventory slots.' },
  workshop: { id: 'workshop', name: 'Workshop', w: 3, h: 2, cost: 950, unlockLevel: 4, kind: 'craft', desc: 'Unlocks crafting recipes.' },
  greenhouse: { id: 'greenhouse', name: 'Greenhouse', w: 3, h: 2, cost: 1400, unlockLevel: 5, kind: 'greenhouse', desc: 'Allows planting any crop in any season.' },
  well: { id: 'well', name: 'Water Well', w: 2, h: 2, cost: 280, unlockLevel: 2, kind: 'well', radius: 3, desc: 'Waters nearby crops every morning.' },
  sprinkler: { id: 'sprinkler', name: 'Sprinkler', w: 1, h: 1, cost: 450, unlockLevel: 6, kind: 'sprinkler', radius: 1, desc: 'Automatically waters a 3x3 area.' },
  fence: { id: 'fence', name: 'Fence', w: 1, h: 1, cost: 18, unlockLevel: 1, kind: 'decor', desc: 'A cosy wooden fence.' },
  path: { id: 'path', name: 'Stone Path', w: 1, h: 1, cost: 8, unlockLevel: 1, kind: 'decor', desc: 'Walk 25% faster on paths.' }
};

export const RECIPES: RecipeDef[] = [
  { id: 'flour', name: 'Flour', inputs: [{ itemId: 'wheat', qty: 2 }], output: { itemId: 'flour', qty: 1 }, coins: 0, unlockLevel: 1, desc: 'Mill wheat into flour.' },
  { id: 'bread', name: 'Bread', inputs: [{ itemId: 'flour', qty: 2 }], output: { itemId: 'bread', qty: 1 }, coins: 10, unlockLevel: 2, desc: 'Bake a warm loaf.' },
  { id: 'cheese', name: 'Cheese', inputs: [{ itemId: 'milk', qty: 2 }], output: { itemId: 'cheese', qty: 1 }, coins: 0, unlockLevel: 2, desc: 'Age milk into cheese.' },
  { id: 'jam', name: 'Berry Jam', inputs: [{ itemId: 'strawberries', qty: 3 }], output: { itemId: 'jam', qty: 1 }, coins: 5, unlockLevel: 2, desc: 'Preserve fresh berries.' },
  { id: 'cloth', name: 'Wool Cloth', inputs: [{ itemId: 'wool', qty: 2 }], output: { itemId: 'cloth', qty: 1 }, coins: 0, unlockLevel: 3, desc: 'Weave wool into cloth.' },
  { id: 'omelette', name: 'Omelette', inputs: [{ itemId: 'egg', qty: 2 }], output: { itemId: 'omelette', qty: 1 }, coins: 0, unlockLevel: 1, desc: 'Cook breakfast.' },
  { id: 'pumpkin_pie', name: 'Pumpkin Pie', inputs: [{ itemId: 'pumpkins', qty: 1 }, { itemId: 'flour', qty: 1 }, { itemId: 'egg', qty: 1 }], output: { itemId: 'pumpkin_pie', qty: 1 }, coins: 25, unlockLevel: 4, desc: 'A festival treat.' },
  { id: 'truffle_oil', name: 'Truffle Oil', inputs: [{ itemId: 'truffle', qty: 1 }, { itemId: 'sunflowers', qty: 1 }], output: { itemId: 'truffle_oil', qty: 1 }, coins: 30, unlockLevel: 5, desc: 'Bottle luxury.' }
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
  { id: 'a_level10', title: 'Seasoned Farmer', desc: 'Reach farmer level 10.', metric: 'level', target: 10, coins: 1500, xp: 0, tier: 'achievement' }
];

export const DAILY_TEMPLATES: Array<Omit<QuestDef, 'tier'>> = [
  { id: 'd_harvest', title: 'Fresh Picks', desc: 'Harvest 5 crops today.', metric: 'harvests', target: 5, coins: 120, xp: 15 },
  { id: 'd_water', title: 'Well Watered', desc: 'Water 8 tiles today.', metric: 'waters', target: 8, coins: 90, xp: 10 },
  { id: 'd_sell', title: 'Market Run', desc: 'Sell 3 goods today.', metric: 'cropsSold', target: 3, coins: 100, xp: 12 },
  { id: 'd_plant', title: 'Sow the Seeds', desc: 'Plant 4 crops today.', metric: 'planted', target: 4, coins: 100, xp: 12 },
  { id: 'd_earn', title: 'Pocket Money', desc: 'Earn 200 coins today.', metric: 'coinsEarned', target: 200, coins: 120, xp: 15 },
  { id: 'd_collect', title: 'Morning Chores', desc: 'Collect 2 animal products today.', metric: 'productsCollected', target: 2, coins: 130, xp: 15 }
];

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

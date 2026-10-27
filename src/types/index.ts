export interface Vector2 {
    x: number;
    y: number;
}

export interface GameConfig {
    width: number;
    height: number;
    tileSize: number;
}

export interface Item {
    id: string;
    name: string;
    type: 'seed' | 'crop' | 'tool' | 'product' | 'material';
    price: number;
    sellPrice?: number;
    stackable: boolean;
    maxStack: number;
    description: string;
    icon?: string;
}

export interface CropData {
    id: string;
    name: string;
    seedItemId: string;
    seasons: string[];
    growthStages: number;
    growthTimeDays: number;
    waterNeeded: boolean;
    regrows?: boolean;
    harvestItemId: string;
    harvestQuantity: number;
    purchasePrice: number;
    sellPrice: number;
}

export interface AnimalData {
    id: string;
    name: string;
    purchasePrice: number;
    housingRequired: string;
    feedItemId: string;
    productItemId: string;
    productIntervalDays: number;
    maturityDays: number;
}

export interface BuildingData {
    id: string;
    name: string;
    cost: number;
    width: number;
    height: number;
    unlockLevel: number;
    description: string;
}

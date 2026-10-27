import { Item } from '../types';

export const ITEMS: Record<string, Item> = {
    // Seeds
    wheat_seed: { id: 'wheat_seed', name: 'Wheat Seeds', type: 'seed', price: 10, stackable: true, maxStack: 99, description: 'Seeds for wheat' },
    carrot_seed: { id: 'carrot_seed', name: 'Carrot Seeds', type: 'seed', price: 15, stackable: true, maxStack: 99, description: 'Seeds for carrots' },
    potato_seed: { id: 'potato_seed', name: 'Potato Seeds', type: 'seed', price: 20, stackable: true, maxStack: 99, description: 'Seeds for potatoes' },
    tomato_seed: { id: 'tomato_seed', name: 'Tomato Seeds', type: 'seed', price: 30, stackable: true, maxStack: 99, description: 'Seeds for tomatoes' },
    corn_seed: { id: 'corn_seed', name: 'Corn Seeds', type: 'seed', price: 25, stackable: true, maxStack: 99, description: 'Seeds for corn' },
    strawberry_seed: { id: 'strawberry_seed', name: 'Strawberry Seeds', type: 'seed', price: 40, stackable: true, maxStack: 99, description: 'Seeds for strawberries' },
    pumpkin_seed: { id: 'pumpkin_seed', name: 'Pumpkin Seeds', type: 'seed', price: 50, stackable: true, maxStack: 99, description: 'Seeds for pumpkins' },
    cabbage_seed: { id: 'cabbage_seed', name: 'Cabbage Seeds', type: 'seed', price: 35, stackable: true, maxStack: 99, description: 'Seeds for cabbage' },
    rice_seed: { id: 'rice_seed', name: 'Rice Seeds', type: 'seed', price: 20, stackable: true, maxStack: 99, description: 'Seeds for rice' },
    sunflower_seed: { id: 'sunflower_seed', name: 'Sunflower Seeds', type: 'seed', price: 30, stackable: true, maxStack: 99, description: 'Seeds for sunflowers' },
    
    // Crops/Harvest
    wheat: { id: 'wheat', name: 'Wheat', type: 'crop', price: 15, sellPrice: 15, stackable: true, maxStack: 99, description: 'Fresh wheat' },
    carrots: { id: 'carrots', name: 'Carrots', type: 'crop', price: 20, sellPrice: 20, stackable: true, maxStack: 99, description: 'Fresh carrots' },
    potatoes: { id: 'potatoes', name: 'Potatoes', type: 'crop', price: 25, sellPrice: 25, stackable: true, maxStack: 99, description: 'Fresh potatoes' },
    tomatoes: { id: 'tomatoes', name: 'Tomatoes', type: 'crop', price: 35, sellPrice: 35, stackable: true, maxStack: 99, description: 'Fresh tomatoes' },
    corn: { id: 'corn', name: 'Corn', type: 'crop', price: 30, sellPrice: 30, stackable: true, maxStack: 99, description: 'Fresh corn' },
    strawberries: { id: 'strawberries', name: 'Strawberries', type: 'crop', price: 50, sellPrice: 50, stackable: true, maxStack: 99, description: 'Fresh strawberries' },
    pumpkins: { id: 'pumpkins', name: 'Pumpkins', type: 'crop', price: 80, sellPrice: 80, stackable: true, maxStack: 99, description: 'Fresh pumpkin' },
    cabbage: { id: 'cabbage', name: 'Cabbage', type: 'crop', price: 45, sellPrice: 45, stackable: true, maxStack: 99, description: 'Fresh cabbage' },
    rice: { id: 'rice', name: 'Rice', type: 'crop', price: 25, sellPrice: 25, stackable: true, maxStack: 99, description: 'Fresh rice' },
    sunflowers: { id: 'sunflowers', name: 'Sunflowers', type: 'crop', price: 40, sellPrice: 40, stackable: true, maxStack: 99, description: 'Fresh sunflowers' },
    
    // Tools
    hoe: { id: 'hoe', name: 'Hoe', type: 'tool', price: 100, stackable: false, maxStack: 1, description: 'Used to till soil' },
    watering_can: { id: 'watering_can', name: 'Watering Can', type: 'tool', price: 50, stackable: false, maxStack: 1, description: 'Used to water crops' },
    
    // Animal products
    egg: { id: 'egg', name: 'Egg', type: 'product', price: 10, sellPrice: 10, stackable: true, maxStack: 99, description: 'Chicken egg' },
    milk: { id: 'milk', name: 'Milk', type: 'product', price: 20, sellPrice: 20, stackable: true, maxStack: 99, description: 'Fresh milk' },
    wool: { id: 'wool', name: 'Wool', type: 'product', price: 30, sellPrice: 30, stackable: true, maxStack: 99, description: 'Sheep wool' }
};

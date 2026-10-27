import { Scene } from 'phaser';

export class BootScene extends Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // Create simple pixel art textures
        this.createTextures();
    }

    create() {
        this.scene.start('MenuScene');
    }

    createTextures() {
        // Create basic colored rectangles as placeholder pixel art
        const graphics = this.add.graphics();
        
        // Grass
        graphics.fillStyle(0x4a7c59);
        graphics.fillRect(0, 0, 16, 16);
        graphics.generateTexture('grass', 16, 16);
        graphics.clear();
        
        // Tilled soil
        graphics.fillStyle(0x8b4513);
        graphics.fillRect(0, 0, 16, 16);
        graphics.generateTexture('tilled', 16, 16);
        graphics.clear();
        
        // Watered soil
        graphics.fillStyle(0x654321);
        graphics.fillRect(0, 0, 16, 16);
        graphics.generateTexture('watered', 16, 16);
        graphics.clear();
        
        // Player
        graphics.fillStyle(0xffdbac);
        graphics.fillRect(0, 0, 16, 16);
        graphics.generateTexture('player', 16, 16);
        graphics.clear();
        
        // Crops
        graphics.fillStyle(0x90ee90);
        graphics.fillRect(0, 0, 16, 16);
        graphics.generateTexture('crop1', 16, 16);
        graphics.clear();
        
        graphics.fillStyle(0x228b22);
        graphics.fillRect(0, 0, 16, 16);
        graphics.generateTexture('crop2', 16, 16);
        graphics.clear();
        
        graphics.fillStyle(0x006400);
        graphics.fillRect(0, 0, 16, 16);
        graphics.generateTexture('crop3', 16, 16);
        graphics.clear();
        
        graphics.fillStyle(0xffd700);
        graphics.fillRect(0, 0, 16, 16);
        graphics.generateTexture('crop4', 16, 16);
        graphics.clear();
        
        // Tools/Items
        graphics.fillStyle(0x8b7355);
        graphics.fillRect(0, 0, 16, 16);
        graphics.generateTexture('tool', 16, 16);
        graphics.clear();
        
        graphics.destroy();
    }
}

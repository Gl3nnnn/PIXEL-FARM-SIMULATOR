import { Scene } from 'phaser';

export class GameScene extends Scene {
    private player!: Phaser.Physics.Arcade.Sprite;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasd!: { W: Phaser.Input.Keyboard.Key, A: Phaser.Input.Keyboard.Key, S: Phaser.Input.Keyboard.Key, D: Phaser.Input.Keyboard.Key };
    private speed = 200;
    
    // Farm data
    private farmTiles: any[][] = [];
    private tileSize = 32;
    private mapWidth = 20;
    private mapHeight = 15;
    
    // Game state
    private coins = 500;
    private day = 1;
    private season = 'spring';
    private inventory: any[] = [];
    private selectedTool = 'hoe';
    
    // UI
    private coinsText!: Phaser.GameObjects.Text;
    private dayText!: Phaser.GameObjects.Text;
    
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        this.createMap();
        this.createPlayer();
        this.createUI();
        this.setupInput();
        this.setupCamera();
        
        // Initialize inventory with starter items
        this.inventory = [
            { itemId: 'hoe', quantity: 1 },
            { itemId: 'watering_can', quantity: 1 },
            { itemId: 'wheat_seed', quantity: 10 },
            { itemId: 'carrot_seed', quantity: 5 }
        ];
    }

    createMap() {
        // Create farm tiles
        for (let y = 0; y < this.mapHeight; y++) {
            this.farmTiles[y] = [];
            for (let x = 0; x < this.mapWidth; x++) {
                // Most tiles are grass, some can be tilled
                const tile = this.add.image(x * this.tileSize + 16, y * this.tileSize + 16, 'grass');
                tile.setScale(2);
                
                this.farmTiles[y][x] = {
                    sprite: tile,
                    type: 'grass',
                    tilled: false,
                    watered: false,
                    crop: null,
                    cropStage: 0,
                    x: x,
                    y: y
                };
            }
        }
    }

    createPlayer() {
        this.player = this.physics.add.sprite(320, 240, 'player');
        this.player.setScale(2);
        this.player.setCollideWorldBounds(true);
    }

    createUI() {
        // Top UI bar
        const uiBg = this.add.rectangle(512, 30, 1024, 60, 0x000000, 0.7);
        uiBg.setScrollFactor(0);
        
        this.coinsText = this.add.text(20, 20, 'Coins: ' + this.coins, {
            fontSize: '16px',
            color: '#ffd700',
            fontFamily: 'Courier New'
        }).setScrollFactor(0);
        
        this.dayText = this.add.text(200, 20, 'Day ' + this.day + ' - ' + this.season, {
            fontSize: '16px',
            color: '#ffffff',
            fontFamily: 'Courier New'
        }).setScrollFactor(0);
        
        // Tool indicator
        this.add.text(400, 20, 'Tool: ' + this.selectedTool.toUpperCase(), {
            fontSize: '16px',
            color: '#90ee90',
            fontFamily: 'Courier New'
        }).setScrollFactor(0);
        
        // Hotbar
        for (let i = 0; i < 10; i++) {
            const slot = this.add.rectangle(512 - 225 + i * 50, 728, 45, 45, 0x000000, 0.7);
            slot.setStrokeStyle(2, 0xffffff);
            slot.setScrollFactor(0);
            slot.setInteractive({ useHandCursor: true });
            
            if (i < this.inventory.length) {
                this.add.text(512 - 225 + i * 50, 728, this.inventory[i].quantity.toString(), {
                    fontSize: '10px',
                    color: '#ffffff',
                    fontFamily: 'Courier New'
                }).setOrigin(0.5).setScrollFactor(0);
            }
            
            slot.on('pointerdown', () => {
                if (i < this.inventory.length) {
                    const item = this.inventory[i];
                    if (item.itemId === 'hoe') this.selectedTool = 'hoe';
                    else if (item.itemId === 'watering_can') this.selectedTool = 'watering_can';
                    else if (item.itemId.includes('seed')) this.selectedTool = item.itemId;
                }
            });
        }
    }

    setupInput() {
        this.cursors = this.input.keyboard!.createCursorKeys();
        this.wasd = {
            W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D)
        };
        
        // Mouse click for interaction
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            this.handleInteraction(pointer);
        });
        
        // Space to advance day
        this.input.keyboard!.on('keydown-SPACE', () => {
            this.advanceDay();
        });
    }

    setupCamera() {
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setBounds(0, 0, this.mapWidth * this.tileSize, this.mapHeight * this.tileSize);
        this.physics.world.setBounds(0, 0, this.mapWidth * this.tileSize, this.mapHeight * this.tileSize);
    }

    update() {
        // Player movement
        this.player.setVelocity(0);
        
        if (this.cursors.left.isDown || this.wasd.A.isDown) {
            this.player.setVelocityX(-this.speed);
        } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
            this.player.setVelocityX(this.speed);
        }
        
        if (this.cursors.up.isDown || this.wasd.W.isDown) {
            this.player.setVelocityY(-this.speed);
        } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
            this.player.setVelocityY(this.speed);
        }
    }

    handleInteraction(pointer: Phaser.Input.Pointer) {
        // Convert world coordinates to tile coordinates
        const worldPoint = pointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
        const tileX = Math.floor(worldPoint.x / this.tileSize);
        const tileY = Math.floor(worldPoint.y / this.tileSize);
        
        if (tileX < 0 || tileX >= this.mapWidth || tileY < 0 || tileY >= this.mapHeight) return;
        
        const tile = this.farmTiles[tileY][tileX];
        
        if (this.selectedTool === 'hoe' && tile.type === 'grass' && !tile.tilled) {
            tile.tilled = true;
            tile.sprite.setTexture('tilled');
            tile.type = 'tilled';
        } else if (this.selectedTool === 'watering_can' && tile.tilled && !tile.watered) {
            tile.watered = true;
            tile.sprite.setTexture('watered');
        } else if (this.selectedTool.includes('seed') && tile.tilled && !tile.crop) {
            // Plant seed
            tile.crop = this.selectedTool.replace('_seed', '');
            tile.cropStage = 0;
            tile.sprite.setTexture('crop1');
            
            // Remove one seed from inventory
            const seedIndex = this.inventory.findIndex(item => item.itemId === this.selectedTool);
            if (seedIndex >= 0) {
                this.inventory[seedIndex].quantity--;
                if (this.inventory[seedIndex].quantity <= 0) {
                    this.inventory.splice(seedIndex, 1);
                }
            }
            this.createUI(); // Refresh UI
        } else if (tile.crop && tile.cropStage >= 3) {
            // Harvest
            this.coins += 50;
            this.coinsText.setText('Coins: ' + this.coins);
            tile.crop = null;
            tile.cropStage = 0;
            tile.sprite.setTexture(tile.tilled ? 'tilled' : 'grass');
            if (!tile.tilled) tile.type = 'grass';
        }
    }

    advanceDay() {
        this.day++;
        this.dayText.setText('Day ' + this.day + ' - ' + this.season);
        
        // Grow crops
        for (let y = 0; y < this.mapHeight; y++) {
            for (let x = 0; x < this.mapWidth; x++) {
                const tile = this.farmTiles[y][x];
                if (tile.crop && tile.watered && tile.cropStage < 3) {
                    tile.cropStage++;
                    if (tile.cropStage === 1) tile.sprite.setTexture('crop2');
                    else if (tile.cropStage === 2) tile.sprite.setTexture('crop3');
                    else if (tile.cropStage === 3) tile.sprite.setTexture('crop4');
                }
                // Reset watered status each day
                if (tile.watered) {
                    tile.watered = false;
                    if (tile.tilled) tile.sprite.setTexture('tilled');
                }
            }
        }
        
        // Show day advance message
        const msg = this.add.text(512, 384, 'Day ' + this.day + ' advanced!', {
            fontSize: '24px',
            color: '#ffffff',
            fontFamily: 'Courier New',
            backgroundColor: '#000000'
        }).setOrigin(0.5).setScrollFactor(0);
        
        this.time.delayedCall(2000, () => {
            msg.destroy();
        });
    }
}

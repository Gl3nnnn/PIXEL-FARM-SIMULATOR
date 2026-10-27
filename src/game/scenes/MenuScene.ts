import { Scene } from 'phaser';

export class MenuScene extends Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const { width, height } = this.cameras.main;
        
        // Title
        this.add.text(width / 2, height / 3, 'PIXEL FARM SIMULATOR', {
            fontSize: '32px',
            color: '#ffffff',
            fontFamily: 'Courier New'
        }).setOrigin(0.5);
        
        this.add.text(width / 2, height / 3 + 40, 'From Small Farm to Farming Empire', {
            fontSize: '16px',
            color: '#90ee90',
            fontFamily: 'Courier New'
        }).setOrigin(0.5);
        
        // New Game button
        const newGameBtn = this.add.rectangle(width / 2, height / 2, 200, 50, 0x4a7c59)
            .setInteractive({ useHandCursor: true });
        this.add.text(width / 2, height / 2, 'NEW GAME', {
            fontSize: '18px',
            color: '#ffffff',
            fontFamily: 'Courier New'
        }).setOrigin(0.5);
        
        newGameBtn.on('pointerdown', () => {
            this.scene.start('GameScene');
        });
        
        newGameBtn.on('pointerover', () => {
            newGameBtn.setFillStyle(0x5a8c69);
        });
        
        newGameBtn.on('pointerout', () => {
            newGameBtn.setFillStyle(0x4a7c59);
        });
    }
}

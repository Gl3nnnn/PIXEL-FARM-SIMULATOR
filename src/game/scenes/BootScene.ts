import Phaser from 'phaser';
import { createPlayerAnimations, generateTextures } from '../textures';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    generateTextures(this);
    createPlayerAnimations(this);
    this.scene.start('MenuScene');
  }
}

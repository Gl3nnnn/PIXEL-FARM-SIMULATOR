import Phaser from 'phaser';
import { SaveManager } from '../../systems/save';
import { createNewSave, GameState } from '../../systems/gameState';
import { MainMenu } from '../../ui/menu';
import { SEASON_INFO } from '../../data/definitions';

export class MenuScene extends Phaser.Scene {
  private menu: MainMenu | null = null;
  private tweensList: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#8fd0e8');
    this.buildBackdrop();
    this.menu = new MainMenu({
      onStart: (slot, mode) => this.handleStart(slot, mode)
    });
    void this.menu.mount().then(() => {
      document.getElementById('loading-screen')?.remove();
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.menu?.destroy();
      this.menu = null;
      this.tweensList.forEach((obj) => obj.destroy());
      this.tweensList = [];
    });
  }

  private async handleStart(slot: number, mode: 'new' | 'continue'): Promise<void> {
    if (mode === 'new') {
      const data = createNewSave();
      try {
        await SaveManager.save(slot, data);
      } catch {
        /* storage unavailable - still playable in memory */
      }
      const state = new GameState(data);
      this.launch(state, slot);
      return;
    }
    const data = await SaveManager.load(slot);
    if (!data) throw new Error('That save could not be loaded.');
    const state = new GameState(data);
    this.launch(state, slot);
  }

  private launch(state: GameState, slot: number): void {
    this.menu?.destroy();
    this.menu = null;
    this.scene.start('GameScene', { state, slot });
  }

  private buildBackdrop(): void {
    const W = this.scale.width;
    const H = this.scale.height;
    // Sky and distant hills
    this.add.rectangle(0, 0, W, H * 0.52, 0x8fd0e8).setOrigin(0);
    this.add.rectangle(0, H * 0.32, W, H * 0.2, 0xa8dce8).setOrigin(0);
    this.add.ellipse(W * 0.22, H * 0.52, W * 0.55, H * 0.22, 0x6fae7a).setOrigin(0.5, 1);
    this.add.ellipse(W * 0.72, H * 0.52, W * 0.65, H * 0.28, 0x5b9b6a).setOrigin(0.5, 1);
    this.add.ellipse(W * 0.5, H * 0.56, W * 0.8, H * 0.24, 0x82c47a).setOrigin(0.5, 1);

    const sun = this.add.image(W * 0.8, H * 0.16, 'sun').setScale(2.2);
    this.tweens.add({
      targets: sun,
      scale: 2.35,
      duration: 2600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut'
    });

    for (let i = 0; i < 3; i++) {
      const cloud = this.add.image(W * (0.1 + i * 0.34), H * (0.09 + (i % 2) * 0.07), 'cloud');
      cloud.setScale(1.6 + i * 0.35).setAlpha(0.9);
      cloud.setDepth(2);
      this.tweens.add({
        targets: cloud,
        x: cloud.x + 140,
        duration: 16000 + i * 5000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut'
      });
    }

    // Farm ground
    const groundTop = H * 0.52;
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < Math.ceil(W / 32) + 1; x++) {
        const variant = (x * 7 + y * 13) % 3;
        const tile = this.add.image(x * 32, groundTop + y * 32, `grass_spring_${variant}`);
        tile.setOrigin(0).setScale(2).setDepth(1);
      }
    }
    // Path
    for (let y = 0; y < 6; y++) {
      for (let x = 0; x < 3; x++) {
        this.add
          .image(W * 0.5 - 48 + x * 32, groundTop + 190 + y * 32, 'path')
          .setOrigin(0)
          .setScale(2)
          .setDepth(2);
      }
    }

    const farmhouse = this.add
      .image(W * 0.5, groundTop + 120, 'b_farmhouse')
      .setOrigin(0.5, 1)
      .setScale(3)
      .setDepth(30);
    void farmhouse;

    // Trees
    const treeSpots: Array<[number, number, number]> = [
      [W * 0.08, groundTop + 60, 2.6],
      [W * 0.19, groundTop + 120, 2.2],
      [W * 0.88, groundTop + 80, 2.8],
      [W * 0.95, groundTop + 200, 2.3],
      [W * 0.72, groundTop + 30, 2.1],
      [W * 0.3, groundTop + 240, 2.4]
    ];
    for (const [x, y, s] of treeSpots) {
      this.add.image(x, y, 'tree_spring').setOrigin(0.5, 1).setScale(s).setDepth(y);
      this.tweens.add({
        targets: this.add.image(x, y, 'shadow').setScale(s).setDepth(y - 1),
        alpha: 0.4,
        duration: 2000,
        yoyo: true,
        repeat: -1
      });
    }

    // Crops
    for (let i = 0; i < 8; i++) {
      const crop = this.add
        .image(W * 0.36 + (i % 4) * 44, groundTop + 250 + Math.floor(i / 4) * 44, `crop_carrots_${i % 4}`)
        .setScale(2)
        .setDepth(groundTop + 260 + Math.floor(i / 4) * 44);
      this.tweens.add({
        targets: crop,
        angle: i % 2 === 0 ? 2 : -2,
        duration: 1800 + i * 120,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut'
      });
    }

    // Animals
    const chicken = this.add
      .image(W * 0.64, groundTop + 300, 'animal_chicken_0')
      .setScale(2)
      .setDepth(groundTop + 301);
    this.tweens.add({
      targets: chicken,
      x: chicken.x + 60,
      duration: 3200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut'
    });
    this.add
      .image(W * 0.76, groundTop + 330, 'animal_sheep_0')
      .setScale(2)
      .setDepth(groundTop + 331);
    const duck = this.add
      .image(W * 0.28, groundTop + 330, 'animal_duck_0')
      .setScale(2)
      .setDepth(groundTop + 331);
    this.tweens.add({
      targets: duck,
      x: duck.x - 50,
      duration: 3800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut'
    });

    // Player
    const player = this.add.image(W * 0.5 + 96, groundTop + 300, 'player_down_0').setScale(2.4);
    player.setDepth(groundTop + 301);
    this.tweens.add({
      targets: player,
      y: player.y - 4,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut'
    });

    // Flowers festoon
    const rng = Phaser.Math.RND;
    for (let i = 0; i < 22; i++) {
      const x = rng.between(20, W - 20);
      const y = groundTop + rng.between(30, Math.floor(H - groundTop) - 20);
      if (Math.abs(x - W * 0.5) < 220 && y < groundTop + 350) continue;
      this.add.image(x, y, `flower_${i % 4}`).setScale(2).setDepth(y);
    }

    this.add.rectangle(0, H * 0.52, W, H * 0.48, 0x183a20, 0.12).setOrigin(0).setDepth(400);
    void SEASON_INFO;
    this.add.rectangle(0, 0, W, H, 0x0b2112, 0.22).setOrigin(0).setDepth(401);
  }
}

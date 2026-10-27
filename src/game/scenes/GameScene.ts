import Phaser from 'phaser';
import {
  ANIMALS,
  BUILDINGS,
  CROPS,
  ITEMS,
  PLOTS,
  SEASON_INFO,
  START_MINUTE,
  TILE,
  WEATHER_INFO,
  WORLD_H,
  WORLD_W
} from '../../data/definitions';
import { GameState } from '../../systems/gameState';
import { SaveManager } from '../../systems/save';
import { audio } from '../../systems/audio';
import { clamp, formatTime, tileKey } from '../../systems/util';
import {
  FLOWERS,
  isObstacleTile,
  isPathTile,
  isWaterTile,
  plotIndexAt,
  worldToTile
} from '../../systems/world';
import { GameUI } from '../../ui/gameUI';
import type { DaySummary, Facing, Season } from '../../types';

interface AnimalView {
  sprite: Phaser.GameObjects.Image;
  bubble: Phaser.GameObjects.Text;
  species: string;
  toggle: number;
}

interface TileVisual {
  soil: Phaser.GameObjects.Image;
  crop?: Phaser.GameObjects.Image;
  ready?: Phaser.GameObjects.Text;
}

export class GameScene extends Phaser.Scene {
  private state!: GameState;
  private slot = 1;
  private ui!: GameUI;
  private player!: Phaser.GameObjects.Sprite;
  private playerShadow!: Phaser.GameObjects.Image;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;
  private facing: Facing = 'down';

  private groundImages: Phaser.GameObjects.Image[] = [];
  private waterImages: Array<{ image: Phaser.GameObjects.Image; frame: number }> = [];
  private plotDecor: Array<Phaser.GameObjects.GameObject> = [];
  private tileVisuals = new Map<string, TileVisual>();
  private buildingSprites = new Map<string, Phaser.GameObjects.Image>();
  private animalViews = new Map<string, AnimalView>();
  private blockedBuildings = new Set<string>();

  private hoverGfx!: Phaser.GameObjects.Graphics;
  private ghost!: Phaser.GameObjects.Image;
  private ghostGfx!: Phaser.GameObjects.Graphics;
  private lightOverlay!: Phaser.GameObjects.Rectangle;
  private rainEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;

  private buildMode: string | null = null;
  private pendingBuild: { x: number; y: number } | null = null;
  private sleeping = false;
  private lastGroundSeason: Season | null = null;
  private lastLightUpdate = 0;
  private waterFrameTimer?: Phaser.Time.TimerEvent;
  private animalTimer?: Phaser.Time.TimerEvent;
  private wanderTimer?: Phaser.Time.TimerEvent;
  private stormTimer?: Phaser.Time.TimerEvent;
  private autosaveTimer: number | null = null;
  private unsubs: Array<() => void> = [];

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { state: GameState; slot: number }): void {
    this.state = data.state;
    this.slot = data.slot ?? 1;
    this.facing = this.state.data.player.facing ?? 'down';
    this.sleeping = false;
    this.buildMode = null;
    this.pendingBuild = null;
    this.lastGroundSeason = null;
  }

  create(): void {
    this.groundImages = [];
    this.waterImages = [];
    this.plotDecor = [];
    this.tileVisuals.clear();
    this.buildingSprites.clear();
    this.animalViews.clear();
    this.blockedBuildings.clear();

    this.buildGround();
    this.lastGroundSeason = this.state.data.season;
    this.buildFarmVisuals();
    this.buildBuildings();
    this.buildLockedPlots();
    this.createAnimals();
    this.createPlayer();
    this.setupCamera();
    this.setupInput();
    this.createLighting();
    this.createWeather();
    this.hoverGfx = this.add.graphics().setDepth(850);
    this.ghostGfx = this.add.graphics().setDepth(851);
    this.ghost = this.add.image(0, 0, 'b_coop').setVisible(false).setAlpha(0.7).setDepth(852);

    this.setupUI();
    this.registerStateEvents();
    this.startTimers();
    this.updateLighting(0);
    this.applyWeather();

    const save = (): void => {
      void this.saveGame();
    };
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup());
    this.unsubs.push(() => window.removeEventListener('pagehide', save));
    window.addEventListener('pagehide', save);

    void this.saveGame(true);
  }

  // --------------------------------------------------------------- building

  private setupUI(): void {
    this.ui = new GameUI(this, this.state, {
      save: () => this.saveGame(),
      sleep: () => this.sleep(),
      exitToMenu: () => this.exitToMenu(),
      beginBuild: (id) => this.setBuildMode(id),
      actionButton: () => this.useNearby()
    });
    this.ui.mount();
    this.ui.setSaveStatus(`Saved locally · slot ${this.slot}`);
  }

  private registerStateEvents(): void {
    this.unsubs.push(
      this.state.emitter.on('day', () => {
        if (this.lastGroundSeason !== this.state.data.season) {
          this.buildGround();
          this.lastGroundSeason = this.state.data.season;
        }
        this.buildFarmVisuals();
        this.syncAnimals();
        this.applyWeather();
      }),
      this.state.emitter.on('build', () => {
        this.buildBuildings();
        this.buildFarmVisuals();
      }),
      this.state.emitter.on('expand', () => {
        this.buildLockedPlots();
        this.buildFarmVisuals();
      }),
      this.state.emitter.on('farmhouse', () => {
        this.buildBuildings();
      }),
      this.state.emitter.on('animalBought', () => this.syncAnimals()),
      this.state.emitter.on('birth', () => this.syncAnimals()),
      this.state.emitter.on('change', () => this.syncAnimalBubbles())
    );
  }

  private startTimers(): void {
    this.waterFrameTimer = this.time.addEvent({
      delay: 650,
      loop: true,
      callback: () => {
        for (const w of this.waterImages) {
          w.frame = (w.frame + 1) % 3;
          w.image.setTexture(`water${w.frame}`);
        }
      }
    });
    this.animalTimer = this.time.addEvent({
      delay: 450,
      loop: true,
      callback: () => {
        if (this.state.paused) return;
        this.animalViews.forEach((view) => {
          const animal = this.state.getAnimal(view.sprite.getData('uid') as string);
          if (!animal) return;
          view.toggle = (view.toggle + 1) % 2;
          view.sprite.setTexture(`animal_${view.species}_${view.toggle}`);
        });
      }
    });
    this.wanderTimer = this.time.addEvent({
      delay: 4200,
      loop: true,
      callback: () => {
        if (this.state.paused) return;
        this.animalViews.forEach((view) => {
          if (Math.random() > 0.4) return;
          const sprite = view.sprite;
          const targetX = clamp(sprite.x + Phaser.Math.Between(-50, 50), TILE * 2, (WORLD_W - 2) * TILE);
          const targetY = clamp(sprite.y + Phaser.Math.Between(-30, 30), TILE * 2, (WORLD_H - 2) * TILE);
          sprite.setFlipX(targetX < sprite.x);
          this.tweens.add({
            targets: sprite,
            x: targetX,
            y: targetY,
            duration: 1600,
            ease: 'Sine.inOut',
            onUpdate: () => {
              sprite.setDepth(sprite.y);
            }
          });
        });
      }
    });
    this.stormTimer = this.time.addEvent({
      delay: 7000,
      loop: true,
      callback: () => {
        if (this.state.paused) return;
        if (this.state.data.weather === 'storm') {
          this.cameras.main.flash(140, 190, 210, 255);
        }
      }
    });
    this.autosaveTimer = window.setInterval(() => {
      if (!this.state.paused) void this.saveGame();
    }, 45000);
  }

  // ------------------------------------------------------------------ world

  private buildGround(): void {
    this.groundImages.forEach((img) => img.destroy());
    this.groundImages = [];
    this.waterImages = [];
    const season = this.state.data.season;

    for (let y = 0; y < WORLD_H; y++) {
      for (let x = 0; x < WORLD_W; x++) {
        const key = tileKey(x, y);
        const px = x * TILE;
        const py = y * TILE;
        if (isWaterTile(x, y)) {
          const img = this.add.image(px, py, 'water0').setOrigin(0).setScale(2).setDepth(1);
          this.waterImages.push({ image: img, frame: 0 });
          this.groundImages.push(img);
          continue;
        }
        if (isPathTile(x, y)) {
          const img = this.add.image(px, py, 'path').setOrigin(0).setScale(2).setDepth(1);
          this.groundImages.push(img);
        } else {
          const variant = (x * 13 + y * 7) % 3;
          const img = this.add
            .image(px, py, `grass_${season}_${variant}`)
            .setOrigin(0)
            .setScale(2)
            .setDepth(0);
          this.groundImages.push(img);
        }

        const obstacle = isObstacleTile(x, y);
        if (obstacle) {
          const tree = this.add
            .image(px + TILE / 2, py + TILE, `tree_${season}`)
            .setOrigin(0.5, 1)
            .setScale(2)
            .setDepth(py + TILE);
          this.groundImages.push(tree);
        } else {
          const flower = FLOWERS.get(key);
          if (flower !== undefined) {
            const img = this.add
              .image(px + TILE / 2, py + TILE / 2, `flower_${flower}`)
              .setScale(2)
              .setDepth(3);
            this.groundImages.push(img);
          } else if (!isPathTile(x, y) && (x * 31 + y * 17) % 23 === 0) {
            const tuft = this.add
              .image(px + TILE / 2, py + TILE / 2, 'tuft')
              .setScale(2)
              .setAlpha(0.9)
              .setDepth(3);
            this.groundImages.push(tuft);
          }
        }
      }
    }
  }

  private buildFarmVisuals(): void {
    this.tileVisuals.forEach((vis) => {
      vis.soil.destroy();
      vis.crop?.destroy();
      vis.ready?.destroy();
    });
    this.tileVisuals.clear();
    for (const [key, tile] of Object.entries(this.state.data.tiles)) {
      if (!tile.tilled) continue;
      const [sx, sy] = key.split(',').map(Number);
      this.createTileVisual(sx, sy, tile.tilled, tile.watered, tile.fertilized, tile.crop?.id, tile.crop?.growth);
    }
  }

  private createTileVisual(
    x: number,
    y: number,
    tilled: boolean,
    watered: boolean,
    fertilized: boolean,
    cropId?: string,
    growth = 0
  ): void {
    if (!tilled) return;
    const key = tileKey(x, y);
    const soil = this.add
      .image(x * TILE + TILE / 2, y * TILE + TILE / 2, 'soil')
      .setScale(2)
      .setDepth(y * TILE + 4);
    const visual: TileVisual = { soil };
    if (cropId) {
      const def = CROPS[cropId];
      if (def) {
        const stage = Math.min(3, Math.floor((growth / Math.max(1, def.growthDays)) * 3));
        const crop = this.add
          .image(x * TILE + TILE / 2, y * TILE + TILE - 2, `crop_${cropId}_${stage}`)
          .setOrigin(0.5, 1)
          .setScale(2)
          .setDepth(y * TILE + 20);
        visual.crop = crop;
        if (growth >= def.growthDays) visual.ready = this.createReadyMarker(x, y);
      }
    }
    this.updateSoilTexture(visual, watered, fertilized);
    this.tileVisuals.set(key, visual);
  }

  private updateSoilTexture(visual: TileVisual, watered: boolean, fertilized: boolean): void {
    visual.soil.setTexture(fertilized ? 'soil_fert' : watered ? 'soil_wet' : 'soil');
  }

  private createReadyMarker(x: number, y: number): Phaser.GameObjects.Text {
    return this.add
      .text(x * TILE + TILE / 2, y * TILE - 7, '!', {
        fontFamily: '"Courier New", monospace',
        fontSize: '15px',
        color: '#ffe066',
        stroke: '#2a1a0a',
        strokeThickness: 4
      })
      .setOrigin(0.5, 1)
      .setDepth(y * TILE + 22);
  }

  private refreshTile(x: number, y: number): void {
    const key = tileKey(x, y);
    const tile = this.state.tileAt(x, y);
    const vis = this.tileVisuals.get(key);
    if (!tile || !tile.tilled) {
      vis?.soil.destroy();
      vis?.crop?.destroy();
      vis?.ready?.destroy();
      this.tileVisuals.delete(key);
      return;
    }
    if (!vis) {
      this.createTileVisual(
        x,
        y,
        true,
        tile.watered,
        tile.fertilized,
        tile.crop?.id,
        tile.crop?.growth ?? 0
      );
      return;
    }
    this.updateSoilTexture(vis, tile.watered, tile.fertilized);
    if (tile.crop) {
      const def = CROPS[tile.crop.id];
      if (def) {
        const stage = Math.min(3, Math.floor((tile.crop.growth / Math.max(1, def.growthDays)) * 3));
        if (!vis.crop) {
          vis.crop = this.add
            .image(x * TILE + TILE / 2, y * TILE + TILE - 2, `crop_${tile.crop.id}_${stage}`)
            .setOrigin(0.5, 1)
            .setScale(2)
            .setDepth(y * TILE + 20);
        } else {
          vis.crop.setTexture(`crop_${tile.crop.id}_${stage}`);
        }
      }
    } else if (vis.crop) {
      vis.crop.destroy();
      vis.crop = undefined;
    }

    const mature = tile.crop ? this.state.cropMature(x, y) : false;
    if (mature && !vis.ready) {
      vis.ready = this.createReadyMarker(x, y);
    } else if (!mature && vis.ready) {
      vis.ready.destroy();
      vis.ready = undefined;
    }
  }

  private buildBuildings(): void {
    this.buildingSprites.forEach((sprite) => sprite.destroy());
    this.buildingSprites.clear();
    this.blockedBuildings.clear();

    for (const building of this.state.data.buildings) {
      const def = BUILDINGS[building.id];
      if (!def) continue;
      const sprite = this.add
        .image(building.x * TILE, building.y * TILE, `b_${building.id}`)
        .setOrigin(0)
        .setScale(2)
        .setDepth((building.y + def.h) * TILE);
      this.buildingSprites.set(building.uid, sprite);
      if (def.kind !== 'decor') {
        for (let y = building.y; y < building.y + def.h; y++) {
          for (let x = building.x; x < building.x + def.w; x++) {
            this.blockedBuildings.add(tileKey(x, y));
          }
        }
      }
    }
  }

  private buildLockedPlots(): void {
    this.plotDecor.forEach((obj) => obj.destroy());
    this.plotDecor = [];
    const state = this.state.data;
    for (const plot of PLOTS) {
      if (plot.id < state.unlockedPlots) continue;
      const perimeter: Array<[number, number]> = [];
      for (let x = plot.x; x < plot.x + plot.w; x++) {
        perimeter.push([x, plot.y - 1], [x, plot.y + plot.h]);
      }
      for (let y = plot.y; y < plot.y + plot.h; y++) {
        perimeter.push([plot.x - 1, y], [plot.x + plot.w, y]);
      }
      for (const [x, y] of perimeter) {
        if (isWaterTile(x, y) || isObstacleTile(x, y) || isPathTile(x, y)) continue;
        const fence = this.add
          .image(x * TILE, y * TILE, 'b_fence')
          .setOrigin(0)
          .setScale(2)
          .setAlpha(0.9)
          .setDepth(y * TILE + 2);
        this.plotDecor.push(fence);
      }
      const label = this.add
        .text(plot.x * TILE + (plot.w * TILE) / 2, plot.y * TILE + (plot.h * TILE) / 2, `${plot.name}\n${plot.cost} coins`, {
          fontFamily: '"Courier New", monospace',
          fontSize: '14px',
          color: '#ffe9b0',
          backgroundColor: '#20381f',
          padding: { x: 6, y: 4 },
          align: 'center'
        })
        .setOrigin(0.5)
        .setDepth(700)
        .setAlpha(0.95);
      this.plotDecor.push(label);
    }
  }

  // ----------------------------------------------------------------- player

  private createPlayer(): void {
    const p = this.state.data.player;
    this.playerShadow = this.add.image(p.x, p.y, 'shadow').setScale(1.6).setAlpha(0.6);
    this.player = this.add.sprite(p.x, p.y, `player_${this.facing}_0`).setOrigin(0.5, 1).setScale(2);
    this.player.setDepth(p.y);
    this.playerShadow.setDepth(p.y - 1);
  }

  private setupCamera(): void {
    this.cameras.main.setBounds(0, 0, WORLD_W * TILE, WORLD_H * TILE);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setRoundPixels(true);
    this.cameras.main.setBackgroundColor('#4f8c3a');
  }

  private setupInput(): void {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys('W,A,S,D') as typeof this.wasd;
    this.input.mouse?.disableContextMenu();

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.state.paused || this.sleeping) return;
      const wp = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      if (pointer.rightButtonDown()) {
        if (this.buildMode) {
          this.setBuildMode(null);
          this.ui.buildPlaced();
          this.ui.notify('Placement cancelled.', 'info');
        }
        return;
      }
      if (this.buildMode) {
        if (pointer.wasTouch) this.previewTouchBuild(wp.x, wp.y);
        else this.tryPlaceBuild(wp.x, wp.y);
        return;
      }
      this.handleWorldClick(wp.x, wp.y);
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.state.paused) return;
      const wp = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      if (this.buildMode) this.updateGhost(wp.x, wp.y);
      else this.updateHover(wp.x, wp.y);
    });
  }

  private isFootBlocked(x: number, y: number): boolean {
    const points: Array<[number, number]> = [
      [x - 8, y - 2],
      [x + 8, y - 2],
      [x - 8, y - 12],
      [x + 8, y - 12]
    ];
    for (const [px, py] of points) {
      const tx = Math.floor(px / TILE);
      const ty = Math.floor(py / TILE);
      if (tx < 0 || ty < 0 || tx >= WORLD_W || ty >= WORLD_H) return true;
      const key = tileKey(tx, ty);
      if (isWaterTile(tx, ty) || isObstacleTile(tx, ty) || this.blockedBuildings.has(key)) return true;
    }
    return false;
  }

  // ---------------------------------------------------------------- actions

  private handleWorldClick(wx: number, wy: number): void {
    const clickedAnimal = this.animalAt(wx, wy);
    if (clickedAnimal) {
      this.interactWithAnimal(clickedAnimal);
      return;
    }
    const { x, y } = worldToTile(wx, wy);
    this.performTileAction(x, y);
  }

  private animalAt(wx: number, wy: number): string | null {
    let bestUid: string | null = null;
    let bestDist = Infinity;
    for (const [uid, view] of Array.from(this.animalViews.entries())) {
      const b = view.sprite.getBounds();
      if (!Phaser.Geom.Rectangle.Contains(b, wx, wy)) continue;
      const dist = Phaser.Math.Distance.Between(wx, wy, view.sprite.x, view.sprite.y);
      if (dist < bestDist) {
        bestDist = dist;
        bestUid = uid;
      }
    }
    if (!bestUid) return null;
    const animal = this.state.getAnimal(bestUid);
    if (!animal) return null;
    const near = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      animal.x,
      animal.y
    ) <= TILE * 3;
    return near ? bestUid : null;
  }

  private interactWithAnimal(uid: string): void {
    const animal = this.state.getAnimal(uid);
    if (!animal) return;
    if (animal.productReady) {
      const res = this.state.collectAnimal(uid);
      this.ui.notify(res.message ?? '', res.ok ? 'success' : 'error');
      if (res.ok) {
        audio.play('harvest');
        this.floatText(`+1 ${ITEMS[ANIMALS[animal.species]?.productId ?? '']?.name ?? 'product'}`, 0xffe080, animal.x, animal.y - 30);
        void this.saveGame();
      } else {
        audio.play('error');
      }
    } else {
      const res = this.state.petAnimal(uid);
      this.ui.notify(res.message ?? '', res.ok ? 'success' : 'error');
      audio.play(res.ok ? 'animal' : 'error');
      if (res.ok) this.floatText('♥', 0xff9ab0, animal.x, animal.y - 30);
    }
    this.syncAnimalBubbles();
  }

  private performTileAction(x: number, y: number): void {
    if (!this.state.isWithinInteraction(x, y)) {
      this.ui.notify('Move closer to work that tile.', 'error');
      audio.play('error');
      return;
    }
    const item = this.state.selectedItem();
    let result: { ok: boolean; message?: string } = { ok: false };
    let sfx: 'till' | 'water' | 'plant' | 'harvest' | 'error' = 'error';
    let particle: 'soil' | 'water' | 'sparkle' | null = null;

    if (this.state.cropMature(x, y)) {
      result = this.state.harvestAt(x, y);
      sfx = 'harvest';
      particle = 'sparkle';
    } else if (item === 'hoe') {
      result = this.state.tillAt(x, y);
      sfx = 'till';
      particle = 'soil';
    } else if (item === 'watering_can') {
      result = this.state.waterAt(x, y);
      sfx = 'water';
      particle = 'water';
    } else if (item === 'fertilizer') {
      result = this.state.fertilizeAt(x, y);
      sfx = 'till';
      particle = 'soil';
    } else if (item.endsWith('_seed')) {
      result = this.state.plantAt(x, y, item);
      sfx = 'plant';
      particle = 'sparkle';
    } else {
      this.ui.notify('Select a tool or seeds from the hotbar.', 'info');
      return;
    }

    if (result.ok) {
      audio.play(sfx);
      if (result.message) this.ui.notify(result.message, 'success');
      this.playSwing();
      if (particle) this.spawnActionParticles(x, y, particle);
      const wx = x * TILE + TILE / 2;
      const wy = y * TILE + TILE / 2;
      if (this.state.cropMature(x, y)) {
        this.floatText('Ready to harvest', 0xffe080, wx, wy - 20);
      }
      this.refreshTileAndNeighbours(x, y);
      this.syncAnimalBubbles();
      void this.saveGame();
    } else {
      audio.play('error');
      if (result.message) this.ui.notify(result.message, 'error');
    }
  }

  private refreshTileAndNeighbours(x: number, y: number): void {
    const radius = 2;
    for (let yy = y - radius; yy <= y + radius; yy++) {
      for (let xx = x - radius; xx <= x + radius; xx++) {
        if (!this.state.tileAt(xx, yy)) {
          const vis = this.tileVisuals.get(tileKey(xx, yy));
          if (vis) this.refreshTile(xx, yy);
          continue;
        }
        this.refreshTile(xx, yy);
      }
    }
  }

  private useNearby(): void {
    if (this.state.paused || this.sleeping) return;
    let closest: string | null = null;
    let bestDist = Infinity;
    this.animalViews.forEach((view, uid) => {
      const animal = this.state.getAnimal(uid);
      if (!animal) return;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, animal.x, animal.y);
      if (dist < TILE * 2.4 && dist < bestDist) {
        bestDist = dist;
        closest = uid;
      }
    });
    if (closest) {
      this.interactWithAnimal(closest);
      return;
    }
    const dirs: Record<Facing, [number, number]> = {
      down: [0, 1],
      up: [0, -1],
      left: [-1, 0],
      right: [1, 0]
    };
    const [dx, dy] = dirs[this.facing];
    const tx = Math.floor(this.player.x / TILE) + dx;
    const ty = Math.floor(this.player.y / TILE) + dy;
    this.performTileAction(tx, ty);
  }

  // ------------------------------------------------------------------ build

  private setBuildMode(buildingId: string | null): void {
    this.buildMode = buildingId;
    this.pendingBuild = null;
    if (!buildingId) {
      this.ghost.setVisible(false);
      this.ghostGfx.clear();
      return;
    }
    const def = BUILDINGS[buildingId];
    if (!def) return;
    this.ghost.setTexture(`b_${buildingId}`);
    this.ghost.setVisible(true);
    this.hoverGfx.clear();
  }

  private previewTouchBuild(wx: number, wy: number): void {
    if (!this.buildMode) return;
    const { x, y } = worldToTile(wx, wy);
    const check = this.state.canPlaceBuilding(this.buildMode, x, y);
    this.updateGhost(wx, wy);
    if (!check.ok) {
      this.pendingBuild = null;
      this.ui.notify(check.message ?? 'Cannot place here.', 'error');
      audio.play('error');
      return;
    }
    if (this.pendingBuild?.x === x && this.pendingBuild?.y === y) {
      this.tryPlaceBuild(wx, wy);
      return;
    }
    this.pendingBuild = { x, y };
    this.ui.notify('Tap the highlighted spot again to confirm.', 'info');
  }

  private updateGhost(wx: number, wy: number): void {
    if (!this.buildMode) return;
    const def = BUILDINGS[this.buildMode];
    if (!def) return;
    const { x, y } = worldToTile(wx, wy);
    this.ghost.setVisible(true);
    this.ghost.setPosition(x * TILE, y * TILE);
    const check = this.state.canPlaceBuilding(this.buildMode, x, y);
    this.ghost.setTint(check.ok ? 0x9dffb0 : 0xff9a9a);
    this.ghost.setAlpha(0.7);
    this.ghostGfx.clear();
    for (let ty = y; ty < y + def.h; ty++) {
      for (let tx = x; tx < x + def.w; tx++) {
        this.ghostGfx.fillStyle(check.ok ? 0x4fbe6a : 0xd44a4a, 0.28);
        this.ghostGfx.fillRect(tx * TILE, ty * TILE, TILE, TILE);
        this.ghostGfx.lineStyle(1, check.ok ? 0x8fffa8 : 0xff8080, 0.8);
        this.ghostGfx.strokeRect(tx * TILE, ty * TILE, TILE, TILE);
      }
    }
  }

  private tryPlaceBuild(wx: number, wy: number): void {
    if (!this.buildMode) return;
    const def = BUILDINGS[this.buildMode];
    if (!def) return;
    const { x, y } = worldToTile(wx, wy);
    const check = this.state.canPlaceBuilding(this.buildMode, x, y);
    if (!check.ok) {
      this.ui.notify(check.message ?? 'Cannot place here.', 'error');
      audio.play('error');
      return;
    }
    const result = this.state.build(this.buildMode, x, y);
    this.ui.notify(result.message ?? '', result.ok ? 'success' : 'error');
    if (result.ok) {
      audio.play('craft');
      this.setBuildMode(null);
      this.ui.buildPlaced();
      this.buildBuildings();
      this.buildFarmVisuals();
      this.buildLockedPlots();
      this.refreshTileAndNeighbours(x, y);
      void this.saveGame();
    } else {
      audio.play('error');
    }
  }

  // ---------------------------------------------------------------- visuals

  private updateHover(wx: number, wy: number): void {
    const { x, y } = worldToTile(wx, wy);
    this.hoverGfx.clear();
    if (x < 0 || y < 0 || x >= WORLD_W || y >= WORLD_H) return;
    const within = this.state.isWithinInteraction(x, y);
    const mature = this.state.cropMature(x, y);
    const color = mature ? 0xffe082 : within ? 0xffffff : 0xff8a8a;
    this.hoverGfx.lineStyle(2, color, within || mature ? 0.9 : 0.5);
    this.hoverGfx.strokeRect(x * TILE + 1, y * TILE + 1, TILE - 2, TILE - 2);
    if (within) {
      this.hoverGfx.fillStyle(color, 0.08);
      this.hoverGfx.fillRect(x * TILE, y * TILE, TILE, TILE);
    }
  }

  private playSwing(): void {
    this.tweens.add({
      targets: this.player,
      angle: this.facing === 'left' ? -8 : this.facing === 'right' ? 8 : 0,
      scaleY: 1.94,
      duration: 90,
      yoyo: true,
      onComplete: () => {
        this.player.setAngle(0);
        this.player.setScale(2);
      }
    });
  }

  private spawnActionParticles(x: number, y: number, kind: 'soil' | 'water' | 'sparkle'): void {
    const texture = kind === 'water' ? 'water_drop' : kind === 'soil' ? 'sparkle' : 'sparkle';
    const baseX = x * TILE + TILE / 2;
    const baseY = y * TILE + TILE / 2;
    const color = kind === 'water' ? 0x9ad8f8 : kind === 'soil' ? 0xc9a06a : 0xffe9a0;
    for (let i = 0; i < 5; i++) {
      const img = this.add.image(baseX, baseY, texture).setDepth(820).setScale(1.6).setTint(color);
      this.tweens.add({
        targets: img,
        x: baseX + Phaser.Math.Between(-22, 22),
        y: baseY + Phaser.Math.Between(-26, -6),
        alpha: 0,
        scale: 0.5,
        duration: 500 + i * 30,
        onComplete: () => img.destroy()
      });
    }
  }

  private floatText(text: string, color: number, x: number, y: number): void {
    const label = this.add
      .text(x, y, text, {
        fontFamily: '"Courier New", monospace',
        fontSize: '13px',
        color: `#${color.toString(16).padStart(6, '0')}`,
        stroke: '#1a2a1a',
        strokeThickness: 3
      })
      .setOrigin(0.5)
      .setDepth(860);
    this.tweens.add({
      targets: label,
      y: y - 28,
      alpha: 0,
      duration: 1100,
      ease: 'Sine.out',
      onComplete: () => label.destroy()
    });
  }

  private createAnimals(): void {
    this.animalViews.forEach((v) => {
      v.sprite.destroy();
      v.bubble.destroy();
    });
    this.animalViews.clear();
    for (const animal of this.state.data.animals) {
      const def = ANIMALS[animal.species];
      if (!def) continue;
      const sprite = this.add
        .image(animal.x, animal.y, `animal_${animal.species}_0`)
        .setOrigin(0.5, 1)
        .setScale(this.state.animalMature(animal) ? 2 : 1.4)
        .setDepth(animal.y);
      sprite.setData('uid', animal.uid);
      const bubble = this.add
        .text(animal.x, animal.y - 44, '!', {
          fontFamily: '"Courier New", monospace',
          fontSize: '18px',
          color: '#ffe066',
          stroke: '#2a1a0a',
          strokeThickness: 4
        })
        .setOrigin(0.5)
        .setDepth(animal.y + 1)
        .setVisible(animal.productReady);
      this.animalViews.set(animal.uid, { sprite, bubble, species: animal.species, toggle: 0 });
    }
    this.syncAnimalBubbles();
  }

  private syncAnimals(): void {
    this.createAnimals();
    this.animalViews.forEach((view, uid) => {
      const animal = this.state.getAnimal(uid);
      if (!animal) return;
      view.sprite.setScale(this.state.animalMature(animal) ? 2 : 1.4);
    });
  }

  private syncAnimalBubbles(): void {
    this.animalViews.forEach((view, uid) => {
      const animal = this.state.getAnimal(uid);
      if (!animal) return;
      view.bubble.setVisible(animal.productReady);
      view.bubble.setPosition(animal.x, animal.y - 44);
      view.bubble.setDepth(animal.y + 1);
    });
  }

  // ------------------------------------------------------------------ sleep

  private sleep(): void {
    if (this.sleeping) return;
    this.sleeping = true;
    this.player.setPosition(this.player.x, this.player.y);
    audio.play('sleep');
    this.cameras.main.fadeOut(480, 6, 12, 24);
    this.time.delayedCall(520, () => {
      const summary: DaySummary = {
        ...this.state.advanceDay(),
        season: this.state.data.season,
        year: this.state.data.year
      };
      this.state.data.minute = START_MINUTE;
      this.facing = 'down';
      this.player.setTexture('player_down_0');
      this.updateLighting(0);
      this.cameras.main.fadeIn(520, 6, 12, 24);
      this.sleeping = false;
      void this.saveGame().then(() => {
        this.ui.showDaySummary(summary);
      });
    });
  }

  private async saveGame(quiet = false): Promise<void> {
    if (!this.player) return;
    this.state.setPlayer(this.player.x, this.player.y, this.facing);
    try {
      await SaveManager.save(this.slot, this.state.serialize());
      if (!quiet) {
        this.ui?.setSaveStatus(
          `Saved ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · slot ${this.slot}`
        );
      }
    } catch {
      this.ui?.setSaveStatus('Storage unavailable');
    }
  }

  private exitToMenu(): void {
    this.state.setPlayer(this.player.x, this.player.y, this.facing);
    void this.saveGame().finally(() => {
      this.ui?.destroy();
      this.scene.start('MenuScene');
    });
  }

  private cleanup(): void {
    if (this.autosaveTimer !== null) window.clearInterval(this.autosaveTimer);
    this.unsubs.forEach((fn) => fn());
    this.unsubs = [];
    this.waterFrameTimer?.remove();
    this.animalTimer?.remove();
    this.wanderTimer?.remove();
    this.stormTimer?.remove();
    this.ui?.destroy();
  }

  // ------------------------------------------------------------------ main

  private createLighting(): void {
    this.lightOverlay = this.add
      .rectangle(0, 0, this.scale.width, this.scale.height, 0x0a1630, 0)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(940);
    this.scale.on(Phaser.Scale.Events.RESIZE, () => {
      this.lightOverlay?.setSize(this.scale.width, this.scale.height);
      if (this.rainEmitter) {
        this.rainEmitter.setConfig({
          x: { min: 0, max: this.scale.width }
        });
      }
    });
  }

  private updateLighting(delta: number): void {
    this.lastLightUpdate += delta;
    if (this.lastLightUpdate < 400) return;
    this.lastLightUpdate = 0;
    const minute = this.state.data.minute;
    let color = 0x0a1630;
    let alpha = 0;
    if (minute < 390) {
      alpha = 0.34 * (1 - Math.max(0, (minute - 300) / 90));
      color = 0x2a3a60;
    } else if (minute < 480) {
      alpha = 0.18 * (1 - (minute - 390) / 90);
      color = 0xffb070;
    } else if (minute < 1020) {
      alpha = 0;
      color = 0xffffff;
    } else if (minute < 1140) {
      alpha = 0.24 * ((minute - 1020) / 120);
      color = 0xff9a60;
    } else {
      alpha = 0.24 + 0.24 * Math.min(1, (minute - 1140) / 120);
      color = 0x16244a;
    }
    if (this.state.data.weather === 'cloudy') alpha = Math.max(alpha, 0.1);
    if (this.state.data.weather === 'rain') alpha = Math.max(alpha, 0.16);
    if (this.state.data.weather === 'storm') alpha = Math.max(alpha, 0.26);
    if (this.lightOverlay) this.lightOverlay.setFillStyle(color, alpha);
  }

  private createWeather(): void {
    this.rainEmitter = this.add
      .particles(0, 0, 'rain', {
        x: { min: 0, max: this.scale.width },
        y: -12,
        lifespan: 1300,
        speedY: { min: 420, max: 620 },
        speedX: { min: -70, max: -20 },
        quantity: 2,
        frequency: 28,
        scale: { min: 0.7, max: 1.25 },
        alpha: { start: 0.9, end: 0.25 },
        blendMode: Phaser.BlendModes.NORMAL
      })
      .setScrollFactor(0)
      .setDepth(900);
    this.rainEmitter.stop();
  }

  private applyWeather(): void {
    if (!this.rainEmitter) return;
    const w = this.state.data.weather;
    if (w === 'rain' || w === 'storm') this.rainEmitter.start();
    else this.rainEmitter.stop();
  }

  update(_time: number, delta: number): void {
    if (!this.player) return;
    const dt = Math.min(delta, 80) / 1000;

    if (!this.state.paused && !this.sleeping) {
      const boots = this.state.data.upgrades.boots ?? 0;
      let speed = 122 * (1 + boots * 0.12);
      const feetTile = worldToTile(this.player.x, this.player.y);
      if (isPathTile(feetTile.x, feetTile.y)) speed *= 1.25;

      let ix = 0;
      let iy = 0;
      if (this.cursors.left.isDown || this.wasd.A.isDown) ix -= 1;
      if (this.cursors.right.isDown || this.wasd.D.isDown) ix += 1;
      if (this.cursors.up.isDown || this.wasd.W.isDown) iy -= 1;
      if (this.cursors.down.isDown || this.wasd.S.isDown) iy += 1;
      const joy = this.ui?.getJoystick();
      if (joy && (Math.abs(joy.x) > 0.18 || Math.abs(joy.y) > 0.18)) {
        ix = joy.x;
        iy = joy.y;
      }
      const len = Math.hypot(ix, iy);
      if (len > 1) {
        ix /= len;
        iy /= len;
      }
      const moving = Math.abs(ix) > 0.05 || Math.abs(iy) > 0.05;
      if (moving) {
        const nx = this.player.x + ix * speed * dt;
        if (!this.isFootBlocked(nx, this.player.y)) {
          this.player.x = nx;
        }
        const ny = this.player.y + iy * speed * dt;
        if (!this.isFootBlocked(this.player.x, ny)) {
          this.player.y = ny;
        }
        this.player.x = clamp(this.player.x, TILE, (WORLD_W - 1) * TILE);
        this.player.y = clamp(this.player.y, TILE * 1.5, (WORLD_H - 1) * TILE);
        if (Math.abs(ix) > Math.abs(iy)) this.facing = ix > 0 ? 'right' : 'left';
        else this.facing = iy > 0 ? 'down' : 'up';
        this.player.anims.play(`walk_${this.facing}`, true);
        if (this.ui) this.ui.noteMovement(Math.abs(ix * speed * dt) + Math.abs(iy * speed * dt));
      } else {
        this.player.anims.stop();
        this.player.setTexture(`player_${this.facing}_0`);
      }
      this.player.setFlipX(this.facing === 'left');
      this.player.setDepth(this.player.y);
      this.playerShadow.setPosition(this.player.x, this.player.y);
      this.playerShadow.setDepth(this.player.y - 1);
      this.state.data.player = { x: this.player.x, y: this.player.y, facing: this.facing };

      const ended = this.state.tickClock(delta);
      if (ended) this.sleep();
    } else {
      this.player.anims.stop();
    }

    this.updateLighting(delta);
    this.updateAnimalBubbles();
    this.updateHoverFromPointer();
  }

  private updateAnimalBubbles(): void {
    this.animalViews.forEach((view, uid) => {
      const animal = this.state.getAnimal(uid);
      if (!animal) return;
      view.bubble.setPosition(animal.x, animal.y - 44);
    });
  }

  private updateHoverFromPointer(): void {
    if (this.state.paused || this.buildMode) return;
    const pointer = this.input.activePointer;
    if (!pointer || !pointer.manager || !pointer.active) return;
    const wp = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    this.updateHover(wp.x, wp.y);
  }

  // Debug helper used by tests / dev console
  debugSummary(): string {
    return `${SEASON_INFO[this.state.data.season].name} ${this.state.data.day} · ${WEATHER_INFO[this.state.data.weather].name} · ${formatTime(this.state.data.minute)} · plots ${plotIndexAt(Math.floor(this.player.x / TILE), Math.floor(this.player.y / TILE))}`;
  }
}

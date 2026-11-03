import Phaser from 'phaser';
import {
  ANIMALS,
  BUILDINGS,
  CROPS,
  ITEMS,
  NPC_SPOTS,
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
  MINE_NODES,
  fenceRing,
  isBlockedBase,
  isFenceTile,
  isMineNodeTile,
  isObstacleTile,
  isPathTile,
  isPlotInterior,
  isWaterTile,
  mineNodeAt,
  plotIndexAt,
  worldToTile
} from '../../systems/world';
import { GameUI } from '../../ui/gameUI';
import type { DaySummary, Facing, Season } from '../../types';

interface AnimalView {
  sprite: Phaser.GameObjects.Image;
  shadow: Phaser.GameObjects.Image;
  bubble: Phaser.GameObjects.Text;
  species: string;
  toggle: number;
}

interface TileVisual {
  soil: Phaser.GameObjects.Image;
  shadow?: Phaser.GameObjects.Image;
  crop?: Phaser.GameObjects.Image;
  ready?: Phaser.GameObjects.Text;
}

interface NpcView {
  sprite: Phaser.GameObjects.Image;
  shadow: Phaser.GameObjects.Image;
  label: Phaser.GameObjects.Text;
  homeX: number;
  homeY: number;
  tx: number;
  ty: number;
  waitUntil: number;
  greeted: boolean;
  facing: 'left' | 'right';
}

interface LightSource {
  image: Phaser.GameObjects.Image;
  strength: number;
  phase: number;
}

interface MineView {
  sprite: Phaser.GameObjects.Image;
  shadow: Phaser.GameObjects.Image;
  label: Phaser.GameObjects.Text;
}

function randomRectSource(rect: Phaser.Geom.Rectangle): Phaser.Types.GameObjects.Particles.RandomZoneSource {
  return {
    getRandomPoint: (point: Phaser.Types.Math.Vector2Like): void => {
      point.x = rect.x + Math.random() * rect.width;
      point.y = rect.y + Math.random() * rect.height;
    }
  };
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
  private zoomLevel = 1;
  private baseZoom = 1;

  private groundBase?: Phaser.GameObjects.TileSprite;
  private groundImages: Phaser.GameObjects.GameObject[] = [];
  private waterImages: Array<{ image: Phaser.GameObjects.Image; frame: number }> = [];
  private weatherPuddles: Phaser.GameObjects.Image[] = [];
  private plotDecor: Array<Phaser.GameObjects.GameObject> = [];
  private festivalDecor: Phaser.GameObjects.GameObject[] = [];
  private tileVisuals = new Map<string, TileVisual>();
  private buildingSprites = new Map<string, Phaser.GameObjects.Image>();
  private buildingShadows: Phaser.GameObjects.Image[] = [];
  private lightSources: LightSource[] = [];
  private animalViews = new Map<string, AnimalView>();
  private npcViews = new Map<string, NpcView>();
  private mineViews = new Map<string, MineView>();
  private blockedBuildings = new Set<string>();
  private lastNpcCheck = 0;
  private fireflies: Phaser.GameObjects.Image[] = [];
  private butterflies: Array<{ image: Phaser.GameObjects.Image; variant: number }> = [];
  private birds: Phaser.GameObjects.Image[] = [];
  private ambientFrame = 0;

  private hoverGfx!: Phaser.GameObjects.Graphics;
  private ghost!: Phaser.GameObjects.Image;
  private ghostGfx!: Phaser.GameObjects.Graphics;
  private lightOverlay?: Phaser.GameObjects.Rectangle;
  private ambientOverlay?: Phaser.GameObjects.Graphics;
  private vignetteOverlay?: Phaser.GameObjects.Image;
  private rainEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;
  private splashEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;
  private snowEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;
  private leafEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;
  private rainZone?: Phaser.Geom.Rectangle;
  private splashZone?: Phaser.Geom.Rectangle;
  private snowZone?: Phaser.Geom.Rectangle;
  private leafZone?: Phaser.Geom.Rectangle;

  private dragLastTile: string | null = null;
  private nightWarnedDay = -1;
  private cropLabel?: Phaser.GameObjects.Text;
  private buildMode: string | null = null;
  private pendingBuild: { x: number; y: number } | null = null;
  private sleeping = false;
  private forageViews: Phaser.GameObjects.Image[] = [];
  private lastGroundSeason: Season | null = null;
  private lastLightUpdate = 0;
  private waterFrameTimer?: Phaser.Time.TimerEvent;
  private waterRippleTimer?: Phaser.Time.TimerEvent;
  private ambientFrameTimer?: Phaser.Time.TimerEvent;
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
    this.zoomLevel = 1;
    this.sleeping = false;
    this.buildMode = null;
    this.pendingBuild = null;
    this.lastGroundSeason = null;
  }

  create(): void {
    this.lightOverlay = undefined;
    this.ambientOverlay = undefined;
    this.vignetteOverlay = undefined;
    this.rainEmitter = undefined;
    this.splashEmitter = undefined;
    this.snowEmitter = undefined;
    this.leafEmitter = undefined;
    this.rainZone = undefined;
    this.splashZone = undefined;
    this.snowZone = undefined;
    this.leafZone = undefined;
    this.groundBase = undefined;
    this.groundImages = [];
    this.waterImages = [];
    this.weatherPuddles = [];
    this.plotDecor = [];
    this.festivalDecor = [];
    this.buildingShadows = [];
    this.lightSources = [];
    this.fireflies = [];
    this.butterflies = [];
    this.birds = [];
    this.tileVisuals.clear();
    this.buildingSprites.clear();
    this.animalViews.clear();
    this.npcViews.clear();
    this.mineViews.clear();
    this.blockedBuildings.clear();
    this.lastNpcCheck = 0;

    this.buildGround();
    this.lastGroundSeason = this.state.data.season;
    this.buildFarmVisuals();
    this.buildBuildings();
    this.buildLockedPlots();
    this.buildMineNodes();
    this.buildNpcs();
    this.drawForage();
    this.buildFestivalDecor();
    this.createAnimals();
    this.createPlayer();
    this.setupCamera();
    this.setupInput();
    this.createLighting();
    this.createWeather();
    this.createAmbientWildlife();
    this.hoverGfx = this.add.graphics().setDepth(850);
    this.ghostGfx = this.add.graphics().setDepth(851);
    this.ghost = this.add.image(0, 0, 'b_coop').setVisible(false).setAlpha(0.7).setDepth(852);

    this.setupUI();
    this.registerStateEvents();
    this.startTimers();
    this.lastLightUpdate = 400;
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
      actionButton: () => this.useNearby(),
      panelClosed: () => this.resumeNpcWalks()
    });
    this.ui.mount();
    this.ui.setSaveStatus(`Saved locally · slot ${this.slot}`);
  }

  private registerStateEvents(): void {
    this.unsubs.push(
      this.state.emitter.on('day', () => {
        if (this.lastGroundSeason !== this.state.data.season) {
          this.buildGround();
          this.createAmbientWildlife();
          this.lastGroundSeason = this.state.data.season;
        }
        this.buildFarmVisuals();
        this.buildMineNodes();
        this.buildNpcs();
        this.buildFestivalDecor();
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
    this.waterRippleTimer = this.time.addEvent({
      delay: 1200,
      loop: true,
      callback: () => {
        if (this.state.paused || this.waterImages.length === 0) return;
        const spot = this.waterImages[Phaser.Math.Between(0, this.waterImages.length - 1)].image;
        this.spawnWaterRipple(spot.x + Phaser.Math.Between(8, TILE * 2 - 8), spot.y + Phaser.Math.Between(8, TILE * 2 - 8));
      }
    });
    this.ambientFrameTimer = this.time.addEvent({
      delay: 180,
      loop: true,
      callback: () => {
        if (this.state.paused) return;
        this.ambientFrame ^= 1;
        for (const butterfly of this.butterflies) {
          butterfly.image.setTexture(`butterfly_${butterfly.variant}_${this.ambientFrame}`);
        }
        for (const bird of this.birds) bird.setTexture(`bird_${this.ambientFrame}`);
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
          if (!audio.settings.reduceFlashing) this.cameras.main.flash(140, 190, 210, 255);
        }
      }
    });
    this.autosaveTimer = window.setInterval(() => {
      if (!this.state.paused) void this.saveGame();
    }, 45000);
  }

  // ------------------------------------------------------------------ world

  private buildGround(): void {
    this.groundBase?.destroy();
    this.tweens.killTweensOf(this.groundImages);
    this.groundImages.forEach((img) => img.destroy());
    this.groundImages = [];
    this.waterImages = [];
    const season = this.state.data.season;
    const seasonIndex = ['spring', 'summer', 'fall', 'winter'].indexOf(season);
    const edgeColor = SEASON_INFO[season].grass2;
    const edges = this.add.graphics().setDepth(2);
    this.groundImages.push(edges);

    this.groundBase = this.add
      .tileSprite(0, 0, WORLD_W * TILE, WORLD_H * TILE, `field_${season}`)
      .setOrigin(0)
      .setTileScale(2)
      .setDepth(-1);

    for (let y = 0; y < WORLD_H; y++) {
      for (let x = 0; x < WORLD_W; x++) {
        const key = tileKey(x, y);
        const px = x * TILE;
        const py = y * TILE;
        const roll = (x * 37 + y * 61 + seasonIndex * 53) % 41;
        if (isWaterTile(x, y)) {
          const img = this.add.image(px, py, 'water0').setOrigin(0).setScale(2).setDepth(2);
          this.waterImages.push({ image: img, frame: 0 });
          this.groundImages.push(img);
          this.drawShore(edges, x, y, px, py, roll);
          if (roll % 17 === 0) {
            const reed = this.add
              .image(px + 6 + (roll % 3) * 9, py + TILE - 2, 'reed')
              .setOrigin(0.5, 1)
              .setScale(1.7)
              .setDepth(py + TILE + 1);
            this.groundImages.push(reed);
          }
          if (roll % 23 === 0) {
            const pad = this.add
              .image(px + TILE / 2, py + TILE / 2, 'lilypad')
              .setScale(1.8)
              .setAlpha(0.92)
              .setDepth(4);
            this.groundImages.push(pad);
          }
          if (roll === 7) {
            const glint = this.add
              .image(px + TILE / 2, py + TILE / 2, 'sparkle')
              .setTint(0xe8fbff)
              .setScale(1.2)
              .setAlpha(0.35)
              .setDepth(4);
            this.tweens.add({
              targets: glint,
              alpha: { from: 0.12, to: 0.72 },
              scale: { from: 0.8, to: 1.35 },
              duration: 1200 + (roll % 5) * 220,
              yoyo: true,
              repeat: -1,
              delay: roll * 20,
              ease: 'Sine.inOut'
            });
            this.groundImages.push(glint);
          }
          continue;
        }
        if (isPathTile(x, y)) {
          const img = this.add.image(px, py, 'path').setOrigin(0).setScale(2).setDepth(1);
          this.groundImages.push(img);
          this.drawPathFringe(edges, x, y, px, py, edgeColor);
          continue;
        }

        const obstacle = isObstacleTile(x, y);
        if (obstacle) {
          const shadow = this.add
            .image(px + TILE / 2, py + TILE - 2, 'shadow_soft')
            .setScale(0.72)
            .setAlpha(0.7)
            .setDepth(py + TILE - 2);
          this.groundImages.push(shadow);
          const tree = this.add
            .image(px + TILE / 2, py + TILE, `tree_${season}`)
            .setOrigin(0.5, 1)
            .setScale(2)
            .setDepth(py + TILE);
          this.tweens.add({
            targets: tree,
            angle: { from: -0.7, to: 0.7 },
            duration: 2300 + (roll % 9) * 210,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut',
            delay: roll * 28
          });
          this.groundImages.push(tree);
          continue;
        }

        const flower = FLOWERS.get(key);
        if (flower !== undefined) {
          const img = this.add
            .image(px + TILE / 2, py + TILE / 2, `flower_${flower}`)
            .setScale(2)
            .setDepth(3);
          this.tweens.add({
            targets: img,
            angle: { from: -2, to: 2 },
            duration: 1800 + (roll % 7) * 240,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut',
            delay: roll * 33
          });
          this.groundImages.push(img);
          continue;
        }

        const offsetX = 6 + ((roll * 7) % 20);
        const offsetY = 6 + ((roll * 11) % 20);
        if (roll === 0 || roll === 19) {
          const pebble = this.add
            .image(px + offsetX, py + offsetY, roll === 0 ? 'pebble_0' : 'pebble_1')
            .setScale(1.6)
            .setDepth(2);
          this.groundImages.push(pebble);
        } else if (roll === 2 || roll === 27) {
          const patch = this.add
            .image(px + offsetX, py + offsetY, 'dirt_patch')
            .setScale(1.7)
            .setAlpha(0.8)
            .setDepth(2);
          this.groundImages.push(patch);
        } else if (roll === 4 || roll === 31) {
          const tuft = this.add
            .image(px + offsetX, py + offsetY, 'tuft')
            .setScale(1.7)
            .setAlpha(0.88)
            .setDepth(3);
          this.tweens.add({
            targets: tuft,
            angle: { from: -2.5, to: 2.5 },
            duration: 1900 + (roll % 8) * 200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut',
            delay: roll * 25
          });
          this.groundImages.push(tuft);
        } else if (season === 'winter' && (roll === 6 || roll === 33)) {
          const snow = this.add
            .image(px + offsetX, py + offsetY, 'snow_patch')
            .setScale(1.5)
            .setAlpha(0.75)
            .setDepth(2);
          this.groundImages.push(snow);
        } else if (season === 'fall' && roll === 8) {
          const leaf = this.add
            .image(px + offsetX, py + offsetY, 'leaf')
            .setScale(1.5)
            .setAlpha(0.85)
            .setDepth(3);
          this.groundImages.push(leaf);
        }
      }
    }
  }

  private drawPathFringe(
    gfx: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    px: number,
    py: number,
    color: number
  ): void {
    gfx.fillStyle(color, 0.72);
    if (!isPathTile(x, y - 1) && !isWaterTile(x, y - 1)) {
      for (const ox of [4, 12, 23]) gfx.fillRect(px + ox, py - 2, 2, 4);
    }
    if (!isPathTile(x, y + 1) && !isWaterTile(x, y + 1)) {
      for (const ox of [7, 17, 27]) gfx.fillRect(px + ox, py + TILE - 1, 2, 4);
    }
    if (!isPathTile(x - 1, y) && !isWaterTile(x - 1, y)) {
      for (const oy of [5, 15, 24]) gfx.fillRect(px - 2, py + oy, 4, 2);
    }
    if (!isPathTile(x + 1, y) && !isWaterTile(x + 1, y)) {
      for (const oy of [8, 18]) gfx.fillRect(px + TILE - 1, py + oy, 4, 2);
    }
  }

  private drawShore(
    gfx: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    px: number,
    py: number,
    roll: number
  ): void {
    const foam = 0xdaf6ff;
    const water = 0x4d8fae;
    if (!isWaterTile(x, y - 1)) {
      gfx.fillStyle(water, 0.8);
      gfx.fillRect(px, py, TILE, 2);
      gfx.fillStyle(foam, 0.55);
      gfx.fillRect(px + (roll % 5), py + 1, TILE - 6, 2);
    }
    if (!isWaterTile(x, y + 1)) {
      gfx.fillStyle(water, 0.8);
      gfx.fillRect(px, py + TILE - 2, TILE, 2);
      gfx.fillStyle(foam, 0.45);
      gfx.fillRect(px + 4, py + TILE - 3, TILE - 8, 2);
    }
    if (!isWaterTile(x - 1, y)) {
      gfx.fillStyle(water, 0.8);
      gfx.fillRect(px, py, 2, TILE);
      gfx.fillStyle(foam, 0.45);
      gfx.fillRect(px + 1, py + (roll % 6), 2, TILE - 8);
    }
    if (!isWaterTile(x + 1, y)) {
      gfx.fillStyle(water, 0.8);
      gfx.fillRect(px + TILE - 2, py, 2, TILE);
      gfx.fillStyle(foam, 0.45);
      gfx.fillRect(px + TILE - 3, py + 5, 2, TILE - 10);
    }
  }

  private drawForage(): void {
    if (this.forageViews) {
      this.forageViews.forEach((sprite) => sprite.destroy());
    }
    this.forageViews = [];
    for (const spot of this.state.data.forage ?? []) {
      const sprite = this.add
        .image(spot.x * TILE + TILE / 2, spot.y * TILE + TILE / 2, `icon_${spot.itemId}`)
        .setDepth(540)
        .setScale(0.7);
      sprite.setAlpha(0.95);
      this.tweens.add({
        targets: sprite,
        y: sprite.y - 2,
        duration: 1400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut'
      });
      this.forageViews.push(sprite);
    }
  }

  private buildFarmVisuals(): void {
    this.tileVisuals.forEach((vis) => {
      this.tweens.killTweensOf([vis.crop, vis.ready]);
      vis.soil.destroy();
      vis.shadow?.destroy();
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
        const shadow = this.add
          .image(x * TILE + TILE / 2, y * TILE + TILE - 3, 'shadow')
          .setScale(1.35, 0.9)
          .setAlpha(0.28)
          .setDepth(y * TILE + 14);
        const crop = this.add
          .image(x * TILE + TILE / 2, y * TILE + TILE - 2, `crop_${cropId}_${stage}`)
          .setOrigin(0.5, 1)
          .setScale(2)
          .setDepth(y * TILE + 20);
        this.tweens.add({
          targets: crop,
          angle: { from: -1.4, to: 1.4 },
          duration: 1700 + ((x * 13 + y * 7) % 8) * 180,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.inOut',
          delay: (x * 37 + y * 19) % 1200
        });
        visual.shadow = shadow;
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
    const marker = this.add
      .text(x * TILE + TILE / 2, y * TILE - 7, '!', {
        fontFamily: '"Courier New", monospace',
        fontSize: '15px',
        color: '#ffe066',
        stroke: '#2a1a0a',
        strokeThickness: 4
      })
      .setOrigin(0.5, 1)
      .setDepth(y * TILE + 22);
    this.tweens.add({
      targets: marker,
      y: marker.y - 4,
      scale: { from: 0.94, to: 1.08 },
      duration: 720,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut'
    });
    return marker;
  }

  private refreshTile(x: number, y: number): void {
    const key = tileKey(x, y);
    const tile = this.state.tileAt(x, y);
    const vis = this.tileVisuals.get(key);
    if (!tile || !tile.tilled) {
      vis?.soil.destroy();
      vis?.shadow?.destroy();
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
          vis.shadow = this.add
            .image(x * TILE + TILE / 2, y * TILE + TILE - 3, 'shadow')
            .setScale(1.35, 0.9)
            .setAlpha(0.28)
            .setDepth(y * TILE + 14);
          vis.crop = this.add
            .image(x * TILE + TILE / 2, y * TILE + TILE - 2, `crop_${tile.crop.id}_${stage}`)
            .setOrigin(0.5, 1)
            .setScale(2)
            .setDepth(y * TILE + 20);
          this.tweens.add({
            targets: vis.crop,
            angle: { from: -1.4, to: 1.4 },
            duration: 1700 + ((x * 13 + y * 7) % 8) * 180,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut',
            delay: (x * 37 + y * 19) % 1200
          });
        } else {
          vis.crop.setTexture(`crop_${tile.crop.id}_${stage}`);
        }
      }
    } else if (vis.crop) {
      vis.crop.destroy();
      vis.crop = undefined;
      vis.shadow?.destroy();
      vis.shadow = undefined;
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
    this.buildingShadows.forEach((shadow) => shadow.destroy());
    this.buildingShadows = [];
    this.lightSources.forEach((source) => source.image.destroy());
    this.lightSources = [];
    this.blockedBuildings.clear();

    for (const building of this.state.data.buildings) {
      const def = BUILDINGS[building.id];
      if (!def) continue;
      const depth = (building.y + def.h) * TILE;
      const bx = building.x * TILE;
      const by = building.y * TILE;
      const shadow = this.add
        .image(bx + (def.w * TILE) / 2, by + def.h * TILE - 4, 'shadow_soft')
        .setScale((def.w * TILE) / 64, 0.7)
        .setAlpha(0.7)
        .setDepth(depth - 2);
      this.buildingShadows.push(shadow);
      const sprite = this.add
        .image(bx, by, `b_${building.id}`)
        .setOrigin(0)
        .setScale(2)
        .setDepth(depth);
      this.buildingSprites.set(building.uid, sprite);
      this.addBuildingGlow(bx, by, def.id, def.w, def.h, depth, building.x * 3 + building.y * 5);
      if (def.kind !== 'decor') {
        for (let y = building.y; y < building.y + def.h; y++) {
          for (let x = building.x; x < building.x + def.w; x++) {
            this.blockedBuildings.add(tileKey(x, y));
          }
        }
      }
    }
  }

  private addBuildingGlow(
    bx: number,
    by: number,
    id: string,
    w: number,
    h: number,
    depth: number,
    seed: number
  ): void {
    const windows: Array<[number, number, number]> = [];
    if (id === 'farmhouse') {
      windows.push([10 + 4.5, 26 + 4, 0.62], [w - 20 + 4.5, 26 + 4, 0.62]);
    } else if (id === 'barn') {
      windows.push([8 + 3.5, 24 + 2.5, 0.4], [w - 15 + 3.5, 24 + 2.5, 0.4]);
    } else if (id === 'coop') {
      windows.push([18 + 3, 10 + 2.5, 0.38]);
    } else if (id === 'workshop') {
      windows.push([16 + 3, 16 + 2.5, 0.46]);
    } else if (id === 'helper_hut') {
      windows.push([8 + 3.5, 20 + 3, 0.48], [w - 15 + 3.5, 20 + 3, 0.48]);
    } else if (id === 'greenhouse') {
      windows.push([w / 2, h - 4, 0.3]);
    } else if (id === 'well') {
      windows.push([w / 2, 18, 0.24]);
    }
    for (const [tx, ty, scale] of windows) {
      const glow = this.add
        .image(bx + tx * 2, by + ty * 2, 'glow')
        .setTint(id === 'greenhouse' ? 0xc8ffd8 : 0xffc46a)
        .setScale(scale)
        .setAlpha(0)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(946);
      this.lightSources.push({
        image: glow,
        strength: scale > 0.5 ? 0.78 : 0.52,
        phase: (seed + tx * 3 + ty * 7) % 100
      });
    }
  }

  private buildLockedPlots(): void {
    this.plotDecor.forEach((obj) => obj.destroy());
    this.plotDecor = [];
    const state = this.state.data;
    for (const plot of PLOTS) {
      const locked = plot.id >= state.unlockedPlots;
      const { ring, gate } = fenceRing(plot);
      // A soft hedge strip hugs the outer edge so the field reads as a garden bed.
      for (let x = plot.x - 1; x <= plot.x + plot.w; x++) {
        for (const y of [plot.y - 1, plot.y + plot.h]) {
          if (isWaterTile(x, y) || isPathTile(x, y)) continue;
          const hedge = this.add
            .image(x * TILE, y * TILE + 6, 'hedge_strip')
            .setOrigin(0)
            .setScale(2)
            .setAlpha(0.45)
            .setDepth(y * TILE + 1);
          this.plotDecor.push(hedge);
        }
      }
      // Timber rails: horizontal along the top and bottom, upright down the sides.
      for (const tile of ring) {
        if (isWaterTile(tile.x, tile.y) || isPathTile(tile.x, tile.y)) continue;
        const fence = this.add
          .image(tile.x * TILE, tile.y * TILE, tile.vertical ? 'b_fence_v' : 'b_fence')
          .setOrigin(0)
          .setScale(2)
          .setAlpha(locked ? 0.94 : 1)
          .setDepth(tile.y * TILE + TILE);
        this.plotDecor.push(fence);
      }
      // Gate posts stand on either side of the opening, on rails that really exist.
      const gateXs = gate.map((t) => t.x).sort((a, b) => a - b);
      const gateY = gate[0].y;
      for (const gx of [gateXs[0] - 1, gateXs[gateXs.length - 1] + 1]) {
        const key = tileKey(gx, gateY);
        if (isWaterTile(gx, gateY) || isPathTile(gx, gateY)) continue;
        if (!ring.some((t) => tileKey(t.x, t.y) === key)) continue;
        const post = this.add
          .image(gx * TILE + TILE / 2, gateY * TILE + TILE, 'fence_gate_post')
          .setOrigin(0.5, 1)
          .setScale(2)
          .setDepth(gateY * TILE + TILE + 2);
        this.plotDecor.push(post);
      }
      if (!locked) continue;
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


  private buildMineNodes(): void {
    this.mineViews.forEach((view) => {
      view.sprite.destroy();
      view.shadow.destroy();
      view.label.destroy();
    });
    this.mineViews.clear();
    for (const node of MINE_NODES) {
      const info = this.state.mineNodeState(node.id);
      if (!info) continue;
      const broken = info.hp <= 0;
      const shadow = this.add
        .image(node.x * TILE + TILE / 2, node.y * TILE + TILE - 2, 'shadow')
        .setScale(1.4, 0.9)
        .setAlpha(0.32)
        .setDepth(node.y * TILE + TILE - 1);
      const sprite = this.add
        .image(node.x * TILE + TILE / 2, node.y * TILE + TILE, broken ? 'rock_broken' : `rock_${node.kind}`)
        .setOrigin(0.5, 1)
        .setScale(2)
        .setDepth(node.y * TILE + TILE)
        .setAlpha(broken ? 0.55 : 1);
      const label = this.add
        .text(
          node.x * TILE + TILE / 2,
          node.y * TILE - 2,
          broken ? '' : `${info.hp}/${info.maxHp}`,
          {
            fontFamily: '"Courier New", monospace',
            fontSize: '10px',
            color: '#f7e6c4',
            stroke: '#2a1a0a',
            strokeThickness: 3
          }
        )
        .setOrigin(0.5, 1)
        .setDepth(node.y * TILE + TILE + 2);
      this.mineViews.set(node.id, { sprite, shadow, label });
    }
  }

  private refreshMineNode(id: string): void {
    const view = this.mineViews.get(id);
    const info = this.state.mineNodeState(id);
    if (!view || !info) return;
    const broken = info.hp <= 0;
    view.sprite.setTexture(broken ? 'rock_broken' : `rock_${info.node.kind}`);
    view.sprite.setAlpha(broken ? 0.55 : 1);
    view.label.setText(broken ? '' : `${info.hp}/${info.maxHp}`);
  }

  private buildNpcs(): void {
    this.npcViews.forEach((view) => {
      this.tweens.killTweensOf(view.sprite);
      view.sprite.destroy();
      view.shadow.destroy();
      view.label.destroy();
    });
    this.npcViews.clear();
    for (const entry of this.state.npcList()) {
      const spot = NPC_SPOTS[entry.npc.id];
      if (!spot) continue;
      const px = spot.x * TILE + TILE / 2;
      const py = spot.y * TILE + TILE;
      const shadow = this.add
        .image(px, py - 2, 'shadow')
        .setScale(1.15, 0.8)
        .setAlpha(0.36)
        .setDepth(py - 1);
      const sprite = this.add
        .image(px, py, `npc_${entry.npc.id}`)
        .setOrigin(0.5, 1)
        .setScale(2)
        .setDepth(py + 2);
      const label = this.add
        .text(px, py - 34, entry.npc.name, {
          fontFamily: '"Courier New", monospace',
          fontSize: '10px',
          color: '#fff3d0',
          backgroundColor: '#1c2b1e',
          padding: { x: 3, y: 1 }
        })
        .setOrigin(0.5, 1)
        .setDepth(py + 3);
      this.npcViews.set(entry.npc.id, {
        sprite,
        shadow,
        label,
        homeX: px,
        homeY: py,
        tx: px,
        ty: py,
        // Greet the morning already on the move, instead of standing still.
        waitUntil: 0,
        greeted: false,
        facing: 'right'
      });
    }
    this.updateNpcVisibility();
  }

  private updateNpcVisibility(): void {
    const available = new Set(
      this.state
        .npcList()
        .filter((entry) => entry.available)
        .map((entry) => entry.npc.id)
    );
    this.npcViews.forEach((view, id) => {
      const show = available.has(id);
      view.sprite.setVisible(show);
      view.shadow.setVisible(show);
      view.label.setVisible(show);
    });
  }

  /**
   * Villagers stroll the yard and the lanes in front of the fields. They stop
   * the moment you greet them, and stay put to chat.
   */
  private updateNpcWander(delta: number): void {
    if (this.state.paused || this.sleeping) return;
    const dt = Math.min(delta, 80) / 1000;
    const now = this.time.now;
    this.npcViews.forEach((view) => {
      if (!view.sprite.visible) return;
      if (!view.greeted) {
        const dx = view.tx - view.sprite.x;
        const dy = view.ty - view.sprite.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 2) {
          const step = Math.min(dist, 64 * dt);
          view.sprite.x += (dx / dist) * step;
          view.sprite.y += (dy / dist) * step;
          if (Math.abs(dx) > 0.5) view.facing = dx < 0 ? 'left' : 'right';
          view.sprite.setFlipX(view.facing === 'left');
        } else if (now >= view.waitUntil) {
          // Pick a fresh spot on open ground around this villager's patch.
          for (let tries = 0; tries < 12; tries++) {
            const gx = view.homeX + Phaser.Math.Between(-4, 4) * TILE;
            const gy = view.homeY + Phaser.Math.Between(-3, 3) * TILE;
            const tile = worldToTile(gx, gy);
            if (isBlockedBase(tile.x, tile.y) || isMineNodeTile(tile.x, tile.y)) continue;
            if (isPlotInterior(tile.x, tile.y)) continue;
            view.tx = gx;
            view.ty = gy;
            break;
          }
          view.waitUntil = now + Phaser.Math.Between(1100, 3200);
        }
      }
      // A gentle bob, drawn cheaply, replaces the old wobbling tween.
      const bob = view.greeted ? 0 : Math.sin(now / 210 + view.homeX) * 1.5;
      view.sprite.setDepth(view.sprite.y + 2);
      view.shadow.setPosition(view.sprite.x, view.sprite.y - 2);
      view.shadow.setDepth(view.sprite.y - 1);
      view.label.setPosition(view.sprite.x, view.sprite.y - 34 + bob);
      view.label.setDepth(view.sprite.y + 3);
    });
  }

  private buildFestivalDecor(): void {
    this.festivalDecor.forEach((obj) => obj.destroy());
    this.festivalDecor = [];
    if (!this.state.festivalAvailable()) return;
    const stall = this.add
      .image(49 * TILE, 9 * TILE, 'festival_stall')
      .setOrigin(0)
      .setScale(2)
      .setDepth(10 * TILE);
    const banner = this.add
      .image(19 * TILE + TILE / 2, 8 * TILE, 'festival_banner')
      .setOrigin(0.5, 1)
      .setScale(2)
      .setDepth(9 * TILE);
    const banner2 = this.add
      .image(25 * TILE + TILE / 2, 8 * TILE, 'festival_banner')
      .setOrigin(0.5, 1)
      .setScale(2)
      .setDepth(9 * TILE);
    this.festivalDecor.push(stall, banner, banner2);
  }

  private npcAt(wx: number, wy: number): string | null {
    for (const [id, view] of this.npcViews) {
      if (!view.sprite.visible) continue;
      if (Phaser.Geom.Rectangle.Contains(view.sprite.getBounds(), wx, wy)) return id;
    }
    return null;
  }

  private interactNpc(id: string): void {
    const entry = this.state.npcList().find((item) => item.npc.id === id);
    if (!entry) return;
    const view = this.npcViews.get(id);
    if (!view) return;
    const dist = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      view.sprite.x,
      view.sprite.y
    );
    if (dist > TILE * 3.2) {
      this.ui.notify(`Move closer to talk to ${entry.npc.name}.`, 'error');
      audio.play('error');
      return;
    }
    if (!entry.available) {
      this.ui.notify(`${entry.npc.name} is not here right now.`, 'info');
      return;
    }
    // They stop walking and turn to face you while you talk.
    view.greeted = true;
    view.tx = view.sprite.x;
    view.ty = view.sprite.y;
    view.facing = this.player.x < view.sprite.x ? 'left' : 'right';
    view.sprite.setFlipX(view.facing === 'left');
    this.ui.openNpcDialogue(id);
  }

  /**
   * Called when a panel closes: whoever you greeted carries on with their walk
   * a moment later, so the farm never freezes after a chat.
   */
  resumeNpcWalks(): void {
    const now = this.time.now;
    this.npcViews.forEach((view) => {
      if (!view.greeted) return;
      view.greeted = false;
      view.waitUntil = now + 1400;
    });
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
    this.handleScaleResize();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleScaleResize);
  }

  private handleScaleResize = (): void => {
    const width = this.scale.width;
    const height = this.scale.height;
    const worldWidth = WORLD_W * TILE;
    const worldHeight = WORLD_H * TILE;
    this.baseZoom = Math.max(1, width / worldWidth, height / worldHeight);
    this.cameras.main.setSize(width, height);
    this.applyZoom();
    this.lightOverlay?.setSize(width, height);
    this.vignetteOverlay?.setDisplaySize(width, height);
    this.lastLightUpdate = 400;
    this.resizeWeatherZones(width, height);
  };

  private resizeWeatherZones(width: number, height: number): void {
    if (this.rainZone) {
      this.rainZone.setTo(0, -12, width, 4);
    }
    if (this.splashZone) {
      this.splashZone.setTo(0, height * 0.35, width, Math.max(20, height * 0.65 - 20));
    }
    if (this.snowZone) {
      this.snowZone.setTo(0, -10, width, height * 0.55);
    }
    if (this.leafZone) {
      this.leafZone.setTo(0, -12, width, height * 0.55);
    }
  }

  private applyZoom(): void {
    this.cameras.main.setZoom(this.baseZoom * this.zoomLevel);
  }

  private setupInput(): void {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys('W,A,S,D') as typeof this.wasd;
    this.input.mouse?.disableContextMenu();
    this.input.keyboard!.on('keydown-G', () => this.harvestNearby());
    this.input.keyboard!.on('keydown-F', () => this.feedAllAnimals());
    this.input.keyboard!.on('keydown-E', () => this.collectNearbyProducts());

    // Mouse wheel zooms the camera: from the normal view up to 2.5x closer.
    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _over: Phaser.GameObjects.GameObject[], _dx: number, dy: number) => {
      if (this.state.paused) return;
      this.zoomLevel = clamp(this.zoomLevel * (dy > 0 ? 0.9 : 1 / 0.9), 1, 2.5);
      this.applyZoom();
    });

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
      this.dragLastTile = tileKey(worldToTile(wp.x, wp.y).x, worldToTile(wp.x, wp.y).y);
      this.handleWorldClick(wp.x, wp.y);
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.state.paused) return;
      const wp = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      if (this.buildMode) this.updateGhost(wp.x, wp.y);
      else {
        this.updateHover(wp.x, wp.y);
        this.dragAcross(pointer, wp.x, wp.y);
      }
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
      if (
        isWaterTile(tx, ty) ||
        isObstacleTile(tx, ty) ||
        isFenceTile(tx, ty) ||
        this.blockedBuildings.has(key)
      )
        return true;
    }
    return false;
  }

  // ---------------------------------------------------------------- actions

  private handleWorldClick(wx: number, wy: number): void {
    const stall = this.festivalDecor[0];
    if (
      stall instanceof Phaser.GameObjects.Image &&
      Phaser.Geom.Rectangle.Contains(stall.getBounds(), wx, wy)
    ) {
      this.ui.openPanel('festival');
      return;
    }
    const clickedNpc = this.npcAt(wx, wy);
    if (clickedNpc) {
      this.interactNpc(clickedNpc);
      return;
    }
    const clickedAnimal = this.animalAt(wx, wy);
    if (clickedAnimal) {
      this.interactWithAnimal(clickedAnimal);
      return;
    }
    const { x, y } = worldToTile(wx, wy);
    const building = this.state.data.buildings.find((entry) => {
      const def = BUILDINGS[entry.id];
      if (!def) return false;
      return x >= entry.x && x < entry.x + def.w && y >= entry.y && y < entry.y + def.h;
    });
    if (building) {
      if (building.id === 'shipping_bin') {
        this.ui.openPanel('shipping');
        return;
      }
      if (BUILDINGS[building.id]?.kind === 'farmhouse') {
        this.ui.openPanel('home');
        return;
      }
    }
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
    const wild = this.state.forageAt(x, y);
    if (wild) {
      const picked = this.state.pickForage(wild.uid);
      if (picked.ok) {
        audio.play('harvest');
        this.ui.notify(picked.message ?? 'Picked.', 'success');
        this.spawnActionParticles(x, y, 'sparkle');
        this.drawForage();
        void this.saveGame();
      } else {
        audio.play('error');
        this.ui.notify(picked.message ?? 'You cannot pick that.', 'error');
      }
      return;
    }
    const node = this.state.mineNodeAtTile(x, y);
    if (node) {
      if (item !== 'pickaxe') {
        this.ui.notify('Select the pickaxe to mine this rock.', 'info');
        audio.play('error');
        return;
      }
      const res = this.state.mineNode(node.id);
      if (res.ok) {
        audio.play('till');
        this.ui.notify(res.message ?? 'The rock cracks.', 'success');
        this.playSwing();
        this.spawnActionParticles(x, y, 'soil');
        if (!audio.settings.reduceFlashing) this.cameras.main.shake(70, 0.0014);
        this.refreshMineNode(node.id);
        for (const loot of res.loot ?? []) {
          this.floatText(
            `+${loot.qty} ${ITEMS[loot.itemId]?.name ?? loot.itemId}`,
            0xffe080,
            x * TILE + TILE / 2,
            y * TILE
          );
        }
        void this.saveGame();
      } else {
        audio.play('error');
        this.ui.notify(res.message ?? 'You cannot mine that rock.', 'error');
      }
      return;
    }

    if (isWaterTile(x, y)) {
      if (item === 'fishing_rod') {
        this.ui.openFishingGame();
        return;
      }
      this.ui.notify('Select the fishing rod, then click the water to cast.', 'info');
      return;
    }

    const wasMature = this.state.cropMature(x, y);
    let result: { ok: boolean; message?: string; items?: number; tiles?: number } = { ok: false };
    let sfx: 'till' | 'water' | 'plant' | 'harvest' | 'error' = 'error';
    let particle: 'soil' | 'water' | 'sparkle' | null = null;

    if (wasMature) {
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
      if (wasMature) {
        this.floatText(`+${result.items ?? 1}`, 0xffe080, wx, wy - 22);
        this.spawnImpactRing(wx, wy, 0xffedaa);
      } else if (item === 'hoe' && (result.tiles ?? 0) > 1) {
        this.floatText(`${result.tiles} tilled`, 0xd8c08a, wx, wy - 20);
      } else if (item === 'watering_can' && (result.tiles ?? 0) > 1) {
        this.floatText(`${result.tiles} watered`, 0x9ad8f8, wx, wy - 20);
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
    let closestNpc: string | null = null;
    let bestNpcDist = Infinity;
    this.npcViews.forEach((view, id) => {
      if (!view.sprite.visible) return;
      const dist = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        view.sprite.x,
        view.sprite.y
      );
      if (dist < TILE * 2.6 && dist < bestNpcDist) {
        bestNpcDist = dist;
        closestNpc = id;
      }
    });
    if (closestNpc) {
      this.interactNpc(closestNpc);
      return;
    }
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
    this.drawWatchRing(x, y, def.w, def.h, def.radius ?? 0);
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

  // Hold the mouse button and drag: hoe, watering can and seeds work on each new tile.
  private dragAcross(pointer: Phaser.Input.Pointer, wx: number, wy: number): void {
    if (!pointer.isDown || this.sleeping || pointer.rightButtonDown()) {
      this.dragLastTile = null;
      return;
    }
    const item = this.state.selectedItem();
    if (!(item === 'hoe' || item === 'watering_can' || item.endsWith('_seed'))) return;
    const { x, y } = worldToTile(wx, wy);
    const key = tileKey(x, y);
    if (key === this.dragLastTile) return;
    this.dragLastTile = key;
    if (this.state.mineNodeAtTile(x, y) || isWaterTile(x, y) || this.state.cropMature(x, y)) return;
    this.performTileAction(x, y);
  }

  private keyboardTyping(): boolean {
    const tag = document.activeElement?.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
  }

  // Press G: harvest every ripe crop within 3 tiles of the player.
  private harvestNearby(): void {
    if (this.state.paused || this.sleeping || this.keyboardTyping()) return;
    const px = Math.floor(this.player.x / TILE);
    const py = Math.floor(this.player.y / TILE);
    let harvested = 0;
    let lastError = '';
    for (let y = py - 3; y <= py + 3; y++) {
      for (let x = px - 3; x <= px + 3; x++) {
        if (x < 0 || y < 0 || x >= WORLD_W || y >= WORLD_H) continue;
        if (!this.state.cropMature(x, y)) continue;
        const res = this.state.harvestAt(x, y);
        if (!res.ok) {
          lastError = res.message ?? '';
          continue;
        }
        harvested += 1;
        this.spawnActionParticles(x, y, 'sparkle');
        this.refreshTileAndNeighbours(x, y);
      }
    }
    if (harvested > 0) {
      audio.play('harvest');
      this.ui.notify(`Harvested ${harvested} crop${harvested === 1 ? '' : 's'} nearby.`, 'success');
      void this.saveGame();
    } else {
      this.ui.notify(lastError || 'No ripe crops within reach.', lastError ? 'error' : 'info');
    }
  }

  // Press E: collect every ready animal product within 3 tiles of the player.
  private collectNearbyProducts(): void {
    if (this.state.paused || this.sleeping || this.keyboardTyping()) return;
    let collected = 0;
    let lastError = '';
    for (const animal of [...this.state.data.animals]) {
      if (!animal.productReady) continue;
      if (Phaser.Math.Distance.Between(this.player.x, this.player.y, animal.x, animal.y) > TILE * 3) continue;
      const res = this.state.collectAnimal(animal.uid);
      if (!res.ok) {
        lastError = res.message ?? '';
        continue;
      }
      collected += 1;
      this.floatText('+1', 0xffe080, animal.x, animal.y - 30);
    }
    if (collected > 0) {
      audio.play('harvest');
      this.ui.notify(`Collected ${collected} product${collected === 1 ? '' : 's'} nearby.`, 'success');
      this.syncAnimalBubbles();
      void this.saveGame();
    } else {
      this.ui.notify(lastError || 'No products ready near you.', lastError ? 'error' : 'info');
    }
  }

  // Press F: feed all your animals in one go.
  private feedAllAnimals(): void {
    if (this.state.paused || this.sleeping || this.keyboardTyping()) return;
    const res = this.state.feedAll();
    this.ui.notify(res.message ?? '', res.ok ? 'success' : 'error');
    if (res.ok) {
      audio.play('click');
      this.syncAnimalBubbles();
      void this.saveGame();
    }
  }

  // Blue ring around a well or sprinkler: the tiles it will water.
  private drawWatchRing(x: number, y: number, w: number, h: number, radius: number): void {
    if (radius <= 0) return;
    this.ghostGfx.fillStyle(0x6ab8ff, 0.22);
    for (let ty = y - radius; ty < y + h + radius; ty++) {
      for (let tx = x - radius; tx < x + w + radius; tx++) {
        if (tx >= x && tx < x + w && ty >= y && ty < y + h) continue;
        this.ghostGfx.fillRect(tx * TILE, ty * TILE, TILE, TILE);
      }
    }
  }

  // Small label over a planted tile: crop name and days left.
  private updateCropLabel(x: number, y: number): void {
    const inside = x >= 0 && y >= 0 && x < WORLD_W && y < WORLD_H;
    const tile = inside ? this.state.tileAt(x, y) : undefined;
    const def = tile?.crop ? CROPS[tile.crop.id] : undefined;
    if (!tile?.crop || !def) {
      this.cropLabel?.setVisible(false);
      return;
    }
    const left = Math.max(0, def.growthDays - tile.crop.growth);
    const timing = left === 0 ? 'ready' : `${left} day${left === 1 ? '' : 's'} left`;
    const harvest = def.yieldMin === def.yieldMax ? `${def.yieldMin}` : `${def.yieldMin}-${def.yieldMax}`;
    const fertilized = tile.fertilized ? ' \u00b7 fertilized' : '';
    const text = `${def.name} \u00b7 ${timing} \u00b7 harvest ${harvest}${fertilized}`;
    if (!this.cropLabel) {
      this.cropLabel = this.add
        .text(0, 0, '', {
          fontFamily: 'Courier New, monospace',
          fontSize: '11px',
          color: '#fff5d0',
          backgroundColor: '#1a2a1ae0',
          padding: { x: 4, y: 2 }
        })
        .setOrigin(0.5, 1)
        .setDepth(860);
    }
    this.cropLabel.setText(text).setPosition(x * TILE + TILE / 2, y * TILE - 4).setVisible(true);
  }

  private updateHover(wx: number, wy: number): void {
    const hoverTile = worldToTile(wx, wy);
    this.updateCropLabel(hoverTile.x, hoverTile.y);
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
    const texture = kind === 'water' ? 'water_drop' : kind === 'soil' ? 'pebble_0' : 'sparkle';
    const baseX = x * TILE + TILE / 2;
    const baseY = y * TILE + TILE / 2;
    const color = kind === 'water' ? 0x9ad8f8 : kind === 'soil' ? 0xc9a06a : 0xffe9a0;
    for (let i = 0; i < 7; i++) {
      const img = this.add
        .image(baseX + Phaser.Math.Between(-8, 8), baseY + Phaser.Math.Between(-4, 8), texture)
        .setDepth(820)
        .setScale(kind === 'soil' ? 1.2 : 1.6)
        .setTint(color);
      this.tweens.add({
        targets: img,
        x: baseX + Phaser.Math.Between(-26, 26),
        y: baseY + Phaser.Math.Between(-30, -6),
        angle: kind === 'soil' ? Phaser.Math.Between(-80, 80) : 0,
        alpha: 0,
        scale: 0.45,
        duration: 460 + i * 34,
        ease: 'Quad.out',
        onComplete: () => img.destroy()
      });
    }
    if (kind !== 'soil') this.spawnImpactRing(baseX, baseY, kind === 'water' ? 0x9ad8f8 : 0xffedaa);
  }

  private spawnImpactRing(x: number, y: number, color: number): void {
    const ring = this.add
      .image(x, y, 'ripple')
      .setDepth(819)
      .setScale(0.8)
      .setAlpha(0.75)
      .setTint(color);
    this.tweens.add({
      targets: ring,
      scale: 2.2,
      alpha: 0,
      duration: 420,
      ease: 'Sine.out',
      onComplete: () => ring.destroy()
    });
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
      this.tweens.killTweensOf([v.sprite, v.bubble]);
      v.sprite.destroy();
      v.shadow.destroy();
      v.bubble.destroy();
    });
    this.animalViews.clear();
    for (const animal of this.state.data.animals) {
      const def = ANIMALS[animal.species];
      if (!def) continue;
      const mature = this.state.animalMature(animal);
      const shadow = this.add
        .image(animal.x, animal.y - 1, 'shadow')
        .setScale(mature ? 1.25 : 0.9, mature ? 0.9 : 0.65)
        .setAlpha(0.34)
        .setDepth(animal.y - 1);
      const sprite = this.add
        .image(animal.x, animal.y, `animal_${animal.species}_0`)
        .setOrigin(0.5, 1)
        .setScale(mature ? 2 : 1.4)
        .setDepth(animal.y);
      sprite.setData('uid', animal.uid);
      this.tweens.add({
        targets: sprite,
        angle: { from: -1.2, to: 1.2 },
        duration: 900 + ((animal.uid.length * 131) % 700),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut',
        delay: (animal.uid.length * 211) % 900
      });
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
      this.tweens.add({
        targets: bubble,
        scale: { from: 0.95, to: 1.12 },
        duration: 760,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut'
      });
      this.animalViews.set(animal.uid, { sprite, shadow, bubble, species: animal.species, toggle: 0 });
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
      this.lastLightUpdate = 400;
      this.drawForage();
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
    this.scale.off(Phaser.Scale.Events.RESIZE, this.handleScaleResize);
    if (this.autosaveTimer !== null) window.clearInterval(this.autosaveTimer);
    this.unsubs.forEach((fn) => fn());
    this.unsubs = [];
    this.waterFrameTimer?.remove();
    this.waterRippleTimer?.remove();
    this.ambientFrameTimer?.remove();
    this.animalTimer?.remove();
    this.wanderTimer?.remove();
    this.stormTimer?.remove();
    this.ui?.destroy();
  }

  // ------------------------------------------------------------------ main

  private createLighting(): void {
    this.ambientOverlay = this.add.graphics().setScrollFactor(0).setDepth(938);
    this.lightOverlay = this.add
      .rectangle(0, 0, this.scale.width, this.scale.height, 0x0a1630, 0)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(940);
    this.vignetteOverlay = this.add
      .image(0, 0, 'vignette')
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(960)
      .setDisplaySize(this.scale.width, this.scale.height)
      .setAlpha(0.9);
  }

  private updateLighting(delta: number): void {
    this.lastLightUpdate += delta;
    if (this.lastLightUpdate < 400) return;
    this.lastLightUpdate = 0;
    const minute = this.state.data.minute;
    let night = 0;
    if (minute < 330) night = 1;
    else if (minute < 450) night = 1 - (minute - 330) / 120;
    else if (minute < 1020) night = 0;
    else if (minute < 1140) night = ((minute - 1020) / 120) * 0.75;
    else night = Math.min(1, 0.75 + (minute - 1140) / 120);

    const weather = this.state.data.weather;
    const weatherDark = weather === 'storm' ? 0.2 : weather === 'rain' ? 0.13 : weather === 'cloudy' ? 0.07 : 0;
    let overlayColor = 0x08142e;
    let overlayAlpha = Math.max(night * 0.48, weatherDark);
    if (minute >= 990 && minute < 1150) {
      overlayColor = 0xff9258;
      overlayAlpha = Math.max(overlayAlpha, (1 - Math.abs(minute - 1070) / 80) * 0.18);
    }
    if (this.lightOverlay) this.lightOverlay.setFillStyle(overlayColor, overlayAlpha);

    if (this.ambientOverlay) {
      const top = minute < 450 ? 0x274b76 : minute < 1020 ? 0x88c4e8 : minute < 1150 ? 0x4b527e : 0x07142e;
      const bottom = minute < 450 ? 0xffb57a : minute < 1020 ? 0xd8ecdc : minute < 1150 ? 0xff9a62 : 0x122846;
      const topAlpha = minute < 450 ? 0.16 : minute < 1020 ? 0.02 : minute < 1150 ? 0.15 : 0.34;
      const bottomAlpha = minute < 450 ? 0.13 : minute < 1020 ? 0.03 : minute < 1150 ? 0.16 : 0.2;
      this.ambientOverlay.clear();
      this.ambientOverlay.fillGradientStyle(
        top,
        top,
        bottom,
        bottom,
        topAlpha + weatherDark * 0.55,
        topAlpha + weatherDark * 0.55,
        bottomAlpha + weatherDark * 0.55,
        bottomAlpha + weatherDark * 0.55
      );
      this.ambientOverlay.fillRect(0, 0, this.scale.width, this.scale.height);
    }

    const glowAlpha = Math.min(1, Math.max(0, night * 1.15 + weatherDark * 0.25));
    const time = this.time.now;
    for (const source of this.lightSources) {
      const flicker = 0.88 + Math.sin(time * 0.0017 + source.phase) * 0.08 + Math.sin(time * 0.0041 + source.phase * 2) * 0.04;
      source.image.setAlpha(glowAlpha * source.strength * flicker);
    }
    for (const firefly of this.fireflies) firefly.setVisible(night > 0.32 && weather !== 'storm');
  }

  private createWeather(): void {
    this.rainZone = new Phaser.Geom.Rectangle(0, -12, this.scale.width, 4);
    this.rainEmitter = this.add
      .particles(0, 0, 'rain', {
        emitZone: { type: 'random', source: randomRectSource(this.rainZone!) },
        lifespan: 1400,
        speedY: { min: 520, max: 720 },
        speedX: { min: -95, max: -45 },
        quantity: 3,
        frequency: 18,
        scale: { min: 0.8, max: 1.5 },
        alpha: { start: 0.85, end: 0.35 },
        blendMode: Phaser.BlendModes.NORMAL
      })
      .setScrollFactor(0)
      .setDepth(900);
    this.rainEmitter.stop();

    this.splashZone = new Phaser.Geom.Rectangle(
      0,
      this.scale.height * 0.35,
      this.scale.width,
      Math.max(20, this.scale.height * 0.65 - 20)
    );
    this.splashEmitter = this.add
      .particles(0, 0, 'rain_splash', {
        emitZone: { type: 'random', source: randomRectSource(this.splashZone!) },
        lifespan: 460,
        speedX: { min: -8, max: 8 },
        speedY: { min: -14, max: -2 },
        quantity: 1,
        frequency: 95,
        scale: { min: 0.8, max: 1.7 },
        alpha: { start: 0.8, end: 0 },
        blendMode: Phaser.BlendModes.ADD
      })
      .setScrollFactor(0)
      .setDepth(899);
    this.splashEmitter.stop();

    this.snowZone = new Phaser.Geom.Rectangle(0, -10, this.scale.width, this.scale.height * 0.55);
    this.snowEmitter = this.add
      .particles(0, 0, 'snowflake', {
        emitZone: { type: 'random', source: randomRectSource(this.snowZone!) },
        lifespan: 6200,
        speedY: { min: 26, max: 54 },
        speedX: { min: -18, max: 18 },
        quantity: 2,
        frequency: 70,
        scale: { min: 0.9, max: 2 },
        alpha: { start: 0.9, end: 0.25 },
        rotate: { min: 0, max: 360 },
        blendMode: Phaser.BlendModes.NORMAL
      })
      .setScrollFactor(0)
      .setDepth(898);
    this.snowEmitter.stop();

    this.leafZone = new Phaser.Geom.Rectangle(0, -12, this.scale.width, this.scale.height * 0.55);
    this.leafEmitter = this.add
      .particles(0, 0, 'leaf', {
        emitZone: { type: 'random', source: randomRectSource(this.leafZone!) },
        lifespan: 7400,
        speedY: { min: 24, max: 54 },
        speedX: { min: -42, max: -8 },
        quantity: 1,
        frequency: 220,
        scale: { min: 0.9, max: 1.6 },
        alpha: { start: 0.9, end: 0.1 },
        rotate: { start: 0, end: 360 },
        blendMode: Phaser.BlendModes.NORMAL
      })
      .setScrollFactor(0)
      .setDepth(897);
    this.leafEmitter.stop();

    this.createWeatherPuddles();
  }

  private createWeatherPuddles(): void {
    this.tweens.killTweensOf(this.weatherPuddles);
    this.weatherPuddles.forEach((puddle) => puddle.destroy());
    this.weatherPuddles = [];
    for (let i = 0; i < 12; i++) {
      const x = TILE * 3 + ((i * 7919) % (WORLD_W * TILE - TILE * 6));
      const y = TILE * 3 + ((i * 6151 + 311) % (WORLD_H * TILE - TILE * 6));
      if (isWaterTile(Math.floor(x / TILE), Math.floor(y / TILE))) continue;
      const puddle = this.add
        .image(x, y, 'puddle')
        .setScale(1.4 + (i % 3) * 0.4)
        .setAlpha(0)
        .setDepth(5);
      this.weatherPuddles.push(puddle);
      this.tweens.add({
        targets: puddle,
        scaleX: puddle.scaleX * 1.08,
        duration: 1800 + (i % 4) * 300,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut'
      });
    }
  }

  private applyWeather(): void {
    if (!this.rainEmitter || !this.splashEmitter || !this.snowEmitter || !this.leafEmitter) return;
    const w = this.state.data.weather;
    const rainy = w === 'rain' || w === 'storm';
    if (rainy) {
      this.rainEmitter.start();
      this.splashEmitter.start();
    } else {
      this.rainEmitter.stop();
      this.splashEmitter.stop();
    }
    const season = this.state.data.season;
    if (season === 'winter' && !rainy) this.snowEmitter.start();
    else this.snowEmitter.stop();
    if (season === 'fall' && !rainy) this.leafEmitter.start();
    else this.leafEmitter.stop();
    for (const puddle of this.weatherPuddles) {
      puddle.setAlpha(rainy ? 0.82 : 0);
    }
  }

  private spawnWaterRipple(x: number, y: number): void {
    const ripple = this.add
      .image(x, y, 'ripple')
      .setScale(1.2)
      .setAlpha(0.72)
      .setDepth(6);
    this.tweens.add({
      targets: ripple,
      scale: 2.4,
      alpha: 0,
      duration: 1500,
      ease: 'Sine.out',
      onComplete: () => ripple.destroy()
    });
  }

  private createAmbientWildlife(): void {
    this.tweens.killTweensOf(this.fireflies);
    this.tweens.killTweensOf(this.butterflies.map((butterfly) => butterfly.image));
    this.tweens.killTweensOf(this.birds);
    this.fireflies.forEach((firefly) => firefly.destroy());
    this.butterflies.forEach((butterfly) => butterfly.image.destroy());
    this.birds.forEach((bird) => bird.destroy());
    this.fireflies = [];
    this.butterflies = [];
    this.birds = [];
    const season = this.state.data.season;

    for (let i = 0; i < 16; i++) {
      const x = TILE * 2 + ((i * 4051 + 97) % (WORLD_W * TILE - TILE * 4));
      const y = TILE * 3 + ((i * 2711 + 173) % (WORLD_H * TILE - TILE * 6));
      if (isWaterTile(Math.floor(x / TILE), Math.floor(y / TILE))) continue;
      const firefly = this.add
        .image(x, y, 'firefly')
        .setScale(1.3 + (i % 3) * 0.35)
        .setAlpha(0)
        .setDepth(944)
        .setVisible(false);
      this.tweens.add({
        targets: firefly,
        alpha: { from: 0, to: 0.52 + (i % 5) * 0.08 },
        x: x + (i % 2 === 0 ? 14 : -14),
        y: y - 9 - (i % 4) * 3,
        duration: 1700 + (i % 6) * 270,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut',
        delay: (i * 173) % 2200
      });
      this.fireflies.push(firefly);
    }

    if (season === 'spring' || season === 'summer') {
      for (let i = 0; i < 6; i++) {
        const x = TILE * 3 + ((i * 3301 + 211) % (WORLD_W * TILE - TILE * 6));
        const y = TILE * 4 + ((i * 4127 + 89) % (WORLD_H * TILE - TILE * 8));
        if (isWaterTile(Math.floor(x / TILE), Math.floor(y / TILE))) continue;
        const variant = i % 2;
        const image = this.add.image(x, y, `butterfly_${variant}_0`).setScale(1.4).setDepth(y + 3);
        this.tweens.add({
          targets: image,
          x: x + (i % 2 === 0 ? 42 : -38),
          y: y + (i % 3 === 0 ? -26 : 20),
          duration: 2600 + i * 410,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.inOut'
        });
        this.butterflies.push({ image, variant });
      }
    }

    if (season !== 'winter') {
      const width = this.scale.width;
      for (let i = 0; i < 3; i++) {
        const direction = i % 2 === 0 ? 1 : -1;
        const startX = direction > 0 ? -40 : width + 40;
        const endX = direction > 0 ? width + 40 : -40;
        const bird = this.add
          .image(startX, 64 + i * 44, 'bird_0')
          .setScrollFactor(0)
          .setScale(1.5)
          .setAlpha(0.68)
          .setFlipX(direction < 0)
          .setDepth(930);
        this.tweens.add({
          targets: bird,
          x: endX,
          duration: 16000 + i * 3500,
          repeat: -1,
          ease: 'Linear',
          delay: i * 3100
        });
        this.tweens.add({
          targets: bird,
          angle: { from: -5, to: 5 },
          duration: 1100 + i * 160,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.inOut'
        });
        this.birds.push(bird);
      }
    }
  }

  update(_time: number, delta: number): void {
    if (!this.player) return;
    const dt = Math.min(delta, 80) / 1000;

    if (!this.state.paused && !this.sleeping) {
      const boots = this.state.data.upgrades.boots ?? 0;
      let speed =
      122 *
      (1 +
        boots * 0.12 +
        this.state.toolBonus('speed') +
        this.state.buffSum('speed') +
        this.state.horseSpeedBonus());
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

    if (_time - this.lastNpcCheck > 1000) {
      this.lastNpcCheck = _time;
      this.updateNpcVisibility();
    }
    this.updateNpcWander(delta);
    if (!this.state.paused && !this.sleeping && this.state.data.minute >= 22 * 60 && this.nightWarnedDay !== this.state.data.day) {
      this.nightWarnedDay = this.state.data.day;
      this.ui.notify('It is getting late. Remember to sleep soon.', 'info');
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
      view.shadow.setPosition(animal.x, animal.y - 1);
      view.shadow.setDepth(animal.y - 1);
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

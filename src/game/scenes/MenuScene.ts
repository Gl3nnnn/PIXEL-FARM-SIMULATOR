import Phaser from 'phaser';
import { SaveManager } from '../../systems/save';
import { createNewSave, GameState } from '../../systems/gameState';
import { mulberry32 } from '../../systems/util';
import { MainMenu } from '../../ui/menu';

type Mood = 'dawn' | 'day' | 'dusk' | 'night';

interface MoodPalette {
  name: Mood;
  skyTop: number;
  skyBottom: number;
  farHill: number;
  midHill: number;
  nearHill: number;
  hazeColor: number;
  hazeAlpha: number;
  tintColor: number;
  tintAlpha: number;
  sunColor: number;
  sunAlpha: number;
  sunHeight: number;
  moon: boolean;
  stars: number;
  warmLight: number;
}

function mixColor(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 0xff;
  const ag = (a >> 8) & 0xff;
  const ab = a & 0xff;
  const br = (b >> 16) & 0xff;
  const bg = (b >> 8) & 0xff;
  const bb = b & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | bl;
}

function currentPalette(): MoodPalette {
  const now = new Date();
  const hour = now.getHours() + now.getMinutes() / 60;
  if (hour >= 5 && hour < 7) {
    return {
      name: 'dawn',
      skyTop: 0x5f89b8,
      skyBottom: 0xf1c28d,
      farHill: 0x7a8f92,
      midHill: 0x62826a,
      nearHill: 0x557a54,
      hazeColor: 0xffd2a0,
      hazeAlpha: 0.14,
      tintColor: 0xffc38a,
      tintAlpha: 0.06,
      sunColor: 0xffd88a,
      sunAlpha: 0.8,
      sunHeight: 0.4,
      moon: false,
      stars: 0.2,
      warmLight: 0.3
    };
  }
  if (hour >= 7 && hour < 17.5) {
    return {
      name: 'day',
      skyTop: 0x74bede,
      skyBottom: 0xd4ebd6,
      farHill: 0x82a99c,
      midHill: 0x679a72,
      nearHill: 0x5a8c57,
      hazeColor: 0xfff1c8,
      hazeAlpha: 0.1,
      tintColor: 0xffe3a6,
      tintAlpha: 0.04,
      sunColor: 0xffdd72,
      sunAlpha: 0.95,
      sunHeight: 0.22,
      moon: false,
      stars: 0,
      warmLight: 0
    };
  }
  if (hour >= 17.5 && hour < 20.5) {
    return {
      name: 'dusk',
      skyTop: 0x5d6fa8,
      skyBottom: 0xef9f6e,
      farHill: 0x74808e,
      midHill: 0x5d7963,
      nearHill: 0x4e7050,
      hazeColor: 0xffb483,
      hazeAlpha: 0.16,
      tintColor: 0xff9860,
      tintAlpha: 0.09,
      sunColor: 0xffb35a,
      sunAlpha: 0.9,
      sunHeight: 0.43,
      moon: false,
      stars: 0.18,
      warmLight: 0.6
    };
  }
  return {
    name: 'night',
    skyTop: 0x0d1a32,
    skyBottom: 0x26485f,
    farHill: 0x263b4b,
    midHill: 0x24453f,
    nearHill: 0x203c32,
    hazeColor: 0x6f92b0,
    hazeAlpha: 0.12,
    tintColor: 0x0d1b38,
    tintAlpha: 0.26,
    sunColor: 0,
    sunAlpha: 0,
    sunHeight: 0,
    moon: true,
    stars: 1,
    warmLight: 0.9
  };
}

export class MenuScene extends Phaser.Scene {
  private menu: MainMenu | null = null;
  private backdropObjects: Phaser.GameObjects.GameObject[] = [];
  private ambientTimers: Phaser.Time.TimerEvent[] = [];

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#8fd0e8');
    this.buildBackdrop();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize);
    this.menu = new MainMenu({
      onStart: (slot, mode) => this.handleStart(slot, mode)
    });
    void this.menu.mount().then(() => {
      document.getElementById('loading-screen')?.remove();
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize);
      this.clearAmbientTimers();
      this.menu?.destroy();
      this.menu = null;
      this.backdropObjects = [];
    });
  }

  private handleResize = (): void => {
    this.tweens.killAll();
    this.clearAmbientTimers();
    for (const obj of this.backdropObjects) obj.destroy();
    this.backdropObjects = [];
    this.buildBackdrop();
  };

  private clearAmbientTimers(): void {
    for (const timer of this.ambientTimers) timer.remove(false);
    this.ambientTimers = [];
  }

  private addAmbientTimer(delay: number, callback: () => void): void {
    const timer = this.time.addEvent({ delay, loop: true, callback });
    this.ambientTimers.push(timer);
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

  private pathCenter(y: number, groundTop: number, W: number, k: number): number {
    const t = Math.max(0, y - groundTop);
    return W * 0.56 + Math.sin(t * 0.011) * 52 * k + t * 0.022;
  }

  private buildBackdrop(): void {
    const existing = new Set(this.children.list);
    const W = this.scale.width;
    const H = this.scale.height;
    const groundTop = Math.round(H * 0.54);
    const k = Phaser.Math.Clamp(Math.min(W / 1280, H / 820), 0.72, 1.55);
    const rng = mulberry32(20261030);
    const mood = currentPalette();

    this.cameras.main.setBackgroundColor(mood.skyTop);
    this.addSky(W, groundTop, k, mood, rng);
    this.addHills(W, H, groundTop, mood);
    this.addDistantTrees(W, H, groundTop, k, rng);
    this.addGround(W, H, groundTop, k, rng);
    this.addPath(W, H, groundTop, k);
    this.addPond(W, H, groundTop, k, rng);
    this.addField(W * 0.25, groundTop + (H - groundTop) * 0.6, 4, 2, 'carrots', k, rng);
    this.addField(W * 0.66, groundTop + (H - groundTop) * 0.62, 3, 2, 'wheat', k, rng);
    this.addFarmstead(W, groundTop, k, mood, rng);
    this.addTreesAndBushes(W, groundTop, k, rng);
    this.addWildlife(W, H, groundTop, k, mood, rng);
    this.addFlora(W, H, groundTop, k, rng);
    this.addAtmosphere(W, H, groundTop, k, mood, rng);

    this.backdropObjects = this.children.list.filter((obj) => !existing.has(obj));
  }

  private addSky(
    W: number,
    groundTop: number,
    k: number,
    mood: MoodPalette,
    rng: () => number
  ): void {
    const bands = 36;
    for (let i = 0; i < bands; i++) {
      const t = Math.pow(i / (bands - 1), 1.12);
      const color = mixColor(mood.skyTop, mood.skyBottom, t);
      const y = Math.floor((groundTop * i) / bands);
      const h = Math.ceil(groundTop / bands) + 1;
      this.add.rectangle(0, y, W, h, color).setOrigin(0).setDepth(-100);
    }

    for (let i = 0; i < 30; i++) {
      if (mood.stars <= 0) break;
      const star = this.add
        .image(20 + rng() * (W - 40), rng() * groundTop * 0.82, 'sparkle')
        .setScale(0.35 + rng() * 0.4)
        .setTint(0xdfe8ff)
        .setAlpha(mood.stars * (0.35 + rng() * 0.55))
        .setDepth(-95);
      this.tweens.add({
        targets: star,
        alpha: { from: star.alpha * 0.35, to: star.alpha },
        duration: 1400 + rng() * 2600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut',
        delay: rng() * 2200
      });
    }

    const celestialX = W * 0.8;
    const celestialY = groundTop * (mood.moon ? 0.24 : mood.sunHeight);
    if (mood.moon) {
      this.add
        .circle(celestialX, celestialY, 54 * k, 0xbcd4f0, 0.07)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(-91);
      const moon = this.add
        .image(celestialX, celestialY, 'moon')
        .setScale(1.9 * k)
        .setDepth(-90);
      this.tweens.add({
        targets: moon,
        alpha: { from: 0.82, to: 1 },
        duration: 5200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut'
      });
    } else {
      for (let i = 0; i < 5; i++) {
        this.add
          .circle(
            celestialX,
            celestialY,
            (96 - i * 16) * k,
            mood.sunColor,
            0.018 + i * 0.012
          )
          .setBlendMode(Phaser.BlendModes.ADD)
          .setDepth(-92 + i * 0.1);
      }
      const sun = this.add
        .image(celestialX, celestialY, 'sun')
        .setScale(2.1 * k)
        .setAlpha(mood.sunAlpha)
        .setDepth(-90);
      this.tweens.add({
        targets: sun,
        scale: sun.scaleX * 1.06,
        duration: 3200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut'
      });
    }

    const cloudCount = 6;
    for (let i = 0; i < cloudCount; i++) {
      const cloud = this.add
        .image(rng() * W, groundTop * (0.08 + rng() * 0.36), 'cloud')
        .setScale((1.1 + rng() * 1.3) * k)
        .setAlpha(0.55 + rng() * 0.3)
        .setTint(mood.moon ? 0x9fb2c8 : 0xffffff)
        .setDepth(-80);
      this.tweens.add({
        targets: cloud,
        x: cloud.x + (90 + rng() * 150) * k,
        duration: 22000 + rng() * 16000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut'
      });
    }
  }

  private addHills(W: number, H: number, groundTop: number, mood: MoodPalette): void {
    const layers = [
      {
        color: mood.farHill,
        offset: H * 0.145,
        amplitude: H * 0.055,
        frequency: 0.0018,
        phase: 1.2,
        depth: -70
      },
      {
        color: mood.midHill,
        offset: H * 0.095,
        amplitude: H * 0.045,
        frequency: 0.0026,
        phase: 3.4,
        depth: -60
      },
      {
        color: mood.nearHill,
        offset: H * 0.055,
        amplitude: H * 0.034,
        frequency: 0.0034,
        phase: 0.7,
        depth: -50
      }
    ];

    for (const layer of layers) {
      const shape = this.add.graphics().setDepth(layer.depth);
      shape.fillStyle(layer.color, 1);
      const points: Phaser.Math.Vector2[] = [];
      const step = 6;
      for (let x = 0; x <= W + step; x += step) {
        const y =
          groundTop -
          layer.offset -
          Math.sin(x * layer.frequency + layer.phase) * layer.amplitude -
          Math.sin(x * layer.frequency * 2.7 + layer.phase * 1.7) * layer.amplitude * 0.35;
        points.push(new Phaser.Math.Vector2(x, Math.round(y / 4) * 4));
      }
      const ridge = points.slice();
      points.push(new Phaser.Math.Vector2(W + step, groundTop + 4));
      points.push(new Phaser.Math.Vector2(0, groundTop + 4));
      shape.fillPoints(points, true);
      shape.lineStyle(2, mixColor(layer.color, 0xffffff, 0.14), 0.18);
      shape.strokePoints(ridge, false, false);
    }

    this.add
      .rectangle(0, groundTop - H * 0.16, W, H * 0.16, mood.hazeColor, mood.hazeAlpha)
      .setOrigin(0)
      .setDepth(-65);
  }

  private addDistantTrees(
    W: number,
    H: number,
    groundTop: number,
    k: number,
    rng: () => number
  ): void {
    for (let i = 0; i < 11; i++) {
      const x = ((i + 0.5) / 11) * W + (rng() - 0.5) * W * 0.04;
      const tree = this.add
        .image(x, groundTop + 2, 'tree_spring')
        .setOrigin(0.5, 1)
        .setScale((0.9 + rng() * 1.1) * k)
        .setAlpha(0.9)
        .setDepth(-46);
      this.tweens.add({
        targets: tree,
        angle: { from: -0.7, to: 0.7 },
        duration: 3200 + rng() * 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut',
        delay: rng() * 1800
      });
    }

    for (let i = 0; i < 14; i++) {
      const x = W * (0.32 + rng() * 0.68);
      const y = groundTop - H * 0.045 + rng() * H * 0.07;
      this.add
        .image(x, y, 'tree_spring')
        .setOrigin(0.5, 1)
        .setScale((0.55 + rng() * 0.5) * k)
        .setAlpha(0.82)
        .setDepth(-54);
    }
  }

  private addGround(
    W: number,
    H: number,
    groundTop: number,
    k: number,
    rng: () => number
  ): void {
    const cols = Math.ceil(W / 32) + 1;
    const rows = Math.ceil((H - groundTop) / 32) + 1;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const variant = (col * 7 + row * 13) % 3;
        this.add
          .image(col * 32, groundTop + row * 32, `grass_spring_${variant}`)
          .setOrigin(0)
          .setScale(2)
          .setDepth(0);
      }
    }

    for (let i = 0; i < 14; i++) {
      const x = rng() * W;
      const y = groundTop + 20 + rng() * Math.max(20, H - groundTop - 30);
      this.add
        .ellipse(
          x,
          y,
          (80 + rng() * 150) * k,
          (24 + rng() * 44) * k,
          i % 2 === 0 ? 0x2f5f2c : 0x7ab95a,
          0.045
        )
        .setDepth(0.5);
    }
  }

  private addPath(W: number, H: number, groundTop: number, k: number): void {
    for (let y = groundTop + 70 * k; y < H + 32; y += 32) {
      const center = this.pathCenter(y, groundTop, W, k);
      for (let dx = -1; dx <= 1; dx++) {
        this.add
          .image(center + dx * 32, y, 'path')
          .setOrigin(0.5, 0)
          .setScale(2)
          .setDepth(2);
      }
    }
  }

  private addPond(
    W: number,
    H: number,
    groundTop: number,
    k: number,
    rng: () => number
  ): void {
    const cx = W * 0.925;
    const cy = groundTop + (H - groundTop) * 0.56;
    const rx = Math.min(W * 0.08, 150 * k);
    const ry = Math.min((H - groundTop) * 0.23, 100 * k);
    const waterTiles: Phaser.GameObjects.Image[] = [];

    for (let y = cy - ry; y <= cy + ry; y += 16) {
      for (let x = cx - rx; x <= cx + rx; x += 16) {
        const nx = (x + 8 - cx) / (rx + 8);
        const ny = (y + 8 - cy) / (ry + 8);
        if (nx * nx + ny * ny <= 1 + (rng() - 0.5) * 0.16) {
          const tile = this.add.image(x, y, 'water0').setOrigin(0).setDepth(3);
          waterTiles.push(tile);
        }
      }
    }

    let frame = 0;
    this.addAmbientTimer(460, () => {
      frame = (frame + 1) % 3;
      waterTiles.forEach((tile, i) => tile.setTexture(`water${(frame + i) % 3}`));
    });

    for (let i = 0; i < 10; i++) {
      const angle = rng() * Math.PI * 2;
      const x = cx + Math.cos(angle) * (rx + 8);
      const y = cy + Math.sin(angle) * (ry + 8);
      this.add
        .image(x, y, 'reed')
        .setOrigin(0.5, 1)
        .setScale((1 + rng() * 0.5) * k)
        .setDepth(y);
    }

    for (let i = 0; i < 4; i++) {
      const x = cx + (rng() - 0.5) * rx * 1.4;
      const y = cy + (rng() - 0.5) * ry * 1.2;
      this.add
        .image(x, y, 'lilypad')
        .setScale((1.1 + rng() * 0.4) * k)
        .setDepth(y);
    }

    for (let i = 0; i < 7; i++) {
      const angle = rng() * Math.PI * 2;
      const x = cx + Math.cos(angle) * (rx + 18);
      const y = cy + Math.sin(angle) * (ry + 16);
      this.add
        .image(x, y, 'rock')
        .setOrigin(0.5, 1)
        .setScale((0.9 + rng() * 0.45) * k)
        .setDepth(y);
    }
  }

  private addField(
    x: number,
    y: number,
    cols: number,
    rows: number,
    cropId: string,
    k: number,
    rng: () => number
  ): void {
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const soilX = x + col * 32 + 16;
        const soilY = y + row * 32 + 16;
        this.add
          .image(soilX, soilY, row % 2 === 0 ? 'soil' : 'soil_wet')
          .setScale(2)
          .setDepth(soilY);
        if (rng() > 0.16) {
          const stage = 2 + Math.floor(rng() * 2);
          const crop = this.add
            .image(soilX, soilY + 12, `crop_${cropId}_${stage}`)
            .setOrigin(0.5, 1)
            .setScale(2 * k)
            .setDepth(soilY + 2);
          if (rng() > 0.4) {
            this.tweens.add({
              targets: crop,
              angle: { from: -1.5, to: 1.5 },
              duration: 1800 + rng() * 1200,
              yoyo: true,
              repeat: -1,
              ease: 'Sine.inOut',
              delay: rng() * 1200
            });
          }
        }
      }
    }

    for (let col = 0; col < cols; col++) {
      this.add
        .image(x + col * 32, y - 2, 'fence')
        .setOrigin(0, 1)
        .setScale(2)
        .setDepth(y - 2);
    }
  }

  private addFarmstead(
    W: number,
    groundTop: number,
    k: number,
    mood: MoodPalette,
    rng: () => number
  ): void {
    const houseX = W * 0.58;
    const houseY = groundTop + 130 * k;
    const houseScale = 3 * k;
    this.add
      .image(houseX, houseY, 'b_farmhouse')
      .setOrigin(0.5, 1)
      .setScale(houseScale)
      .setDepth(houseY);

    const smokeX = houseX + (51 - 32) * houseScale;
    const smokeY = houseY + (8 - 48) * houseScale;
    for (let i = 0; i < 5; i++) {
      const puff = this.add
        .image(smokeX, smokeY, 'cloud')
        .setScale((0.1 + i * 0.014) * k)
        .setTint(0xd8d4c8)
        .setAlpha(0)
        .setDepth(houseY + 2);
      this.tweens.add({
        targets: puff,
        x: smokeX + (14 + i * 6) * k,
        y: smokeY - (45 + i * 10) * k,
        alpha: { from: 0.3, to: 0 },
        scale: { from: puff.scaleX, to: puff.scaleX * 2.1 },
        duration: 4200 + i * 300,
        delay: i * 850,
        repeat: -1,
        ease: 'Sine.out'
      });
    }

    if (mood.warmLight > 0.05) {
      const windowY = houseY + (30 - 48) * houseScale;
      for (const wx of [14.5, 48.5]) {
        const x = houseX + (wx - 32) * houseScale;
        this.add
          .circle(x, windowY, 7 * houseScale, 0xffcf6a, 0.09 * mood.warmLight)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setDepth(houseY + 1);
        this.add
          .rectangle(
            x,
            windowY,
            7 * houseScale,
            6 * houseScale,
            0xffd878,
            0.42 * mood.warmLight
          )
          .setDepth(houseY + 1);
      }
      const groundGlow = this.add
        .ellipse(houseX, houseY - 3, 150 * k, 34 * k, 0xffc860, 0.13 * mood.warmLight)
        .setDepth(houseY - 1);
      this.tweens.add({
        targets: groundGlow,
        alpha: { from: groundGlow.alpha * 0.75, to: groundGlow.alpha },
        duration: 2800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut'
      });
    }

    const barnY = groundTop + 195 * k;
    this.add
      .image(W * 0.8, barnY, 'b_barn')
      .setOrigin(0.5, 1)
      .setScale(2.5 * k)
      .setDepth(barnY);

    const coopY = groundTop + 175 * k;
    this.add
      .image(W * 0.42, coopY, 'b_coop')
      .setOrigin(0.5, 1)
      .setScale(2.4 * k)
      .setDepth(coopY);

    const wellY = groundTop + 195 * k;
    this.add
      .image(W * 0.7, wellY, 'b_well')
      .setOrigin(0.5, 1)
      .setScale(2 * k)
      .setDepth(wellY);

    for (let i = 0; i < 3; i++) {
      const x = W * (0.5 + i * 0.06) + (rng() - 0.5) * 40;
      const y = groundTop + (250 + rng() * 80) * k;
      this.add.image(x, y, 'rock').setOrigin(0.5, 1).setScale(1.4 * k).setDepth(y);
    }
  }

  private addTreesAndBushes(W: number, groundTop: number, k: number, rng: () => number): void {
    const treeSpots: Array<[number, number, number]> = [
      [W * 0.04, groundTop + 40, 2.8],
      [W * 0.11, groundTop + 115, 2.2],
      [W * 0.2, groundTop + 40, 2.5],
      [W * 0.3, groundTop + 175, 2.2],
      [W * 0.38, groundTop + 35, 2],
      [W * 0.51, groundTop + 20, 1.8],
      [W * 0.71, groundTop + 30, 2.2],
      [W * 0.88, groundTop + 35, 2.6],
      [W * 0.97, groundTop + 120, 2.3],
      [W * 0.86, groundTop + 270, 2],
      [W * 0.08, groundTop + 285, 2.1],
      [W * 0.34, groundTop + 310, 1.9]
    ];

    for (const [x, y, scale] of treeSpots) {
      const tree = this.add
        .image(x, y, 'tree_spring')
        .setOrigin(0.5, 1)
        .setScale(scale * k)
        .setDepth(y);
      const sway = 0.7 + rng() * 1.1;
      this.tweens.add({
        targets: tree,
        angle: { from: -sway, to: sway },
        duration: 2400 + rng() * 1800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut',
        delay: rng() * 1800
      });
    }

    for (let i = 0; i < 9; i++) {
      const x = W * (0.06 + rng() * 0.88);
      const y = groundTop + 45 + rng() * Math.max(80, this.scale.height - groundTop - 80);
      const bush = this.add
        .image(x, y, 'bush')
        .setOrigin(0.5, 1)
        .setScale((1.1 + rng() * 0.7) * k)
        .setDepth(y);
      this.tweens.add({
        targets: bush,
        angle: { from: -0.8, to: 0.8 },
        duration: 2200 + rng() * 1400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut',
        delay: rng() * 1400
      });
    }
  }

  private addWildlife(
    W: number,
    H: number,
    groundTop: number,
    k: number,
    mood: MoodPalette,
    rng: () => number
  ): void {
    interface AnimatedAnimal {
      image: Phaser.GameObjects.Image;
      species: string;
      frame: number;
    }
    const animals: AnimatedAnimal[] = [];
    const addAnimal = (species: string, x: number, y: number, scale: number) => {
      const image = this.add
        .image(x, y, `animal_${species}_0`)
        .setOrigin(0.5, 1)
        .setScale(scale * k)
        .setDepth(y);
      animals.push({ image, species, frame: 0 });
      return image;
    };

    const chickenA = addAnimal('chicken', W * 0.44, groundTop + 270 * k, 2.4);
    const chickenB = addAnimal('chicken', W * 0.47, groundTop + 285 * k, 2.1);
    const chickenC = addAnimal('chicken', W * 0.4, groundTop + 292 * k, 2.2);
    const sheepA = addAnimal('sheep', W * 0.76, groundTop + 310 * k, 2.5);
    const sheepB = addAnimal('sheep', W * 0.83, groundTop + 330 * k, 2.2);
    const duck = addAnimal('duck', W * 0.88, groundTop + 335 * k, 2.2);

    this.tweens.add({
      targets: chickenA,
      x: chickenA.x + 22 * k,
      duration: 1300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut'
    });
    this.tweens.add({
      targets: chickenB,
      x: chickenB.x - 18 * k,
      duration: 1700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut'
    });
    this.tweens.add({
      targets: chickenC,
      angle: { from: -2, to: 2 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut'
    });
    this.tweens.add({
      targets: sheepA,
      x: sheepA.x + 32 * k,
      duration: 7200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut'
    });
    this.tweens.add({
      targets: sheepB,
      x: sheepB.x - 24 * k,
      duration: 8800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut'
    });
    this.tweens.add({
      targets: duck,
      x: duck.x - 28 * k,
      y: duck.y - 2 * k,
      duration: 2100,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut'
    });

    this.addAmbientTimer(250, () => {
      for (const animal of animals) {
        animal.frame = (animal.frame + 1) % 2;
        animal.image.setTexture(`animal_${animal.species}_${animal.frame}`);
      }
    });

    interface Butterfly {
      image: Phaser.GameObjects.Image;
      variant: number;
    }
    const butterflies: Butterfly[] = [];
    for (let i = 0; i < 6; i++) {
      const variant = i % 2;
      const x = W * (0.14 + rng() * 0.7);
      const y = groundTop + 40 + rng() * Math.max(60, H - groundTop - 120);
      const image = this.add
        .image(x, y, `butterfly_${variant}_0`)
        .setScale(1.2 * k)
        .setDepth(y);
      butterflies.push({ image, variant });
      this.tweens.add({
        targets: image,
        x: x + (rng() - 0.5) * 120 * k,
        y: y + (rng() - 0.5) * 80 * k,
        duration: 2600 + rng() * 2200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut'
      });
    }
    let butterflyFrame = 0;
    this.addAmbientTimer(170, () => {
      butterflyFrame ^= 1;
      for (const butterfly of butterflies) {
        butterfly.image.setTexture(`butterfly_${butterfly.variant}_${butterflyFrame}`);
      }
    });

    if (mood.stars > 0.7) return;

    const birds: Phaser.GameObjects.Image[] = [];
    for (let i = 0; i < 3; i++) {
      const direction = i % 2 === 0 ? 1 : -1;
      const startX = direction > 0 ? -48 : W + 48;
      const endX = direction > 0 ? W + 48 : -48;
      const bird = this.add
        .image(startX, groundTop * (0.16 + rng() * 0.24), 'bird_0')
        .setScale(1.4 * k)
        .setAlpha(0.72)
        .setFlipX(direction < 0)
        .setDepth(-75);
      birds.push(bird);
      this.tweens.add({
        targets: bird,
        x: endX,
        duration: 17000 + rng() * 9000,
        repeat: -1,
        ease: 'Linear',
        delay: rng() * 3000
      });
      this.tweens.add({
        targets: bird,
        angle: { from: -5, to: 5 },
        duration: 1100 + rng() * 400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut'
      });
    }
    let birdFrame = 0;
    this.addAmbientTimer(150, () => {
      birdFrame ^= 1;
      for (const bird of birds) bird.setTexture(`bird_${birdFrame}`);
    });
  }

  private addFlora(W: number, H: number, groundTop: number, k: number, rng: () => number): void {
    for (let i = 0; i < 40; i++) {
      const x = 20 + rng() * (W * 0.82 - 40);
      const y = groundTop + 16 + rng() * Math.max(40, H - groundTop - 40);
      if (Math.abs(x - this.pathCenter(y, groundTop, W, k)) < 52 * k) continue;
      const flower = this.add
        .image(x, y, `flower_${i % 4}`)
        .setOrigin(0.5, 1)
        .setScale((1.6 + rng() * 0.6) * k)
        .setDepth(y);
      this.tweens.add({
        targets: flower,
        angle: { from: -2.2, to: 2.2 },
        duration: 1900 + rng() * 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut',
        delay: rng() * 1500
      });
    }

    for (let i = 0; i < 55; i++) {
      const x = 16 + rng() * (W * 0.84 - 32);
      const y = groundTop + 10 + rng() * Math.max(30, H - groundTop - 30);
      if (Math.abs(x - this.pathCenter(y, groundTop, W, k)) < 30 * k) continue;
      const tuft = this.add
        .image(x, y, 'tuft')
        .setOrigin(0.5, 1)
        .setScale((1.4 + rng() * 0.8) * k)
        .setDepth(y);
      this.tweens.add({
        targets: tuft,
        angle: { from: -3, to: 3 },
        duration: 1600 + rng() * 1300,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut',
        delay: rng() * 1400
      });
    }
  }

  private addAtmosphere(
    W: number,
    H: number,
    groundTop: number,
    k: number,
    mood: MoodPalette,
    rng: () => number
  ): void {
    this.add
      .rectangle(0, 0, W, H, mood.tintColor, mood.tintAlpha)
      .setOrigin(0)
      .setDepth(5000);

    if (mood.name === 'dusk' || mood.name === 'night') {
      for (let i = 0; i < 18; i++) {
        const x = 30 + rng() * (W - 60);
        const y = groundTop + 50 + rng() * Math.max(30, H - groundTop - 80);
        const firefly = this.add
          .image(x, y, 'sparkle')
          .setTint(0xffe58a)
          .setScale((0.45 + rng() * 0.45) * k)
          .setAlpha(0)
          .setDepth(y + 1);
        this.tweens.add({
          targets: firefly,
          alpha: { from: 0, to: 0.55 + rng() * 0.35 },
          x: x + (rng() - 0.5) * 46 * k,
          y: y - (6 + rng() * 16) * k,
          duration: 1800 + rng() * 2200,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.inOut',
          delay: rng() * 2400
        });
      }
    }

    const vignette = this.add.graphics().setDepth(5001);
    vignette.fillStyle(0x061006, 0.1);
    vignette.fillRect(0, 0, W, 22);
    vignette.fillRect(0, H - 22, W, 22);
    vignette.fillRect(0, 0, 22, H);
    vignette.fillRect(W - 22, 0, 22, H);
  }
}

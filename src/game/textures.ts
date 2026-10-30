import Phaser from 'phaser';
import { ANIMALS, BUILDINGS, CROPS, ITEMS, NPCS, SEASONS, SEASON_INFO } from '../data/definitions';
import type { AnimalDef, CropDef, NpcDef, Season } from '../types';
import { mulberry32 } from '../systems/util';

type Ctx = CanvasRenderingContext2D;

function hex(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`;
}

function shade(color: number, amount: number): string {
  const r = Math.max(0, Math.min(255, ((color >> 16) & 0xff) + amount));
  const g = Math.max(0, Math.min(255, ((color >> 8) & 0xff) + amount));
  const b = Math.max(0, Math.min(255, (color & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function makeTexture(
  scene: Phaser.Scene,
  key: string,
  w: number,
  h: number,
  draw: (ctx: Ctx, w: number, h: number) => void
): void {
  if (scene.textures.exists(key)) return;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  draw(ctx, w, h);
  scene.textures.addCanvas(key, canvas);
}

function px(ctx: Ctx, x: number, y: number, w: number, h: number, color: string | number): void {
  ctx.fillStyle = typeof color === 'number' ? hex(color) : color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function disc(ctx: Ctx, cx: number, cy: number, r: number, color: string | number): void {
  const c = typeof color === 'number' ? hex(color) : color;
  px(ctx, cx - r + 1, cy - r, r * 2 - 2, r * 2, c);
  px(ctx, cx - r, cy - r + 1, r * 2, r * 2 - 2, c);
}

function grassTile(ctx: Ctx, w: number, h: number, base: number, rng: () => number): void {
  px(ctx, 0, 0, w, h, base);
  for (let i = 0; i < 26; i++) {
    const x = Math.floor(rng() * w);
    const y = Math.floor(rng() * h);
    px(ctx, x, y, 1, 2, shade(base, rng() > 0.5 ? 18 : -16));
  }
  for (let i = 0; i < 4; i++) {
    const x = Math.floor(rng() * (w - 2));
    const y = Math.floor(rng() * (h - 2));
    px(ctx, x, y, 2, 1, shade(base, 26));
  }
}

function drawTree(ctx: Ctx, season: Season): void {
  const info = SEASON_INFO[season];
  const dark = info.tree;
  const light = info.tree2;
  px(ctx, 0, 0, 24, 32, 'rgba(0,0,0,0)');
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(12, 29, 9, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  // trunk
  px(ctx, 10, 19, 4, 10, '#6b4a2a');
  px(ctx, 10, 19, 1, 10, '#835c36');
  // canopy blocks
  px(ctx, 8, 4, 8, 16, dark);
  px(ctx, 6, 6, 12, 12, dark);
  px(ctx, 4, 8, 16, 8, dark);
  px(ctx, 7, 5, 8, 6, light);
  px(ctx, 5, 8, 4, 5, light);
  px(ctx, 15, 10, 4, 4, shade(dark, -12));
  px(ctx, 6, 15, 12, 3, shade(dark, -18));
  px(ctx, 9, 13, 2, 2, shade(light, 18));
  if (season === 'fall') {
    px(ctx, 8, 9, 2, 2, '#e2a13a');
    px(ctx, 14, 14, 2, 2, '#c9722a');
    px(ctx, 12, 7, 1, 1, '#f0c050');
  }
  if (season === 'spring') {
    px(ctx, 8, 8, 2, 2, '#f0b8cf');
    px(ctx, 15, 12, 1, 1, '#fff0f4');
  }
  if (season === 'winter') {
    px(ctx, 7, 5, 10, 2, '#eef6f4');
    px(ctx, 5, 8, 4, 2, '#e2eeeb');
  }
}

function drawFlower(ctx: Ctx, variant: number): void {
  px(ctx, 0, 0, 16, 16, 'rgba(0,0,0,0)');
  const colors = ['#f0d75a', '#e88bb0', '#c9a0f0', '#f0f0f0'];
  px(ctx, 7, 9, 2, 6, '#4f8c38');
  px(ctx, 5, 11, 2, 1, '#6fae4f');
  px(ctx, 9, 12, 2, 1, '#6fae4f');
  disc(ctx, 8, 7, 2, colors[variant % colors.length]);
  px(ctx, 7, 5, 2, 1, '#fff6c0');
  px(ctx, 5, 7, 1, 1, '#fff6c0');
  px(ctx, 10, 7, 1, 1, '#fff6c0');
}

function drawRock(ctx: Ctx): void {
  px(ctx, 0, 0, 16, 16, 'rgba(0,0,0,0)');
  px(ctx, 3, 8, 10, 6, '#8b9096');
  px(ctx, 4, 6, 8, 3, '#a3a9ae');
  px(ctx, 5, 5, 4, 2, '#b8bec2');
  px(ctx, 11, 9, 2, 3, '#727880');
  px(ctx, 3, 13, 10, 1, '#5f646b');
}

function drawMineRock(ctx: Ctx, kind: 'stone' | 'copper' | 'iron' | 'gold' | 'gem' | 'broken'): void {
  px(ctx, 0, 0, 16, 16, 'rgba(0,0,0,0)');
  if (kind === 'broken') {
    px(ctx, 4, 11, 8, 4, '#6f747a');
    px(ctx, 5, 10, 3, 2, '#8b9096');
    px(ctx, 10, 9, 2, 2, '#8b9096');
    px(ctx, 7, 8, 2, 2, '#5f646b');
    return;
  }
  px(ctx, 2, 7, 12, 8, '#7d838a');
  px(ctx, 3, 5, 10, 4, '#959ba1');
  px(ctx, 5, 4, 6, 2, '#adb3b8');
  px(ctx, 11, 9, 2, 4, '#666c73');
  px(ctx, 2, 14, 12, 1, '#555a61');
  const ore: Record<string, [string, string]> = {
    stone: ['#a8adb2', '#c4c9cc'],
    copper: ['#c87a3a', '#e0a060'],
    iron: ['#b8c0c8', '#d8e0e8'],
    gold: ['#e0b840', '#f8dc70'],
    gem: ['#8a6ad8', '#c0a8f8']
  };
  const [dark, light] = ore[kind];
  px(ctx, 5, 8, 2, 2, dark);
  px(ctx, 5, 8, 1, 1, light);
  px(ctx, 9, 6, 2, 2, dark);
  px(ctx, 10, 6, 1, 1, light);
  px(ctx, 8, 11, 2, 2, dark);
  px(ctx, 9, 11, 1, 1, light);
  if (kind === 'gem') {
    px(ctx, 11, 11, 1, 2, '#f0e8ff');
  }
}

function drawWater(ctx: Ctx, frame: number): void {
  px(ctx, 0, 0, 16, 16, '#4e93c4');
  for (let y = 0; y < 16; y += 4) {
    px(ctx, 0, y, 16, 1, '#4485b4');
  }
  const offset = frame * 4;
  for (let i = 0; i < 3; i++) {
    const x = (i * 6 + offset) % 16;
    px(ctx, x, 3 + i * 5, 4, 1, '#9fd4ee');
    px(ctx, (x + 9) % 16, 5 + i * 5, 2, 1, '#6fb0d8');
  }
}

function drawSoil(ctx: Ctx, state: 'dry' | 'wet' | 'fert'): void {
  const base = state === 'wet' ? '#6a4a2f' : '#8a5a34';
  px(ctx, 0, 0, 16, 16, base);
  for (let y = 2; y < 16; y += 4) {
    px(ctx, 0, y, 16, 1, shade(state === 'wet' ? 0x6a4a2f : 0x8a5a34, -18));
    px(ctx, 0, y + 1, 16, 1, shade(state === 'wet' ? 0x6a4a2f : 0x8a5a34, 10));
  }
  const rng = mulberry32(state === 'wet' ? 77 : 33);
  for (let i = 0; i < 8; i++) {
    px(ctx, Math.floor(rng() * 15), Math.floor(rng() * 15), 1, 1, shade(state === 'wet' ? 0x6a4a2f : 0x8a5a34, -22));
  }
  if (state === 'fert') {
    for (let i = 0; i < 10; i++) {
      px(ctx, 1 + Math.floor(rng() * 14), 1 + Math.floor(rng() * 14), 2, 2, i % 2 ? '#a8d86a' : '#78b343');
    }
  }
  if (state === 'wet') {
    px(ctx, 3, 4, 2, 1, '#8fb0c8');
    px(ctx, 10, 9, 2, 1, '#8fb0c8');
  }
}

function drawPath(ctx: Ctx): void {
  px(ctx, 0, 0, 16, 16, '#c4a06a');
  const rng = mulberry32(9);
  for (let i = 0; i < 20; i++) {
    px(ctx, Math.floor(rng() * 15), Math.floor(rng() * 15), 2, 1, i % 3 ? '#b28d58' : '#d4b27c');
  }
  px(ctx, 0, 0, 16, 1, '#a9855a');
  px(ctx, 0, 15, 16, 1, '#a9855a');
}

function drawPlayer(ctx: Ctx, dir: 'down' | 'up' | 'left' | 'right', frame: number): void {
  px(ctx, 0, 0, 16, 24, 'rgba(0,0,0,0)');
  const skin = '#f0c9a0';
  const skinDark = '#d8a878';
  const hat = '#d9b35a';
  const hatDark = '#b08a3a';
  const shirt = '#4f86c8';
  const shirtDark = '#3a68a0';
  const overall = '#3f6a4a';
  const boot = '#5a4632';
  const stride = frame === 0 ? 0 : frame === 1 ? 1 : -1;

  if (dir === 'left' || dir === 'right') {
    const flip = dir === 'left' ? -1 : 1;
    // legs
    px(ctx, 6 + (frame === 1 ? 1 : 0), 19, 2, 4, boot);
    px(ctx, 9 - (frame === 2 ? 1 : 0), 19, 2, 4, boot);
    // body
    px(ctx, 5, 12, 6, 8, shirt);
    px(ctx, 5, 15, 6, 4, overall);
    px(ctx, 5, 12, 1, 8, shirtDark);
    // arm
    px(ctx, 8 + flip, 13, 2, 4, skin);
    // head
    px(ctx, 5, 6, 6, 6, skin);
    px(ctx, 5, 6, 1, 6, skinDark);
    px(ctx, 9 + Math.max(0, flip), 8, 1, 1, '#3a2a1a');
    // hat
    px(ctx, 4, 4, 8, 2, hatDark);
    px(ctx, 5, 2, 6, 2, hat);
    px(ctx, 11, 5, 2, 1, hatDark);
  } else {
    // legs
    px(ctx, 6, 19, 2, 4, boot);
    px(ctx, 9, 19, 2, 4, boot);
    if (frame !== 0) {
      px(ctx, 6 + (stride > 0 ? 1 : 0), 19, 2, 1, '#463526');
      px(ctx, 9 + (stride < 0 ? -1 : 0), 21, 2, 2, boot);
    }
    // body
    px(ctx, 5, 12, 6, 8, shirt);
    px(ctx, 5, 15, 6, 4, overall);
    px(ctx, 7, 12, 2, 5, shirtDark);
    // arms
    px(ctx, 4, 13, 2, 4, skin);
    px(ctx, 11, 13, 2, 4, skin);
    px(ctx, 4, 13, 1, 4, skinDark);
    // head
    px(ctx, 5, 6, 6, 6, skin);
    px(ctx, 5, 6, 1, 6, skinDark);
    if (dir === 'down') {
      px(ctx, 6, 8, 1, 1, '#3a2a1a');
      px(ctx, 9, 8, 1, 1, '#3a2a1a');
      px(ctx, 7, 10, 2, 1, '#c88a72');
    } else {
      px(ctx, 7, 7, 2, 3, '#8a6a3a');
    }
    // hat
    px(ctx, 4, 4, 8, 2, hatDark);
    px(ctx, 5, 2, 6, 2, hat);
    if (dir === 'down') {
      px(ctx, 5, 5, 6, 1, '#c09a4a');
    }
  }
}


function drawNpc(ctx: Ctx, def: NpcDef, frame: number): void {
  px(ctx, 0, 0, 16, 24, 'rgba(0,0,0,0)');
  const hair = hex(def.colors[0] ?? 0x6a5a4a);
  const shirt = hex(def.colors[1] ?? 0x6a9a5a);
  const accent = hex(def.colors[2] ?? 0x8a5a3a);
  const skin = '#f0c9a0';
  const skinDark = '#d8a878';
  const boot = '#4a3a2a';
  const bob = frame % 2;
  px(ctx, 6, 20 - bob, 2, 4, boot);
  px(ctx, 9, 20 + bob, 2, 4 - bob, boot);
  px(ctx, 5, 12, 6, 8, shirt);
  px(ctx, 5, 15, 6, 2, accent);
  px(ctx, 4, 13, 2, 4, skin);
  px(ctx, 11, 13, 2, 4, skin);
  px(ctx, 5, 6, 6, 6, skin);
  px(ctx, 5, 6, 1, 6, skinDark);
  px(ctx, 6, 8, 1, 1, '#2a1a0a');
  px(ctx, 9, 8, 1, 1, '#2a1a0a');
  px(ctx, 7, 10, 2, 1, '#c88a72');
  px(ctx, 4, 4, 8, 3, hair);
  px(ctx, 5, 3, 6, 2, shade(parseInt(hair.slice(1), 16), 18));
  px(ctx, 4, 6, 1, 4, hair);
  px(ctx, 11, 6, 1, 4, hair);
  if (def.id === 'mira') {
    px(ctx, 11, 3, 2, 2, '#f8d8e8');
    px(ctx, 12, 2, 1, 1, '#fff0f4');
  } else if (def.id === 'rowan') {
    px(ctx, 4, 2, 8, 2, accent);
    px(ctx, 11, 2, 3, 1, accent);
  } else if (def.id === 'tessa') {
    px(ctx, 3, 3, 10, 2, accent);
    px(ctx, 5, 2, 6, 1, shade(parseInt(accent.slice(1), 16), 20));
  } else if (def.id === 'orin') {
    px(ctx, 6, 8, 3, 1, '#3a4a5a');
    px(ctx, 9, 8, 3, 1, '#3a4a5a');
  } else if (def.id === 'june') {
    px(ctx, 5, 11, 6, 1, accent);
  }
}

function drawCrop(ctx: Ctx, def: CropDef, stage: number): void {
  px(ctx, 0, 0, 16, 16, 'rgba(0,0,0,0)');
  const leaf = hex(def.palette[0]);
  const leaf2 = hex(def.palette[1]);
  const fruit = hex(def.palette[2]);
  const fruitDark = hex(def.palette[3]);
  const stem = '#3f6f2f';
  const h = stage === 0 ? 3 : stage === 1 ? 5 : stage === 2 ? 9 : 12;

  const sprout = (topY: number) => {
    px(ctx, 7, topY, 2, 16 - topY, stem);
    px(ctx, 5, topY + 1, 2, 2, leaf);
    px(ctx, 9, topY + 1, 2, 2, leaf2);
    if (stage >= 1) {
      px(ctx, 4, topY + 3, 3, 2, leaf2);
      px(ctx, 9, topY + 4, 3, 2, leaf);
    }
  };

  switch (def.shape) {
    case 'wheat':
      for (const x of [5, 8, 11]) {
        px(ctx, x, 16 - h, 1, h, x === 8 ? '#c8b04a' : '#a8943a');
        if (stage >= 2) {
          px(ctx, x - 1, 16 - h, 3, 2, fruit);
          px(ctx, x - 1, 16 - h + 3, 2, 1, fruitDark);
        }
        if (stage === 3) {
          px(ctx, x - 1, 16 - h - 2, 3, 2, fruit);
          px(ctx, x, 16 - h - 3, 1, 1, fruitDark);
        }
      }
      px(ctx, 4, 14, 8, 2, leaf);
      break;
    case 'corn':
      px(ctx, 7, 16 - h, 2, h, stem);
      px(ctx, 4, 16 - h + 3, 3, 2, leaf);
      px(ctx, 9, 16 - h + 5, 3, 2, leaf2);
      if (stage >= 2) {
        px(ctx, 9, 16 - h + 2, 2, 5, leaf);
      }
      if (stage === 3) {
        px(ctx, 10, 5, 3, 6, fruit);
        px(ctx, 10, 6, 3, 1, '#f0dc70');
        px(ctx, 10, 8, 3, 1, '#f0dc70');
        px(ctx, 12, 5, 1, 6, fruitDark);
        px(ctx, 5, 3, 2, 5, leaf2);
      }
      break;
    case 'sunflower':
      px(ctx, 7, 16 - h, 2, h, stem);
      px(ctx, 5, 13, 4, 2, leaf);
      px(ctx, 8, 11, 4, 2, leaf2);
      if (stage >= 2) {
        disc(ctx, 8, 16 - h + 1, 3, leaf2);
      }
      if (stage === 3) {
        disc(ctx, 8, 5, 4, fruit);
        disc(ctx, 8, 5, 2, '#6a4a22');
        px(ctx, 7, 4, 1, 1, '#2f2214');
        px(ctx, 9, 6, 1, 1, '#2f2214');
        px(ctx, 4, 5, 1, 2, fruitDark);
        px(ctx, 12, 6, 1, 2, fruitDark);
      }
      break;
    case 'carrot':
      if (stage === 0) {
        sprout(11);
      } else {
        for (const x of [5, 8, 11]) {
          px(ctx, x, 16 - h, 1, h, x === 8 ? leaf : leaf2);
          px(ctx, x - 1, 16 - h + 1, 2, 2, leaf);
          px(ctx, x + 1, 16 - h + 3, 2, 2, leaf2);
        }
        if (stage === 3) {
          px(ctx, 6, 13, 4, 1, '#b86924');
          px(ctx, 7, 14, 2, 1, fruit);
          px(ctx, 7, 15, 1, 1, fruitDark);
        }
      }
      break;
    case 'potato':
      px(ctx, 7, 16 - h, 1, h, stem);
      px(ctx, 4, 16 - h, 4, 3, leaf);
      px(ctx, 9, 16 - h + 1, 4, 3, leaf2);
      if (stage >= 2) {
        px(ctx, 3, 16 - h + 4, 10, 3, leaf);
        px(ctx, 5, 16 - h + 3, 4, 2, leaf2);
      }
      if (stage === 3) {
        px(ctx, 4, 12, 3, 2, fruit);
        px(ctx, 9, 13, 3, 2, fruitDark);
        px(ctx, 5, 12, 1, 1, '#d8b878');
      }
      break;
    case 'tomato':
      px(ctx, 7, 16 - h, 2, h, stem);
      px(ctx, 4, 16 - h + 2, 4, 3, leaf);
      px(ctx, 9, 16 - h + 3, 4, 3, leaf2);
      if (stage >= 2) {
        px(ctx, 3, 16 - h + 5, 10, 3, leaf);
        px(ctx, 5, 16 - h + 4, 3, 2, leaf2);
      }
      if (stage === 3) {
        px(ctx, 4, 10, 3, 3, fruit);
        px(ctx, 9, 9, 3, 3, fruit);
        px(ctx, 10, 11, 2, 2, fruitDark);
        px(ctx, 5, 10, 1, 1, '#f08070');
      }
      break;
    case 'strawberry':
      px(ctx, 7, 16 - h, 1, h, stem);
      px(ctx, 4, 16 - h, 4, 2, leaf);
      px(ctx, 9, 16 - h + 1, 3, 2, leaf2);
      if (stage >= 2) {
        px(ctx, 3, 16 - h + 3, 10, 3, leaf);
        px(ctx, 5, 16 - h + 2, 4, 2, leaf2);
      }
      if (stage === 3) {
        px(ctx, 4, 12, 2, 3, fruit);
        px(ctx, 9, 11, 2, 3, fruit);
        px(ctx, 11, 13, 2, 2, fruitDark);
        px(ctx, 4, 11, 2, 1, '#f8f0e8');
        px(ctx, 5, 13, 1, 1, '#ffe0c0');
      }
      break;
    case 'pumpkin':
      px(ctx, 5, 14, 6, 2, leaf);
      px(ctx, 3, 12, 4, 2, leaf2);
      px(ctx, 9, 13, 4, 2, leaf2);
      if (stage >= 2) {
        px(ctx, 4, 11, 8, 1, leaf);
      }
      if (stage === 3) {
        disc(ctx, 8, 10, 4, fruit);
        px(ctx, 5, 7, 6, 1, fruitDark);
        px(ctx, 8, 6, 2, 2, stem);
        px(ctx, 6, 9, 1, 4, fruitDark);
        px(ctx, 9, 9, 1, 4, fruitDark);
        px(ctx, 4, 12, 8, 1, fruitDark);
        px(ctx, 6, 8, 1, 1, '#f0a860');
      }
      break;
    case 'cabbage':
      if (stage === 0) {
        sprout(11);
      } else {
        disc(ctx, 8, 12, stage === 1 ? 3 : stage === 2 ? 4 : 5, leaf2);
        if (stage >= 2) {
          px(ctx, 4, 10, 8, 2, leaf);
          px(ctx, 5, 13, 6, 2, leaf);
          px(ctx, 8, 8, 1, 4, leaf);
        }
        if (stage === 3) {
          px(ctx, 5, 7, 6, 2, '#c8e8a0');
          px(ctx, 6, 10, 4, 3, '#a8d878');
          px(ctx, 9, 9, 1, 3, '#78b343');
          px(ctx, 7, 12, 1, 1, '#78b343');
        }
      }
      break;
    case 'rice':
      for (const x of [5, 8, 11]) {
        px(ctx, x, 16 - h, 1, h, x === 8 ? '#d8d0a0' : '#c0b888');
        if (stage >= 2) {
          px(ctx, x - 1, 16 - h + 1, 2, 1, '#c0d878');
        }
        if (stage === 3) {
          px(ctx, x, 16 - h - 2, 1, 3, '#e8e3c0');
          px(ctx, x - 1, 16 - h, 2, 1, '#f0ecc8');
        }
      }
      px(ctx, 4, 15, 8, 1, '#9bb85a');
      break;
  }
}

function drawAnimal(ctx: Ctx, def: AnimalDef, frame: number): void {
  px(ctx, 0, 0, 20, 16, 'rgba(0,0,0,0)');
  const [body, body2, accent] = def.colors;
  const legOffset = frame === 0 ? 0 : 1;
  switch (def.id) {
    case 'chicken':
      px(ctx, 6, 5, 8, 7, body);
      px(ctx, 5, 7, 2, 4, body2);
      px(ctx, 12, 4, 4, 5, body);
      px(ctx, 13, 2, 2, 2, '#d83a3a');
      px(ctx, 12, 4, 1, 1, '#3a2a1a');
      px(ctx, 15, 6, 2, 1, '#e8a23a');
      px(ctx, 9, 11, 1, 3, '#e8a23a');
      px(ctx, 12, 11 + legOffset, 1, 3 - legOffset, '#e8a23a');
      px(ctx, 7, 8, 1, 1, '#f8f8f0');
      break;
    case 'duck':
      px(ctx, 5, 6, 9, 6, body);
      px(ctx, 4, 8, 2, 3, body2);
      px(ctx, 12, 3, 4, 5, '#3f7d5a');
      px(ctx, 12, 3, 4, 2, '#2f6a4a');
      px(ctx, 15, 6, 2, 1, '#e8b83a');
      px(ctx, 13, 4, 1, 1, '#f8f8f0');
      px(ctx, 8, 11, 1, 2, '#e8a23a');
      px(ctx, 11, 11 + legOffset, 1, 2 - legOffset, '#e8a23a');
      break;
    case 'cow':
      px(ctx, 4, 5, 12, 7, body);
      px(ctx, 6, 6, 3, 3, body2);
      px(ctx, 11, 8, 3, 2, body2);
      px(ctx, 3, 4, 4, 4, body);
      px(ctx, 2, 6, 2, 3, accent);
      px(ctx, 3, 3, 1, 2, '#e8e0c8');
      px(ctx, 5, 2, 1, 2, '#e8e0c8');
      px(ctx, 2, 6, 1, 1, '#3a2a1a');
      px(ctx, 6, 11, 2, 4, body2);
      px(ctx, 11, 11 + legOffset, 2, 4 - legOffset, body2);
      break;
    case 'sheep':
      disc(ctx, 8, 8, 5, body);
      disc(ctx, 5, 7, 3, body);
      disc(ctx, 11, 7, 3, body);
      px(ctx, 3, 7, 3, 4, accent);
      px(ctx, 3, 8, 1, 1, '#f8f8f0');
      px(ctx, 5, 12, 1, 3, accent);
      px(ctx, 10, 12 + legOffset, 1, 3 - legOffset, accent);
      px(ctx, 6, 6, 1, 1, '#f8f8f0');
      break;
    case 'pig':
      px(ctx, 4, 6, 12, 6, body);
      px(ctx, 3, 5, 3, 3, body2);
      px(ctx, 2, 7, 2, 2, accent);
      px(ctx, 3, 7, 1, 1, '#8a4040');
      px(ctx, 5, 4, 2, 2, body2);
      px(ctx, 12, 4, 2, 2, body2);
      px(ctx, 6, 12, 2, 3, body2);
      px(ctx, 11, 12 + legOffset, 2, 3 - legOffset, body2);
      px(ctx, 5, 7, 1, 1, '#8a4040');
      break;
  }
}

function drawBuilding(ctx: Ctx, id: string, w: number, h: number): void {
  px(ctx, 0, 0, w, h, 'rgba(0,0,0,0)');
  const wall = '#d8b98a';
  const wallDark = '#b8996a';
  const roof = '#b85a4a';
  const roofDark = '#8f4034';
  const wood = '#8a5a34';
  const woodDark = '#6b4426';

  switch (id) {
    case 'farmhouse': {
      px(ctx, 4, 20, w - 8, h - 22, wall);
      px(ctx, 4, 20, w - 8, 2, '#efe0c0');
      px(ctx, 4, 20, 2, h - 22, wallDark);
      // roof
      px(ctx, 0, 12, w, 10, roof);
      px(ctx, 3, 8, w - 6, 5, roofDark);
      px(ctx, 0, 21, w, 2, '#7a342a');
      for (let x = 4; x < w - 4; x += 8) px(ctx, x, 12, 4, 10, roofDark);
      // chimney
      px(ctx, w - 16, 3, 6, 10, '#9a8a7a');
      px(ctx, w - 16, 3, 6, 2, '#b8a898');
      // door
      px(ctx, w / 2 - 5, h - 16, 10, 14, woodDark);
      px(ctx, w / 2 - 4, h - 15, 8, 12, wood);
      px(ctx, w / 2 + 2, h - 10, 2, 2, '#e8c86a');
      // windows
      px(ctx, 10, 26, 9, 8, '#8ec8d8');
      px(ctx, 10, 26, 9, 2, '#b8e8f0');
      px(ctx, 14, 26, 1, 8, '#6a8a9a');
      px(ctx, 10, 30, 9, 1, '#6a8a9a');
      px(ctx, w - 20, 26, 9, 8, '#8ec8d8');
      px(ctx, w - 20, 26, 9, 2, '#b8e8f0');
      px(ctx, w - 16, 26, 1, 8, '#6a8a9a');
      px(ctx, w - 20, 30, 9, 1, '#6a8a9a');
      px(ctx, 2, h - 2, w - 4, 2, 'rgba(0,0,0,0.18)');
      break;
    }
    case 'barn': {
      px(ctx, 2, 18, w - 4, h - 20, '#b0483c');
      px(ctx, 2, 18, w - 4, 2, '#c85a4c');
      px(ctx, 2, 18, 2, h - 20, '#8a3428');
      px(ctx, 0, 10, w, 9, '#8a3428');
      px(ctx, 4, 6, w - 8, 5, '#a8402f');
      px(ctx, 0, 10, w, 2, '#6b241c');
      for (let x = 6; x < w - 6; x += 10) px(ctx, x, 12, 4, 7, '#6b241c');
      // doors
      px(ctx, w / 2 - 10, h - 18, 20, 16, '#f0e2c8');
      px(ctx, w / 2 - 9, h - 17, 18, 14, '#a8402f');
      px(ctx, w / 2 - 9, h - 17, 1, 14, '#f0e2c8');
      px(ctx, w / 2 + 8, h - 17, 1, 14, '#f0e2c8');
      ctx.save();
      ctx.strokeStyle = '#f0e2c8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(w / 2 - 9, h - 17);
      ctx.lineTo(w / 2 + 9, h - 3);
      ctx.moveTo(w / 2 + 9, h - 17);
      ctx.lineTo(w / 2 - 9, h - 3);
      ctx.stroke();
      ctx.restore();
      px(ctx, 8, 24, 7, 5, '#f0e2c8');
      px(ctx, 9, 25, 5, 3, '#6a8a9a');
      px(ctx, w - 15, 24, 7, 5, '#f0e2c8');
      px(ctx, w - 14, 25, 5, 3, '#6a8a9a');
      px(ctx, 2, h - 2, w - 4, 2, 'rgba(0,0,0,0.2)');
      break;
    }
    case 'coop': {
      px(ctx, 3, 13, w - 6, h - 15, wall);
      px(ctx, 3, 13, w - 6, 2, '#efe0c0');
      px(ctx, 3, 13, 2, h - 15, wallDark);
      px(ctx, 0, 8, w, 7, roofDark);
      px(ctx, 3, 5, w - 6, 4, roof);
      for (let x = 4; x < w - 4; x += 7) px(ctx, x, 8, 3, 6, '#5a3a24');
      px(ctx, 7, h - 13, 10, 11, woodDark);
      px(ctx, 8, h - 12, 8, 9, wood);
      px(ctx, 18, 10, 6, 5, '#f0e2c8');
      px(ctx, 19, 11, 4, 3, '#6a8a9a');
      // ramp
      px(ctx, 7, h - 2, 12, 2, '#b8996a');
      px(ctx, 2, h - 1, w - 4, 1, 'rgba(0,0,0,0.2)');
      break;
    }
    case 'shed': {
      px(ctx, 3, 12, w - 6, h - 14, '#b8996a');
      px(ctx, 3, 12, w - 6, 2, '#d0b184');
      px(ctx, 3, 12, 2, h - 14, '#8a6a44');
      px(ctx, 0, 7, w, 7, '#7a5a3a');
      px(ctx, 2, 4, w - 4, 4, '#9a7a52');
      px(ctx, 0, 13, w, 2, '#5a3f28');
      px(ctx, 6, h - 12, 12, 10, woodDark);
      px(ctx, 7, h - 11, 10, 8, wood);
      px(ctx, w - 14, h - 10, 8, 8, '#c89a5a');
      px(ctx, w - 14, h - 10, 8, 1, '#e0b878');
      px(ctx, w - 14, h - 6, 8, 1, '#a87a3a');
      px(ctx, 2, h - 1, w - 4, 1, 'rgba(0,0,0,0.2)');
      break;
    }
    case 'workshop': {
      px(ctx, 3, 12, w - 6, h - 14, '#9aa4ac');
      px(ctx, 3, 12, w - 6, 2, '#b8c0c8');
      px(ctx, 3, 12, 2, h - 14, '#7a848c');
      px(ctx, 0, 7, w, 7, '#5a646c');
      px(ctx, 3, 4, w - 6, 4, '#6f7a84');
      px(ctx, 0, 13, w, 2, '#434a52');
      px(ctx, w - 12, 0, 5, 8, '#7a6a5a');
      px(ctx, w - 13, 8, 7, 2, '#5a4a3a');
      px(ctx, 6, h - 11, 12, 9, woodDark);
      px(ctx, 7, h - 10, 10, 7, wood);
      px(ctx, 16, 16, 6, 5, '#e8c86a');
      px(ctx, 17, 17, 4, 3, '#b8902a');
      px(ctx, 2, h - 1, w - 4, 1, 'rgba(0,0,0,0.2)');
      break;
    }
    case 'helper_hut': {
      px(ctx, 3, 14, w - 6, h - 16, '#d8c09a');
      px(ctx, 3, 14, w - 6, 2, '#efe0c0');
      px(ctx, 3, 14, 2, h - 16, '#b89a72');
      px(ctx, 0, 8, w, 8, '#4f7a6a');
      px(ctx, 3, 4, w - 6, 5, '#5f8a7a');
      px(ctx, 0, 15, w, 2, '#365a4c');
      for (let x = 4; x < w - 4; x += 7) px(ctx, x, 8, 3, 7, '#3f6a5a');
      px(ctx, w / 2 - 5, h - 15, 10, 13, '#6b4426');
      px(ctx, w / 2 - 4, h - 14, 8, 11, '#8a5a34');
      px(ctx, w / 2 + 2, h - 9, 2, 2, '#e8c86a');
      px(ctx, 8, 20, 7, 6, '#8ec8d8');
      px(ctx, 9, 21, 5, 4, '#b8e8f0');
      px(ctx, w - 15, 20, 7, 6, '#8ec8d8');
      px(ctx, w - 14, 21, 5, 4, '#b8e8f0');
      px(ctx, w - 12, 2, 5, 8, '#8a7a6a');
      px(ctx, w - 12, 2, 5, 2, '#a89a88');
      px(ctx, 2, h - 2, w - 4, 2, 'rgba(0,0,0,0.18)');
      break;
    }
    case 'greenhouse': {
      px(ctx, 2, 10, w - 4, h - 12, '#cfe8d8');
      px(ctx, 2, 10, w - 4, 2, '#e8f8f0');
      px(ctx, 0, 4, w, 7, '#d8e8e0');
      px(ctx, 0, 9, w, 2, '#9ab8a8');
      for (let x = 6; x < w - 2; x += 8) px(ctx, x, 11, 1, h - 13, '#9ab8a8');
      px(ctx, 2, 16, w - 4, 1, '#9ab8a8');
      px(ctx, 2, h - 6, w - 4, 1, '#9ab8a8');
      // plants inside
      px(ctx, 6, h - 9, 3, 3, '#6fae4f');
      px(ctx, 14, h - 10, 3, 4, '#5b9b3a');
      px(ctx, 22, h - 9, 3, 3, '#6fae4f');
      px(ctx, 30, h - 10, 3, 4, '#5b9b3a');
      px(ctx, w / 2 - 4, h - 9, 8, 7, '#b8d8c8');
      px(ctx, 2, h - 2, w - 4, 1, 'rgba(0,0,0,0.15)');
      break;
    }
    case 'well': {
      px(ctx, 6, 16, 20, 12, '#8a9096');
      px(ctx, 6, 16, 20, 3, '#a8b0b6');
      px(ctx, 10, 19, 12, 7, '#3f6a8a');
      px(ctx, 10, 19, 12, 2, '#5a8aa8');
      px(ctx, 4, 10, 2, 12, woodDark);
      px(ctx, 26, 10, 2, 12, woodDark);
      px(ctx, 2, 6, 28, 5, roofDark);
      px(ctx, 5, 3, 22, 4, roof);
      px(ctx, 15, 11, 2, 6, wood);
      px(ctx, 13, 16, 6, 4, '#b8996a');
      px(ctx, 4, 27, 24, 2, 'rgba(0,0,0,0.2)');
      break;
    }
    case 'sprinkler': {
      px(ctx, 6, 10, 4, 5, '#8a9096');
      px(ctx, 4, 14, 8, 2, '#6a727a');
      px(ctx, 7, 6, 2, 5, '#b0b8c0');
      px(ctx, 5, 5, 6, 2, '#9aa4ac');
      px(ctx, 2, 3, 2, 2, '#8ec8e8');
      px(ctx, 12, 4, 2, 2, '#8ec8e8');
      px(ctx, 8, 1, 2, 2, '#b8e0f0');
      break;
    }
    case 'fence': {
      px(ctx, 1, 6, 2, 9, woodDark);
      px(ctx, 13, 6, 2, 9, woodDark);
      px(ctx, 3, 8, 10, 2, wood);
      px(ctx, 3, 12, 10, 2, wood);
      px(ctx, 1, 5, 2, 1, '#a87a4a');
      px(ctx, 13, 5, 2, 1, '#a87a4a');
      break;
    }
    case 'path': {
      drawPath(ctx);
      break;
    }
  }
  if (id !== 'path' && id !== 'fence') {
    px(ctx, Math.max(0, Math.round(w * 0.08)), h - 2, Math.round(w * 0.84), 2, 'rgba(0,0,0,0.16)');
  }
}

function drawItemIcon(ctx: Ctx, itemId: string): void {
  const item = ITEMS[itemId];
  px(ctx, 0, 0, 16, 16, 'rgba(0,0,0,0)');
  if (!item) {
    px(ctx, 4, 4, 8, 8, '#c0c0c0');
    return;
  }
  const c1 = hex(item.color ?? 0xc8a86a);
  const c2 = hex(item.color2 ?? 0x8a6a44);

  if (item.type === 'seed') {
    px(ctx, 2, 2, 12, 13, '#e8dcc0');
    px(ctx, 2, 2, 12, 2, '#c8b898');
    px(ctx, 3, 3, 10, 2, '#f5eeda');
    px(ctx, 4, 6, 8, 5, c1);
    px(ctx, 5, 12, 6, 1, c2);
    px(ctx, 6, 8, 2, 2, '#6f9b3a');
    px(ctx, 9, 9, 1, 1, '#6f9b3a');
  } else if (item.type === 'crop' && item.cropId) {
    const crop = CROPS[item.cropId];
    if (crop) {
      ctx.save();
      ctx.translate(0, 0);
      drawCrop(ctx, crop, 3);
      ctx.restore();
    }
  } else if (itemId === 'hoe') {
    px(ctx, 3, 4, 2, 11, '#8a5a34');
    px(ctx, 4, 4, 8, 2, '#b8c0c8');
    px(ctx, 10, 5, 3, 4, '#9aa4ac');
    px(ctx, 11, 8, 1, 2, '#7a848c');
  } else if (itemId === 'watering_can') {
    px(ctx, 4, 6, 8, 7, '#5a9ab8');
    px(ctx, 5, 7, 6, 2, '#7ab8d8');
    px(ctx, 11, 4, 3, 2, '#4a8aa8');
    px(ctx, 13, 3, 2, 2, '#6ab0c8');
    px(ctx, 3, 8, 2, 2, '#4a8aa8');
    px(ctx, 6, 4, 3, 2, '#4a8aa8');
    px(ctx, 5, 13, 7, 1, '#3a7a98');
  } else if (itemId === 'feed') {
    px(ctx, 2, 5, 12, 8, '#d9b35a');
    px(ctx, 2, 8, 12, 1, '#b8903a');
    px(ctx, 4, 3, 8, 3, '#e8c878');
    px(ctx, 3, 12, 10, 1, '#a07828');
    px(ctx, 5, 6, 1, 5, '#e8c878');
    px(ctx, 10, 6, 1, 5, '#e8c878');
  } else if (itemId === 'fertilizer') {
    px(ctx, 2, 4, 12, 10, '#9c8a6a');
    px(ctx, 3, 2, 10, 3, '#b8a888');
    px(ctx, 5, 6, 6, 5, '#a8d86a');
    px(ctx, 6, 7, 2, 2, '#5b9b3a');
    px(ctx, 9, 9, 1, 1, '#5b9b3a');
  } else if (itemId === 'fishing_rod') {
    px(ctx, 3, 2, 2, 12, '#8a5a34');
    px(ctx, 4, 2, 2, 10, '#a87a4a');
    ctx.strokeStyle = '#e8e8e8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(11, 2);
    ctx.quadraticCurveTo(15, 7, 12, 14);
    ctx.stroke();
    px(ctx, 11, 11, 2, 2, '#c8d0d8');
    px(ctx, 12, 14, 2, 2, '#e8b840');
    px(ctx, 5, 7, 3, 3, '#5a6a7a');
  } else if (itemId === 'pickaxe') {
    px(ctx, 7, 4, 2, 11, '#8a5a34');
    px(ctx, 8, 4, 1, 11, '#a87a4a');
    ctx.fillStyle = '#a8b0b8';
    ctx.beginPath();
    ctx.moveTo(2, 5);
    ctx.lineTo(13, 2);
    ctx.lineTo(14, 5);
    ctx.lineTo(4, 8);
    ctx.closePath();
    ctx.fill();
    px(ctx, 3, 5, 7, 1, '#d8e0e8');
  } else if (itemId === 'bait') {
    px(ctx, 3, 5, 10, 9, '#8a6a44');
    px(ctx, 4, 4, 8, 2, '#b8996a');
    px(ctx, 5, 8, 2, 3, '#e88a8a');
    px(ctx, 9, 7, 2, 4, '#d87a7a');
    px(ctx, 4, 12, 8, 1, '#6a4a2a');
  } else if (item.type === 'fish') {
    ctx.fillStyle = c2;
    px(ctx, 2, 6, 3, 5, c2);
    px(ctx, 1, 7, 2, 3, c2);
    ctx.fillStyle = c1;
    ctx.beginPath();
    ctx.ellipse(8, 9, 5, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    px(ctx, 6, 8, 2, 1, '#ffffff');
    px(ctx, 6, 8, 1, 1, '#2a1a0a');
    px(ctx, 10, 7, 3, 1, c2);
  } else if (item.type === 'ore') {
    px(ctx, 2, 8, 12, 6, '#7d838a');
    px(ctx, 4, 5, 7, 4, '#959ba1');
    px(ctx, 3, 12, 10, 2, '#666c73');
    px(ctx, 5, 7, 3, 2, c1);
    px(ctx, 9, 9, 3, 2, c1);
    px(ctx, 6, 7, 1, 1, c2);
    px(ctx, 10, 9, 1, 1, c2);
    if (itemId === 'gem') px(ctx, 11, 10, 1, 1, '#f0e8ff');
  } else if (itemId === 'grilled_fish') {
    px(ctx, 3, 6, 10, 6, c1);
    px(ctx, 2, 7, 2, 4, c2);
    px(ctx, 11, 8, 3, 2, c2);
    for (let x = 5; x < 11; x += 2) px(ctx, x, 7, 1, 4, '#5a3a2a');
    px(ctx, 4, 11, 8, 1, '#c88a5a');
  } else if (itemId === 'fish_stew') {
    px(ctx, 3, 8, 10, 5, '#c8a878');
    px(ctx, 4, 6, 8, 3, c1);
    px(ctx, 3, 12, 10, 2, '#8a6a44');
    px(ctx, 6, 7, 2, 2, '#e8b85a');
    px(ctx, 9, 8, 1, 1, '#f0e0a0');
    px(ctx, 7, 4, 1, 2, '#e8e8e8');
  } else if (itemId === 'salmon_dinner') {
    px(ctx, 2, 9, 12, 4, '#e8e0c8');
    px(ctx, 3, 10, 10, 2, '#c8b898');
    px(ctx, 4, 5, 8, 4, c1);
    px(ctx, 5, 6, 3, 2, c2);
    px(ctx, 9, 6, 2, 2, '#f0b8a0');
    px(ctx, 4, 8, 2, 2, '#7aab4a');
    px(ctx, 10, 8, 2, 2, '#7aab4a');
  } else if (itemId === 'egg' || itemId === 'duck_egg') {
    ctx.fillStyle = c1;
    ctx.beginPath();
    ctx.ellipse(8, 9, 4, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    px(ctx, 6, 6, 1, 1, '#ffffff');
    if (itemId === 'duck_egg') px(ctx, 6, 6, 4, 1, c2);
  } else if (itemId === 'milk') {
    px(ctx, 5, 3, 6, 2, '#dfe8f0');
    px(ctx, 4, 5, 8, 9, '#f5f3ea');
    px(ctx, 4, 8, 8, 4, '#d8e4f0');
    px(ctx, 4, 12, 8, 2, c2);
    px(ctx, 6, 9, 4, 2, '#ffffff');
  } else if (itemId === 'wool') {
    disc(ctx, 8, 9, 4, c1);
    disc(ctx, 5, 8, 3, c1);
    disc(ctx, 11, 8, 3, c1);
    px(ctx, 6, 12, 4, 2, c2);
    px(ctx, 5, 7, 1, 1, '#ffffff');
  } else if (itemId === 'truffle') {
    disc(ctx, 8, 9, 4, c1);
    px(ctx, 5, 7, 3, 2, c2);
    px(ctx, 9, 10, 2, 2, '#8a5a3a');
    px(ctx, 6, 6, 2, 1, '#9a7a5a');
  } else if (itemId === 'flour' || itemId === 'bread' || itemId === 'cheese') {
    if (itemId === 'flour') {
      px(ctx, 2, 5, 12, 9, c1);
      px(ctx, 4, 3, 8, 3, c2);
      px(ctx, 4, 7, 8, 1, c2);
      px(ctx, 5, 9, 6, 2, '#ffffff');
    } else if (itemId === 'bread') {
      px(ctx, 2, 7, 12, 6, c1);
      px(ctx, 3, 5, 10, 3, '#e0b878');
      for (const x of [4, 7, 10]) px(ctx, x, 6, 2, 1, c2);
    } else {
      px(ctx, 2, 6, 11, 7, c1);
      px(ctx, 2, 11, 11, 2, c2);
      px(ctx, 9, 7, 2, 1, '#f8e8a0');
      px(ctx, 5, 9, 1, 1, c2);
    }
  } else if (itemId === 'jam' || itemId === 'truffle_oil') {
    px(ctx, 4, 5, 8, 9, c1);
    px(ctx, 5, 3, 6, 2, c2);
    px(ctx, 5, 7, 6, 5, c2);
    px(ctx, 6, 8, 4, 2, '#f0e8d8');
    if (itemId === 'truffle_oil') px(ctx, 7, 2, 2, 2, '#7a5a2a');
  } else if (itemId === 'cloth') {
    px(ctx, 3, 6, 10, 7, c1);
    px(ctx, 4, 8, 8, 1, c2);
    px(ctx, 4, 10, 8, 1, c2);
    px(ctx, 3, 12, 10, 1, c2);
  } else if (itemId === 'pumpkin_pie') {
    disc(ctx, 8, 9, 5, '#d8a058');
    px(ctx, 4, 7, 8, 3, c1);
    px(ctx, 5, 11, 6, 1, c2);
    px(ctx, 7, 8, 1, 2, '#a86a2a');
    px(ctx, 10, 9, 1, 1, '#a86a2a');
  } else if (itemId === 'omelette') {
    disc(ctx, 8, 9, 5, c1);
    px(ctx, 5, 7, 3, 2, '#f0e090');
    px(ctx, 9, 10, 2, 2, c2);
    px(ctx, 6, 11, 3, 1, '#e0b840');
  } else {
    disc(ctx, 8, 9, 4, c1);
    px(ctx, 6, 7, 4, 2, c2);
  }
}

function drawFestivalStall(ctx: Ctx): void {
  px(ctx, 0, 0, 32, 32, 'rgba(0,0,0,0)');
  px(ctx, 3, 14, 26, 16, '#c8a06a');
  px(ctx, 3, 14, 26, 2, '#e0b87a');
  px(ctx, 3, 14, 2, 16, '#a07a4a');
  px(ctx, 0, 7, 32, 9, '#c85a4c');
  for (let x = 0; x < 32; x += 8) {
    px(ctx, x, 7, 4, 9, '#f0e2c8');
  }
  px(ctx, 0, 16, 32, 2, '#8f4034');
  for (let x = 4; x < 32; x += 8) px(ctx, x, 5, 2, 3, '#8f4034');
  px(ctx, 6, 19, 8, 8, '#8a5a34');
  px(ctx, 7, 20, 6, 6, '#b8996a');
  px(ctx, 18, 20, 8, 4, '#6a8a5a');
  px(ctx, 19, 19, 6, 2, '#8ab86a');
  px(ctx, 20, 18, 4, 1, '#f0d060');
  px(ctx, 2, 30, 28, 2, 'rgba(0,0,0,0.16)');
}

function drawFestivalBanner(ctx: Ctx): void {
  px(ctx, 0, 0, 16, 24, 'rgba(0,0,0,0)');
  px(ctx, 7, 2, 2, 21, '#6b4426');
  px(ctx, 2, 3, 12, 8, '#c85a4c');
  px(ctx, 2, 10, 12, 2, '#f0e2c8');
  px(ctx, 5, 5, 6, 3, '#f8d878');
  px(ctx, 1, 22, 14, 2, '#8a6a44');
}

function drawBush(ctx: Ctx): void {
  px(ctx, 0, 0, 20, 14, 'rgba(0,0,0,0)');
  disc(ctx, 6, 9, 4, '#3f7d3a');
  disc(ctx, 12, 8, 5, '#4f8c38');
  disc(ctx, 16, 10, 3, '#5b9b3a');
  disc(ctx, 9, 6, 3, '#5b9b3a');
  px(ctx, 4, 12, 13, 2, '#2f5f2c');
  px(ctx, 7, 5, 2, 1, '#7ab95a');
  px(ctx, 13, 7, 2, 1, '#7ab95a');
}

function drawBird(ctx: Ctx, frame: number): void {
  px(ctx, 0, 0, 10, 6, 'rgba(0,0,0,0)');
  px(ctx, 4, 2, 3, 2, '#3a3340');
  px(ctx, 6, 1, 2, 2, '#3a3340');
  px(ctx, 8, 2, 1, 1, '#5a5262');
  if (frame === 0) {
    px(ctx, 1, 0, 4, 1, '#4a4250');
    px(ctx, 2, 1, 3, 1, '#4a4250');
    px(ctx, 7, 0, 2, 1, '#4a4250');
  } else {
    px(ctx, 1, 4, 4, 1, '#4a4250');
    px(ctx, 2, 3, 3, 1, '#4a4250');
    px(ctx, 7, 4, 2, 1, '#4a4250');
  }
}

function drawButterfly(ctx: Ctx, frame: number, variant: number): void {
  px(ctx, 0, 0, 8, 6, 'rgba(0,0,0,0)');
  const wing = variant === 0 ? '#f0a24a' : '#8ac8e8';
  const wingLight = variant === 0 ? '#f8d878' : '#d8f0ff';
  const spread = frame === 0 ? 1 : 0;
  px(ctx, 2 - spread, 1, 2, 2, wingLight);
  px(ctx, 4, 1, 2, 2, wing);
  px(ctx, 2 - spread, 3, 2, 2, wing);
  px(ctx, 4, 3, 2, 2, wingLight);
  px(ctx, 3, 2, 1, 3, '#3a2a1a');
  px(ctx, 2, 0, 1, 1, '#3a2a1a');
  px(ctx, 4, 0, 1, 1, '#3a2a1a');
}

function drawFence(ctx: Ctx): void {
  px(ctx, 0, 0, 16, 14, 'rgba(0,0,0,0)');
  px(ctx, 0, 3, 16, 2, '#c8a06a');
  px(ctx, 0, 8, 16, 2, '#b08854');
  px(ctx, 2, 1, 2, 12, '#8a5a34');
  px(ctx, 2, 1, 1, 12, '#a87446');
  px(ctx, 11, 1, 2, 12, '#8a5a34');
  px(ctx, 11, 1, 1, 12, '#a87446');
  px(ctx, 2, 12, 11, 1, 'rgba(0,0,0,0.16)');
}

function drawLilypad(ctx: Ctx): void {
  px(ctx, 0, 0, 12, 8, 'rgba(0,0,0,0)');
  px(ctx, 1, 3, 9, 3, '#5b9b3a');
  px(ctx, 0, 4, 11, 2, '#4f8c38');
  px(ctx, 3, 2, 6, 1, '#6fae4f');
  px(ctx, 4, 6, 3, 1, '#3f7d3a');
  px(ctx, 7, 4, 2, 1, '#6fae4f');
}

function drawReed(ctx: Ctx): void {
  px(ctx, 0, 0, 8, 16, 'rgba(0,0,0,0)');
  px(ctx, 3, 6, 2, 9, '#5b7a3a');
  px(ctx, 2, 9, 1, 6, '#4f6a32');
  px(ctx, 5, 10, 1, 5, '#6f8a3a');
  px(ctx, 3, 2, 2, 4, '#8a6a3a');
  px(ctx, 3, 2, 1, 4, '#a8844a');
}

function drawMoon(ctx: Ctx): void {
  px(ctx, 0, 0, 40, 40, 'rgba(0,0,0,0)');
  disc(ctx, 20, 20, 13, '#e8e8d8');
  disc(ctx, 18, 18, 11, '#f4f4e8');
  disc(ctx, 15, 16, 3, '#d8d8c8');
  disc(ctx, 24, 22, 4, '#d8d8c8');
  disc(ctx, 20, 26, 2, '#d8d8c8');
  px(ctx, 12, 13, 2, 1, '#ffffff');
}

export function generateTextures(scene: Phaser.Scene): void {
  // ---- terrain per season
  for (const season of SEASONS) {
    for (let v = 0; v < 3; v++) {
      const base = v === 0 ? SEASON_INFO[season].grass : SEASON_INFO[season].grass2;
      makeTexture(scene, `grass_${season}_${v}`, 16, 16, (ctx, w, h) =>
        grassTile(ctx, w, h, base, mulberry32(100 + v + SEASONS.indexOf(season) * 7))
      );
    }
    makeTexture(scene, `tree_${season}`, 24, 32, (ctx) => drawTree(ctx, season));
  }

  makeTexture(scene, 'path', 16, 16, drawPath);
  for (let f = 0; f < 3; f++) makeTexture(scene, `water${f}`, 16, 16, (ctx) => drawWater(ctx, f));
  makeTexture(scene, 'soil', 16, 16, (ctx) => drawSoil(ctx, 'dry'));
  makeTexture(scene, 'soil_wet', 16, 16, (ctx) => drawSoil(ctx, 'wet'));
  makeTexture(scene, 'soil_fert', 16, 16, (ctx) => drawSoil(ctx, 'fert'));
  for (let i = 0; i < 4; i++) makeTexture(scene, `flower_${i}`, 16, 16, (ctx) => drawFlower(ctx, i));
  makeTexture(scene, 'rock', 16, 16, drawRock);
  for (const kind of ['stone', 'copper', 'iron', 'gold', 'gem'] as const) {
    makeTexture(scene, `rock_${kind}`, 16, 16, (ctx) => drawMineRock(ctx, kind));
  }
  makeTexture(scene, 'rock_broken', 16, 16, (ctx) => drawMineRock(ctx, 'broken'));
  makeTexture(scene, 'festival_stall', 32, 32, drawFestivalStall);
  makeTexture(scene, 'festival_banner', 16, 24, drawFestivalBanner);

  // ---- player
  for (const dir of ['down', 'up', 'left', 'right'] as const) {
    for (let f = 0; f < 3; f++) {
      makeTexture(scene, `player_${dir}_${f}`, 16, 24, (ctx) => drawPlayer(ctx, dir, f));
    }
  }

  // ---- visitors
  for (const npc of Object.values(NPCS)) {
    for (let f = 0; f < 2; f++) {
      makeTexture(scene, `npc_${npc.id}`, 16, 24, (ctx) => drawNpc(ctx, npc, f));
    }
  }

  // ---- crops
  for (const crop of Object.values(CROPS)) {
    for (let stage = 0; stage < 4; stage++) {
      makeTexture(scene, `crop_${crop.id}_${stage}`, 16, 16, (ctx) => drawCrop(ctx, crop, stage));
    }
  }

  // ---- animals
  for (const animal of Object.values(ANIMALS)) {
    for (let f = 0; f < 2; f++) {
      makeTexture(scene, `animal_${animal.id}_${f}`, 20, 16, (ctx) => drawAnimal(ctx, animal, f));
    }
  }

  // ---- buildings
  for (const def of Object.values(BUILDINGS)) {
    makeTexture(scene, `b_${def.id}`, def.w * 16, def.h * 16, (ctx, w, h) =>
      drawBuilding(ctx, def.id, w, h)
    );
  }
  // Fallback building art for unknown ids
  makeTexture(scene, 'b_unknown', 32, 32, (ctx) => {
    px(ctx, 2, 8, 28, 22, '#b8996a');
    px(ctx, 0, 4, 32, 8, '#8a5a34');
  });

  // ---- item icons
  for (const id of Object.keys(ITEMS)) {
    makeTexture(scene, `icon_${id}`, 16, 16, (ctx) => drawItemIcon(ctx, id));
  }

  // ---- misc
  makeTexture(scene, 'rain', 2, 8, (ctx) => {
    px(ctx, 0, 0, 1, 6, '#a8d8f0');
    px(ctx, 1, 3, 1, 3, '#7ab8e0');
  });
  makeTexture(scene, 'sparkle', 5, 5, (ctx) => {
    px(ctx, 2, 0, 1, 5, '#fff8d8');
    px(ctx, 0, 2, 5, 1, '#fff8d8');
    px(ctx, 1, 1, 1, 1, '#ffffff');
  });
  makeTexture(scene, 'water_drop', 4, 6, (ctx) => {
    px(ctx, 1, 0, 2, 2, '#b8e8ff');
    px(ctx, 0, 2, 4, 3, '#6ab0e0');
    px(ctx, 1, 2, 1, 2, '#d8f4ff');
  });
  makeTexture(scene, 'shadow', 24, 8, (ctx) => {
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(12, 4, 11, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  makeTexture(scene, 'cloud', 64, 24, (ctx) => {
    px(ctx, 0, 0, 64, 24, 'rgba(0,0,0,0)');
    disc(ctx, 20, 14, 8, '#ffffff');
    disc(ctx, 34, 10, 10, '#ffffff');
    disc(ctx, 48, 14, 7, '#ffffff');
    px(ctx, 12, 10, 42, 10, '#ffffff');
    px(ctx, 16, 18, 34, 4, '#dfe8f0');
  });
  makeTexture(scene, 'sun', 48, 48, (ctx) => {
    px(ctx, 0, 0, 48, 48, 'rgba(0,0,0,0)');
    disc(ctx, 24, 24, 14, '#ffe08a');
    disc(ctx, 24, 24, 10, '#fff4c0');
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const x = 24 + Math.round(Math.cos(a) * 20);
      const y = 24 + Math.round(Math.sin(a) * 20);
      px(ctx, x - 2, y - 2, 4, 4, '#ffe08a');
    }
  });
  makeTexture(scene, 'moon', 40, 40, drawMoon);

  // grass tufts for decoration
  makeTexture(scene, 'tuft', 8, 8, (ctx) => {
    px(ctx, 0, 0, 8, 8, 'rgba(0,0,0,0)');
    px(ctx, 1, 4, 1, 4, '#5b9b3a');
    px(ctx, 3, 2, 1, 6, '#6fae4f');
    px(ctx, 5, 3, 1, 5, '#5b9b3a');
  });
  makeTexture(scene, 'bush', 20, 14, drawBush);
  makeTexture(scene, 'fence', 16, 14, drawFence);
  makeTexture(scene, 'lilypad', 12, 8, drawLilypad);
  makeTexture(scene, 'reed', 8, 16, drawReed);
  for (let f = 0; f < 2; f++) {
    makeTexture(scene, `bird_${f}`, 10, 6, (ctx) => drawBird(ctx, f));
  }
  for (let v = 0; v < 2; v++) {
    for (let f = 0; f < 2; f++) {
      makeTexture(scene, `butterfly_${v}_${f}`, 8, 6, (ctx) => drawButterfly(ctx, f, v));
    }
  }
}

export function createPlayerAnimations(scene: Phaser.Scene): void {
  const dirs = ['down', 'up', 'left', 'right'] as const;
  for (const dir of dirs) {
    const key = `walk_${dir}`;
    if (scene.anims.exists(key)) continue;
    scene.anims.create({
      key,
      frames: [
        { key: `player_${dir}_1` },
        { key: `player_${dir}_0` },
        { key: `player_${dir}_2` },
        { key: `player_${dir}_0` }
      ],
      frameRate: 7,
      repeat: -1
    });
  }
}

export function iconKeyFor(itemId: string): string {
  return ITEMS[itemId] ? `icon_${itemId}` : 'icon_feed';
}

export function animalTexture(species: string, frame: number): string {
  const def: AnimalDef | undefined = ANIMALS[species];
  return def ? `animal_${def.id}_${frame % 2}` : 'animal_chicken_0';
}

export function cropTexture(cropId: string, stage: number): string {
  return `crop_${cropId}_${Math.max(0, Math.min(3, stage))}`;
}

export function buildingTexture(id: string): string {
  return BUILDINGS[id] ? `b_${id}` : 'b_unknown';
}

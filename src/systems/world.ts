import { FARMHOUSE, PLOTS, TILE, WORLD_H, WORLD_W, SEASON_INFO } from '../data/definitions';
import type { MineNodeDef, SaveData, Season } from '../types';
import { mulberry32, tileKey } from './util';

export const MINE_NODES: MineNodeDef[] = [
  { id: 'q1', x: 37, y: 27, kind: 'stone' },
  { id: 'q2', x: 38, y: 27, kind: 'copper' },
  { id: 'q3', x: 39, y: 27, kind: 'stone' },
  { id: 'q4', x: 40, y: 27, kind: 'iron' },
  { id: 'q5', x: 41, y: 27, kind: 'stone' },
  { id: 'q6', x: 37, y: 29, kind: 'copper' },
  { id: 'q7', x: 38, y: 29, kind: 'stone' },
  { id: 'q8', x: 39, y: 29, kind: 'gold' },
  { id: 'q9', x: 40, y: 29, kind: 'stone' },
  { id: 'q10', x: 41, y: 29, kind: 'gem' },
  { id: 'q11', x: 37, y: 31, kind: 'iron' },
  { id: 'q12', x: 39, y: 31, kind: 'stone' },
  { id: 'q13', x: 41, y: 31, kind: 'gold' },
  { id: 'q14', x: 49, y: 42, kind: 'stone' },
  { id: 'q15', x: 50, y: 43, kind: 'copper' },
  { id: 'q16', x: 51, y: 42, kind: 'iron' },
  { id: 'q17', x: 52, y: 43, kind: 'gold' },
  { id: 'q18', x: 53, y: 42, kind: 'gem' },
  { id: 'q19', x: 50, y: 45, kind: 'stone' },
  { id: 'q20', x: 52, y: 45, kind: 'iron' },
  { id: 'q21', x: 54, y: 44, kind: 'gold' },
  { id: 'q22', x: 54, y: 45, kind: 'gem' }
];

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const PONDS: Rect[] = [
  { x: 36, y: 3, w: 5, h: 4 },
  { x: 2, y: 27, w: 4, h: 4 },
  { x: 40, y: 20, w: 2, h: 5 },
  { x: 50, y: 33, w: 6, h: 5 },
  { x: 48, y: 8, w: 5, h: 4 },
  { x: 4, y: 40, w: 5, h: 4 }
];

/** Roads of the enlarged farm: each entry is one straight run of path tiles, kept clear of the fields. */
export const ROADS: Rect[] = [
  { x: 6, y: 27, w: 52, h: 1 },
  { x: 6, y: 37, w: 44, h: 1 },
  { x: 6, y: 44, w: 42, h: 1 },
  { x: 16, y: 8, w: 1, h: 20 },
  { x: 27, y: 8, w: 1, h: 20 },
  { x: 47, y: 8, w: 1, h: 37 }
];

/** Deterministic decorative/obstacle layout, identical for every play-through. */
const obstacleSet = new Set<string>();
const flowerSet = new Map<string, number>();

(function buildLayout() {
  const rng = mulberry32(1337);
  const blockedByPlot = (x: number, y: number): boolean =>
    PLOTS.some((p) => x >= p.x - 1 && x < p.x + p.w + 1 && y >= p.y - 1 && y < p.y + p.h + 1);

  const isPath = (x: number, y: number): boolean => {
    if (x === 5 || x === 6) return y >= 6 && y <= 44;
    if (y === 8) return x >= 3 && x <= 40;
    if (y === 18) return x >= 5 && x <= 42;
    if (x === 20 && y >= 8 && y <= 18) return true;
    if (x === 32 && y >= 8 && y <= 21) return true;
    return ROADS.some((r) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h);
  };

  const inFarmhouse = (x: number, y: number): boolean =>
    x >= FARMHOUSE.x - 1 &&
    x < FARMHOUSE.x + FARMHOUSE.w + 1 &&
    y >= FARMHOUSE.y - 1 &&
    y < FARMHOUSE.y + FARMHOUSE.h + 2;

  const inPond = (x: number, y: number): boolean =>
    PONDS.some((p) => x >= p.x - 1 && x < p.x + p.w + 1 && y >= p.y - 1 && y < p.y + p.h + 1);

  for (let y = 0; y < WORLD_H; y++) {
    for (let x = 0; x < WORLD_W; x++) {
      const edge = x < 2 || y < 2 || x >= WORLD_W - 2 || y >= WORLD_H - 2;
      const nearEdge = x < 3 || y < 3 || x >= WORLD_W - 3 || y >= WORLD_H - 3;
      if (edge) {
        obstacleSet.add(tileKey(x, y));
        continue;
      }
      if ((x === 5 || x === 6) && y >= 6 && y <= 44) continue;
      if (isPath(x, y) || inFarmhouse(x, y) || inPond(x, y) || blockedByPlot(x, y)) continue;

      const roll = rng();
      if (nearEdge && roll < 0.35) {
        obstacleSet.add(tileKey(x, y));
      } else if (!nearEdge && roll < 0.035) {
        obstacleSet.add(tileKey(x, y));
      } else if (roll > 0.965) {
        flowerSet.set(tileKey(x, y), Math.floor(rng() * 4));
      }
    }
  }
  // A few cosy clusters near the farmhouse.
  const clusters = [
    [10, 5],
    [13, 4],
    [10, 16],
    [24, 6],
    [26, 16],
    [40, 12],
    [40, 30],
    [3, 12],
    [3, 22]
  ];
  for (const [cx, cy] of clusters) {
    for (const [dx, dy] of [
      [0, 0],
      [1, 0],
      [0, 1],
      [-1, 0]
    ]) {
      const x = cx + dx;
      const y = cy + dy;
      if (x <= 0 || y <= 0 || x >= WORLD_W - 1 || y >= WORLD_H - 1) continue;
      if (inFarmhouse(x, y) || inPond(x, y) || blockedByPlot(x, y) || isPath(x, y)) continue;
      obstacleSet.add(tileKey(x, y));
    }
  }

  // Airfield-clearing sweep: no trees or boulders may stand on the new fields.
  for (const plot of PLOTS) {
    for (let y = plot.y - 1; y <= plot.y + plot.h; y++) {
      for (let x = plot.x - 1; x <= plot.x + plot.w; x++) {
        if (x <= 0 || y <= 0 || x >= WORLD_W - 1 || y >= WORLD_H - 1) continue;
        obstacleSet.delete(tileKey(x, y));
      }
    }
  }

  // Clear a small quarry clearing in the south-east corner.
  for (let y = 26; y <= 31; y++) {
    for (let x = 36; x <= 41; x++) obstacleSet.delete(tileKey(x, y));
  }

  // Clear the new south-east quarry.
  for (let y = 40; y <= 46; y++) {
    for (let x = 47; x <= 55; x++) obstacleSet.delete(tileKey(x, y));
  }
})();

export const OBSTACLES = obstacleSet;
export const FLOWERS = flowerSet;

export function isPathTile(x: number, y: number): boolean {
  if (x === 5 || x === 6) return y >= 6 && y <= 44;
  if (y === 8) return x >= 3 && x <= 40;
  if (y === 18) return x >= 5 && x <= 42;
  if (x === 20 && y >= 8 && y <= 18) return true;
  if (x === 32 && y >= 8 && y <= 21) return true;
  return ROADS.some((r) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h);
}

export function isWaterTile(x: number, y: number): boolean {
  return PONDS.some((p) => x >= p.x && x < p.x + p.w && y >= p.y && y < p.y + p.h);
}

export function isObstacleTile(x: number, y: number): boolean {
  return OBSTACLES.has(tileKey(x, y));
}

export function isMineNodeTile(x: number, y: number): boolean {
  return MINE_NODES.some((node) => node.x === x && node.y === y);
}

export function mineNodeAt(x: number, y: number): MineNodeDef | undefined {
  return MINE_NODES.find((node) => node.x === x && node.y === y);
}

export function isBlockedBase(x: number, y: number): boolean {
  return isWaterTile(x, y) || isObstacleTile(x, y);
}

export function plotIndexAt(x: number, y: number): number {
  const idx = PLOTS.findIndex((p) => x >= p.x && x < p.x + p.w && y >= p.y && y < p.y + p.h);
  return idx;
}

export function isPlotInterior(x: number, y: number): boolean {
  return plotIndexAt(x, y) >= 0;
}

export function isUnlockedTile(state: SaveData, x: number, y: number): boolean {
  const idx = plotIndexAt(x, y);
  if (idx < 0) return false;
  return idx < state.unlockedPlots;
}

export function inBounds(x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < WORLD_W && y < WORLD_H;
}

export function tileToWorld(x: number, y: number): { x: number; y: number } {
  return { x: x * TILE + TILE / 2, y: y * TILE + TILE / 2 };
}

export function worldToTile(wx: number, wy: number): { x: number; y: number } {
  return { x: Math.floor(wx / TILE), y: Math.floor(wy / TILE) };
}

export function grassTint(season: Season): number {
  return SEASON_INFO[season].grass;
}

export function seasonGrassVariant(season: Season, variant: number): number {
  return variant === 0 ? SEASON_INFO[season].grass : SEASON_INFO[season].grass2;
}

export function treePalette(season: Season): { dark: number; light: number } {
  return { dark: SEASON_INFO[season].tree, light: SEASON_INFO[season].tree2 };
}

import { FARMHOUSE, PLOTS, TILE, WORLD_H, WORLD_W, SEASON_INFO } from '../data/definitions';
import type { SaveData, Season } from '../types';
import { mulberry32, tileKey } from './util';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const PONDS: Rect[] = [
  { x: 36, y: 3, w: 5, h: 4 },
  { x: 2, y: 27, w: 4, h: 4 },
  { x: 40, y: 20, w: 2, h: 5 }
];

/** Deterministic decorative/obstacle layout, identical for every play-through. */
const obstacleSet = new Set<string>();
const flowerSet = new Map<string, number>();

(function buildLayout() {
  const rng = mulberry32(1337);
  const blockedByPlot = (x: number, y: number): boolean =>
    PLOTS.some((p) => x >= p.x - 1 && x < p.x + p.w + 1 && y >= p.y - 1 && y < p.y + p.h + 1);

  const isPath = (x: number, y: number): boolean => {
    if (x === 5 || x === 6) return y >= 6 && y <= 32;
    if (y === 8) return x >= 3 && x <= 40;
    if (y === 18) return x >= 5 && x <= 42;
    if (x === 20 && y >= 8 && y <= 18) return true;
    if (x === 32 && y >= 8 && y <= 21) return true;
    return false;
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
      if ((x === 5 || x === 6) && y >= 6 && y <= 32) continue;
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
})();

export const OBSTACLES = obstacleSet;
export const FLOWERS = flowerSet;

export function isPathTile(x: number, y: number): boolean {
  if (x === 5 || x === 6) return y >= 6 && y <= 32;
  if (y === 8) return x >= 3 && x <= 40;
  if (y === 18) return x >= 5 && x <= 42;
  if (x === 20 && y >= 8 && y <= 18) return true;
  if (x === 32 && y >= 8 && y <= 21) return true;
  return false;
}

export function isWaterTile(x: number, y: number): boolean {
  return PONDS.some((p) => x >= p.x && x < p.x + p.w && y >= p.y && y < p.y + p.h);
}

export function isObstacleTile(x: number, y: number): boolean {
  return OBSTACLES.has(tileKey(x, y));
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

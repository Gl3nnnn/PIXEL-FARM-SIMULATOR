import { FARMHOUSE, PLOTS, TILE, WORLD_H, WORLD_W, SEASON_INFO } from '../data/definitions';
import type { MineNodeDef, SaveData, Season } from '../types';
import { mulberry32, tileKey } from './util';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * The farm is laid out like a proper farmstead: a house yard in the north, a
 * grid of roads, fenced fields in neat rows, ponds, and two quarries in the
 * cleared south meadow. Everything below is the single source of truth - the
 * renderer, the placement rules and the forage spots all read from it.
 */

/** Two quarries sit in the cleared south meadow, one on each side of the orchard. */
export const MINE_NODES: MineNodeDef[] = [
  { id: 'q1', x: 5, y: 40, kind: 'stone' },
  { id: 'q2', x: 6, y: 40, kind: 'copper' },
  { id: 'q3', x: 7, y: 40, kind: 'stone' },
  { id: 'q4', x: 8, y: 40, kind: 'iron' },
  { id: 'q5', x: 9, y: 40, kind: 'stone' },
  { id: 'q6', x: 10, y: 40, kind: 'gold' },
  { id: 'q7', x: 11, y: 40, kind: 'stone' },
  { id: 'q8', x: 12, y: 41, kind: 'copper' },
  { id: 'q9', x: 6, y: 42, kind: 'copper' },
  { id: 'q10', x: 8, y: 42, kind: 'iron' },
  { id: 'q11', x: 10, y: 42, kind: 'gold' },
  { id: 'q12', x: 11, y: 43, kind: 'gem' },
  { id: 'q13', x: 5, y: 43, kind: 'stone' },
  { id: 'q14', x: 40, y: 40, kind: 'stone' },
  { id: 'q15', x: 42, y: 40, kind: 'copper' },
  { id: 'q16', x: 44, y: 40, kind: 'iron' },
  { id: 'q17', x: 46, y: 40, kind: 'gold' },
  { id: 'q18', x: 48, y: 40, kind: 'gem' },
  { id: 'q19', x: 41, y: 42, kind: 'stone' },
  { id: 'q20', x: 43, y: 42, kind: 'iron' },
  { id: 'q21', x: 45, y: 42, kind: 'gold' },
  { id: 'q22', x: 47, y: 42, kind: 'gem' }
];

/** A garden pond beside the house and a fishing lake beyond the east fields. */
export const PONDS: Rect[] = [
  { x: 21, y: 4, w: 4, h: 3 },
  { x: 54, y: 20, w: 6, h: 6 }
];

/**
 * The road grid: wide east-west lanes, north-south lanes into every row of
 * fields, and the path from the farmhouse door down to the main road.
 */
export const ROADS: Rect[] = [
  // The path from the farmhouse door down to the main road.
  { x: 7, y: 7, w: 1, h: 1 },
  // East-west lanes: one in front of every row of fields, plus the south road.
  { x: 4, y: 8, w: 44, h: 1 },
  { x: 4, y: 17, w: 44, h: 1 },
  { x: 4, y: 26, w: 44, h: 1 },
  { x: 4, y: 36, w: 44, h: 1 },
  // North-south lanes between the field columns.
  { x: 4, y: 8, w: 1, h: 29 },
  { x: 16, y: 8, w: 1, h: 29 },
  { x: 26, y: 8, w: 1, h: 29 },
  { x: 36, y: 8, w: 1, h: 29 },
  { x: 48, y: 8, w: 1, h: 29 }
];

/** Ground kept open for the two quarries. */
const QUARRIES: Rect[] = [
  { x: 5, y: 40, w: 8, h: 5 },
  { x: 40, y: 40, w: 9, h: 5 }
];

/** Curated flower beds: two in the yard, two beside the house, three by the lanes. */
const FLOWER_BEDS: Rect[] = [
  { x: 2, y: 2, w: 2, h: 2 },
  { x: 11, y: 3, w: 2, h: 2 },
  { x: 15, y: 6, w: 2, h: 1 },
  { x: 26, y: 4, w: 2, h: 2 },
  { x: 35, y: 4, w: 2, h: 2 },
  { x: 46, y: 5, w: 2, h: 2 }
];

function inRect(r: Rect, x: number, y: number): boolean {
  return x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
}

function aroundRect(r: Rect, x: number, y: number): boolean {
  return x >= r.x - 1 && x < r.x + r.w + 1 && y >= r.y - 1 && y < r.y + r.h + 1;
}

export function isPathTile(x: number, y: number): boolean {
  return ROADS.some((r) => inRect(r, x, y));
}

export function isWaterTile(x: number, y: number): boolean {
  return PONDS.some((r) => inRect(r, x, y));
}

/** The farmhouse plus a one-tile pad, so nothing grows against its walls. */
function inFarmhouse(x: number, y: number): boolean {
  return (
    x >= FARMHOUSE.x - 1 &&
    x < FARMHOUSE.x + FARMHOUSE.w + 1 &&
    y >= FARMHOUSE.y - 1 &&
    y <= FARMHOUSE.y + FARMHOUSE.h + 2
  );
}

/** Which edge of a field a fence tile belongs to; side rails stand upright. */
export type FenceSide = 'top' | 'bottom' | 'left' | 'right';

export interface FenceTile {
  x: number;
  y: number;
  side: FenceSide;
  vertical: boolean;
}

/** The fence ring around a field, and the open gate on its front edge. */
export interface FenceRing {
  ring: FenceTile[];
  gate: Array<{ x: number; y: number }>;
}

/**
 * The gate sits in the middle of a field's front edge so you walk in off the
 * lane, like a farm gate. Nothing else is left open: every other edge is fenced.
 */
export function gateTiles(plot: { x: number; y: number; w: number; h: number }): Array<{ x: number; y: number }> {
  const start = plot.x + Math.floor(plot.w / 2) - 1;
  return [
    { x: start, y: plot.y + plot.h },
    { x: start + 1, y: plot.y + plot.h }
  ];
}

export function fenceRing(plot: { x: number; y: number; w: number; h: number }): FenceRing {
  const gate = gateTiles(plot);
  const gateKeys = new Set(gate.map((g) => tileKey(g.x, g.y)));
  const seen = new Set<string>();
  const ring: FenceTile[] = [];
  const add = (x: number, y: number, side: FenceSide): void => {
    const key = tileKey(x, y);
    if (seen.has(key)) return;
    seen.add(key);
    ring.push({ x, y, side, vertical: side === 'left' || side === 'right' });
  };
  for (let x = plot.x - 1; x <= plot.x + plot.w; x++) {
    add(x, plot.y - 1, 'top');
    add(x, plot.y + plot.h, 'bottom');
  }
  for (let y = plot.y; y < plot.y + plot.h; y++) {
    add(plot.x - 1, y, 'left');
    add(plot.x + plot.w, y, 'right');
  }
  return { ring: ring.filter((t) => !gateKeys.has(tileKey(t.x, t.y))), gate };
}

/**
 * Fence tiles block the player. A fence never stands on a lane - the fields are
 * laid out so their rails stop at the road - and any tile that is a road is
 * walkable even if a ring counts it, so a visible gap is always a real one.
 */
export function isFenceTile(x: number, y: number): boolean {
  if (isPathTile(x, y)) return false;
  for (const plot of PLOTS) {
    const { ring } = fenceRing(plot);
    for (const t of ring) {
      if (t.x === x && t.y === y) return true;
    }
  }
  return false;
}

/** Fields in tidy rows, each fenced with a gate, kept clear of fences and trees. */
function nearPlot(x: number, y: number): boolean {
  return PLOTS.some((p) => aroundRect(p, x, y));
}

/** The house yard: kept clear so the front garden and the door path stay open. */
function inYard(x: number, y: number): boolean {
  return x >= 2 && x <= 16 && y >= 2 && y <= 8;
}

/** Ground the farm keeps tidy: roads, fields, ponds, the house and the quarries. */
function isManaged(x: number, y: number): boolean {
  return (
    isPathTile(x, y) ||
    isWaterTile(x, y) ||
    inFarmhouse(x, y) ||
    inYard(x, y) ||
    nearPlot(x, y) ||
    QUARRIES.some((q) => inRect(q, x, y))
  );
}

/** How far each tile is from tidy ground, so trees gather toward the wild edges. */
const CLEARANCE = (function buildClearance(): Int16Array {
  const dist = new Int16Array(WORLD_W * WORLD_H).fill(-1);
  const queue: number[] = [];
  for (let y = 0; y < WORLD_H; y++) {
    for (let x = 0; x < WORLD_W; x++) {
      if (!isManaged(x, y)) continue;
      dist[y * WORLD_W + x] = 0;
      queue.push(y * WORLD_W + x);
    }
  }
  for (let head = 0; head < queue.length; head++) {
    const idx = queue[head];
    const cx = idx % WORLD_W;
    const cy = (idx - cx) / WORLD_W;
    const next = dist[idx] + 1;
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1]
    ]) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= WORLD_W || ny >= WORLD_H) continue;
      const nIdx = ny * WORLD_W + nx;
      if (dist[nIdx] !== -1) continue;
      dist[nIdx] = next;
      queue.push(nIdx);
    }
  }
  return dist;
})();

function clearanceAt(x: number, y: number): number {
  return CLEARANCE[y * WORLD_W + x];
}

/** Deterministic decorative/obstacle layout, identical for every play-through. */
const obstacleSet = new Set<string>();
const flowerSet = new Map<string, number>();

(function buildLayout() {
  const rng = mulberry32(1337);

  const treeChance = (x: number, y: number): number => {
    const d = clearanceAt(x, y);
    const nearEdge = x < 5 || y < 5 || x >= WORLD_W - 5 || y >= WORLD_H - 5;
    if (d <= 2) return 0;
    if (d === 3) return nearEdge ? 0.16 : 0.04;
    if (d === 4) return nearEdge ? 0.3 : 0.1;
    if (d === 5) return nearEdge ? 0.5 : 0.2;
    return nearEdge ? 0.72 : 0.34;
  };

  for (let y = 0; y < WORLD_H; y++) {
    for (let x = 0; x < WORLD_W; x++) {
      // Hand-placed flower beds come first, so the ones in the house yard bloom
      // too - managed ground was skipping them before.
      const bed = FLOWER_BEDS.some((r) => inRect(r, x, y));
      if (bed && !isPathTile(x, y) && !isWaterTile(x, y)) {
        flowerSet.set(tileKey(x, y), Math.floor(rng() * 4));
        continue;
      }
      if (isManaged(x, y)) continue;
      const edge = x < 2 || y < 2 || x >= WORLD_W - 2 || y >= WORLD_H - 2;
      if (edge) {
        obstacleSet.add(tileKey(x, y));
        continue;
      }
      const roll = rng();
      if (roll < treeChance(x, y)) {
        obstacleSet.add(tileKey(x, y));
        continue;
      }
      if (clearanceAt(x, y) <= 4 && rng() < 0.075) {
        flowerSet.set(tileKey(x, y), Math.floor(rng() * 4));
      }
    }
  }

  // Nothing may stand on a mine node or block its approach.
  for (const node of MINE_NODES) {
    obstacleSet.delete(tileKey(node.x, node.y));
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1]
    ]) {
      obstacleSet.delete(tileKey(node.x + dx, node.y + dy));
    }
  }

  // Keep the manor fields' front gates and the south meadow open and easy to walk.
  for (let y = 39; y <= 46; y++) {
    for (let x = 16; x <= 40; x++) {
      if (isWaterTile(x, y) || QUARRIES.some((q) => inRect(q, x, y))) continue;
      obstacleSet.delete(tileKey(x, y));
    }
  }
})();

export const OBSTACLES = obstacleSet;
export const FLOWERS = flowerSet;

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
  return isWaterTile(x, y) || isObstacleTile(x, y) || isFenceTile(x, y);
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

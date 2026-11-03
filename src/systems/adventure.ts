import {
  ITEMS,
  MINE_FLOOR_H,
  MINE_FLOOR_W,
  MINE_MAX_FLOOR,
  MINE_MONSTERS,
  WEAPONS
} from '../data/definitions';
import type {
  MineMonsterDef,
  MineNodeKind,
  MineRunSave,
  SaveData,
  WeaponDef
} from '../types';
import { absoluteDay } from './calendar';
import { miningLoot } from './mining';
import { mulberry32, randomInt, uid } from './util';

export const MINE_BASE_HP = 100;
/** Energy spent entering a new floor. */
export const MINE_STAIR_COST = 3;

export type MineTile = 'floor' | 'wall' | 'rock' | 'ladder';

export interface MineRock {
  id: string;
  x: number;
  y: number;
  kind: MineNodeKind;
  hp: number;
  maxHp: number;
}

export interface MineMonsterState {
  uid: string;
  def: MineMonsterDef;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
}

export interface MineFloorState {
  floor: number;
  tiles: MineTile[][];
  rocks: MineRock[];
  monsters: MineMonsterState[];
  ladder: { x: number; y: number };
  player: { x: number; y: number };
  steps: number;
}

export function createMineRun(): MineRunSave {
  return {
    floor: 1,
    maxFloor: 1,
    hp: MINE_BASE_HP,
    maxHp: MINE_BASE_HP,
    weapon: WEAPONS[0].id,
    weapons: [WEAPONS[0].id],
    elevator: [1],
    monstersDefeated: 0
  };
}

export function weaponById(id: string): WeaponDef | undefined {
  return WEAPONS.find((weapon) => weapon.id === id);
}

export function equippedWeapon(run: MineRunSave): WeaponDef {
  return weaponById(run.weapon) ?? WEAPONS[0];
}

/** Maximum mine health, improving with the mining skill and house comforts. */
export function maxMineHp(miningLevel: number, houseEnergy = 0): number {
  return MINE_BASE_HP + (miningLevel - 1) * 5 + Math.floor(houseEnergy / 4);
}

export function monsterForFloor(floor: number, rng: () => number): MineMonsterDef {
  const eligible = MINE_MONSTERS.filter((monster) => monster.minFloor <= floor);
  if (eligible.length === 0) return MINE_MONSTERS[0];
  const strongest = eligible[eligible.length - 1];
  return rng() < 0.55 ? strongest : eligible[Math.floor(rng() * eligible.length)];
}

export function monsterHp(def: MineMonsterDef, floor: number): number {
  return Math.round(def.hp + Math.max(0, floor - 1) * 0.9);
}

export function monsterDamage(def: MineMonsterDef, floor: number): number {
  return Math.round(def.damage + Math.max(0, floor - 1) * 0.25);
}

function rockKindForFloor(floor: number, rng: () => number): MineNodeKind {
  const roll = rng();
  if (floor >= 55 && roll < 0.1) return 'gem';
  if (floor >= 30 && roll < 0.2) return 'gold';
  if (floor >= 15 && roll < 0.36) return 'iron';
  if (floor >= 5 && roll < 0.58) return 'copper';
  return 'stone';
}

/**
 * Generates one mine floor deterministically for the given day and floor, so a
 * floor looks the same every time you visit it during that day.
 */
export function generateMineFloor(
  floor: number,
  save: SaveData,
  rng?: () => number
): MineFloorState {
  const clamped = Math.max(1, Math.min(MINE_MAX_FLOOR, Math.floor(floor)));
  const seed =
    clamped * 7919 + absoluteDay(save.season, save.year, save.day) * 131 + save.stats.daysPlayed * 17;
  const roll = rng ?? mulberry32(seed);

  const tiles: MineTile[][] = [];
  for (let y = 0; y < MINE_FLOOR_H; y++) {
    const row: MineTile[] = [];
    for (let x = 0; x < MINE_FLOOR_W; x++) {
      const edge = x === 0 || y === 0 || x === MINE_FLOOR_W - 1 || y === MINE_FLOOR_H - 1;
      row.push(edge ? 'wall' : 'floor');
    }
    tiles.push(row);
  }

  const player = { x: 1, y: MINE_FLOOR_H - 2 };
  const occupied = new Set<string>([`${player.x},${player.y}`]);
  const keyOf = (x: number, y: number): string => `${x},${y}`;

  const openSpots: Array<{ x: number; y: number }> = [];
  for (let y = 1; y < MINE_FLOOR_H - 1; y++) {
    for (let x = 1; x < MINE_FLOOR_W - 1; x++) {
      if (!occupied.has(keyOf(x, y))) openSpots.push({ x, y });
    }
  }
  const shuffle = (list: Array<{ x: number; y: number }>): void => {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(roll() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
  };
  shuffle(openSpots);

  const rocks: MineRock[] = [];
  const rockCount = Math.min(openSpots.length - 2, 6 + Math.floor(clamped / 12) + randomInt(0, 3, roll));
  for (let i = 0; i < rockCount && openSpots.length > 0; i++) {
    const spot = openSpots.pop()!;
    const kind = rockKindForFloor(clamped, roll);
    rocks.push({
      id: uid('mr'),
      x: spot.x,
      y: spot.y,
      kind,
      hp: kind === 'stone' ? 2 : 3,
      maxHp: kind === 'stone' ? 2 : 3
    });
    tiles[spot.y][spot.x] = 'rock';
  }

  const monsters: MineMonsterState[] = [];
  const monsterCount = clamped >= 3 ? Math.min(4, 1 + Math.floor(clamped / 28)) : clamped >= 2 ? 1 : 0;
  for (let i = 0; i < monsterCount && openSpots.length > 0; i++) {
    const spot = openSpots.pop()!;
    const def = monsterForFloor(clamped, roll);
    const hp = monsterHp(def, clamped);
    monsters.push({ uid: uid('mm'), def, x: spot.x, y: spot.y, hp, maxHp: hp });
  }

  const ladderSpot = openSpots.pop() ?? { x: MINE_FLOOR_W - 2, y: 1 };
  tiles[ladderSpot.y][ladderSpot.x] = 'ladder';

  return {
    floor: clamped,
    tiles,
    rocks,
    monsters,
    ladder: { x: ladderSpot.x, y: ladderSpot.y },
    player,
    steps: 0
  };
}

export function rockAt(floor: MineFloorState, x: number, y: number): MineRock | undefined {
  return floor.rocks.find((rock) => rock.x === x && rock.y === y);
}

export function monsterAt(floor: MineFloorState, x: number, y: number): MineMonsterState | undefined {
  return floor.monsters.find((monster) => monster.x === x && monster.y === y);
}

export function rockLoot(
  kind: MineNodeKind,
  rng: () => number = Math.random
): Array<{ itemId: string; qty: number }> {
  const loot = miningLoot(kind, true, rng);
  if (kind === 'gem' && rng() < 0.22) loot.push({ itemId: 'artifact_bone', qty: 1 });
  if (kind !== 'stone' && rng() < 0.05) {
    loot.push({ itemId: 'artifact_pottery', qty: 1 });
  }
  return loot;
}

export function isArtifact(itemId: string): boolean {
  return ITEMS[itemId]?.type === 'artifact';
}

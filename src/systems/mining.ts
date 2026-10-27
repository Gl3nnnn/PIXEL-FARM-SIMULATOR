import { ITEMS } from '../data/definitions';
import type { MineNodeKind, SaveData } from '../types';
import { absoluteDay } from './calendar';
import { MINE_NODES } from './world';
import type { MineNodeDef } from '../types';

export const MINE_NODE_MAX_HP = 3;

export function mineNodeById(id: string): MineNodeDef | undefined {
  return MINE_NODES.find((node) => node.id === id);
}

export function mineNodeForTile(x: number, y: number): MineNodeDef | undefined {
  return MINE_NODES.find((node) => node.x === x && node.y === y);
}

export function nodeHp(save: SaveData, node: MineNodeDef): number {
  const state = save.mineNodes[node.id];
  if (!state) return MINE_NODE_MAX_HP;
  const today = absoluteDay(save.season, save.year, save.day);
  if (state.hp <= 0 && state.respawnDay <= today) return MINE_NODE_MAX_HP;
  return Math.max(0, Math.min(MINE_NODE_MAX_HP, state.hp));
}

export function isNodeBroken(save: SaveData, node: MineNodeDef): boolean {
  const state = save.mineNodes[node.id];
  if (!state || state.hp > 0) return false;
  return state.respawnDay > absoluteDay(save.season, save.year, save.day);
}

export function nodeRespawnLabel(save: SaveData, node: MineNodeDef): string {
  const state = save.mineNodes[node.id];
  if (!state || state.hp > 0) return '';
  const today = absoluteDay(save.season, save.year, save.day);
  const days = Math.max(0, state.respawnDay - today);
  return days === 0 ? 'Ready tomorrow' : `${days} day${days === 1 ? '' : 's'}`;
}

export function oreForKind(kind: MineNodeKind): string {
  switch (kind) {
    case 'copper':
      return 'copper_ore';
    case 'iron':
      return 'iron_ore';
    case 'gold':
      return 'gold_ore';
    case 'gem':
      return 'gem';
    default:
      return 'stone';
  }
}

export function miningLoot(
  kind: MineNodeKind,
  finalHit: boolean,
  rng: () => number = Math.random
): Array<{ itemId: string; qty: number }> {
  const loot: Array<{ itemId: string; qty: number }> = [{ itemId: 'stone', qty: 1 }];
  if (finalHit) {
    const ore = oreForKind(kind);
    if (ore === 'stone') {
      loot.push({ itemId: 'stone', qty: 1 + Math.floor(rng() * 2) });
    } else {
      loot.push({ itemId: ore, qty: 1 + (rng() < 0.25 ? 1 : 0) });
      if (rng() < 0.2) loot.push({ itemId: 'stone', qty: 1 });
    }
  }
  return loot;
}

export function nodeLabel(kind: MineNodeKind): string {
  switch (kind) {
    case 'copper':
      return 'Copper Vein';
    case 'iron':
      return 'Iron Vein';
    case 'gold':
      return 'Gold Vein';
    case 'gem':
      return 'Gem Pocket';
    default:
      return 'Stone Rock';
  }
}

export function nodeValue(kind: MineNodeKind): number {
  const item = ITEMS[oreForKind(kind)];
  return item?.sell ?? 1;
}

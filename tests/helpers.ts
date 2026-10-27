import { GameState, createNewSave } from '../src/systems/gameState';
import type { SaveData } from '../src/types';

export const FIELD_X = 8;
export const FIELD_Y = 9;

export function makeState(rng: () => number = () => 0): GameState {
  return new GameState(createNewSave(), rng);
}

export function standOnField(state: GameState, x = FIELD_X, y = FIELD_Y): void {
  state.setPlayer(x * 32, y * 32, 'down');
}

export function prepareTilledTile(state: GameState, x = FIELD_X, y = FIELD_Y): void {
  standOnField(state, x, y);
  const result = state.tillAt(x, y);
  if (!result.ok) throw new Error(`Could not till tile ${x},${y}: ${result.message ?? 'unknown'}`);
}

export function fillInventory(data: SaveData): void {
  data.inventory = Array.from({ length: 24 }, () => ({
    itemId: 'fertilizer',
    qty: 99,
    quality: 'normal' as const
  }));
}

export function findBuildSpot(state: GameState, buildingId = 'coop'): { x: number; y: number } {
  for (let y = 2; y < 32; y++) {
    for (let x = 2; x < 42; x++) {
      if (state.canPlaceBuilding(buildingId, x, y).ok) return { x, y };
    }
  }
  throw new Error(`No placement spot found for ${buildingId}`);
}

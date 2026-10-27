import type { GameState } from '../systems/gameState';

export interface UIContext {
  state: GameState;
  icon(itemId: string): string;
  toast(message: string, kind?: 'info' | 'success' | 'error' | 'reward'): void;
  refresh(): void;
  closePanel(): void;
  requestSave(): void;
  sleep(): void;
  beginBuild(buildingId: string | null): void;
  exitToMenu(): void;
  openPanel(id: string): void;
  isBuildMode(): boolean;
  setPanelRefresh(fn: (() => void) | null): void;
}

export type PanelBuilder = (ctx: UIContext, root: HTMLElement) => void;

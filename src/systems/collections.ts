import { COLLECTION_SETS } from '../data/definitions';
import type {
  CollectionEntrySave,
  CollectionMilestoneDef,
  CollectionSetDef,
  Quality,
  SaveData
} from '../types';

export interface CollectionItemState {
  itemId: string;
  found: boolean;
  qualities: Quality[];
}

export interface CollectionMilestoneState {
  def: CollectionMilestoneDef;
  claimed: boolean;
  ready: boolean;
}

export interface CollectionSetState {
  def: CollectionSetDef;
  found: number;
  total: number;
  complete: boolean;
  items: CollectionItemState[];
  milestones: CollectionMilestoneState[];
}

export function collectionEntry(
  save: SaveData,
  itemId: string
): CollectionEntrySave | undefined {
  return save.collection.entries.find((entry) => entry.itemId === itemId);
}

export function isCollected(save: SaveData, itemId: string): boolean {
  return !!collectionEntry(save, itemId);
}

export function collectionSetForItem(itemId: string): CollectionSetDef | undefined {
  return COLLECTION_SETS.find((set) => set.itemIds.includes(itemId));
}

export function recordCollection(
  save: SaveData,
  itemId: string,
  quality: Quality = 'normal'
): boolean {
  const set = collectionSetForItem(itemId);
  if (!set) return false;
  let entry = collectionEntry(save, itemId);
  if (!entry) {
    entry = { itemId, qualities: [] };
    save.collection.entries.push(entry);
  }
  if (entry.qualities.includes(quality)) return false;
  entry.qualities.push(quality);
  return true;
}

export function collectionSetState(save: SaveData, def: CollectionSetDef): CollectionSetState {
  const items = def.itemIds.map((itemId) => {
    const entry = collectionEntry(save, itemId);
    return { itemId, found: !!entry, qualities: entry?.qualities.slice() ?? [] };
  });
  const found = items.filter((item) => item.found).length;
  return {
    def,
    found,
    total: def.itemIds.length,
    complete: found >= def.itemIds.length,
    items,
    milestones: def.milestones.map((milestone) => ({
      def: milestone,
      claimed: save.collection.claimedRewards.includes(milestone.id),
      ready: found >= milestone.count && !save.collection.claimedRewards.includes(milestone.id)
    }))
  };
}

export function collectionTotal(save: SaveData): { found: number; total: number } {
  const total = COLLECTION_SETS.reduce((sum, set) => sum + set.itemIds.length, 0);
  const found = COLLECTION_SETS.reduce(
    (sum, set) => sum + set.itemIds.filter((id) => isCollected(save, id)).length,
    0
  );
  return { found, total };
}

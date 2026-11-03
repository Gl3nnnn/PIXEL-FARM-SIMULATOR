import { FURNITURE, MUSEUM_REWARDS } from '../data/definitions';
import type {
  ChildSave,
  FurnitureDef,
  HouseSave,
  MuseumRewardDef,
  PetSave,
  SaveData
} from '../types';
import { clamp } from './util';

export type ChildStage = 'baby' | 'toddler' | 'child';

const CHILD_NAMES = [
  'Robin',
  'Wren',
  'Juniper',
  'Clover',
  'Rowan',
  'Pip',
  'Hazel',
  'Finn',
  'Mabel',
  'Ash'
];

/** Growth is measured in days since the child joined the family. */
export function childStage(ageDays: number): ChildStage {
  if (ageDays < 14) return 'baby';
  if (ageDays < 42) return 'toddler';
  return 'child';
}

export function childStageLabel(ageDays: number): string {
  switch (childStage(ageDays)) {
    case 'baby':
      return 'Baby';
    case 'toddler':
      return 'Toddler';
    default:
      return 'Child';
  }
}

export function randomChildName(existing: string[], rng: () => number = Math.random): string {
  const free = CHILD_NAMES.filter((name) => !existing.includes(name));
  if (free.length === 0) return `Little ${existing.length + 1}`;
  return free[Math.floor(rng() * free.length)];
}

export function furnitureById(id: string): FurnitureDef | undefined {
  return FURNITURE.find((entry) => entry.id === id);
}

export function ownedFurniture(house: HouseSave): FurnitureDef[] {
  return house.furniture
    .map((id) => furnitureById(id))
    .filter((entry): entry is FurnitureDef => !!entry);
}

/** Sums the permanent bonus from every piece of furniture of one kind. */
export function houseBonus(house: HouseSave, kind: FurnitureDef['bonus']): number {
  return ownedFurniture(house)
    .filter((entry) => entry.bonus === kind)
    .reduce((sum, entry) => sum + entry.value, 0);
}

export function petBonus(pet: PetSave): number {
  if (!pet.type) return 0;
  return clamp((pet.affection / 100) * 0.06, 0, 0.06);
}

export function petMood(pet: PetSave): string {
  if (!pet.type) return 'No pet yet';
  if (pet.affection >= 80) return 'Adores you';
  if (pet.affection >= 45) return 'Happy';
  if (pet.affection >= 15) return 'Settling in';
  return 'A little lonely';
}

export function museumMilestones(count: number): MuseumRewardDef[] {
  return MUSEUM_REWARDS.filter((reward) => reward.count <= count);
}

export function nextMuseumMilestone(count: number): MuseumRewardDef | undefined {
  return MUSEUM_REWARDS.find((reward) => reward.count > count);
}

export function shippingItemValue(
  save: SaveData,
  price: (itemId: string) => number
): number {
  return save.shipping.items.reduce(
    (sum, stack) => sum + price(stack.itemId) * stack.qty,
    0
  );
}

export function familySize(save: SaveData): number {
  return save.family.children.length + (save.spouseId ? 1 : 0);
}

export function canAdopt(save: SaveData): { ok: boolean; reason: string } {
  if (!save.spouseId) return { ok: false, reason: 'Marry a villager before starting a family.' };
  if (save.family.children.length >= 2) return { ok: false, reason: 'Your home is full.' };
  if (save.farmhouseLevel < 2) return { ok: false, reason: 'Upgrade the farmhouse to level 2 first.' };
  return { ok: true, reason: 'Ready to adopt.' };
}

export function growChildren(children: ChildSave[]): string[] {
  const messages: string[] = [];
  for (const child of children) {
    const before = childStage(child.ageDays);
    child.ageDays += 1;
    const after = childStage(child.ageDays);
    if (before !== after) {
      messages.push(`${child.name} is now a ${after === 'toddler' ? 'toddler' : 'child'}.`);
    }
  }
  return messages;
}

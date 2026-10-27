import { ITEMS, NPCS, SEASON_INFO } from '../data/definitions';
import type { NpcDef, SaveData } from '../types';
import { absoluteDay, dayOfWeek } from './calendar';

export const NPC_MAX_FRIENDSHIP = 1000;
export const NPC_MAX_HEARTS = 10;

export function npcById(id: string): NpcDef | undefined {
  return NPCS[id];
}

export function allNpcs(): NpcDef[] {
  return Object.values(NPCS);
}

export function npcSave(save: SaveData, id: string) {
  return save.npcs[id];
}

export function ensureNpcSave(save: SaveData, id: string) {
  if (!save.npcs[id]) {
    save.npcs[id] = {
      id,
      friendship: 0,
      talkedDay: 0,
      giftedDay: 0,
      met: false,
      requestWeek: 0
    };
  }
  return save.npcs[id];
}

export function friendshipHearts(friendship: number): number {
  return Math.max(0, Math.min(NPC_MAX_HEARTS, Math.floor(friendship / 100)));
}

const REQUEST_ITEMS = [
  'wheat',
  'carrots',
  'potatoes',
  'tomatoes',
  'corn',
  'pumpkins',
  'strawberries',
  'cabbage',
  'rice',
  'sunflowers',
  'egg',
  'milk',
  'wool',
  'cheese',
  'duck_egg',
  'minnow',
  'carp',
  'bass',
  'trout',
  'stone',
  'copper_ore',
  'iron_ore'
];

function hashText(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function currentWeek(save: SaveData): number {
  return Math.floor((absoluteDay(save.season, save.year, save.day) - 1) / 7) + 1;
}

export function npcWeeklyRequest(npc: NpcDef, save: SaveData) {
  const week = currentWeek(save);
  const seed = hashText(npc.id) + week * 17;
  const itemId = REQUEST_ITEMS[seed % REQUEST_ITEMS.length];
  const item = ITEMS[itemId];
  const qty = item.sell >= 100 ? 1 : item.sell >= 40 ? 1 + (seed % 2) : 2 + (seed % 3);
  const record = save.npcs[npc.id];
  return {
    week,
    itemId,
    itemName: item.name,
    qty,
    coins: Math.max(20, Math.round(item.sell * qty * 1.5)),
    xp: 8 + qty * 4,
    completed: (record?.requestWeek ?? 0) === week
  };
}

export function npcAvailable(
  npc: NpcDef,
  save: SaveData
): { available: boolean; reason: string } {
  const weekday = dayOfWeek(save.season, save.year, save.day);
  if (!npc.visitDays.includes(weekday)) {
    return { available: false, reason: `Visits on day ${npc.visitDays.join(', ')} of the week.` };
  }
  if (save.minute < 8 * 60 || save.minute >= 18 * 60) {
    return { available: false, reason: 'Visits between 8:00 AM and 6:00 PM.' };
  }
  return { available: true, reason: 'On the farm now.' };
}

export function isNpcBirthday(npc: NpcDef, save: SaveData): boolean {
  return npc.birthdaySeason === save.season && npc.birthdayDay === save.day;
}

export function birthdayLabel(npc: NpcDef): string {
  return `${SEASON_INFO[npc.birthdaySeason].name} ${npc.birthdayDay}`;
}

export type GiftReaction = 'love' | 'like' | 'neutral' | 'hate';

export function giftReaction(npc: NpcDef, itemId: string): GiftReaction {
  if (npc.loves.includes(itemId)) return 'love';
  if (npc.likes.includes(itemId)) return 'like';
  if (npc.hates.includes(itemId)) return 'hate';
  return 'neutral';
}

export function giftPoints(reaction: GiftReaction, birthday: boolean): number {
  const base = reaction === 'love' ? 80 : reaction === 'like' ? 40 : reaction === 'hate' ? -30 : 15;
  return birthday ? base * 2 : base;
}

export function heartEventLine(npc: NpcDef, before: number, after: number): string | null {
  const thresholds = [200, 400, 600, 800, 1000];
  for (let i = 0; i < thresholds.length; i++) {
    if (before < thresholds[i] && after >= thresholds[i]) return npc.heartLines[i];
  }
  return null;
}

export function npcStatus(save: SaveData, npc: NpcDef): string {
  if (save.spouseId === npc.id) return 'Married';
  const points = save.npcs[npc.id]?.friendship ?? 0;
  if (points >= 800 && npc.romanceable) return 'Sweetheart';
  if (points >= 400) return 'Close friend';
  if (points > 0) return 'Acquaintance';
  return 'Not met yet';
}

export function npcLine(npc: NpcDef, save: SaveData): string {
  const points = save.npcs[npc.id]?.friendship ?? 0;
  const index = Math.min(npc.lines.length - 1, Math.floor(points / 250));
  return npc.lines[Math.max(0, index)];
}

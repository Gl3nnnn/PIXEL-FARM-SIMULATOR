import { DAYS_PER_SEASON, SEASONS } from '../data/definitions';
import type { Season } from '../types';

/** Absolute day number used by NPC schedules and quarry respawns. */
export function absoluteDay(season: Season, year: number, day: number): number {
  const seasonIndex = Math.max(0, SEASONS.indexOf(season));
  return (Math.max(1, year) - 1) * 4 * DAYS_PER_SEASON + seasonIndex * DAYS_PER_SEASON + day;
}

/** 1 = first day of the year, wrapping every 7 days. */
export function dayOfWeek(season: Season, year: number, day: number): number {
  return ((absoluteDay(season, year, day) - 1) % 7) + 1;
}

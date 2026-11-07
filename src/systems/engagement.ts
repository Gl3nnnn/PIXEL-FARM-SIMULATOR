import { absoluteDay } from './calendar';
import type {
  EngagementSave,
  Season,
  SaveData,
  Stats,
  WeeklyEntrySave,
  WeeklySave
} from '../types';

/*
 * Login streak and weekly goals: the two reasons to open the farm every real
 * day, and to finish one more goal every week.
 */

/** Daily login gift. The streak makes it grow, up to a cap. */
export const LOGIN_GIFT = {
  baseCoins: 50,
  coinsPerStreakDay: 10,
  /** The gift stops growing after this many days in a row. */
  maxStreakDays: 14,
  xp: 10
};

/** Extra reward for finishing all three weekly goals. */
export const WEEKLY_BONUS = { coins: 300, xp: 50 };

export interface WeeklyGoalDef {
  id: string;
  title: string;
  desc: string;
  /** The stat that counts this goal's progress. */
  stat: keyof Stats;
  target: number;
  coins: number;
  xp: number;
}

export const WEEKLY_GOALS: WeeklyGoalDef[] = [
  { id: 'w_harvest', title: 'Harvest Week', desc: 'Harvest 15 crops this week.', stat: 'harvests', target: 15, coins: 150, xp: 25 },
  { id: 'w_plant', title: 'Busy Planter', desc: 'Plant 20 crops this week.', stat: 'planted', target: 20, coins: 130, xp: 25 },
  { id: 'w_sell', title: 'Market Week', desc: 'Sell 12 goods this week.', stat: 'cropsSold', target: 12, coins: 150, xp: 25 },
  { id: 'w_earn', title: 'Money Maker', desc: 'Earn 500 coins this week.', stat: 'coinsEarned', target: 500, coins: 160, xp: 30 },
  { id: 'w_water', title: 'Water Works', desc: 'Water 30 tiles this week.', stat: 'waters', target: 30, coins: 120, xp: 20 },
  { id: 'w_animal', title: 'Animal Care', desc: 'Collect 6 animal products this week.', stat: 'productsCollected', target: 6, coins: 150, xp: 25 },
  { id: 'w_fish', title: 'Gone Fishing', desc: 'Catch 5 fish this week.', stat: 'fishCaught', target: 5, coins: 140, xp: 25 },
  { id: 'w_mine', title: 'Rock Hound', desc: 'Mine 15 rocks this week.', stat: 'rocksMined', target: 15, coins: 140, xp: 25 },
  { id: 'w_forage', title: 'Forager', desc: 'Pick 6 wild plants this week.', stat: 'foragePicked', target: 6, coins: 120, xp: 20 },
  { id: 'w_ship', title: 'Ship It', desc: 'Ship 10 items this week.', stat: 'itemsShipped', target: 10, coins: 130, xp: 20 }
];

/** Real calendar day as YYYY-MM-DD, in the player's own time zone. */
export function localDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function defaultEngagement(): EngagementSave {
  return { loginDate: '', loginStreak: 0, loginClaimDate: '', weekly: null };
}

/** Counts this real day toward the login streak. Missing a day starts it again. */
export function advanceLoginStreak(eng: EngagementSave, now: Date): void {
  const today = localDateKey(now);
  if (eng.loginDate === today) return;
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  eng.loginStreak = eng.loginDate === localDateKey(yesterday) ? eng.loginStreak + 1 : 1;
  eng.loginDate = today;
}

/** Today's gift. It grows with the streak, up to a cap. */
export function loginGiftAmount(streak: number): { coins: number; xp: number } {
  const days = Math.min(Math.max(1, streak), LOGIN_GIFT.maxStreakDays);
  return { coins: LOGIN_GIFT.baseCoins + days * LOGIN_GIFT.coinsPerStreakDay, xp: LOGIN_GIFT.xp };
}

/** Week number counted from day one. A new week starts every seven in-game days. */
export function weekNumber(season: Season, year: number, day: number): number {
  return Math.floor((absoluteDay(season, year, day) - 1) / 7);
}

/** Days left in this week, counting today. */
export function weekDaysLeft(season: Season, year: number, day: number): number {
  return 7 - ((absoluteDay(season, year, day) - 1) % 7);
}

/** Small seeded random maker, so a given week always gets the same goals. */
function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Picks three different goals for a week. */
export function generateWeekly(week: number, startStats: Stats): WeeklySave {
  const rng = seededRandom(week * 7919 + 17);
  const pool = [...WEEKLY_GOALS];
  const list: WeeklyEntrySave[] = [];
  for (let i = 0; i < 3 && pool.length > 0; i++) {
    const idx = Math.floor(rng() * pool.length) % pool.length;
    const [goal] = pool.splice(idx, 1);
    list.push({ id: goal.id, claimed: false });
  }
  return { week, list, startStats: { ...startStats }, bonusClaimed: false };
}

export function readWeeklyGoal(id: string): WeeklyGoalDef | undefined {
  return WEEKLY_GOALS.find((goal) => goal.id === id);
}

/** How far a goal has come this week, counted from the week's start stats. */
export function weeklyGoalProgress(data: SaveData, goal: WeeklyGoalDef, startStats: Stats): number {
  return Math.max(0, data.stats[goal.stat] - startStats[goal.stat]);
}

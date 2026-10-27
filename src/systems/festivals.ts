import { FESTIVAL_CONTESTS, FESTIVALS, ITEMS, QUALITY_MULTIPLIER } from '../data/definitions';
import type {
  FestivalContestDef,
  FestivalTier,
  InventoryStack,
  Quality,
  SaveData,
  Season,
  SeasonContractDef,
  SeasonalSave,
  Stats
} from '../types';

const MAX_YEAR_SCALE = 1.5;

export function seasonalScale(year: number): number {
  return Math.min(MAX_YEAR_SCALE, 1 + Math.max(0, year - 1) * 0.1);
}

export function generateSeasonal(season: Season, year: number, startStats: Stats): SeasonalSave {
  const festival = FESTIVALS[season];
  const scale = seasonalScale(year);
  return {
    season,
    year: Math.max(1, Math.floor(year)),
    list: festival.contracts.map((contract) => ({
      id: contract.id,
      target: Math.ceil(contract.target * scale),
      coins: Math.round(contract.coins * scale),
      xp: Math.round(contract.xp * scale),
      claimed: false
    })),
    startStats: { ...startStats },
    bonusCoins: Math.round(festival.bonusCoins * scale),
    bonusXp: Math.round(festival.bonusXp * scale),
    bonusClaimed: false
  };
}

export function readSeasonalContract(season: Season, id: string): SeasonContractDef | undefined {
  return FESTIVALS[season].contracts.find((contract) => contract.id === id);
}

export function seasonalBoardMatches(
  save: SeasonalSave | null,
  season: Season,
  year: number
): boolean {
  if (!save || save.season !== season || save.year !== year) return false;
  const festival = FESTIVALS[season];
  return (
    save.list.length === festival.contracts.length &&
    save.list.every((entry) => festival.contracts.some((contract) => contract.id === entry.id))
  );
}

export interface FestivalCandidate {
  index: number;
  itemId: string;
  quality: Quality;
  available: number;
  take: number;
  unitScore: number;
}

export interface FestivalSelection {
  candidates: FestivalCandidate[];
  score: number;
  totalItems: number;
}

export function festivalContest(season: Season): FestivalContestDef {
  return FESTIVAL_CONTESTS[season];
}

export function festivalItemScore(itemId: string, quality: Quality, contest: FestivalContestDef): number {
  const def = ITEMS[itemId];
  if (!def) return 0;
  const base = def.sell || def.price;
  const theme = contest.themeBonuses.includes(itemId) ? 1.25 : 1;
  return Math.max(1, Math.round(base * QUALITY_MULTIPLIER[quality] * theme));
}

export function festivalBestSelection(save: SaveData): FestivalSelection {
  const contest = festivalContest(save.season);
  const candidates: FestivalCandidate[] = [];
  save.inventory.forEach((stack, index) => {
    if (!stack) return;
    const def = ITEMS[stack.itemId];
    if (!def || def.type !== contest.itemType) return;
    candidates.push({
      index,
      itemId: stack.itemId,
      quality: stack.quality,
      available: stack.qty,
      take: 0,
      unitScore: festivalItemScore(stack.itemId, stack.quality, contest)
    });
  });
  candidates.sort((a, b) => b.unitScore - a.unitScore);
  let remaining = contest.count;
  for (const candidate of candidates) {
    if (remaining <= 0) break;
    candidate.take = Math.min(candidate.available, remaining);
    remaining -= candidate.take;
  }
  const chosen = candidates.filter((candidate) => candidate.take > 0);
  const totalItems = chosen.reduce((sum, candidate) => sum + candidate.take, 0);
  const score = chosen.reduce((sum, candidate) => sum + candidate.take * candidate.unitScore, 0);
  return { candidates: chosen, score, totalItems };
}

export function festivalTierFor(score: number, contest: FestivalContestDef): FestivalTier {
  if (score >= contest.gold) return 'gold';
  if (score >= contest.silver) return 'silver';
  if (score >= contest.bronze) return 'bronze';
  return 'none';
}

export function festivalTierLabel(tier: FestivalTier): string {
  return tier === 'none' ? 'No ribbon' : tier.charAt(0).toUpperCase() + tier.slice(1);
}

export function festivalItemName(stack: InventoryStack): string {
  return ITEMS[stack.itemId]?.name ?? stack.itemId;
}

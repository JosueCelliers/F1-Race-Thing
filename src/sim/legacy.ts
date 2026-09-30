/**
 * Career verdicts, legacy scores and cross-career records.
 */
import { SERIES_MAP, SPECIAL_MAP, TRIPLE_CROWN } from '../content/series';
import type { CareerRecord, CareerTotals, Driver, Verdict, VerdictTier } from './types';

const TITLE_LEGACY: Record<string, number> = { prime: 100, endurance: 45, american: 50, gt: 25, apex: 18, contender: 9, cadet: 5 };
const WIN_LEGACY: Record<string, number> = { prime: 8, endurance: 4, american: 5, gt: 2.5, apex: 2, contender: 1, cadet: 0.6 };
const PODIUM_LEGACY: Record<string, number> = { prime: 2.5, endurance: 1.2, american: 1.2, gt: 0.6, apex: 0.6, contender: 0.3, cadet: 0.2 };

export function careerTotals(d: Driver, seasons: number, earnings: number, teams: number): CareerTotals {
  const t: CareerTotals = {
    starts: 0,
    wins: 0,
    podiums: 0,
    poles: 0,
    points: 0,
    dnfs: 0,
    crashes: 0,
    titles: 0,
    primeTitles: d.stats.prime?.titles ?? 0,
    primeWins: d.stats.prime?.wins ?? 0,
    teams,
    seriesRaced: Object.values(d.stats).filter((s) => s.starts > 0).length,
    seasons,
    earnings,
    specials: { ...d.specials },
  };
  for (const s of Object.values(d.stats)) {
    t.starts += s.starts;
    t.wins += s.wins;
    t.podiums += s.podiums;
    t.poles += s.poles;
    t.points += s.points;
    t.dnfs += s.dnfs;
    t.crashes += s.crashes;
    t.titles += s.titles;
  }
  return t;
}

export function hasTripleCrown(specials: Record<string, number>): boolean {
  return TRIPLE_CROWN.every((s) => (specials[s] ?? 0) > 0);
}

export function legacyScore(d: Driver): number {
  let score = 0;
  for (const [sid, s] of Object.entries(d.stats)) {
    score += s.titles * (TITLE_LEGACY[sid] ?? 10);
    score += s.wins * (WIN_LEGACY[sid] ?? 1);
    score += s.podiums * (PODIUM_LEGACY[sid] ?? 0.3);
    if (sid === 'prime') {
      score += s.poles * 1.5 + s.seasons * 3;
    }
  }
  for (const [sp, n] of Object.entries(d.specials)) score += (SPECIAL_MAP[sp]?.legacy ?? 5) * n;
  if (hasTripleCrown(d.specials)) score += 100;
  return Math.round(score);
}

const MAJOR = new Set(['prime', 'endurance', 'american', 'gt', 'apex']);

export function verdictFor(d: Driver, totals: CareerTotals, legacy: number): Verdict {
  const primeTitles = totals.primeTitles;
  const majorTitles = Object.entries(d.stats).reduce((a, [sid, s]) => a + (MAJOR.has(sid) ? s.titles : 0), 0);
  const juniorOnly = Object.entries(d.stats).every(([sid, s]) => s.starts === 0 || sid === 'cadet' || sid === 'contender');
  const name = d.last;
  const topSeries = Object.entries(d.stats).sort((a, b) => (SERIES_MAP[a[0]]?.tier ?? 9) - (SERIES_MAP[b[0]]?.tier ?? 9))[0]?.[0];
  const seriesName = topSeries ? SERIES_MAP[topSeries]?.name : 'racing';
  const crashRate = totals.starts ? totals.crashes / totals.starts : 0;
  let tier: VerdictTier;
  if (legacy >= 480 || primeTitles >= 3) tier = 'legend';
  else if (legacy >= 260 || primeTitles >= 1) tier = 'great';
  else if (legacy >= 110 || totals.primeWins >= 3 || majorTitles >= 2) tier = 'star';
  else if (legacy >= 45) tier = 'pro';
  else if (legacy >= 12 || totals.seasons >= 6) tier = 'journeyman';
  else tier = 'disaster';

  const cult =
    (totals.crashes >= 12 && totals.wins <= 3) ||
    (crashRate > 0.2 && totals.starts >= 25) ||
    (d.fans > 900 && legacy < 110) ||
    (totals.seasons >= 12 && totals.wins <= 1);
  if (cult && (tier === 'journeyman' || tier === 'pro' || tier === 'disaster') && totals.starts >= 20) tier = 'cult';

  const wins = totals.wins;
  const tc = hasTripleCrown(d.specials);
  if (juniorOnly && totals.titles >= 1 && tier !== 'disaster') {
    return {
      tier: 'cult',
      title: 'Big Fish, Small Pond',
      blurb: `${totals.titles} junior title${totals.titles > 1 ? 's' : ''} and ${wins} wins — but the big leagues never came calling for ${name}.`,
    };
  }
  let title = '';
  let blurb = '';
  switch (tier) {
    case 'legend':
      title = tc ? 'Triple Crown Legend' : primeTitles >= 5 ? 'Greatest of All Time' : 'All-Time Great';
      blurb = `${primeTitles}× Formula Prime champion with ${wins} career wins. They will name corners after ${name}.`;
      break;
    case 'great':
      title = primeTitles >= 1 ? 'World Champion' : 'Multiple Champion';
      blurb = primeTitles >= 1 ? `${name} reached the summit: Formula Prime champion, ${wins} wins in all.` : `${totals.titles} championships and ${wins} wins across ${totals.seriesRaced} series.`;
      break;
    case 'star': {
      const endu = d.stats.endurance?.wins ?? 0;
      const amer = d.stats.american?.wins ?? 0;
      title = (d.specials.france24 ?? 0) > 0 ? 'Endurance Icon' : (d.specials.heartland500 ?? 0) > 0 ? 'Oval Hero' : endu > (d.stats.prime?.wins ?? 0) ? 'Endurance Ace' : amer > 3 ? 'Speedway Star' : 'Race Winner';
      blurb = `${wins} wins and ${totals.podiums} podiums. A genuine star of ${seriesName}.`;
      break;
    }
    case 'pro':
      title = wins > 0 ? 'Solid Professional' : 'Reliable Pro';
      blurb = `${totals.seasons} seasons, ${totals.podiums} podiums${wins ? `, ${wins} win${wins > 1 ? 's' : ''}` : ''}. Teams always knew what they were getting.`;
      break;
    case 'journeyman':
      title = totals.teams >= 5 ? 'Paddock Nomad' : 'Journeyman';
      blurb = `${totals.starts} starts for ${totals.teams} team${totals.teams > 1 ? 's' : ''}. Never quite made it, never quite gave up.`;
      break;
    case 'cult':
      title = totals.crashes >= 12 ? 'Crash Magnet' : d.fans > 900 ? 'Fan Favourite' : 'Cult Hero';
      blurb = `${totals.crashes} crashes, ${wins} win${wins === 1 ? '' : 's'}, zero regrets. The fans will never forget ${name}.`;
      break;
    case 'disaster':
      title = totals.seasons <= 2 ? 'Gone Too Soon' : totals.crashes > totals.podiums * 2 ? 'Total Disaster' : 'What Could Have Been';
      blurb = `${totals.starts} starts, ${totals.points} points. The dream ended early for ${name}.`;
      break;
  }
  return { tier, title, blurb };
}

export const TIER_ORDER: VerdictTier[] = ['legend', 'great', 'star', 'pro', 'cult', 'journeyman', 'disaster'];

export const TIER_INFO: Record<VerdictTier, { label: string; emoji: string; color: string }> = {
  legend: { label: 'Legends', emoji: '🏆', color: '#FFC940' },
  great: { label: 'Champions', emoji: '🥇', color: '#FFB020' },
  star: { label: 'Stars', emoji: '⭐', color: '#6FD3FF' },
  pro: { label: 'Professionals', emoji: '🧰', color: '#8FA3C7' },
  cult: { label: 'Cult Heroes', emoji: '😂', color: '#FF7AC6' },
  journeyman: { label: 'Journeymen', emoji: '🧳', color: '#A0A8B8' },
  disaster: { label: 'Disasters', emoji: '💀', color: '#FF5A5F' },
};

// ---------------------------------------------------------------------------
// Records across all your careers
// ---------------------------------------------------------------------------

export interface RecordEntry {
  id: string;
  title: string;
  emoji: string;
  careerId: string;
  name: string;
  value: string;
  detail?: string;
}

type Metric = {
  id: string;
  title: string;
  emoji: string;
  /** Higher is better unless `lowest`. Return undefined to skip career. */
  get: (c: CareerRecord) => number | undefined;
  format: (v: number, c: CareerRecord) => string;
  lowest?: boolean;
  min?: number;
};

function champAge(c: CareerRecord): number | undefined {
  const s = c.seasons.find((x) => x.champion && x.series === 'prime');
  return s?.age;
}

function anyChampAge(c: CareerRecord): number | undefined {
  const s = c.seasons.filter((x) => x.champion).map((x) => x.age);
  return s.length ? Math.min(...s) : undefined;
}

function bestSeasonWinRate(c: CareerRecord): number | undefined {
  const rates = c.seasons.filter((s) => s.races >= 6).map((s) => s.wins / s.races);
  return rates.length ? Math.max(...rates) : undefined;
}

export const RECORD_METRICS: Metric[] = [
  { id: 'primeTitles', title: 'Most Formula Prime titles', emoji: '👑', get: (c) => c.totals.primeTitles || undefined, format: (v) => `${v}` },
  { id: 'titles', title: 'Most championships (any series)', emoji: '🏆', get: (c) => c.totals.titles || undefined, format: (v) => `${v}` },
  { id: 'wins', title: 'Most race wins', emoji: '🥇', get: (c) => c.totals.wins || undefined, format: (v) => `${v}` },
  { id: 'primeWins', title: 'Most Formula Prime wins', emoji: '🏁', get: (c) => c.totals.primeWins || undefined, format: (v) => `${v}` },
  { id: 'podiums', title: 'Most podiums', emoji: '🍾', get: (c) => c.totals.podiums || undefined, format: (v) => `${v}` },
  { id: 'poles', title: 'Most pole positions', emoji: '⏱️', get: (c) => c.totals.poles || undefined, format: (v) => `${v}` },
  { id: 'youngestPrimeChamp', title: 'Youngest Formula Prime champion', emoji: '👶', get: champAge, format: (v) => `${v} yrs`, lowest: true },
  { id: 'youngestChamp', title: 'Youngest champion (any series)', emoji: '🍼', get: anyChampAge, format: (v) => `${v} yrs`, lowest: true },
  { id: 'dominant', title: 'Most dominant season', emoji: '💪', get: bestSeasonWinRate, format: (v) => `${Math.round(v * 100)}% wins` },
  { id: 'longest', title: 'Longest career', emoji: '🧓', get: (c) => c.totals.seasons, format: (v) => `${v} seasons` },
  { id: 'shortest', title: 'Shortest career', emoji: '⚡', get: (c) => c.totals.seasons, format: (v) => `${v} season${v === 1 ? '' : 's'}`, lowest: true },
  { id: 'crashes', title: 'Most crashes', emoji: '💥', get: (c) => c.totals.crashes || undefined, format: (v) => `${v}` },
  { id: 'teams', title: 'Most teams driven for', emoji: '🧳', get: (c) => c.totals.teams, format: (v) => `${v}` },
  { id: 'series', title: 'Most categories raced', emoji: '🗺️', get: (c) => c.totals.seriesRaced, format: (v) => `${v}` },
  {
    id: 'winless',
    title: 'Most starts without a win',
    emoji: '🫠',
    get: (c) => (c.totals.wins === 0 ? c.totals.starts : undefined),
    format: (v) => `${v} starts`,
  },
  { id: 'france24', title: '24 Hours of France wins', emoji: '🕛', get: (c) => c.totals.specials.france24 || undefined, format: (v) => `${v}` },
  { id: 'heartland500', title: 'Heartland 500 wins', emoji: '🏁', get: (c) => c.totals.specials.heartland500 || undefined, format: (v) => `${v}` },
  { id: 'riviera', title: 'Principality GP wins', emoji: '🛥️', get: (c) => c.totals.specials.riviera || undefined, format: (v) => `${v}` },
  { id: 'legacy', title: 'Highest legacy score', emoji: '✨', get: (c) => c.legacy, format: (v) => `${v}` },
  {
    id: 'worstChamp',
    title: 'Lowest-rated champion',
    emoji: '🍀',
    get: (c) => {
      const s = c.seasons.filter((x) => x.champion);
      return s.length ? Math.min(...s.map((x) => x.ovr)) : undefined;
    },
    format: (v) => `OVR ${v}`,
    lowest: true,
  },
];

export function computeRecords(careers: CareerRecord[]): RecordEntry[] {
  const out: RecordEntry[] = [];
  for (const m of RECORD_METRICS) {
    let best: { c: CareerRecord; v: number } | undefined;
    for (const c of careers) {
      const v = m.get(c);
      if (v === undefined || !isFinite(v)) continue;
      if (!best || (m.lowest ? v < best.v : v > best.v)) best = { c, v };
    }
    if (best) {
      out.push({
        id: m.id,
        title: m.title,
        emoji: m.emoji,
        careerId: best.c.id,
        name: `${best.c.driver.first} ${best.c.driver.last}`,
        value: m.format(best.v, best.c),
      });
    }
  }
  return out;
}

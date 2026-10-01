/**
 * Driver creation: the sequence of wheels the player spins, and turning the
 * results into a driver. Wheels are generated dynamically so later wheels can
 * react to earlier results (e.g. only adults can start in GT racing).
 */
import { NATIONS, nation } from '../content/nations';
import { series as seriesDef } from '../content/series';
import { FAMILIES, family, PERSONALITIES } from '../content/traits';
import { clamp, Rng } from './rng';
import { generateHelmet, generateLooks, generateName, newId, overall } from './drivers';
import { teamsInSeries } from './season';
import type { CreationPick, Driver, Gender, HelmetDesign, Looks, Skills, World } from './types';

export interface WheelSlice {
  id: string;
  label: string;
  sub?: string;
  emoji?: string;
  /** Nation id when the slice should render a flag. */
  flag?: string;
  weight: number;
  color?: string;
  /** Render as N stars instead of text. */
  stars?: number;
  value: string | number;
}

export interface WheelDef {
  id: string;
  title: string;
  emoji: string;
  blurb: string;
  slices: WheelSlice[];
}

export const WHEEL_ORDER = ['nation', 'family', 'age', 'pace', 'racecraft', 'consistency', 'wet', 'aggression', 'personality', 'potential', 'series', 'team'] as const;

export type WheelId = (typeof WHEEL_ORDER)[number];

export const STAR_BANDS: [number, number][] = [
  [38, 46],
  [46, 54],
  [54, 62],
  [62, 70],
  [70, 78],
];

const STAR_WEIGHTS = [1.4, 2.4, 3, 2.1, 1];

function stars(n: number): string {
  return '★'.repeat(n);
}

export const WET_LABELS = ['Hates the rain', 'Nervous in the wet', 'Average in the wet', 'Good in the wet', 'Rain master'];
export const AGGRESSION_LEVELS = [
  { id: 'calm', label: 'Ice calm', value: 15, weight: 1.2 },
  { id: 'calculated', label: 'Calculated', value: 35, weight: 2 },
  { id: 'balanced', label: 'Balanced', value: 50, weight: 2.5 },
  { id: 'aggressive', label: 'Aggressive', value: 70, weight: 2 },
  { id: 'kamikaze', label: 'Kamikaze', value: 90, weight: 1.1 },
];
export const POTENTIALS = [
  { id: 'generational', label: 'Generational', value: 26, weight: 0.6 },
  { id: 'star', label: 'Future star', value: 19, weight: 1.4 },
  { id: 'solid', label: 'Solid', value: 13, weight: 2.5 },
  { id: 'limited', label: 'Limited', value: 7, weight: 2 },
  { id: 'peaked', label: 'Peaked already', value: 3, weight: 1 },
];

export type Picks = Partial<Record<WheelId, WheelSlice>>;

function starWheel(id: WheelId, title: string, emoji: string, blurb: string): WheelDef {
  return {
    id,
    title,
    emoji,
    blurb,
    slices: [1, 2, 3, 4, 5].map((n) => ({ id: `${n}`, label: stars(n), stars: n, weight: STAR_WEIGHTS[n - 1], value: n })),
  };
}

export function buildWheel(id: WheelId, picks: Picks, world: World, rng: Rng): WheelDef {
  switch (id) {
    case 'nation': {
      const pool = rng.shuffle([...NATIONS]);
      const chosen: typeof NATIONS = [];
      while (chosen.length < 12 && pool.length) {
        const idx = rng.weightedIndex(pool.map((n) => Math.sqrt(n.motorsport) + 0.6));
        chosen.push(pool.splice(idx, 1)[0]);
      }
      return {
        id,
        title: 'Nationality',
        emoji: '🏳️',
        blurb: 'Where does your driver come from?',
        slices: chosen.map((n) => ({ id: n.id, label: n.wheel, flag: n.id, weight: 1, value: n.id })),
      };
    }
    case 'family':
      return {
        id,
        title: 'Family',
        emoji: '🏠',
        blurb: 'Money and connections open doors.',
        slices: FAMILIES.map((f) => ({
          id: f.id,
          label: f.label,
          emoji: f.emoji,
          weight: { dynasty: 1.2, wealthy: 1.3, comfortable: 2.2, working: 2.2, poor: 1.6 }[f.id],
          value: f.id,
        })),
      };
    case 'age':
      return {
        id,
        title: 'Debut age',
        emoji: '🎂',
        blurb: 'How old are you for your first car race?',
        slices: [15, 16, 17, 18, 19, 20, 21].map((a, i) => ({ id: `${a}`, label: `${a}`, weight: [1.5, 3, 3, 2, 1.2, 0.8, 0.5][i], value: a })),
      };
    case 'pace':
      return starWheel(id, 'Raw pace', '⚡', 'One-lap speed and race pace.');
    case 'racecraft':
      return starWheel(id, 'Racecraft', '⚔️', 'Overtaking and wheel-to-wheel defending.');
    case 'consistency':
      return starWheel(id, 'Consistency', '🎯', 'Avoiding mistakes, managing tyres.');
    case 'wet':
      return {
        id,
        title: 'Wet weather',
        emoji: '🌧️',
        blurb: 'What happens when the heavens open?',
        slices: WET_LABELS.map((l, i) => ({ id: `${i + 1}`, label: l, sub: stars(i + 1), weight: STAR_WEIGHTS[i], value: i + 1 })),
      };
    case 'aggression':
      return {
        id,
        title: 'Driving style',
        emoji: '🔥',
        blurb: 'Aggressive drivers pass more — and crash more.',
        slices: AGGRESSION_LEVELS.map((a) => ({ id: a.id, label: a.label, weight: a.weight, value: a.value })),
      };
    case 'personality':
      return {
        id,
        title: 'Known as...',
        emoji: '🎭',
        blurb: 'How the paddock sees you.',
        slices: PERSONALITIES.map((p) => ({ id: p.id, label: p.label, emoji: p.emoji, weight: p.id === 'golden' ? 0.8 : 1, value: p.id })),
      };
    case 'potential':
      return {
        id,
        title: 'Potential',
        emoji: '📈',
        blurb: 'How much better can you get?',
        slices: POTENTIALS.map((p) => ({ id: p.id, label: p.label, weight: p.weight, value: p.value })),
      };
    case 'series': {
      const age = Number(picks.age?.value ?? 16);
      const fam = String(picks.family?.value ?? 'comfortable');
      const rich = fam === 'wealthy' || fam === 'dynasty';
      const nat = String(picks.nation?.value ?? 'GB');
      const slices: WheelSlice[] = [];
      // Starting far below the level of a field is hopeless rather than fun, so
      // series out of reach of the talent rolled so far become long shots.
      const expected = expectedRating(picks);
      const fit = (sid: string) => {
        const ids = teamsInSeries(world, sid).flatMap((t) => t.drivers);
        const avg = ids.length ? ids.reduce((acc, did) => acc + overall(world.drivers[did].skills), 0) / ids.length : seriesDef(sid).ovrBand[0];
        return clamp(1 - Math.max(0, avg - expected - 4) / 10, 0.04, 1);
      };
      if (age <= 19) slices.push({ id: 'cadet', label: 'Formula Cadet', sub: 'The classic ladder', weight: 5 * fit('cadet'), value: 'cadet' });
      if (age >= 16) slices.push({ id: 'contender', label: 'Formula Contender', sub: 'Skip a rung', weight: (rich ? 2.2 : 0.9) * fit('contender'), value: 'contender' });
      if (age >= 17 && rich) slices.push({ id: 'apex', label: 'Formula Apex', sub: 'Money talks', weight: 0.7 * fit('apex'), value: 'apex' });
      if (age >= 18) slices.push({ id: 'gt', label: 'GT World Series', sub: 'Sports cars', weight: 2.2 * fit('gt'), value: 'gt' });
      if (age >= 18)
        slices.push({ id: 'american', label: 'American Open-Wheel', sub: 'Ovals & street fights', weight: (nat === 'US' || nat === 'CA' ? 2.4 : 1.1) * fit('american'), value: 'american' });
      if (age >= 20) slices.push({ id: 'endurance', label: 'Global Endurance', sub: 'Privateer seat', weight: (rich ? 0.8 : 0.4) * fit('endurance'), value: 'endurance' });
      return { id, title: 'First championship', emoji: '🏁', blurb: 'Where does your career begin?', slices };
    }
    case 'team': {
      const sid = String(picks.series?.value ?? 'cadet');
      const fam = family(String(picks.family?.value ?? 'comfortable'));
      const talent = (['pace', 'racecraft', 'consistency'] as const).reduce((a, k) => a + Number(picks[k]?.value ?? 3), 0) / 3;
      const teams = teamsInSeries(world, sid).sort((a, b) => b.perf - a.perf);
      return {
        id,
        title: 'First team',
        emoji: '🏎️',
        blurb: `Who gives you a seat in ${seriesDef(sid).name}?`,
        slices: teams.map((t, i) => {
          const top = 1 - i / Math.max(1, teams.length - 1);
          let w = 1 + (1 - top) * 1.6;
          w *= 1 + top * (fam.budget / 900 + Math.max(0, talent - 3) * 0.6);
          return { id: t.id, label: t.name, weight: w, color: t.colors.primary, value: t.id };
        }),
      };
    }
  }
}

/** Rating the skill wheels point to so far (mid-points of the star bands, plus age maturity). */
export function expectedRating(picks: Picks): number {
  const mid = (k: 'pace' | 'racecraft' | 'consistency' | 'wet') => {
    const [lo, hi] = STAR_BANDS[clamp(Number(picks[k]?.value ?? 3), 1, 5) - 1];
    return (lo + hi) / 2;
  };
  const maturity = Math.max(0, Number(picks.age?.value ?? 16) - 17);
  return overall({ pace: mid('pace'), racecraft: mid('racecraft') + Math.min(4, maturity), consistency: mid('consistency') + Math.min(6, maturity * 2), wet: mid('wet') });
}

export function pickSlice(wheel: WheelDef, rng: Rng): number {
  return rng.weightedIndex(wheel.slices.map((s) => s.weight));
}

export interface Identity {
  first: string;
  last: string;
  gender: Gender;
  looks: Looks;
  helmet: HelmetDesign;
  number: number;
  parentId?: string;
}

/** Choose a plausible parent for a Racing Dynasty driver: prefer your own past drivers. */
export function findParent(world: World, born: number, nationId: string): string | undefined {
  const candidates = Object.values(world.drivers).filter((d) => {
    if (d.status !== 'retired') return false;
    const gap = born - d.born;
    if (gap < 20 || gap > 46) return false;
    const wins = Object.values(d.stats).reduce((a, s) => a + s.wins, 0);
    return wins > 0 || !!d.careerId;
  });
  if (!candidates.length) return undefined;
  const score = (d: Driver) => {
    const wins = Object.values(d.stats).reduce((a, s) => a + s.wins, 0);
    const titles = Object.values(d.stats).reduce((a, s) => a + s.titles, 0);
    return (d.careerId ? 50 : 0) + titles * 10 + wins + (d.nation === nationId ? 8 : 0);
  };
  return candidates.sort((a, b) => score(b) - score(a))[0].id;
}

export function rollIdentity(world: World, picks: Picks, rng: Rng, gender?: Gender): Identity {
  const nat = String(picks.nation?.value ?? 'GB');
  const g: Gender = gender ?? (rng.chance(0.25) ? 'f' : 'm');
  const age = Number(picks.age?.value ?? 16);
  const born = world.year + 1 - age;
  let parentId: string | undefined;
  let surname: string | undefined;
  if (picks.family?.value === 'dynasty') {
    parentId = findParent(world, born, nat);
    if (parentId) surname = world.drivers[parentId].last;
  }
  const { first, last } = generateName(rng, nat, g, surname);
  const looks = generateLooks(rng, nat, g);
  if (parentId) {
    // Children look a bit like their famous parent.
    const parent = world.drivers[parentId];
    looks.skin = Math.max(0, Math.min(7, parent.looks.skin + rng.int(-1, 1)));
    if (rng.chance(0.6)) looks.hairColor = parent.looks.hairColor;
    if (rng.chance(0.5)) looks.eyeColor = parent.looks.eyeColor;
    if (rng.chance(0.4)) looks.nose = parent.looks.nose;
  }
  return {
    first,
    last,
    gender: g,
    looks,
    helmet: generateHelmet(rng, nat),
    number: rng.int(2, 99),
    parentId,
  };
}

export function skillFromStars(n: number, rng: Rng): number {
  const [lo, hi] = STAR_BANDS[clamp(n, 1, 5) - 1];
  return rng.float(lo, hi);
}

export function picksToCreation(picks: Picks): CreationPick[] {
  return WHEEL_ORDER.filter((w) => picks[w]).map((w) => ({
    wheel: w,
    label: picks[w]!.label + (picks[w]!.sub && w === 'wet' ? '' : ''),
    value: picks[w]!.value,
    emoji: picks[w]!.emoji,
  }));
}

/** Skill values for the picks. Must be the first use of `rng` for determinism. */
export function rollSkills(picks: Picks, rng: Rng): Skills {
  const age = Number(picks.age?.value ?? 16);
  const maturity = Math.max(0, age - 17);
  return {
    pace: skillFromStars(Number(picks.pace?.value ?? 3), rng),
    racecraft: skillFromStars(Number(picks.racecraft?.value ?? 3), rng) + Math.min(4, maturity),
    consistency: skillFromStars(Number(picks.consistency?.value ?? 3), rng) + Math.min(6, maturity * 2),
    wet: skillFromStars(Number(picks.wet?.value ?? 3), rng),
  };
}

/** Build the player's driver from the wheel results. Does not add it to the world. */
export function buildPlayerDriver(world: World, picks: Picks, id: Identity, rng: Rng): Driver {
  const age = Number(picks.age?.value ?? 16);
  const skills: Skills = rollSkills(picks, rng);
  const potential = Number(picks.potential?.value ?? 11);
  const growth = potential * Math.max(0.35, 1 - Math.max(0, age - 16) * 0.08);
  const fam = family(String(picks.family?.value ?? 'comfortable'));
  const avgStars = (['pace', 'racecraft', 'consistency', 'wet'] as const).reduce((a, k) => a + Number(picks[k]?.value ?? 3), 0) / 4;
  const sid = String(picks.series?.value ?? 'cadet');
  const d: Driver = {
    id: newId(world, 'p'),
    first: id.first,
    last: id.last,
    gender: id.gender,
    nation: String(picks.nation?.value ?? 'GB'),
    born: world.year + 1 - age,
    skills,
    growth,
    aggression: clamp(Number(picks.aggression?.value ?? 50) + rng.normal(0, 4), 5, 95),
    personality: String(picks.personality?.value ?? 'grafter') as Driver['personality'],
    family: fam.id,
    looks: id.looks,
    helmet: id.helmet,
    number: id.number,
    status: 'active',
    stats: {},
    specials: {},
    reputation: clamp(8 + fam.reputation + (avgStars - 3) * 5 + (id.parentId ? 10 : 0), 0, 100),
    fans: Math.round(2 + (id.parentId ? 25 : 0) + (fam.id === 'wealthy' ? 5 : 0)),
    morale: clamp(62 + fam.morale, 0, 100),
    yearsWithoutSeat: 0,
    peakOvr: 0,
    parentId: id.parentId,
    path: seriesDef(sid).path,
    log: [],
  };
  d.peakOvr = Math.round(overall(skills));
  return d;
}

export function nationName(id: string): string {
  return nation(id).adjective;
}

import { isFamousDriverName, NAME_GROUPS } from '../content/names';
import { nation, NATIONS } from '../content/nations';
import { BROW_PARTS, EXTRA_PARTS, EYE_PARTS, FACE_PARTS, FACIAL_PARTS, HAIR_PARTS, HELMET_COLORS, HELMET_PATTERNS, MOUTH_PARTS, NOSE_PARTS } from '../content/looks';
import { PERSONALITIES, personality } from '../content/traits';
import type { LookPartMeta } from '../content/types';
import { clamp, Rng } from './rng';
import type { Driver, Gender, HelmetDesign, Looks, SeriesStats, Skills, World } from './types';

export const SKILL_WEIGHTS: Skills = { pace: 0.4, racecraft: 0.25, consistency: 0.2, wet: 0.15 };

export function overall(s: Skills): number {
  return s.pace * SKILL_WEIGHTS.pace + s.racecraft * SKILL_WEIGHTS.racecraft + s.consistency * SKILL_WEIGHTS.consistency + s.wet * SKILL_WEIGHTS.wet;
}

export function ovr(d: Driver): number {
  return Math.round(overall(d.skills));
}

export function ageOf(d: Driver, year: number): number {
  return year - d.born;
}

export function fullName(d: { first: string; last: string }): string {
  return `${d.first} ${d.last}`;
}

export function shortName(d: { first: string; last: string }): string {
  return `${d.first.charAt(0)}. ${d.last}`;
}

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l').replace(/Ł/g, 'L').replace(/ø/g, 'o').replace(/Ø/g, 'O').replace(/ß/g, 'ss');
}

/** Three-letter timing-tower code from the surname. */
export function driverCode(d: { last: string }): string {
  const parts = stripAccents(d.last)
    .replace(/[^A-Za-z ]/g, '')
    .split(' ')
    .filter(Boolean);
  const main = parts.length > 1 && parts[0].length <= 3 ? parts.slice(1).join('') : parts.join('');
  return (main + 'XXX').slice(0, 3).toUpperCase();
}

export function emptyStats(): SeriesStats {
  return { starts: 0, wins: 0, podiums: 0, poles: 0, points: 0, dnfs: 0, crashes: 0, fastestLaps: 0, titles: 0, bestFinish: 0, seasons: 0 };
}

export function statsFor(d: Driver, series: string): SeriesStats {
  if (!d.stats[series]) d.stats[series] = emptyStats();
  return d.stats[series];
}

export function totalStats(d: Driver): SeriesStats {
  const t = emptyStats();
  for (const s of Object.values(d.stats)) {
    t.starts += s.starts;
    t.wins += s.wins;
    t.podiums += s.podiums;
    t.poles += s.poles;
    t.points += s.points;
    t.dnfs += s.dnfs;
    t.crashes += s.crashes;
    t.fastestLaps += s.fastestLaps;
    t.titles += s.titles;
    t.seasons += s.seasons;
    if (s.bestFinish > 0 && (t.bestFinish === 0 || s.bestFinish < t.bestFinish)) t.bestFinish = s.bestFinish;
  }
  return t;
}

// ---------------------------------------------------------------------------
// Names & looks
// ---------------------------------------------------------------------------

function feminiseSurname(last: string, rule?: string): string {
  if (rule !== 'polish') return last;
  if (last.endsWith('ski')) return last.slice(0, -3) + 'ska';
  if (last.endsWith('cki')) return last.slice(0, -3) + 'cka';
  if (last.endsWith('dzki')) return last.slice(0, -4) + 'dzka';
  return last;
}

export function generateName(rng: Rng, nationId: string, gender: Gender, surname?: string): { first: string; last: string } {
  const n = nation(nationId);
  const group = NAME_GROUPS[n.nameGroup] ?? NAME_GROUPS.english;
  let first = '';
  let last = '';
  // Re-roll the (rare) combinations that spell a famous real driver's name.
  for (let attempt = 0; attempt < 12; attempt++) {
    first = rng.pick(gender === 'f' ? group.female : group.male);
    last = surname ?? rng.pick(group.last);
    if (gender === 'f') last = feminiseSurname(last, group.femaleSurnameRule);
    if (!isFamousDriverName(first, last)) break;
  }
  return { first, last };
}

function pickPart(rng: Rng, parts: LookPartMeta[], gender: Gender, boost?: Record<string, number>): string {
  const pool = parts.filter((p) => p.genders.includes(gender));
  return rng.weighted(pool, (p) => p.weight * (boost?.[p.id] ?? 1)).id;
}

export function generateLooks(rng: Rng, nationId: string, gender: Gender): Looks {
  const n = nation(nationId);
  const skin = rng.weightedIndex(n.skin);
  let hairColor = rng.weightedIndex(n.hair);
  // Darker skin tones: bias towards dark hair; rare dyed/blonde still possible.
  if (skin >= 5 && hairColor >= 3 && rng.chance(0.75)) hairColor = rng.pick([0, 1]);
  const hairBoost: Record<string, number> = skin >= 5 ? { afro: 4, braids: 3, curly: 1.6, fade: 1.5 } : { afro: 0.15, braids: 0.4 };
  return {
    skin,
    face: pickPart(rng, FACE_PARTS, gender),
    hair: pickPart(rng, HAIR_PARTS, gender, hairBoost),
    hairColor,
    brows: pickPart(rng, BROW_PARTS, gender),
    eyes: pickPart(rng, EYE_PARTS, gender),
    eyeColor: rng.weightedIndex(n.eyes),
    nose: pickPart(rng, NOSE_PARTS, gender),
    mouth: pickPart(rng, MOUTH_PARTS, gender),
    facial: pickPart(rng, FACIAL_PARTS, gender),
    extra: pickPart(rng, EXTRA_PARTS, gender, skin >= 4 ? { freckles: 0.3 } : undefined),
  };
}

export function generateHelmet(rng: Rng, nationId: string): HelmetDesign {
  const n = nation(nationId);
  const pattern = rng.pick(HELMET_PATTERNS);
  let colors: [string, string, string];
  if (rng.chance(0.45)) {
    const c = rng.shuffle([...n.colors]);
    colors = [c[0], c[1], c[2]];
  } else {
    const pool = rng.shuffle([...HELMET_COLORS]);
    colors = [pool[0], pool[1], pool[2]];
  }
  return { pattern, colors };
}

// ---------------------------------------------------------------------------
// AI driver generation
// ---------------------------------------------------------------------------

export function pickNation(rng: Rng, bias?: Record<string, number>): string {
  return rng.weighted(NATIONS, (n) => n.motorsport * (bias?.[n.id] ?? 1)).id;
}

/** Spread a target overall rating into four skills with some character. */
export function skillsForOvr(rng: Rng, target: number): Skills {
  const s: Skills = {
    pace: target + rng.normal(0, 5),
    racecraft: target + rng.normal(0, 6),
    consistency: target + rng.normal(0, 6),
    wet: target + rng.normal(0, 8),
  };
  const diff = target - overall(s);
  s.pace += diff;
  s.racecraft += diff;
  s.consistency += diff;
  s.wet += diff;
  return clampSkills(s);
}

export function clampSkills(s: Skills): Skills {
  return {
    pace: clamp(s.pace, 15, 99),
    racecraft: clamp(s.racecraft, 15, 99),
    consistency: clamp(s.consistency, 15, 99),
    wet: clamp(s.wet, 15, 99),
  };
}

export function newId(world: World, prefix: string): string {
  world.nextId += 1;
  return `${prefix}${world.nextId.toString(36)}`;
}

export interface AiDriverOpts {
  age: number;
  ovr: number;
  growth?: number;
  nation?: string;
  path: Driver['path'];
  gender?: Gender;
  surname?: string;
}

export function createAiDriver(world: World, rng: Rng, opts: AiDriverOpts): Driver {
  const gender: Gender = opts.gender ?? (rng.chance(0.14) ? 'f' : 'm');
  const nat = opts.nation ?? pickNation(rng);
  const { first, last } = generateName(rng, nat, gender, opts.surname);
  const age = opts.age;
  const growth = opts.growth ?? Math.max(0, (26 - age) * rng.float(0.9, 2.6));
  const p = rng.weighted(PERSONALITIES, (x) => (x.id === 'golden' ? 0.6 : 1));
  const skills = skillsForOvr(rng, opts.ovr);
  const d: Driver = {
    id: newId(world, 'd'),
    first,
    last,
    gender,
    nation: nat,
    born: world.year - age,
    skills,
    growth,
    aggression: clamp(Math.round(rng.normal(50, 18)), 5, 95),
    personality: p.id,
    looks: generateLooks(rng, nat, gender),
    helmet: generateHelmet(rng, nat),
    number: rng.int(2, 99),
    status: 'active',
    stats: {},
    specials: {},
    reputation: clamp(Math.round((opts.ovr - 40) * 1.1 + rng.normal(0, 6)), 0, 100),
    fans: Math.max(1, Math.round(Math.pow(Math.max(opts.ovr - 35, 1), 1.6) * rng.float(0.5, 1.5))),
    morale: 60,
    yearsWithoutSeat: 0,
    peakOvr: Math.round(overall(skills)),
    path: opts.path,
    log: [],
  };
  world.drivers[d.id] = d;
  return d;
}

// ---------------------------------------------------------------------------
// Yearly development
// ---------------------------------------------------------------------------

export interface DevelopmentResult {
  before: Skills;
  after: Skills;
  ovrBefore: number;
  ovrAfter: number;
}

/**
 * Apply one year of development/aging. Called at the end of each season with
 * the age the driver will be in the coming season.
 */
export function developDriver(d: Driver, nextAge: number, rng: Rng, tier = 3): DevelopmentResult {
  const p = personality(d.personality);
  const before = { ...d.skills };
  const shift = p.ageShift;
  const peakStart = 25 + shift;
  const peakEnd = 31 + shift;
  const s = d.skills;
  const tierBoost = 1 + (4 - Math.min(tier, 4)) * 0.03;

  if (nextAge <= peakStart) {
    let rate = nextAge <= 18 ? 0.22 : nextAge <= 21 ? 0.26 : nextAge <= 24 ? 0.3 : 0.4;
    if (d.personality === 'lateBloomer' && nextAge <= 23) rate *= 0.7;
    rate *= p.devRate * tierBoost;
    const gain = Math.min(d.growth, d.growth * rate + rng.normal(0, 0.4));
    d.growth = Math.max(0, d.growth - Math.max(0, gain));
    const g = Math.max(0, gain);
    // Each skill grows by roughly `g` (with character), so overall grows by ~g.
    s.pace += g * rng.float(0.95, 1.3);
    s.racecraft += g * rng.float(0.75, 1.15) + rng.float(0.2, 0.7);
    s.consistency += g * rng.float(0.7, 1.1) + rng.float(0.2, 0.7);
    s.wet += g * rng.float(0.5, 1.2) + rng.float(0, 0.4);
  } else if (nextAge <= peakEnd) {
    const gain = d.growth * 0.5;
    d.growth -= gain;
    s.pace += gain * rng.float(0.9, 1.2) + rng.normal(0, 0.4);
    s.racecraft += gain * rng.float(0.8, 1.1) + rng.float(0, 0.5);
    s.consistency += gain * rng.float(0.8, 1.1) + rng.float(0, 0.5);
    s.wet += gain * rng.float(0.6, 1.1) + rng.normal(0, 0.3);
  } else {
    d.growth = 0;
    const decline = (nextAge - peakEnd) * 0.55 + 0.4;
    s.pace -= decline * rng.float(0.8, 1.25);
    s.racecraft -= decline * rng.float(0.2, 0.55);
    s.consistency -= decline * rng.float(0.1, 0.45);
    s.wet -= decline * rng.float(0.3, 0.8);
  }
  d.skills = clampSkills(s);
  const after = { ...d.skills };
  const ovrAfter = Math.round(overall(after));
  d.peakOvr = Math.max(d.peakOvr, ovrAfter);
  return { before, after, ovrBefore: Math.round(overall(before)), ovrAfter };
}

/** Rough seat desirability of a driver, used by teams in the market. */
export function marketValue(d: Driver, year: number, seriesTier: number): number {
  const age = ageOf(d, year);
  const base = overall(d.skills);
  const youth = seriesTier >= 2 && age <= 23 ? Math.min(d.growth, 10) * 0.55 : Math.min(d.growth, 6) * 0.25;
  const last = d.log[d.log.length - 1];
  let form = 0;
  if (last && last.year >= year - 1) {
    const field = 20;
    const posNorm = 1 - (Math.min(last.pos, field) - 1) / (field - 1);
    form = posNorm * 7 + (last.wins > 0 ? 2 : 0);
  }
  const agePenalty = age > 34 ? (age - 34) * 1.4 : 0;
  return base + youth + form + d.reputation * 0.04 - agePenalty;
}

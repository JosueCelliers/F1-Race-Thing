/**
 * Static content definitions. Content is data-only so new nations, series,
 * teams, tracks, events and art parts can be added without touching game logic.
 */
import type { FamilyId, Gender, NationId, PersonalityId, SeriesId, Skills, TeamColors, TrackId } from '../sim/types';

// ---------------------------------------------------------------------------
// Nations
// ---------------------------------------------------------------------------

export type FlagSpec =
  | { kind: 'h'; colors: string[]; ratios?: number[] }
  | { kind: 'v'; colors: string[]; ratios?: number[] }
  | { kind: 'nordic'; bg: string; cross: string; border?: string }
  | { kind: 'custom'; id: string };

export interface NationDef {
  id: NationId;
  name: string;
  adjective: string;
  /** Short label used on wheels (e.g. "Kiwi", "Aussie"). */
  wheel: string;
  nameGroup: string;
  /** Weights over SKIN_TONES indices. */
  skin: number[];
  /** Weights over HAIR_COLORS indices. */
  hair: number[];
  /** Weights over EYE_COLORS indices. */
  eyes: number[];
  /** Relative frequency of AI drivers from this nation. */
  motorsport: number;
  flag: FlagSpec;
  /** Colours used for helmets / home crowd. */
  colors: [string, string, string];
}

export interface NameGroup {
  id: string;
  male: string[];
  female: string[];
  last: string[];
  /** Optional per-gender surname transform (e.g. Polish -ski/-ska). */
  femaleSurnameRule?: 'polish' | 'none';
}

// ---------------------------------------------------------------------------
// Series
// ---------------------------------------------------------------------------

export type CarClassId = 'formula' | 'formulaJunior' | 'gt' | 'prototype' | 'indy';

export interface CalendarEntry {
  track: TrackId;
  /** Custom event name; otherwise generated from series naming style. */
  name?: string;
  special?: string;
  hours?: number;
  /** Override computed lap count. */
  laps?: number;
  double?: boolean;
}

export interface SeriesDef {
  id: SeriesId;
  name: string;
  short: string;
  discipline: 'formula' | 'gt' | 'endurance' | 'american';
  carClass: CarClassId;
  /** Formula ladder tier: 1 = top. Other disciplines use a comparable value. */
  tier: number;
  prestige: number;
  carsPerTeam: number;
  /** How much the car matters vs the driver (0..1). */
  carImportance: number;
  /** Spread of team performance around the mean when generating teams. */
  perfSpread: number;
  points: number[];
  poleBonus?: number;
  fastestLapBonus?: number;
  minAge: number;
  /** AI drivers older than this are no longer considered (junior series). */
  maxAge?: number;
  /** Typical overall-rating band of the field. */
  ovrBand: [number, number];
  /** Pace relative to Formula Prime (1 = same lap time, 1.1 = 10% slower). */
  paceFactor: number;
  /** Target sprint race duration in minutes (ignored for endurance rounds). */
  raceMinutes: number;
  eventStyle: 'grandPrix' | 'round' | 'endurance' | 'american';
  calendar: CalendarEntry[];
  /** Tracks that can rotate into the calendar in some seasons. */
  rotation?: TrackId[];
  color: string;
  accent: string;
  description: string;
  salary: [number, number];
  /** Cost in $k for a pay-driver seat at the weakest teams. */
  paySeat: number;
  path: 'formula' | 'sportscar' | 'american';
  /** Series drivers typically move up to from here. */
  promotesTo: SeriesId[];
  crewSize?: number;
}

export interface SpecialEventDef {
  id: string;
  name: string;
  series: SeriesId;
  short: string;
  description: string;
  /** Legacy weight when won. */
  legacy: number;
  emoji: string;
}

// ---------------------------------------------------------------------------
// Teams
// ---------------------------------------------------------------------------

export interface TeamDef {
  id: string;
  series: SeriesId;
  name: string;
  short: string;
  nation: NationId;
  colors: TeamColors;
  livery: string;
  /** Initial ratings 0-100. */
  perf: number;
  reliability: number;
  prestige: number;
  budget: number;
  principal: string;
}

// ---------------------------------------------------------------------------
// Tracks & environments
// ---------------------------------------------------------------------------

export interface TrackDef {
  id: TrackId;
  name: string;
  nation: NationId;
  city: string;
  kind: 'permanent' | 'street' | 'oval' | 'road';
  env: string;
  night?: boolean;
  lengthKm: number;
  /** Reference Formula Prime lap time in seconds. */
  lapTime: number;
  /** 0 (processional) .. 1 (easy to pass). */
  overtaking: number;
  /** Chance of rain affecting a race. */
  rain: number;
  /** 0 (lots of run-off) .. 1 (walls everywhere). */
  danger: number;
  /** Control points of the closed racing line in a 1000x1000 box. */
  shape: [number, number][];
  /** Catmull-Rom tension, 0.5 default. Lower = tighter corners. */
  tension?: number;
  corners: string[];
}

export interface EnvironmentDef {
  id: string;
  name: string;
  sky: [string, string];
  skyNight: [string, string];
  far: 'hills' | 'city' | 'dunes' | 'mountains' | 'sea' | 'forest' | 'plains';
  farColor: string;
  ground: string;
  props: ('grandstand' | 'trees' | 'palms' | 'buildings' | 'yachts' | 'cacti' | 'billboards' | 'pines' | 'lights')[];
  kerb: [string, string];
  barrier: 'armco' | 'wall' | 'tyres' | 'fence';
}

// ---------------------------------------------------------------------------
// Personalities & families
// ---------------------------------------------------------------------------

export interface PersonalityDef {
  id: PersonalityId;
  label: string;
  emoji: string;
  description: string;
  /** Multiplier on yearly development. */
  devRate: number;
  /** Reputation gain multiplier. */
  repGain: number;
  /** Fan gain multiplier. */
  fanGain: number;
  /** Incident probability multiplier. */
  incidentMult: number;
  /** 0..1 resistance to pressure in big races. */
  pressure: number;
  /** Multiplier on number of contract offers. */
  offerMult: number;
  /** Shift of peak / retirement age in years. */
  ageShift: number;
  /** Bonus in wheel-to-wheel duels (perf points). */
  duel: number;
  /** Team relationship drift per season. */
  teamDrift: number;
}

export interface FamilyDef {
  id: FamilyId;
  label: string;
  emoji: string;
  description: string;
  /** Backing brought each season in $k. */
  budget: number;
  reputation: number;
  money: number;
  morale: number;
}

// ---------------------------------------------------------------------------
// Life events
// ---------------------------------------------------------------------------

export interface Effects {
  morale?: number;
  reputation?: number;
  fans?: number;
  teamRelation?: number;
  teammateRelation?: number;
  money?: number;
  skills?: Partial<Skills>;
  aggression?: number;
  /** Next race performance modifier in perf points (-5..+5). */
  form?: number;
  injuryRaces?: number;
  rivalHeat?: number;
  growth?: number;
}

export interface LifeEventOutcome {
  weight: number;
  text: string;
  effects: Effects;
}

export interface LifeEventOption {
  label: string;
  emoji?: string;
  /** Short hint shown under the option. */
  hint?: string;
  /** Deterministic effects + result text. */
  effects?: Effects;
  text?: string;
  /** Random outcomes (resolved with a mini wheel spin). */
  outcomes?: LifeEventOutcome[];
}

export interface LifeEventConditions {
  minRound?: number;
  /** Result of the previous race. */
  after?: ('win' | 'podium' | 'points' | 'noPoints' | 'dnf' | 'crash')[];
  personality?: PersonalityId[];
  notPersonality?: PersonalityId[];
  family?: FamilyId[];
  needsTeammate?: boolean;
  needsRival?: boolean;
  minFans?: number;
  minAge?: number;
  maxAge?: number;
  series?: SeriesId[];
  discipline?: SeriesDef['discipline'][];
  minTeamRelation?: number;
  maxTeamRelation?: number;
  maxTeammateRelation?: number;
  minReputation?: number;
  gender?: Gender;
  /** Only once per career. */
  once?: boolean;
}

export interface LifeEventDef {
  id: string;
  title: string;
  /**
   * Text with placeholders: {first} {last} {teammate} {rival} {team} {series}
   * {track} {nation} {age}
   */
  text: string;
  emoji: string;
  weight: number;
  when?: LifeEventConditions;
  options: LifeEventOption[];
}

// ---------------------------------------------------------------------------
// Portrait part library metadata (art lives in src/art)
// ---------------------------------------------------------------------------

export interface LookPartMeta {
  id: string;
  /** Which genders this part is generated for. */
  genders: Gender[];
  weight: number;
}

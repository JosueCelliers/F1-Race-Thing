/**
 * Core data model for Chequered Lives.
 *
 * Everything in here is plain JSON-serialisable data so the whole world can be
 * saved to disk and restored. Static content definitions (nations, series,
 * teams, tracks...) live in `src/content` and are referenced by id.
 */

export type ID = string;
export type NationId = string;
export type SeriesId = string;
export type TeamId = string;
export type TrackId = string;
export type Gender = 'm' | 'f';

// ---------------------------------------------------------------------------
// Drivers
// ---------------------------------------------------------------------------

export interface Skills {
  /** Raw one-lap and race speed. */
  pace: number;
  /** Wheel-to-wheel ability: overtaking and defending. */
  racecraft: number;
  /** Mistake avoidance and tyre management. */
  consistency: number;
  /** Ability in the rain. */
  wet: number;
}

export type SkillKey = keyof Skills;

export type PersonalityId =
  | 'golden'
  | 'iceCold'
  | 'bigEgo'
  | 'loyal'
  | 'mercenary'
  | 'grafter'
  | 'showman'
  | 'hothead'
  | 'lateBloomer'
  | 'partyAnimal';

export type FamilyId = 'dynasty' | 'wealthy' | 'comfortable' | 'working' | 'poor';

/** Portrait recipe. String ids reference parts in the portrait part library. */
export interface Looks {
  skin: number; // index into SKIN_TONES
  face: string;
  hair: string;
  hairColor: number; // index into HAIR_COLORS
  brows: string;
  eyes: string;
  eyeColor: number; // index into EYE_COLORS
  nose: string;
  mouth: string;
  facial: string; // facial hair ('none' for none)
  extra: string; // accessory / detail ('none' for none)
}

export interface HelmetDesign {
  pattern: string; // id in helmet pattern registry
  colors: [string, string, string];
}

export interface SeriesStats {
  starts: number;
  wins: number;
  podiums: number;
  poles: number;
  points: number;
  dnfs: number;
  crashes: number;
  fastestLaps: number;
  titles: number;
  bestFinish: number; // 0 = none yet
  seasons: number;
}

export interface Contract {
  series: SeriesId;
  team: TeamId;
  /** Last season (inclusive) covered by the contract. */
  until: number;
  role: 'lead' | 'equal' | 'second';
  /** Salary in $k per season (negative = pay driver bringing money). */
  salary: number;
}

export interface DriverSeasonLog {
  year: number;
  series: SeriesId;
  team: TeamId;
  pos: number;
  pts: number;
  wins: number;
  podiums: number;
  starts: number;
}

export interface Driver {
  id: ID;
  first: string;
  last: string;
  gender: Gender;
  nation: NationId;
  born: number;
  skills: Skills;
  /** Remaining development points the driver can still gain. */
  growth: number;
  aggression: number; // 0-100
  personality: PersonalityId;
  family?: FamilyId;
  looks: Looks;
  helmet: HelmetDesign;
  number: number;
  status: 'active' | 'free' | 'retired';
  contract?: Contract;
  stats: Record<SeriesId, SeriesStats>;
  /** Crown jewel / special event wins keyed by special event id. */
  specials: Record<string, number>;
  reputation: number; // 0-100
  fans: number; // thousands of fans
  morale: number; // 0-100
  yearsWithoutSeat: number;
  peakOvr: number;
  retiredYear?: number;
  /** Set when this driver was (or is) a player-controlled career. */
  careerId?: ID;
  /** Legacy link: parent driver id (may be a previous player driver). */
  parentId?: ID;
  /** Once a driver starts in a category they tend to follow its path. */
  path: 'formula' | 'sportscar' | 'american';
  log: DriverSeasonLog[];
}

// ---------------------------------------------------------------------------
// Teams
// ---------------------------------------------------------------------------

export interface TeamColors {
  primary: string;
  secondary: string;
  accent: string;
}

export interface TeamState {
  id: TeamId;
  series: SeriesId;
  name: string;
  short: string;
  nation: NationId;
  colors: TeamColors;
  livery: string; // livery pattern id
  perf: number; // 0-100 car performance
  reliability: number; // 0-100
  prestige: number; // 0-100
  budget: number; // 0-100
  pitCrew: number; // 0-100
  principal: { name: string; driverId?: ID };
  drivers: ID[];
  titles: number;
  driverTitles: number;
  history: { year: number; pos: number; pts: number }[];
  /** Named co-drivers for endurance crews (not simulated as world drivers). */
  coDrivers?: string[];
}

// ---------------------------------------------------------------------------
// Seasons & results
// ---------------------------------------------------------------------------

export interface RoundDef {
  track: TrackId;
  name: string;
  laps: number;
  /** Endurance races: duration in hours (drives the clock display). */
  hours?: number;
  special?: string; // special/crown-jewel event id
  double?: boolean;
}

export interface RoundResult {
  round: number;
  /** Classified order first, then retirements (latest retirement first). */
  order: ID[];
  dnf: ID[];
  pole: ID;
  fastest?: ID;
  wet: boolean;
  points: Record<ID, number>;
  /** Only stored for the player's series. */
  grid?: ID[];
}

export interface SeriesSeason {
  id: SeriesId;
  calendar: RoundDef[];
  round: number; // index of next round to run
  results: RoundResult[];
  points: Record<ID, number>;
  teamPoints: Record<TeamId, number>;
  /** Driver -> team for everyone who raced this season (for standings). */
  driverTeam: Record<ID, TeamId>;
  champion?: ID;
  teamChampion?: TeamId;
}

export interface SeasonState {
  year: number;
  series: Record<SeriesId, SeriesSeason>;
}

export interface ChampionRecord {
  year: number;
  series: SeriesId;
  driverId: ID;
  driverName: string;
  nation: NationId;
  teamId: TeamId;
  teamName: string;
  points: number;
  wins: number;
  teamChampionId?: TeamId;
  teamChampionName?: string;
  isPlayer?: boolean;
  careerId?: ID;
}

export interface SpecialWinRecord {
  year: number;
  special: string;
  driverId: ID;
  driverName: string;
  nation: NationId;
  teamName: string;
  isPlayer?: boolean;
}

// ---------------------------------------------------------------------------
// Player career
// ---------------------------------------------------------------------------

export interface CreationPick {
  wheel: string; // wheel id
  label: string; // human label of the result
  value: string | number;
  emoji?: string;
}

export interface CareerSeason {
  year: number;
  age: number;
  series: SeriesId;
  team: TeamId;
  teamName: string;
  colors: TeamColors;
  pos: number;
  points: number;
  races: number;
  wins: number;
  podiums: number;
  poles: number;
  dnfs: number;
  champion: boolean;
  teammateName?: string;
  beatTeammate?: boolean;
  ovr: number;
  oneOffs?: { special: string; name: string; pos: number }[];
}

export type MomentKind =
  | 'debut'
  | 'firstPoints'
  | 'firstPodium'
  | 'firstWin'
  | 'firstPole'
  | 'title'
  | 'crownJewel'
  | 'bigCrash'
  | 'injury'
  | 'transfer'
  | 'promotion'
  | 'categorySwitch'
  | 'record'
  | 'rivalry'
  | 'event'
  | 'milestone'
  | 'retire'
  | 'legacy'
  | 'dropped';

export interface CareerMoment {
  id: ID;
  year: number;
  age: number;
  round?: number;
  kind: MomentKind;
  title: string;
  text: string;
  importance: 1 | 2 | 3;
  highlightId?: ID;
}

export interface RivalStat {
  driverId: ID;
  name: string;
  battles: number;
  wonBattles: number;
  incidents: number;
  heat: number;
}

export interface Offer {
  id: ID;
  series: SeriesId;
  team: TeamId;
  years: number;
  role: Contract['role'];
  salary: number; // $k per season; negative means you must bring backing
  kind: 'renewal' | 'offer' | 'paySeat' | 'wildcard';
  note?: string;
}

export interface OneOffInvite {
  id: ID;
  series: SeriesId;
  team: TeamId;
  round: number; // round index in that series calendar
  special?: string;
  afterPlayerRound: number; // appears after this player round
  status: 'pending' | 'accepted' | 'declined' | 'done';
  result?: number;
}

export interface LifeEventInstance {
  eventId: string;
  title: string;
  text: string;
  options: { label: string; emoji?: string; hint?: string }[];
  vars: Record<string, string>;
}

export interface ActiveCareer {
  id: ID;
  driverId: ID;
  startYear: number;
  picks: CreationPick[];
  seasons: CareerSeason[];
  moments: CareerMoment[];
  highlights: HighlightRecord[];
  rivals: Record<ID, RivalStat>;
  teamRelation: number; // 0-100
  teammateRelation: number; // 0-100
  money: number; // $k personal wealth
  familyBudget: number; // $k per season of backing
  /** Next race performance modifier from events (-5..+5 perf points). */
  form: number;
  injury?: { racesOut: number; desc: string };
  offers?: Offer[];
  oneOffs: OneOffInvite[];
  pendingEvent?: LifeEventInstance;
  seenEvents: Record<string, number>;
  flags: Record<string, number>;
  lastResult?: RaceSummary;
  /** How many player races have been run in total. */
  raceCount: number;
  phase: 'season' | 'seasonEnd' | 'offers' | 'retired';
}

export interface RaceSummary {
  year: number;
  series: SeriesId;
  round: number;
  name: string;
  track: TrackId;
  pos: number; // 0 = DNF
  grid: number;
  points: number;
  dnfReason?: string;
  wet: boolean;
  fastestLap: boolean;
  pole: boolean;
  headline: string;
  special?: string;
}

// ---------------------------------------------------------------------------
// Highlights (replayable 2D cinematics)
// ---------------------------------------------------------------------------

export type HighlightKind =
  | 'start'
  | 'overtake'
  | 'dive'
  | 'failedPass'
  | 'defend'
  | 'collision'
  | 'crash'
  | 'spin'
  | 'pitStop'
  | 'finishWin'
  | 'photoFinish'
  | 'podium'
  | 'title'
  | 'engineFailure'
  | 'rainStart'
  | 'safetyCar';

export interface HighlightActor {
  name: string;
  short: string;
  number: number;
  colors: TeamColors;
  livery: string;
  helmet: HelmetDesign;
  isPlayer: boolean;
}

export interface HighlightSpec {
  kind: HighlightKind;
  seed: number;
  carClass: string;
  env: string;
  night: boolean;
  wet: boolean;
  actors: HighlightActor[];
  caption: string;
  sub?: string;
  /** e.g. corner name or lap info. */
  where?: string;
  position?: number;
}

export interface HighlightRecord {
  id: ID;
  year: number;
  round: number;
  trackName: string;
  spec: HighlightSpec;
}

// ---------------------------------------------------------------------------
// Archive
// ---------------------------------------------------------------------------

export type VerdictTier = 'legend' | 'great' | 'star' | 'pro' | 'journeyman' | 'cult' | 'disaster';

export interface Verdict {
  tier: VerdictTier;
  title: string;
  blurb: string;
}

export interface CareerTotals {
  starts: number;
  wins: number;
  podiums: number;
  poles: number;
  points: number;
  dnfs: number;
  crashes: number;
  titles: number;
  primeTitles: number;
  primeWins: number;
  teams: number;
  seriesRaced: number;
  seasons: number;
  earnings: number;
  specials: Record<string, number>;
}

export interface CareerRecord {
  id: ID;
  index: number; // 1-based career number in this universe
  driver: Driver;
  startYear: number;
  endYear: number;
  retireAge: number;
  picks: CreationPick[];
  seasons: CareerSeason[];
  moments: CareerMoment[];
  highlights: HighlightRecord[];
  totals: CareerTotals;
  verdict: Verdict;
  legacy: number;
  rivals: RivalStat[];
  endReason: string;
  peakOvr: number;
}

export interface CareerIndexEntry {
  id: ID;
  index: number;
  name: string;
  nation: NationId;
  startYear: number;
  endYear: number;
  tier: VerdictTier;
  title: string;
  legacy: number;
  totals: CareerTotals;
  looks: Looks;
  helmet: HelmetDesign;
  gender: Gender;
  lastSeries: SeriesId;
  lastTeamColors: TeamColors;
}

// ---------------------------------------------------------------------------
// World
// ---------------------------------------------------------------------------

export interface NewsItem {
  id: ID;
  year: number;
  text: string;
  series?: SeriesId;
  important?: boolean;
}

export interface World {
  version: number;
  seed: number;
  /** Season year. During 'offseason' this is the season that just finished. */
  year: number;
  phase: 'season' | 'offseason';
  nextId: number;
  teams: Record<TeamId, TeamState>;
  drivers: Record<ID, Driver>;
  season: SeasonState;
  history: ChampionRecord[];
  specialWinners: SpecialWinRecord[];
  careers: CareerIndexEntry[];
  active?: ActiveCareer;
  news: NewsItem[];
  /** Year of the next regulation reset per series. */
  regsReset: Record<SeriesId, number>;
  /** True once end-of-season development/retirements ran for `year`. */
  offseasonDone: boolean;
  createdAt: number;
}

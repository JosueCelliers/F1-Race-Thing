/**
 * The player's career lifecycle: starting a career, preparing and finishing
 * races, one-off invitations to other championships, season reviews, offers,
 * and retirement into the Archive.
 */
import { nation } from '../content/nations';
import { series as seriesDef, SERIES, SPECIAL_MAP } from '../content/series';
import { track as trackDef } from '../content/tracks';
import { family, personality } from '../content/traits';
import type { SeriesDef, TrackDef } from '../content/types';
import { buildPlayerDriver, picksToCreation, type Identity, type Picks } from './creation';
import { ageOf, driverCode, fullName, generateName, newId, overall, ovr, statsFor } from './drivers';
import { applyEffects, resultTags, rollLifeEvent, topRival, type ResultTag } from './events';
import { careerTotals, legacyScore, verdictFor } from './legacy';
import { computeOffers, formatMoney, processOffseason, pruneDrivers, retireDriver, runMarket, salaryFor, type OffseasonReport } from './market';
import { makeWeather, qualify, RaceEngine, type EngineEntry } from './race/engine';
import { MomentDirector, type MomentEffects, type MomentHighlight } from './race/moments';
import { clamp, hashString, mixSeed, Rng } from './rng';
import { advanceOtherSeries, applyRoundResult, assignPoints, finishSeason, standings, startSeason, teamsInSeries, type Standing } from './season';
import { headline } from './text';
import type {
  CareerIndexEntry,
  CareerMoment,
  CareerRecord,
  CareerSeason,
  ChampionRecord,
  Driver,
  HighlightActor,
  HighlightRecord,
  HighlightSpec,
  HighlightTone,
  MomentKind,
  Offer,
  OneOffInvite,
  RaceSummary,
  RoundDef,
  RoundResult,
  TeamState,
  World,
} from './types';
import { addNews } from './world';

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

export function player(world: World): Driver | undefined {
  return world.active ? world.drivers[world.active.driverId] : undefined;
}

export function playerTeam(world: World): TeamState | undefined {
  const d = player(world);
  return d?.contract ? world.teams[d.contract.team] : undefined;
}

export function playerSeries(world: World): SeriesDef | undefined {
  const d = player(world);
  return d?.contract ? seriesDef(d.contract.series) : undefined;
}

function addMoment(world: World, kind: MomentKind, title: string, text: string, importance: 1 | 2 | 3, extra: Partial<CareerMoment> = {}): CareerMoment {
  const a = world.active!;
  const d = world.drivers[a.driverId];
  const m: CareerMoment = {
    id: newId(world, 'm'),
    year: world.year,
    age: ageOf(d, world.year),
    kind,
    title,
    text,
    importance,
    ...extra,
  };
  a.moments.push(m);
  return m;
}

function saveHighlight(world: World, spec: HighlightSpec, round: number, trackName: string, importance: number): string {
  const a = world.active!;
  const rec: HighlightRecord = { id: newId(world, 'h'), year: world.year, round, trackName, spec, importance, tone: highlightTone(spec) };
  a.highlights.push(rec);
  if (a.highlights.length > 70) {
    const idx = a.highlights.reduce((best, h, i, arr) => ((h.importance ?? 0) < (arr[best].importance ?? 0) ? i : best), 0);
    a.highlights.splice(idx, 1);
  }
  return rec.id;
}

/** Was this a great moment for the player, or one they'd rather forget? */
export function highlightTone(spec: HighlightSpec): HighlightTone {
  const lead = spec.actors[0]?.isPlayer ?? false;
  const involved = spec.actors.some((x) => x.isPlayer);
  switch (spec.kind) {
    case 'title':
    case 'finishWin':
    case 'photoFinish':
    case 'podium':
      return involved ? 'good' : 'neutral';
    case 'overtake':
    case 'dive':
    case 'defend':
      return lead ? 'good' : involved ? 'bad' : 'neutral';
    case 'failedPass':
      return lead ? 'bad' : involved ? 'good' : 'neutral';
    case 'crash':
    case 'engineFailure':
    case 'spin':
    case 'collision':
      return involved ? 'bad' : 'neutral';
    default:
      return 'neutral';
  }
}

export function actorFromEntry(e: EngineEntry): HighlightActor {
  return {
    name: e.name,
    short: e.code,
    number: e.number,
    colors: e.colors,
    livery: e.livery,
    helmet: e.helmet,
    isPlayer: e.isPlayer,
  };
}

function champPositions(world: World, seriesId: string): Record<string, number> {
  const ss = world.season.series[seriesId];
  const out: Record<string, number> = {};
  standings(ss).forEach((s, i) => (out[s.driverId] = i + 1));
  return out;
}

function coDriverNames(world: World, team: TeamState): string[] {
  if (team.coDrivers && team.coDrivers.length >= 2) return team.coDrivers;
  const rng = new Rng(mixSeed(world.seed, 'codrivers', team.id, world.year));
  const names = [0, 1].map(() => {
    const n = rng.chance(0.6) ? team.nation : rng.pick(['GB', 'FR', 'DE', 'JP', 'US', 'IT', 'BE', 'DK']);
    const nm = generateName(rng, n, rng.chance(0.15) ? 'f' : 'm');
    return `${nm.first} ${nm.last}`;
  });
  team.coDrivers = names;
  return names;
}

// ---------------------------------------------------------------------------
// Starting a career
// ---------------------------------------------------------------------------

export function startCareer(world: World, picks: Picks, identity: Identity, seed: number): void {
  const rng = new Rng(seed);
  if (!world.offseasonDone) {
    if (world.phase === 'season') {
      advanceOtherSeries(world, 1);
      finishSeason(world);
    }
    processOffseason(world);
    world.offseasonDone = true;
  }
  const d = buildPlayerDriver(world, picks, identity, rng);
  world.drivers[d.id] = d;
  const careerId = newId(world, 'c');
  d.careerId = careerId;
  const fam = family(d.family);
  const index = world.careers.length + 1;
  world.active = {
    id: careerId,
    driverId: d.id,
    startYear: world.year + 1,
    picks: picksToCreation(picks),
    seasons: [],
    moments: [],
    highlights: [],
    rivals: {},
    teamRelation: 55,
    teammateRelation: 50,
    money: fam.money,
    familyBudget: fam.budget,
    form: 0,
    oneOffs: [],
    seenEvents: {},
    flags: { index },
    raceCount: 0,
    phase: 'season',
  };
  const teamId = String(picks.team?.value);
  const team = world.teams[teamId];
  const s = seriesDef(team.series);
  const seat = { team: teamId, years: s.tier >= 3 ? 1 : 2, role: 'equal' as const, salary: salaryFor(s, overall(d.skills), team) };
  runMarket(world, seat);
  startSeason(world);
  const a = world.active;
  addMoment(world, 'debut', `Signs for ${team.name}`, `${fullName(d)} begins the journey in ${s.name}, aged ${ageOf(d, world.year)}.`, 2);
  if (d.parentId) {
    const parent = world.drivers[d.parentId];
    const titles = Object.values(parent.stats).reduce((x, y) => x + y.titles, 0);
    const wins = Object.values(parent.stats).reduce((x, y) => x + y.wins, 0);
    const what = titles ? `${titles}× champion` : `${wins}-time race winner`;
    addMoment(world, 'legacy', 'Racing blood', `Child of ${fullName(parent)}, ${what}${parent.careerId ? ' — one of your own past drivers' : ''}.`, 3);
  }
  generateInvites(world);
  addNews(world, `${fullName(d)} (${nation(d.nation).adjective}) makes their debut with ${team.name} in ${s.name}.`, { series: s.id, important: true });
  pruneDrivers(world);
  void a;
}

// ---------------------------------------------------------------------------
// Invitations to crown-jewel races in other championships
// ---------------------------------------------------------------------------

export function generateInvites(world: World): void {
  const a = world.active;
  const d = player(world);
  if (!a || !d?.contract) return;
  a.oneOffs = a.oneOffs.filter((o) => o.status === 'done');
  const rng = new Rng(mixSeed(world.seed, 'invites', world.year, a.id));
  const my = seriesDef(d.contract.series);
  const age = ageOf(d, world.year);
  const o = overall(d.skills);
  const p = personality(d.personality);
  const options: { special: string; series: string; chance: number }[] = [];
  if (my.id !== 'endurance' && age >= 19 && (o >= 64 || d.reputation >= 45)) options.push({ special: 'france24', series: 'endurance', chance: 0.32 + (my.id === 'prime' ? 0.15 : 0) });
  if (my.id !== 'american' && age >= 19 && o >= 64) options.push({ special: 'heartland500', series: 'american', chance: 0.24 });
  if (my.id !== 'gt' && my.id !== 'endurance' && age >= 18 && o >= 58) options.push({ special: 'kurrajong1000', series: 'gt', chance: 0.14 });
  let n = 0;
  for (const opt of rng.shuffle(options)) {
    if (n >= (p.offerMult > 1.2 ? 2 : 1)) break;
    if (!rng.chance(opt.chance * (0.8 + p.offerMult * 0.2))) continue;
    const host = seriesDef(opt.series);
    const hs = world.season.series[host.id];
    const round = hs.calendar.findIndex((r) => r.special === opt.special);
    if (round < 0) continue;
    const teams = teamsInSeries(world, host.id).sort((x, y) => y.perf - x.perf).slice(0, 7);
    const team = rng.weighted(teams, (t) => t.perf);
    const mine = world.season.series[my.id];
    const frac = round / hs.calendar.length;
    const after = clamp(Math.round(frac * mine.calendar.length) - 1, 0, mine.calendar.length - 2);
    a.oneOffs.push({ id: newId(world, 'i'), series: host.id, team: team.id, round, special: opt.special, afterPlayerRound: after, status: 'pending' });
    n++;
  }
}

function holdRounds(world: World): Record<string, number[]> {
  const out: Record<string, number[]> = {};
  for (const o of world.active?.oneOffs ?? []) {
    if (o.status === 'pending' || o.status === 'accepted') (out[o.series] ??= []).push(o.round);
  }
  return out;
}

/** Invitation that should be answered now (after the player's current round). */
export function dueInvite(world: World): OneOffInvite | undefined {
  const a = world.active;
  const d = player(world);
  if (!a || !d?.contract) return undefined;
  const ss = world.season.series[d.contract.series];
  return a.oneOffs.find((o) => (o.status === 'pending' || o.status === 'accepted') && ss.round > o.afterPlayerRound);
}

export function answerInvite(world: World, id: string, accept: boolean): void {
  const a = world.active;
  const inv = a?.oneOffs.find((o) => o.id === id);
  if (!a || !inv) return;
  inv.status = accept ? 'accepted' : 'declined';
  if (!accept) {
    const d = player(world)!;
    const ss = world.season.series[d.contract!.series];
    advanceOtherSeries(world, ss.round / ss.calendar.length, d.contract!.series, holdRounds(world));
  }
}

// ---------------------------------------------------------------------------
// Race preparation
// ---------------------------------------------------------------------------

export interface RaceMeta {
  seriesId: string;
  roundIndex: number;
  round: RoundDef;
  track: TrackDef;
  oneOff?: OneOffInvite;
  bigRace: boolean;
  reasons: string[];
  rainChance: number;
  totalRounds: number;
}

export function nextRaceMeta(world: World): RaceMeta | null {
  const a = world.active;
  const d = player(world);
  if (!a || !d || a.phase !== 'season' || !d.contract) return null;
  const inv = dueInvite(world);
  if (inv && inv.status === 'accepted') {
    const hs = world.season.series[inv.series];
    const round = hs.calendar[inv.round];
    return {
      seriesId: inv.series,
      roundIndex: inv.round,
      round,
      track: trackDef(round.track),
      oneOff: inv,
      bigRace: true,
      reasons: ['Crown jewel', 'One-off entry'],
      rainChance: trackDef(round.track).rain,
      totalRounds: hs.calendar.length,
    };
  }
  const sid = d.contract.series;
  const ss = world.season.series[sid];
  if (ss.round >= ss.calendar.length) return null;
  const round = ss.calendar[ss.round];
  const t = trackDef(round.track);
  const reasons: string[] = [];
  if (round.special) reasons.push('Crown jewel');
  if (t.nation === d.nation) reasons.push('Home race');
  if ((d.stats[sid]?.starts ?? 0) === 0) reasons.push('Debut');
  const table = standings(ss);
  const remaining = ss.calendar.length - ss.round;
  const s = seriesDef(sid);
  const maxPts = (s.points[0] + (s.fastestLapBonus ?? 0) + (s.poleBonus ?? 0)) * 1.2;
  const myPts = ss.points[d.id] ?? 0;
  const leader = table[0];
  if (ss.round > 0 && remaining <= 3 && leader && leader.points - myPts <= remaining * maxPts && myPts > 0) {
    reasons.push(leader.driverId === d.id ? 'Title fight — you lead' : 'Title fight');
  }
  if (ss.round === ss.calendar.length - 1) reasons.push('Season finale');
  const rival = topRival(a, world);
  if (rival && rival.contract?.series === sid) reasons.push(`Rival: ${rival.last}`);
  return {
    seriesId: sid,
    roundIndex: ss.round,
    round,
    track: t,
    bigRace: reasons.some((r) => r.startsWith('Title') || r === 'Crown jewel'),
    reasons,
    rainChance: t.rain,
    totalRounds: ss.calendar.length,
  };
}

function buildEntries(world: World, meta: RaceMeta): EngineEntry[] {
  const a = world.active!;
  const me = world.drivers[a.driverId];
  const s = seriesDef(meta.seriesId);
  const champ = champPositions(world, meta.seriesId);
  const teams = teamsInSeries(world, meta.seriesId).sort((x, y) => y.perf - x.perf);
  const used = new Set<number>();
  const entries: EngineEntry[] = [];
  const myTeam = meta.oneOff ? meta.oneOff.team : me.contract?.team;
  const addEntry = (d: Driver, team: TeamState, carMod = 0) => {
    const isPlayer = d.id === me.id;
    let num = d.number;
    if (isPlayer) used.add(num);
    while (used.has(num) && !isPlayer) num = (num % 99) + 1;
    used.add(num);
    const rngForm = (hashString(`${d.id}${world.year}${meta.roundIndex}`) % 100) / 100;
    const endurance = s.discipline === 'endurance';
    entries.push({
      driverId: d.id,
      teamId: team.id,
      name: fullName(d),
      code: driverCode(d),
      number: num,
      colors: team.colors,
      livery: team.livery,
      helmet: d.helmet,
      isPlayer,
      isTeammate: !isPlayer && team.id === myTeam,
      car: team.perf + carMod,
      reliability: team.reliability,
      pitCrew: team.pitCrew,
      skills: d.skills,
      aggression: d.aggression,
      personality: d.personality,
      form: isPlayer ? a.form + (d.morale - 60) * 0.035 : (rngForm - 0.5) * 2 + (d.morale - 60) * 0.01,
      crewPerf: endurance ? clamp(56 + (team.perf - 60) * 0.5 + (hashString(team.id) % 7) - 3, 45, 85) : undefined,
      crew: endurance ? coDriverNames(world, team) : undefined,
      champPos: champ[d.id],
    });
  };
  // Player first so their number is reserved.
  if (!(a.injury && a.injury.racesOut > 0)) {
    const t = world.teams[myTeam!];
    if (t) addEntry(me, t, meta.oneOff ? -1.5 : 0);
  }
  for (const team of teams) {
    for (const id of team.drivers) {
      if (id === me.id) continue;
      const d = world.drivers[id];
      if (d) addEntry(d, team);
    }
  }
  // Injured player: bring in a reserve driver.
  if (a.injury && a.injury.racesOut > 0 && !meta.oneOff && me.contract) {
    const team = world.teams[me.contract.team];
    const reserve = Object.values(world.drivers)
      .filter((x) => x.status === 'free' && !x.careerId)
      .sort((x, y) => overall(y.skills) - overall(x.skills))[0];
    if (reserve) addEntry(reserve, team, 0);
  }
  return entries;
}

export interface PreparedRace {
  engine: RaceEngine;
  director: MomentDirector;
  meta: RaceMeta;
  qualiMistake: boolean;
  seed: number;
}

export function prepareRace(world: World, meta: RaceMeta, qualiChoice?: 'push' | 'banker'): PreparedRace {
  const a = world.active!;
  const s = seriesDef(meta.seriesId);
  const seed = mixSeed(world.seed, 'prace', world.year, meta.seriesId, meta.roundIndex, a.raceCount);
  const rng = new Rng(seed);
  const entries = buildEntries(world, meta);
  const steps = stepsFor(meta.round);
  const weather = makeWeather(meta.track, steps, rng.fork('weather'));
  const q = qualify(entries, s, weather.initial, rng.fork('quali'), qualiChoice);
  const engine = new RaceEngine({
    seed,
    series: s,
    round: meta.round,
    roundIndex: meta.roundIndex,
    track: meta.track,
    entries,
    grid: q.grid,
    weather,
    bigRace: meta.bigRace,
  });
  const director = new MomentDirector(engine, seed);
  return { engine, director, meta, qualiMistake: q.playerMistake, seed };
}

export function stepsFor(round: RoundDef): number {
  const maxSteps = round.hours ? Math.min(60, Math.max(20, round.hours * 3)) : 60;
  return Math.min(round.laps, maxSteps);
}

/** Forecast shown before the race (uses the same seed as the real weather). */
export function forecast(world: World, meta: RaceMeta): { wetStart: boolean; rainLater: boolean } {
  const a = world.active!;
  const seed = mixSeed(world.seed, 'prace', world.year, meta.seriesId, meta.roundIndex, a.raceCount);
  const w = makeWeather(meta.track, stepsFor(meta.round), new Rng(seed).fork('weather'));
  return { wetStart: w.initial >= 0.3, rainLater: w.changes.some((c) => c.target >= 0.3) };
}

// ---------------------------------------------------------------------------
// Race completion
// ---------------------------------------------------------------------------

export interface RaceExtras {
  highlights: MomentHighlight[];
  effects: MomentEffects[];
  decisions: number;
}

export interface RaceOutcome {
  summary: RaceSummary;
  newMoments: CareerMoment[];
  highlightIds: string[];
  clinched?: boolean;
  injury?: { racesOut: number; desc: string };
  standingsPos: number;
}

export function specFromMoment(world: World, prep: PreparedRace, h: MomentHighlight): HighlightSpec {
  const e = prep.engine;
  const step = Math.min(e.steps, h.step ?? e.step);
  const s = seriesDef(prep.meta.seriesId);
  return {
    kind: h.kind,
    seed: mixSeed(prep.seed, h.kind, h.caption),
    carClass: s.carClass,
    env: prep.meta.track.env,
    night: !!prep.meta.track.night || (!!prep.meta.round.hours && h.kind !== 'start' && h.kind !== 'finishWin'),
    wet: e.wet >= 0.3,
    actors: h.actors.map((i) => actorFromEntry(e.entries[i])),
    caption: h.caption,
    sub: h.sub,
    where:
      h.kind === 'start'
        ? 'The grid'
        : h.kind === 'finishWin' || h.kind === 'photoFinish'
          ? 'Finish line'
          : h.kind === 'podium' || h.kind === 'title' || h.kind === 'pitStop'
            ? undefined
            : prep.meta.track.corners[Math.abs(hashString(h.caption)) % Math.max(1, prep.meta.track.corners.length)],
    series: prep.meta.seriesId,
    event: prep.meta.round.name,
    year: world.year,
    lap: prep.meta.round.hours ? `Hour ${Math.max(1, Math.ceil((prep.meta.round.hours * step) / e.steps))}` : `Lap ${Math.max(1, e.displayLap(step))}`,
  };
}

const HIGHLIGHT_IMPORTANCE: Record<string, number> = {
  title: 5,
  finishWin: 4,
  photoFinish: 4,
  podium: 3,
  crash: 3,
  collision: 2,
  dive: 2,
  overtake: 2,
  defend: 1.5,
  failedPass: 1,
  start: 0.5,
  pitStop: 0.6,
  rainStart: 1,
  safetyCar: 0.5,
  spin: 1.5,
  engineFailure: 2,
};

export function finishRace(world: World, prep: PreparedRace, extras: RaceExtras): RaceOutcome {
  const a = world.active!;
  const me = world.drivers[a.driverId];
  const { engine, meta } = prep;
  const s = seriesDef(meta.seriesId);
  const cls = engine.classification();
  const ids = engine.entries.map((e) => e.driverId);
  const result: RoundResult & { crashes?: string[] } = {
    round: meta.roundIndex,
    order: cls.order.map((i) => ids[i]),
    dnf: cls.dnf.map((i) => ids[i]),
    pole: ids[engine.cfg.grid[0]],
    fastest: cls.fastest >= 0 ? ids[cls.fastest] : undefined,
    wet: engine.snapshots.some((x) => x.wet >= 0.3),
    points: {},
    grid: engine.cfg.grid.map((i) => ids[i]),
  };
  result.crashes = cls.dnf.filter((i) => engine.cars[i].outReason !== 'mech').map((i) => ids[i]);
  const ssRace = world.season.series[meta.seriesId];
  for (const e of engine.entries) if (!ssRace.driverTeam[e.driverId]) ssRace.driverTeam[e.driverId] = e.teamId;
  assignPoints(result, s, meta.round);
  applyRoundResult(world, meta.seriesId, result);

  const pIdx = engine.playerIndex;
  const racing = pIdx >= 0;
  const pos = racing ? (result.dnf.includes(me.id) ? 0 : result.order.indexOf(me.id) + 1) : -1;
  const grid = racing ? engine.cfg.grid.indexOf(pIdx) + 1 : 0;
  const pts = result.points[me.id] ?? 0;
  const dnfReason = racing && pos === 0 ? engine.cars[pIdx].outReason : undefined;
  const newMoments: CareerMoment[] = [];
  const highlightIds: string[] = [];
  a.raceCount += 1;
  const rng = new Rng(mixSeed(prep.seed, 'post'));

  if (meta.oneOff) {
    meta.oneOff.status = 'done';
    meta.oneOff.result = pos;
  }

  // Apply decision effects
  for (const eff of extras.effects) {
    applyEffects(world, {
      teamRelation: eff.teamRelation,
      teammateRelation: eff.teammateRelation,
      fans: eff.fans,
      reputation: eff.reputation,
      morale: eff.morale,
    });
  }

  const summary: RaceSummary = {
    year: world.year,
    series: meta.seriesId,
    round: meta.roundIndex,
    name: meta.round.name,
    track: meta.track.id,
    pos: Math.max(0, pos),
    grid,
    points: pts,
    dnfReason,
    wet: result.wet,
    fastestLap: result.fastest === me.id,
    pole: result.pole === me.id,
    headline: '',
    special: meta.round.special,
  };
  summary.headline = racing ? headline(summary, me.last, (arr) => rng.pick(arr)) : `${me.last.toUpperCase()} WATCHES FROM THE SIDELINES`;

  if (racing) {
    // Morale, fans, reputation
    const prestige = s.prestige / 100;
    const p = personality(me.personality);
    if (pos === 1) me.morale = clamp(me.morale + 12, 0, 100);
    else if (pos > 0 && pos <= 3) me.morale = clamp(me.morale + 6, 0, 100);
    else if (pts > 0) me.morale = clamp(me.morale + 2, 0, 100);
    else if (pos === 0) me.morale = clamp(me.morale - 7, 0, 100);
    else me.morale = clamp(me.morale - 3, 0, 100);
    me.morale = clamp(me.morale + (60 - me.morale) * 0.08, 0, 100);
    const fanGain = (pos === 1 ? 40 : pos > 0 && pos <= 3 ? 14 : pts > 0 ? 3 : 0) * prestige * prestige * p.fanGain * (meta.round.special ? 3 : 1);
    me.fans = Math.round(me.fans + fanGain);
    if (pos === 1) me.reputation = clamp(me.reputation + 2.5 * prestige * p.repGain, 0, 100);
    a.form = 0;

    // Rivals
    for (const r of Object.values(a.rivals)) r.heat *= 0.93;
    for (const b of engine.battles) {
      const e = engine.entries[b.rival];
      if (!e || e.isPlayer) continue;
      const r = (a.rivals[e.driverId] ??= { driverId: e.driverId, name: e.name, battles: 0, wonBattles: 0, incidents: 0, heat: 0 });
      r.battles++;
      if (b.won) r.wonBattles++;
      if (b.kind === 'collision') {
        r.incidents++;
        r.heat += 18;
      } else r.heat += 2.5;
    }
    // Close finishes build rivalries too
    const myOrder = result.order.indexOf(me.id);
    for (const off of [-1, 1]) {
      const other = result.order[myOrder + off];
      if (!other || result.dnf.includes(other) || pos === 0) continue;
      const od = world.drivers[other];
      const r = (a.rivals[other] ??= { driverId: other, name: fullName(od), battles: 0, wonBattles: 0, incidents: 0, heat: 0 });
      r.heat += pos <= 5 ? 2.5 : 1;
    }
    for (const r of Object.values(a.rivals)) r.heat = clamp(r.heat, 0, 100);
    // At most one new named rivalry a season: the hottest feud that has boiled over.
    const hottest = Object.values(a.rivals)
      .filter((r) => r.heat >= 40 && !a.flags[`rival_${r.driverId}`] && world.drivers[r.driverId])
      .sort((x, y) => y.heat - x.heat)[0];
    if (hottest && !a.flags[`rivalYear_${world.year}`]) {
      a.flags[`rival_${hottest.driverId}`] = 1;
      a.flags[`rivalYear_${world.year}`] = 1;
      const text = hottest.incidents ? `${hottest.incidents} clash${hottest.incidents > 1 ? 'es' : ''} with ${hottest.name} and counting — this is personal now.` : `${hottest.name} and ${fullName(me)} keep ending up side by side — this is getting personal.`;
      newMoments.push(addMoment(world, 'rivalry', 'A rivalry is born', text, 2));
    }

    // Milestones & firsts
    const st = statsFor(me, meta.seriesId);
    const totalStarts = Object.values(me.stats).reduce((x, y) => x + y.starts, 0);
    const totalWins = Object.values(me.stats).reduce((x, y) => x + y.wins, 0);
    if (st.starts === 1 && !meta.oneOff) newMoments.push(addMoment(world, 'debut', `${s.name} debut`, `First race in ${s.name} at ${meta.round.name}: ${pos ? `P${pos}` : 'DNF'}.`, s.tier <= 2 ? 2 : 1, { round: meta.roundIndex }));
    if (pts > 0 && !a.flags.firstPoints) {
      a.flags.firstPoints = 1;
      newMoments.push(addMoment(world, 'firstPoints', 'First points', `P${pos} at ${meta.round.name}.`, 1, { round: meta.roundIndex }));
    }
    if (summary.pole && !a.flags[`pole_${meta.seriesId}`]) {
      a.flags[`pole_${meta.seriesId}`] = 1;
      newMoments.push(addMoment(world, 'firstPole', `First ${s.short} pole`, `Pole position at ${meta.round.name}.`, 1, { round: meta.roundIndex }));
    }
    if (pos > 0 && pos <= 3 && !a.flags.firstPodium) {
      a.flags.firstPodium = 1;
      newMoments.push(addMoment(world, 'firstPodium', 'First podium!', `P${pos} at ${meta.round.name} in ${s.name}.`, 2, { round: meta.roundIndex }));
    }
    if (pos === 1) {
      if (!a.flags.firstWin) {
        a.flags.firstWin = 1;
        newMoments.push(addMoment(world, 'firstWin', 'First victory!', `${fullName(me)} wins ${meta.round.name}${grid > 1 ? ` from P${grid}` : ''}.`, 3, { round: meta.roundIndex }));
      } else if (st.wins === 1) {
        newMoments.push(addMoment(world, 'firstWin', `First ${s.short} win`, `Victory at ${meta.round.name}.`, s.tier <= 2 ? 3 : 2, { round: meta.roundIndex }));
      }
      if (meta.round.special) {
        const sp = SPECIAL_MAP[meta.round.special];
        newMoments.push(addMoment(world, 'crownJewel', `${sp.emoji} ${sp.name} winner`, `${fullName(me)} conquers the ${sp.name}!`, 3, { round: meta.roundIndex }));
        addNews(world, `${fullName(me)} wins the ${sp.name}!`, { series: meta.seriesId, important: true });
      }
      if ([10, 25, 50, 75, 100].includes(totalWins)) newMoments.push(addMoment(world, 'milestone', `${totalWins} career wins`, `Win number ${totalWins} arrives at ${meta.round.name}.`, 2));
    }
    if ([50, 100, 150, 200, 250, 300].includes(totalStarts)) newMoments.push(addMoment(world, 'milestone', `${totalStarts} starts`, `Race number ${totalStarts} of the career.`, 1));

    // Crash consequences
    let injury: RaceOutcome['injury'];
    if (pos === 0 && (dnfReason === 'crash' || dnfReason === 'collision')) {
      const danger = meta.track.danger;
      if (rng.chance(0.07 + danger * 0.07)) {
        const racesOut = rng.weighted([1, 2, 3, 5], (n) => (n === 1 ? 4 : n === 2 ? 3 : n === 3 ? 1.5 : 0.6));
        const desc = racesOut >= 5 ? 'Broken leg' : racesOut >= 3 ? 'Fractured wrist' : racesOut === 2 ? 'Cracked ribs' : 'Concussion';
        injury = { racesOut, desc };
        a.injury = injury;
        newMoments.push(addMoment(world, 'injury', `Injured: ${desc}`, `A heavy crash at ${meta.round.name}. Out for ${racesOut} race${racesOut > 1 ? 's' : ''}.`, 3, { round: meta.roundIndex }));
      } else if (meta.round.special || s.tier <= 2) {
        newMoments.push(addMoment(world, 'bigCrash', 'Big crash', `${fullName(me)} is out at ${meta.round.name}.`, 1, { round: meta.roundIndex }));
      }
    }

    // Highlights from decisions + automatic finish highlights
    const hl: MomentHighlight[] = [...extras.highlights];
    const pEntry = engine.entries[pIdx];
    if (pos === 1) {
      const second = engine.entries[cls.order[1]];
      const close = second && engine.cars[cls.order[1]].total - engine.cars[pIdx].total < 0.4;
      hl.push({ kind: close ? 'photoFinish' : 'finishWin', actors: close ? [pIdx, cls.order[1]] : [pIdx], caption: close ? 'PHOTO FINISH!' : `${me.last.toUpperCase()} WINS!`, sub: meta.round.name });
    } else if (pos > 0 && pos <= 3) {
      hl.push({ kind: 'podium', actors: [cls.order[0], cls.order[1], cls.order[2]].filter((x) => x !== undefined), caption: `P${pos} — PODIUM!`, sub: meta.round.name });
    }
    if (pos === 0 && dnfReason === 'mech') hl.push({ kind: 'engineFailure', actors: [pIdx], caption: 'IT\'S OVER', sub: `${me.last} retires with a failure` });
    if (pos === 0 && (dnfReason === 'crash' || dnfReason === 'collision') && !hl.some((h) => h.kind === 'crash')) {
      hl.push({ kind: 'crash', actors: [pIdx], caption: 'CRASH!', sub: `${me.last} is out of the race` });
    }
    void pEntry;
    for (const h of hl) {
      // Being passed is only worth keeping at the big events.
      const base = h.kind === 'overtake' && h.actors[0] !== pIdx ? 0.8 : HIGHLIGHT_IMPORTANCE[h.kind] ?? 1;
      const imp = base * (s.prestige / 100 + 0.3) * (meta.round.special ? 1.5 : 1);
      if (imp < 0.6) continue;
      const spec = specFromMoment(world, prep, h);
      highlightIds.push(saveHighlight(world, spec, meta.roundIndex, meta.round.name, imp));
    }
    const best = newMoments.sort((x, y) => y.importance - x.importance)[0];
    if (best && highlightIds.length) best.highlightId = highlightIds[highlightIds.length - 1];

    if (injury) {
      addNews(world, `${fullName(me)} injured (${injury.desc}) — out for ${injury.racesOut} race${injury.racesOut > 1 ? 's' : ''}.`, { important: true });
    }
  } else if (a.injury && a.injury.racesOut > 0) {
    a.injury.racesOut -= 1;
    if (a.injury.racesOut <= 0) a.injury = undefined;
  }

  a.lastResult = summary;

  // Progress the rest of the world.
  let clinched = false;
  if (me.contract) {
    const mySeries = me.contract.series;
    const ss = world.season.series[mySeries];
    advanceOtherSeries(world, ss.round / ss.calendar.length, mySeries, holdRounds(world));
    clinched = checkClinch(world, prep, highlightIds, newMoments);
    if (ss.round >= ss.calendar.length && !dueInvite(world)) a.phase = 'seasonEnd';
  }

  // Life event for the next weekend.
  if (a.phase === 'season') {
    const tags: ResultTag[] = racing ? resultTags(pos, pts, dnfReason) : [];
    a.pendingEvent = rollLifeEvent(world, rng.fork('event'), tags);
  }
  const standingsPos = me.contract ? standings(world.season.series[me.contract.series]).findIndex((x) => x.driverId === me.id) + 1 : 0;
  return { summary, newMoments, highlightIds, clinched, injury: a.injury, standingsPos };
}

function checkClinch(world: World, prep: PreparedRace, highlightIds: string[], newMoments: CareerMoment[]): boolean {
  const a = world.active!;
  const me = world.drivers[a.driverId];
  const sid = me.contract!.series;
  if (prep.meta.oneOff) return false;
  const ss = world.season.series[sid];
  const s = seriesDef(sid);
  if (a.flags[`clinched_${world.year}`]) return false;
  const table = standings(ss);
  if (table[0]?.driverId !== me.id) return false;
  const remaining = ss.calendar.slice(ss.round);
  const maxLeft = remaining.reduce((acc, r) => acc + (s.points[0] + (s.fastestLapBonus ?? 0) + (s.poleBonus ?? 0)) * (r.double ? 2 : 1), 0);
  const gap = table[0].points - (table[1]?.points ?? 0);
  if (gap <= maxLeft) return false;
  a.flags[`clinched_${world.year}`] = 1;
  const left = remaining.length;
  const pEntry = prep.engine.entries[prep.engine.playerIndex];
  const spec = specFromMoment(world, prep, {
    kind: 'title',
    actors: pEntry ? [prep.engine.playerIndex] : [],
    caption: `${me.last.toUpperCase()} IS CHAMPION!`,
    sub: `${s.name} ${world.year}${left ? ` · with ${left} race${left > 1 ? 's' : ''} to spare` : ''}`,
  });
  const hid = saveHighlight(world, spec, prep.meta.roundIndex, prep.meta.round.name, 6);
  highlightIds.push(hid);
  newMoments.push(
    addMoment(world, 'title', `${s.name} Champion!`, `${fullName(me)} is the ${world.year} ${s.name} champion${left ? ` with ${left} race${left > 1 ? 's' : ''} to spare` : ''}.`, 3, {
      highlightId: hid,
    }),
  );
  return true;
}

/** Player has no seat this season: simulate the year without them. */
export function simulateReserveSeason(world: World): void {
  const a = world.active;
  if (!a) return;
  advanceOtherSeries(world, 1);
  a.phase = 'seasonEnd';
}

// ---------------------------------------------------------------------------
// Season end
// ---------------------------------------------------------------------------

export interface SeasonReview {
  season?: CareerSeason;
  champions: ChampionRecord[];
  dev?: OffseasonReport['playerDev'];
  offers: Offer[];
  standings: Standing[];
  retireWheel?: { stay: number; retire: number; forced: boolean };
  age: number;
}

export function endSeason(world: World): SeasonReview {
  const a = world.active!;
  const me = world.drivers[a.driverId];
  // Unanswered invitations lapse.
  for (const o of a.oneOffs) if (o.status === 'pending' || o.status === 'accepted') o.status = 'declined';
  advanceOtherSeries(world, 1);
  const mySeries = me.contract?.series;
  const fin = finishSeason(world);
  let season: CareerSeason | undefined;
  let table: Standing[] = [];
  if (mySeries) {
    const ss = world.season.series[mySeries];
    table = standings(ss);
    const idx = table.findIndex((x) => x.driverId === me.id);
    const row = table[idx];
    const team = world.teams[me.contract!.team];
    const mateId = team.drivers.find((x) => x !== me.id);
    const mate = mateId ? world.drivers[mateId] : undefined;
    const mateRow = mate ? table.find((x) => x.driverId === mate.id) : undefined;
    let poles = 0;
    let dnfs = 0;
    for (const r of ss.results) {
      if (r.pole === me.id) poles++;
      if (r.dnf.includes(me.id)) dnfs++;
    }
    season = {
      year: world.year,
      age: ageOf(me, world.year),
      series: mySeries,
      team: team.id,
      teamName: team.name,
      colors: team.colors,
      pos: idx >= 0 ? idx + 1 : table.length + 1,
      points: row?.points ?? 0,
      races: row?.races ?? 0,
      wins: row?.wins ?? 0,
      podiums: row?.podiums ?? 0,
      poles,
      dnfs,
      champion: idx === 0 && (row?.points ?? 0) > 0,
      teammateName: mate ? fullName(mate) : undefined,
      beatTeammate: mateRow ? (row?.points ?? 0) > mateRow.points || ((row?.points ?? 0) === mateRow.points && idx < table.indexOf(mateRow)) : undefined,
      ovr: ovr(me),
      oneOffs: a.oneOffs.filter((o) => o.status === 'done').map((o) => ({ special: o.special ?? '', name: SPECIAL_MAP[o.special ?? '']?.name ?? o.series, pos: o.result ?? 0 })),
    };
    a.seasons.push(season);
    if (season.champion && !a.flags[`clinched_${world.year}`]) {
      a.flags[`clinched_${world.year}`] = 1;
      addMoment(world, 'title', `${seriesDef(mySeries).name} Champion!`, `${fullName(me)} wins the ${world.year} ${seriesDef(mySeries).name} title at the final round.`, 3);
    }
    if (mate && season.beatTeammate === false && season.races >= 5) {
      a.teammateRelation = clamp(a.teammateRelation - 3, 0, 100);
    }
    const s = seriesDef(mySeries);
    addNews(world, `${me.last} finishes ${season.pos === 1 ? 'as CHAMPION' : `P${season.pos}`} in ${s.name} ${world.year}.`, { series: mySeries, important: season.pos <= 3 });
    // Salary
    if (me.contract && me.contract.salary > 0) {
      a.money += me.contract.salary;
      a.flags.earnings = (a.flags.earnings ?? 0) + me.contract.salary;
    }
    // Team relationship drift
    const p = personality(me.personality);
    a.teamRelation = clamp(a.teamRelation + p.teamDrift + (season.pos <= 3 ? 5 : season.pos > 12 ? -4 : 0), 0, 100);
  }
  for (const c of fin.champions) {
    if (c.driverId !== me.id) addNews(world, `${c.driverName} wins the ${world.year} ${seriesDef(c.series).name} title with ${c.teamName}.`, { series: c.series, important: c.series === 'prime' });
  }
  const report = processOffseason(world);
  world.offseasonDone = true;
  appointLegacyPrincipals(world);
  const age = ageOf(me, world.year + 1);
  const offers = computeOffers(world);
  a.offers = offers;
  a.phase = 'offers';
  let retireWheel: SeasonReview['retireWheel'];
  const p = personality(me.personality);
  const effAge = age - p.ageShift;
  if (age >= 45) retireWheel = { stay: 0, retire: 1, forced: true };
  else if (effAge >= 35) {
    const results = season ? (season.pos <= 3 ? -2 : season.pos > 10 ? 2 : 0) : 3;
    retireWheel = { stay: Math.max(1, 10 - (effAge - 35) * 1.4 - results), retire: Math.max(1, 2 + (effAge - 35) * 1.3 + results), forced: false };
  }
  return { season, champions: fin.champions, dev: report.playerDev, offers, standings: table, retireWheel, age };
}

/** Former player drivers with big careers may come back as team principals. */
function appointLegacyPrincipals(world: World): void {
  const rng = new Rng(mixSeed(world.seed, 'principals', world.year));
  const candidates = Object.values(world.drivers).filter(
    (d) => d.careerId && d.status === 'retired' && world.year - d.born >= 38 && world.year - d.born <= 70 && legacyScore(d) >= 110,
  );
  for (const d of candidates) {
    if (Object.values(world.teams).some((t) => t.principal.driverId === d.id)) continue;
    if (!rng.chance(0.22)) continue;
    const lastTeam = d.log[d.log.length - 1]?.team;
    const pool = Object.values(world.teams).filter((t) => !t.principal.driverId || !world.drivers[t.principal.driverId]?.careerId);
    const team = (lastTeam && pool.find((t) => t.id === lastTeam)) || rng.pick(pool);
    if (!team) continue;
    team.principal = { name: fullName(d), driverId: d.id };
    team.budget = clamp(team.budget + 4, 0, 100);
    addNews(world, `${fullName(d)} returns to the paddock as Team Principal of ${team.name}!`, { series: team.series, important: true });
  }
}

// ---------------------------------------------------------------------------
// Offers
// ---------------------------------------------------------------------------

/** When still under contract, staying put is always an option. */
export function stayOffer(world: World): Offer | undefined {
  const me = player(world);
  if (!me?.contract || me.contract.until < world.year + 1) return undefined;
  const s = seriesDef(me.contract.series);
  if (s.maxAge && world.year + 1 - me.born > s.maxAge) return undefined;
  return {
    id: 'stay',
    series: me.contract.series,
    team: me.contract.team,
    years: me.contract.until - world.year,
    role: me.contract.role,
    salary: me.contract.salary,
    kind: 'renewal',
    note: 'You are under contract',
  };
}

export function acceptOffer(world: World, offer: Offer | null): void {
  const a = world.active!;
  const me = world.drivers[a.driverId];
  const prevTeam = me.contract?.team ?? me.log[me.log.length - 1]?.team;
  const prevSeries = me.contract?.series ?? me.log[me.log.length - 1]?.series;
  if (offer) {
    const team = world.teams[offer.team];
    const s = seriesDef(offer.series);
    if (offer.salary < 0) {
      const cost = -offer.salary;
      const fromFamily = Math.min(a.familyBudget, cost);
      a.money = Math.max(0, a.money - (cost - fromFamily));
    }
    if (team.id !== prevTeam) {
      a.teamRelation = 55;
      a.teammateRelation = 50;
      const prevDef = prevSeries ? seriesDef(prevSeries) : undefined;
      let kind: MomentKind = 'transfer';
      let title = `Joins ${team.name}`;
      if (prevDef && prevDef.discipline !== s.discipline) {
        kind = 'categorySwitch';
        title = `New chapter: ${s.name}`;
      } else if (prevDef && s.tier < prevDef.tier) {
        kind = 'promotion';
        title = `Promoted to ${s.name}`;
      }
      addMoment(world, kind, title, `${fullName(me)} signs a ${offer.years}-year deal with ${team.name}${offer.salary < 0 ? ` (bringing $${formatMoney(-offer.salary)} of backing)` : ''}.`, s.tier <= 1.5 || kind !== 'transfer' ? 2 : 1);
      addNews(world, `${fullName(me)} joins ${team.name} (${s.name}) for ${world.year + 1}.`, { series: s.id });
    }
    runMarket(world, { team: offer.team, years: offer.years, role: offer.role, salary: offer.salary });
  } else {
    addMoment(world, 'dropped', 'No seat', `${fullName(me)} is without a race seat for ${world.year + 1}.`, 2);
    runMarket(world);
  }
  startSeason(world);
  a.phase = 'season';
  a.offers = undefined;
  a.lastResult = undefined;
  a.pendingEvent = undefined;
  generateInvites(world);
  pruneDrivers(world);
}

// ---------------------------------------------------------------------------
// Retirement
// ---------------------------------------------------------------------------

export function retireCareer(world: World, reason: string): CareerRecord {
  const a = world.active!;
  const me = world.drivers[a.driverId];
  const age = ageOf(me, world.year);
  addMoment(world, 'retire', 'Retirement', `${fullName(me)} retires aged ${age}. ${reason}`, 3);
  const teams = new Set<string>(a.seasons.map((s) => s.team));
  const earnings = a.flags.earnings ?? 0;
  const totals = careerTotals(me, a.seasons.length, earnings, teams.size);
  const legacy = legacyScore(me);
  const verdict = verdictFor(me, totals, legacy);
  retireDriver(world, me);
  const snapshot: Driver = JSON.parse(JSON.stringify(me));
  const index = (a.flags.index as number) || world.careers.length + 1;
  const record: CareerRecord = {
    id: a.id,
    index,
    driver: snapshot,
    startYear: a.startYear,
    endYear: world.year,
    retireAge: age,
    picks: a.picks,
    seasons: a.seasons,
    moments: a.moments,
    highlights: a.highlights,
    totals,
    verdict,
    legacy,
    rivals: Object.values(a.rivals)
      .sort((x, y) => y.heat - x.heat)
      .slice(0, 5),
    endReason: reason,
    peakOvr: me.peakOvr,
  };
  const last = a.seasons[a.seasons.length - 1];
  const entry: CareerIndexEntry = {
    id: a.id,
    index,
    name: fullName(me),
    nation: me.nation,
    startYear: a.startYear,
    endYear: world.year,
    tier: verdict.tier,
    title: verdict.title,
    legacy,
    totals,
    looks: me.looks,
    helmet: me.helmet,
    gender: me.gender,
    lastSeries: last?.series ?? 'cadet',
    lastTeamColors: last?.colors ?? { primary: '#444', secondary: '#888', accent: '#fff' },
  };
  world.careers.push(entry);
  addNews(world, `${fullName(me)} retires: ${verdict.title}. ${totals.wins} wins, ${totals.titles} titles.`, { important: true });
  world.active = undefined;
  return record;
}

export function seriesList(): SeriesDef[] {
  return SERIES;
}

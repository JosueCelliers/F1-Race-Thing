import { series as seriesDef, SERIES, SPECIAL_MAP } from '../content/series';
import { track as trackDef } from '../content/tracks';
import type { CalendarEntry, SeriesDef, TrackDef } from '../content/types';
import { fullName, statsFor } from './drivers';
import { clamp, mixSeed, Rng } from './rng';
import type { ChampionRecord, Driver, ID, RoundDef, RoundResult, SeriesSeason, TeamId, World } from './types';

// ---------------------------------------------------------------------------
// Naming & calendars
// ---------------------------------------------------------------------------

const PREFIXES = ["Circuit de l'", 'Circuit de la ', 'Circuit des ', 'Circuit du ', 'Circuit de ', 'Autodromo di ', 'Autódromo ', 'Autodromo ', 'Circuito '];
const SUFFIXES = [' International Circuit', ' Street Circuit', ' Night Circuit', ' Motor Speedway', ' Superspeedway', ' Road Course', ' Speedway', ' Raceway', ' Circuit', ' Park', ' Ring'];

export function trackShortName(t: TrackDef): string {
  let n = t.name;
  for (const p of PREFIXES) if (n.startsWith(p)) n = n.slice(p.length);
  for (const s of SUFFIXES) if (n.endsWith(s)) n = n.slice(0, -s.length);
  if (n.startsWith('Las ')) n = n.slice(4);
  if (n === 'Mile' || n.length < 3) return t.city;
  return n;
}

function ovalMiles(t: TrackDef): number {
  return Math.round((t.lengthKm / 1.609) * 10) / 10;
}

export function eventName(s: SeriesDef, e: CalendarEntry, t: TrackDef, laps: number): string {
  if (e.name) return e.name;
  const short = trackShortName(t);
  switch (s.eventStyle) {
    case 'grandPrix':
      return `${short} Grand Prix`;
    case 'endurance':
      return `${e.hours ?? 6} Hours of ${short}`;
    case 'american':
      if (t.kind === 'oval') {
        const miles = Math.round((ovalMiles(t) * laps) / 50) * 50;
        return `${short} ${Math.max(200, miles)}`;
      }
      return `Grand Prix of ${short}`;
    default:
      return short;
  }
}

export function computeLaps(s: SeriesDef, t: TrackDef, e: CalendarEntry): number {
  if (e.laps) return e.laps;
  const lap = t.lapTime * s.paceFactor;
  if (e.hours) return Math.round((e.hours * 3600) / (lap * 1.04));
  let minutes = s.raceMinutes;
  if (t.kind === 'oval') minutes *= 1.2;
  return Math.max(8, Math.round((minutes * 60) / lap));
}

export function buildCalendar(s: SeriesDef, year: number, seed: number): RoundDef[] {
  const rng = new Rng(mixSeed(seed, 'cal', s.id, year));
  const entries = s.calendar.map((e) => ({ ...e }));
  if (s.rotation && s.rotation.length) {
    const swaps = rng.int(0, Math.min(2, s.rotation.length));
    const pool = rng.shuffle([...s.rotation]);
    for (let k = 0; k < swaps; k++) {
      const candidates = entries.map((e, i) => ({ e, i })).filter((x) => !x.e.special && !x.e.hours && !x.e.name);
      if (!candidates.length) break;
      const victim = rng.pick(candidates);
      const incoming = pool[k];
      if (entries.some((x) => x.track === incoming)) continue;
      entries[victim.i] = { track: incoming };
    }
  }
  return entries.map((e) => {
    const t = trackDef(e.track);
    const laps = computeLaps(s, t, e);
    return {
      track: t.id,
      name: eventName(s, e, t, laps),
      laps,
      hours: e.hours,
      special: e.special,
      double: e.double,
    };
  });
}

// ---------------------------------------------------------------------------
// Season state
// ---------------------------------------------------------------------------

export function teamsInSeries(world: World, seriesId: string) {
  return Object.values(world.teams).filter((t) => t.series === seriesId);
}

export function startSeason(world: World): void {
  world.season = { year: world.year, series: {} };
  for (const s of SERIES) {
    const driverTeam: Record<ID, TeamId> = {};
    for (const t of teamsInSeries(world, s.id)) {
      for (const d of t.drivers) driverTeam[d] = t.id;
    }
    world.season.series[s.id] = {
      id: s.id,
      calendar: buildCalendar(s, world.year, world.seed),
      round: 0,
      results: [],
      points: {},
      teamPoints: {},
      driverTeam,
    };
  }
  world.phase = 'season';
  world.offseasonDone = false;
}

export interface Standing {
  driverId: ID;
  teamId: TeamId;
  points: number;
  wins: number;
  podiums: number;
  best: number;
  races: number;
}

export function standings(ss: SeriesSeason): Standing[] {
  const map: Record<ID, Standing> = {};
  for (const [id, team] of Object.entries(ss.driverTeam)) {
    map[id] = { driverId: id, teamId: team, points: ss.points[id] ?? 0, wins: 0, podiums: 0, best: 99, races: 0 };
  }
  for (const r of ss.results) {
    r.order.forEach((id, i) => {
      const st = map[id] ?? (map[id] = { driverId: id, teamId: ss.driverTeam[id], points: ss.points[id] ?? 0, wins: 0, podiums: 0, best: 99, races: 0 });
      st.races++;
      if (r.dnf.includes(id)) return;
      if (i === 0) st.wins++;
      if (i < 3) st.podiums++;
      st.best = Math.min(st.best, i + 1);
    });
  }
  return Object.values(map).sort((a, b) => b.points - a.points || b.wins - a.wins || b.podiums - a.podiums || a.best - b.best);
}

export function teamStandings(ss: SeriesSeason): { teamId: TeamId; points: number }[] {
  return Object.entries(ss.teamPoints)
    .map(([teamId, points]) => ({ teamId, points }))
    .sort((a, b) => b.points - a.points);
}

/** Entries (driver, team) currently racing in a series. */
export function seriesEntries(world: World, seriesId: string): { driverId: ID; teamId: TeamId }[] {
  const out: { driverId: ID; teamId: TeamId }[] = [];
  for (const t of teamsInSeries(world, seriesId)) {
    for (const d of t.drivers) {
      if (world.drivers[d]) out.push({ driverId: d, teamId: t.id });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Quick race model (used for all background races)
// ---------------------------------------------------------------------------

export function driverRacePerf(d: Driver, wet: number): number {
  const s = d.skills;
  const dry = s.pace * 0.62 + s.racecraft * 0.2 + s.consistency * 0.18;
  const w = wet * 0.65;
  return dry * (1 - w) + s.wet * w;
}

export function quickRace(world: World, seriesId: string, roundIdx: number, rng: Rng): RoundResult {
  const s = seriesDef(seriesId);
  const ss = world.season.series[seriesId];
  const round = ss.calendar[roundIdx];
  const t = trackDef(round.track);
  const wetRace = rng.chance(t.rain);
  const wet = wetRace ? rng.float(0.35, 1) : 0;
  const endurance = !!round.hours;
  const entries = seriesEntries(world, seriesId).filter((e) => !isInjured(world, e.driverId));
  const scored = entries.map((e) => {
    const d = world.drivers[e.driverId];
    const team = world.teams[e.teamId];
    const perfD = driverRacePerf(d, wet);
    const carImp = s.carImportance;
    const perf = carImp * team.perf + (1 - carImp) * perfD;
    const quali = carImp * team.perf + (1 - carImp) * (d.skills.pace * (1 - wet * 0.6) + d.skills.wet * wet * 0.6) + rng.normal(0, 2.2);
    const lengthMult = endurance ? 1.2 + (round.hours ?? 6) / 12 : round.laps > 100 ? 1.4 : 1;
    const pMech = ((100 - team.reliability) / 100) * 0.22 * lengthMult;
    const pCrash = 0.028 * (1.55 - d.skills.consistency / 100) * (0.6 + t.danger) * (0.7 + d.aggression / 120) * (1 + wet * 0.8) * (endurance ? 0.8 : 1);
    const dnfRoll = rng.next();
    const dnf = dnfRoll < pMech ? 'mech' : dnfRoll < pMech + pCrash ? 'crash' : undefined;
    return { e, d, perf, quali, dnf, score: 0 };
  });
  // Qualifying order influences the race on tracks where passing is hard.
  const qOrder = [...scored].sort((a, b) => b.quali - a.quali);
  qOrder.forEach((x, i) => {
    const gridNorm = 1 - i / Math.max(1, qOrder.length - 1);
    x.score = x.perf + rng.normal(0, 3.4) + gridNorm * (1 - t.overtaking) * 4.5;
  });
  const finishers = scored.filter((x) => !x.dnf).sort((a, b) => b.score - a.score);
  const dnfs = rng.shuffle(scored.filter((x) => x.dnf));
  const order = [...finishers.map((x) => x.e.driverId), ...dnfs.map((x) => x.e.driverId)];
  let fastest: ID | undefined;
  if (finishers.length) {
    const top = finishers.slice(0, Math.min(8, finishers.length));
    fastest = rng.weighted(top, (x) => Math.max(0.1, x.perf - 50)).e.driverId;
  }
  const result: RoundResult = {
    round: roundIdx,
    order,
    dnf: dnfs.map((x) => x.e.driverId),
    pole: qOrder[0]?.e.driverId ?? order[0],
    fastest,
    wet: wetRace,
    points: {},
  };
  const crashers = dnfs.filter((x) => x.dnf === 'crash').map((x) => x.e.driverId);
  assignPoints(result, s, round);
  (result as RoundResult & { crashes?: ID[] }).crashes = crashers;
  return result;
}

export function isInjured(world: World, driverId: ID): boolean {
  const a = world.active;
  return !!(a && a.driverId === driverId && a.injury && a.injury.racesOut > 0);
}

export function assignPoints(result: RoundResult, s: SeriesDef, round: RoundDef): void {
  const mult = round.double ? 2 : 1;
  result.order.forEach((id, i) => {
    if (result.dnf.includes(id)) return;
    const p = (s.points[i] ?? 0) * mult;
    if (p) result.points[id] = (result.points[id] ?? 0) + p;
  });
  if (s.fastestLapBonus && result.fastest) {
    const pos = result.order.indexOf(result.fastest);
    if (pos >= 0 && pos < 10 && !result.dnf.includes(result.fastest)) {
      result.points[result.fastest] = (result.points[result.fastest] ?? 0) + s.fastestLapBonus;
    }
  }
  if (s.poleBonus && result.pole) {
    result.points[result.pole] = (result.points[result.pole] ?? 0) + s.poleBonus;
  }
}

/** Record a finished round into season standings and driver stats. */
export function applyRoundResult(world: World, seriesId: string, result: RoundResult & { crashes?: ID[] }, opts: { skipStatsFor?: ID[] } = {}): void {
  const ss = world.season.series[seriesId];
  const round = ss.calendar[result.round];
  ss.results.push(result);
  ss.round = Math.max(ss.round, result.round + 1);
  const crashes = new Set(result.crashes ?? []);
  result.order.forEach((id, i) => {
    const d = world.drivers[id];
    if (!d) return;
    if (!ss.driverTeam[id]) {
      const teamId = d.contract?.series === seriesId ? d.contract.team : undefined;
      if (teamId) ss.driverTeam[id] = teamId;
    }
    const pts = result.points[id] ?? 0;
    ss.points[id] = (ss.points[id] ?? 0) + pts;
    const teamId = ss.driverTeam[id];
    if (teamId) ss.teamPoints[teamId] = (ss.teamPoints[teamId] ?? 0) + pts;
    if (opts.skipStatsFor?.includes(id)) return;
    const st = statsFor(d, seriesId);
    st.starts++;
    st.points += pts;
    const dnf = result.dnf.includes(id);
    if (dnf) {
      st.dnfs++;
      if (crashes.has(id)) st.crashes++;
    } else {
      const pos = i + 1;
      if (pos === 1) st.wins++;
      if (pos <= 3) st.podiums++;
      if (st.bestFinish === 0 || pos < st.bestFinish) st.bestFinish = pos;
    }
    if (result.pole === id) st.poles++;
    if (result.fastest === id) st.fastestLaps++;
  });
  if (round.special && result.order.length && !result.dnf.includes(result.order[0])) {
    const winner = world.drivers[result.order[0]];
    if (winner) {
      winner.specials[round.special] = (winner.specials[round.special] ?? 0) + 1;
      const team = world.teams[ss.driverTeam[winner.id]] ?? (winner.contract ? world.teams[winner.contract.team] : undefined);
      world.specialWinners.push({
        year: world.year,
        special: round.special,
        driverId: winner.id,
        driverName: fullName(winner),
        nation: winner.nation,
        teamName: team?.name ?? '—',
        isPlayer: !!winner.careerId,
      });
    }
  }
}

/** Advance every non-player series so it has completed `fraction` of its calendar. */
export function advanceOtherSeries(world: World, fraction: number, excludeSeries?: string, holdRounds: Record<string, number[]> = {}): void {
  for (const s of SERIES) {
    if (s.id === excludeSeries) continue;
    const ss = world.season.series[s.id];
    const target = clamp(Math.round(ss.calendar.length * fraction + 1e-9), 0, ss.calendar.length);
    while (ss.round < target) {
      if (holdRounds[s.id]?.includes(ss.round)) break;
      const rng = new Rng(mixSeed(world.seed, 'race', world.year, s.id, ss.round));
      const res = quickRace(world, s.id, ss.round, rng);
      applyRoundResult(world, s.id, res);
    }
  }
}

// ---------------------------------------------------------------------------
// Season end
// ---------------------------------------------------------------------------

export interface SeasonFinish {
  champions: ChampionRecord[];
}

export function finishSeason(world: World): SeasonFinish {
  const champions: ChampionRecord[] = [];
  for (const s of SERIES) {
    const ss = world.season.series[s.id];
    const table = standings(ss);
    const teams = teamStandings(ss);
    const fieldSize = table.length;
    table.forEach((row, i) => {
      const d = world.drivers[row.driverId];
      if (!d || row.races === 0) return;
      const st = statsFor(d, s.id);
      st.seasons++;
      d.log.push({
        year: world.year,
        series: s.id,
        team: row.teamId,
        pos: i + 1,
        pts: row.points,
        wins: row.wins,
        podiums: row.podiums,
        starts: row.races,
      });
      void fieldSize;
    });
    const champ = table[0];
    if (champ && champ.points > 0) {
      const d = world.drivers[champ.driverId];
      const team = world.teams[champ.teamId];
      statsFor(d, s.id).titles++;
      ss.champion = champ.driverId;
      if (team) team.driverTitles++;
      const tChamp = teams[0];
      if (tChamp) {
        ss.teamChampion = tChamp.teamId;
        world.teams[tChamp.teamId].titles++;
      }
      const rec: ChampionRecord = {
        year: world.year,
        series: s.id,
        driverId: d.id,
        driverName: fullName(d),
        nation: d.nation,
        teamId: champ.teamId,
        teamName: team?.name ?? '—',
        points: champ.points,
        wins: champ.wins,
        teamChampionId: tChamp?.teamId,
        teamChampionName: tChamp ? world.teams[tChamp.teamId]?.name : undefined,
        isPlayer: !!d.careerId,
        careerId: d.careerId,
      };
      world.history.push(rec);
      champions.push(rec);
    }
    teams.forEach((t, i) => {
      const team = world.teams[t.teamId];
      if (team) team.history.push({ year: world.year, pos: i + 1, pts: t.points });
    });
    for (const team of teamsInSeries(world, s.id)) {
      if (!teams.find((t) => t.teamId === team.id)) team.history.push({ year: world.year, pos: teams.length + 1, pts: 0 });
      // Only recent form matters to the simulation; keep the save small.
      if (team.history.length > 20) team.history.splice(0, team.history.length - 20);
    }
  }
  world.phase = 'offseason';
  return { champions };
}

export function specialName(id?: string): string | undefined {
  return id ? SPECIAL_MAP[id]?.name : undefined;
}

import { series as seriesDef, SERIES } from '../content/series';
import { family, personality } from '../content/traits';
import type { SeriesDef } from '../content/types';
import { ageOf, createAiDriver, developDriver, fullName, marketValue, overall, pickNation, type DevelopmentResult } from './drivers';
import { clamp, hashString, mixSeed, Rng } from './rng';
import { teamsInSeries } from './season';
import type { Contract, Driver, ID, Offer, TeamState, World } from './types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function lastSeriesOf(d: Driver): string | undefined {
  return d.contract?.series ?? d.log[d.log.length - 1]?.series;
}

function isProspect(d: Driver, age: number): boolean {
  return d.path === 'formula' && age <= 23 && overall(d.skills) + Math.min(d.growth, 10) >= 66;
}

/** Whether an AI driver would be considered for a seat in this series next year. */
export function aiEligible(d: Driver, s: SeriesDef, nextYear: number): boolean {
  const age = nextYear - d.born;
  if (age < s.minAge) return false;
  if (s.maxAge && age > s.maxAge) return false;
  const last = lastSeriesOf(d);
  const o = overall(d.skills);
  const prospect = isProspect(d, age);
  switch (s.id) {
    case 'cadet':
      return !last || last === 'cadet';
    case 'contender':
      return last ? ['cadet', 'contender', 'apex'].includes(last) : o >= 58;
    case 'apex':
      return !!last && (['contender', 'apex'].includes(last) || (last === 'prime' && age <= 26));
    case 'prime':
      return !!last && (['apex', 'prime'].includes(last) || (o >= 80 && age <= 34 && ['endurance', 'american', 'gt'].includes(last)));
    case 'endurance':
      return !prospect && age >= 20 && !!last && ['prime', 'apex', 'gt', 'endurance', 'american'].includes(last);
    case 'american':
      return !prospect && age >= 18 && (!last || ['prime', 'apex', 'contender', 'american', 'gt', 'endurance'].includes(last));
    case 'gt':
      return !prospect && age >= 18;
    default:
      return age >= s.minAge;
  }
}

/** The player may move more freely than AI drivers (that's the point of the wheel!). */
export function playerEligible(d: Driver, s: SeriesDef, nextYear: number, wasChampion: boolean): boolean {
  const age = nextYear - d.born;
  if (age < s.minAge) return false;
  if (s.maxAge && age > s.maxAge) return false;
  const last = lastSeriesOf(d);
  switch (s.id) {
    case 'cadet':
      return !last || last === 'cadet';
    case 'contender':
      return !last || ['cadet', 'contender', 'apex'].includes(last);
    case 'apex':
      return !!last && (['contender', 'apex', 'prime'].includes(last) || (last === 'cadet' && wasChampion));
    case 'prime':
      return (
        !!last && (['apex', 'prime'].includes(last) || (overall(d.skills) >= 76 && ['endurance', 'american', 'gt'].includes(last)) || (last === 'contender' && wasChampion && overall(d.skills) >= 74))
      );
    case 'endurance':
      return age >= 19;
    case 'american':
      return age >= 18;
    case 'gt':
      return age >= 17;
    default:
      return true;
  }
}

function seatAttractiveness(team: TeamState): number {
  return seriesDef(team.series).prestige * 0.75 + team.perf * 0.25;
}

function aiBacking(d: Driver): number {
  return hashString(d.id) % 100 < 16 ? 1 : 0;
}

function seatScore(d: Driver, team: TeamState, s: SeriesDef, nextYear: number, noiseSeed: number): number {
  const rng = new Rng(mixSeed(noiseSeed, d.id, team.id));
  let v = marketValue(d, nextYear, s.tier);
  if (d.contract?.team === team.id || d.log[d.log.length - 1]?.team === team.id) v += 3;
  if (team.budget < 55 && aiBacking(d)) v += 4;
  if (d.nation === team.nation) v += 1;
  if (d.path !== s.path) v -= 1.5;
  v += rng.normal(0, 2.5);
  return v;
}

function contractYears(rng: Rng, s: SeriesDef): number {
  if (s.tier >= 3) return rng.chance(0.7) ? 1 : 2;
  if (s.id === 'apex') return rng.chance(0.6) ? 1 : 2;
  return rng.weighted([1, 2, 3], (y) => (y === 2 ? 3 : y === 1 ? 2 : 1.5));
}

export function salaryFor(s: SeriesDef, value: number, team: TeamState): number {
  const [lo, hi] = s.salary;
  const t = clamp((value - s.ovrBand[0]) / (s.ovrBand[1] - s.ovrBand[0]), 0, 1.2);
  return Math.round((lo + (hi - lo) * Math.pow(t, 1.6)) * (0.6 + team.budget / 250));
}

function kept(world: World, team: TeamState, nextYear: number, exclude?: ID): ID[] {
  const s = seriesDef(team.series);
  return team.drivers.filter((id) => {
    if (id === exclude) return false;
    const d = world.drivers[id];
    if (!d || d.status !== 'active' || !d.contract) return false;
    if (d.contract.team !== team.id || d.contract.until < nextYear) return false;
    const age = nextYear - d.born;
    if (s.maxAge && age > s.maxAge) return false;
    return true;
  });
}

// ---------------------------------------------------------------------------
// Off-season: development, reputation, teams, retirements
// ---------------------------------------------------------------------------

export interface OffseasonReport {
  playerDev?: DevelopmentResult;
  retired: ID[];
}

export function processOffseason(world: World): OffseasonReport {
  const rng = new Rng(mixSeed(world.seed, 'offseason', world.year));
  const nextYear = world.year + 1;
  const report: OffseasonReport = { retired: [] };
  const playerId = world.active?.driverId;

  // Development & reputation
  for (const d of Object.values(world.drivers)) {
    if (d.status === 'retired') continue;
    const last = d.log[d.log.length - 1];
    const tier = last ? seriesDef(last.series).tier : 4;
    const dev = developDriver(d, nextYear - d.born, rng, tier);
    if (d.id === playerId) report.playerDev = dev;
    const p = personality(d.personality);
    if (last && last.year === world.year) {
      const s = seriesDef(last.series);
      const posNorm = 1 - (Math.min(last.pos, 20) - 1) / 19;
      const prestige = s.prestige / 100;
      const repDelta = (posNorm - 0.45) * 10 * prestige * p.repGain + (last.pos === 1 ? 8 * prestige : 0);
      d.reputation = clamp(d.reputation * 0.93 + repDelta + 3, 0, 100);
      const fanGain = (posNorm * 40 + last.wins * 25 + (last.pos === 1 ? 150 : 0)) * prestige * prestige * p.fanGain;
      d.fans = Math.max(1, Math.round(d.fans * 0.92 + fanGain));
    } else {
      d.reputation = clamp(d.reputation * 0.85, 0, 100);
      d.fans = Math.max(1, Math.round(d.fans * 0.8));
    }
  }

  // Teams evolve; occasional regulation resets shake up the order.
  for (const s of SERIES) {
    const reset = world.regsReset[s.id] === nextYear;
    if (reset) world.regsReset[s.id] = nextYear + rng.int(6, 9);
    for (const t of teamsInSeries(world, s.id)) {
      const lastPos = t.history[t.history.length - 1]?.pos ?? 5;
      t.perf = clamp(t.perf + rng.normal(0, 3.2) + (t.budget - 60) * 0.05 + (62 - t.perf) * 0.08 + (reset ? rng.normal(0, 9) : 0), 40, 99);
      t.reliability = clamp(t.reliability + rng.normal(0, 3) + (t.budget - 60) * 0.03 + (82 - t.reliability) * 0.1, 55, 98);
      t.prestige = clamp(t.prestige * 0.88 + (t.perf + (lastPos === 1 ? 10 : 0)) * 0.12, 20, 100);
      t.budget = clamp(t.budget + (t.prestige - t.budget) * 0.1 + rng.normal(0, 3), 20, 100);
      t.pitCrew = clamp(t.pitCrew + rng.normal(0, 3) + (t.budget - 60) * 0.02, 40, 99);
    }
  }

  // AI retirements
  for (const d of Object.values(world.drivers)) {
    if (d.status === 'retired' || d.id === playerId || d.careerId) continue;
    const age = nextYear - d.born;
    const p = personality(d.personality);
    const effAge = age - p.ageShift;
    let pr = 0;
    if (effAge >= 34) pr = 0.1 + (effAge - 34) * 0.07;
    if (effAge >= 41) pr += 0.3;
    if (d.status === 'free') pr += (age <= 21 ? 0.1 : 0.25) * d.yearsWithoutSeat + (age > 26 ? 0.2 : 0);
    if (age < 34 && d.yearsWithoutSeat >= (age <= 21 ? 3 : 2)) pr = Math.max(pr, 0.6);
    if (age >= 46) pr = 1;
    if (d.contract && d.contract.until >= nextYear && age < 40) pr *= 0.35;
    if (rng.chance(pr)) {
      retireDriver(world, d);
      report.retired.push(d.id);
    }
  }
  return report;
}

export function retireDriver(world: World, d: Driver): void {
  d.status = 'retired';
  d.retiredYear = world.year;
  if (d.contract) {
    const team = world.teams[d.contract.team];
    if (team) team.drivers = team.drivers.filter((x) => x !== d.id);
  }
  d.contract = undefined;
}

// ---------------------------------------------------------------------------
// Player offers
// ---------------------------------------------------------------------------

export function computeOffers(world: World): Offer[] {
  const a = world.active;
  if (!a) return [];
  const player = world.drivers[a.driverId];
  const nextYear = world.year + 1;
  const rng = new Rng(mixSeed(world.seed, 'offers', world.year, a.id));
  const noiseSeed = mixSeed(world.seed, 'market', world.year);
  const p = personality(player.personality);
  const lastLog = player.log[player.log.length - 1];
  const wasChampion = !!lastLog && lastLog.year === world.year && lastLog.pos === 1;
  const contractValid = !!player.contract && player.contract.until >= nextYear;
  const currentTeam = player.contract?.team;
  const pool = Object.values(world.drivers).filter((d) => d.status !== 'retired' && d.id !== player.id && !d.careerId && (!d.contract || d.contract.until < nextYear));
  const offers: Offer[] = [];
  const fam = family(player.family);
  const wallet = a.money + fam.budget;
  const age = nextYear - player.born;
  // Closest miss, used for the lifeline below when nobody calls.
  let nearMiss: { team: TeamState; s: SeriesDef; gap: number; value: number } | undefined;

  // Replay the winter's driver market the way runMarket() will: seats are filled from
  // the most attractive down, each taking the best driver still available. The player
  // gets an offer from every seat that would pick them over the best remaining AI.
  const seats: TeamState[] = [];
  for (const team of Object.values(world.teams)) {
    const s = seriesDef(team.series);
    const open = s.carsPerTeam - kept(world, team, nextYear, player.id).length;
    for (let k = 0; k < open; k++) seats.push(team);
  }
  seats.sort((x, y) => seatAttractiveness(y) - seatAttractiveness(x));
  const taken = new Set<ID>();
  const asked = new Set<ID>();

  for (const team of seats) {
    const s = seriesDef(team.series);
    let best: Driver | undefined;
    let bestScore = -Infinity;
    for (const d of pool) {
      if (taken.has(d.id) || !aiEligible(d, s, nextYear)) continue;
      const sc = seatScore(d, team, s, nextYear, noiseSeed);
      if (sc > bestScore) {
        bestScore = sc;
        best = d;
      }
    }
    // With nobody suitable the team would promote a fresh driver from the lower ranks.
    const bar = Math.max(bestScore, s.ovrBand[0] - 8);
    const isCurrent = team.id === currentTeam;
    const eligible = !asked.has(team.id) && playerEligible(player, s, nextYear, wasChampion) && !(isCurrent && contractValid);
    if (eligible) {
      asked.add(team.id);
      let mine = marketValue(player, nextYear, s.tier) + (p.offerMult - 1) * 6;
      if (isCurrent) mine += 3 + (a.teamRelation - 50) * 0.12;
      if (team.principal.driverId && player.parentId === team.principal.driverId) mine += 6;
      if (team.principal.driverId && world.drivers[team.principal.driverId]?.careerId) mine += 2;
      if (player.nation === team.nation) mine += 1;
      mine += new Rng(mixSeed(noiseSeed, player.id, team.id)).normal(0, 2.5);
      const junior = s.tier >= 3 && age <= 19;
      // The protagonist gets a little benefit of the doubt, juniors a bit more.
      const lenient = (isCurrent ? 3 : 1.5) + (junior ? 3 : 0);
      const margin = mine + lenient - bar;
      if (margin >= 0) {
        offers.push({
          id: `o${offers.length}-${team.id}`,
          series: s.id,
          team: team.id,
          years: isCurrent ? rng.int(1, 3) : contractYears(rng, s),
          role: margin > 8 ? 'lead' : margin > 3 ? 'equal' : 'second',
          salary: salaryFor(s, mine, team),
          kind: isCurrent ? 'renewal' : 'offer',
        });
        continue; // The AI candidate stays on the market for the next seat.
      }
      if (team.budget < (junior ? 72 : 58) && margin >= -(junior ? 14 : 8)) {
        const cost = Math.round(s.paySeat * (1.35 - team.budget / 100));
        if (wallet >= cost) {
          offers.push({
            id: `p${offers.length}-${team.id}`,
            series: s.id,
            team: team.id,
            years: 1,
            role: 'second',
            salary: -cost,
            kind: 'paySeat',
            note: team.budget < 45 ? 'They need your money just to make the grid' : 'Money talks, and your sponsors are fluent',
          });
        }
      }
      if (!isCurrent && (!nearMiss || -margin < nearMiss.gap)) nearMiss = { team, s, gap: -margin, value: mine };
    }
    if (best) taken.add(best.id);
  }

  // Lifeline: a proven driver rarely stays unemployed for long. The team that came
  // closest to signing you may take a chance, more likely the longer you've waited.
  if (!offers.length && !contractValid && nearMiss && nearMiss.gap < 12) {
    const chance = clamp(0.7 - nearMiss.gap * 0.05 + player.yearsWithoutSeat * 0.2, 0.2, 0.95);
    if (rng.chance(chance)) {
      offers.push({
        id: `l-${nearMiss.team.id}`,
        series: nearMiss.s.id,
        team: nearMiss.team.id,
        years: 1,
        role: 'second',
        salary: salaryFor(nearMiss.s, nearMiss.value - 6, nearMiss.team),
        kind: 'offer',
        note: 'Nobody else called. They are taking a chance on you.',
      });
    }
  }

  // Keep the list focused: renewals first, then by seat quality.
  const renewal = offers.filter((o) => o.kind === 'renewal');
  const regular = offers.filter((o) => o.kind === 'offer').sort((x, y) => seatAttractiveness(world.teams[y.team]) - seatAttractiveness(world.teams[x.team]));
  const pay = offers.filter((o) => o.kind === 'paySeat').sort((x, y) => seatAttractiveness(world.teams[y.team]) - seatAttractiveness(world.teams[x.team]));
  // Ensure variety across categories: max 2 offers per series.
  const perSeries: Record<string, number> = {};
  const picked: Offer[] = [];
  for (const o of [...renewal, ...regular, ...pay]) {
    perSeries[o.series] = (perSeries[o.series] ?? 0) + 1;
    if (perSeries[o.series] > 2 && o.kind !== 'renewal') continue;
    picked.push(o);
    if (picked.length >= 6) break;
  }
  return picked;
}

export function formatMoney(k: number): string {
  const abs = Math.abs(k);
  if (abs >= 1000) return `${(k / 1000).toFixed(abs >= 10000 ? 0 : 1)}M`;
  return `${Math.round(k)}k`;
}

/**
 * A last-minute seat when fate smiles: someone got injured / sacked.
 * Picks a random open seat the player could plausibly take.
 */
export function wildcardOffer(world: World, rng: Rng): Offer | undefined {
  const a = world.active;
  if (!a) return undefined;
  const player = world.drivers[a.driverId];
  const nextYear = world.year + 1;
  const options = Object.values(world.teams).filter((t) => {
    const s = seriesDef(t.series);
    if (t.id === player.contract?.team) return false;
    if (!playerEligible(player, s, nextYear, false)) return false;
    return kept(world, t, nextYear, player.id).length < s.carsPerTeam;
  });
  if (!options.length) return undefined;
  const team = rng.weighted(options, (t) => 110 - t.perf);
  const s = seriesDef(team.series);
  return {
    id: `w-${team.id}`,
    series: s.id,
    team: team.id,
    years: 1,
    role: 'second',
    salary: salaryFor(s, marketValue(player, nextYear, s.tier) - 4, team),
    kind: 'wildcard',
    note: 'A seat opened up at the last minute',
  };
}

// ---------------------------------------------------------------------------
// The market
// ---------------------------------------------------------------------------

export interface PlayerSeat {
  team: string;
  years: number;
  role: Contract['role'];
  salary: number;
}

function generateRookies(world: World, rng: Rng, nextYear: number): Driver[] {
  const out: Driver[] = [];
  const cadetSeats = teamsInSeries(world, 'cadet').length * 2;
  const count = Math.round(cadetSeats * 0.55) + rng.int(0, 4);
  for (let i = 0; i < count; i++) {
    const age = rng.weighted([15, 16, 17], (a) => (a === 16 ? 3 : 2));
    const d = createAiDriver(world, rng, {
      age,
      ovr: clamp(rng.normal(49, 6.5), 36, 66),
      growth: clamp(rng.normal(20, 6.5), 4, 36),
      path: 'formula',
    });
    d.born = nextYear - age;
    out.push(d);
  }
  // A few late starters head straight to GT / American racing.
  for (let i = 0; i < 5; i++) {
    const age = rng.int(18, 22);
    const american = rng.chance(0.45);
    const d = createAiDriver(world, rng, {
      age,
      ovr: clamp(rng.normal(58, 5), 48, 70),
      growth: clamp(rng.normal(6, 3), 0, 14),
      path: american ? 'american' : 'sportscar',
      nation: american ? (rng.chance(0.7) ? 'US' : pickNation(rng)) : undefined,
    });
    d.born = nextYear - age;
    out.push(d);
  }
  return out;
}

/**
 * Fill every seat for next season, then advance the world year.
 * If `playerSeat` is given, the player is signed there first.
 */
export function runMarket(world: World, playerSeat?: PlayerSeat): void {
  const nextYear = world.year + 1;
  const rng = new Rng(mixSeed(world.seed, 'marketrun', world.year));
  const noiseSeed = mixSeed(world.seed, 'market', world.year);
  const playerId = world.active?.driverId;
  const player = playerId ? world.drivers[playerId] : undefined;

  const lineups: Record<string, ID[]> = {};
  for (const team of Object.values(world.teams)) {
    lineups[team.id] = kept(world, team, nextYear, playerId);
  }

  // Player first.
  if (player && playerSeat) {
    const team = world.teams[playerSeat.team];
    const s = seriesDef(team.series);
    const lineup = lineups[team.id];
    if (lineup.length >= s.carsPerTeam) {
      // Bump the weakest contracted driver back into the pool.
      const weakest = [...lineup].sort((x, y) => overall(world.drivers[x].skills) - overall(world.drivers[y].skills))[0];
      lineups[team.id] = lineup.filter((x) => x !== weakest);
      world.drivers[weakest].contract = undefined;
    }
    lineups[team.id].push(player.id);
    player.contract = { series: s.id, team: team.id, until: world.year + playerSeat.years, role: playerSeat.role, salary: playerSeat.salary };
    player.status = 'active';
    player.yearsWithoutSeat = 0;
    player.path = s.path;
  } else if (player && player.contract && player.contract.until < nextYear) {
    player.contract = undefined;
  }

  const signed = new Set<ID>(Object.values(lineups).flat());
  if (player) signed.add(player.id);
  const rookies = generateRookies(world, rng, nextYear);
  let pool = Object.values(world.drivers).filter((d) => d.status !== 'retired' && !signed.has(d.id) && !d.careerId);
  void rookies;

  const seats: TeamState[] = [];
  for (const team of Object.values(world.teams)) {
    const s = seriesDef(team.series);
    for (let k = lineups[team.id].length; k < s.carsPerTeam; k++) seats.push(team);
  }
  seats.sort((x, y) => seatAttractiveness(y) - seatAttractiveness(x) + rng.normal(0, 1.5));

  for (const team of seats) {
    const s = seriesDef(team.series);
    let best: Driver | undefined;
    let bestScore = -Infinity;
    for (const d of pool) {
      if (!aiEligible(d, s, nextYear)) continue;
      const sc = seatScore(d, team, s, nextYear, noiseSeed);
      if (sc > bestScore) {
        bestScore = sc;
        best = d;
      }
    }
    if (!best || bestScore < s.ovrBand[0] - 14) {
      const age = s.tier >= 3 ? rng.int(s.minAge, Math.min(s.maxAge ?? 20, 18)) : rng.int(Math.max(s.minAge, 21), 31);
      best = createAiDriver(world, rng, {
        age,
        ovr: rng.float(s.ovrBand[0], (s.ovrBand[0] + s.ovrBand[1]) / 2),
        path: s.path,
        nation: s.id === 'american' && rng.chance(0.55) ? 'US' : undefined,
      });
      best.born = nextYear - age;
    }
    pool = pool.filter((d) => d !== best);
    lineups[team.id].push(best.id);
    const years = contractYears(rng, s);
    best.contract = {
      series: s.id,
      team: team.id,
      until: world.year + years,
      role: 'equal',
      salary: salaryFor(s, marketValue(best, nextYear, s.tier), team),
    };
    best.status = 'active';
    best.yearsWithoutSeat = 0;
    best.path = s.path;
  }

  // Unsigned drivers become free agents (any old contract is void).
  for (const d of pool) {
    if (d.status === 'retired') continue;
    d.contract = undefined;
    d.status = 'free';
    d.yearsWithoutSeat += 1;
  }
  if (player && !player.contract) {
    player.status = 'free';
    player.yearsWithoutSeat += 1;
  }

  // Apply lineups and roles.
  for (const team of Object.values(world.teams)) {
    team.drivers = lineups[team.id];
    const s = seriesDef(team.series);
    const vals = team.drivers.map((id) => ({ id, v: marketValue(world.drivers[id], nextYear, s.tier) })).sort((x, y) => y.v - x.v);
    vals.forEach((x, i) => {
      const d = world.drivers[x.id];
      if (!d.contract || d.id === playerId) return;
      const gap = vals.length > 1 ? vals[0].v - vals[vals.length - 1].v : 0;
      d.contract.role = gap > 5 ? (i === 0 ? 'lead' : 'second') : 'equal';
    });
  }

  world.year = nextYear;
}

/** Prune retired AI drivers that never achieved anything (keeps saves small). */
export function pruneDrivers(world: World): void {
  const keep = new Set<ID>();
  for (const h of world.history) keep.add(h.driverId);
  for (const w of world.specialWinners) keep.add(w.driverId);
  for (const t of Object.values(world.teams)) if (t.principal.driverId) keep.add(t.principal.driverId);
  for (const d of Object.values(world.drivers)) if (d.parentId) keep.add(d.parentId);
  if (world.active) for (const id of Object.keys(world.active.rivals)) keep.add(id);
  for (const d of Object.values(world.drivers)) {
    if (d.status !== 'retired' || d.careerId || keep.has(d.id)) continue;
    const wins = Object.values(d.stats).reduce((a, s) => a + s.wins, 0);
    const primeStarts = d.stats.prime?.starts ?? 0;
    if (wins === 0 && primeStarts < 30 && world.year - (d.retiredYear ?? world.year) > 2) {
      delete world.drivers[d.id];
    }
  }
}

export function describeDriver(d: Driver, year: number): string {
  return `${fullName(d)} (${ageOf(d, year)})`;
}

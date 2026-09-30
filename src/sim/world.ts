import { SERIES, series as seriesDef } from '../content/series';
import { TEAMS } from '../content/teams';
import { createAiDriver, pickNation } from './drivers';
import { processOffseason, pruneDrivers, runMarket } from './market';
import { clamp, mixSeed, Rng } from './rng';
import { advanceOtherSeries, finishSeason, startSeason } from './season';
import type { TeamState, World } from './types';

export const WORLD_VERSION = 1;
export const FIRST_SEASON = 2026;
const WARMUP_YEARS = 8;

function ageRangeFor(seriesId: string): [number, number] {
  switch (seriesId) {
    case 'cadet':
      return [15, 18];
    case 'contender':
      return [16, 21];
    case 'apex':
      return [18, 24];
    case 'prime':
      return [20, 37];
    case 'endurance':
      return [22, 41];
    case 'american':
      return [20, 39];
    case 'gt':
      return [19, 42];
    default:
      return [18, 35];
  }
}

function nationBias(seriesId: string): Record<string, number> | undefined {
  if (seriesId === 'american') return { US: 9, CA: 2, MX: 1.5, BR: 1.5, AU: 1.5, NZ: 1.5 };
  if (seriesId === 'endurance' || seriesId === 'gt') return { FR: 1.6, DE: 1.5, GB: 1.3, JP: 1.4, US: 1.2, BE: 1.5, DK: 1.5 };
  return undefined;
}

export function createWorld(seed: number, opts: { warmup?: number } = {}): World {
  const startYear = FIRST_SEASON - (opts.warmup ?? WARMUP_YEARS);
  const world: World = {
    version: WORLD_VERSION,
    seed,
    year: startYear,
    phase: 'season',
    nextId: 0,
    teams: {},
    drivers: {},
    season: { year: startYear, series: {} },
    history: [],
    specialWinners: [],
    careers: [],
    news: [],
    regsReset: {},
    offseasonDone: false,
    createdAt: Date.now(),
  };
  const rng = new Rng(mixSeed(seed, 'world'));

  for (const t of TEAMS) {
    const team: TeamState = {
      id: t.id,
      series: t.series,
      name: t.name,
      short: t.short,
      nation: t.nation,
      colors: t.colors,
      livery: t.livery,
      perf: clamp(t.perf + rng.normal(0, 2), 25, 99),
      reliability: t.reliability,
      prestige: t.prestige,
      budget: t.budget,
      pitCrew: clamp(60 + (t.budget - 50) * 0.4 + rng.normal(0, 6), 40, 98),
      principal: { name: t.principal },
      drivers: [],
      titles: 0,
      driverTitles: 0,
      history: [],
    };
    world.teams[team.id] = team;
  }
  for (const s of SERIES) world.regsReset[s.id] = startYear + rng.int(3, 8);

  // Staff every seat: better teams get better drivers (with noise).
  for (const s of SERIES) {
    const teams = Object.values(world.teams)
      .filter((t) => t.series === s.id)
      .sort((a, b) => b.perf - a.perf);
    const seats = teams.length * s.carsPerTeam;
    const [lo, hi] = s.ovrBand;
    const [aMin, aMax] = ageRangeFor(s.id);
    const drivers = Array.from({ length: seats }, () => {
      const age = rng.int(aMin, aMax);
      const ovr = clamp(rng.normal((lo + hi) / 2, (hi - lo) / 4), lo - 4, hi + 2);
      return createAiDriver(world, rng, {
        age,
        ovr,
        path: s.path,
        nation: pickNation(rng, nationBias(s.id)),
      });
    }).sort((a, b) => b.peakOvr - a.peakOvr + rng.normal(0, 4));
    let k = 0;
    for (const team of teams) {
      for (let c = 0; c < s.carsPerTeam; c++) {
        const d = drivers[k++];
        team.drivers.push(d.id);
        d.contract = { series: s.id, team: team.id, until: startYear + rng.int(0, 2), role: 'equal', salary: s.salary[0] };
      }
    }
  }
  // A small pool of free agents.
  for (let i = 0; i < 18; i++) {
    const s = rng.pick(SERIES);
    const d = createAiDriver(world, rng, { age: rng.int(19, 33), ovr: rng.float(s.ovrBand[0] - 6, s.ovrBand[0] + 6), path: s.path });
    d.status = 'free';
    d.log.push({ year: startYear - 1, series: s.id, team: '', pos: rng.int(10, 20), pts: 0, wins: 0, podiums: 0, starts: 10 });
  }

  // Simulate history so the world has champions, veterans and rivalries.
  startSeason(world);
  for (;;) {
    advanceOtherSeries(world, 1);
    finishSeason(world);
    processOffseason(world);
    world.offseasonDone = true;
    pruneDrivers(world);
    if (world.year >= FIRST_SEASON - 1) break;
    runMarket(world);
    startSeason(world);
  }
  world.news = [];
  addNews(world, `Welcome to ${FIRST_SEASON}. ${championLine(world, 'prime')}`);
  return world;
}

function championLine(world: World, seriesId: string): string {
  const rec = [...world.history].reverse().find((h) => h.series === seriesId);
  if (!rec) return '';
  return `${rec.driverName} is the reigning ${seriesDef(seriesId).name} champion.`;
}

export function addNews(world: World, text: string, opts: { series?: string; important?: boolean } = {}): void {
  world.nextId += 1;
  world.news.unshift({ id: `n${world.nextId}`, year: world.year, text, series: opts.series, important: opts.important });
  if (world.news.length > 80) world.news.length = 80;
}

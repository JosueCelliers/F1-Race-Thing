/**
 * Detailed, incremental race engine used for every race the player drives in.
 *
 * The race is simulated in "steps" (a lap, or a few laps for very long races).
 * After each step a snapshot of the running order and gaps is recorded so the
 * UI can animate cars around the track map. Between steps the engine may raise
 * a player "moment" (attack / defend / pit call...) which must be resolved
 * before the next step is simulated.
 */
import type { SeriesDef, TrackDef } from '../../content/types';
import { personality } from '../../content/traits';
import { clamp, Rng } from '../rng';
import type { HelmetDesign, ID, PersonalityId, RoundDef, Skills, TeamColors, TeamId } from '../types';

export type Compound = 'S' | 'M' | 'H' | 'I';
export type PitRule = 'none' | 'mandatory' | 'strategy' | 'fuel' | 'endurance';

export interface EngineEntry {
  driverId: ID;
  teamId: TeamId;
  name: string;
  code: string;
  number: number;
  colors: TeamColors;
  livery: string;
  helmet: HelmetDesign;
  isPlayer: boolean;
  isTeammate: boolean;
  car: number;
  reliability: number;
  pitCrew: number;
  skills: Skills;
  aggression: number;
  personality: PersonalityId;
  form: number;
  /** Average performance of co-drivers (endurance crews). */
  crewPerf?: number;
  crew?: string[];
  /** Championship position before the race (for team orders logic). */
  champPos?: number;
}

export interface WeatherPlan {
  initial: number;
  changes: { step: number; target: number }[];
}

export interface RaceConfig {
  seed: number;
  series: SeriesDef;
  round: RoundDef;
  roundIndex: number;
  track: TrackDef;
  entries: EngineEntry[];
  grid: number[];
  weather: WeatherPlan;
  /** Big occasion (title decider, crown jewel): pressure matters. */
  bigRace: boolean;
}

export type CarStatus = 'run' | 'out';

export interface CarState {
  total: number;
  last: number;
  best: number;
  status: CarStatus;
  outReason?: 'crash' | 'mech' | 'collision';
  outStep?: number;
  tyre: Compound;
  tyreAge: number;
  stops: number;
  plan: { lap: number; tyre: Compound }[];
  damage: number;
  mode: -1 | 0 | 1;
  modeSteps: number;
  pitNext?: Compound;
  pitted: boolean;
  gridPos: number;
  penalty: number;
  mechRisk: number;
  paceMod: number;
  overtakes: number;
  mandatoryDone: boolean;
  fuelLaps: number;
  /** Launch quality modifier for the start (+ = aggressive). */
  startMod: number;
}

export type RaceEventKind =
  | 'overtake'
  | 'crash'
  | 'collision'
  | 'mech'
  | 'pit'
  | 'sc'
  | 'scEnd'
  | 'rain'
  | 'dry'
  | 'fastest'
  | 'mistake'
  | 'spin'
  | 'lead'
  | 'penalty'
  | 'start'
  | 'finish'
  | 'info';

export interface RaceEvent {
  step: number;
  kind: RaceEventKind;
  a?: number;
  b?: number;
  text: string;
  player?: boolean;
}

export interface Snapshot {
  step: number;
  lap: number;
  order: number[];
  gaps: number[];
  status: CarStatus[];
  pitted: boolean[];
  tyres: Compound[];
  flag: 'green' | 'sc';
  wet: number;
  refLap: number;
  events: RaceEvent[];
}

export interface ForcedDuel {
  attacker: number;
  defender: number;
  outcome: 'pass' | 'held' | 'collision';
  collision?: CollisionResult;
}

export type CollisionResult = 'bothContinue' | 'attackerSpin' | 'defenderSpin' | 'attackerOut' | 'defenderOut' | 'bothOut';

const SPREAD = 0.045;
const MIN_GAP = 0.28;

const TYRE: Record<Compound, { offset: number; deg: number; life: number }> = {
  S: { offset: -0.0065, deg: 0.00078, life: 20 },
  M: { offset: 0, deg: 0.0005, life: 30 },
  H: { offset: 0.0045, deg: 0.00032, life: 42 },
  I: { offset: 0, deg: 0.0005, life: 36 },
};

export function pitRuleFor(s: SeriesDef, round: RoundDef): PitRule {
  if (round.hours) return 'endurance';
  if (s.discipline === 'american') return 'fuel';
  if (s.id === 'prime') return 'strategy';
  if (s.id === 'apex' || s.discipline === 'gt') return 'mandatory';
  return 'none';
}

export class RaceEngine {
  cfg: RaceConfig;
  rng: Rng;
  cars: CarState[];
  steps: number;
  lapsPerStep: number;
  step = 0;
  wet: number;
  sc = 0;
  /** Step during which the last safety car was deployed. */
  scDeployedStep = -1;
  restart = false;
  pitRule: PitRule;
  snapshots: Snapshot[] = [];
  events: RaceEvent[] = [];
  forced: ForcedDuel[] = [];
  fastest = { idx: -1, time: Infinity };
  leaderIdx = -1;
  refLap: number;
  finished = false;
  /** Per-step events buffer. */
  private buf: RaceEvent[] = [];
  /** Interaction log between the player and other cars. */
  battles: { rival: number; won: boolean; kind: 'pass' | 'defend' | 'collision' }[] = [];

  constructor(cfg: RaceConfig) {
    this.cfg = cfg;
    this.rng = new Rng(cfg.seed);
    const laps = cfg.round.laps;
    const maxSteps = cfg.round.hours ? Math.min(60, Math.max(20, cfg.round.hours * 3)) : 60;
    this.steps = Math.min(laps, maxSteps);
    this.lapsPerStep = laps / this.steps;
    this.wet = cfg.weather.initial;
    this.pitRule = pitRuleFor(cfg.series, cfg.round);
    this.refLap = cfg.track.lapTime * cfg.series.paceFactor;
    this.cars = cfg.entries.map((_, i) => this.initCar(i));
    cfg.grid.forEach((idx, pos) => {
      this.cars[idx].gridPos = pos + 1;
      this.cars[idx].total = pos * 0.2;
    });
    this.leaderIdx = cfg.grid[0];
    this.snapshots.push(this.snapshot([]));
  }

  // -------------------------------------------------------------------------
  // Setup
  // -------------------------------------------------------------------------

  private initCar(i: number): CarState {
    const laps = this.cfg.round.laps;
    const wetStart = this.wet > 0.3;
    const car: CarState = {
      total: 0,
      last: 0,
      best: Infinity,
      status: 'run',
      tyre: wetStart ? 'I' : 'M',
      tyreAge: 0,
      stops: 0,
      plan: [],
      damage: 0,
      mode: 0,
      modeSteps: 0,
      pitted: false,
      gridPos: i + 1,
      penalty: 0,
      mechRisk: 1,
      paceMod: 0,
      overtakes: 0,
      mandatoryDone: false,
      fuelLaps: 0,
      startMod: 0,
    };
    const r = this.rng;
    switch (this.pitRule) {
      case 'strategy': {
        const two = r.chance(0.42);
        if (two) {
          car.tyre = wetStart ? 'I' : r.chance(0.5) ? 'S' : 'M';
          car.plan = [
            { lap: Math.round(laps * r.float(0.26, 0.36)), tyre: 'M' },
            { lap: Math.round(laps * r.float(0.6, 0.7)), tyre: r.chance(0.6) ? 'S' : 'M' },
          ];
        } else {
          car.tyre = wetStart ? 'I' : r.chance(0.65) ? 'M' : 'S';
          car.plan = [{ lap: Math.round(laps * (car.tyre === 'S' ? r.float(0.3, 0.4) : r.float(0.42, 0.56))), tyre: 'H' }];
        }
        break;
      }
      case 'mandatory':
        car.tyre = wetStart ? 'I' : r.chance(0.5) ? 'S' : 'M';
        car.plan = [{ lap: Math.round(laps * r.float(0.35, 0.65)), tyre: car.tyre === 'S' ? 'M' : 'S' }];
        break;
      case 'fuel': {
        const window = this.cfg.track.kind === 'oval' ? r.int(28, 36) : r.int(22, 28);
        for (let l = window; l < laps - 6; l += window + r.int(-3, 3)) car.plan.push({ lap: l, tyre: 'M' });
        break;
      }
      case 'endurance': {
        const stint = Math.max(8, Math.round(3000 / (this.refLap * 1.02)));
        for (let l = stint; l < laps - 3; l += stint + r.int(-2, 2)) car.plan.push({ lap: l, tyre: 'M' });
        break;
      }
      default:
        car.tyre = wetStart ? 'I' : 'M';
    }
    return car;
  }

  get entries() {
    return this.cfg.entries;
  }

  get playerIndex(): number {
    return this.cfg.entries.findIndex((e) => e.isPlayer);
  }

  displayLap(step = this.step): number {
    return Math.min(this.cfg.round.laps, Math.round(step * this.lapsPerStep));
  }

  /** Current race order (running cars by total time, then retirements). */
  order(): number[] {
    const running = this.cars.map((c, i) => i).filter((i) => this.cars[i].status === 'run');
    running.sort((a, b) => this.cars[a].total - this.cars[b].total);
    const out = this.cars
      .map((c, i) => i)
      .filter((i) => this.cars[i].status === 'out')
      .sort((a, b) => (this.cars[b].outStep ?? 0) - (this.cars[a].outStep ?? 0));
    return [...running, ...out];
  }

  positionOf(idx: number): number {
    return this.order().indexOf(idx) + 1;
  }

  // -------------------------------------------------------------------------
  // Performance model
  // -------------------------------------------------------------------------

  driverPerf(i: number): number {
    const e = this.cfg.entries[i];
    const s = e.skills;
    const w = this.wet * 0.65;
    const dry = s.pace * 0.7 + s.consistency * 0.18 + s.racecraft * 0.12;
    let d = dry * (1 - w) + s.wet * w;
    if (e.crewPerf !== undefined) d = (d + e.crewPerf * 2) / 3;
    return d;
  }

  basePerf(i: number): number {
    const e = this.cfg.entries[i];
    const ci = this.cfg.series.carImportance;
    let perf = ci * e.car + (1 - ci) * this.driverPerf(i) + e.form;
    if (this.cfg.bigRace) {
      const p = personality(e.personality);
      perf += (p.pressure - 0.5) * 1.6;
    }
    return perf;
  }

  /** Expected lap time for car i right now (without noise), seconds per lap. */
  expectedLap(i: number): number {
    const c = this.cars[i];
    const perf = this.basePerf(i) + c.mode * 1.3 + c.paceMod;
    let frac = (SPREAD * (100 - perf)) / 100;
    const t = TYRE[c.tyre];
    const life = this.pitRule === 'none' ? t.life * 1.8 : t.life;
    frac += t.offset + t.deg * c.tyreAge * (c.mode === -1 ? 0.6 : c.mode === 1 ? 1.7 : 1);
    if (c.tyreAge > life) frac += (c.tyreAge - life) * t.deg * 3.5;
    if (c.tyre === 'I') {
      frac += this.wet < 0.3 ? (0.3 - this.wet) * 0.22 + 0.012 : 0.008;
    } else if (this.wet > 0.12) {
      frac += this.wet * 0.095;
    }
    frac += this.wet * 0.09;
    frac += c.damage;
    frac -= (this.step * this.lapsPerStep) * 0.00018;
    return this.refLap * (1 + frac);
  }

  // -------------------------------------------------------------------------
  // Step simulation
  // -------------------------------------------------------------------------

  private log(ev: Omit<RaceEvent, 'step'>) {
    const e: RaceEvent = { step: this.step, ...ev };
    this.buf.push(e);
    this.events.push(e);
  }

  private isPlayer(i: number) {
    return this.cfg.entries[i]?.isPlayer ?? false;
  }

  private name(i: number) {
    return this.cfg.entries[i].name;
  }

  private updateWeather() {
    const plan = this.cfg.weather.changes.filter((c) => c.step <= this.step);
    const target = plan.length ? plan[plan.length - 1].target : this.cfg.weather.initial;
    const before = this.wet;
    const rate = 0.18 * Math.sqrt(this.lapsPerStep);
    if (this.wet < target) this.wet = Math.min(target, this.wet + rate);
    else if (this.wet > target) this.wet = Math.max(target, this.wet - rate * 0.7);
    if (before < 0.3 && this.wet >= 0.3) this.log({ kind: 'rain', text: 'Rain is falling! The track is getting wet.' });
    if (before >= 0.3 && this.wet < 0.3) this.log({ kind: 'dry', text: 'The track is drying — slick tyre weather.' });
  }

  private pitLoss(i: number): number {
    const e = this.cfg.entries[i];
    const kind = this.cfg.track.kind;
    let base = kind === 'street' ? 23 : kind === 'oval' ? 15 : 21;
    if (this.pitRule === 'endurance') base += 12;
    let t = base + this.rng.normal(0.6, 0.45) - (e.pitCrew - 70) * 0.03;
    if (this.rng.chance(0.035)) t += this.rng.float(3, 9);
    if (this.sc > 0) t *= 0.55;
    return t;
  }

  private decidePits() {
    const lapNow = this.step * this.lapsPerStep;
    const laps = this.cfg.round.laps;
    this.cars.forEach((c, i) => {
      c.pitted = false;
      if (c.status !== 'run') return;
      if (c.pitNext) return;
      if (this.isPlayer(i) && this.playerPitControl) return;
      // Weather reactions
      if (this.wet >= 0.32 && c.tyre !== 'I' && this.rng.chance(0.45 + this.wet * 0.3)) {
        c.pitNext = 'I';
        return;
      }
      if (this.wet < 0.22 && c.tyre === 'I' && this.rng.chance(0.5)) {
        c.pitNext = lapNow > laps * 0.7 ? 'S' : 'M';
        return;
      }
      if (this.pitRule === 'none') return;
      // Safety car opportunity
      if (this.sc > 0 && this.scDeployedStep === this.step - 1 && c.plan.length && c.plan[0].lap - lapNow < laps * 0.18 && this.rng.chance(0.75)) {
        c.pitNext = c.plan[0].tyre;
        return;
      }
      if (c.plan.length && lapNow + this.lapsPerStep >= c.plan[0].lap) {
        c.pitNext = this.wet >= 0.3 ? 'I' : c.plan[0].tyre;
      }
    });
  }

  /** When true the engine will not make automatic pit calls for the player. */
  playerPitControl = false;

  simulateStep(): Snapshot {
    if (this.finished) return this.snapshots[this.snapshots.length - 1];
    this.step += 1;
    this.buf = [];
    const r = this.rng;
    const lps = this.lapsPerStep;
    const t = this.cfg.track;
    this.updateWeather();
    this.decidePits();

    const prevOrder = this.order().filter((i) => this.cars[i].status === 'run');
    const prevTotals = this.cars.map((c) => c.total);
    const newTotal: number[] = this.cars.map((c) => c.total);
    const stepTimes: number[] = this.cars.map(() => 0);
    const scActive = this.sc > 0;

    // Base times, pits, mistakes, failures
    for (const i of prevOrder) {
      const c = this.cars[i];
      const e = this.cfg.entries[i];
      const lap = this.expectedLap(i);
      const noiseSd = this.refLap * 0.0024 * (1.35 - e.skills.consistency / 100) * Math.sqrt(lps);
      let time = lap * lps + r.normal(0, noiseSd);
      if (this.step === 1) {
        time += r.normal(0, 0.45) - (e.skills.racecraft - 60) * 0.012 - (e.aggression - 50) * 0.006 - c.startMod * 0.35;
      }
      // Pit stop
      if (c.pitNext) {
        const loss = this.pitLoss(i);
        time += loss;
        const lapNow = this.step * lps;
        const newTyre = c.pitNext;
        c.pitted = true;
        c.stops += 1;
        c.tyre = newTyre;
        c.tyreAge = 0;
        c.mandatoryDone = true;
        c.damage *= 0.3;
        c.plan = c.plan.filter((p) => p.lap > lapNow + lps * 1.5);
        if (newTyre !== 'I' && this.pitRule === 'strategy' && !c.plan.length && lapNow < this.cfg.round.laps * 0.62 && r.chance(0.5)) {
          c.plan.push({ lap: Math.round(lapNow + (this.cfg.round.laps - lapNow) * 0.5), tyre: 'M' });
        }
        c.pitNext = undefined;
        if (this.isPlayer(i) || (this.pitRule !== 'endurance' && this.pitRule !== 'fuel')) {
          this.log({ kind: 'pit', a: i, text: `${this.name(i)} pits for ${tyreName(newTyre)} (${(loss).toFixed(1)}s)`, player: this.isPlayer(i) });
        }
      }
      if (c.penalty > 0) {
        time += c.penalty;
        c.penalty = 0;
      }
      if (scActive) {
        time = this.refLap * lps * 1.38 + (c.pitted ? this.pitLoss(i) * 0.9 : 0);
      } else {
        // Mistakes
        const p = personality(e.personality);
        const mistakeP =
          0.0036 *
          lps *
          (1.65 - e.skills.consistency / 100) *
          (1 + 2.2 * this.wet) *
          (0.7 + e.aggression / 150) *
          (0.65 + t.danger) *
          p.incidentMult *
          (c.mode === 1 ? 1.7 : c.mode === -1 ? 0.7 : 1) *
          (c.tyre !== 'I' && this.wet > 0.35 ? 2.2 : 1);
        if (r.chance(mistakeP)) {
          const roll = r.next();
          if (roll < 0.07 + t.danger * 0.05) {
            this.retire(i, 'crash');
            this.log({ kind: 'crash', a: i, text: `${this.name(i)} crashes out!`, player: this.isPlayer(i) });
            this.maybeSafetyCar(0.45 + t.danger * 0.45);
            continue;
          } else if (roll < 0.3) {
            const loss = r.float(5, 14);
            time += loss;
            this.log({ kind: 'spin', a: i, text: `${this.name(i)} spins! Loses ${loss.toFixed(0)}s`, player: this.isPlayer(i) });
          } else {
            time += r.float(0.4, 2.4);
            if (this.isPlayer(i)) this.log({ kind: 'mistake', a: i, text: `${this.name(i)} runs wide and loses time`, player: true });
          }
        }
      }
      // Mechanical failure
      const mechP = ((100 - e.reliability) / 100) * 0.0042 * lps * (this.pitRule === 'endurance' ? 0.6 : 1) * c.mechRisk;
      if (r.chance(mechP)) {
        this.retire(i, 'mech');
        this.log({ kind: 'mech', a: i, text: `${this.name(i)} stops on track — ${r.pick(MECH_FAILURES)}!`, player: this.isPlayer(i) });
        this.maybeSafetyCar(0.18 + t.danger * 0.25);
        continue;
      }
      stepTimes[i] = time;
      newTotal[i] = c.total + time;
    }

    // First-lap incidents
    if (this.step === 1 && !scActive) {
      const running = prevOrder.filter((i) => this.cars[i].status === 'run');
      for (let k = 1; k < running.length; k++) {
        const i = running[k];
        const e = this.cfg.entries[i];
        const sm = this.cars[i].startMod;
        const pInc = 0.009 * (0.7 + e.aggression / 100) * (0.6 + t.danger) * (1 + this.wet) * (sm > 0 ? 2.2 : sm < 0 ? 0.5 : 1);
        if (r.chance(pInc)) {
          const other = running[k - 1];
          if (this.cars[other].status === 'run' && this.cars[i].status === 'run') {
            this.applyCollision(i, other, this.rollCollision(), newTotal);
          }
        }
      }
    }

    // Apply forced duels (player decisions)
    const resolvedPairs = new Set<string>();
    for (const f of this.forced) {
      const a = f.attacker;
      const d = f.defender;
      if (this.cars[a].status !== 'run' || this.cars[d].status !== 'run') continue;
      resolvedPairs.add(`${a}:${d}`);
      if (f.outcome === 'pass') {
        newTotal[a] = Math.min(newTotal[a], newTotal[d] - r.float(0.15, 0.45));
        newTotal[d] += r.float(0.05, 0.35);
        this.cars[a].overtakes++;
        this.log({ kind: 'overtake', a, b: d, text: `${this.name(a)} passes ${this.name(d)}!`, player: this.isPlayer(a) || this.isPlayer(d) });
      } else if (f.outcome === 'held') {
        newTotal[a] = Math.max(newTotal[a], newTotal[d] + r.float(0.3, 0.8));
      } else if (f.outcome === 'collision' && f.collision) {
        this.applyCollision(a, d, f.collision, newTotal);
      }
    }
    this.forced = [];

    // Safety car bunching / overtakes
    if (scActive) {
      const run = prevOrder.filter((i) => this.cars[i].status === 'run');
      const leaderT = newTotal[run[0]] ?? 0;
      run.forEach((i, k) => {
        const gap = prevTotals[i] - prevTotals[run[0]];
        const target = k * 0.55;
        const g = target + Math.max(0, gap - target) * 0.28;
        newTotal[i] = leaderT + g + (this.cars[i].pitted ? this.pitLoss(i) * 0.5 : 0);
      });
      this.sc -= 1;
      if (this.sc === 0) {
        this.log({ kind: 'scEnd', text: 'Safety car in this lap — get ready for the restart!' });
        this.restart = true;
      }
    } else {
      this.resolveOvertakes(prevOrder, newTotal, resolvedPairs);
      this.restart = false;
    }

    // Commit
    for (let i = 0; i < this.cars.length; i++) {
      const c = this.cars[i];
      if (c.status !== 'run') continue;
      const stepTime = newTotal[i] - c.total;
      c.total = newTotal[i];
      c.last = stepTime / lps;
      c.tyreAge += lps;
      if (c.modeSteps > 0) {
        c.modeSteps -= 1;
        if (c.modeSteps === 0) c.mode = 0;
      }
      if (!c.pitted && !scActive && c.last < c.best) {
        c.best = c.last;
        if (c.last < this.fastest.time) {
          this.fastest = { idx: i, time: c.last };
          if (this.step > this.steps * 0.5 && this.isPlayer(i)) {
            this.log({ kind: 'fastest', a: i, text: `Fastest lap for ${this.name(i)}: ${fmtLap(c.last)}`, player: true });
          }
        }
      }
      void stepTimes;
    }

    // Mandatory stop penalty at the flag
    if (this.step >= this.steps) {
      if (this.pitRule === 'mandatory') {
        this.cars.forEach((c, i) => {
          if (c.status === 'run' && !c.mandatoryDone) {
            c.total += 25;
            this.log({ kind: 'penalty', a: i, text: `${this.name(i)} penalised: no mandatory stop`, player: this.isPlayer(i) });
          }
        });
      }
      this.finished = true;
    }

    const ord = this.order();
    const newLeader = ord[0];
    if (newLeader !== this.leaderIdx && this.step > 1 && this.cars[newLeader].status === 'run') {
      this.log({ kind: 'lead', a: newLeader, text: `${this.name(newLeader)} takes the lead!`, player: this.isPlayer(newLeader) });
    }
    this.leaderIdx = newLeader;
    if (this.finished) {
      this.log({ kind: 'finish', a: newLeader, text: `${this.name(newLeader)} takes the chequered flag!`, player: this.isPlayer(newLeader) });
    }
    const snap = this.snapshot(this.buf);
    this.snapshots.push(snap);
    return snap;
  }

  private resolveOvertakes(prevOrder: number[], newTotal: number[], resolved: Set<string>) {
    const r = this.rng;
    const t = this.cfg.track;
    const arr = prevOrder.filter((i) => this.cars[i].status === 'run');
    const maxPasses = Math.min(4, Math.ceil(2 * this.lapsPerStep));
    const passes = new Map<number, number>();
    for (let k = 1; k < arr.length; k++) {
      let j = k;
      while (j > 0) {
        const b = arr[j];
        const a = arr[j - 1];
        const cb = this.cars[b];
        const ca = this.cars[a];
        if (cb.status !== 'run' || ca.status !== 'run') break;
        if (resolved.has(`${b}:${a}`) || resolved.has(`${a}:${b}`) || cb.pitted || ca.pitted) {
          if (newTotal[b] < newTotal[a]) {
            [arr[j - 1], arr[j]] = [arr[j], arr[j - 1]];
            j--;
            continue;
          }
          break;
        }
        const minGap = MIN_GAP * Math.sqrt(this.lapsPerStep);
        if (newTotal[b] >= newTotal[a] + minGap) break;
        if ((passes.get(b) ?? 0) >= maxPasses) {
          newTotal[b] = Math.max(newTotal[b], newTotal[a] + r.float(0.25, 0.6));
          break;
        }
        const eb = this.cfg.entries[b];
        const ea = this.cfg.entries[a];
        const adv = newTotal[a] + minGap - newTotal[b];
        const pb = personality(eb.personality);
        const pa = personality(ea.personality);
        let pPass =
          0.1 +
          t.overtaking * 0.55 +
          Math.min(adv, 2.5) * 0.22 +
          (eb.skills.racecraft - ea.skills.racecraft) * 0.006 +
          (eb.aggression - 50) * 0.0022 -
          (ea.aggression - 50) * 0.0012 +
          (pb.duel - pa.duel) * 0.02 +
          (ca.tyreAge - cb.tyreAge) * 0.003 +
          (this.restart ? 0.1 : 0);
        pPass = clamp(pPass, 0.04, 0.92);
        const pColl =
          0.011 *
          ((eb.aggression + ea.aggression) / 100) *
          (1.6 - (eb.skills.consistency + ea.skills.consistency) / 200) *
          (0.55 + t.danger) *
          (1 + this.wet * 0.8) *
          pb.incidentMult;
        const roll = r.next();
        const involvesPlayer = eb.isPlayer || ea.isPlayer;
        if (roll < pColl) {
          this.applyCollision(b, a, this.rollCollision(), newTotal);
          if (involvesPlayer) this.battles.push({ rival: eb.isPlayer ? a : b, won: false, kind: 'collision' });
          break;
        } else if (roll < pColl + pPass) {
          if (newTotal[b] > newTotal[a] - 0.12) newTotal[b] = newTotal[a] - r.float(0.12, 0.4);
          newTotal[a] += r.float(0.03, 0.3);
          cb.overtakes++;
          passes.set(b, (passes.get(b) ?? 0) + 1);
          [arr[j - 1], arr[j]] = [arr[j], arr[j - 1]];
          if (involvesPlayer) {
            this.battles.push({ rival: eb.isPlayer ? a : b, won: eb.isPlayer, kind: eb.isPlayer ? 'pass' : 'defend' });
            this.log({ kind: 'overtake', a: b, b: a, text: `${this.name(b)} gets past ${this.name(a)}`, player: true });
          } else if (this.step > 1 && (j - 1 === 0 || r.chance(0.12))) {
            this.log({ kind: 'overtake', a: b, b: a, text: `${this.name(b)} overtakes ${this.name(a)} for P${j}` });
          }
          j--;
        } else {
          newTotal[b] = Math.max(newTotal[b], newTotal[a] + r.float(0.22, 0.6));
          if (involvesPlayer && ea.isPlayer && r.chance(0.3)) this.battles.push({ rival: b, won: true, kind: 'defend' });
          break;
        }
      }
    }
  }

  rollCollision(): CollisionResult {
    const r = this.rng.next();
    if (r < 0.42) return 'bothContinue';
    if (r < 0.55) return 'attackerSpin';
    if (r < 0.66) return 'defenderSpin';
    if (r < 0.81) return 'attackerOut';
    if (r < 0.9) return 'defenderOut';
    return 'bothOut';
  }

  applyCollision(att: number, def: number, res: CollisionResult, newTotal: number[]) {
    const r = this.rng;
    const pl = this.isPlayer(att) || this.isPlayer(def);
    const na = this.name(att);
    const nd = this.name(def);
    switch (res) {
      case 'bothContinue':
        newTotal[att] += r.float(1.5, 5);
        newTotal[def] += r.float(1, 4);
        this.cars[r.chance(0.5) ? att : def].damage += r.float(0.002, 0.008);
        this.log({ kind: 'collision', a: att, b: def, text: `Contact! ${na} and ${nd} touch — both continue`, player: pl });
        break;
      case 'attackerSpin':
        newTotal[att] += r.float(8, 18);
        this.log({ kind: 'collision', a: att, b: def, text: `${na} tags ${nd} and spins!`, player: pl });
        break;
      case 'defenderSpin':
        newTotal[def] += r.float(8, 18);
        this.log({ kind: 'collision', a: att, b: def, text: `${na} punts ${nd} into a spin!`, player: pl });
        if (r.chance(0.35)) {
          this.cars[att].penalty += 5;
          this.log({ kind: 'penalty', a: att, text: `5-second penalty for ${na}`, player: this.isPlayer(att) });
        }
        break;
      case 'attackerOut':
        this.retire(att, 'collision');
        newTotal[def] += r.float(1, 6);
        this.log({ kind: 'collision', a: att, b: def, text: `${na} crashes out after contact with ${nd}!`, player: pl });
        this.maybeSafetyCar(0.55 + this.cfg.track.danger * 0.35);
        break;
      case 'defenderOut':
        this.retire(def, 'collision');
        this.log({ kind: 'collision', a: att, b: def, text: `${nd} is out after being hit by ${na}!`, player: pl });
        this.cars[att].penalty += 5;
        this.maybeSafetyCar(0.55 + this.cfg.track.danger * 0.35);
        break;
      case 'bothOut':
        this.retire(att, 'collision');
        this.retire(def, 'collision');
        this.log({ kind: 'collision', a: att, b: def, text: `Huge crash! ${na} and ${nd} are both out!`, player: pl });
        this.maybeSafetyCar(0.85);
        break;
    }
  }

  retire(i: number, reason: CarState['outReason']) {
    const c = this.cars[i];
    if (c.status === 'out') return;
    c.status = 'out';
    c.outReason = reason;
    c.outStep = this.step;
  }

  maybeSafetyCar(p: number) {
    if (this.sc > 0 || this.step >= this.steps - 1) return;
    if (this.rng.chance(p)) {
      this.sc = Math.max(1, Math.round(this.rng.int(2, 4) / this.lapsPerStep));
      this.scDeployedStep = this.step;
      this.log({ kind: 'sc', text: this.cfg.series.discipline === 'american' ? 'Full-course caution! The field is neutralised.' : 'SAFETY CAR deployed!' });
    }
  }

  snapshot(events: RaceEvent[]): Snapshot {
    const order = this.order();
    const leader = order[0];
    const lt = this.cars[leader]?.total ?? 0;
    return {
      step: this.step,
      lap: this.displayLap(),
      order,
      gaps: this.cars.map((c) => (c.status === 'run' ? c.total - lt : NaN)),
      status: this.cars.map((c) => c.status),
      pitted: this.cars.map((c) => c.pitted),
      tyres: this.cars.map((c) => c.tyre),
      flag: this.sc > 0 ? 'sc' : 'green',
      wet: this.wet,
      refLap: this.cars[leader] ? this.expectedLap(leader) * this.lapsPerStep : this.refLap,
      events,
    };
  }

  /** Run to the end without any interaction. */
  runToEnd() {
    while (!this.finished) this.simulateStep();
  }

  // -------------------------------------------------------------------------
  // Results
  // -------------------------------------------------------------------------

  classification(): { order: number[]; dnf: number[]; fastest: number } {
    const order = this.order();
    return {
      order,
      dnf: order.filter((i) => this.cars[i].status === 'out'),
      fastest: this.fastest.idx,
    };
  }

  gapText(i: number): string {
    const c = this.cars[i];
    if (c.status === 'out') return 'OUT';
    const ord = this.order();
    const leader = ord[0];
    if (i === leader) return 'LEADER';
    const gap = c.total - this.cars[leader].total;
    const lapT = this.expectedLap(leader);
    if (gap >= lapT) {
      const l = Math.floor(gap / lapT);
      return `+${l} LAP${l > 1 ? 'S' : ''}`;
    }
    return `+${gap.toFixed(gap < 10 ? 1 : 0)}s`;
  }
}

export const MECH_FAILURES = ['engine failure', 'gearbox failure', 'hydraulics failure', 'power unit issue', 'suspension failure', 'brake failure', 'electrical fault'];

export function tyreName(c: Compound): string {
  return c === 'S' ? 'softs' : c === 'M' ? 'mediums' : c === 'H' ? 'hards' : 'intermediates';
}

export function fmtLap(t: number): string {
  if (!isFinite(t)) return '-';
  const m = Math.floor(t / 60);
  const s = t - m * 60;
  return `${m}:${s.toFixed(3).padStart(6, '0')}`;
}

/** Qualifying: returns entry indices in grid order. */
export function qualify(entries: EngineEntry[], s: SeriesDef, wet: number, rng: Rng, playerPush?: 'push' | 'banker'): { grid: number[]; playerMistake: boolean } {
  let playerMistake = false;
  const scores = entries.map((e, i) => {
    const w = wet * 0.6;
    const drv = (e.skills.pace * 0.88 + e.skills.consistency * 0.12) * (1 - w) + e.skills.wet * w;
    let q = s.carImportance * e.car + (1 - s.carImportance) * (e.crewPerf !== undefined ? (drv + e.crewPerf) / 2 : drv) + e.form + rng.normal(0, 1.4);
    if (e.isPlayer && playerPush === 'push') {
      if (rng.chance(0.2)) {
        q -= rng.float(4, 9);
        playerMistake = true;
      } else q += 1.6;
    }
    return { i, q };
  });
  scores.sort((a, b) => b.q - a.q);
  return { grid: scores.map((x) => x.i), playerMistake };
}

/** Weather plan for a race. */
export function makeWeather(track: TrackDef, steps: number, rng: Rng, forceWet = false): WeatherPlan {
  const rainy = forceWet || rng.chance(track.rain);
  if (!rainy) return { initial: 0, changes: [] };
  const style = rng.next();
  if (style < 0.35) {
    // Wet from the start, may dry
    const dries = rng.chance(0.5);
    return { initial: rng.float(0.45, 0.9), changes: dries ? [{ step: Math.round(steps * rng.float(0.4, 0.7)), target: 0 }] : [] };
  }
  if (style < 0.75) {
    // Rain arrives mid-race
    const at = Math.round(steps * rng.float(0.2, 0.7));
    const heavy = rng.chance(0.6);
    const changes = [{ step: at, target: heavy ? rng.float(0.55, 1) : rng.float(0.3, 0.45) }];
    if (!heavy || rng.chance(0.3)) changes.push({ step: Math.min(steps - 2, at + rng.int(3, 8)), target: 0 });
    return { initial: 0, changes };
  }
  // Brief shower
  const at = Math.round(steps * rng.float(0.25, 0.6));
  return { initial: 0, changes: [{ step: at, target: rng.float(0.35, 0.6) }, { step: at + rng.int(2, 4), target: 0 }] };
}

/**
 * Player decision moments during a race and how each choice resolves.
 * Moments are detected between engine steps. Resolving one returns narrative
 * text, optional career effects and a highlight to play, and queues the
 * outcome into the engine for the next step.
 */
import { personality } from '../../content/traits';
import { clamp, Rng } from '../rng';
import type { HighlightKind } from '../types';
import type { CollisionResult, RaceEngine } from './engine';

export type MomentType =
  | 'start'
  | 'attack'
  | 'defend'
  | 'safetyCar'
  | 'rain'
  | 'drying'
  | 'tyres'
  | 'teamOrdersLetBy'
  | 'teamOrdersAsk'
  | 'mechanical'
  | 'lastLapAttack'
  | 'lastLapDefend'
  | 'night'
  | 'traffic';

export interface MomentOption {
  id: string;
  label: string;
  hint: string;
  risk: 0 | 1 | 2;
  emoji: string;
}

export interface Moment {
  type: MomentType;
  step: number;
  at: number;
  rival?: number;
  title: string;
  text: string;
  options: MomentOption[];
  auto: string;
  importance: 1 | 2 | 3;
}

export interface MomentEffects {
  teamRelation?: number;
  teammateRelation?: number;
  fans?: number;
  reputation?: number;
  morale?: number;
  rivalHeat?: number;
}

export interface MomentHighlight {
  kind: HighlightKind;
  actors: number[];
  caption: string;
  sub?: string;
  /** Engine step the moment happened on (defaults to the current step). */
  step?: number;
}

export interface MomentResolution {
  text: string;
  good: boolean | null;
  effects?: MomentEffects;
  highlight?: MomentHighlight;
}

const MAX_MOMENTS = 7;

export class MomentDirector {
  used: Record<string, number> = {};
  count = 0;
  lastStep = -10;
  private prevWet: number;
  rng: Rng;

  constructor(
    public engine: RaceEngine,
    seed: number,
  ) {
    this.rng = new Rng(seed ^ 0x5bd1e995);
    this.prevWet = engine.wet;
  }

  private surname(i: number) {
    const n = this.engine.entries[i].name;
    const parts = n.split(' ');
    return parts.length > 1 ? parts.slice(1).join(' ') : n;
  }

  private get oval() {
    return this.engine.cfg.track.kind === 'oval';
  }

  private get endurance() {
    return !!this.engine.cfg.round.hours;
  }

  /** Detect a moment that applies to the next step. */
  detect(): Moment | null {
    const e = this.engine;
    const p = e.playerIndex;
    if (p < 0 || e.finished) return null;
    const c = e.cars[p];
    if (c.status !== 'run') return null;
    const next = e.step + 1;
    const r = this.rng;
    const at = (lo: number, hi: number) => r.float(lo, hi);

    if (e.step === 0 && !this.used.start) {
      this.used.start = next;
      return this.startMoment();
    }

    const wetNow = e.wet;
    const wetPrev = this.prevWet;
    this.prevWet = wetNow;

    const order = e.order().filter((i) => e.cars[i].status === 'run');
    const pos = order.indexOf(p);
    const ahead = pos > 0 ? order[pos - 1] : -1;
    const behind = pos >= 0 && pos < order.length - 1 ? order[pos + 1] : -1;
    const scale = Math.sqrt(e.lapsPerStep);
    const gapA = ahead >= 0 ? c.total - e.cars[ahead].total : Infinity;
    const gapB = behind >= 0 ? e.cars[behind].total - c.total : Infinity;
    const lapNow = e.step * e.lapsPerStep;
    const lapsLeft = e.cfg.round.laps - lapNow;
    const spaced = next - this.lastStep >= 2;
    const budget = this.count < MAX_MOMENTS;

    // Final step duels
    if (next === e.steps && !this.used.lastLap) {
      if (ahead >= 0 && gapA < 1.4 * scale) {
        this.used.lastLap = next;
        return this.duelMoment('lastLapAttack', ahead, at(0.55, 0.85), 3);
      }
      if (behind >= 0 && gapB < 1.0 * scale) {
        this.used.lastLap = next;
        return this.duelMoment('lastLapDefend', behind, at(0.55, 0.85), 3);
      }
    }
    if (!budget) return null;

    if (e.sc > 0 && e.scDeployedStep === e.step && e.pitRule !== 'none' && !this.used[`sc${e.step}`] && lapsLeft > 4) {
      this.used[`sc${e.step}`] = next;
      return this.mark(this.simple('safetyCar', 0.85, 2));
    }
    if (wetPrev < 0.3 && wetNow >= 0.3 && c.tyre !== 'I' && !this.used.rain && lapsLeft > 3) {
      this.used.rain = next;
      return this.mark(this.simple('rain', 0.8, 3));
    }
    if (wetPrev >= 0.28 && wetNow < 0.28 && c.tyre === 'I' && !this.used.drying && lapsLeft > 3) {
      this.used.drying = next;
      return this.mark(this.simple('drying', 0.8, 2));
    }
    if (!spaced || e.sc > 0) return null;

    // Team orders
    const tm = e.entries.findIndex((x) => x.isTeammate);
    if (tm >= 0 && e.cars[tm].status === 'run' && !this.used.teamOrders && next > e.steps * 0.3 && next < e.steps - 1) {
      const me = e.entries[p];
      const mate = e.entries[tm];
      if (behind === tm && gapB < 1.0 * scale && (mate.champPos ?? 99) < (me.champPos ?? 99) - 1 && e.expectedLap(tm) < e.expectedLap(p) && r.chance(0.6)) {
        this.used.teamOrders = next;
        return this.mark(this.duelMoment('teamOrdersLetBy', tm, at(0.4, 0.7), 2));
      }
      if (ahead === tm && gapA < 1.0 * scale && e.expectedLap(p) < e.expectedLap(tm) - 0.1 && r.chance(0.5)) {
        this.used.teamOrders = next;
        return this.mark(this.duelMoment('teamOrdersAsk', tm, at(0.4, 0.7), 2));
      }
    }

    // Attack
    const lastAttack = this.used.attack ?? -10;
    if (ahead >= 0 && gapA < 1.0 * scale && next - lastAttack >= 3 && e.expectedLap(p) < e.expectedLap(ahead) + 0.15 && r.chance(0.6)) {
      this.used.attack = next;
      return this.mark(this.duelMoment('attack', ahead, at(0.35, 0.8), pos <= 3 ? 3 : 2));
    }
    const lastDefend = this.used.defend ?? -10;
    if (behind >= 0 && gapB < 0.8 * scale && next - lastDefend >= 3 && e.expectedLap(behind) < e.expectedLap(p) - 0.05 && r.chance(0.55)) {
      this.used.defend = next;
      return this.mark(this.duelMoment('defend', behind, at(0.35, 0.8), pos <= 2 ? 3 : 2));
    }

    // Tyres
    if (['strategy', 'mandatory', 'fuel'].includes(e.pitRule) && !this.used.tyres && lapsLeft >= 5 && e.cfg.series.id !== 'american') {
      const life = c.tyre === 'S' ? 20 : c.tyre === 'M' ? 30 : c.tyre === 'H' ? 42 : 36;
      const planSoon = c.plan.length && c.plan[0].lap - lapNow < 4;
      if (c.tyreAge > life * 0.85 && !planSoon) {
        this.used.tyres = next;
        return this.mark(this.simple('tyres', 0.6, 1));
      }
    }

    // Endurance flavour
    if (this.endurance) {
      const hours = e.cfg.round.hours ?? 6;
      if (hours >= 12 && !this.used.night && next > e.steps * 0.4 && next < e.steps * 0.6) {
        this.used.night = next;
        return this.mark(this.simple('night', 0.5, 2));
      }
      if (!this.used.traffic && next > e.steps * 0.15 && r.chance(0.08)) {
        this.used.traffic = next;
        return this.mark(this.simple('traffic', at(0.3, 0.7), 1));
      }
    }

    // Mechanical scare
    const ent = e.entries[p];
    if (!this.used.mech && next > e.steps * 0.2 && next < e.steps * 0.85 && r.chance((100 - ent.reliability) * 0.0005 * e.lapsPerStep)) {
      this.used.mech = next;
      return this.mark(this.simple('mechanical', 0.5, 2));
    }
    return null;
  }

  private mark(m: Moment): Moment {
    this.count++;
    this.lastStep = m.step;
    return m;
  }

  // -------------------------------------------------------------------------
  // Moment builders
  // -------------------------------------------------------------------------

  private startMoment(): Moment {
    const e = this.engine;
    const pos = e.cfg.grid.indexOf(e.playerIndex) + 1;
    const rolling = this.oval;
    const agg = e.entries[e.playerIndex].aggression;
    return {
      type: 'start',
      step: 1,
      at: 0,
      title: rolling ? 'Green flag' : 'Lights out',
      text: rolling
        ? `Rolling start from P${pos}. The pace car peels off...`
        : `Starting P${pos}. Five red lights. How do you want to launch?`,
      options: [
        { id: 'launch', label: 'Aggressive launch', hint: 'Gain places, risk turn-1 chaos', risk: 2, emoji: '🚀' },
        { id: 'clean', label: 'Clean getaway', hint: 'Keep it tidy through turn 1', risk: 0, emoji: '🧘' },
      ],
      auto: agg > 62 ? 'launch' : 'clean',
      importance: 2,
    };
  }

  private duelMoment(type: MomentType, rival: number, at: number, importance: 1 | 2 | 3): Moment {
    const e = this.engine;
    const p = e.playerIndex;
    const name = this.surname(rival);
    const pos = e.positionOf(p);
    const c = e.cars[p];
    const gap = Math.abs(c.total - e.cars[rival].total).toFixed(1);
    const lap = e.displayLap(e.step + 1);
    const lapLabel = this.endurance ? `Hour ${this.hour(e.step + 1)}` : `Lap ${lap}`;
    const agg = e.entries[p].aggression;
    const oval = this.oval;
    switch (type) {
      case 'attack':
        return {
          type,
          step: e.step + 1,
          at,
          rival,
          title: `${lapLabel} · Attack`,
          text: oval
            ? `You're in ${name}'s slipstream for P${pos - 1}, ${gap}s back. The run is on.`
            : `You're ${gap}s behind ${name} for P${pos - 1}. A gap is opening into the braking zone.`,
          options: [
            { id: 'send', label: oval ? 'Pull out and go' : 'Send it', hint: 'Big chance, big crash risk', risk: 2, emoji: '🔥' },
            { id: 'pressure', label: 'Pressure them', hint: 'Force a mistake, low risk', risk: 1, emoji: '😤' },
            { id: 'wait', label: 'Bide your time', hint: 'Save tyres for later', risk: 0, emoji: '⏳' },
          ],
          auto: agg > 65 ? 'send' : agg > 35 ? 'pressure' : 'wait',
          importance,
        };
      case 'defend':
        return {
          type,
          step: e.step + 1,
          at,
          rival,
          title: `${lapLabel} · Under attack`,
          text: `${name} is ${gap}s behind and faster. They want P${pos}.`,
          options: [
            { id: 'block', label: 'Hard defence', hint: 'Slam the door. Contact risk', risk: 2, emoji: '🧱' },
            { id: 'cover', label: 'Cover the inside', hint: 'Solid, low risk', risk: 1, emoji: '🛡️' },
            { id: 'letgo', label: 'Let them go', hint: 'Lose the place, save tyres', risk: 0, emoji: '👋' },
          ],
          auto: agg > 65 ? 'block' : 'cover',
          importance,
        };
      case 'lastLapAttack':
        return {
          type,
          step: e.step + 1,
          at,
          rival,
          title: 'Final lap!',
          text: `Last lap. ${name} is ${gap}s ahead for P${pos - 1}. One chance left.`,
          options: [
            { id: 'send', label: 'All or nothing', hint: 'Dive-bomb for the place', risk: 2, emoji: '🎲' },
            { id: 'pressure', label: 'Pressure to the line', hint: 'Hope they crack', risk: 1, emoji: '😤' },
            { id: 'wait', label: 'Bring it home', hint: 'Take the points', risk: 0, emoji: '🏁' },
          ],
          auto: agg > 55 ? 'send' : 'pressure',
          importance,
        };
      case 'lastLapDefend':
        return {
          type,
          step: e.step + 1,
          at,
          rival,
          title: 'Final lap!',
          text: `Last lap. ${name} is right on your gearbox, ${gap}s behind. Hold P${pos}!`,
          options: [
            { id: 'block', label: 'Defend at all costs', hint: 'Whatever it takes', risk: 2, emoji: '🧱' },
            { id: 'cover', label: 'Cover the inside', hint: 'Textbook defence', risk: 1, emoji: '🛡️' },
            { id: 'letgo', label: "Don't risk it", hint: 'Points are points', risk: 0, emoji: '🙏' },
          ],
          auto: 'cover',
          importance,
        };
      case 'teamOrdersLetBy':
        return {
          type,
          step: e.step + 1,
          at,
          rival,
          title: 'Team orders',
          text: `Radio: "${name} is faster and fighting for the title. Let them through."`,
          options: [
            { id: 'obey', label: 'Let them by', hint: 'Team player. Lose the place', risk: 0, emoji: '🤝' },
            { id: 'ignore', label: 'Ignore the call', hint: 'Keep the place. Team fury', risk: 2, emoji: '🙉' },
          ],
          auto: e.entries[p].personality === 'bigEgo' || e.entries[p].personality === 'hothead' ? 'ignore' : 'obey',
          importance,
        };
      case 'teamOrdersAsk':
        return {
          type,
          step: e.step + 1,
          at,
          rival,
          title: 'Stuck behind your teammate',
          text: `You're faster than ${name}, but they won't move over.`,
          options: [
            { id: 'ask', label: 'Ask for a swap', hint: 'The pit wall decides', risk: 0, emoji: '📻' },
            { id: 'send', label: 'Race them', hint: 'Pass them yourself. Risky', risk: 2, emoji: '⚔️' },
            { id: 'hold', label: 'Hold station', hint: 'Keep the peace', risk: 0, emoji: '🕊️' },
          ],
          auto: 'ask',
          importance,
        };
      default:
        return this.simple(type, at, importance);
    }
  }

  private hour(step: number): number {
    const e = this.engine;
    return Math.max(1, Math.ceil(((e.cfg.round.hours ?? 6) * step) / e.steps));
  }

  private simple(type: MomentType, at: number, importance: 1 | 2 | 3): Moment {
    const e = this.engine;
    const p = e.playerIndex;
    const c = e.cars[p];
    const lap = e.displayLap(e.step + 1);
    const lapLabel = this.endurance ? `Hour ${this.hour(e.step + 1)}` : `Lap ${lap}`;
    const pos = e.positionOf(p);
    const base = { type, step: e.step + 1, at, importance } as const;
    switch (type) {
      case 'safetyCar':
        return {
          ...base,
          title: `${lapLabel} · ${e.cfg.series.discipline === 'american' ? 'Caution' : 'Safety car'}`,
          text: `The field is neutralised. You're P${pos} on ${c.tyreAge.toFixed(0)}-lap-old tyres. Cheap pit stop?`,
          options: [
            { id: 'box', label: 'Box, box!', hint: 'Fresh tyres, lose track position', risk: 1, emoji: '🔧' },
            { id: 'stay', label: 'Stay out', hint: 'Keep your place', risk: 1, emoji: '📍' },
          ],
          auto: c.tyreAge > 12 ? 'box' : 'stay',
        };
      case 'rain':
        return {
          ...base,
          title: `${lapLabel} · Rain!`,
          text: `It's raining and you're on slicks in P${pos}. The radar is unclear.`,
          options: [
            { id: 'box', label: 'Box for inters', hint: 'Safe call', risk: 0, emoji: '🌧️' },
            { id: 'stay', label: 'Stay out on slicks', hint: 'Gamble it stops', risk: 2, emoji: '🎲' },
          ],
          auto: 'box',
        };
      case 'drying':
        return {
          ...base,
          title: `${lapLabel} · Drying line`,
          text: `A dry line is appearing. Intermediates are overheating.`,
          options: [
            { id: 'box', label: 'Slicks now', hint: 'Be first to switch', risk: 1, emoji: '☀️' },
            { id: 'stay', label: 'One more lap', hint: 'Let others test it', risk: 1, emoji: '⏳' },
          ],
          auto: 'box',
        };
      case 'tyres':
        return {
          ...base,
          title: `${lapLabel} · Tyres going off`,
          text: `Your ${c.tyre === 'S' ? 'softs' : c.tyre === 'M' ? 'mediums' : 'hards'} are fading and you're P${pos}.`,
          options: [
            { id: 'push', label: 'Push anyway', hint: 'Faster now, risk the cliff', risk: 2, emoji: '💨' },
            { id: 'manage', label: 'Manage them', hint: 'Slower but safe', risk: 0, emoji: '🧮' },
            { id: 'box', label: 'Extra stop', hint: 'Fresh softs, lose time', risk: 1, emoji: '🔧' },
          ],
          auto: 'manage',
        };
      case 'mechanical':
        return {
          ...base,
          title: `${lapLabel} · Warning light`,
          text: `Engineer: "We're seeing temperatures climbing. Your call."`,
          options: [
            { id: 'nurse', label: 'Nurse it home', hint: 'Lose pace, save the car', risk: 0, emoji: '🩺' },
            { id: 'push', label: 'Ignore it', hint: 'Keep pace. It might blow', risk: 2, emoji: '🙈' },
          ],
          auto: 'nurse',
        };
      case 'night':
        return {
          ...base,
          title: `${lapLabel} · Night stint`,
          text: `It's 3 a.m. You're P${pos}. The track is cold, the headlights are dim.`,
          options: [
            { id: 'push', label: 'Attack the night', hint: 'Gain time, risk a mistake', risk: 2, emoji: '🌙' },
            { id: 'manage', label: 'Look after the car', hint: 'Reliability first', risk: 0, emoji: '🛠️' },
          ],
          auto: 'manage',
        };
      case 'traffic':
        return {
          ...base,
          title: `${lapLabel} · Traffic`,
          text: `A slower-class car is weaving into the next braking zone.`,
          options: [
            { id: 'risky', label: 'Go around the outside', hint: 'Gain seconds, risk contact', risk: 2, emoji: '↗️' },
            { id: 'patient', label: 'Wait for the straight', hint: 'Lose a little time', risk: 0, emoji: '🕰️' },
          ],
          auto: 'patient',
        };
      default:
        return { ...base, title: 'Decision', text: '', options: [], auto: '' };
    }
  }

  // -------------------------------------------------------------------------
  // Resolution
  // -------------------------------------------------------------------------

  resolve(m: Moment, optionId: string): MomentResolution {
    const res = this.resolveOption(m, optionId);
    // Stamp when it happened so saved clips show the right lap.
    if (res.highlight && res.highlight.step === undefined) res.highlight.step = this.engine.step + 1;
    return res;
  }

  private resolveOption(m: Moment, optionId: string): MomentResolution {
    const e = this.engine;
    const p = e.playerIndex;
    const r = this.rng;
    const c = e.cars[p];
    const me = this.surname(p);
    switch (m.type) {
      case 'start': {
        c.startMod = optionId === 'launch' ? 2.2 : -1;
        return {
          text: optionId === 'launch' ? 'Maximum attack off the line!' : 'Smooth and tidy — focus on turn 1.',
          good: null,
          highlight: { kind: 'start', actors: [p], caption: e.cfg.track.kind === 'oval' ? 'GREEN FLAG!' : 'LIGHTS OUT!', sub: e.cfg.round.name },
        };
      }
      case 'attack':
      case 'lastLapAttack':
        return this.resolveAttack(m, optionId);
      case 'defend':
      case 'lastLapDefend':
        return this.resolveDefend(m, optionId);
      case 'teamOrdersLetBy': {
        const tm = m.rival!;
        if (optionId === 'obey') {
          e.forced.push({ attacker: tm, defender: p, outcome: 'pass' });
          return {
            text: 'You lift and wave your teammate through. The pit wall thanks you.',
            good: null,
            effects: { teamRelation: 8, teammateRelation: 6, morale: -3 },
            highlight: { kind: 'overtake', actors: [tm, p], caption: 'TEAM ORDERS', sub: `${this.surname(tm)} is let through` },
          };
        }
        e.forced.push({ attacker: tm, defender: p, outcome: 'held' });
        return {
          text: '"Copy." You don\'t move. The garage goes very quiet.',
          good: null,
          effects: { teamRelation: -12, teammateRelation: -12, fans: 30, reputation: -1 },
          highlight: { kind: 'defend', actors: [p, tm], caption: 'ORDERS IGNORED', sub: `${me} holds position` },
        };
      }
      case 'teamOrdersAsk': {
        const tm = m.rival!;
        if (optionId === 'ask') {
          const me = e.entries[p];
          const mate = e.entries[tm];
          const agree = (me.champPos ?? 99) < (mate.champPos ?? 99) || r.chance(0.35);
          if (agree) {
            e.forced.push({ attacker: p, defender: tm, outcome: 'pass' });
            return {
              text: 'The team swaps you around. Your teammate is not amused.',
              good: true,
              effects: { teammateRelation: -6 },
              highlight: { kind: 'overtake', actors: [p, tm], caption: 'SWAP!', sub: `${this.surname(tm)} is told to move over` },
            };
          }
          return { text: '"Negative. Hold position." The team says no.', good: false, effects: { morale: -4 } };
        }
        if (optionId === 'hold') return { text: 'You follow your teammate home. Peace in the garage.', good: null, effects: { teamRelation: 3 } };
        const res = this.resolveAttack(m, 'send');
        res.effects = { ...(res.effects ?? {}), teamRelation: -6, teammateRelation: -10 };
        return res;
      }
      case 'safetyCar':
        if (optionId === 'box') {
          c.pitNext = e.wet >= 0.3 ? 'I' : e.cfg.round.laps - e.step * e.lapsPerStep < e.cfg.round.laps * 0.4 ? 'S' : 'M';
          c.plan = c.plan.slice(1);
          return {
            text: 'Into the pits under the safety car — fresh rubber for the restart.',
            good: null,
            highlight: { kind: 'pitStop', actors: [p], caption: 'BOX, BOX!', sub: 'Cheap stop under the safety car' },
          };
        }
        return { text: 'You stay out and keep track position.', good: null, highlight: { kind: 'safetyCar', actors: [p], caption: 'SAFETY CAR', sub: `${me} stays out` } };
      case 'rain': {
        if (optionId === 'box') {
          c.pitNext = 'I';
          return { text: 'Box for intermediates. The safe call.', good: null, highlight: { kind: 'rainStart', actors: [p], caption: 'RAIN!', sub: `${me} pits for inters` } };
        }
        // Gamble: peek at the plan — does it dry soon?
        const plan = e.cfg.weather.changes;
        const dries = plan.some((x) => x.step > e.step && x.step <= e.step + 3 && x.target < 0.25);
        if (dries) {
          c.paceMod += 0;
          return { text: 'The gamble is on... and the rain is already easing!', good: true, highlight: { kind: 'rainStart', actors: [p], caption: 'GAMBLE!', sub: `${me} stays on slicks` } };
        }
        return { text: 'Staying out on slicks... it is getting wetter. Brave.', good: false, highlight: { kind: 'rainStart', actors: [p], caption: 'GAMBLE!', sub: `${me} stays on slicks` } };
      }
      case 'drying':
        if (optionId === 'box') {
          c.pitNext = e.step * e.lapsPerStep > e.cfg.round.laps * 0.65 ? 'S' : 'M';
          return { text: 'First onto slicks — let\'s see if it pays off.', good: null, highlight: { kind: 'pitStop', actors: [p], caption: 'SLICKS!', sub: `${me} is first to switch` } };
        }
        return { text: 'One more lap on the inters.', good: null };
      case 'tyres':
        if (optionId === 'push') {
          c.mode = 1;
          c.modeSteps = Math.max(2, Math.round(5 / e.lapsPerStep));
          return { text: 'Flat out on dying tyres. Hold on...', good: null };
        }
        if (optionId === 'box') {
          c.pitNext = 'S';
          c.plan = [];
          return { text: 'Extra stop for softs — time to hunt.', good: null, highlight: { kind: 'pitStop', actors: [p], caption: 'BOX, BOX!', sub: 'Fresh softs' } };
        }
        c.mode = -1;
        c.modeSteps = Math.max(2, Math.round(6 / e.lapsPerStep));
        return { text: 'Lift and coast. Manage the gap.', good: null };
      case 'mechanical':
        if (optionId === 'nurse') {
          c.paceMod -= 0.9;
          c.mechRisk *= 0.25;
          return { text: 'Short-shifting and lifting early. The temperatures settle.', good: null };
        }
        c.mechRisk *= 3;
        return { text: 'You ignore the warning. Fingers crossed...', good: null };
      case 'night':
        if (optionId === 'push') {
          c.mode = 1;
          c.modeSteps = Math.max(2, Math.round(e.steps * 0.12));
          c.mechRisk *= 1.3;
          return { text: 'Headlights blazing, you hunt through the darkness.', good: null };
        }
        c.mode = -1;
        c.modeSteps = Math.max(2, Math.round(e.steps * 0.1));
        c.mechRisk *= 0.6;
        return { text: 'Smooth, patient, looking after the car.', good: null };
      case 'traffic':
        if (optionId === 'risky') {
          if (r.chance(0.12)) {
            c.total += r.float(6, 15);
            c.damage += 0.006;
            return {
              text: 'Contact with the slower car! Damage to the front.',
              good: false,
              highlight: { kind: 'spin', actors: [p], caption: 'CONTACT!', sub: 'Tangled in traffic' },
            };
          }
          c.total -= r.float(2, 5);
          return { text: 'Brilliant move around the outside — seconds gained!', good: true };
        }
        c.total += r.float(0.8, 2);
        return { text: 'Patient. You wait for the straight and slip by.', good: null };
      default:
        return { text: '', good: null };
    }
  }

  private duelBase(att: number, def: number): number {
    const e = this.engine;
    const ea = e.entries[att];
    const ed = e.entries[def];
    const ca = e.cars[att];
    const cd = e.cars[def];
    const paceAdv = e.expectedLap(def) - e.expectedLap(att);
    const pa = personality(ea.personality);
    const pd = personality(ed.personality);
    return (
      0.12 +
      e.cfg.track.overtaking * 0.5 +
      clamp(paceAdv, -1, 1.5) * 0.2 +
      (ea.skills.racecraft - ed.skills.racecraft) * 0.007 +
      (ea.aggression - 50) * 0.002 +
      (pa.duel - pd.duel) * 0.025 +
      (cd.tyreAge - ca.tyreAge) * 0.004
    );
  }

  private collisionOutcome(att: number): CollisionResult {
    const r = this.rng.next();
    void att;
    if (r < 0.34) return 'bothContinue';
    if (r < 0.54) return 'attackerSpin';
    if (r < 0.68) return 'defenderSpin';
    if (r < 0.85) return 'attackerOut';
    if (r < 0.94) return 'defenderOut';
    return 'bothOut';
  }

  private resolveAttack(m: Moment, optionId: string): MomentResolution {
    const e = this.engine;
    const p = e.playerIndex;
    const rival = m.rival!;
    const r = this.rng;
    const me = this.surname(p);
    const them = this.surname(rival);
    const pos = e.positionOf(p);
    const base = this.duelBase(p, rival);
    const ent = e.entries[p];
    const t = e.cfg.track;
    if (optionId === 'wait') {
      e.cars[p].tyreAge = Math.max(0, e.cars[p].tyreAge - 1.5 * e.lapsPerStep);
      e.forced.push({ attacker: p, defender: rival, outcome: 'held' });
      return { text: `You sit in ${them}'s wheel tracks and save your tyres.`, good: null };
    }
    const send = optionId === 'send';
    const pPass = clamp(base + (send ? 0.3 : 0.05), send ? 0.2 : 0.08, send ? 0.93 : 0.75);
    const pColl = send
      ? clamp(0.05 + (1 - ent.skills.consistency / 100) * 0.09 + t.danger * 0.05 + e.wet * 0.06, 0.04, 0.22)
      : 0.015;
    const roll = r.next();
    if (roll < pColl) {
      const res = this.collisionOutcome(p);
      e.forced.push({ attacker: p, defender: rival, outcome: 'collision', collision: res });
      const out = res === 'attackerOut' || res === 'bothOut';
      return {
        text: collisionText(res, me, them),
        good: false,
        effects: { rivalHeat: 18, fans: send ? 15 : 0 },
        highlight: { kind: out ? 'crash' : 'collision', actors: [p, rival], caption: out ? 'CRASH!' : 'CONTACT!', sub: collisionText(res, me, them) },
      };
    }
    if (roll < pColl + pPass) {
      e.forced.push({ attacker: p, defender: rival, outcome: 'pass' });
      const dive = t.kind === 'street' || (t.kind !== 'oval' && r.chance(0.45));
      const newPos = pos - 1;
      return {
        text: send ? `You dive down the inside of ${them} — it sticks! P${newPos}.` : `The pressure pays off. ${them} cracks and you're through for P${newPos}.`,
        good: true,
        effects: { rivalHeat: 6, fans: newPos <= 3 ? 12 : 4 },
        highlight: {
          kind: t.kind === 'oval' ? 'overtake' : dive ? 'dive' : 'overtake',
          actors: [p, rival],
          caption: newPos === 1 ? `${me.toUpperCase()} TAKES THE LEAD!` : `${me.toUpperCase()} TAKES P${newPos}!`,
          sub: `${me} passes ${them}`,
        },
      };
    }
    if (!send && r.chance(0.3)) {
      e.cars[rival].total += r.float(0.6, 2.2);
      e.forced.push({ attacker: p, defender: rival, outcome: 'held' });
      return { text: `${them} locks up under pressure! The gap is gone.`, good: true, effects: { rivalHeat: 4 } };
    }
    e.forced.push({ attacker: p, defender: rival, outcome: 'held' });
    return {
      text: send ? `${them} slams the door. You have to back out.` : `${them} doesn't crack. Still behind.`,
      good: false,
      effects: { rivalHeat: send ? 8 : 3 },
      highlight: send ? { kind: 'failedPass', actors: [p, rival], caption: 'DOOR SLAMMED', sub: `${them} holds the position` } : undefined,
    };
  }

  private resolveDefend(m: Moment, optionId: string): MomentResolution {
    const e = this.engine;
    const p = e.playerIndex;
    const rival = m.rival!;
    const r = this.rng;
    const me = this.surname(p);
    const them = this.surname(rival);
    const pos = e.positionOf(p);
    const base = this.duelBase(rival, p);
    const ent = e.entries[p];
    if (optionId === 'letgo') {
      e.forced.push({ attacker: rival, defender: p, outcome: 'pass' });
      e.cars[p].tyreAge = Math.max(0, e.cars[p].tyreAge - 1 * e.lapsPerStep);
      return { text: `You let ${them} through without a fight.`, good: null, effects: { rivalHeat: -2 } };
    }
    const block = optionId === 'block';
    const pPass = clamp(base - (block ? 0.3 : 0.12) - (ent.skills.racecraft - 60) * 0.004, 0.05, 0.8);
    const pColl = block ? clamp(0.05 + ent.aggression * 0.0006 + e.wet * 0.05, 0.04, 0.18) : 0.02;
    const roll = r.next();
    if (roll < pColl) {
      const res = this.collisionOutcome(rival);
      e.forced.push({ attacker: rival, defender: p, outcome: 'collision', collision: res });
      const playerOut = res === 'defenderOut' || res === 'bothOut';
      if (block && r.chance(0.25)) e.cars[p].penalty += 5;
      return {
        text: collisionText(res, them, me),
        good: false,
        effects: { rivalHeat: 18 },
        highlight: { kind: playerOut ? 'crash' : 'collision', actors: [rival, p], caption: playerOut ? 'CRASH!' : 'CONTACT!', sub: collisionText(res, them, me) },
      };
    }
    if (roll < pColl + pPass) {
      e.forced.push({ attacker: rival, defender: p, outcome: 'pass' });
      return {
        text: `${them} gets it done. You drop to P${pos + 1}.`,
        good: false,
        effects: { rivalHeat: 6 },
        highlight: { kind: 'overtake', actors: [rival, p], caption: `${them.toUpperCase()} GETS BY`, sub: `${me} drops to P${pos + 1}` },
      };
    }
    e.forced.push({ attacker: rival, defender: p, outcome: 'held' });
    return {
      text: block ? `You slam the door — ${them} has to back out!` : `Perfectly placed. ${them} can't find a way by.`,
      good: true,
      effects: { rivalHeat: 5, fans: 5 },
      highlight: { kind: 'defend', actors: [p, rival], caption: `${me.toUpperCase()} HOLDS P${pos}!`, sub: `${them} can't find a way past` },
    };
  }

  /** Auto-pick an option (quick sim / instant mode). */
  autoChoice(m: Moment): string {
    return m.auto || m.options[0]?.id;
  }
}

export function collisionText(res: CollisionResult, att: string, def: string): string {
  switch (res) {
    case 'bothContinue':
      return `${att} and ${def} bang wheels — both keep going`;
    case 'attackerSpin':
      return `${att} clips ${def} and spins`;
    case 'defenderSpin':
      return `${att} tags ${def} into a spin`;
    case 'attackerOut':
      return `${att} is out after hitting ${def}`;
    case 'defenderOut':
      return `${def} is taken out by ${att}`;
    case 'bothOut':
      return `${att} and ${def} are both out!`;
  }
}

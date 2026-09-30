/**
 * Life events between race weekends (BitLife-style cards).
 */
import { LIFE_EVENTS } from '../content/events';
import { nation } from '../content/nations';
import { series as seriesDef } from '../content/series';
import { track as trackDef } from '../content/tracks';
import type { Effects, LifeEventDef, LifeEventOutcome } from '../content/types';
import { ageOf, clampSkills, fullName } from './drivers';
import { clamp, Rng } from './rng';
import type { ActiveCareer, Driver, LifeEventInstance, World } from './types';

export type ResultTag = 'win' | 'podium' | 'points' | 'noPoints' | 'dnf' | 'crash';

export function resultTags(pos: number, points: number, dnfReason?: string): ResultTag[] {
  const tags: ResultTag[] = [];
  if (pos === 0) {
    tags.push('dnf');
    if (dnfReason === 'crash' || dnfReason === 'collision') tags.push('crash');
    tags.push('noPoints');
    return tags;
  }
  if (pos === 1) tags.push('win');
  if (pos <= 3) tags.push('podium');
  tags.push(points > 0 ? 'points' : 'noPoints');
  return tags;
}

function teammateOf(world: World, d: Driver): Driver | undefined {
  if (!d.contract) return undefined;
  const team = world.teams[d.contract.team];
  const id = team?.drivers.find((x) => x !== d.id);
  return id ? world.drivers[id] : undefined;
}

export function topRival(a: ActiveCareer, world: World): Driver | undefined {
  const r = Object.values(a.rivals)
    .filter((x) => world.drivers[x.driverId] && world.drivers[x.driverId].status !== 'retired')
    .sort((x, y) => y.heat - x.heat)[0];
  return r && r.heat >= 12 ? world.drivers[r.driverId] : undefined;
}

function vars(world: World, a: ActiveCareer): Record<string, string> {
  const d = world.drivers[a.driverId];
  const mate = teammateOf(world, d);
  const rival = topRival(a, world);
  const team = d.contract ? world.teams[d.contract.team] : undefined;
  const last = a.lastResult;
  return {
    first: d.first,
    last: d.last,
    teammate: mate ? fullName(mate) : 'your teammate',
    rival: rival ? fullName(rival) : 'your rival',
    team: team?.name ?? 'the team',
    series: d.contract ? seriesDef(d.contract.series).name : 'the paddock',
    track: last ? trackDef(last.track).name : 'the last race',
    nation: nation(d.nation).adjective,
    age: String(ageOf(d, world.year)),
  };
}

export function fill(text: string, v: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? `{${k}}`);
}

function eligible(ev: LifeEventDef, world: World, a: ActiveCareer, tags: ResultTag[]): boolean {
  const w = ev.when;
  const d = world.drivers[a.driverId];
  if (!w) return true;
  if (w.once && a.seenEvents[ev.id]) return false;
  const s = d.contract ? seriesDef(d.contract.series) : undefined;
  const round = s ? (world.season.series[s.id]?.round ?? 0) : 0;
  if (w.minRound !== undefined && round < w.minRound) return false;
  if (w.after && !w.after.some((t) => tags.includes(t))) return false;
  if (w.personality && !w.personality.includes(d.personality)) return false;
  if (w.notPersonality && w.notPersonality.includes(d.personality)) return false;
  if (w.family && (!d.family || !w.family.includes(d.family))) return false;
  if (w.needsTeammate && !teammateOf(world, d)) return false;
  if (w.needsRival && !topRival(a, world)) return false;
  if (w.minFans !== undefined && d.fans < w.minFans) return false;
  const age = ageOf(d, world.year);
  if (w.minAge !== undefined && age < w.minAge) return false;
  if (w.maxAge !== undefined && age > w.maxAge) return false;
  if (w.series && (!s || !w.series.includes(s.id))) return false;
  if (w.discipline && (!s || !w.discipline.includes(s.discipline))) return false;
  if (w.minTeamRelation !== undefined && a.teamRelation < w.minTeamRelation) return false;
  if (w.maxTeamRelation !== undefined && a.teamRelation > w.maxTeamRelation) return false;
  if (w.maxTeammateRelation !== undefined && a.teammateRelation > w.maxTeammateRelation) return false;
  if (w.minReputation !== undefined && d.reputation < w.minReputation) return false;
  if (w.gender && d.gender !== w.gender) return false;
  return true;
}

export function rollLifeEvent(world: World, rng: Rng, tags: ResultTag[], chance = 0.36): LifeEventInstance | undefined {
  const a = world.active;
  if (!a) return undefined;
  const dramatic = tags.includes('win') || tags.includes('crash');
  if (!rng.chance(dramatic ? chance + 0.2 : chance)) return undefined;
  const pool = LIFE_EVENTS.filter((ev) => eligible(ev, world, a, tags));
  if (!pool.length) return undefined;
  const ev = rng.weighted(pool, (e) => {
    const seen = a.seenEvents[e.id] ?? 0;
    const specific = e.when?.after ? 1.6 : 1;
    return (e.weight * specific) / (1 + seen * 1.5);
  });
  const v = vars(world, a);
  return {
    eventId: ev.id,
    title: fill(ev.title, v),
    text: fill(ev.text, v),
    options: ev.options.map((o) => ({ label: fill(o.label, v), emoji: o.emoji, hint: o.hint ? fill(o.hint, v) : undefined })),
    vars: v,
  };
}

export interface EventResolution {
  text: string;
  effects: Effects;
  outcomes?: LifeEventOutcome[];
  outcomeIndex?: number;
}

export function resolveLifeEvent(world: World, optionIndex: number, rng: Rng): EventResolution | undefined {
  const a = world.active;
  const inst = a?.pendingEvent;
  if (!a || !inst) return undefined;
  const ev = LIFE_EVENTS.find((e) => e.id === inst.eventId);
  a.pendingEvent = undefined;
  if (!ev) return undefined;
  a.seenEvents[ev.id] = (a.seenEvents[ev.id] ?? 0) + 1;
  const opt = ev.options[optionIndex] ?? ev.options[0];
  let res: EventResolution;
  if (opt.outcomes && opt.outcomes.length) {
    const idx = rng.weightedIndex(opt.outcomes.map((o) => o.weight));
    const o = opt.outcomes[idx];
    res = { text: fill(o.text, inst.vars), effects: o.effects, outcomes: opt.outcomes.map((x) => ({ ...x, text: fill(x.text, inst.vars) })), outcomeIndex: idx };
  } else {
    res = { text: fill(opt.text ?? 'So be it.', inst.vars), effects: opt.effects ?? {} };
  }
  applyEffects(world, res.effects);
  return res;
}

export function applyEffects(world: World, e: Effects): void {
  const a = world.active;
  if (!a) return;
  const d = world.drivers[a.driverId];
  if (e.morale) d.morale = clamp(d.morale + e.morale, 0, 100);
  if (e.reputation) d.reputation = clamp(d.reputation + e.reputation, 0, 100);
  if (e.fans) d.fans = Math.max(0, d.fans + e.fans);
  if (e.teamRelation) a.teamRelation = clamp(a.teamRelation + e.teamRelation, 0, 100);
  if (e.teammateRelation) a.teammateRelation = clamp(a.teammateRelation + e.teammateRelation, 0, 100);
  if (e.money) a.money = Math.max(0, a.money + e.money);
  if (e.skills) {
    d.skills = clampSkills({
      pace: d.skills.pace + (e.skills.pace ?? 0),
      racecraft: d.skills.racecraft + (e.skills.racecraft ?? 0),
      consistency: d.skills.consistency + (e.skills.consistency ?? 0),
      wet: d.skills.wet + (e.skills.wet ?? 0),
    });
  }
  if (e.aggression) d.aggression = clamp(d.aggression + e.aggression, 5, 95);
  if (e.form) a.form = clamp(a.form + e.form, -5, 5);
  if (e.growth) d.growth += e.growth;
  if (e.injuryRaces) a.injury = { racesOut: e.injuryRaces, desc: 'Injured away from the track' };
  if (e.rivalHeat) {
    const r = topRival(a, world);
    if (r && a.rivals[r.id]) a.rivals[r.id].heat = clamp(a.rivals[r.id].heat + e.rivalHeat, 0, 100);
  }
}

/** Human readable list of effect changes, e.g. ["+12 fans", "-5 morale"]. */
export function describeEffects(e: Effects): { text: string; good: boolean }[] {
  const out: { text: string; good: boolean }[] = [];
  const add = (v: number | undefined, label: string, fmt?: (n: number) => string) => {
    if (!v) return;
    out.push({ text: `${v > 0 ? '+' : ''}${fmt ? fmt(v) : v} ${label}`, good: v > 0 });
  };
  add(e.morale, 'morale');
  add(e.reputation, 'reputation');
  add(e.fans, 'fans', (n) => (Math.abs(n) >= 1000 ? `${(n / 1000).toFixed(1)}M` : `${n}k`));
  add(e.teamRelation, 'team relation');
  add(e.teammateRelation, 'teammate relation');
  add(e.money, '', (n) => `$${Math.abs(n) >= 1000 ? (n / 1000).toFixed(1) + 'M' : n + 'k'}`);
  if (e.skills) {
    for (const [k, v] of Object.entries(e.skills)) add(v, k);
  }
  add(e.form, 'form next race');
  add(e.growth, 'potential');
  if (e.aggression) out.push({ text: `${e.aggression > 0 ? '+' : ''}${e.aggression} aggression`, good: true });
  if (e.injuryRaces) out.push({ text: `Injured: miss ${e.injuryRaces} race${e.injuryRaces > 1 ? 's' : ''}`, good: false });
  if (e.rivalHeat) out.push({ text: `${e.rivalHeat > 0 ? '+' : ''}${e.rivalHeat} rivalry heat`, good: e.rivalHeat < 0 });
  return out;
}

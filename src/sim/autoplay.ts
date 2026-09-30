/**
 * Automatic play: instant race simulation (used by "Quick result" and
 * "Sim to next moment") and a full auto-career driver used by tests.
 */
import { answerInvite, dueInvite, endSeason, finishRace, nextRaceMeta, prepareRace, simulateReserveSeason, acceptOffer, retireCareer, startCareer, stayOffer, type RaceMeta, type RaceOutcome } from './career';
import { buildWheel, pickSlice, rollIdentity, WHEEL_ORDER, type Picks } from './creation';
import { resolveLifeEvent } from './events';
import type { MomentEffects, MomentHighlight } from './race/moments';
import { mixSeed, Rng } from './rng';
import type { CareerRecord, World } from './types';

export function playRaceInstant(world: World, meta?: RaceMeta): RaceOutcome | null {
  const m = meta ?? nextRaceMeta(world);
  if (!m) return null;
  const prep = prepareRace(world, m);
  const highlights: MomentHighlight[] = [];
  const effects: MomentEffects[] = [];
  let decisions = 0;
  while (!prep.engine.finished) {
    const moment = prep.director.detect();
    if (moment) {
      const res = prep.director.resolve(moment, prep.director.autoChoice(moment));
      decisions++;
      if (res.highlight) highlights.push(res.highlight);
      if (res.effects) effects.push(res.effects);
    }
    prep.engine.simulateStep();
  }
  return finishRace(world, prep, { highlights, effects, decisions });
}

export function randomPicks(world: World, rng: Rng): Picks {
  const picks: Picks = {};
  for (const id of WHEEL_ORDER) {
    const wheel = buildWheel(id, picks, world, rng);
    picks[id] = wheel.slices[pickSlice(wheel, rng)];
  }
  return picks;
}

export function startRandomCareer(world: World, seed: number): void {
  const rng = new Rng(seed);
  const picks = randomPicks(world, rng);
  const identity = rollIdentity(world, picks, rng);
  startCareer(world, picks, identity, seed);
}

/** Play a complete career automatically. Returns the archive record. */
export function autoCareer(world: World, seed: number, maxRaces = 2000): CareerRecord {
  startRandomCareer(world, seed);
  const rng = new Rng(mixSeed(seed, 'auto'));
  let guard = 0;
  while (world.active && guard++ < maxRaces) {
    const a = world.active;
    if (a.pendingEvent) {
      resolveLifeEvent(world, rng.int(0, a.pendingEvent.options.length - 1), rng);
      continue;
    }
    if (a.phase === 'season') {
      const inv = dueInvite(world);
      if (inv && inv.status === 'pending') {
        answerInvite(world, inv.id, rng.chance(0.7));
        continue;
      }
      const meta = nextRaceMeta(world);
      if (meta) playRaceInstant(world, meta);
      else if (!world.drivers[a.driverId].contract) simulateReserveSeason(world);
      else a.phase = 'seasonEnd';
      continue;
    }
    if (a.phase === 'seasonEnd') {
      const review = endSeason(world);
      if (review.retireWheel) {
        const total = review.retireWheel.stay + review.retireWheel.retire;
        if (review.retireWheel.forced || rng.chance(review.retireWheel.retire / total)) {
          return retireCareer(world, 'Time to hang up the helmet.');
        }
      }
      continue;
    }
    if (a.phase === 'offers') {
      const offers = a.offers ?? [];
      const stay = stayOffer(world);
      if (stay && rng.chance(0.6)) {
        acceptOffer(world, stay);
      } else if (offers.length) {
        acceptOffer(world, offers[rng.int(0, Math.min(2, offers.length - 1))]);
      } else if (stay) {
        acceptOffer(world, stay);
      } else {
        const me = world.drivers[a.driverId];
        if (me.yearsWithoutSeat >= 1) return retireCareer(world, 'No seat, no future.');
        acceptOffer(world, null);
      }
      continue;
    }
  }
  if (world.active) return retireCareer(world, 'Simulation limit.');
  throw new Error('career ended unexpectedly');
}

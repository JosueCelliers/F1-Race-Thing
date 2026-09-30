import { beforeAll, describe, expect, it } from 'vitest';
import { startRandomCareer } from '../autoplay';
import { finishRace, nextRaceMeta, prepareRace, type PreparedRace } from '../career';
import type { World } from '../types';
import { createWorld } from '../world';

describe('race engine', () => {
  let world: World;
  let prep: PreparedRace;

  beforeAll(() => {
    world = createWorld(31337);
    startRandomCareer(world, 42);
    const meta = nextRaceMeta(world);
    expect(meta).not.toBeNull();
    prep = prepareRace(world, meta!, 'banker');
    let guard = 0;
    while (!prep.engine.finished && guard++ < 500) {
      const m = prep.director.detect();
      if (m) prep.director.resolve(m, prep.director.autoChoice(m));
      prep.engine.simulateStep();
    }
  });

  it('finishes within the planned number of steps', () => {
    const e = prep.engine;
    expect(e.finished).toBe(true);
    expect(e.snapshots.length).toBe(e.steps + 1);
  });

  it('classifies every car exactly once', () => {
    const e = prep.engine;
    const cls = e.classification();
    expect([...cls.order].sort((a, b) => a - b)).toEqual(e.entries.map((_, i) => i));
    for (const i of cls.dnf) expect(e.cars[i].status).toBe('out');
  });

  it('keeps snapshot orders consistent with gaps', () => {
    for (const snap of prep.engine.snapshots) {
      expect(new Set(snap.order).size).toBe(snap.order.length);
      const running = snap.order.filter((i) => snap.status[i] === 'run');
      for (let k = 1; k < running.length; k++) {
        expect(snap.gaps[running[k]]).toBeGreaterThanOrEqual(snap.gaps[running[k - 1]] - 1e-6);
      }
      if (running.length) expect(snap.gaps[running[0]]).toBeCloseTo(0, 5);
    }
  });

  it('awards points and records the result in the championship', () => {
    const out = finishRace(world, prep, { highlights: [], effects: [], decisions: 0 });
    const ss = world.season.series[prep.meta.seriesId];
    const res = ss.results.find((r) => r.round === prep.meta.roundIndex);
    expect(res).toBeDefined();
    const total = Object.values(res!.points).reduce((a, b) => a + b, 0);
    expect(total).toBeGreaterThan(0);
    expect(out.summary.pos).toBeGreaterThanOrEqual(0);
    expect(out.standingsPos).toBeGreaterThan(0);
  });
});

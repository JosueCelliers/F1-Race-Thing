import { describe, expect, it } from 'vitest';
import { series as seriesDef } from '../../content/series';
import { acceptOffer, endSeason, stayOffer } from '../career';
import { autoCareer, playRaceInstant, startRandomCareer } from '../autoplay';
import { computeRecords } from '../legacy';
import { computeOffers } from '../market';
import type { CareerRecord, World } from '../types';
import { createWorld } from '../world';

function lineupProblems(world: World): string[] {
  const out: string[] = [];
  for (const t of Object.values(world.teams)) {
    const s = seriesDef(t.series);
    if (t.drivers.length !== s.carsPerTeam) out.push(`${t.name}: ${t.drivers.length}/${s.carsPerTeam}`);
    for (const id of t.drivers) {
      const d = world.drivers[id];
      if (!d) out.push(`${t.name}: missing ${id}`);
      else if (d.status === 'retired') out.push(`${t.name}: ${d.last} is retired`);
      else if (d.contract?.team !== t.id) out.push(`${t.name}: ${d.last} contracted elsewhere`);
    }
  }
  return out;
}

describe('world', () => {
  it('is reproducible from its seed', () => {
    const a = createWorld(2024);
    const b = createWorld(2024);
    expect(a.history.map((c) => c.driverName)).toEqual(b.history.map((c) => c.driverName));
    expect(Object.keys(a.drivers).length).toBe(Object.keys(b.drivers).length);
  });

  it('has full, valid lineups when a career starts', () => {
    const world = createWorld(77);
    startRandomCareer(world, 3);
    expect(lineupProblems(world)).toEqual([]);
  });

  it('keeps the market sane through a season', () => {
    const world = createWorld(123);
    startRandomCareer(world, 9);
    let guard = 0;
    while (world.active?.phase === 'season' && guard++ < 200) {
      if (world.active.pendingEvent) {
        world.active.pendingEvent = undefined;
        continue;
      }
      if (!playRaceInstant(world)) break;
    }
    if (world.active?.phase === 'seasonEnd') endSeason(world);
    expect(world.active?.phase).toBe('offers');
    const offers = computeOffers(world);
    expect(offers.length).toBeLessThanOrEqual(6);
    const perSeries: Record<string, number> = {};
    for (const o of offers) {
      if (o.kind !== 'renewal') perSeries[o.series] = (perSeries[o.series] ?? 0) + 1;
      expect(world.teams[o.team]).toBeDefined();
    }
    for (const n of Object.values(perSeries)) expect(n).toBeLessThanOrEqual(2);
    acceptOffer(world, stayOffer(world) ?? offers[0] ?? null);
    expect(world.active?.phase).toBe('season');
    expect(lineupProblems(world)).toEqual([]);
  });
});

describe('careers', () => {
  it('play from spin to retirement and land in the archive', () => {
    const world = createWorld(4242);
    const records: CareerRecord[] = [];
    for (let k = 0; k < 3; k++) {
      const rec = autoCareer(world, 1000 + k);
      records.push(rec);
      const t = rec.totals;
      expect(t.seasons).toBeGreaterThanOrEqual(1);
      expect(t.starts).toBeGreaterThanOrEqual(t.podiums);
      expect(t.podiums).toBeGreaterThanOrEqual(t.wins);
      expect(t.wins).toBeGreaterThanOrEqual(0);
      expect(rec.verdict.title.length).toBeGreaterThan(0);
      expect(rec.endYear).toBeGreaterThanOrEqual(rec.startYear);
      expect(world.active).toBeUndefined();
    }
    // Careers share one world: each starts after the previous one ended.
    for (let k = 1; k < records.length; k++) expect(records[k].startYear).toBeGreaterThanOrEqual(records[k - 1].endYear);
    expect(world.careers.length).toBe(3);
    const recs = computeRecords(records);
    expect(recs.length).toBeGreaterThan(0);
    for (const r of recs) expect(records.some((c) => c.id === r.careerId)).toBe(true);
  }, 30000);
});

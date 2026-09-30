/**
 * Headless sanity check: build a world and play several complete careers
 * automatically, printing a summary and checking world invariants.
 *
 *   npm run sim -- [careers] [seed]
 */
import { series as seriesDef, SERIES } from '../src/content/series';
import { autoCareer } from '../src/sim/autoplay';
import { ovr } from '../src/sim/drivers';
import type { World } from '../src/sim/types';
import { createWorld } from '../src/sim/world';

const careers = Number(process.argv[2] ?? 6);
const seed = Number(process.argv[3] ?? 12345);

function checkInvariants(world: World, label: string) {
  const seen = new Map<string, string>();
  for (const t of Object.values(world.teams)) {
    const s = seriesDef(t.series);
    if (world.phase === 'season' && t.drivers.length !== s.carsPerTeam) {
      throw new Error(`${label}: team ${t.id} has ${t.drivers.length} drivers`);
    }
    for (const d of t.drivers) {
      if (seen.has(d)) throw new Error(`${label}: driver ${d} in ${seen.get(d)} and ${t.id}`);
      seen.set(d, t.id);
      if (!world.drivers[d]) throw new Error(`${label}: missing driver ${d}`);
      if (world.drivers[d].status === 'retired') throw new Error(`${label}: retired driver ${d} in ${t.id}`);
    }
  }
}

const t0 = Date.now();
const world = createWorld(seed);
console.log(`World created in ${Date.now() - t0}ms — year ${world.year}, ${Object.keys(world.drivers).length} drivers, ${world.history.length} champions`);
for (const s of SERIES) {
  const champs = world.history.filter((h) => h.series === s.id).map((h) => `${h.year} ${h.driverName}`);
  console.log(`  ${s.name}: ${champs.slice(-3).join(' | ')}`);
}

for (let c = 0; c < careers; c++) {
  const t1 = Date.now();
  const rec = autoCareer(world, seed + c * 101);
  checkInvariants(world, `after career ${c + 1}`);
  const t = rec.totals;
  const path = rec.seasons.map((s) => `${seriesDef(s.series).short}:${s.pos}`).join(' ');
  console.log(
    `#${rec.index} ${rec.driver.first} ${rec.driver.last} (${rec.driver.nation}) ${rec.startYear}-${rec.endYear} age ${rec.retireAge} peak ${rec.peakOvr} ` +
      `| ${rec.verdict.tier.toUpperCase()} "${rec.verdict.title}" legacy ${rec.legacy} | starts ${t.starts} wins ${t.wins} pod ${t.podiums} titles ${t.titles} crashes ${t.crashes} ` +
      `| ${Date.now() - t1}ms\n    ${path}\n    ${rec.moments.filter((m) => m.importance >= 3).map((m) => m.title).join(' · ')}`,
  );
}
const sizes = JSON.stringify(world).length;
console.log(`World year ${world.year}, drivers ${Object.keys(world.drivers).length}, save size ${(sizes / 1024).toFixed(0)}KB`);
const prime = Object.values(world.teams).filter((t) => t.series === 'prime');
console.log('Prime grid:', prime.map((t) => `${t.short} ${Math.round(t.perf)} [${t.drivers.map((d) => ovr(world.drivers[d])).join(',')}]`).join(' | '));

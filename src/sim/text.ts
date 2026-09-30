import type { RaceSummary } from './types';

/** Newspaper-style headline for the player's race. */
export function headline(s: RaceSummary, last: string, rngPick: <T>(arr: T[]) => T): string {
  const L = last.toUpperCase();
  const where = s.name;
  if (s.pos === 1) {
    if (s.special) return rngPick([`${L} CONQUERS THE ${where.toUpperCase()}!`, `HISTORY! ${L} WINS THE ${where.toUpperCase()}`]);
    if (s.grid >= 10) return rngPick([`FROM P${s.grid} TO VICTORY: ${L} STUNS ${where.toUpperCase()}`, `${L}'S MIRACLE DRIVE FROM P${s.grid}`]);
    if (s.wet) return rngPick([`RAIN MASTER ${L} DOMINATES`, `${L} DANCES THROUGH THE RAIN TO WIN`]);
    return rngPick([`${L} WINS THE ${where.toUpperCase()}!`, `VICTORY FOR ${L}`, `${L} TAKES THE CHEQUERED FLAG FIRST`]);
  }
  if (s.pos === 2 || s.pos === 3) return rngPick([`${L} ON THE PODIUM IN P${s.pos}`, `P${s.pos}! ${L} SPRAYS THE CHAMPAGNE`, `ANOTHER TROPHY FOR ${L}: P${s.pos}`]);
  if (s.pos === 0) {
    if (s.dnfReason === 'crash' || s.dnfReason === 'collision') return rngPick([`HEARTBREAK: ${L} CRASHES OUT`, `${L}'S RACE ENDS IN THE BARRIERS`, `CARNAGE! ${L} OUT`]);
    return rngPick([`MECHANICAL AGONY FOR ${L}`, `${L} LET DOWN BY THE CAR`, `SMOKE AND TEARS: ${L} RETIRES`]);
  }
  if (s.points > 0) return rngPick([`${L} BRINGS IT HOME IN P${s.pos}`, `SOLID POINTS FOR ${L} IN P${s.pos}`, `P${s.pos} FOR ${L} AT ${where.toUpperCase()}`]);
  return rngPick([`TOUGH DAY FOR ${L}: P${s.pos}`, `${L} OUT OF THE POINTS IN P${s.pos}`, `NOTHING GOES RIGHT FOR ${L}`]);
}

export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function plural(n: number, word: string, pluralWord?: string): string {
  return `${n} ${n === 1 ? word : pluralWord ?? word + 's'}`;
}

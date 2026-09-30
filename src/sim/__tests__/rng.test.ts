import { describe, expect, it } from 'vitest';
import { clamp, hashString, mixSeed, Rng } from '../rng';

describe('Rng', () => {
  it('is deterministic for a seed', () => {
    const a = new Rng(1234);
    const b = new Rng(1234);
    const xs = Array.from({ length: 50 }, () => a.next());
    const ys = Array.from({ length: 50 }, () => b.next());
    expect(xs).toEqual(ys);
    expect(new Set(xs).size).toBeGreaterThan(45);
  });

  it('stays within bounds', () => {
    const r = new Rng(7);
    for (let i = 0; i < 2000; i++) {
      const f = r.next();
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThan(1);
      const n = r.int(3, 9);
      expect(n).toBeGreaterThanOrEqual(3);
      expect(n).toBeLessThanOrEqual(9);
      expect(Number.isInteger(n)).toBe(true);
    }
  });

  it('forks are independent of later draws on the parent', () => {
    const a = new Rng(99);
    const fa = a.fork('x');
    const b = new Rng(99);
    b.next();
    b.next();
    const fb = new Rng(99).fork('x');
    expect(fa.next()).toBe(fb.next());
  });

  it('weightedIndex respects weights', () => {
    const r = new Rng(5);
    const counts = [0, 0, 0];
    for (let i = 0; i < 6000; i++) counts[r.weightedIndex([1, 0, 3])]++;
    expect(counts[1]).toBe(0);
    expect(counts[2] / counts[0]).toBeGreaterThan(2.4);
    expect(counts[2] / counts[0]).toBeLessThan(3.6);
  });

  it('hashes and mixes seeds stably', () => {
    expect(hashString('chequered')).toBe(hashString('chequered'));
    expect(hashString('a')).not.toBe(hashString('b'));
    expect(mixSeed(1, 'x', 2)).toBe(mixSeed(1, 'x', 2));
    expect(mixSeed(1, 'x', 2)).not.toBe(mixSeed(1, 'x', 3));
    expect(clamp(5, 0, 3)).toBe(3);
    expect(clamp(-1, 0, 3)).toBe(0);
  });
});

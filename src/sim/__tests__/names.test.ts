import { describe, expect, it } from 'vitest';
import { isFamousDriverName } from '../../content/names';
import { NATIONS } from '../../content/nations';
import { generateName } from '../drivers';
import { Rng } from '../rng';

describe('driver names', () => {
  it('recognises famous real drivers regardless of accents and case', () => {
    expect(isFamousDriverName('Jim', 'Clark')).toBe(true);
    expect(isFamousDriverName('kimi', 'RÄIKKÖNEN')).toBe(true);
    expect(isFamousDriverName('Ben', 'Martin')).toBe(false);
  });

  it('never generates a famous real driver', () => {
    const rng = new Rng(2026);
    for (const n of NATIONS) {
      for (let i = 0; i < 300; i++) {
        const { first, last } = generateName(rng, n.id, i % 3 === 0 ? 'f' : 'm');
        expect(first.length).toBeGreaterThan(0);
        expect(last.length).toBeGreaterThan(0);
        expect(isFamousDriverName(first, last)).toBe(false);
      }
    }
  });
});

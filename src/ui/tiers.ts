/**
 * Presentation for career verdict tiers and archive records: one icon and one
 * colour each, drawn from the design system instead of emoji.
 */
import type { VerdictTier } from '../sim/types';
import type { IconName } from './Icon';
import { C } from './theme';

export const TIER_STYLE: Record<VerdictTier, { icon: IconName; color: string }> = {
  legend: { icon: 'crown', color: C.gold },
  great: { icon: 'trophy', color: C.gold },
  star: { icon: 'star', color: C.cyan },
  pro: { icon: 'wrench', color: '#C6CDD8' },
  cult: { icon: 'heart', color: C.purple },
  journeyman: { icon: 'swap', color: C.steel },
  disaster: { icon: 'fire', color: C.red },
};

export const RECORD_ICON: Record<string, IconName> = {
  primeTitles: 'crown',
  titles: 'trophy',
  wins: 'medal',
  primeWins: 'flag',
  podiums: 'podium',
  poles: 'clock',
  youngestPrimeChamp: 'star',
  youngestChamp: 'star',
  dominant: 'bolt',
  longest: 'calendar',
  shortest: 'bolt',
  crashes: 'fire',
  teams: 'swap',
  series: 'globe',
  winless: 'close',
  france24: 'clock',
  heartland500: 'flag',
  riviera: 'crown',
  legacy: 'star',
  worstChamp: 'trophy',
};

import type { LookPartMeta } from './types';

/**
 * Portrait part metadata used by the generator. The matching drawings live in
 * src/art/portrait. To add a hairstyle: add metadata here + a drawing there.
 */
export const FACE_PARTS: LookPartMeta[] = [
  { id: 'oval', genders: ['m', 'f'], weight: 3 },
  { id: 'round', genders: ['m', 'f'], weight: 2 },
  { id: 'square', genders: ['m', 'f'], weight: 2 },
  { id: 'long', genders: ['m', 'f'], weight: 1.5 },
  { id: 'heart', genders: ['m', 'f'], weight: 1.5 },
];

export const HAIR_PARTS: LookPartMeta[] = [
  { id: 'buzz', genders: ['m'], weight: 2 },
  { id: 'crop', genders: ['m', 'f'], weight: 3 },
  { id: 'sidepart', genders: ['m'], weight: 3 },
  { id: 'quiff', genders: ['m'], weight: 2.5 },
  { id: 'curly', genders: ['m', 'f'], weight: 2 },
  { id: 'messy', genders: ['m'], weight: 2.5 },
  { id: 'fade', genders: ['m'], weight: 2 },
  { id: 'afro', genders: ['m', 'f'], weight: 1 },
  { id: 'bald', genders: ['m'], weight: 0.6 },
  { id: 'long', genders: ['m', 'f'], weight: 1.2, genderWeight: { m: 0.35 } },
  { id: 'ponytail', genders: ['f'], weight: 3 },
  { id: 'bob', genders: ['f'], weight: 2 },
  { id: 'bun', genders: ['f'], weight: 2 },
  { id: 'pixie', genders: ['f'], weight: 1.5 },
  { id: 'braids', genders: ['f', 'm'], weight: 0.8 },
  { id: 'wavy', genders: ['f'], weight: 2.5 },
];

export const BROW_PARTS: LookPartMeta[] = [
  { id: 'straight', genders: ['m', 'f'], weight: 3 },
  { id: 'arched', genders: ['m', 'f'], weight: 2 },
  { id: 'thick', genders: ['m', 'f'], weight: 2 },
  { id: 'thin', genders: ['m', 'f'], weight: 1.5 },
  { id: 'angled', genders: ['m', 'f'], weight: 2 },
];

export const EYE_PARTS: LookPartMeta[] = [
  { id: 'round', genders: ['m', 'f'], weight: 2 },
  { id: 'almond', genders: ['m', 'f'], weight: 3 },
  { id: 'narrow', genders: ['m', 'f'], weight: 2 },
  { id: 'hooded', genders: ['m', 'f'], weight: 1.5 },
  { id: 'wide', genders: ['m', 'f'], weight: 1.5 },
];

export const NOSE_PARTS: LookPartMeta[] = [
  { id: 'button', genders: ['m', 'f'], weight: 2 },
  { id: 'straight', genders: ['m', 'f'], weight: 3 },
  { id: 'wide', genders: ['m', 'f'], weight: 2 },
  { id: 'long', genders: ['m', 'f'], weight: 1.5 },
  { id: 'pointed', genders: ['m', 'f'], weight: 1.5 },
];

export const MOUTH_PARTS: LookPartMeta[] = [
  { id: 'smile', genders: ['m', 'f'], weight: 3 },
  { id: 'grin', genders: ['m', 'f'], weight: 2 },
  { id: 'neutral', genders: ['m', 'f'], weight: 2.5 },
  { id: 'smirk', genders: ['m', 'f'], weight: 2 },
  { id: 'open', genders: ['m', 'f'], weight: 1 },
];

export const FACIAL_PARTS: LookPartMeta[] = [
  { id: 'none', genders: ['m', 'f'], weight: 6 },
  { id: 'stubble', genders: ['m'], weight: 2.5 },
  { id: 'beard', genders: ['m'], weight: 1.2 },
  { id: 'moustache', genders: ['m'], weight: 0.6 },
  { id: 'goatee', genders: ['m'], weight: 0.8 },
];

export const EXTRA_PARTS: LookPartMeta[] = [
  { id: 'none', genders: ['m', 'f'], weight: 7 },
  { id: 'freckles', genders: ['m', 'f'], weight: 1.4 },
  { id: 'earring', genders: ['m', 'f'], weight: 1 },
  { id: 'scar', genders: ['m', 'f'], weight: 0.5 },
  { id: 'mole', genders: ['m', 'f'], weight: 0.8 },
  { id: 'glasses', genders: ['m', 'f'], weight: 0.6 },
];

export const HELMET_PATTERNS = ['stripe', 'chevron', 'split', 'stars', 'flames', 'halo', 'checker', 'dots', 'bolt', 'crown'];

/** Curated helmet palette for designs not based on nation colours. */
export const HELMET_COLORS = ['#FFFFFF', '#111111', '#E10600', '#FFD400', '#1E88E5', '#00BFA5', '#FF6D00', '#8E24AA', '#43A047', '#F06292', '#90A4AE', '#00E5FF', '#C6FF00', '#D4A63A'];

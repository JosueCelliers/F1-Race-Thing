import type { NationDef } from './types';

/**
 * Skin tone palette used by the portrait generator (light -> deep).
 * Nations weight these to get plausible, diverse populations.
 */
export const SKIN_TONES = ['#FBE3D3', '#F2CDB1', '#E6B592', '#D29D76', '#B98059', '#9B6442', '#784A2F', '#553321'];
export const HAIR_COLORS = ['#1B1718', '#3A2A20', '#5E3F2B', '#8C6242', '#D3A962', '#EAD6A4', '#B0532E', '#7C3324', '#8F8F95'];
export const HAIR_COLOR_NAMES = ['Black', 'Dark brown', 'Brown', 'Light brown', 'Blonde', 'Platinum', 'Ginger', 'Auburn', 'Silver'];
export const EYE_COLORS = ['#3B2416', '#6A4127', '#8A6A34', '#4E7A4B', '#4C7FB8', '#7D8B96'];

// Weight presets --------------------------------------------------------------
const SKIN_NORTH = [3, 5, 3, 1, 0.3, 0.2, 0.2, 0.1];
const SKIN_UK = [2, 4, 3, 1.2, 0.6, 0.7, 0.7, 0.5];
const SKIN_SOUTH = [1, 3, 4, 3, 1, 0.4, 0.3, 0.2];
const SKIN_FR = [1.5, 3, 3, 2, 1, 0.8, 0.8, 0.6];
const SKIN_ANGLO = [1.5, 3, 3, 2, 1.4, 1.4, 1.4, 1];
const SKIN_EASTASIA = [0, 2, 4, 3, 0.6, 0, 0, 0];
const SKIN_SEASIA = [0, 0.5, 2, 4, 3, 1, 0.2, 0];

const HAIR_NORTH = [1, 3, 3, 3, 3, 1, 0.8, 0.6, 0];
const HAIR_NORDIC = [0.5, 2, 2, 3, 4, 2.5, 0.6, 0.4, 0];
const HAIR_SOUTH = [3, 5, 3, 1.5, 0.6, 0.1, 0.2, 0.3, 0];
const HAIR_LATAM = [5, 5, 2, 1, 0.4, 0.1, 0.1, 0.2, 0];
const HAIR_ANGLO = [2, 3, 3, 2.5, 2.5, 0.8, 0.8, 0.6, 0];
const HAIR_ASIA = [9, 2, 0.3, 0, 0, 0, 0, 0, 0];
const HAIR_AFRICA = [5, 3, 1.5, 0.8, 0.8, 0.3, 0.2, 0.2, 0];

const EYES_NORTH = [0.5, 2, 1.5, 1.5, 4, 1.5];
const EYES_SOUTH = [3, 3, 2, 1, 0.8, 0.3];
const EYES_LATAM = [4, 3, 1.5, 0.6, 0.4, 0.1];
const EYES_ANGLO = [1.5, 2.5, 1.5, 1, 2.5, 0.8];
const EYES_ASIA = [8, 2, 0.2, 0, 0, 0];
const EYES_AFRICA = [7, 2.5, 0.5, 0.2, 0.3, 0.1];

export const NATIONS: NationDef[] = [
  { id: 'GB', name: 'United Kingdom', adjective: 'British', wheel: 'British', nameGroup: 'english', skin: SKIN_UK, hair: [1.5, 3, 3, 2.5, 2, 0.6, 1, 0.8, 0], eyes: EYES_NORTH, motorsport: 10, flag: { kind: 'custom', id: 'GB' }, colors: ['#012169', '#C8102E', '#FFFFFF'] },
  { id: 'DE', name: 'Germany', adjective: 'German', wheel: 'German', nameGroup: 'german', skin: SKIN_NORTH, hair: HAIR_NORTH, eyes: EYES_NORTH, motorsport: 6, flag: { kind: 'h', colors: ['#000000', '#DD0000', '#FFCE00'] }, colors: ['#111111', '#DD0000', '#FFCE00'] },
  { id: 'FR', name: 'France', adjective: 'French', wheel: 'French', nameGroup: 'french', skin: SKIN_FR, hair: HAIR_SOUTH, eyes: EYES_SOUTH, motorsport: 6, flag: { kind: 'v', colors: ['#0055A4', '#FFFFFF', '#EF4135'] }, colors: ['#0055A4', '#FFFFFF', '#EF4135'] },
  { id: 'IT', name: 'Italy', adjective: 'Italian', wheel: 'Italian', nameGroup: 'italian', skin: SKIN_SOUTH, hair: HAIR_SOUTH, eyes: EYES_SOUTH, motorsport: 7, flag: { kind: 'v', colors: ['#009246', '#FFFFFF', '#CE2B37'] }, colors: ['#009246', '#FFFFFF', '#CE2B37'] },
  { id: 'ES', name: 'Spain', adjective: 'Spanish', wheel: 'Spanish', nameGroup: 'spanish', skin: SKIN_SOUTH, hair: HAIR_SOUTH, eyes: EYES_SOUTH, motorsport: 5, flag: { kind: 'h', colors: ['#AA151B', '#F1BF00', '#AA151B'], ratios: [1, 2, 1] }, colors: ['#AA151B', '#F1BF00', '#1A1A1A'] },
  { id: 'NL', name: 'Netherlands', adjective: 'Dutch', wheel: 'Dutch', nameGroup: 'dutch', skin: SKIN_NORTH, hair: HAIR_NORTH, eyes: EYES_NORTH, motorsport: 5, flag: { kind: 'h', colors: ['#AE1C28', '#FFFFFF', '#21468B'] }, colors: ['#FF7A00', '#21468B', '#FFFFFF'] },
  { id: 'BE', name: 'Belgium', adjective: 'Belgian', wheel: 'Belgian', nameGroup: 'belgian', skin: SKIN_NORTH, hair: HAIR_NORTH, eyes: EYES_NORTH, motorsport: 3, flag: { kind: 'v', colors: ['#1A1A1A', '#FDDA24', '#EF3340'] }, colors: ['#1A1A1A', '#FDDA24', '#EF3340'] },
  { id: 'FI', name: 'Finland', adjective: 'Finnish', wheel: 'Finnish', nameGroup: 'finnish', skin: [3.5, 5, 2, 0.5, 0.1, 0.1, 0.1, 0.05], hair: HAIR_NORDIC, eyes: [0.3, 1, 1, 1.5, 5, 2.5], motorsport: 3, flag: { kind: 'nordic', bg: '#FFFFFF', cross: '#003580' }, colors: ['#003580', '#FFFFFF', '#6FA8DC'] },
  { id: 'SE', name: 'Sweden', adjective: 'Swedish', wheel: 'Swedish', nameGroup: 'scandinavian', skin: SKIN_NORTH, hair: HAIR_NORDIC, eyes: [0.3, 1, 1, 1.5, 5, 2], motorsport: 2, flag: { kind: 'nordic', bg: '#006AA7', cross: '#FECC00' }, colors: ['#006AA7', '#FECC00', '#FFFFFF'] },
  { id: 'NO', name: 'Norway', adjective: 'Norwegian', wheel: 'Norwegian', nameGroup: 'scandinavian', skin: SKIN_NORTH, hair: HAIR_NORDIC, eyes: [0.3, 1, 1, 1.5, 5, 2], motorsport: 1.2, flag: { kind: 'nordic', bg: '#BA0C2F', cross: '#00205B', border: '#FFFFFF' }, colors: ['#BA0C2F', '#00205B', '#FFFFFF'] },
  { id: 'DK', name: 'Denmark', adjective: 'Danish', wheel: 'Danish', nameGroup: 'scandinavian', skin: SKIN_NORTH, hair: HAIR_NORDIC, eyes: [0.3, 1, 1, 1.5, 5, 2], motorsport: 2, flag: { kind: 'nordic', bg: '#C8102E', cross: '#FFFFFF' }, colors: ['#C8102E', '#FFFFFF', '#1A1A1A'] },
  { id: 'AT', name: 'Austria', adjective: 'Austrian', wheel: 'Austrian', nameGroup: 'german', skin: SKIN_NORTH, hair: HAIR_NORTH, eyes: EYES_NORTH, motorsport: 2, flag: { kind: 'h', colors: ['#ED2939', '#FFFFFF', '#ED2939'] }, colors: ['#ED2939', '#FFFFFF', '#1A1A1A'] },
  { id: 'CH', name: 'Switzerland', adjective: 'Swiss', wheel: 'Swiss', nameGroup: 'swiss', skin: SKIN_NORTH, hair: HAIR_NORTH, eyes: EYES_NORTH, motorsport: 1.5, flag: { kind: 'custom', id: 'CH' }, colors: ['#DA291C', '#FFFFFF', '#1A1A1A'] },
  { id: 'MC', name: 'Monaco', adjective: 'Monegasque', wheel: 'Monegasque', nameGroup: 'monegasque', skin: SKIN_SOUTH, hair: HAIR_SOUTH, eyes: EYES_SOUTH, motorsport: 1, flag: { kind: 'h', colors: ['#CE1126', '#FFFFFF'] }, colors: ['#CE1126', '#FFFFFF', '#D4AF37'] },
  { id: 'PL', name: 'Poland', adjective: 'Polish', wheel: 'Polish', nameGroup: 'polish', skin: SKIN_NORTH, hair: HAIR_NORTH, eyes: EYES_NORTH, motorsport: 1, flag: { kind: 'h', colors: ['#FFFFFF', '#DC143C'] }, colors: ['#FFFFFF', '#DC143C', '#1A1A1A'] },
  { id: 'PT', name: 'Portugal', adjective: 'Portuguese', wheel: 'Portuguese', nameGroup: 'portuguese', skin: SKIN_SOUTH, hair: HAIR_SOUTH, eyes: EYES_SOUTH, motorsport: 1.5, flag: { kind: 'custom', id: 'PT' }, colors: ['#046A38', '#DA291C', '#FFE900'] },
  { id: 'IE', name: 'Ireland', adjective: 'Irish', wheel: 'Irish', nameGroup: 'irish', skin: [3.5, 5, 2, 0.6, 0.3, 0.3, 0.3, 0.2], hair: [1, 3, 3, 2, 1.5, 0.5, 2, 1.5, 0], eyes: EYES_NORTH, motorsport: 1.5, flag: { kind: 'v', colors: ['#169B62', '#FFFFFF', '#FF883E'] }, colors: ['#169B62', '#FFFFFF', '#FF883E'] },
  { id: 'EE', name: 'Estonia', adjective: 'Estonian', wheel: 'Estonian', nameGroup: 'estonian', skin: SKIN_NORTH, hair: HAIR_NORDIC, eyes: EYES_NORTH, motorsport: 0.8, flag: { kind: 'h', colors: ['#0072CE', '#111111', '#FFFFFF'] }, colors: ['#0072CE', '#111111', '#FFFFFF'] },
  { id: 'BR', name: 'Brazil', adjective: 'Brazilian', wheel: 'Brazilian', nameGroup: 'brazilian', skin: [0.5, 1.5, 2, 3, 3, 2.5, 1.5, 0.8], hair: HAIR_LATAM, eyes: EYES_LATAM, motorsport: 5, flag: { kind: 'custom', id: 'BR' }, colors: ['#009C3B', '#FFDF00', '#002776'] },
  { id: 'AR', name: 'Argentina', adjective: 'Argentine', wheel: 'Argentine', nameGroup: 'latam', skin: [1, 3, 4, 2, 1, 0.3, 0.1, 0.05], hair: HAIR_LATAM, eyes: EYES_LATAM, motorsport: 2.5, flag: { kind: 'custom', id: 'AR' }, colors: ['#74ACDF', '#FFFFFF', '#F6B40E'] },
  { id: 'MX', name: 'Mexico', adjective: 'Mexican', wheel: 'Mexican', nameGroup: 'latam', skin: [0.3, 1, 2, 4, 4, 2, 0.5, 0.1], hair: HAIR_LATAM, eyes: EYES_LATAM, motorsport: 2.5, flag: { kind: 'custom', id: 'MX' }, colors: ['#006847', '#FFFFFF', '#CE1126'] },
  { id: 'CO', name: 'Colombia', adjective: 'Colombian', wheel: 'Colombian', nameGroup: 'latam', skin: [0.3, 1, 2, 3, 3, 2, 1, 0.3], hair: HAIR_LATAM, eyes: EYES_LATAM, motorsport: 1, flag: { kind: 'h', colors: ['#FCD116', '#003893', '#CE1126'], ratios: [2, 1, 1] }, colors: ['#FCD116', '#003893', '#CE1126'] },
  { id: 'US', name: 'United States', adjective: 'American', wheel: 'American', nameGroup: 'american', skin: SKIN_ANGLO, hair: HAIR_ANGLO, eyes: EYES_ANGLO, motorsport: 7, flag: { kind: 'custom', id: 'US' }, colors: ['#0A3161', '#B31942', '#FFFFFF'] },
  { id: 'CA', name: 'Canada', adjective: 'Canadian', wheel: 'Canadian', nameGroup: 'american', skin: [2, 3, 3, 2, 1, 1, 0.6, 0.4], hair: HAIR_ANGLO, eyes: EYES_ANGLO, motorsport: 3, flag: { kind: 'custom', id: 'CA' }, colors: ['#D52B1E', '#FFFFFF', '#1A1A1A'] },
  { id: 'AU', name: 'Australia', adjective: 'Australian', wheel: 'Aussie', nameGroup: 'english', skin: [2, 4, 3, 2, 1, 0.5, 0.4, 0.3], hair: HAIR_ANGLO, eyes: EYES_ANGLO, motorsport: 4, flag: { kind: 'custom', id: 'AU' }, colors: ['#00843D', '#FFCD00', '#012169'] },
  { id: 'NZ', name: 'New Zealand', adjective: 'New Zealander', wheel: 'Kiwi', nameGroup: 'english', skin: [2, 4, 3, 2, 1.5, 0.8, 0.4, 0.2], hair: HAIR_ANGLO, eyes: EYES_ANGLO, motorsport: 2.5, flag: { kind: 'custom', id: 'NZ' }, colors: ['#111111', '#FFFFFF', '#C8102E'] },
  { id: 'JP', name: 'Japan', adjective: 'Japanese', wheel: 'Japanese', nameGroup: 'japanese', skin: SKIN_EASTASIA, hair: HAIR_ASIA, eyes: EYES_ASIA, motorsport: 4, flag: { kind: 'custom', id: 'JP' }, colors: ['#FFFFFF', '#BC002D', '#1A1A1A'] },
  { id: 'CN', name: 'China', adjective: 'Chinese', wheel: 'Chinese', nameGroup: 'chinese', skin: SKIN_EASTASIA, hair: HAIR_ASIA, eyes: EYES_ASIA, motorsport: 2, flag: { kind: 'custom', id: 'CN' }, colors: ['#EE1C25', '#FFFF00', '#1A1A1A'] },
  { id: 'TH', name: 'Thailand', adjective: 'Thai', wheel: 'Thai', nameGroup: 'thai', skin: SKIN_SEASIA, hair: HAIR_ASIA, eyes: EYES_ASIA, motorsport: 1, flag: { kind: 'h', colors: ['#A51931', '#F4F5F8', '#2D2A4A', '#F4F5F8', '#A51931'], ratios: [1, 1, 2, 1, 1] }, colors: ['#2D2A4A', '#A51931', '#F4F5F8'] },
  { id: 'IN', name: 'India', adjective: 'Indian', wheel: 'Indian', nameGroup: 'indian', skin: [0, 0.2, 1, 2, 4, 4, 2, 0.5], hair: HAIR_ASIA, eyes: EYES_ASIA, motorsport: 1.5, flag: { kind: 'custom', id: 'IN' }, colors: ['#FF9933', '#FFFFFF', '#138808'] },
  { id: 'ZA', name: 'South Africa', adjective: 'South African', wheel: 'South African', nameGroup: 'southafrican', skin: [1, 2, 1, 1, 1, 1.5, 2.5, 2.5], hair: HAIR_AFRICA, eyes: EYES_AFRICA, motorsport: 1.2, flag: { kind: 'custom', id: 'ZA' }, colors: ['#007749', '#FFB81C', '#001489'] },
  { id: 'NA', name: 'Namibia', adjective: 'Namibian', wheel: 'Namibian', nameGroup: 'namibian', skin: [0.5, 1, 1, 1, 1.5, 2, 3, 3], hair: [6, 3, 1, 0.5, 0.5, 0.2, 0.1, 0.1, 0], eyes: EYES_AFRICA, motorsport: 0.3, flag: { kind: 'custom', id: 'NA' }, colors: ['#003580', '#D21034', '#009543'] },
];

export const NATION_MAP: Record<string, NationDef> = Object.fromEntries(NATIONS.map((n) => [n.id, n]));

export function nation(id: string): NationDef {
  return NATION_MAP[id] ?? NATIONS[0];
}

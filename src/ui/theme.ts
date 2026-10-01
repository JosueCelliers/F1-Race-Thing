/**
 * Design tokens. The whole UI reads from here so a new theme is one file.
 */
/**
 * MIDNIGHT MOTORSPORT
 * A night race seen through a broadcast graphics package: ink and carbon
 * surfaces, warm off-white type, and colour used only as a signal.
 *  - red (signal): primary actions, danger, the player
 *  - redDeep (racing red): stripes and structural accents
 *  - cyan: information
 *  - gold: prestige only (titles, elite ratings, records)
 */
export const C = {
  // World
  bg: '#07090E', // ink
  bg2: '#0B0E15', // ink, raised band
  surface: '#10141C', // carbon panel
  surface2: '#161B26', // raised control
  surface3: '#1F2532', // pressed control / empty meter
  line: 'rgba(242,238,230,0.08)',
  lineStrong: 'rgba(242,238,230,0.17)',
  // Type
  text: '#F2EEE6', // warm off-white
  textDim: '#A7AEBB', // light steel
  textMute: '#727A8A', // steel
  steel: '#8C94A4',
  // Signals
  red: '#FF2D55', // signal red
  redDeep: '#B3122F', // racing red
  gold: '#E8B749',
  goldDeep: '#A87A22',
  silver: '#C6CDD8',
  bronze: '#C98A5A',
  cyan: '#38D4E2',
  green: '#3DD68C',
  amber: '#F5A524',
  blue: '#5AB2FF',
  purple: '#9C82FF',
  orange: '#FF8A3D',
  pink: '#FF5FA2',
  black: '#000000',
  white: '#FFFFFF',
} as const;

/** Colour for a 0-100 rating: elite ratings earn gold. */
export function ratingColor(v: number): string {
  if (v >= 80) return C.gold;
  if (v >= 65) return C.cyan;
  if (v >= 50) return C.text;
  return C.steel;
}

export const F = {
  display: 'BarlowCondensed-Black-Italic',
  title: 'BarlowCondensed-ExtraBold-Italic',
  titleUp: 'BarlowCondensed-Bold-Italic',
  heading: 'BarlowCondensed-Bold',
  headingSemi: 'BarlowCondensed-SemiBold',
  body: 'Barlow-Regular',
  bodyMedium: 'Barlow-Medium',
  bodySemi: 'Barlow-SemiBold',
  bodyBold: 'Barlow-Bold',
} as const;

export const FONT_FILES = {
  [F.display]: require('../../assets/fonts/BarlowCondensed_900Black_Italic.ttf'),
  [F.title]: require('../../assets/fonts/BarlowCondensed_800ExtraBold_Italic.ttf'),
  [F.titleUp]: require('../../assets/fonts/BarlowCondensed_700Bold_Italic.ttf'),
  [F.heading]: require('../../assets/fonts/BarlowCondensed_700Bold.ttf'),
  [F.headingSemi]: require('../../assets/fonts/BarlowCondensed_600SemiBold.ttf'),
  [F.body]: require('../../assets/fonts/Barlow_400Regular.ttf'),
  [F.bodyMedium]: require('../../assets/fonts/Barlow_500Medium.ttf'),
  [F.bodySemi]: require('../../assets/fonts/Barlow_600SemiBold.ttf'),
  [F.bodyBold]: require('../../assets/fonts/Barlow_700Bold.ttf'),
};

/** Shapes are tight and technical: no big rounded cards. */
export const R = { xs: 2, sm: 4, md: 6, lg: 8, xl: 12, pill: 999 } as const;
export const S = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const POS_COLORS = [C.gold, C.silver, C.bronze];

/** Slightly lighten/darken a hex colour (-1..1). */
export function shade(hex: string, amt: number): string {
  const h = hex.replace('#', '');
  const n = parseInt(
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h.slice(0, 6),
    16,
  );
  let r = (n >> 16) & 255;
  let g = (n >> 8) & 255;
  let b = n & 255;
  if (amt >= 0) {
    r = Math.round(r + (255 - r) * amt);
    g = Math.round(g + (255 - g) * amt);
    b = Math.round(b + (255 - b) * amt);
  } else {
    r = Math.round(r * (1 + amt));
    g = Math.round(g * (1 + amt));
    b = Math.round(b * (1 + amt));
  }
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

export function withAlpha(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const n = parseInt(
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h.slice(0, 6),
    16,
  );
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/** Relative luminance (0..1) — pick readable text on coloured backgrounds. */
export function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const n = parseInt(
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h.slice(0, 6),
    16,
  );
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

export function readableOn(hex: string): string {
  return luminance(hex) > 0.45 ? '#0B0F19' : '#FFFFFF';
}

/** Linear mix between two hex colours. */
export function mix(a: string, b: string, t: number): string {
  const pa = parseInt(a.replace('#', '').slice(0, 6), 16);
  const pb = parseInt(b.replace('#', '').slice(0, 6), 16);
  const r = Math.round(((pa >> 16) & 255) * (1 - t) + ((pb >> 16) & 255) * t);
  const g = Math.round(((pa >> 8) & 255) * (1 - t) + ((pb >> 8) & 255) * t);
  const bl = Math.round((pa & 255) * (1 - t) + (pb & 255) * t);
  return `#${((1 << 24) | (r << 16) | (g << 8) | bl).toString(16).slice(1)}`;
}

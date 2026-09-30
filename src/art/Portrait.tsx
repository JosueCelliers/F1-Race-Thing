/**
 * Procedural driver portraits. A portrait is assembled from part drawings
 * (face shape, hair, brows, eyes, nose, mouth, facial hair, extras) and a race
 * suit in team colours. All parts are original vector art.
 *
 * To add a part: add metadata in src/content/looks.ts and a case below.
 */
import React from 'react';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { EYE_COLORS, HAIR_COLORS, SKIN_TONES } from '../content/nations';
import type { Gender, Looks, TeamColors } from '../sim/types';
import { mix, shade } from '../ui/theme';

interface Geo {
  w: number;
  jw: number;
  top: number;
  chin: number;
  cheekY: number;
  jawY: number;
  eyeY: number;
  HL: number;
}

const FACES: Record<string, Omit<Geo, 'eyeY' | 'HL'>> = {
  oval: { w: 37, jw: 25, top: 46, chin: 140, cheekY: 96, jawY: 121 },
  round: { w: 40, jw: 31, top: 48, chin: 137, cheekY: 97, jawY: 119 },
  square: { w: 38, jw: 33, top: 46, chin: 139, cheekY: 95, jawY: 126 },
  long: { w: 34, jw: 24, top: 42, chin: 143, cheekY: 97, jawY: 125 },
  heart: { w: 39, jw: 21, top: 46, chin: 140, cheekY: 93, jawY: 119 },
};

function geometry(face: string): Geo {
  const f = FACES[face] ?? FACES.oval;
  const eyeY = f.top + (f.chin - f.top) * 0.47;
  return { ...f, eyeY, HL: f.top + 20 };
}

function facePath(g: Geo): string {
  const { w, jw, top, chin, cheekY, jawY } = g;
  const r = 100 + w;
  const l = 100 - w;
  return [
    `M100 ${top}`,
    `C${100 + w * 0.62} ${top} ${r} ${top + 20} ${r} ${cheekY - 6}`,
    `C${r} ${jawY - 8} ${100 + jw + 8} ${jawY} ${100 + jw} ${jawY + 6}`,
    `C${100 + jw - 8} ${chin - 4} ${112} ${chin} 100 ${chin}`,
    `C88 ${chin} ${100 - jw + 8} ${chin - 4} ${100 - jw} ${jawY + 6}`,
    `C${100 - jw - 8} ${jawY} ${l} ${jawY - 8} ${l} ${cheekY - 6}`,
    `C${l} ${top + 20} ${100 - w * 0.62} ${top} 100 ${top}Z`,
  ].join(' ');
}

// ---------------------------------------------------------------------------
// Hair
// ---------------------------------------------------------------------------

interface HairColors {
  base: string;
  dark: string;
  light: string;
}

/** Outer skull-cap path used by most short styles. */
function cap(g: Geo, lift: number, spread: number, hairlineDrop: number, sideDrop = 0): string {
  const { w, top, eyeY, HL } = g;
  const W = w + spread;
  return [
    `M${100 - W} ${eyeY - 4 + sideDrop}`,
    `C${100 - W - 2} ${top + 6} ${100 - w * 0.62} ${top - lift} 100 ${top - lift}`,
    `C${100 + w * 0.62} ${top - lift} ${100 + W + 2} ${top + 6} ${100 + W} ${eyeY - 4 + sideDrop}`,
    `L${100 + w - 2} ${eyeY - 6}`,
    `C${100 + w - 3} ${HL + 8} ${100 + w * 0.5} ${HL + hairlineDrop} 100 ${HL + hairlineDrop + 1}`,
    `C${100 - w * 0.5} ${HL + hairlineDrop} ${100 - w + 3} ${HL + 8} ${100 - w + 2} ${eyeY - 6}Z`,
  ].join(' ');
}

function hairBack(style: string, g: Geo, c: HairColors): React.ReactNode {
  const { w, top, jawY } = g;
  switch (style) {
    case 'long':
      return (
        <Path
          d={`M${100 - w - 6} ${top + 16} C${100 - w - 10} ${top - 10} ${100 + w + 10} ${top - 10} ${100 + w + 6} ${top + 16} L${100 + w + 11} 170 C${100 + w + 6} 180 ${100 + w - 6} 180 ${100 + w - 12} 174 L${100 - w + 12} 174 C${100 - w + 6} 180 ${100 - w - 6} 180 ${100 - w - 11} 170Z`}
          fill={c.dark}
        />
      );
    case 'wavy':
      return (
        <Path
          d={`M${100 - w - 6} ${top + 16} C${100 - w - 10} ${top - 10} ${100 + w + 10} ${top - 10} ${100 + w + 6} ${top + 16} C${100 + w + 16} 120 ${100 + w + 4} 140 ${100 + w + 14} 160 C${100 + w + 18} 172 ${100 + w} 182 ${100 + w - 10} 172 L${100 - w + 10} 172 C${100 - w} 182 ${100 - w - 18} 172 ${100 - w - 14} 160 C${100 - w - 4} 140 ${100 - w - 16} 120 ${100 - w - 6} ${top + 16}Z`}
          fill={c.dark}
        />
      );
    case 'bob':
      return (
        <Path
          d={`M${100 - w - 7} ${top + 18} C${100 - w - 10} ${top - 10} ${100 + w + 10} ${top - 10} ${100 + w + 7} ${top + 18} L${100 + w + 9} ${jawY + 10} C${100 + w + 4} ${jawY + 16} ${100 + w - 4} ${jawY + 14} ${100 + w - 6} ${jawY + 8} L${100 - w + 6} ${jawY + 8} C${100 - w + 4} ${jawY + 14} ${100 - w - 4} ${jawY + 16} ${100 - w - 9} ${jawY + 10}Z`}
          fill={c.dark}
        />
      );
    case 'afro':
      return (
        <G>
          <Circle cx={100} cy={top + 30} r={w + 23} fill={c.dark} />
          {Array.from({ length: 16 }, (_, i) => {
            const a = (Math.PI * 2 * i) / 16;
            return <Circle key={i} cx={100 + Math.cos(a) * (w + 19)} cy={top + 30 + Math.sin(a) * (w + 19)} r={9} fill={c.dark} />;
          })}
        </G>
      );
    case 'ponytail':
      return (
        <Path
          d={`M${100 + w - 6} ${top + 14} C${100 + w + 22} ${top + 10} ${100 + w + 20} ${top + 60} ${100 + w + 14} ${top + 96} C${100 + w + 10} ${top + 118} ${100 + w - 2} ${top + 104} ${100 + w + 2} ${top + 70} C${100 + w + 4} ${top + 48} ${100 + w} ${top + 30} ${100 + w - 10} ${top + 22}Z`}
          fill={c.dark}
        />
      );
    case 'bun':
      return (
        <G>
          <Circle cx={100} cy={top - 10} r={15} fill={c.dark} />
          <Path d={`M88 ${top - 14} Q100 ${top - 22} 112 ${top - 12}`} stroke={c.base} strokeWidth={2} fill="none" strokeLinecap="round" />
        </G>
      );
    case 'braids': {
      const braids = [];
      for (const side of [-1, 1]) {
        for (let k = 0; k < 2; k++) {
          const x = 100 + side * (w + 3 + k * 7);
          for (let j = 0; j < 9; j++) braids.push(<Ellipse key={`${side}-${k}-${j}`} cx={x + (j % 2 ? 1.2 : -1.2)} cy={g.eyeY - 6 + j * 9} rx={4.2} ry={5.6} fill={j % 2 ? c.base : c.dark} />);
        }
      }
      return <G>{braids}</G>;
    }
    default:
      return null;
  }
}

function hairFront(style: string, g: Geo, c: HairColors): React.ReactNode {
  const { w, top, eyeY, HL } = g;
  switch (style) {
    case 'bald':
      return <Ellipse cx={100 - 10} cy={top + 10} rx={14} ry={6} fill="#FFFFFF" opacity={0.12} />;
    case 'buzz':
      return <Path d={cap(g, 3, 1, 1)} fill={c.base} opacity={0.92} />;
    case 'crop':
      return (
        <G>
          <Path d={cap(g, 8, 3, 3)} fill={c.base} />
          <Path
            d={`M${100 - 16} ${HL + 3} Q${100 - 6} ${HL + 9} 100 ${HL + 3} Q${106} ${HL + 9} ${100 + 16} ${HL + 3}`}
            stroke={c.dark}
            strokeWidth={2.2}
            fill="none"
            strokeLinecap="round"
            opacity={0.6}
          />
        </G>
      );
    case 'fade':
      return (
        <G>
          <Path d={cap(g, 2, 1, 1)} fill={c.base} opacity={0.35} />
          <Path
            d={`M${100 - w + 5} ${top + 16} C${100 - w + 4} ${top - 8} ${100 + w - 4} ${top - 8} ${100 + w - 5} ${top + 16} C${100 + w * 0.4} ${HL + 2} ${100 - w * 0.4} ${HL + 2} ${100 - w + 5} ${top + 16}Z`}
            fill={c.base}
          />
        </G>
      );
    case 'sidepart':
      return (
        <G>
          <Path
            d={`M${100 - w - 3} ${eyeY - 4} C${100 - w - 3} ${top} ${100 - 14} ${top - 13} 100 ${top - 12} C${100 + w * 0.7} ${top - 11} ${100 + w + 5} ${top + 10} ${100 + w + 2} ${eyeY - 6} L${100 + w - 3} ${eyeY - 8} C${100 + w - 4} ${HL + 4} ${100 + 16} ${HL - 6} ${100 - 4} ${HL - 2} C${100 - 18} ${HL + 1} ${100 - w + 6} ${HL + 8} ${100 - w + 2} ${eyeY - 6}Z`}
            fill={c.base}
          />
          <Path d={`M${100 - 14} ${top - 9} Q${100 - 16} ${HL - 6} ${100 - 13} ${HL - 1}`} stroke={c.dark} strokeWidth={1.6} fill="none" strokeLinecap="round" />
          <Path d={`M${100 - 4} ${top - 8} Q${100 + 20} ${top - 4} ${100 + w - 2} ${top + 16}`} stroke={c.light} strokeWidth={2} fill="none" strokeLinecap="round" opacity={0.5} />
        </G>
      );
    case 'quiff':
      return (
        <G>
          <Path
            d={`M${100 - w - 2} ${eyeY - 6} C${100 - w - 3} ${top + 2} ${100 - 22} ${top - 12} ${100 - 4} ${top - 22} C${100 + 12} ${top - 30} ${100 + w} ${top - 16} ${100 + w + 3} ${top + 8} L${100 + w + 1} ${eyeY - 6} L${100 + w - 2} ${eyeY - 8} C${100 + w - 3} ${HL + 6} ${100 + w * 0.5} ${HL} 100 ${HL + 1} C${100 - w * 0.5} ${HL} ${100 - w + 3} ${HL + 6} ${100 - w + 2} ${eyeY - 8}Z`}
            fill={c.base}
          />
          <Path d={`M${100 - 16} ${top - 10} Q${100 + 2} ${top - 26} ${100 + 22} ${top - 16}`} stroke={c.light} strokeWidth={2.4} fill="none" strokeLinecap="round" opacity={0.55} />
        </G>
      );
    case 'curly': {
      const bumps = [];
      for (let i = 0; i <= 12; i++) {
        const a = Math.PI + (Math.PI * i) / 12;
        bumps.push(<Circle key={i} cx={100 + Math.cos(a) * (w + 2)} cy={top + 30 + Math.sin(a) * (w - 4) * 1.02} r={8.5} fill={i % 2 ? c.base : shade(c.base, -0.12)} />);
      }
      return (
        <G>
          <Path d={cap(g, 7, 3, 4)} fill={c.base} />
          {bumps}
          <Circle cx={100 - 12} cy={HL + 2} r={6} fill={c.base} />
          <Circle cx={100 + 6} cy={HL + 3} r={6} fill={shade(c.base, -0.12)} />
        </G>
      );
    }
    case 'messy': {
      const { w: ww } = g;
      const pts: string[] = [];
      const n = 11;
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const a = Math.PI + Math.PI * t;
        const rr = ww + (i % 2 ? 12 : 3);
        pts.push(`${(100 + Math.cos(a) * rr).toFixed(1)} ${(top + 26 + Math.sin(a) * (rr - 4)).toFixed(1)}`);
      }
      return (
        <G>
          <Path
            d={`M${100 - ww - 2} ${eyeY - 6} L${pts.join(' L')} L${100 + ww + 2} ${eyeY - 6} L${100 + ww - 2} ${eyeY - 8} C${100 + ww - 3} ${HL + 6} ${100 + ww * 0.5} ${HL + 2} 100 ${HL + 3} C${100 - ww * 0.5} ${HL + 2} ${100 - ww + 3} ${HL + 6} ${100 - ww + 2} ${eyeY - 8}Z`}
            fill={c.base}
            strokeLinejoin="round"
          />
          <Path d={`M${100 - 10} ${HL} L${100 - 4} ${HL + 9} L${100 + 2} ${HL + 1} L${100 + 9} ${HL + 8}`} stroke={c.base} strokeWidth={5} strokeLinejoin="round" fill="none" />
        </G>
      );
    }
    case 'afro':
      return <Path d={cap(g, 10, 5, 3)} fill={c.base} />;
    case 'long':
    case 'wavy':
      return (
        <G>
          <Path
            d={`M100 ${top - 6} C${100 - w * 0.7} ${top - 6} ${100 - w - 6} ${top + 10} ${100 - w - 6} ${eyeY + 20} L${100 - w - 3} ${eyeY + 34} L${100 - w + 3} ${eyeY + 8} C${100 - w + 4} ${HL + 8} ${100 - 12} ${HL - 2} 100 ${HL - 6}Z`}
            fill={c.base}
          />
          <Path
            d={`M100 ${top - 6} C${100 + w * 0.7} ${top - 6} ${100 + w + 6} ${top + 10} ${100 + w + 6} ${eyeY + 20} L${100 + w + 3} ${eyeY + 34} L${100 + w - 3} ${eyeY + 8} C${100 + w - 4} ${HL + 8} ${100 + 12} ${HL - 2} 100 ${HL - 6}Z`}
            fill={shade(c.base, -0.06)}
          />
          <Path d={`M100 ${top - 5} L100 ${HL - 4}`} stroke={c.dark} strokeWidth={1.4} />
        </G>
      );
    case 'bob':
      return (
        <G>
          <Path d={cap(g, 8, 6, -2, 10)} fill={c.base} />
          <Path d={`M${100 - w + 2} ${HL + 12} C${100 - w + 4} ${HL - 8} ${100 + w - 4} ${HL - 8} ${100 + w - 2} ${HL + 12} L${100 + w - 8} ${HL + 14} L${100 - w + 8} ${HL + 14}Z`} fill={c.base} />
        </G>
      );
    case 'ponytail':
    case 'bun':
      return (
        <G>
          <Path d={cap(g, 5, 2, 0)} fill={c.base} />
          <Path d={`M${100 - 10} ${top - 3} Q100 ${top + 4} ${100 + 12} ${top - 2}`} stroke={c.light} strokeWidth={1.6} fill="none" opacity={0.5} />
        </G>
      );
    case 'pixie':
      return (
        <G>
          <Path d={cap(g, 7, 3, 2)} fill={c.base} />
          <Path
            d={`M${100 + w - 4} ${top + 8} C${100 + 10} ${HL - 4} ${100 - 16} ${HL + 4} ${100 - w + 6} ${HL + 14} L${100 - w + 2} ${HL + 2} C${100 - 20} ${top - 2} ${100 + 20} ${top - 4} ${100 + w - 4} ${top + 8}Z`}
            fill={shade(c.base, -0.05)}
          />
        </G>
      );
    case 'braids':
      return (
        <G>
          <Path d={cap(g, 4, 3, 1)} fill={c.base} />
          <Path d={`M100 ${top - 3} L100 ${HL}`} stroke={c.dark} strokeWidth={1.6} />
        </G>
      );
    default:
      return <Path d={cap(g, 6, 2, 2)} fill={c.base} />;
  }
}

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

function eyes(style: string, g: Geo, iris: string, lash: string) {
  const y = g.eyeY;
  const shapes: Record<string, { rx: number; ry: number; lid?: number }> = {
    round: { rx: 6.2, ry: 5.4 },
    almond: { rx: 7.4, ry: 4.4 },
    narrow: { rx: 7, ry: 3.2 },
    hooded: { rx: 7, ry: 4, lid: 2 },
    wide: { rx: 8, ry: 5 },
  };
  const s = shapes[style] ?? shapes.almond;
  return [-1, 1].map((side) => {
    const cx = 100 + side * 15;
    const d = `M${cx - s.rx} ${y} Q${cx} ${y - s.ry * 1.9} ${cx + s.rx} ${y} Q${cx} ${y + s.ry * 1.5} ${cx - s.rx} ${y}Z`;
    return (
      <G key={side}>
        <Path d={d} fill="#FBFBF8" />
        <Circle cx={cx + side * 0.4} cy={y - 0.4} r={Math.min(3.6, s.ry * 0.95)} fill={iris} />
        <Circle cx={cx + side * 0.4} cy={y - 0.4} r={Math.min(1.8, s.ry * 0.5)} fill="#140C08" />
        <Circle cx={cx + side * 0.4 + 1.1} cy={y - 1.6} r={0.9} fill="#FFFFFF" />
        <Path d={`M${cx - s.rx - 0.6} ${y + 0.2} Q${cx} ${y - s.ry * 1.95 - (s.lid ?? 0)} ${cx + s.rx + 0.6} ${y + 0.2}`} stroke={lash} strokeWidth={1.9} fill="none" strokeLinecap="round" />
        {s.lid ? <Path d={`M${cx - s.rx + 1} ${y - s.ry - 1.5} Q${cx} ${y - s.ry * 2.4} ${cx + s.rx - 1} ${y - s.ry - 1.5}`} stroke={lash} strokeOpacity={0.35} strokeWidth={1.2} fill="none" /> : null}
      </G>
    );
  });
}

function brows(style: string, g: Geo, color: string) {
  const y = g.eyeY - 10.5;
  return [-1, 1].map((side) => {
    const x0 = 100 + side * 7.5;
    const x1 = 100 + side * 23.5;
    let d: string;
    switch (style) {
      case 'arched':
        d = `M${x0} ${y + 1.5} Q${(x0 + x1) / 2} ${y - 4.5} ${x1} ${y + 1.5} L${x1} ${y + 3} Q${(x0 + x1) / 2} ${y - 1.5} ${x0} ${y + 4}Z`;
        break;
      case 'thick':
        d = `M${x0} ${y} Q${(x0 + x1) / 2} ${y - 3.5} ${x1} ${y} L${x1} ${y + 3.4} Q${(x0 + x1) / 2} ${y + 0.8} ${x0} ${y + 5}Z`;
        break;
      case 'thin':
        d = `M${x0} ${y + 1.5} Q${(x0 + x1) / 2} ${y - 2} ${x1} ${y + 1} L${x1} ${y + 2} Q${(x0 + x1) / 2} ${y - 0.6} ${x0} ${y + 2.8}Z`;
        break;
      case 'angled':
        d = `M${x0} ${y + 3} L${x0 + side * 9} ${y - 2.5} L${x1} ${y + 1} L${x1} ${y + 2.8} L${x0 + side * 9} ${y} L${x0} ${y + 5.2}Z`;
        break;
      default:
        d = `M${x0} ${y + 0.5} Q${(x0 + x1) / 2} ${y - 1.5} ${x1} ${y + 0.5} L${x1} ${y + 2.8} Q${(x0 + x1) / 2} ${y + 1} ${x0} ${y + 3.8}Z`;
    }
    return <Path key={side} d={d} fill={color} />;
  });
}

function nose(style: string, g: Geo, shadow: string) {
  const y = g.eyeY + 17;
  switch (style) {
    case 'button':
      return <Path d={`M${96} ${y} Q100 ${y + 4} 104 ${y}`} stroke={shadow} strokeWidth={2} fill="none" strokeLinecap="round" />;
    case 'wide':
      return (
        <G>
          <Path d={`M${93} ${y - 1} Q${95} ${y + 4} 100 ${y + 3} Q${105} ${y + 4} ${107} ${y - 1}`} stroke={shadow} strokeWidth={2} fill="none" strokeLinecap="round" />
          <Path d={`M${102} ${g.eyeY + 2} Q${104} ${y - 6} ${103} ${y - 3}`} stroke={shadow} strokeWidth={1.4} fill="none" opacity={0.6} />
        </G>
      );
    case 'long':
      return (
        <G>
          <Path d={`M${102.5} ${g.eyeY} L${104} ${y + 1} Q100 ${y + 5} ${96} ${y + 1.5}`} stroke={shadow} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </G>
      );
    case 'pointed':
      return <Path d={`M${101} ${g.eyeY + 1} L${105} ${y + 1} L${99} ${y + 3.5} L${96} ${y + 1}`} stroke={shadow} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
    default:
      return (
        <G>
          <Path d={`M${102} ${g.eyeY + 1} Q${104.5} ${y - 4} ${103.5} ${y}`} stroke={shadow} strokeWidth={1.6} fill="none" strokeLinecap="round" opacity={0.75} />
          <Path d={`M${95.5} ${y + 0.5} Q100 ${y + 4.5} ${104.5} ${y + 0.5}`} stroke={shadow} strokeWidth={2} fill="none" strokeLinecap="round" />
        </G>
      );
  }
}

function mouth(style: string, g: Geo, lip: string, dark: string) {
  const y = g.eyeY + 30;
  switch (style) {
    case 'grin':
      return (
        <G>
          <Path d={`M88 ${y - 2} Q100 ${y + 11} 112 ${y - 2} Q100 ${y + 2} 88 ${y - 2}Z`} fill="#3A1414" />
          <Path d={`M90 ${y - 1} Q100 ${y + 3.5} 110 ${y - 1} L109 ${y + 1.5} Q100 ${y + 5} 91 ${y + 1.5}Z`} fill="#FFFFFF" />
          <Path d={`M88 ${y - 2} Q100 ${y + 11} 112 ${y - 2}`} stroke={lip} strokeWidth={1.6} fill="none" strokeLinecap="round" />
        </G>
      );
    case 'neutral':
      return (
        <G>
          <Path d={`M91 ${y} Q100 ${y + 1.5} 109 ${y}`} stroke={dark} strokeWidth={2} fill="none" strokeLinecap="round" />
          <Path d={`M94 ${y + 3} Q100 ${y + 6} 106 ${y + 3}`} stroke={lip} strokeWidth={2.2} fill="none" strokeLinecap="round" opacity={0.7} />
        </G>
      );
    case 'smirk':
      return (
        <G>
          <Path d={`M91 ${y + 1} Q101 ${y + 3} 110 ${y - 3}`} stroke={dark} strokeWidth={2} fill="none" strokeLinecap="round" />
          <Path d={`M95 ${y + 4} Q101 ${y + 6.5} 106 ${y + 3}`} stroke={lip} strokeWidth={2} fill="none" strokeLinecap="round" opacity={0.7} />
        </G>
      );
    case 'open':
      return (
        <G>
          <Ellipse cx={100} cy={y + 2} rx={6.5} ry={5} fill="#3A1414" />
          <Path d={`M94 ${y - 0.5} Q100 ${y - 2} 106 ${y - 0.5}`} stroke="#FFFFFF" strokeWidth={2} fill="none" />
          <Ellipse cx={100} cy={y + 2} rx={7} ry={5.5} fill="none" stroke={lip} strokeWidth={1.6} />
        </G>
      );
    default:
      return (
        <G>
          <Path d={`M89 ${y - 1} Q100 ${y + 7} 111 ${y - 1}`} stroke={dark} strokeWidth={2.1} fill="none" strokeLinecap="round" />
          <Path d={`M94 ${y + 4.5} Q100 ${y + 7} 106 ${y + 4.5}`} stroke={lip} strokeWidth={2} fill="none" strokeLinecap="round" opacity={0.6} />
        </G>
      );
  }
}

function facialHair(style: string, g: Geo, hair: string) {
  const { jw, jawY, chin, eyeY, w } = g;
  const y = eyeY + 30;
  switch (style) {
    case 'stubble':
      return (
        <Path
          d={`M${100 - w + 2} ${eyeY + 14} C${100 - w + 2} ${jawY} ${100 - jw} ${jawY + 10} 100 ${chin + 0.5} C${100 + jw} ${jawY + 10} ${100 + w - 2} ${jawY} ${100 + w - 2} ${eyeY + 14} C${100 + w - 8} ${y + 2} ${100 + 16} ${y - 7} 100 ${y - 7} C${100 - 16} ${y - 7} ${100 - w + 8} ${y + 2} ${100 - w + 2} ${eyeY + 14}Z`}
          fill={hair}
          opacity={0.22}
        />
      );
    case 'beard':
      return (
        <G>
          <Path
            d={`M${100 - w + 1} ${eyeY + 12} C${100 - w} ${jawY + 6} ${100 - jw - 2} ${chin + 6} 100 ${chin + 9} C${100 + jw + 2} ${chin + 6} ${100 + w} ${jawY + 6} ${100 + w - 1} ${eyeY + 12} C${100 + w - 6} ${y + 6} ${100 + 12} ${y + 10} 100 ${y + 10} C${100 - 12} ${y + 10} ${100 - w + 6} ${y + 6} ${100 - w + 1} ${eyeY + 12}Z`}
            fill={hair}
          />
          <Path d={`M88 ${y - 3} Q100 ${y - 8} 112 ${y - 3} Q108 ${y - 1} 100 ${y - 3} Q92 ${y - 1} 88 ${y - 3}Z`} fill={hair} />
        </G>
      );
    case 'moustache':
      return <Path d={`M87 ${y - 1} Q93 ${y - 8} 100 ${y - 4} Q107 ${y - 8} 113 ${y - 1} Q107 ${y - 3} 100 ${y - 1.5} Q93 ${y - 3} 87 ${y - 1}Z`} fill={hair} />;
    case 'goatee':
      return (
        <G>
          <Path d={`M89 ${y - 2} Q100 ${y - 8} 111 ${y - 2} Q106 ${y - 1} 100 ${y - 2.5} Q94 ${y - 1} 89 ${y - 2}Z`} fill={hair} />
          <Path d={`M93 ${y + 7} Q100 ${y + 5} 107 ${y + 7} L105 ${chin + 3} Q100 ${chin + 6} 95 ${chin + 3}Z`} fill={hair} />
        </G>
      );
    default:
      return null;
  }
}

function extras(style: string, g: Geo, skinDark: string) {
  const { eyeY, w } = g;
  switch (style) {
    case 'freckles': {
      const pts = [
        [84, 104],
        [88, 101],
        [80, 101],
        [86, 107],
        [116, 104],
        [112, 101],
        [120, 101],
        [114, 107],
        [97, 99],
        [103, 99],
      ];
      return pts.map(([x, y], i) => <Circle key={i} cx={x} cy={y + (eyeY - 90)} r={0.95} fill={skinDark} opacity={0.65} />);
    }
    case 'earring':
      return <Circle cx={100 - w - 1} cy={eyeY + 14} r={2.4} fill="#E8C35A" stroke="#9C7A25" strokeWidth={0.6} />;
    case 'scar':
      return <Path d={`M113 ${eyeY - 16} L118 ${eyeY - 5}`} stroke="#FFFFFF" strokeOpacity={0.55} strokeWidth={1.4} strokeLinecap="round" />;
    case 'mole':
      return <Circle cx={112} cy={eyeY + 26} r={1.3} fill="#3B2416" opacity={0.8} />;
    case 'glasses':
      return (
        <G>
          <Rect x={76} y={eyeY - 8} width={20} height={15} rx={5} fill="#FFFFFF" fillOpacity={0.08} stroke="#1C1C22" strokeWidth={2.2} />
          <Rect x={104} y={eyeY - 8} width={20} height={15} rx={5} fill="#FFFFFF" fillOpacity={0.08} stroke="#1C1C22" strokeWidth={2.2} />
          <Path d={`M96 ${eyeY - 2} Q100 ${eyeY - 5} 104 ${eyeY - 2}`} stroke="#1C1C22" strokeWidth={2} fill="none" />
        </G>
      );
    default:
      return null;
  }
}

function suit(colors: TeamColors, gender: Gender) {
  const p = colors.primary;
  const s = colors.secondary;
  const a = colors.accent;
  const shoulder = gender === 'f' ? 26 : 18;
  return (
    <G>
      <Path d={`M${shoulder} 200 C${shoulder + 2} 176 ${44} 164 ${80} 158 L120 158 C156 164 ${200 - shoulder - 2} 176 ${200 - shoulder} 200Z`} fill={p} />
      <Path d={`M${shoulder + 4} 200 C${shoulder + 8} 184 ${48} 172 ${66} 168 L${74} 200Z`} fill={s} opacity={0.9} />
      <Path d={`M${200 - shoulder - 4} 200 C${200 - shoulder - 8} 184 ${152} 172 ${134} 168 L${126} 200Z`} fill={s} opacity={0.9} />
      <Path d={`M80 158 L120 158 L114 172 L86 172Z`} fill={shade(p, -0.25)} />
      <Rect x={82} y={151} width={36} height={10} rx={4} fill={s} />
      <Rect x={82} y={157} width={36} height={2.2} fill={a} opacity={0.9} />
      <Path d="M100 161 L100 200" stroke={shade(p, -0.4)} strokeWidth={1.4} />
      <Rect x={58} y={178} width={20} height={7} rx={2} fill={a} opacity={0.95} />
      <Rect x={124} y={178} width={16} height={7} rx={2} fill="#FFFFFF" opacity={0.85} />
      <Rect x={127} y={188} width={11} height={4} rx={1.5} fill={s} opacity={0.9} />
    </G>
  );
}

let idCounter = 0;

export interface PortraitProps {
  looks: Looks;
  gender: Gender;
  suit?: TeamColors;
  size?: number;
  /** Background style behind the bust. */
  bg?: 'none' | 'team' | 'dark';
  /** Optional age tint (grey hair / wrinkles for veterans). */
  age?: number;
  shape?: 'circle' | 'square' | 'none';
}

export const Portrait = React.memo(function Portrait({ looks, gender, suit: suitColors, size = 96, bg = 'team', age, shape = 'circle' }: PortraitProps) {
  const uid = React.useMemo(() => `pt${idCounter++}`, []);
  const g = geometry(looks.face);
  const skin = SKIN_TONES[looks.skin] ?? SKIN_TONES[2];
  const skinShadow = shade(skin, -0.13);
  const skinDark = shade(skin, -0.3);
  let hairBase = HAIR_COLORS[looks.hairColor] ?? HAIR_COLORS[1];
  if (age && age >= 44 && looks.hair !== 'bald') hairBase = mix(hairBase, HAIR_COLORS[8], Math.min(0.8, (age - 42) / 14));
  const hc: HairColors = { base: hairBase, dark: shade(hairBase, -0.28), light: shade(hairBase, 0.3) };
  const browColor = looks.hairColor >= 4 && looks.hairColor <= 5 ? shade(hairBase, -0.42) : shade(hairBase, -0.12);
  const iris = EYE_COLORS[looks.eyeColor] ?? EYE_COLORS[1];
  const lip = mix(skinShadow, '#B24A4F', 0.35);
  const mouthDark = shade(skin, -0.45);
  const colors = suitColors ?? { primary: '#2A3550', secondary: '#4A5A80', accent: '#FFFFFF' };
  const clip = shape !== 'none';

  const content = (
    <G>
      {bg !== 'none' ? (
        <>
          <Rect x={0} y={0} width={200} height={200} fill={`url(#${uid}bg)`} />
          <Circle cx={150} cy={40} r={70} fill={bg === 'team' ? colors.secondary : '#FFFFFF'} opacity={0.08} />
        </>
      ) : null}
      {hairBack(looks.hair, g, hc)}
      <Path d={`M84 ${g.chin - 20} L116 ${g.chin - 20} L118 164 Q100 170 82 164Z`} fill={skinShadow} />
      <Path d={`M84 ${g.chin - 8} Q100 ${g.chin + 10} 116 ${g.chin - 8} L116 ${g.chin + 4} Q100 ${g.chin + 14} 84 ${g.chin + 4}Z`} fill={skinDark} opacity={0.35} />
      {suit(colors, gender)}
      {[-1, 1].map((side) => (
        <G key={side}>
          <Ellipse cx={100 + side * (g.w + 1)} cy={g.eyeY + 5} rx={6} ry={10} fill={skin} />
          <Path
            d={`M${100 + side * (g.w + 3)} ${g.eyeY} Q${100 + side * (g.w + 5)} ${g.eyeY + 6} ${100 + side * (g.w + 2)} ${g.eyeY + 11}`}
            stroke={skinDark}
            strokeWidth={1.2}
            fill="none"
            opacity={0.5}
          />
        </G>
      ))}
      <Path d={facePath(g)} fill={skin} />
      <Path d={facePath(g)} fill={`url(#${uid}shade)`} />
      <Ellipse cx={100 - g.w * 0.45} cy={g.eyeY + 16} rx={8} ry={5} fill="#E86A6A" opacity={0.1} />
      <Ellipse cx={100 + g.w * 0.45} cy={g.eyeY + 16} rx={8} ry={5} fill="#E86A6A" opacity={0.1} />
      {facialHair(looks.facial, g, shade(hairBase, -0.1))}
      {mouth(looks.mouth, g, lip, mouthDark)}
      {nose(looks.nose, g, skinDark)}
      {eyes(looks.eyes, g, iris, '#1E1412')}
      {brows(looks.brows, g, browColor)}
      {age && age >= 36 ? (
        <G opacity={Math.min(0.5, (age - 34) * 0.04)}>
          <Path d={`M${100 - 26} ${g.eyeY + 4} l-3 2 M${100 + 26} ${g.eyeY + 4} l3 2`} stroke={skinDark} strokeWidth={1} />
          <Path d={`M${100 - 10} ${g.eyeY + 25} q-3 6 -1 10 M${100 + 10} ${g.eyeY + 25} q3 6 1 10`} stroke={skinDark} strokeWidth={1} fill="none" />
        </G>
      ) : null}
      {extras(looks.extra, g, skinDark)}
      {hairFront(looks.hair, g, hc)}
    </G>
  );

  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Defs>
        <LinearGradient id={`${uid}bg`} x1="0" y1="0" x2="0.3" y2="1">
          <Stop offset="0" stopColor={bg === 'team' ? shade(colors.primary, 0.1) : '#1F2B47'} />
          <Stop offset="1" stopColor={bg === 'team' ? shade(colors.primary, -0.55) : '#0B0F19'} />
        </LinearGradient>
        <LinearGradient id={`${uid}shade`} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.06" />
          <Stop offset="0.55" stopColor="#000000" stopOpacity="0" />
          <Stop offset="1" stopColor="#000000" stopOpacity="0.14" />
        </LinearGradient>
        <RadialGradient id={`${uid}vig`} cx="0.5" cy="0.45" r="0.7">
          <Stop offset="0.7" stopColor="#000000" stopOpacity="0" />
          <Stop offset="1" stopColor="#000000" stopOpacity="0.35" />
        </RadialGradient>
        <ClipPath id={`${uid}clip`}>{shape === 'circle' ? <Circle cx={100} cy={100} r={100} /> : <Rect x={0} y={0} width={200} height={200} rx={28} />}</ClipPath>
      </Defs>
      {clip ? <G clipPath={`url(#${uid}clip)`}>{content}</G> : content}
    </Svg>
  );
});

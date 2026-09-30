/**
 * Original vector race cars in two views (side profile and top-down) for every
 * car class. Bodies are clipped paths so any livery pattern can be painted on.
 *
 * Add a car class: add a SideDef/TopDef entry below and reference the class
 * from a series in src/content/series.ts.
 */
import React from 'react';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';
import type { HelmetDesign, TeamColors } from '../sim/types';
import { shade } from '../ui/theme';
import { HelmetShape } from './Helmet';
import { LiveryLayer } from './liveries';

const TYRE = '#15161A';
const CARBON = '#1E2027';

interface Wheel {
  cx: number;
  cy: number;
  r: number;
}

interface SideDef {
  w: number;
  h: number;
  body: string[];
  wheels: Wheel[];
  under?: (c: TeamColors) => React.ReactNode;
  over?: (c: TeamColors) => React.ReactNode;
  helmet?: { x: number; y: number; r: number };
  number: { x: number; y: number; size: number };
  livery: { x: number; y: number; w: number; h: number };
}

interface TopDef {
  w: number;
  h: number;
  body: string[];
  under: (c: TeamColors) => React.ReactNode;
  over?: (c: TeamColors, helmet?: HelmetDesign) => React.ReactNode;
  number?: { x: number; y: number; size: number };
  livery: { x: number; y: number; w: number; h: number };
}

// ---------------------------------------------------------------------------
// Side profiles (pointing right, ground at the bottom)
// ---------------------------------------------------------------------------

const formulaSide: SideDef = {
  w: 220,
  h: 64,
  body: [
    'M24 46 L27 31 C35 26 45 20 60 16 L70 12 C78 10 86 12 90 18 L94 22 L118 22 C134 22 152 28 178 34 L204 40 C207 42 205 45 200 45 L150 45 L130 47 L60 47Z',
    'M58 47 C62 35 71 30 86 30 L118 32 C125 34 129 40 129 47Z',
  ],
  wheels: [
    { cx: 44, cy: 47, r: 15.5 },
    { cx: 170, cy: 49, r: 13 },
  ],
  under: (c) => (
    <G>
      <Path d="M4 12 L20 12 L22 44 L8 44Z" fill={CARBON} />
      <Path d="M0 9 L36 7 L36 14 L0 16Z" fill={c.primary} />
      <Path d="M0 9 L36 7 L36 9.5 L0 11.5Z" fill={c.secondary} />
      <Path d="M16 34 L36 32 L36 36 L16 38Z" fill={CARBON} />
      <Rect x={30} y={46} width={146} height={5} rx={1.5} fill={CARBON} />
    </G>
  ),
  over: (c) => (
    <G>
      <Path d="M172 53 L214 51 L216 56 L174 58Z" fill={c.primary} />
      <Path d="M206 44 L216 45 L217 57 L206 57Z" fill={CARBON} />
      <Path d="M92 22 C97 11 112 9 123 20" stroke="#15161A" strokeWidth={3.2} fill="none" strokeLinecap="round" />
      <Path d="M128 24 L134 21" stroke={CARBON} strokeWidth={2} strokeLinecap="round" />
    </G>
  ),
  helmet: { x: 106, y: 16, r: 7.5 },
  number: { x: 72, y: 38, size: 11 },
  livery: { x: 24, y: 8, w: 184, h: 40 },
};

const indySide: SideDef = {
  ...formulaSide,
  body: [
    'M24 46 L27 30 C35 24 45 16 62 12 L72 9 C80 8 86 11 90 18 L94 22 L118 22 C134 22 152 29 176 35 L202 41 C205 43 203 45 198 45 L150 45 L130 47 L60 47Z',
    'M58 47 C62 36 71 31 86 31 L118 33 C125 35 129 40 129 47Z',
  ],
  under: (c) => (
    <G>
      <Path d="M6 14 L20 14 L22 44 L8 44Z" fill={CARBON} />
      <Path d="M0 12 L34 10 L34 17 L0 19Z" fill={c.primary} />
      <Path d="M20 36 L30 30 L42 30 L40 44 L22 44Z" fill={shade(c.primary, -0.35)} />
      <Rect x={30} y={46} width={146} height={5} rx={1.5} fill={CARBON} />
    </G>
  ),
  over: (c) => (
    <G>
      <Path d="M172 53 L214 51 L216 56 L174 58Z" fill={c.primary} />
      <Path d="M206 45 L216 46 L217 57 L206 57Z" fill={CARBON} />
      <Path d="M94 22 C96 13 104 9 118 10 L124 22" stroke="#9FD4FF" strokeOpacity={0.9} strokeWidth={2.4} fill="#9FD4FF" fillOpacity={0.25} />
    </G>
  ),
};

const protoSide: SideDef = {
  w: 230,
  h: 64,
  body: ['M8 42 C8 30 14 24 30 22 L64 20 C84 10 104 6 124 10 C140 14 150 22 164 26 L206 32 C220 35 226 40 226 46 L224 52 L10 52Z'],
  wheels: [
    { cx: 50, cy: 49, r: 14.5 },
    { cx: 184, cy: 49, r: 14.5 },
  ],
  under: (c) => (
    <G>
      <Path d="M2 20 L20 18 L22 34 L6 36Z" fill={CARBON} />
      <Path d="M0 16 L30 14 L30 20 L0 22Z" fill={c.primary} />
      <Path d="M40 22 L66 8 L72 8 L70 22Z" fill={c.secondary} />
    </G>
  ),
  over: () => (
    <G>
      <Path d="M92 14 C104 8 120 8 132 14 L128 22 L96 22Z" fill="#101318" />
      <Path d="M98 14 C106 11 116 11 124 14" stroke="#7FB8FF" strokeOpacity={0.5} strokeWidth={1.4} fill="none" />
      <Path d="M212 38 L224 40 L223 44 L212 42Z" fill="#FFF7C2" />
      <Rect x={12} y={50} width={212} height={4} rx={1.5} fill={CARBON} />
    </G>
  ),
  number: { x: 150, y: 40, size: 12 },
  livery: { x: 8, y: 6, w: 218, h: 46 },
};

const gtSide: SideDef = {
  w: 230,
  h: 70,
  body: ['M6 50 C6 40 10 34 24 32 L60 28 C74 16 94 10 118 11 C136 12 150 18 162 26 L204 32 C218 34 226 40 226 48 L224 56 L8 56Z'],
  wheels: [
    { cx: 52, cy: 55, r: 15.5 },
    { cx: 184, cy: 55, r: 15.5 },
  ],
  under: (c) => (
    <G>
      <Path d="M12 28 L20 28 L22 36 L14 36Z" fill={CARBON} />
      <Path d="M0 22 L34 20 L34 26 L0 28Z" fill={c.primary} />
    </G>
  ),
  over: () => (
    <G>
      <Path d="M80 26 C90 16 106 14 122 15 C134 16 144 20 152 27Z" fill="#101318" />
      <Path d="M114 16 L112 27" stroke="#2C3140" strokeWidth={2.4} />
      <Path d="M90 21 C98 17 108 16 118 16" stroke="#7FB8FF" strokeOpacity={0.45} strokeWidth={1.4} fill="none" />
      <Path d="M212 38 L224 41 L223 45 L212 43Z" fill="#FFF7C2" />
      <Path d="M8 38 L16 37 L16 42 L8 43Z" fill="#FF3040" />
      <Rect x={10} y={55} width={214} height={3.5} rx={1.5} fill={CARBON} />
    </G>
  ),
  number: { x: 138, y: 44, size: 13 },
  livery: { x: 6, y: 10, w: 220, h: 48 },
};

export const SIDE_DEFS: Record<string, SideDef> = {
  formula: formulaSide,
  formulaJunior: formulaSide,
  indy: indySide,
  prototype: protoSide,
  gt: gtSide,
};

// ---------------------------------------------------------------------------
// Top-down (pointing right)
// ---------------------------------------------------------------------------

function wheelsTop(front: number, rear: number, fy: number, ry: number, fw: number, rw: number, fh: number, rh: number) {
  return (
    <G>
      <Rect x={rear} y={22 - ry - rh} width={rw} height={rh} rx={2.5} fill={TYRE} />
      <Rect x={rear} y={22 + ry} width={rw} height={rh} rx={2.5} fill={TYRE} />
      <Rect x={front} y={22 - fy - fh} width={fw} height={fh} rx={2.5} fill={TYRE} />
      <Rect x={front} y={22 + fy} width={fw} height={fh} rx={2.5} fill={TYRE} />
    </G>
  );
}

const formulaTop: TopDef = {
  w: 110,
  h: 44,
  body: ['M9 17 L30 16 C40 11 58 10 66 15 L72 17.5 L100 20 C103 21 103 23 100 24 L72 26.5 L66 29 C58 34 40 33 30 28 L9 27Z'],
  under: (c) => (
    <G>
      <Path d="M20 14 L28 6 M20 30 L28 38 M78 16 L84 7 M78 28 L84 37" stroke={CARBON} strokeWidth={1.4} />
      {wheelsTop(79, 11, 11, 11, 13, 18, 8, 9)}
      <Rect x={0} y={7} width={8} height={30} rx={1.5} fill={CARBON} />
      <Rect x={1} y={7} width={6} height={30} rx={1} fill={c.primary} />
      <Rect x={95} y={4} width={7} height={36} rx={1.5} fill={c.primary} />
      <Rect x={95} y={4} width={2.5} height={36} rx={1} fill={c.secondary} />
    </G>
  ),
  over: (c, helmet) => (
    <G>
      <Ellipse cx={60} cy={22} rx={9} ry={4.8} fill="#0E1015" />
      <Circle cx={61} cy={22} r={3.8} fill={helmet?.colors[0] ?? '#FFFFFF'} />
      <Circle cx={61.5} cy={22} r={1.6} fill={helmet?.colors[1] ?? c.secondary} />
      <Path d="M52 17.5 C60 15 70 16 71 22 C70 28 60 29 52 26.5" stroke="#15161A" strokeWidth={1.6} fill="none" />
    </G>
  ),
  number: { x: 84, y: 22, size: 6 },
  livery: { x: 9, y: 10, w: 94, h: 24 },
};

const indyTop: TopDef = {
  ...formulaTop,
  under: (c) => (
    <G>
      <Path d="M20 14 L28 6 M20 30 L28 38 M78 16 L84 7 M78 28 L84 37" stroke={CARBON} strokeWidth={1.4} />
      {wheelsTop(79, 11, 11, 11, 13, 18, 8, 9)}
      <Rect x={2} y={4} width={10} height={36} rx={3} fill={shade(c.primary, -0.3)} />
      <Rect x={0} y={9} width={8} height={26} rx={1.5} fill={c.primary} />
      <Rect x={95} y={5} width={7} height={34} rx={1.5} fill={c.primary} />
    </G>
  ),
  over: (c, helmet) => (
    <G>
      <Ellipse cx={60} cy={22} rx={9} ry={4.8} fill="#0E1015" />
      <Circle cx={61} cy={22} r={3.8} fill={helmet?.colors[0] ?? '#FFFFFF'} />
      <Path d="M66 16 C73 18 73 26 66 28" stroke="#9FD4FF" strokeWidth={2.2} fill="none" strokeOpacity={0.9} />
    </G>
  ),
};

const protoTop: TopDef = {
  w: 110,
  h: 44,
  body: ['M4 9 C4 5 8 4 14 4 L78 5 C94 6 104 11 107 18 L107 26 C104 33 94 38 78 39 L14 40 C8 40 4 39 4 35Z'],
  under: () => <G>{wheelsTop(80, 20, 15, 15, 14, 15, 5, 5)}</G>,
  over: (c) => (
    <G>
      <Path d="M52 15 C62 13 74 14 80 18 L80 26 C74 30 62 31 52 29Z" fill="#101318" />
      <Path d="M6 21 L50 21 L50 23 L6 23Z" fill={shade(c.primary, -0.35)} />
      <Rect x={1} y={3} width={7} height={38} rx={2} fill={CARBON} />
      <Path d="M101 12 L106 16 M101 32 L106 28" stroke="#FFF7C2" strokeWidth={2} strokeLinecap="round" />
    </G>
  ),
  number: { x: 30, y: 22, size: 9 },
  livery: { x: 4, y: 4, w: 104, h: 36 },
};

const gtTop: TopDef = {
  w: 110,
  h: 46,
  body: ['M4 10 C4 5 9 4 16 4 L84 4 C98 5 106 10 107 18 L107 28 C106 36 98 41 84 42 L16 42 C9 42 4 41 4 36Z'],
  under: () => <G>{wheelsTop(78, 18, 17, 17, 15, 16, 4, 4)}</G>,
  over: (c) => (
    <G>
      <Path d="M44 12 L78 10 C82 14 83 32 78 36 L44 34 C40 30 40 16 44 12Z" fill="#101318" />
      <Path d="M50 14 L74 13 C77 17 77 29 74 33 L50 32 C47 28 47 18 50 14Z" fill={c.primary} />
      <Path d="M78 10 L86 8 L86 38 L78 36" stroke="#101318" strokeWidth={1.2} fill="#2A3040" />
      <Path d="M64 6 L60 3 M64 40 L60 43" stroke={c.primary} strokeWidth={3} strokeLinecap="round" />
      <Rect x={1} y={5} width={8} height={36} rx={2} fill={CARBON} />
      <Path d="M102 11 L106 15 M102 35 L106 31" stroke="#FFF7C2" strokeWidth={2} strokeLinecap="round" />
    </G>
  ),
  number: { x: 62, y: 23, size: 10 },
  livery: { x: 4, y: 4, w: 104, h: 38 },
};

export const TOP_DEFS: Record<string, TopDef> = {
  formula: formulaTop,
  formulaJunior: formulaTop,
  indy: indyTop,
  prototype: protoTop,
  gt: gtTop,
};

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

let uidN = 0;

export interface CarProps {
  carClass: string;
  colors: TeamColors;
  livery: string;
  number?: number;
  helmet?: HelmetDesign;
  /** Rendered width in px. */
  width?: number;
  /** Draw a soft shadow under the car. */
  shadow?: boolean;
}

export const CarSide = React.memo(function CarSide({ carClass, colors, livery, number, helmet, width = 220, shadow = true }: CarProps) {
  const d = SIDE_DEFS[carClass] ?? SIDE_DEFS.formula;
  const uid = React.useMemo(() => `cs${uidN++}`, []);
  const height = (width * d.h) / d.w;
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${d.w} ${d.h}`}>
      <Defs>
        <ClipPath id={`${uid}c`}>
          {d.body.map((p, i) => (
            <Path key={i} d={p} />
          ))}
        </ClipPath>
        <LinearGradient id={`${uid}g`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.28" />
          <Stop offset="0.45" stopColor="#FFFFFF" stopOpacity="0" />
          <Stop offset="1" stopColor="#000000" stopOpacity="0.35" />
        </LinearGradient>
        <LinearGradient id={`${uid}t`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#3A3D48" />
          <Stop offset="1" stopColor="#0B0C10" />
        </LinearGradient>
      </Defs>
      {shadow ? <Ellipse cx={d.w / 2} cy={d.h - 2} rx={d.w * 0.46} ry={3.5} fill="#000000" opacity={0.35} /> : null}
      {d.under?.(colors)}
      <G clipPath={`url(#${uid}c)`}>
        <LiveryLayer id={livery} colors={colors} {...d.livery} />
        <Rect x={0} y={0} width={d.w} height={d.h} fill={`url(#${uid}g)`} />
      </G>
      {d.body.map((p, i) => (
        <Path key={i} d={p} fill="none" stroke="#000000" strokeOpacity={0.35} strokeWidth={0.8} />
      ))}
      {d.helmet && helmet ? (
        <G transform={`translate(${d.helmet.x - d.helmet.r} ${d.helmet.y - d.helmet.r}) scale(${(d.helmet.r * 2) / 100})`}>
          <HelmetShape design={helmet} />
        </G>
      ) : null}
      {d.over?.(colors)}
      {d.wheels.map((wh, i) => (
        <G key={i}>
          <Circle cx={wh.cx} cy={wh.cy} r={wh.r} fill={`url(#${uid}t)`} />
          <Circle cx={wh.cx} cy={wh.cy} r={wh.r * 0.55} fill="#2B2E37" stroke="#4A4F5C" strokeWidth={1} />
          <Circle cx={wh.cx} cy={wh.cy} r={wh.r * 0.18} fill={colors.accent} />
          <Path d={`M${wh.cx - wh.r * 0.8} ${wh.cy - wh.r * 0.25} A${wh.r * 0.85} ${wh.r * 0.85} 0 0 1 ${wh.cx + wh.r * 0.2} ${wh.cy - wh.r * 0.82}`} stroke="#FFFFFF" strokeOpacity={0.12} strokeWidth={1.5} fill="none" />
        </G>
      ))}
      {number !== undefined ? (
        <SvgText
          x={d.number.x}
          y={d.number.y}
          fontSize={d.number.size}
          fontFamily="BarlowCondensed-Black-Italic"
          fontWeight="900"
          fill="#FFFFFF"
          stroke="#000000"
          strokeWidth={0.8}
          textAnchor="middle"
        >
          {number}
        </SvgText>
      ) : null}
    </Svg>
  );
});

export const CarTop = React.memo(function CarTop({ carClass, colors, livery, number, helmet, width = 110, shadow = true }: CarProps) {
  const d = TOP_DEFS[carClass] ?? TOP_DEFS.formula;
  const uid = React.useMemo(() => `ct${uidN++}`, []);
  const height = (width * d.h) / d.w;
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${d.w} ${d.h}`}>
      <Defs>
        <ClipPath id={`${uid}c`}>
          {d.body.map((p, i) => (
            <Path key={i} d={p} />
          ))}
        </ClipPath>
        <LinearGradient id={`${uid}g`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.22" />
          <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0" />
          <Stop offset="1" stopColor="#000000" stopOpacity="0.3" />
        </LinearGradient>
      </Defs>
      {shadow ? <Ellipse cx={d.w / 2 + 3} cy={d.h / 2 + 3} rx={d.w * 0.48} ry={d.h * 0.42} fill="#000000" opacity={0.3} /> : null}
      {d.under(colors)}
      <G clipPath={`url(#${uid}c)`}>
        <LiveryLayer id={livery} colors={colors} {...d.livery} />
        <Rect x={0} y={0} width={d.w} height={d.h} fill={`url(#${uid}g)`} />
      </G>
      {d.body.map((p, i) => (
        <Path key={i} d={p} fill="none" stroke="#000000" strokeOpacity={0.35} strokeWidth={0.7} />
      ))}
      {d.over?.(colors, helmet)}
      {number !== undefined && d.number ? (
        <SvgText
          x={d.number.x}
          y={d.number.y + d.number.size * 0.36}
          fontSize={d.number.size}
          fontFamily="BarlowCondensed-Black-Italic"
          fontWeight="900"
          fill="#FFFFFF"
          stroke="#000000"
          strokeWidth={0.5}
          textAnchor="middle"
          transform={`rotate(90 ${d.number.x} ${d.number.y})`}
        >
          {number}
        </SvgText>
      ) : null}
    </Svg>
  );
});

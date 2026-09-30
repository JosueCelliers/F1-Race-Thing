/**
 * Driver helmets (side view, facing right) with a library of paint designs.
 * `HelmetShape` draws into a 100x100 box so it can be embedded in cars.
 */
import React from 'react';
import Svg, { Circle, ClipPath, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import type { HelmetDesign } from '../sim/types';
import { shade } from '../ui/theme';

const SHELL = 'M14 70 C8 50 12 22 38 12 C58 4 82 10 90 30 L94 50 C96 60 94 72 88 80 L80 88 L30 88 C20 86 16 80 14 70Z';
const VISOR = 'M48 36 L92 33 C95 40 95 52 92 58 L50 60 C44 54 44 42 48 36Z';

function starPts(cx: number, cy: number, r: number) {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 === 0 ? r : r * 0.45;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(`${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`);
  }
  return 'M' + pts.join(' L') + 'Z';
}

function pattern(p: string, c2: string, c3: string): React.ReactNode {
  switch (p) {
    case 'stripe':
      return (
        <G>
          <Path d="M0 30 L100 18 L100 30 L0 42Z" fill={c2} />
          <Path d="M0 44 L100 32 L100 35 L0 47Z" fill={c3} />
        </G>
      );
    case 'chevron':
      return (
        <G>
          <Path d="M10 8 L60 40 L10 72 L-4 72 L46 40 L-4 8Z" fill={c2} />
          <Path d="M30 8 L80 40 L30 72 L22 72 L72 40 L22 8Z" fill={c3} />
        </G>
      );
    case 'split':
      return (
        <G>
          <Path d="M0 0 L100 0 L100 34 L0 50Z" fill={c2} />
          <Path d="M0 50 L100 34 L100 38 L0 54Z" fill={c3} />
        </G>
      );
    case 'stars':
      return (
        <G>
          <Path d={starPts(30, 30, 9)} fill={c2} />
          <Path d={starPts(58, 20, 7)} fill={c3} />
          <Path d={starPts(24, 62, 7)} fill={c3} />
          <Path d={starPts(70, 70, 6)} fill={c2} />
        </G>
      );
    case 'flames':
      return (
        <G>
          <Path d="M100 60 C80 58 70 70 50 64 C58 62 60 56 52 52 C44 60 30 58 18 66 C24 56 20 50 8 50 L0 90 L100 90Z" fill={c2} />
          <Path d="M100 72 C84 70 76 80 60 76 C64 72 62 68 56 68 C48 74 34 74 24 80 L20 92 L100 92Z" fill={c3} />
        </G>
      );
    case 'halo':
      return (
        <G>
          <Path d="M8 52 C12 18 70 2 96 30 L92 36 C70 12 22 22 18 56Z" fill={c2} />
          <Path d="M18 56 C22 22 70 12 92 36 L90 40 C70 18 26 28 24 58Z" fill={c3} />
        </G>
      );
    case 'checker': {
      const cells = [];
      for (let x = 0; x < 100; x += 8)
        for (let y = 62; y < 92; y += 8) if (((x + y) / 8) % 2 === 0) cells.push(<Rect key={`${x}-${y}`} x={x} y={y} width={8} height={8} fill={c2} />);
      return (
        <G>
          {cells}
          <Rect x={0} y={58} width={100} height={4} fill={c3} />
        </G>
      );
    }
    case 'dots':
      return (
        <G>
          {[
            [24, 24, 6],
            [44, 16, 4],
            [30, 44, 5],
            [16, 60, 4],
            [60, 24, 3.5],
            [40, 70, 5],
            [62, 76, 4],
          ].map(([x, y, r], i) => (
            <Circle key={i} cx={x} cy={y} r={r} fill={i % 2 ? c3 : c2} />
          ))}
        </G>
      );
    case 'bolt':
      return <Path d="M0 36 L46 30 L38 44 L100 36 L50 62 L56 50 L0 58Z" fill={c2} stroke={c3} strokeWidth={2} />;
    case 'crown':
      return (
        <G>
          <Path d="M22 24 L30 8 L38 20 L46 4 L54 20 L62 8 L68 24Z" fill={c2} />
          <Path d="M0 56 L100 44 L100 50 L0 62Z" fill={c3} />
        </G>
      );
    default:
      return null;
  }
}

let uidN = 0;

export function HelmetShape({ design }: { design: HelmetDesign }) {
  const uid = React.useMemo(() => `hm${uidN++}`, []);
  const [c1, c2, c3] = design.colors;
  return (
    <G>
      <Defs>
        <ClipPath id={`${uid}c`}>
          <Path d={SHELL} />
        </ClipPath>
        <LinearGradient id={`${uid}s`} x1="0" y1="0" x2="0.2" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.45" />
          <Stop offset="0.35" stopColor="#FFFFFF" stopOpacity="0" />
          <Stop offset="1" stopColor="#000000" stopOpacity="0.4" />
        </LinearGradient>
        <LinearGradient id={`${uid}v`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#3B4A6B" />
          <Stop offset="0.5" stopColor="#0C1222" />
          <Stop offset="1" stopColor="#1E2E55" />
        </LinearGradient>
      </Defs>
      <G clipPath={`url(#${uid}c)`}>
        <Rect x={0} y={0} width={100} height={100} fill={c1} />
        {pattern(design.pattern, c2, c3)}
        <Rect x={0} y={0} width={100} height={100} fill={`url(#${uid}s)`} />
      </G>
      <Path d={SHELL} fill="none" stroke={shade(c1, -0.5)} strokeOpacity={0.6} strokeWidth={1.5} />
      <Path d={VISOR} fill={`url(#${uid}v)`} stroke="#05070D" strokeWidth={2} />
      <Path d="M54 40 L86 38" stroke="#FFFFFF" strokeOpacity={0.35} strokeWidth={2.5} strokeLinecap="round" />
      <Path d="M28 88 L80 88" stroke="#05070D" strokeWidth={3} strokeLinecap="round" />
    </G>
  );
}

export function Helmet({ design, size = 64 }: { design: HelmetDesign; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <HelmetShape design={design} />
    </Svg>
  );
}

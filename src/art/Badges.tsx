import React from 'react';
import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';
import type { TeamColors } from '../sim/types';
import { readableOn, shade } from '../ui/theme';

let n = 0;

/** Team emblem: a shield in team colours with the team code. */
export function TeamBadge({ colors, short, size = 36 }: { colors: TeamColors; short: string; size?: number }) {
  const id = React.useMemo(() => `tb${n++}`, []);
  return (
    <Svg width={size} height={size * 1.12} viewBox="0 0 100 112">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={shade(colors.primary, 0.15)} />
          <Stop offset="1" stopColor={shade(colors.primary, -0.35)} />
        </LinearGradient>
      </Defs>
      <Path d="M50 4 L94 18 L94 58 C94 84 74 100 50 108 C26 100 6 84 6 58 L6 18Z" fill={`url(#${id})`} stroke={colors.secondary} strokeWidth={5} />
      <Path d="M6 42 L94 26 L94 40 L6 56Z" fill={colors.secondary} opacity={0.9} />
      <Path d="M6 58 L94 42 L94 47 L6 63Z" fill={colors.accent} opacity={0.9} />
      <SvgText
        x={50}
        y={88}
        fontSize={27}
        fontFamily="BarlowCondensed-Black-Italic"
        fontWeight="900"
        fill={readableOn(colors.primary)}
        textAnchor="middle"
      >
        {short}
      </SvgText>
    </Svg>
  );
}

/** Golden trophy illustration. */
export function Trophy({ size = 80, color = 'gold' }: { size?: number; color?: 'gold' | 'silver' | 'bronze' }) {
  const id = React.useMemo(() => `tr${n++}`, []);
  const tones = {
    gold: ['#FFF1B0', '#FFC940', '#B97D00'],
    silver: ['#FFFFFF', '#CFD6E3', '#7E889C'],
    bronze: ['#FFD7B5', '#E0915A', '#8A4A1C'],
  }[color];
  return (
    <Svg width={size} height={size * 1.2} viewBox="0 0 100 120">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={tones[2]} />
          <Stop offset="0.35" stopColor={tones[0]} />
          <Stop offset="0.6" stopColor={tones[1]} />
          <Stop offset="1" stopColor={tones[2]} />
        </LinearGradient>
      </Defs>
      <Path d="M22 14 C4 14 4 44 30 50" stroke={`url(#${id})`} strokeWidth={6} fill="none" />
      <Path d="M78 14 C96 14 96 44 70 50" stroke={`url(#${id})`} strokeWidth={6} fill="none" />
      <Path d="M20 8 L80 8 L78 30 C76 52 64 64 50 66 C36 64 24 52 22 30Z" fill={`url(#${id})`} />
      <Path d="M28 14 L36 14 L36 40 C34 36 30 28 28 14Z" fill="#FFFFFF" opacity={0.35} />
      <Rect x={45} y={66} width={10} height={20} fill={`url(#${id})`} />
      <Path d="M32 86 L68 86 L72 98 L28 98Z" fill={`url(#${id})`} />
      <Rect x={22} y={98} width={56} height={14} rx={3} fill="#1B1F2A" stroke={tones[1]} strokeWidth={2} />
      <G>
        <Circle cx={50} cy={32} r={9} fill={tones[2]} opacity={0.35} />
        <Path d="M50 24 l2.5 5 5.5.8-4 3.9 1 5.5-5-2.6-5 2.6 1-5.5-4-3.9 5.5-.8z" fill={tones[0]} />
      </G>
    </Svg>
  );
}

/** Chequered flag emblem used for branding. */
export function ChequeredMark({ size = 40, color = '#FFFFFF' }: { size?: number; color?: string }) {
  const cells = [];
  for (let y = 0; y < 5; y++)
    for (let x = 0; x < 6; x++) {
      if ((x + y) % 2 === 0) cells.push(<Rect key={`${x}-${y}`} x={10 + x * 14} y={10 + y * 14} width={14} height={14} fill={color} />);
    }
  return (
    <Svg width={size} height={size} viewBox="0 0 104 104">
      <G transform="skewX(-12) translate(12 6)">{cells}</G>
    </Svg>
  );
}

/**
 * The Wheel of Fate. Weighted slices, chasing rim lights, a ticking pointer
 * with haptics, and a physically-flavoured deceleration.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, G, LinearGradient, Path, Polygon, RadialGradient, Stop, Text as SvgText } from 'react-native-svg';
import { FlagShape } from '../art/Flag';
import type { WheelSlice } from '../sim/creation';
import { haptic } from './haptics';
import { Press, Txt } from './kit';
import { C, F, readableOn, shade } from './theme';

export const WHEEL_PALETTE = ['#FF3B5C', '#FF8A1F', '#FFC940', '#9BE15D', '#24D17E', '#2EE6D6', '#3BA7FF', '#5B6CFF', '#A874FF', '#FF5FA2', '#FF6B3D', '#46D3A8'];

export interface SpinRequest {
  id: number;
  target: number;
}

interface Props {
  slices: WheelSlice[];
  size?: number;
  request?: SpinRequest | null;
  onDone?: (index: number) => void;
  onPressHub?: () => void;
  fast?: boolean;
  disabled?: boolean;
  hubLabel?: string;
  winner?: number | null;
}

function polar(cx: number, cy: number, r: number, deg: number) {
  const a = (deg * Math.PI) / 180;
  return { x: cx + r * Math.sin(a), y: cy - r * Math.cos(a) };
}

function wedge(cx: number, cy: number, r: number, a0: number, a1: number) {
  const p0 = polar(cx, cy, r, a0);
  const p1 = polar(cx, cy, r, a1);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M${cx} ${cy} L${p0.x.toFixed(2)} ${p0.y.toFixed(2)} A${r} ${r} 0 ${large} 1 ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}Z`;
}

function starPoints(cx: number, cy: number, r: number) {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 === 0 ? r : r * 0.45;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(`${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`);
  }
  return pts.join(' ');
}

export function sliceAngles(slices: WheelSlice[]): number[] {
  const total = slices.reduce((a, s) => a + s.weight, 0) || 1;
  const out = [0];
  let acc = 0;
  for (const s of slices) {
    acc += (s.weight / total) * 360;
    out.push(acc);
  }
  return out;
}

export function SpinWheel({ slices, size = 320, request, onDone, onPressHub, fast, disabled, hubLabel = 'SPIN', winner }: Props) {
  const rot = useSharedValue(0);
  const pointer = useSharedValue(0);
  const bulbs = useSharedValue(0);
  const spinning = useSharedValue(0);
  const lastReq = useRef<number | null>(null);
  const angles = useMemo(() => sliceAngles(slices), [slices]);
  const R = 500;
  const cx = 500;
  const cy = 500;
  const rimOuter = 492;
  const rimInner = 444;
  const radius = 436;

  useEffect(() => {
    bulbs.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(bulbs);
  }, [bulbs]);

  // Reset rotation when a new wheel is shown.
  useEffect(() => {
    cancelAnimation(rot);
    rot.value = Math.random() * 360;
  }, [slices, rot]);

  const tick = () => haptic.tick();

  useAnimatedReaction(
    () => {
      const a = ((-rot.value % 360) + 360) % 360;
      let idx = 0;
      for (let i = 0; i < angles.length - 1; i++) if (a >= angles[i]) idx = i;
      return idx;
    },
    (cur, prev) => {
      if (prev !== null && cur !== prev && spinning.value === 1) {
        pointer.value = withSequence(withTiming(-16, { duration: 35 }), withSpring(0, { damping: 7, stiffness: 420 }));
        runOnJS(tick)();
      }
    },
    [angles],
  );

  useEffect(() => {
    if (!request || request.id === lastReq.current) return;
    lastReq.current = request.id;
    const a0 = angles[request.target];
    const a1 = angles[request.target + 1];
    const theta = a0 + (a1 - a0) * (0.18 + Math.random() * 0.64);
    const now = rot.value;
    const turns = fast ? 2 : 5 + Math.floor(Math.random() * 2);
    const delta = ((((-theta - now) % 360) + 360) % 360) + 360 * turns;
    const duration = fast ? 1300 : 4200 + Math.random() * 700;
    spinning.set(1);
    haptic.medium();
    const finish = () => {
      haptic.thud();
      onDone?.(request.target);
    };
    rot.set(
      withTiming(now + delta, { duration, easing: Easing.bezier(0.1, 0.72, 0.12, 1) }, (ok) => {
        spinning.value = 0;
        if (ok) runOnJS(finish)();
      }),
    );
  }, [request, angles, fast, rot, spinning, onDone]);

  const wheelStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot.value}deg` }] }));
  const pointerStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -size * 0.05 }, { rotate: `${pointer.value}deg` }] }));
  const bulbsA = useAnimatedStyle(() => ({ opacity: bulbs.value < 0.5 ? 1 : 0.25 }));
  const bulbsB = useAnimatedStyle(() => ({ opacity: bulbs.value < 0.5 ? 0.25 : 1 }));

  const colors = slices.map((s, i) => s.color ?? WHEEL_PALETTE[i % WHEEL_PALETTE.length]);
  const n = slices.length;
  const bulbCount = 28;

  const labelFont = n > 10 ? 36 : n > 7 ? 40 : 44;

  const wheel = (
    <Svg width={size} height={size} viewBox={`0 0 ${R * 2} ${R * 2}`}>
      <Defs>
        <RadialGradient id="wsheen" cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.18" />
          <Stop offset="0.6" stopColor="#FFFFFF" stopOpacity="0" />
          <Stop offset="0.93" stopColor="#000000" stopOpacity="0.08" />
          <Stop offset="1" stopColor="#000000" stopOpacity="0.4" />
        </RadialGradient>
      </Defs>
      {slices.map((s, i) => {
        const a0 = angles[i];
        const a1 = angles[i + 1];
        const mid = (a0 + a1) / 2;
        const col = colors[i];
        const fg = readableOn(col);
        const dim = winner !== null && winner !== undefined && winner !== i;
        const labelR = radius - 34;
        const p = polar(cx, cy, labelR, mid);
        const span = a1 - a0;
        const text = s.label;
        return (
          <G key={s.id + i}>
            <Path d={wedge(cx, cy, radius, a0, a1)} fill={col} />
            <Path d={wedge(cx, cy, radius, a0, a1)} fill="#000000" opacity={dim ? 0.55 : 0} />
            {span > 6 ? (
              <G transform={`rotate(${mid - 90} ${p.x} ${p.y})`}>
                {s.stars ? (
                  Array.from({ length: s.stars }, (_, k) => <Polygon key={k} points={starPoints(p.x - 20 - k * 46, p.y, 19)} fill={fg} opacity={dim ? 0.4 : 0.95} />)
                ) : s.flag ? (
                  <G>
                    <G transform={`translate(${p.x - 64} ${p.y - 22}) scale(1.1) rotate(90 30 20)`}>
                      <FlagShape id={s.flag} />
                    </G>
                    <SvgText
                      x={p.x - 110}
                      y={p.y + labelFont * 0.35}
                      fontSize={labelFont}
                      fontFamily={F.heading}
                      fontWeight="700"
                      fill={fg}
                      opacity={dim ? 0.4 : 1}
                      textAnchor="end"
                    >
                      {text}
                    </SvgText>
                  </G>
                ) : (
                  <SvgText
                    x={p.x}
                    y={p.y + labelFont * 0.35}
                    fontSize={span < 22 ? labelFont * 0.85 : labelFont}
                    fontFamily={F.heading}
                    fontWeight="700"
                    fill={fg}
                    opacity={dim ? 0.4 : 1}
                    textAnchor="end"
                  >
                    {text.length > 18 ? text.slice(0, 17) + '…' : text}
                  </SvgText>
                )}
              </G>
            ) : null}
          </G>
        );
      })}
      {slices.map((_, i) => {
        const p = polar(cx, cy, radius, angles[i]);
        return <Path key={`d${i}`} d={`M${cx} ${cy} L${p.x} ${p.y}`} stroke="#000000" strokeOpacity={0.28} strokeWidth={3} />;
      })}
      <Circle cx={cx} cy={cy} r={radius} fill="url(#wsheen)" />
    </Svg>
  );

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Rim */}
      <Svg width={size} height={size} viewBox={`0 0 ${R * 2} ${R * 2}`} style={{ position: 'absolute' }}>
        <Defs>
          <LinearGradient id="rim" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#4A5572" />
            <Stop offset="0.5" stopColor="#1A2133" />
            <Stop offset="1" stopColor="#39435E" />
          </LinearGradient>
        </Defs>
        <Circle cx={cx} cy={cy} r={rimOuter} fill="url(#rim)" />
        <Circle cx={cx} cy={cy} r={rimOuter - 4} fill="none" stroke="#FFFFFF" strokeOpacity={0.15} strokeWidth={3} />
        <Circle cx={cx} cy={cy} r={rimInner} fill="#0A0D16" />
      </Svg>
      {/* Bulbs */}
      {[bulbsA, bulbsB].map((st, k) => (
        <Animated.View key={k} style={[{ position: 'absolute', width: size, height: size }, st]} pointerEvents="none">
          <Svg width={size} height={size} viewBox={`0 0 ${R * 2} ${R * 2}`}>
            {Array.from({ length: bulbCount / 2 }, (_, j) => {
              const i = j * 2 + k;
              const p = polar(cx, cy, (rimOuter + rimInner) / 2, (i * 360) / bulbCount);
              return (
                <G key={i}>
                  <Circle cx={p.x} cy={p.y} r={17} fill="#FFE9A8" opacity={0.25} />
                  <Circle cx={p.x} cy={p.y} r={9} fill="#FFF6D6" />
                </G>
              );
            })}
          </Svg>
        </Animated.View>
      ))}
      {/* Wheel face */}
      <Animated.View style={[{ position: 'absolute', width: size, height: size }, wheelStyle]}>{wheel}</Animated.View>
      {/* Hub */}
      <Press onPress={disabled ? undefined : onPressHub} scale={disabled ? 1 : 0.9} feedback="none" style={{ position: 'absolute' }}>
        <View
          style={{
            width: size * 0.25,
            height: size * 0.25,
            borderRadius: size,
            backgroundColor: '#0B0F19',
            borderWidth: 4,
            borderColor: '#FFFFFF',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOpacity: 0.5,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            elevation: 8,
          }}
        >
          <Txt v="h2" style={{ fontFamily: F.display, fontSize: size * 0.065, lineHeight: size * 0.072 }}>
            {hubLabel}
          </Txt>
        </View>
      </Press>
      {/* Pointer */}
      <Animated.View style={[{ position: 'absolute', top: 0, alignItems: 'center' }, pointerStyle]} pointerEvents="none">
        <Svg width={size * 0.13} height={size * 0.16} viewBox="0 0 60 74">
          <Path d="M30 72 L6 26 A26 26 0 1 1 54 26Z" fill={shade(C.red, -0.35)} transform="translate(0 2)" />
          <Path d="M30 70 L6 24 A26 26 0 1 1 54 24Z" fill={C.red} stroke="#FFFFFF" strokeWidth={4} />
          <Circle cx={30} cy={24} r={9} fill="#FFFFFF" />
        </Svg>
      </Animated.View>
    </View>
  );
}

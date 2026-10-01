/**
 * The Wheel of Fate, machined rather than carnival: a steel bezel with a tick
 * ring, recessed dark sections that each carry one semantic colour band (team
 * colours, star tiers, flags), a blade pointer that flicks on every divider,
 * and a short clunk into place when it lands.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { Easing, cancelAnimation, runOnJS, useAnimatedReaction, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Polygon, RadialGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { FlagShape } from '../art/Flag';
import type { WheelSlice } from '../sim/creation';
import { haptic } from './haptics';
import { Press } from './kit';
import { C, F, withAlpha } from './theme';

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
  /** Small label on the hub ("SPIN", "FATE"). */
  hubLabel?: string;
  /** Big figure on the hub above the label, e.g. the step number. */
  hubTop?: string;
  winner?: number | null;
  /** Colour band per slice; falls back to the slice's own colour, then neutral steel. */
  accents?: (string | undefined)[];
  /** Small radial caption for star slices (e.g. the rating range). */
  captions?: (string | undefined)[];
}

// Geometry in a 1000×1000 viewBox.
const VB = 1000;
const CX = 500;
const CY = 500;
const BEZEL_OUT = 498;
const BEZEL_IN = 468;
const TICK_IN = 436;
const FACE = 432;
const BAND_OUT = 424;
const BAND_IN = 394;
const HUB = 116;

const FACE_A = '#121722';
const FACE_B = '#181E2A';
const FACE_WIN = '#242C3B';
const GAP = '#07090E';
const NEUTRAL_A = '#2A3140';
const NEUTRAL_B = '#343C4D';

function polar(r: number, deg: number) {
  const a = (deg * Math.PI) / 180;
  return { x: CX + r * Math.sin(a), y: CY - r * Math.cos(a) };
}

const f = (n: number) => n.toFixed(2);

/** Annular sector between radii r0..r1 and angles a0..a1 (degrees, clockwise from 12 o'clock). */
function sector(r0: number, r1: number, a0: number, a1: number): string {
  if (a1 - a0 >= 359.9) {
    // A single full slice: two half rings, since an arc can't start and end on the same point.
    return sector(r0, r1, a0, a0 + 180) + sector(r0, r1, a0 + 180, a0 + 360);
  }
  const large = a1 - a0 > 180 ? 1 : 0;
  const p0 = polar(r1, a0);
  const p1 = polar(r1, a1);
  if (r0 <= 0) return `M${CX} ${CY} L${f(p0.x)} ${f(p0.y)} A${r1} ${r1} 0 ${large} 1 ${f(p1.x)} ${f(p1.y)}Z`;
  const p2 = polar(r0, a1);
  const p3 = polar(r0, a0);
  return `M${f(p0.x)} ${f(p0.y)} A${r1} ${r1} 0 ${large} 1 ${f(p1.x)} ${f(p1.y)} L${f(p2.x)} ${f(p2.y)} A${r0} ${r0} 0 ${large} 0 ${f(p3.x)} ${f(p3.y)}Z`;
}

function starPoints(cx: number, cy: number, r: number, turn = 0) {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 === 0 ? r : r * 0.45;
    const a = -Math.PI / 2 + (i * Math.PI) / 5 + (turn * Math.PI) / 180;
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

const GLYPH = 0.5; // average advance of an uppercase Barlow Condensed Bold glyph, in em

/** Fit a label along the radius between `inner` and `outer`, on one or two lines. */
function fitLabel(text: string, span: number, outer: number, inner: number, base: number): { lines: string[]; size: number } {
  const avail = outer - inner;
  const widthAt = (r: number) => 2 * r * Math.sin((Math.min(span, 170) * Math.PI) / 360);
  const one = (() => {
    let size = Math.min(base, avail / (text.length * GLYPH));
    // The slice narrows towards the centre: the text's inner end must still fit.
    size = Math.min(size, widthAt(outer - text.length * GLYPH * size) * 0.78);
    return size;
  })();
  if (one >= base * 0.8 || !text.includes(' ')) return { lines: [text], size: one };
  const words = text.split(' ');
  let best: string[] = [text];
  let bestLen = Infinity;
  for (let i = 1; i < words.length; i++) {
    const l = [words.slice(0, i).join(' '), words.slice(i).join(' ')];
    const m = Math.max(l[0].length, l[1].length);
    if (m < bestLen) {
      bestLen = m;
      best = l;
    }
  }
  let size2 = Math.min(base, avail / (bestLen * GLYPH));
  size2 = Math.min(size2, (widthAt(outer - bestLen * GLYPH * size2) * 0.8) / 2.1);
  return size2 > one * 1.08 ? { lines: best, size: size2 } : { lines: [text], size: one };
}

export function SpinWheel({ slices, size = 320, request, onDone, onPressHub, fast, disabled, hubLabel = 'SPIN', hubTop, winner, accents, captions }: Props) {
  const rot = useSharedValue(0);
  const pointer = useSharedValue(0);
  const spinning = useSharedValue(0);
  const flash = useSharedValue(0);
  // A request that already existed when this wheel mounted belongs to a previous wheel: never replay it.
  const lastReq = useRef<number | null>(request?.id ?? null);
  const angles = useMemo(() => sliceAngles(slices), [slices]);

  // A new wheel starts at an angle derived from its slices (varied, but pure).
  const initial = useMemo(() => {
    let h = 7;
    for (const sl of slices) for (let i = 0; i < sl.id.length; i++) h = (h * 31 + sl.id.charCodeAt(i)) >>> 0;
    return h % 360;
  }, [slices]);
  // Where the face rests on screen, so text and flags can be drawn upright for it.
  const [landedAt, setLandedAt] = useState<{ slices: WheelSlice[]; angle: number } | null>(null);
  const rest = landedAt && landedAt.slices === slices ? landedAt.angle : initial;

  // Reset rotation when a new wheel is shown.
  useEffect(() => {
    cancelAnimation(rot);
    rot.set(initial);
  }, [slices, initial, rot]);

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
        pointer.set(withSequence(withTiming(-18, { duration: 30 }), withTiming(0, { duration: 170, easing: Easing.out(Easing.back(3)) })));
        runOnJS(tick)();
      }
    },
    [angles],
  );

  useEffect(() => {
    if (!request || request.id === lastReq.current || !(request.target >= 0 && request.target < slices.length)) return;
    lastReq.current = request.id;
    const a0 = angles[request.target];
    const a1 = angles[request.target + 1];
    const theta = a0 + (a1 - a0) * (0.2 + Math.random() * 0.6);
    const now = rot.get();
    const turns = fast ? 2 : 3 + Math.floor(Math.random() * 2);
    const delta = ((((-theta - now) % 360) + 360) % 360) + 360 * turns;
    const duration = fast ? 1150 : 2700 + Math.random() * 500;
    // Run a hair past the target and settle back, never far enough to cross a divider.
    const over = Math.min(2.2, (theta - a0) * 0.45);
    spinning.set(1);
    flash.set(0);
    haptic.medium();
    const finish = () => {
      haptic.thud();
      onDone?.(request.target);
    };
    const settle = () => setLandedAt({ slices, angle: (((now + delta) % 360) + 360) % 360 });
    // Two chained timings rather than a sequence/spring: deterministic, and the
    // completion callback fires on every platform.
    rot.set(
      withTiming(now + delta + over, { duration, easing: Easing.bezier(0.12, 0.7, 0.16, 1) }, (ok) => {
        if (!ok) {
          spinning.set(0);
          return;
        }
        rot.set(
          withTiming(now + delta, { duration: 260, easing: Easing.out(Easing.back(2.2)) }, (ok2) => {
            spinning.set(0);
            if (!ok2) return;
            flash.set(withSequence(withTiming(1, { duration: 90 }), withTiming(0, { duration: 520 })));
            runOnJS(settle)();
            runOnJS(finish)();
          }),
        );
      }),
    );
  }, [request, angles, fast, rot, spinning, flash, onDone, slices]);

  const wheelStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot.value}deg` }] }));
  const pw = size * 0.13;
  const ph = pw * 1.25;
  const pointerStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${pointer.value}deg` }] }));
  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value }));

  const n = slices.length;
  const base = n > 10 ? 36 : n > 7 ? 40 : 46;
  const landed = winner !== null && winner !== undefined;

  const face = useMemo(
    () => (
      <Svg width={size} height={size} viewBox={`0 0 ${VB} ${VB}`}>
        <Circle cx={CX} cy={CY} r={FACE} fill={GAP} />
        {slices.map((s, i) => {
          const a0 = angles[i];
          const a1 = angles[i + 1];
          const span = a1 - a0;
          const mid = (a0 + a1) / 2;
          const isWin = landed && winner === i;
          const dim = landed && !isWin;
          const accent = accents?.[i] ?? s.color ?? (i % 2 ? NEUTRAL_B : NEUTRAL_A);
          // Angular inset that leaves a constant-width gap between sections.
          const inset = (r: number) => Math.min(span * 0.2, ((3.2 / r) * 180) / Math.PI);
          const caption = s.stars ? captions?.[i] : undefined;
          const textOuter = s.flag ? 302 : s.stars ? 318 : 372;
          const label = s.stars ? (caption ? fitLabel(caption, span, textOuter, 170, base * 0.9) : null) : fitLabel(s.label.toUpperCase(), span, textOuter, 150, base);
          const lp = polar(textOuter, mid);
          const fg = dim ? withAlpha('#F2EEE6', 0.32) : '#F2EEE6';
          // Radial text reads outwards on the right half of the resting wheel and inwards on the left, so it is never upside down.
          const screen = (((mid + rest) % 360) + 360) % 360;
          const flip = screen > 180;
          const fp = polar(350, mid);
          return (
            <G key={s.id + i}>
              <Path d={sector(0, FACE - 2, a0 + inset(FACE), a1 - inset(FACE))} fill={isWin ? FACE_WIN : i % 2 ? FACE_B : FACE_A} />
              <Path d={sector(BAND_IN, BAND_OUT, a0 + inset(BAND_IN), a1 - inset(BAND_IN))} fill={accent} opacity={dim ? 0.3 : 1} />
              {isWin ? <Path d={sector(BAND_IN - 10, BAND_IN - 4, a0 + inset(BAND_IN), a1 - inset(BAND_IN))} fill={C.red} /> : null}
              {span > 5 && s.flag ? (
                // Flags stay upright on screen while the wheel rests.
                <G transform={`rotate(${f(-rest)} ${f(fp.x)} ${f(fp.y)})`} opacity={dim ? 0.35 : 1}>
                  <G transform={`translate(${f(fp.x - 33)} ${f(fp.y - 22)}) scale(1.1)`}>
                    <FlagShape id={s.flag} />
                  </G>
                </G>
              ) : null}
              {span > 5 && s.stars
                ? Array.from({ length: s.stars }, (_, k) => {
                    // A row across the section, just inside the band.
                    const step = Math.min(7.4, (span * 0.82) / s.stars!);
                    const p = polar(362, mid + (k - (s.stars! - 1) / 2) * step);
                    return <Polygon key={k} points={starPoints(p.x, p.y, 20, -rest)} fill={dim ? withAlpha(C.gold, 0.3) : C.gold} />;
                  })
                : null}
              {span > 5 && label ? (
                <G transform={`rotate(${f(flip ? mid + 90 : mid - 90)} ${f(lp.x)} ${f(lp.y)})`}>
                  {label.lines.map((line, k) => (
                    <SvgText
                      key={k}
                      x={lp.x}
                      y={lp.y + (label.lines.length === 1 ? label.size * 0.35 : k === 0 ? -label.size * 0.14 : label.size * 0.86)}
                      fontSize={label.size}
                      fontFamily={F.heading}
                      fontWeight="700"
                      letterSpacing={0.5}
                      fill={fg}
                      textAnchor={flip ? 'start' : 'end'}
                    >
                      {line}
                    </SvgText>
                  ))}
                </G>
              ) : null}
            </G>
          );
        })}
      </Svg>
    ),
    [slices, angles, size, landed, winner, accents, captions, base, rest],
  );

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Bezel, tick ring and floor shadow (static) */}
      <Svg width={size} height={size} viewBox={`0 0 ${VB} ${VB}`} style={{ position: 'absolute' }}>
        <Defs>
          <LinearGradient id="bezel" x1="0.15" y1="0" x2="0.85" y2="1">
            <Stop offset="0" stopColor="#E3E7EE" />
            <Stop offset="0.2" stopColor="#8A92A2" />
            <Stop offset="0.48" stopColor="#2A303C" />
            <Stop offset="0.72" stopColor="#7D8597" />
            <Stop offset="1" stopColor="#C9CFD9" />
          </LinearGradient>
          <LinearGradient id="bezelLip" x1="0" y1="1" x2="1" y2="0">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.5" />
            <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0" />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0.35" />
          </LinearGradient>
        </Defs>
        <Circle cx={CX} cy={CY} r={BEZEL_OUT} fill="url(#bezel)" />
        <Circle cx={CX} cy={CY} r={BEZEL_OUT - 3} fill="none" stroke="url(#bezelLip)" strokeWidth={3} />
        <Circle cx={CX} cy={CY} r={BEZEL_IN} fill="#0A0D13" />
        {Array.from({ length: 72 }, (_, i) => {
          const major = i % 6 === 0;
          const top = i === 0;
          const p0 = polar(BEZEL_IN - 4, i * 5);
          const p1 = polar(major ? TICK_IN + 4 : TICK_IN + 16, i * 5);
          return <Line key={i} x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} stroke={top ? C.red : '#F2EEE6'} strokeOpacity={top ? 1 : major ? 0.5 : 0.2} strokeWidth={major ? 5 : 3} />;
        })}
      </Svg>

      {/* Face */}
      <Animated.View style={[{ position: 'absolute', width: size, height: size }, wheelStyle]}>{face}</Animated.View>

      {/* Inset shading over the face: darker at the rim, a soft highlight from the top left */}
      <Svg width={size} height={size} viewBox={`0 0 ${VB} ${VB}`} style={{ position: 'absolute', pointerEvents: 'none' }}>
        <Defs>
          <RadialGradient id="inset" cx="0.5" cy="0.5" r="0.5">
            <Stop offset="0.78" stopColor="#000000" stopOpacity="0" />
            <Stop offset="0.93" stopColor="#000000" stopOpacity="0.28" />
            <Stop offset="1" stopColor="#000000" stopOpacity="0.6" />
          </RadialGradient>
          <LinearGradient id="sheen" x1="0" y1="0" x2="0.7" y2="0.9">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.09" />
            <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Circle cx={CX} cy={CY} r={FACE} fill="url(#inset)" />
        <Circle cx={CX} cy={CY} r={FACE} fill="url(#sheen)" />
      </Svg>

      {/* Landing flash */}
      <Animated.View
        style={[
          { position: 'absolute', width: size * (FACE / 500), height: size * (FACE / 500), borderRadius: size, borderWidth: size * 0.012, borderColor: withAlpha(C.red, 0.9), pointerEvents: 'none' },
          flashStyle,
        ]}
      />

      {/* Hub */}
      <Press onPress={disabled ? undefined : onPressHub} scale={disabled ? 1 : 0.92} feedback="none" style={{ position: 'absolute' }} label={hubLabel}>
        <View style={{ width: size * (HUB / 500), height: size * (HUB / 500), alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={size * (HUB / 500)} height={size * (HUB / 500)} viewBox="0 0 240 240" style={{ position: 'absolute' }}>
            <Defs>
              <LinearGradient id="hubRing" x1="0.2" y1="0" x2="0.8" y2="1">
                <Stop offset="0" stopColor="#D8DDE5" />
                <Stop offset="0.5" stopColor="#3A414F" />
                <Stop offset="1" stopColor="#AEB6C3" />
              </LinearGradient>
              <RadialGradient id="hubFace" cx="0.5" cy="0.35" r="0.65">
                <Stop offset="0" stopColor="#202634" />
                <Stop offset="1" stopColor="#0B0E14" />
              </RadialGradient>
            </Defs>
            <Circle cx={120} cy={120} r={118} fill="url(#hubRing)" />
            <Circle cx={120} cy={120} r={104} fill="url(#hubFace)" />
            <Rect x={84} y={196} width={72} height={8} rx={2} fill={disabled ? '#3A414F' : C.red} />
          </Svg>
          {hubTop ? (
            <>
              <HubText text={hubTop} size={size * 0.085} color="#F2EEE6" />
              <HubText text={hubLabel} size={size * 0.03} color={disabled ? C.textMute : C.textDim} spacing={1.5} />
            </>
          ) : (
            <HubText text={hubLabel} size={size * 0.06} color="#F2EEE6" />
          )}
        </View>
      </Press>

      {/* Blade pointer, pivoting from its mount on the bezel */}
      <Animated.View style={[{ position: 'absolute', top: -size * 0.03, width: pw, height: ph, transformOrigin: [pw / 2, ph * 0.16, 0], pointerEvents: 'none' }, pointerStyle]}>
        <Svg width={pw} height={ph} viewBox="0 0 80 100">
          <Defs>
            <LinearGradient id="mount" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#E3E7EE" />
              <Stop offset="0.55" stopColor="#5D6575" />
              <Stop offset="1" stopColor="#A9B1BE" />
            </LinearGradient>
          </Defs>
          <Path d="M20 24 L60 24 L42 92 L38 92Z" fill="#000000" opacity={0.45} transform="translate(3 4)" />
          <Path d="M16 22 L40 22 L40 90Z" fill="#FF4D6D" />
          <Path d="M40 22 L64 22 L40 90Z" fill="#C8102E" />
          <Path d="M16 22 L64 22 L40 90Z" fill="none" stroke="#FFFFFF" strokeOpacity={0.85} strokeWidth={2.5} strokeLinejoin="round" />
          <Rect x={10} y={2} width={60} height={28} rx={6} fill="url(#mount)" />
          <Rect x={10.5} y={2.5} width={59} height={27} rx={5.5} fill="none" stroke="#FFFFFF" strokeOpacity={0.5} strokeWidth={1} />
          <Circle cx={40} cy={16} r={6.5} fill="#0B0E14" />
          <Circle cx={40} cy={16} r={3} fill="#C6CDD8" />
        </Svg>
      </Animated.View>
    </View>
  );
}

function HubText({ text, size, color, spacing = 0 }: { text: string; size: number; color: string; spacing?: number }) {
  return (
    <Text
      style={{
        fontFamily: F.display,
        fontSize: size,
        lineHeight: size * 1.05,
        color,
        letterSpacing: spacing,
        textAlign: 'center',
        includeFontPadding: false,
      }}
    >
      {text}
    </Text>
  );
}

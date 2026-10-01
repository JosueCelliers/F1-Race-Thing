/**
 * Chequered Lives UI kit: the "Midnight Motorsport" component family.
 *
 * Shapes are technical rather than soft: flat carbon panels with hairline
 * borders, angled plates for actions and positions, segmented telemetry
 * meters, and condensed racing numerals as the main graphic element.
 */
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, type LayoutChangeEvent, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import Animated, { Easing, FadeIn, runOnJS, SlideInDown, useAnimatedReaction, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, Path, Pattern, Rect } from 'react-native-svg';
import { TrackMap } from '../art/TrackMap';
import { haptic } from './haptics';
import { Icon, type IconName } from './Icon';
import { appMaxWidth } from './screen';
import { C, F, R, ratingColor, readableOn, S, withAlpha } from './theme';

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------

type Variant = 'hero' | 'display' | 'title' | 'h1' | 'h2' | 'h3' | 'body' | 'bodyStrong' | 'small' | 'label' | 'micro' | 'num' | 'numBig';

const VARIANTS: Record<Variant, TextStyle> = {
  hero: { fontFamily: F.display, fontSize: 72, lineHeight: 70, fontVariant: ['tabular-nums'] },
  display: { fontFamily: F.display, fontSize: 44, lineHeight: 44, letterSpacing: 0.3, textTransform: 'uppercase' },
  title: { fontFamily: F.title, fontSize: 30, lineHeight: 32, textTransform: 'uppercase' },
  h1: { fontFamily: F.title, fontSize: 24, lineHeight: 27, textTransform: 'uppercase' },
  h2: { fontFamily: F.heading, fontSize: 19, lineHeight: 22, textTransform: 'uppercase', letterSpacing: 0.4 },
  h3: { fontFamily: F.heading, fontSize: 16, lineHeight: 19, textTransform: 'uppercase', letterSpacing: 0.5 },
  body: { fontFamily: F.body, fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: F.bodySemi, fontSize: 15, lineHeight: 22 },
  small: { fontFamily: F.bodyMedium, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: F.bodyBold, fontSize: 11, lineHeight: 14, letterSpacing: 1.6, textTransform: 'uppercase' },
  micro: { fontFamily: F.bodyBold, fontSize: 9.5, lineHeight: 12, letterSpacing: 1.3, textTransform: 'uppercase' },
  num: { fontFamily: F.heading, fontSize: 17, lineHeight: 20, fontVariant: ['tabular-nums'] },
  numBig: { fontFamily: F.display, fontSize: 34, lineHeight: 36, fontVariant: ['tabular-nums'] },
};

export function Txt({
  v = 'body',
  color = C.text,
  style,
  children,
  numberOfLines,
  center,
}: {
  v?: Variant;
  color?: string;
  style?: StyleProp<TextStyle>;
  children: React.ReactNode;
  numberOfLines?: number;
  center?: boolean;
}) {
  return (
    <Text numberOfLines={numberOfLines} style={[VARIANTS[v], { color }, center && { textAlign: 'center' }, style]}>
      {children}
    </Text>
  );
}

/** A number that ticks up to its value when it first appears. */
export function CountUp({
  value,
  duration = 650,
  delay = 0,
  style,
  color = C.text,
  v = 'numBig',
}: {
  value: number;
  duration?: number;
  delay?: number;
  style?: StyleProp<TextStyle>;
  color?: string;
  v?: Variant;
}) {
  const t = useSharedValue(0);
  const [shown, setShown] = useState(0);
  useEffect(() => {
    t.value = 0;
    t.value = withDelay(delay, withTiming(1, { duration, easing: Easing.out(Easing.cubic) }));
  }, [value, delay, duration, t]);
  useAnimatedReaction(
    () => Math.round(t.value * value),
    (cur, prev) => {
      if (cur !== prev) runOnJS(setShown)(cur);
    },
    [value],
  );
  return (
    <Txt v={v} color={color} style={style}>
      {shown}
    </Txt>
  );
}

// ---------------------------------------------------------------------------
// Press feedback
// ---------------------------------------------------------------------------

export function Press({
  onPress,
  children,
  style,
  disabled,
  scale = 0.97,
  feedback = 'tap',
  label,
  testID,
}: {
  onPress?: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  scale?: number;
  feedback?: 'tap' | 'tick' | 'none';
  /** Accessibility label (screen readers); defaults to the visible text. */
  label?: string;
  testID?: string;
}) {
  const s = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  const { outer, inner } = splitStyle(style);
  return (
    <Pressable
      style={outer}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={disabled ? { disabled: true } : undefined}
      testID={testID}
      onPressIn={() => {
        s.set(withSpring(scale, { damping: 18, stiffness: 420 }));
      }}
      onPressOut={() => {
        s.set(withSpring(1, { damping: 14, stiffness: 300 }));
      }}
      onPress={() => {
        if (feedback === 'tap') haptic.tap();
        else if (feedback === 'tick') haptic.tick();
        onPress?.();
      }}
    >
      <Animated.View style={[anim, inner, disabled && { opacity: 0.4 }]}>{children}</Animated.View>
    </Pressable>
  );
}

const OUTER_KEYS = new Set([
  'flex',
  'flexGrow',
  'flexShrink',
  'flexBasis',
  'alignSelf',
  'width',
  'minWidth',
  'maxWidth',
  'margin',
  'marginTop',
  'marginBottom',
  'marginLeft',
  'marginRight',
  'marginHorizontal',
  'marginVertical',
  'position',
  'left',
  'right',
  'top',
  'bottom',
  'zIndex',
]);

/** Layout props go on the Pressable; visual props on the animated child. */
function splitStyle(style: StyleProp<ViewStyle>): { outer: ViewStyle; inner: ViewStyle } {
  const flat = (StyleSheet.flatten(style) ?? {}) as Record<string, unknown>;
  const outer: Record<string, unknown> = {};
  const inner: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(flat)) {
    if (OUTER_KEYS.has(k)) outer[k] = v;
    else inner[k] = v;
  }
  if (outer.flex !== undefined || outer.width !== undefined || outer.flexGrow !== undefined) inner.flexGrow = 1;
  return { outer: outer as ViewStyle, inner: inner as ViewStyle };
}

// ---------------------------------------------------------------------------
// Buttons: angled plates
// ---------------------------------------------------------------------------

const SKEW = '-11deg';
const UNSKEW = '11deg';

/** Three forward chevrons: the "go" mark on launch plates. */
export function Chevrons({ color = '#FFFFFF', size = 14 }: { color?: string; size?: number }) {
  const w = size * 2;
  return (
    <Svg width={w} height={size} viewBox="0 0 28 14">
      {[0, 1, 2].map((i) => (
        <Path key={i} d={`M${2 + i * 8} 1 L${8 + i * 8} 7 L${2 + i * 8} 13`} stroke={color} strokeOpacity={0.45 + i * 0.27} strokeWidth={2.6} fill="none" strokeLinecap="square" />
      ))}
    </Svg>
  );
}

type BtnKind = 'primary' | 'gold' | 'secondary' | 'ghost' | 'danger' | 'team';

export function Btn({
  label,
  onPress,
  kind = 'primary',
  icon,
  sub,
  disabled,
  style,
  color,
  small,
  testID,
  chevrons,
}: {
  label: string;
  onPress?: () => void;
  kind?: BtnKind;
  icon?: IconName;
  sub?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  color?: string;
  small?: boolean;
  testID?: string;
  /** Show the forward chevrons (defaults on for primary-type plates). */
  chevrons?: boolean;
}) {
  const base = kind === 'primary' ? C.red : kind === 'gold' ? C.gold : kind === 'danger' ? C.redDeep : kind === 'team' ? (color ?? C.red) : kind === 'secondary' ? C.surface2 : 'transparent';
  const filled = kind === 'primary' || kind === 'gold' || kind === 'danger' || kind === 'team';
  const fg = filled ? readableOn(base) : C.text;
  const showChevrons = chevrons ?? (filled && !small);
  const h = small ? 46 : sub ? 62 : 56;
  const p = useSharedValue(0);
  const plate = useAnimatedStyle(() => ({ transform: [{ scale: 1 - p.value * 0.03 }] }));
  const flash = useAnimatedStyle(() => ({ opacity: p.value * 0.14 }));
  const chev = useAnimatedStyle(() => ({ transform: [{ translateX: p.value * 5 }] }));
  const { outer } = splitStyle(style);
  return (
    <Pressable
      style={outer}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={sub ? `${label}. ${sub}` : label}
      accessibilityState={disabled ? { disabled: true } : undefined}
      testID={testID}
      onPressIn={() => p.set(withTiming(1, { duration: 90 }))}
      onPressOut={() => p.set(withTiming(0, { duration: 180 }))}
      onPress={() => {
        haptic.tap();
        onPress?.();
      }}
    >
      <Animated.View style={[{ height: h, marginHorizontal: h * 0.1, opacity: disabled ? 0.4 : 1 }, plate]}>
        <View
          style={{
            flex: 1,
            transform: [{ skewX: SKEW }],
            borderRadius: R.xs,
            overflow: 'hidden',
            backgroundColor: base,
            borderWidth: filled ? 0 : 1,
            borderColor: kind === 'ghost' ? C.lineStrong : C.line,
          }}
        >
          {filled ? <LinearGradient colors={[withAlpha('#FFFFFF', 0.16), withAlpha('#FFFFFF', 0), withAlpha('#000000', 0.2)]} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} /> : null}
          <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 1, backgroundColor: withAlpha('#FFFFFF', filled ? 0.38 : 0.07) }} />
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#FFFFFF' }, flash]} />
          <View
            style={{
              flex: 1,
              transform: [{ skewX: UNSKEW }],
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: showChevrons ? 'space-between' : 'center',
              paddingHorizontal: small ? 16 : 22,
              gap: 10,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 }}>
              {icon ? <Icon name={icon} size={small ? 17 : 20} color={fg} strokeWidth={2.3} /> : null}
              <View style={{ flexShrink: 1, alignItems: showChevrons || icon ? 'flex-start' : 'center' }}>
                <Text style={[styles.btnLabel, small && styles.btnLabelSmall, { color: fg }]} numberOfLines={1}>
                  {label}
                </Text>
                {sub ? (
                  <Text style={[styles.btnSub, { color: withAlpha(fg === '#FFFFFF' ? '#FFFFFF' : '#07090E', 0.78) }]} numberOfLines={1}>
                    {sub}
                  </Text>
                ) : null}
              </View>
            </View>
            {showChevrons ? (
              <Animated.View style={chev}>
                <Chevrons color={fg} size={small ? 11 : 14} />
              </Animated.View>
            ) : null}
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

export function IconBtn({
  icon,
  onPress,
  size = 44,
  color = C.text,
  bg = C.surface2,
  style,
  label,
  testID,
}: {
  icon: IconName;
  onPress?: () => void;
  size?: number;
  color?: string;
  bg?: string;
  style?: StyleProp<ViewStyle>;
  label?: string;
  testID?: string;
}) {
  return (
    <Press
      onPress={onPress}
      label={label ?? icon}
      testID={testID}
      scale={0.92}
      style={[{ width: size, height: size, borderRadius: R.sm, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.line }, style]}
    >
      <Icon name={icon} size={size * 0.46} color={color} strokeWidth={2.2} />
    </Press>
  );
}

// ---------------------------------------------------------------------------
// Surfaces
// ---------------------------------------------------------------------------

/** Viewfinder-style corner brackets: the broadcast "framing" motif. */
export function CornerTicks({ color = C.lineStrong, size = 9, inset = 0 }: { color?: string; size?: number; inset?: number }) {
  const b = 1.5;
  const base: ViewStyle = { position: 'absolute', width: size, height: size, borderColor: color };
  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
      <View style={[base, { left: inset, top: inset, borderLeftWidth: b, borderTopWidth: b }]} />
      <View style={[base, { right: inset, top: inset, borderRightWidth: b, borderTopWidth: b }]} />
      <View style={[base, { left: inset, bottom: inset, borderLeftWidth: b, borderBottomWidth: b }]} />
      <View style={[base, { right: inset, bottom: inset, borderRightWidth: b, borderBottomWidth: b }]} />
    </View>
  );
}

/** Flat carbon panel with a hairline edge. `accent` adds a stripe on the left edge. */
export function Card({
  children,
  style,
  accent,
  padded = true,
  ticks,
  raised,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  accent?: string;
  padded?: boolean;
  ticks?: boolean | string;
  raised?: boolean;
}) {
  return (
    <View style={[styles.card, raised && { backgroundColor: C.surface2 }, padded && { padding: S.lg }, accent ? { paddingLeft: padded ? S.lg + 3 : 3 } : null, style]}>
      {accent ? <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: accent }} /> : null}
      {ticks ? <CornerTicks color={typeof ticks === 'string' ? ticks : C.lineStrong} /> : null}
      {children}
    </View>
  );
}

/** Small angled tag (status, reasons, metadata). */
export function Pill({ label, color = C.surface3, textColor, icon, style }: { label: string; color?: string; textColor?: string; icon?: IconName; style?: StyleProp<ViewStyle> }) {
  const fg = textColor ?? readableOn(color);
  return (
    <View style={[styles.tag, { backgroundColor: color }, style]}>
      <View style={{ transform: [{ skewX: '10deg' }], flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        {icon ? <Icon name={icon} size={11} color={fg} strokeWidth={2.6} /> : null}
        <Txt v="micro" color={fg} style={{ fontSize: 10, letterSpacing: 1.1 }}>
          {label}
        </Txt>
      </View>
    </View>
  );
}

export function Stars({ value, max = 5, size = 14, color = C.gold }: { value: number; max?: number; size?: number; color?: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 1 }}>
      {Array.from({ length: max }, (_, i) => (
        <Icon key={i} name="star" size={size} color={i < Math.round(value) ? color : C.surface3} fill={i < Math.round(value) ? color : C.surface3} strokeWidth={1} />
      ))}
    </View>
  );
}

/** Segmented telemetry meter: the rating bar used everywhere. */
export function Meter({
  value,
  max = 100,
  color,
  segments = 20,
  height = 8,
  delay = 0,
  animate = true,
}: {
  value: number;
  max?: number;
  color?: string;
  segments?: number;
  height?: number;
  delay?: number;
  animate?: boolean;
}) {
  const pct = Math.max(0, Math.min(1, value / max));
  const filled = Math.round(pct * segments);
  const col = color ?? ratingColor(value);
  const [w, setW] = useState(0);
  const reveal = useSharedValue(animate ? 0 : 1);
  useEffect(() => {
    if (!animate) return;
    reveal.value = 0;
    reveal.value = withDelay(delay, withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) }));
  }, [value, delay, animate, reveal]);
  const clip = useAnimatedStyle(() => ({ width: w * reveal.value }));
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);
  const row = (on: boolean) => (
    <View style={{ flexDirection: 'row', gap: 2, height, width: w || undefined }}>
      {Array.from({ length: segments }, (_, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            backgroundColor: on ? (i < filled ? col : 'transparent') : C.surface3,
            opacity: on && i < filled ? 0.5 + (0.5 * (i + 1)) / Math.max(1, filled) : 1,
            transform: [{ skewX: '-18deg' }],
          }}
        />
      ))}
    </View>
  );
  return (
    <View onLayout={onLayout} style={{ height }}>
      {row(false)}
      {w ? <Animated.View style={[{ position: 'absolute', left: 0, top: 0, height, overflow: 'hidden' }, clip]}>{row(true)}</Animated.View> : null}
    </View>
  );
}

/** Label + big number + segmented meter. */
export function StatBar({
  label,
  value,
  max = 100,
  color,
  delta,
  delay = 0,
  compact,
}: {
  label: string;
  value: number;
  max?: number;
  color?: string;
  delta?: number;
  delay?: number;
  compact?: boolean;
}) {
  const col = color ?? ratingColor(value);
  return (
    <View style={{ gap: compact ? 5 : 7 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Txt v="label" color={C.textDim}>
          {label}
        </Txt>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
          {delta ? (
            <Txt v="num" color={delta > 0 ? C.green : C.red} style={{ fontSize: 14 }}>
              {delta > 0 ? `+${delta}` : delta}
            </Txt>
          ) : null}
          <Txt v="numBig" color={col} style={{ fontSize: compact ? 20 : 24, lineHeight: compact ? 21 : 25 }}>
            {Math.round(value)}
          </Txt>
        </View>
      </View>
      <Meter value={value} max={max} color={col} delay={delay} height={compact ? 6 : 8} />
    </View>
  );
}

/** Position plate: P1 gold, P2 silver, P3 bronze; `player` paints it signal red. */
export function PosBadge({ pos, size = 30, dnf, player, prefix }: { pos: number; size?: number; dnf?: boolean; player?: boolean; prefix?: boolean }) {
  const podium = !dnf && pos >= 1 && pos <= 3;
  const bg = dnf ? withAlpha(C.red, 0.18) : pos === 1 ? C.gold : pos === 2 ? C.silver : pos === 3 ? C.bronze : player ? C.red : C.surface3;
  const fg = dnf ? C.red : podium ? '#07090E' : C.text;
  return (
    <View
      style={{
        minWidth: size,
        height: size * 0.8,
        paddingHorizontal: size * 0.14,
        borderRadius: R.xs,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ skewX: SKEW }],
      }}
    >
      <Text style={{ transform: [{ skewX: UNSKEW }], fontFamily: F.display, fontSize: size * 0.5, lineHeight: size * 0.6, color: fg, fontVariant: ['tabular-nums'] }}>
        {dnf ? 'DNF' : `${prefix ? 'P' : ''}${pos}`}
      </Text>
    </View>
  );
}

/** Racing number plate in team colours. */
export function NumberPlate({ number, colors, size = 34 }: { number: number; colors?: { primary: string; secondary: string }; size?: number }) {
  const bg = colors?.primary ?? C.surface3;
  return (
    <View
      style={{
        height: size,
        minWidth: size * 1.25,
        paddingHorizontal: size * 0.2,
        backgroundColor: bg,
        borderRadius: R.xs,
        borderWidth: 2,
        borderColor: colors?.secondary ?? C.lineStrong,
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ skewX: SKEW }],
      }}
    >
      <Text style={{ transform: [{ skewX: UNSKEW }], fontFamily: F.display, fontSize: size * 0.62, lineHeight: size * 0.74, color: readableOn(bg) }}>{number}</Text>
    </View>
  );
}

/** Team stripe: primary over secondary, the team's signature on any row. */
export function TeamStripe({ colors, height = 22, width = 4 }: { colors?: { primary: string; secondary: string }; height?: number; width?: number }) {
  return (
    <View style={{ width, height, transform: [{ skewX: '-14deg' }], overflow: 'hidden', borderRadius: 1 }}>
      <View style={{ flex: 3, backgroundColor: colors?.primary ?? C.steel }} />
      <View style={{ flex: 1, backgroundColor: colors?.secondary ?? C.surface3 }} />
    </View>
  );
}

/** Section header: tick + tracked label + hairline rule. */
export function SectionTitle({ title, right, style }: { title: string; right?: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: S.xl, marginBottom: S.md }, style]}>
      <View style={{ width: 3, height: 13, backgroundColor: C.red, transform: [{ skewX: '-18deg' }] }} />
      <Txt v="label" color={C.text} style={{ fontSize: 12, letterSpacing: 2 }}>
        {title}
      </Txt>
      <View style={{ flex: 1, height: 1, backgroundColor: C.line }} />
      {right}
    </View>
  );
}

/** Small tracked label with an optional colour tick. */
export function Kicker({ children, color = C.textDim, tick, style }: { children: React.ReactNode; color?: string; tick?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 7 }, style]}>
      {tick ? <View style={{ width: 3, height: 11, backgroundColor: tick, transform: [{ skewX: '-18deg' }] }} /> : null}
      <Txt v="label" color={color}>
        {children}
      </Txt>
    </View>
  );
}

/** Label over a big value: the stat cluster atom. */
export function StatCell({
  label,
  value,
  sub,
  color = C.text,
  align = 'left',
  size = 30,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  color?: string;
  align?: 'left' | 'center' | 'right';
  size?: number;
}) {
  return (
    <View style={{ alignItems: align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center', gap: 2 }}>
      <Txt v="micro" color={C.textMute}>
        {label}
      </Txt>
      <Txt v="numBig" color={color} style={{ fontSize: size, lineHeight: size * 1.04 }} numberOfLines={1}>
        {value}
      </Txt>
      {sub ? (
        <Txt v="small" color={C.textDim} numberOfLines={1} style={{ fontSize: 12 }}>
          {sub}
        </Txt>
      ) : null}
    </View>
  );
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[{ height: 1, backgroundColor: C.line }, style]} />;
}

// ---------------------------------------------------------------------------
// Atmosphere: the world behind every screen
// ---------------------------------------------------------------------------

let patternIds = 0;

/**
 * Night-race atmosphere: ink base, a single light source tinted by the
 * screen's accent, a faint telemetry grid, and optional giant numeral and
 * track outline for screens that want more of the world behind them.
 */
export function Backdrop({ tint = C.red, number, track, intensity = 1 }: { tint?: string; number?: number | string; track?: string; intensity?: number }) {
  const id = useMemo(() => `grid${patternIds++}`, []);
  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none', backgroundColor: C.bg }]}>
      <LinearGradient colors={[withAlpha(tint, 0.2 * intensity), withAlpha(tint, 0)]} start={{ x: 1, y: 0 }} end={{ x: 0.2, y: 0.6 }} style={StyleSheet.absoluteFill} />
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <Pattern id={id} width="44" height="44" patternUnits="userSpaceOnUse">
            <Path d="M44 0 L0 0 0 44" stroke="#F2EEE6" strokeOpacity="0.032" strokeWidth="1" fill="none" />
          </Pattern>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
      {track ? (
        <View style={{ position: 'absolute', right: -60, top: 40, opacity: 0.09 }}>
          <TrackMap trackId={track} width={360} height={300} color="#F2EEE6" />
        </View>
      ) : null}
      {number !== undefined ? (
        <Text style={{ position: 'absolute', right: -14, top: 70, fontFamily: F.display, fontSize: 300, lineHeight: 300, color: withAlpha('#F2EEE6', 0.035) }}>{number}</Text>
      ) : null}
      <LinearGradient colors={[withAlpha('#000000', 0), withAlpha('#000000', 0.5)]} start={{ x: 0, y: 0.55 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen scaffolding
// ---------------------------------------------------------------------------

export function Header({ title, sub, onBack, right, back = true, kicker }: { title: string; sub?: string; onBack?: () => void; right?: React.ReactNode; back?: boolean; kicker?: string }) {
  return (
    <View style={styles.header}>
      {back ? <IconBtn icon="back" label="Back" onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))} /> : null}
      <View style={{ flex: 1 }}>
        {kicker ? (
          <Txt v="micro" color={C.red} numberOfLines={1}>
            {kicker}
          </Txt>
        ) : null}
        <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit>
          {title}
        </Text>
        {sub ? (
          <Txt v="small" color={C.textDim} numberOfLines={1} style={{ fontSize: 12.5 }}>
            {sub}
          </Txt>
        ) : null}
      </View>
      {right ?? null}
    </View>
  );
}

export function Screen({
  children,
  scroll = true,
  tint,
  header,
  footer,
  contentStyle,
  padded = true,
  backdrop,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  tint?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  padded?: boolean;
  /** Extra atmosphere: a giant numeral and/or a faint track outline. */
  backdrop?: { number?: number | string; track?: string; intensity?: number };
}) {
  const insets = useSafeAreaInsets();
  const inner = <View style={[padded && { paddingHorizontal: S.lg }, { paddingBottom: footer ? S.lg : insets.bottom + S.xl }, contentStyle]}>{children}</View>;
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Backdrop tint={tint} {...backdrop} />
      <View style={{ paddingTop: insets.top }}>{header}</View>
      {scroll ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
          {inner}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>{inner}</View>
      )}
      {footer ? (
        <View style={{ paddingHorizontal: S.lg, paddingTop: S.sm, paddingBottom: insets.bottom + S.md, backgroundColor: C.bg }}>
          <LinearGradient colors={[withAlpha(C.bg, 0), C.bg]} style={{ position: 'absolute', left: 0, right: 0, top: -26, height: 26, pointerEvents: 'none' }} />
          {footer}
        </View>
      ) : null}
    </View>
  );
}

/** Dimmed full-screen backdrop for centred dialogs; keeps content phone-width on the web. */
export function ModalScrim({ children, bg = 'rgba(3,4,8,0.86)', center = false }: { children: React.ReactNode; bg?: string; center?: boolean }) {
  return (
    <View style={{ flex: 1, backgroundColor: bg, justifyContent: 'center', padding: S.lg }}>
      <View style={{ width: '100%', maxWidth: appMaxWidth, alignSelf: 'center', alignItems: center ? 'center' : undefined }}>{children}</View>
    </View>
  );
}

/**
 * Bottom sheet in a modal: content arrives from the bottom edge where the
 * thumb is. `accent` colours the top edge.
 */
export function SheetModal({
  visible = true,
  onClose,
  children,
  accent = C.red,
  dismissable = true,
}: {
  visible?: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  accent?: string;
  dismissable?: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => (dismissable ? onClose?.() : undefined)}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Animated.View entering={FadeIn.duration(160)} style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(3,4,8,0.72)' }]}>
          {dismissable ? <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Close" /> : null}
        </Animated.View>
        <Animated.View entering={SlideInDown.duration(260).easing(Easing.out(Easing.cubic))} style={{ width: '100%', maxWidth: appMaxWidth, alignSelf: 'center' }}>
          <SheetBody accent={accent} bottom={insets.bottom}>
            {children}
          </SheetBody>
        </Animated.View>
      </View>
    </Modal>
  );
}

/** The sheet's surface (also used by in-screen sheets such as race decisions). */
export function SheetBody({ children, accent = C.red, bottom = 0 }: { children: React.ReactNode; accent?: string; bottom?: number }) {
  return (
    <View
      style={{
        backgroundColor: C.surface,
        borderTopLeftRadius: R.xl,
        borderTopRightRadius: R.xl,
        paddingHorizontal: S.lg,
        paddingTop: 10,
        paddingBottom: bottom + S.lg,
        borderTopWidth: 1,
        borderColor: C.lineStrong,
        overflow: 'hidden',
      }}
    >
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 2, backgroundColor: accent }} />
      <View style={{ alignSelf: 'center', width: 38, height: 4, borderRadius: 2, backgroundColor: C.surface3, marginBottom: 12 }} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  btnLabel: {
    fontFamily: F.title,
    fontSize: 20,
    lineHeight: 23,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  btnLabelSmall: {
    fontFamily: F.heading,
    fontSize: 15,
    lineHeight: 18,
    letterSpacing: 0.8,
  },
  btnSub: {
    fontFamily: F.bodySemi,
    fontSize: 12,
    lineHeight: 15,
  },
  card: {
    backgroundColor: C.surface,
    borderRadius: R.sm,
    borderWidth: 1,
    borderColor: C.line,
    overflow: 'hidden',
  },
  tag: {
    alignSelf: 'flex-start',
    transform: [{ skewX: '-10deg' }],
    borderRadius: R.xs,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    paddingHorizontal: S.lg,
    paddingTop: S.sm,
    paddingBottom: S.md,
  },
  headerTitle: {
    fontFamily: F.display,
    fontSize: 28,
    lineHeight: 31,
    color: C.text,
    textTransform: 'uppercase',
  },
});

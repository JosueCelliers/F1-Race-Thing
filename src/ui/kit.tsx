import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, Line, Pattern, Rect } from 'react-native-svg';
import { haptic } from './haptics';
import { Icon, type IconName } from './Icon';
import { C, F, R, readableOn, S, shade, withAlpha } from './theme';

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------

type Variant = 'display' | 'title' | 'h1' | 'h2' | 'h3' | 'body' | 'bodyStrong' | 'small' | 'label' | 'num' | 'numBig';

const VARIANTS: Record<Variant, TextStyle> = {
  display: { fontFamily: F.display, fontSize: 44, lineHeight: 44, letterSpacing: 0.5, textTransform: 'uppercase' },
  title: { fontFamily: F.title, fontSize: 30, lineHeight: 32, textTransform: 'uppercase' },
  h1: { fontFamily: F.title, fontSize: 24, lineHeight: 27, textTransform: 'uppercase' },
  h2: { fontFamily: F.heading, fontSize: 19, lineHeight: 22, textTransform: 'uppercase', letterSpacing: 0.3 },
  h3: { fontFamily: F.heading, fontSize: 16, lineHeight: 19, textTransform: 'uppercase', letterSpacing: 0.4 },
  body: { fontFamily: F.body, fontSize: 15, lineHeight: 21 },
  bodyStrong: { fontFamily: F.bodySemi, fontSize: 15, lineHeight: 21 },
  small: { fontFamily: F.bodyMedium, fontSize: 12.5, lineHeight: 17 },
  label: { fontFamily: F.bodyBold, fontSize: 11, lineHeight: 14, letterSpacing: 1.2, textTransform: 'uppercase' },
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

// ---------------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------------

export function Press({
  onPress,
  children,
  style,
  disabled,
  scale = 0.96,
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
        s.set(withSpring(scale, { damping: 18, stiffness: 400 }));
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
      <Animated.View style={[anim, inner, disabled && { opacity: 0.45 }]}>{children}</Animated.View>
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
}) {
  const base = kind === 'primary' ? C.red : kind === 'gold' ? C.gold : kind === 'danger' ? '#8B1E2B' : kind === 'team' ? (color ?? C.red) : C.surface3;
  const fg = kind === 'ghost' ? C.text : readableOn(base);
  const gradient: [string, string] = kind === 'ghost' ? ['transparent', 'transparent'] : [shade(base, 0.12), shade(base, -0.18)];
  return (
    <Press onPress={onPress} disabled={disabled} label={sub ? `${label}. ${sub}` : label} testID={testID} style={[{ borderRadius: R.md, overflow: 'hidden' }, style]}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.btn,
          small && { paddingVertical: 9, minHeight: 40 },
          kind === 'ghost' && { borderWidth: 1, borderColor: C.lineStrong },
          kind === 'secondary' && { borderWidth: 1, borderColor: C.lineStrong },
        ]}
      >
        {icon ? <Icon name={icon} size={small ? 17 : 20} color={fg} /> : null}
        <View style={{ alignItems: icon ? 'flex-start' : 'center', flexShrink: 1 }}>
          <Txt v={small ? 'h3' : 'h2'} color={fg} numberOfLines={1}>
            {label}
          </Txt>
          {sub ? (
            <Txt v="small" color={withAlpha(fg === '#FFFFFF' ? '#FFFFFF' : '#0B0F19', 0.75)} numberOfLines={1}>
              {sub}
            </Txt>
          ) : null}
        </View>
      </LinearGradient>
    </Press>
  );
}

export function IconBtn({
  icon,
  onPress,
  size = 40,
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
      style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.line }, style]}
    >
      <Icon name={icon} size={size * 0.5} color={color} />
    </Press>
  );
}

// ---------------------------------------------------------------------------
// Surfaces
// ---------------------------------------------------------------------------

export function Card({ children, style, accent, padded = true }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; accent?: string; padded?: boolean }) {
  return (
    <View style={[styles.card, padded && { padding: S.lg }, style]}>
      {accent ? <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: accent }} /> : null}
      {children}
    </View>
  );
}

export function Pill({ label, color = C.surface3, textColor, icon, style }: { label: string; color?: string; textColor?: string; icon?: IconName; style?: StyleProp<ViewStyle> }) {
  const fg = textColor ?? readableOn(color);
  return (
    <View style={[styles.pill, { backgroundColor: color }, style]}>
      {icon ? <Icon name={icon} size={12} color={fg} strokeWidth={2.4} /> : null}
      <Txt v="label" color={fg} style={{ fontSize: 10.5, letterSpacing: 0.9 }}>
        {label}
      </Txt>
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

export function StatBar({ label, value, max = 100, color = C.red, delta }: { label: string; value: number; max?: number; color?: string; delta?: number }) {
  const pct = Math.max(0, Math.min(1, value / max));
  return (
    <View style={{ gap: 5 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Txt v="label" color={C.textDim}>
          {label}
        </Txt>
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'baseline' }}>
          {delta ? (
            <Txt v="small" color={delta > 0 ? C.green : C.red}>
              {delta > 0 ? `+${delta}` : delta}
            </Txt>
          ) : null}
          <Txt v="num">{Math.round(value)}</Txt>
        </View>
      </View>
      <View style={{ height: 6, backgroundColor: C.surface3, borderRadius: 3, overflow: 'hidden' }}>
        <LinearGradient colors={[shade(color, -0.2), color]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ width: `${pct * 100}%`, height: '100%', borderRadius: 3 }} />
      </View>
    </View>
  );
}

export function PosBadge({ pos, size = 30, dnf }: { pos: number; size?: number; dnf?: boolean }) {
  const bg = dnf ? '#3A1A22' : pos === 1 ? C.gold : pos === 2 ? C.silver : pos === 3 ? C.bronze : C.surface3;
  const fg = dnf ? C.red : pos <= 3 ? '#0B0F19' : C.text;
  return (
    <View style={{ width: size, height: size * 0.82, borderRadius: 6, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', transform: [{ skewX: '-8deg' }] }}>
      <Txt v="num" color={fg} style={{ fontSize: size * 0.48, lineHeight: size * 0.56 }}>
        {dnf ? 'DNF' : pos}
      </Txt>
    </View>
  );
}

export function SectionTitle({ title, right, style }: { title: string; right?: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: S.xl, marginBottom: S.sm }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ width: 4, height: 16, backgroundColor: C.red, borderRadius: 2, transform: [{ skewX: '-12deg' }] }} />
        <Txt v="h2">{title}</Txt>
      </View>
      {right}
    </View>
  );
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[{ height: 1, backgroundColor: C.line }, style]} />;
}

// ---------------------------------------------------------------------------
// Screen scaffolding
// ---------------------------------------------------------------------------

export function Backdrop({ tint = C.red }: { tint?: string }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={[C.bg2, C.bg, '#04050A']} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={[withAlpha(tint, 0.2), 'transparent']} start={{ x: 1, y: 0 }} end={{ x: 0.2, y: 0.5 }} style={StyleSheet.absoluteFill} />
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <Pattern id="diag" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)">
            <Line x1="0" y1="0" x2="0" y2="14" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.022" />
          </Pattern>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#diag)" />
      </Svg>
    </View>
  );
}

export function Header({ title, sub, onBack, right, back = true }: { title: string; sub?: string; onBack?: () => void; right?: React.ReactNode; back?: boolean }) {
  return (
    <View style={styles.header}>
      {back ? <IconBtn icon="back" onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))} /> : <View style={{ width: 40 }} />}
      <View style={{ flex: 1, alignItems: 'center' }}>
        <Txt v="h1" numberOfLines={1}>
          {title}
        </Txt>
        {sub ? (
          <Txt v="small" color={C.textDim} numberOfLines={1}>
            {sub}
          </Txt>
        ) : null}
      </View>
      {right ?? <View style={{ width: 40 }} />}
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
}: {
  children: React.ReactNode;
  scroll?: boolean;
  tint?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  padded?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const inner = <View style={[padded && { paddingHorizontal: S.lg }, { paddingBottom: footer ? S.lg : insets.bottom + S.xl }, contentStyle]}>{children}</View>;
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Backdrop tint={tint} />
      <View style={{ paddingTop: insets.top }}>{header}</View>
      {scroll ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
          {inner}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>{inner}</View>
      )}
      {footer ? <View style={{ paddingHorizontal: S.lg, paddingTop: S.sm, paddingBottom: insets.bottom + S.md }}>{footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 18,
    minHeight: 54,
    borderRadius: R.md,
  },
  card: {
    backgroundColor: C.surface,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.line,
    overflow: 'hidden',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: R.pill,
    alignSelf: 'flex-start',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    paddingHorizontal: S.lg,
    paddingVertical: S.sm,
  },
});

/**
 * Broadcast furniture around the creation wheel: the 12-cell progress rail,
 * the step lockup ("01 / 12 NATIONALITY"), the result plate that locks in each
 * answer, and the strip of picks building up the driver.
 */
import React, { useEffect, useRef } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming, ZoomIn } from 'react-native-reanimated';
import { Flag } from '../art/Flag';
import { nation } from '../content/nations';
import { series as seriesDef } from '../content/series';
import { family, personality } from '../content/traits';
import { STAR_BANDS, WHEEL_ORDER, type Picks, type WheelDef, type WheelId, type WheelSlice } from '../sim/creation';
import type { World } from '../sim/types';
import { Icon, type IconName } from '../ui/Icon';
import { Txt } from '../ui/kit';
import { C, F, R, withAlpha } from '../ui/theme';

export const WHEEL_ICON: Record<WheelId, IconName> = {
  nation: 'globe',
  family: 'money',
  age: 'calendar',
  pace: 'bolt',
  racecraft: 'swap',
  consistency: 'clock',
  wet: 'rain',
  aggression: 'fire',
  personality: 'user',
  potential: 'chart',
  series: 'trophy',
  team: 'helmet',
};

/** Short names for the picks strip. */
const SHORT: Record<WheelId, string> = {
  nation: 'Nation',
  family: 'Family',
  age: 'Age',
  pace: 'Pace',
  racecraft: 'Craft',
  consistency: 'Cons',
  wet: 'Wet',
  aggression: 'Style',
  personality: 'Rep',
  potential: 'Pot',
  series: 'Series',
  team: 'Team',
};

/** Rating ramp shared by every "how good" wheel: dim steel → off-white → cyan → gold. */
export const TIER_RAMP = ['#4A5262', '#8C94A4', '#E9E4DA', C.cyan, C.gold];

const POTENTIAL_TIER: Record<string, number> = { peaked: 0, limited: 1, solid: 2, star: 3, generational: 4 };
const AGGRESSION_COLOR: Record<string, string> = { calm: C.cyan, calculated: C.blue, balanced: '#C6CDD8', aggressive: C.orange, kamikaze: C.red };
const FAMILY_COLOR: Record<string, string> = { dynasty: C.gold, wealthy: '#E9E4DA', comfortable: '#8C94A4', working: '#5D6575', poor: '#3A414F' };

/** The semantic colour of a pick (tier, temperament, series colour); undefined when it has none. */
export function sliceAccent(id: WheelId, s: WheelSlice): string | undefined {
  switch (id) {
    case 'pace':
    case 'racecraft':
    case 'consistency':
    case 'wet':
      return TIER_RAMP[Number(s.value) - 1];
    case 'potential':
      return TIER_RAMP[POTENTIAL_TIER[s.id] ?? 2];
    case 'aggression':
      return AGGRESSION_COLOR[s.id];
    case 'family':
      return FAMILY_COLOR[s.id];
    case 'series':
      return seriesDef(String(s.value)).color;
    default:
      return s.color;
  }
}

/** One colour per slice for the wheel's band; undefined falls back to neutral steel. */
export function wheelAccents(wheel: WheelDef): (string | undefined)[] {
  return wheel.slices.map((s) => sliceAccent(wheel.id as WheelId, s));
}

const AGGRESSION_LINE: Record<string, string> = {
  calm: 'Never puts a wheel wrong',
  calculated: 'Waits for the right moment',
  balanced: 'Attacks when it is on',
  aggressive: 'Passes more, crashes more',
  kamikaze: 'Gap or no gap, goes for it',
};
const POTENTIAL_LINE: Record<string, string> = {
  generational: 'Could become an all-time great',
  star: 'Plenty of upside left',
  solid: 'Will keep improving',
  limited: 'Close to the ceiling',
  peaked: 'This is as good as it gets',
};

/** One line explaining what a pick means. */
export function describePick(id: WheelId, s: WheelSlice, world: World): string {
  switch (id) {
    case 'nation':
      return nation(String(s.value)).name;
    case 'family':
      return family(String(s.value)).description;
    case 'age':
      return `Born ${world.year + 1 - Number(s.value)} · first car race next season`;
    case 'pace':
    case 'racecraft':
    case 'consistency':
    case 'wet': {
      const [lo, hi] = STAR_BANDS[Number(s.value) - 1];
      return `${id === 'wet' ? 'Wet rating' : 'Rated'} ${lo}–${hi}`;
    }
    case 'aggression':
      return AGGRESSION_LINE[s.id] ?? '';
    case 'personality':
      return personality(String(s.value)).description;
    case 'potential':
      return POTENTIAL_LINE[s.id] ?? '';
    case 'series':
      return s.sub ?? seriesDef(String(s.value)).name;
    case 'team': {
      const t = world.teams[String(s.value)];
      if (!t) return '';
      const rivals = Object.values(world.teams)
        .filter((x) => x.series === t.series)
        .sort((a, b) => b.perf - a.perf);
      return `${seriesDef(t.series).short} · car ${rivals.findIndex((x) => x.id === t.id) + 1} of ${rivals.length}`;
    }
  }
}

const pad2 = (n: number) => String(n).padStart(2, '0');

// ---------------------------------------------------------------------------

function RailCell({ state }: { state: 'done' | 'current' | 'todo' }) {
  const pulse = useSharedValue(0);
  useEffect(() => {
    if (state === 'current') pulse.set(withRepeat(withSequence(withTiming(1, { duration: 520 }), withTiming(0, { duration: 520 })), -1));
    else pulse.set(withTiming(0, { duration: 150 }));
  }, [state, pulse]);
  const st = useAnimatedStyle(() => ({ opacity: state === 'current' ? 0.55 + pulse.value * 0.45 : 1 }));
  return (
    <Animated.View style={[{ flex: 1, height: 7, borderRadius: 1, transform: [{ skewX: '-24deg' }], backgroundColor: state === 'done' ? '#E9E4DA' : state === 'current' ? C.red : C.surface3 }, st]} />
  );
}

/** Twelve skewed cells: done, live, to come. */
export function ProgressRail({ step, total = WHEEL_ORDER.length }: { step: number; total?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 3, alignItems: 'center' }} accessibilityLabel={`Wheel ${Math.min(step + 1, total)} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <RailCell key={i} state={i < step ? 'done' : i === step ? 'current' : 'todo'} />
      ))}
    </View>
  );
}

/** "01 / 12" figure beside the wheel's name and question. */
export function StepLockup({ step, total, wheel }: { step: number; total: number; wheel: WheelDef }) {
  return (
    <Animated.View key={wheel.id} entering={FadeInDown.duration(260)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <Text style={{ fontFamily: F.display, fontSize: 54, lineHeight: 56, color: C.red, letterSpacing: -1 }}>{pad2(step + 1)}</Text>
        <Text style={{ fontFamily: F.title, fontSize: 16, lineHeight: 20, color: C.textMute, marginTop: 6, marginLeft: 2 }}>/{total}</Text>
      </View>
      <View style={{ width: 1, alignSelf: 'stretch', marginVertical: 6, backgroundColor: C.lineStrong }} />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon name={WHEEL_ICON[wheel.id as WheelId] ?? 'dice'} size={13} color={C.textDim} strokeWidth={2.4} />
          <Txt v="micro" color={C.textDim} numberOfLines={1} style={{ flexShrink: 1 }}>
            {wheel.blurb}
          </Txt>
        </View>
        <Text style={{ fontFamily: F.display, fontSize: 34, lineHeight: 38, color: C.text, textTransform: 'uppercase' }} numberOfLines={1} adjustsFontSizeToFit>
          {wheel.title.replace('...', '…')}
        </Text>
      </View>
    </Animated.View>
  );
}

function Dots() {
  const t = useSharedValue(0);
  useEffect(() => {
    t.set(withRepeat(withTiming(1, { duration: 600 }), -1, false));
  }, [t]);
  const a = useAnimatedStyle(() => ({ opacity: t.value < 0.33 ? 1 : 0.25 }));
  const b = useAnimatedStyle(() => ({ opacity: t.value >= 0.33 && t.value < 0.66 ? 1 : 0.25 }));
  const c = useAnimatedStyle(() => ({ opacity: t.value >= 0.66 ? 1 : 0.25 }));
  return (
    <View style={{ flexDirection: 'row', gap: 5 }}>
      {[a, b, c].map((st, i) => (
        <Animated.View key={i} style={[{ width: 7, height: 7, backgroundColor: C.text, transform: [{ skewX: '-12deg' }] }, st]} />
      ))}
    </View>
  );
}

function PickValue({ id, slice, size }: { id: WheelId; slice: WheelSlice; size: number }) {
  if (slice.stars || id === 'wet') {
    const n = slice.stars ?? Number(slice.value);
    return (
      <Text style={{ fontFamily: F.display, fontSize: size * 0.9, lineHeight: size * 1.1, color: C.gold, letterSpacing: 1 }}>
        {'★'.repeat(n)}
        <Text style={{ color: withAlpha(C.gold, 0.22) }}>{'★'.repeat(5 - n)}</Text>
      </Text>
    );
  }
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}>
      {slice.flag ? <Flag id={slice.flag} width={size * 1.15} /> : null}
      <Text style={{ fontFamily: F.display, fontSize: size, lineHeight: size * 1.12, color: C.text, textTransform: 'uppercase', flexShrink: 1 }} numberOfLines={1} adjustsFontSizeToFit>
        {slice.label}
      </Text>
    </View>
  );
}

/** Locks in the answer: what landed, what it means. */
export function ResultPlate({ wheel, slice, phase, world, accent }: { wheel: WheelDef; slice: WheelSlice | null; phase: 'idle' | 'spinning' | 'result'; world: World; accent?: string }) {
  const id = wheel.id as WheelId;
  return (
    <View
      style={{
        height: 64,
        flexDirection: 'row',
        alignItems: 'stretch',
        backgroundColor: C.surface,
        borderWidth: 1,
        borderColor: slice ? C.lineStrong : C.line,
        borderRadius: R.sm,
        overflow: 'hidden',
      }}
    >
      <View style={{ width: 4, backgroundColor: slice ? (accent ?? C.red) : C.surface3 }} />
      <View style={{ width: 52, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderRightColor: C.line }}>
        <Icon name={WHEEL_ICON[id] ?? 'dice'} size={22} color={slice ? C.text : C.textMute} strokeWidth={2.2} />
      </View>
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 12 }}>
        {slice ? (
          <Animated.View key={slice.id} entering={ZoomIn.duration(220)} style={{ gap: 1 }}>
            <PickValue id={id} slice={slice} size={26} />
            <Txt v="small" color={C.textDim} numberOfLines={1} style={{ fontSize: 12.5, lineHeight: 16 }}>
              {describePick(id, slice, world)}
            </Txt>
          </Animated.View>
        ) : phase === 'spinning' ? (
          <Dots />
        ) : (
          <Animated.View entering={FadeIn.duration(200)}>
            <Txt v="label" color={C.textMute}>
              Spin to decide
            </Txt>
          </Animated.View>
        )}
      </View>
      <View style={{ width: 74, alignItems: 'center', justifyContent: 'center', gap: 3, backgroundColor: slice ? withAlpha(C.green, 0.08) : 'transparent' }}>
        {slice ? (
          <Animated.View entering={FadeIn.duration(200).delay(120)} style={{ alignItems: 'center', gap: 3 }}>
            <Icon name="check" size={18} color={C.green} strokeWidth={3} />
            <Txt v="micro" color={C.green}>
              Locked
            </Txt>
          </Animated.View>
        ) : (
          <Txt v="micro" color={phase === 'spinning' ? C.text : C.textMute}>
            {phase === 'spinning' ? 'Live' : 'Ready'}
          </Txt>
        )}
      </View>
    </View>
  );
}

/** The driver taking shape: one compact tag per locked pick. Scrolls to the newest. */
export function PicksStrip({ picks }: { picks: Picks }) {
  const ref = useRef<ScrollView>(null);
  const done = WHEEL_ORDER.filter((w) => picks[w]);
  useEffect(() => {
    const t = setTimeout(() => ref.current?.scrollToEnd({ animated: true }), 60);
    return () => clearTimeout(t);
  }, [done.length]);
  if (!done.length)
    return (
      <View style={{ height: 30, justifyContent: 'center' }}>
        <Txt v="micro" color={C.textMute}>
          Twelve wheels. One driver. No take-backs.
        </Txt>
      </View>
    );
  return (
    <ScrollView ref={ref} horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 6, alignItems: 'center', height: 30 }}>
      {done.map((w) => {
        const p = picks[w]!;
        const stars = p.stars ?? (w === 'wet' ? Number(p.value) : 0);
        return (
          <Animated.View
            key={w}
            entering={ZoomIn.duration(200)}
            style={{ height: 26, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, backgroundColor: C.surface2, borderRadius: R.xs, borderWidth: 1, borderColor: C.line }}
          >
            <Txt v="micro" color={C.textMute}>
              {SHORT[w]}
            </Txt>
            {p.flag ? <Flag id={p.flag} width={16} /> : null}
            {stars ? (
              <Text style={{ fontFamily: F.heading, fontSize: 12, color: C.gold }}>{'★'.repeat(stars)}</Text>
            ) : (
              <Text style={{ fontFamily: F.heading, fontSize: 13, color: C.text, textTransform: 'uppercase' }} numberOfLines={1}>
                {w === 'team' ? (shortTeam(p) ?? p.label) : p.label}
              </Text>
            )}
          </Animated.View>
        );
      })}
    </ScrollView>
  );
}

function shortTeam(p: WheelSlice): string | undefined {
  return p.label.length > 16 ? p.label.split(' ')[0] : undefined;
}

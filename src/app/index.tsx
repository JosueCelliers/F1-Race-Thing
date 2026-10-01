/**
 * Home: a night studio. The car is the hero, parked on a horizon line with the
 * wall lit behind it and a perspective floor running down under the launch
 * plate. The stage stretches to fill whatever height the phone has, so there
 * is never a dead band between the car and the buttons.
 */
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withTiming, type SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, Ellipse, Line, LinearGradient as SvgLinearGradient, RadialGradient, Stop, Text as SvgText } from 'react-native-svg';
import { ChequeredMark } from '../art/Badges';
import { CarSide } from '../art/Car';
import { Flag } from '../art/Flag';
import { Portrait } from '../art/Portrait';
import { series as seriesDef, SERIES } from '../content/series';
import type { HelmetDesign, TeamColors } from '../sim/types';
import { ageOf, fullName, ovr } from '../sim/drivers';
import { nextRaceMeta } from '../sim/career';
import { useGame, useWorld } from '../state/store';
import { Icon, type IconName } from '../ui/Icon';
import { Backdrop, Btn, IconBtn, Press, TeamStripe, Txt } from '../ui/kit';
import { useScreen } from '../ui/screen';
import { C, F, R, ratingColor, S, withAlpha } from '../ui/theme';

const FLOOR = '#06080C';
const TICKER_H = 30;

interface HeroCarSpec {
  carClass: string;
  colors: TeamColors;
  livery: string;
  helmet: HelmetDesign;
  number: number;
}

const DEFAULT_CAR: HeroCarSpec = {
  carClass: 'formula',
  colors: { primary: '#D0102B', secondary: '#F2EEE6', accent: '#E8B749' },
  livery: 'arrow',
  helmet: { pattern: 'halo', colors: ['#F2EEE6', '#D0102B', '#E8B749'] },
  number: 1,
};

function Streak({ y, w, delay, color, span }: { y: number; w: number; delay: number; color: string; span: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.set(withRepeat(withTiming(1, { duration: 1400 + delay * 3, easing: Easing.linear }), -1, false));
  }, [t, delay]);
  const st = useAnimatedStyle(() => ({ transform: [{ translateX: span * 0.65 - t.value * span * 1.6 }], opacity: Math.sin(t.value * Math.PI) }));
  return (
    <Animated.View style={[{ position: 'absolute', top: y, left: 0 }, st]}>
      <LinearGradient colors={[withAlpha(color, 0), withAlpha(color, 0.55), withAlpha(color, 0)]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ width: w, height: 1.5 }} />
    </Animated.View>
  );
}

/**
 * Everything behind the content: the lit wall, the giant number, the car, its
 * reflection and the floor grid. Positioned from the measured hero slot so it
 * adapts to every phone height.
 */
function Stage({ width, slot, car, idle }: { width: number; slot: { y: number; h: number }; car: HeroCarSpec; idle: SharedValue<number> }) {
  const room = slot.h - TICKER_H - 6;
  // Car plus reflection must fit the slot; otherwise it is as wide as the phone allows.
  const carW = Math.max(60, Math.min(width * 0.96, 560, room / (0.291 * 1.42)));
  const carH = carW * (64 / 220);
  const reflH = carH * 0.42;
  const horizon = slot.y + slot.h - TICKER_H - reflH;
  const carTop = horizon - carH * 0.97;
  const wallH = horizon - slot.y;
  const numSize = Math.max(40, Math.min(wallH * 1.25, width * 0.92));
  const numTop = slot.y - 30;
  const lightCy = horizon - carH * 0.45;

  const drift = useAnimatedStyle(() => ({ transform: [{ translateX: -4 + idle.value * 8 }, { translateY: Math.sin(idle.value * Math.PI) * -1.5 }] }));
  const glow = useAnimatedStyle(() => ({ opacity: 0.75 + idle.value * 0.25 }));
  const left = (width - carW) / 2;
  const carProps = { carClass: car.carClass, colors: car.colors, livery: car.livery, number: car.number, helmet: car.helmet, width: carW };

  // Perspective floor: rays from a vanishing point on the horizon, rungs closing up towards it.
  const floorH = 1200;
  const rays = Array.from({ length: 13 }, (_, i) => (i - 6) / 6);
  const rungs = Array.from({ length: 9 }, (_, i) => Math.pow((i + 1) / 9, 2.1) * floorH * 0.55);

  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
      {/* Wall light */}
      <Animated.View style={[{ position: 'absolute', left: 0, top: slot.y - 40, width, height: horizon - slot.y + 40 }, glow]}>
        <Svg width={width} height={horizon - slot.y + 40}>
          <Defs>
            <RadialGradient id="wallLight" cx="0.5" cy="0.5" r="0.5">
              <Stop offset="0" stopColor="#FF2D55" stopOpacity="0.34" />
              <Stop offset="0.5" stopColor="#B3122F" stopOpacity="0.12" />
              <Stop offset="1" stopColor="#B3122F" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Ellipse cx={width * 0.52} cy={lightCy - slot.y + 40} rx={width * 0.7} ry={Math.max(carH * 1.5, wallH * 0.7)} fill="url(#wallLight)" />
        </Svg>
      </Animated.View>
      {/* Giant race number, engraved into the wall and cut off by the floor */}
      <Svg width={width} height={horizon - numTop} style={{ position: 'absolute', left: 0, top: numTop }}>
        <Defs>
          <SvgLinearGradient id="numFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#F2EEE6" stopOpacity="0.085" />
            <Stop offset="1" stopColor="#F2EEE6" stopOpacity="0.01" />
          </SvgLinearGradient>
          <SvgLinearGradient id="numStroke" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#F2EEE6" stopOpacity="0.26" />
            <Stop offset="1" stopColor="#F2EEE6" stopOpacity="0.03" />
          </SvgLinearGradient>
        </Defs>
        <SvgText
          x={width / 2}
          y={horizon - numTop + numSize * 0.05}
          textAnchor="middle"
          fontSize={numSize}
          fontFamily="BarlowCondensed-Black-Italic"
          fontWeight="900"
          fill="url(#numFill)"
          stroke="url(#numStroke)"
          strokeWidth={1.5}
        >
          {String(car.number).padStart(2, '0')}
        </SvgText>
      </Svg>
      <Streak y={horizon - carH * 1.1} w={width * 0.55} delay={0} color="#F2EEE6" span={width} />
      <Streak y={horizon - carH * 0.72} w={width * 0.4} delay={180} color={C.red} span={width} />
      <Streak y={horizon - carH * 0.35} w={width * 0.6} delay={420} color="#F2EEE6" span={width} />

      {/* Floor */}
      <View style={{ position: 'absolute', left: 0, right: 0, top: horizon, bottom: 0, backgroundColor: FLOOR, overflow: 'hidden' }}>
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: reflH + 6, overflow: 'hidden' }}>
          <Animated.View style={[{ position: 'absolute', left, top: carH * 0.02, opacity: 0.16, transform: [{ scaleY: -1 }] }, drift]}>
            <CarSide {...carProps} shadow={false} />
          </Animated.View>
        </View>
        <LinearGradient colors={[withAlpha(FLOOR, 0.1), FLOOR]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={{ position: 'absolute', left: 0, right: 0, top: 0, height: reflH + 6 }} />
        {/* Light spilling onto the floor from the wall, over the reflection so there is no band */}
        <LinearGradient colors={[withAlpha(C.red, 0.13), withAlpha(C.red, 0)]} style={{ position: 'absolute', left: 0, right: 0, top: 0, height: carH * 1.2 }} />
        <Svg width={width} height={floorH} style={{ position: 'absolute', left: 0, top: 0 }}>
          {rays.map((k) => (
            <Line key={`r${k}`} x1={width / 2 + k * width * 0.18} y1={0} x2={width / 2 + k * width * 1.9} y2={floorH * 0.55} stroke="#F2EEE6" strokeOpacity={0.055} strokeWidth={1} />
          ))}
          {rungs.map((y) => (
            <Line key={`h${y}`} x1={0} y1={y} x2={width} y2={y} stroke="#F2EEE6" strokeOpacity={0.04} strokeWidth={1} />
          ))}
        </Svg>
      </View>
      <View style={{ position: 'absolute', left: 0, right: 0, top: horizon, height: 1, backgroundColor: withAlpha('#F2EEE6', 0.16) }} />

      {/* The car */}
      <Animated.View style={[{ position: 'absolute', left, top: carTop }, drift]}>
        <CarSide {...carProps} />
      </Animated.View>
    </View>
  );
}

function Portal({
  icon,
  title,
  figure,
  figureLabel,
  lines,
  accent,
  onPress,
}: {
  icon: IconName;
  title: string;
  figure: string;
  figureLabel: string;
  lines: string[];
  accent: string;
  onPress: () => void;
}) {
  return (
    <Press onPress={onPress} style={{ flex: 1 }} label={`${title}: ${figure} ${figureLabel}`}>
      <View style={styles.portal}>
        <View style={{ position: 'absolute', left: 0, top: 0, right: 0, height: 2, backgroundColor: accent }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name={icon} size={15} color={accent} strokeWidth={2.4} />
            <Txt v="label" color={C.text}>
              {title}
            </Txt>
          </View>
          <Icon name="chevron" size={16} color={C.textMute} strokeWidth={2.4} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
          <Txt v="numBig" style={{ fontSize: 38, lineHeight: 38 }}>
            {figure}
          </Txt>
          <Txt v="micro" color={C.textDim}>
            {figureLabel}
          </Txt>
        </View>
        <View style={{ gap: 2 }}>
          {lines.map((l) => (
            <Txt key={l} v="small" color={C.textDim} numberOfLines={1} style={{ fontSize: 12.5 }}>
              {l}
            </Txt>
          ))}
        </View>
      </View>
    </Press>
  );
}

export default function Home() {
  const world = useWorld();
  const archive = useGame((s) => s.archive);
  const insets = useSafeAreaInsets();
  const { width } = useScreen();
  const [slot, setSlot] = useState<{ y: number; h: number } | null>(null);
  const idle = useSharedValue(0);
  useEffect(() => {
    idle.set(withRepeat(withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }), -1, true));
  }, [idle]);

  const a = world?.active;
  const me = a ? world!.drivers[a.driverId] : undefined;
  const team = me?.contract ? world!.teams[me.contract.team] : undefined;
  const s = me?.contract ? seriesDef(me.contract.series) : undefined;
  const meta = useMemo(() => (world && a ? nextRaceMeta(world) : null), [world, a, a?.raceCount]); // eslint-disable-line react-hooks/exhaustive-deps
  // With a career running, the hero is your actual car.
  const car: HeroCarSpec = me && team && s ? { carClass: s.carClass, colors: team.colors, livery: team.livery, helmet: me.helmet, number: me.number } : DEFAULT_CAR;

  const records = Object.values(archive);
  const titles = records.reduce((n, r) => n + r.totals.titles, 0);
  const best = records.reduce<(typeof records)[number] | undefined>((b, r) => (!b || r.legacy > b.legacy ? r : b), undefined);
  const lastPrime = world ? [...world.history].reverse().find((h) => h.series === 'prime') : undefined;
  const activeDrivers = world ? Object.values(world.drivers).filter((d) => d.status === 'active').length : 0;
  const teamCount = world ? Object.keys(world.teams).length : 0;

  const onSlot = (e: LayoutChangeEvent) => {
    const { y, height } = e.nativeEvent.layout;
    // A screen hidden under the stack can report a collapsed layout: keep the last real one.
    if (height < 120) return;
    if (!slot || Math.abs(slot.y - y) > 0.5 || Math.abs(slot.h - height) > 0.5) setSlot({ y, h: height });
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Backdrop tint={C.red} intensity={0.8} />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false} overScrollMode="never" showsVerticalScrollIndicator={false}>
        <View style={{ flex: 1 }}>
          {slot ? (
            <Animated.View entering={FadeIn.duration(500)} style={StyleSheet.absoluteFill}>
              <Stage width={width} slot={slot} car={car} idle={idle} />
            </Animated.View>
          ) : null}
          <View style={{ flex: 1, paddingTop: insets.top + S.sm, paddingBottom: insets.bottom + S.md, paddingHorizontal: S.lg }}>
            {/* Top strip */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ChequeredMark size={22} />
                <Txt v="label" color={C.textDim}>
                  {world ? `Universe · ${world.year}` : 'New universe'}
                </Txt>
              </View>
              <IconBtn icon="settings" label="Settings" onPress={() => router.push('/settings')} bg="transparent" />
            </View>

            {/* Logo lockup */}
            <Animated.View entering={FadeInDown.duration(500)} style={{ marginTop: S.sm }}>
              <Text style={styles.logoTop}>Chequered</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: -6 }}>
                <Text style={styles.logoBottom}>Lives</Text>
                <View style={{ flex: 1, gap: 5 }}>
                  <View style={{ height: 4, backgroundColor: C.red, transform: [{ skewX: '-30deg' }] }} />
                  <View style={{ height: 2, width: '62%', backgroundColor: C.redDeep, transform: [{ skewX: '-30deg' }] }} />
                </View>
              </View>
              <Txt v="small" color={C.textDim} style={{ marginTop: 4 }}>
                Spin a driver. Live the career. Build a legacy.
              </Txt>
            </Animated.View>

            {/* Hero slot: the stage behind measures itself from this */}
            <View onLayout={onSlot} style={{ flex: 1, minHeight: 190, justifyContent: 'flex-end' }}>
              <Animated.View entering={FadeIn.delay(300)} style={{ height: TICKER_H, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ backgroundColor: C.red, paddingHorizontal: 7, paddingVertical: 2, transform: [{ skewX: '-12deg' }] }}>
                  <Txt v="micro" color="#FFFFFF">
                    {lastPrime ? `${lastPrime.year} Prime` : 'Live'}
                  </Txt>
                </View>
                <Txt v="small" color={C.textDim} numberOfLines={1} style={{ flex: 1, fontSize: 12.5 }}>
                  {lastPrime ? `Champion ${lastPrime.driverName} · ${lastPrime.teamName}` : 'Fictional teams, fictional drivers, very real drama'}
                </Txt>
              </Animated.View>
            </View>

            {/* Primary action */}
            <Animated.View entering={FadeInDown.duration(450).delay(200)} style={{ gap: S.sm, marginTop: S.sm }}>
              {a && me ? (
                <Press onPress={() => router.push('/career')} label={`Continue career as ${fullName(me)}`}>
                  <View style={styles.careerCard}>
                    <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: team?.colors.primary ?? C.red }} />
                    <Portrait looks={me.looks} gender={me.gender} suit={team?.colors} size={56} age={ageOf(me, world!.year)} shape="square" />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Txt v="micro" color={C.red}>
                        Current career · {world!.year}
                      </Txt>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Flag id={me.nation} width={18} />
                        <Txt v="h2" numberOfLines={1} style={{ flexShrink: 1 }}>
                          {fullName(me)}
                        </Txt>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <TeamStripe colors={team?.colors} height={12} width={3} />
                        <Txt v="small" color={C.textDim} numberOfLines={1} style={{ flexShrink: 1, fontSize: 12.5 }}>
                          {team ? team.name : 'Free agent'}
                          {s ? ` · ${s.name}` : ''}
                        </Txt>
                      </View>
                    </View>
                    <View style={{ alignItems: 'center' }}>
                      <Txt v="numBig" color={ratingColor(ovr(me))} style={{ fontSize: 34, lineHeight: 34 }}>
                        {ovr(me)}
                      </Txt>
                      <Txt v="micro" color={C.textMute}>
                        OVR
                      </Txt>
                    </View>
                  </View>
                </Press>
              ) : null}
              {a && me ? (
                <Btn
                  label="Continue career"
                  sub={meta ? `Next: ${meta.round.name}${meta.oneOff ? '' : ` · Round ${meta.roundIndex + 1}/${meta.totalRounds}`}` : 'Your future awaits'}
                  onPress={() => router.push('/career')}
                  testID="home-continue"
                />
              ) : (
                <Btn
                  label="Spin a new driver"
                  icon="dice"
                  sub={world?.careers.length ? 'The world has moved on. Who is next?' : 'Twelve wheels decide who you are'}
                  onPress={() => router.push('/create')}
                  testID="home-spin"
                />
              )}
            </Animated.View>

            {/* Portals */}
            <Animated.View entering={FadeInDown.duration(450).delay(320)} style={{ flexDirection: 'row', gap: S.sm, marginTop: S.md }}>
              <Portal
                icon="archive"
                title="Archive"
                accent={C.gold}
                figure={String(records.length)}
                figureLabel={records.length === 1 ? 'career' : 'careers'}
                lines={best ? [`${titles} title${titles === 1 ? '' : 's'} won`, `Best: ${best.driver.first[0]}. ${best.driver.last}`] : ['Every driver ends up here', 'Legends and disasters']}
                onPress={() => router.push('/archive')}
              />
              <Portal
                icon="globe"
                title="World"
                accent={C.cyan}
                figure={String(SERIES.length)}
                figureLabel="championships"
                lines={
                  world
                    ? [`${teamCount} teams · ${activeDrivers} drivers`, lastPrime ? `${world.history.length} titles awarded` : 'History begins']
                    : ['One connected universe', 'Champions and records']
                }
                onPress={() => router.push('/world')}
              />
            </Animated.View>
            <Txt v="micro" color={C.textMute} center style={{ marginTop: S.md, letterSpacing: 1 }}>
              All championships, teams and drivers are fictional
            </Txt>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  logoTop: {
    fontFamily: F.display,
    fontSize: 58,
    lineHeight: 58,
    color: C.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  logoBottom: {
    fontFamily: F.display,
    fontSize: 58,
    lineHeight: 62,
    color: C.red,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  portal: {
    backgroundColor: withAlpha(C.surface, 0.94),
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: R.sm,
    padding: 12,
    gap: 8,
    minHeight: 116,
    overflow: 'hidden',
  },
  careerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: withAlpha(C.surface, 0.96),
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: R.sm,
    padding: 10,
    overflow: 'hidden',
  },
});

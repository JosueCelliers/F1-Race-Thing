/**
 * Twelve wheels, one driver. The wheel fills the phone's width, the answer
 * locks into a plate underneath, and SPIN sits where the thumb already is.
 * After the last wheel the driver file opens.
 */
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, View, type LayoutChangeEvent } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DriverReveal } from '../creation/Reveal';
import { PicksStrip, ProgressRail, ResultPlate, StepLockup, wheelAccents } from '../creation/SpinHud';
import { startCareer } from '../sim/career';
import { buildWheel, pickSlice, rollIdentity, rollSkills, STAR_BANDS, WHEEL_ORDER, type Identity, type Picks, type WheelDef } from '../sim/creation';
import { generateLooks, generateName } from '../sim/drivers';
import { mixSeed, Rng } from '../sim/rng';
import { useGame } from '../state/store';
import { haptic } from '../ui/haptics';
import { Backdrop, Btn, IconBtn, Txt } from '../ui/kit';
import { SpinWheel, type SpinRequest } from '../ui/SpinWheel';
import { C, S } from '../ui/theme';

/** A new wheel settles in rather than popping (custom layout animations don't run on web). */
function WheelEnter({ children, style }: { children: React.ReactNode; style?: object }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.set(withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) }));
  }, [t]);
  const st = useAnimatedStyle(() => ({ opacity: t.value, transform: [{ scale: 0.9 + t.value * 0.1 }, { rotate: `${(1 - t.value) * -14}deg` }] }));
  return <Animated.View style={[style, st]}>{children}</Animated.View>;
}

export default function Create() {
  const world = useGame((s) => s.world);
  const ensureWorld = useGame((s) => s.ensureWorld);
  const mutate = useGame((s) => s.mutate);
  const spinSpeed = useGame((s) => s.settings.spinSpeed);
  const insets = useSafeAreaInsets();
  const [seed] = useState(() => Math.floor(Math.random() * 2 ** 31));
  const rng = useRef(new Rng(seed));
  const [step, setStep] = useState(0);
  const [picks, setPicks] = useState<Picks>({});
  const [wheel, setWheel] = useState<WheelDef | null>(null);
  const [request, setRequest] = useState<SpinRequest | null>(null);
  const [winner, setWinner] = useState<number | null>(null);
  const [phase, setPhase] = useState<'idle' | 'spinning' | 'result'>('idle');
  const [auto, setAuto] = useState(false);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [zone, setZone] = useState<{ w: number; h: number } | null>(null);
  const identRng = useRef(new Rng(mixSeed(seed, 'identity')));
  const total = WHEEL_ORDER.length;

  useEffect(() => {
    if (!world) {
      const t = setTimeout(() => ensureWorld(), 60);
      return () => clearTimeout(t);
    }
  }, [world, ensureWorld]);

  const done = step >= total;

  useEffect(() => {
    if (!world || done) return;
    setWheel(buildWheel(WHEEL_ORDER[step], picks, world, rng.current));
    setRequest(null);
    setWinner(null);
    setPhase('idle');
    // picks intentionally not a dependency: a wheel is built once per step.
  }, [step, world, done]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (done && world && !identity) setIdentity(rollIdentity(world, picks, identRng.current));
  }, [done, world, identity, picks]);

  const spin = useCallback(() => {
    if (!wheel || phase !== 'idle') return;
    const target = pickSlice(wheel, rng.current);
    setRequest({ id: Date.now() + Math.random(), target });
    setPhase('spinning');
  }, [wheel, phase]);

  useEffect(() => {
    if (auto && phase === 'idle' && wheel && !done) {
      const t = setTimeout(spin, 220);
      return () => clearTimeout(t);
    }
  }, [auto, phase, wheel, done, spin]);

  const onDone = useCallback(
    (index: number) => {
      if (!wheel) return;
      const slice = wheel.slices[index];
      setWinner(index);
      setPicks((p) => ({ ...p, [wheel.id]: slice }));
      setPhase('result');
      haptic.success();
      setTimeout(() => setStep((s) => s + 1), auto ? 600 : 1150);
    },
    [wheel, auto],
  );

  const skills = useMemo(() => (done ? rollSkills(picks, new Rng(mixSeed(seed, 'career'))) : null), [done, picks, seed]);
  const accents = useMemo(() => (wheel ? wheelAccents(wheel) : undefined), [wheel]);
  const captions = useMemo(() => wheel?.slices.map((sl) => (sl.stars ? STAR_BANDS[sl.stars - 1].join('–') : undefined)), [wheel]);

  const start = () => {
    if (!identity || !world) return;
    haptic.success();
    mutate((w) => startCareer(w, picks, identity, mixSeed(seed, 'career')));
    router.replace('/career');
  };

  const onZone = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (!zone || Math.abs(zone.w - width) > 1 || Math.abs(zone.h - height) > 1) setZone({ w: width, h: height });
  };

  if (!world) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', gap: 14, padding: S.xl }}>
        <Backdrop tint={C.red} />
        <ActivityIndicator color={C.red} size="large" />
        <Txt v="h2">Building the universe…</Txt>
        <Txt v="small" color={C.textDim} center>
          Simulating the seasons before your driver arrives
        </Txt>
      </View>
    );
  }

  // ---------------------------------------------------------------- Reveal
  if (done && identity && skills) {
    const nat = String(picks.nation?.value);
    return (
      <DriverReveal
        world={world}
        picks={picks}
        identity={identity}
        skills={skills}
        onStart={start}
        onBack={() => router.dismissTo('/')}
        onNewLook={() => {
          haptic.tap();
          setIdentity({ ...identity, looks: generateLooks(identRng.current, nat, identity.gender) });
        }}
        onSwap={() => {
          haptic.tap();
          const g = identity.gender === 'm' ? 'f' : 'm';
          const parent = identity.parentId ? world.drivers[identity.parentId] : undefined;
          const nm = generateName(identRng.current, nat, g, parent?.last);
          setIdentity({ ...identity, gender: g, first: nm.first, last: nm.last, looks: generateLooks(identRng.current, nat, g) });
        }}
        onRename={(first, last) => setIdentity({ ...identity, first, last })}
      />
    );
  }

  // ---------------------------------------------------------------- Wheels
  // The wheel takes the whole free zone; the pointer overhangs its top by ~3%.
  const size = zone ? Math.floor(Math.min(zone.w, zone.h / 1.04, 560)) : 0;
  const current = wheel && winner !== null ? wheel.slices[winner] : null;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Backdrop tint={C.red} intensity={0.7} />
      <View style={{ flex: 1, paddingTop: insets.top + S.sm, paddingBottom: insets.bottom + S.md, paddingHorizontal: S.lg }}>
        {/* Top bar: back, progress */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: S.md }}>
          <IconBtn icon="back" label="Back to home" onPress={() => router.dismissTo('/')} />
          <View style={{ flex: 1, gap: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Txt v="micro" color={C.textDim}>
                Spin your driver
              </Txt>
              <Txt v="micro" color={C.textMute}>
                {Math.min(step + 1, total)} of {total}
              </Txt>
            </View>
            <ProgressRail step={step} total={total} />
          </View>
        </View>

        {wheel ? (
          <View style={{ marginTop: S.md }}>
            <StepLockup step={step} total={total} wheel={wheel} />
          </View>
        ) : null}

        {/* Wheel zone: fills whatever height is left */}
        <View onLayout={onZone} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginVertical: S.xs, marginHorizontal: -S.lg + 6 }}>
          {wheel && size > 0 ? (
            <WheelEnter key={wheel.id} style={{ marginTop: size * 0.03 }}>
              <SpinWheel
                slices={wheel.slices}
                size={size}
                request={request}
                onDone={onDone}
                onPressHub={spin}
                disabled={phase !== 'idle' || auto}
                fast={auto || spinSpeed === 'fast'}
                winner={winner}
                accents={accents}
                captions={captions}
                hubTop={String(step + 1).padStart(2, '0')}
                hubLabel="SPIN"
              />
            </WheelEnter>
          ) : null}
        </View>

        {wheel ? <ResultPlate wheel={wheel} slice={current} phase={phase} world={world} accent={current && accents ? (accents[winner!] ?? current.color) : undefined} /> : null}
        <View style={{ marginTop: S.sm }}>
          <PicksStrip picks={picks} />
        </View>

        {/* Thumb zone */}
        <View style={{ flexDirection: 'row', gap: S.sm, marginTop: S.sm }}>
          <Btn label="Spin" icon="refresh" onPress={spin} disabled={phase !== 'idle' || auto} style={{ flex: 1 }} testID="spin" />
          <Btn label={auto ? 'Stop' : 'Auto'} icon={auto ? 'pause' : 'ff'} kind="secondary" onPress={() => setAuto((a) => !a)} style={{ width: 128 }} chevrons={false} testID="spin-all" />
        </View>
      </View>
    </View>
  );
}

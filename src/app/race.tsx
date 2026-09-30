import { Redirect, router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, ScrollView, useWindowDimensions, View } from 'react-native';
import Animated, { cancelAnimation, Easing, FadeIn, FadeInDown, runOnJS, useSharedValue, withTiming, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Flag } from '../art/Flag';
import { TrackMap } from '../art/TrackMap';
import { series as seriesDef } from '../content/series';
import { HighlightPlayer, HighlightReel } from '../highlights/HighlightPlayer';
import { TrackBroadcast, type Segment } from '../race/TrackBroadcast';
import { MomentSheet } from '../race/MomentSheet';
import { gapLabel, Tower, TyreDot } from '../race/Tower';
import { finishRace, forecast, nextRaceMeta, prepareRace, specFromMoment, type PreparedRace, type RaceExtras, type RaceMeta, type RaceOutcome } from '../sim/career';
import { topRival } from '../sim/events';
import type { Moment, MomentResolution } from '../sim/race/moments';
import type { Snapshot } from '../sim/race/engine';
import { Rng } from '../sim/rng';
import type { HighlightSpec } from '../sim/types';
import { useGame, useWorld } from '../state/store';
import { HighlightRows, PlayAllChip } from '../ui/HighlightList';
import { haptic } from '../ui/haptics';
import { Icon } from '../ui/Icon';
import { Backdrop, Btn, Card, Header, IconBtn, Pill, PosBadge, Press, Screen, SectionTitle, Txt } from '../ui/kit';
import { C, F, R, S, withAlpha } from '../ui/theme';

const STEP_MS = 2300;

type Stage = 'pre' | 'grid' | 'live' | 'done';

export default function Race() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const highlightsMode = params.mode === 'highlights';
  const world = useWorld();
  const mutate = useGame((s) => s.mutate);
  const defaultSpeed = useGame((s) => s.settings.speed);
  const [meta] = useState<RaceMeta | null>(() => (world ? nextRaceMeta(world) : null));
  const [stage, setStage] = useState<Stage>('pre');
  const [prep, setPrep] = useState<PreparedRace | null>(null);
  const [outcome, setOutcome] = useState<RaceOutcome | null>(null);

  if (!world || !world.active || !meta) return <Redirect href="/career" />;

  const start = (choice: 'push' | 'banker') => {
    haptic.medium();
    const p = prepareRace(world, meta, choice);
    p.engine.playerPitControl = false;
    setPrep(p);
    setStage('grid');
  };

  if (stage === 'pre') return <PreRace meta={meta} onQuali={start} />;
  if (stage === 'grid' && prep) return <GridView prep={prep} onStart={() => setStage('live')} />;
  if (stage === 'live' && prep)
    return (
      <Live
        prep={prep}
        highlightsMode={highlightsMode}
        defaultSpeed={highlightsMode ? 12 : defaultSpeed}
        onFinish={(extras) => {
          let out: RaceOutcome | null = null;
          mutate((w) => {
            out = finishRace(w, prep, extras);
          });
          return out;
        }}
        onDone={(out) => {
          setOutcome(out);
          setStage('done');
        }}
      />
    );
  if (stage === 'done' && prep && outcome) return <Results prep={prep} outcome={outcome} />;
  return <Screen>{null}</Screen>;
}

// ---------------------------------------------------------------------------
// Pre-race: event card + qualifying decision
// ---------------------------------------------------------------------------

function PreRace({ meta, onQuali }: { meta: RaceMeta; onQuali: (c: 'push' | 'banker') => void }) {
  const world = useWorld()!;
  const s = seriesDef(meta.seriesId);
  const fc = forecast(world, meta);
  const { width } = useWindowDimensions();
  return (
    <Screen tint={s.color} header={<Header title={meta.round.name} sub={`${s.name}${meta.oneOff ? ' · One-off' : ` · Round ${meta.roundIndex + 1}/${meta.totalRounds}`}`} />}>
      <Animated.View entering={FadeInDown.duration(400)}>
        <Card style={{ alignItems: 'center', paddingVertical: S.lg }}>
          <TrackMap trackId={meta.track.id} width={width - 64} height={210} variant="broadcast" sectors />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: S.sm }}>
            <Flag id={meta.track.nation} width={24} />
            <Txt v="h2">{meta.track.name}</Txt>
          </View>
          <Txt v="small" color={C.textDim} style={{ marginTop: 4 }}>
            {meta.round.hours ? `${meta.round.hours} hours` : `${meta.round.laps} laps`} · {meta.track.lengthKm.toFixed(1)} km · {meta.track.kind}
          </Txt>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: S.md, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Pill label={fc.wetStart ? 'Wet start' : fc.rainLater ? 'Rain threat' : 'Dry'} icon={fc.wetStart ? 'rain' : fc.rainLater ? 'cloud' : 'sun'} color={fc.wetStart || fc.rainLater ? C.blue : C.surface3} />
            <Pill label={`Overtaking ${meta.track.overtaking > 0.6 ? 'easy' : meta.track.overtaking > 0.35 ? 'medium' : 'hard'}`} color={C.surface3} />
            {meta.reasons.map((r) => (
              <Pill key={r} label={r} color={r.startsWith('Title') ? C.gold : r === 'Crown jewel' ? C.purple : C.surface3} />
            ))}
          </View>
        </Card>
      </Animated.View>
      <SectionTitle title="Qualifying" />
      <Card>
        <Txt v="body" color={C.textDim}>
          Final run of qualifying. Track is {fc.wetStart ? 'wet and treacherous' : 'rubbered in and fast'}. How hard do you push?
        </Txt>
        <View style={{ gap: S.sm, marginTop: S.md }}>
          <Btn label="Push to the limit" icon="fire" onPress={() => onQuali('push')} sub="Faster lap · 20% chance of a mistake" />
          <Btn label="Banker lap" icon="shield" kind="secondary" onPress={() => onQuali('banker')} sub="Clean and safe" />
        </View>
      </Card>
    </Screen>
  );
}

function GridView({ prep, onStart }: { prep: PreparedRace; onStart: () => void }) {
  const e = prep.engine;
  const p = e.playerIndex;
  const pos = e.cfg.grid.indexOf(p) + 1;
  return (
    <Screen header={<Header title="Starting grid" sub={prep.meta.round.name} back={false} />} footer={<Btn label={prep.meta.track.kind === 'oval' ? 'Green flag' : 'Lights out'} icon="flag" onPress={onStart} />}>
      <Animated.View entering={ZoomIn.springify().damping(14)} style={{ alignItems: 'center', marginVertical: S.lg }}>
        {p >= 0 ? (
          <>
            <PosBadge pos={pos} size={72} />
            <Txt v="title" style={{ marginTop: S.md }}>
              {pos === 1 ? 'Pole position!' : `You start P${pos}`}
            </Txt>
            {prep.qualiMistake ? (
              <Txt v="body" color={C.red} style={{ marginTop: 4 }}>
                You pushed too hard and ran wide on the final lap.
              </Txt>
            ) : null}
          </>
        ) : (
          <Txt v="h1">You are watching from the garage</Txt>
        )}
      </Animated.View>
      <Card padded={false} style={{ padding: 10 }}>
        {e.cfg.grid.map((idx, k) => {
          const en = e.entries[idx];
          const me = idx === p;
          return (
            <View key={en.driverId} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, paddingHorizontal: 8, marginLeft: k % 2 ? 36 : 0, borderRadius: 8, backgroundColor: me ? withAlpha(C.red, 0.2) : 'transparent' }}>
              <Txt v="num" style={{ width: 26 }} color={k < 3 ? C.gold : C.text}>
                {k + 1}
              </Txt>
              <View style={{ width: 4, height: 18, borderRadius: 2, backgroundColor: en.colors.primary }} />
              <Txt v="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>
                {en.name}
              </Txt>
              <Txt v="small" color={C.textMute}>
                #{en.number}
              </Txt>
            </View>
          );
        })}
      </Card>
    </Screen>
  );
}

// ---------------------------------------------------------------------------
// Live broadcast
// ---------------------------------------------------------------------------

function gapsOf(snap: Snapshot): number[] {
  return snap.gaps.map((g) => (Number.isFinite(g) ? g / snap.refLap : NaN));
}

function Live({
  prep,
  highlightsMode,
  defaultSpeed,
  onFinish,
  onDone,
}: {
  prep: PreparedRace;
  highlightsMode: boolean;
  defaultSpeed: number;
  onFinish: (extras: RaceExtras) => RaceOutcome | null;
  onDone: (o: RaceOutcome) => void;
}) {
  const world = useWorld()!;
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const eng = prep.engine;
  const dir = prep.director;
  const s = seriesDef(prep.meta.seriesId);
  const prog = useSharedValue(0);
  const seg = useSharedValue<Segment>({ s0: 0, s1: 0, from: gapsOf(eng.snapshots[0]), to: gapsOf(eng.snapshots[0]) });
  const [snapIdx, setSnapIdx] = useState(0);
  const [moment, setMoment] = useState<Moment | null>(null);
  const [resolution, setResolution] = useState<MomentResolution | null>(null);
  const [highlight, setHighlight] = useState<HighlightSpec | null>(null);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(defaultSpeed);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const speedRef = useRef(speed);
  const pausedRef = useRef(false);
  const target = useRef<{ t: number; done: () => void } | null>(null);
  const extras = useRef<RaceExtras>({ highlights: [], effects: [], decisions: 0 });
  const finished = useRef(false);
  const afterHighlight = useRef<(() => void) | null>(null);
  const pendingOutcome = useRef<RaceOutcome | null>(null);
  const playerIdx = eng.playerIndex;
  const rival = useMemo(() => {
    const r = world.active ? topRival(world.active, world) : undefined;
    return r ? eng.entries.findIndex((e) => e.driverId === r.id) : -1;
  }, [world, eng]);

  const animateTo = useCallback(
    (t: number, done: () => void) => {
      target.current = { t, done };
      if (pausedRef.current) return;
      const dist = Math.max(0, t - prog.value);
      const dur = Math.max(16, (dist * STEP_MS) / speedRef.current);
      prog.set(
        withTiming(t, { duration: dur, easing: Easing.linear }, (fin) => {
          if (fin) runOnJS(done)();
        }),
      );
    },
    [prog],
  );

  const finishUp = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    const out = onFinish(extras.current);
    if (!out) return;
    pendingOutcome.current = out;
    const w = useGame.getState().world;
    const hl = w?.active?.highlights.filter((h) => out.highlightIds.includes(h.id)) ?? [];
    const finale = [...hl].reverse().find((h) => ['title', 'finishWin', 'photoFinish', 'podium', 'crash', 'engineFailure'].includes(h.spec.kind));
    if (finale && !['crash', 'engineFailure'].includes(finale.spec.kind)) {
      afterHighlight.current = () => onDone(out);
      setHighlight(finale.spec);
    } else {
      onDone(out);
    }
  }, [onFinish, onDone]);

  const onStepDone = useCallback(
    (snap: Snapshot) => {
      setSnapIdx(snap.step);
      const mine = snap.events.filter((ev) => ev.player);
      if (mine.length) setToast(mine[mine.length - 1].text);
      // Surprise player incidents (not from a decision) get a highlight.
      const crash = snap.events.find((ev) => ev.player && (ev.kind === 'crash' || ev.kind === 'mech') && ev.a === playerIdx);
      if (crash) {
        const spec = specFromMoment(world, prep, {
          kind: crash.kind === 'mech' ? 'engineFailure' : 'crash',
          actors: [playerIdx],
          caption: crash.kind === 'mech' ? "IT'S OVER" : 'CRASH!',
          sub: crash.text,
        });
        extras.current.highlights.push({ kind: spec.kind, actors: [playerIdx], caption: spec.caption, sub: spec.sub, step: snap.step });
        afterHighlight.current = () => tickRef.current();
        setHighlight(spec);
        return;
      }
      tickRef.current();
    },
    [playerIdx, prep, world],
  );

  const simulateAndAnimate = useCallback(() => {
    const prevSnap = eng.snapshots[eng.step];
    const snap = eng.simulateStep();
    seg.set({ s0: prog.get(), s1: snap.step, from: gapsOf(prevSnap), to: gapsOf(snap) });
    animateTo(snap.step, () => onStepDone(snap));
  }, [eng, seg, prog, animateTo, onStepDone]);

  const tick = useCallback(() => {
    if (eng.finished) {
      finishUp();
      return;
    }
    const m = dir.detect();
    if (m) {
      const cur = gapsOf(eng.snapshots[eng.step]);
      seg.set({ s0: prog.get(), s1: eng.step + m.at, from: cur, to: cur });
      animateTo(eng.step + m.at, () => {
        haptic.warning();
        setMoment(m);
      });
      return;
    }
    simulateAndAnimate();
  }, [eng, dir, seg, prog, animateTo, simulateAndAnimate, finishUp]);

  const tickRef = useRef(tick);
  useEffect(() => {
    // Latest-callback ref (breaks the tick -> step -> tick cycle). The React Compiler is off here.
    // eslint-disable-next-line react-hooks/immutability
    tickRef.current = tick;
  }, [tick]);

  useEffect(() => {
    const t = setTimeout(() => tickRef.current(), 500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const setPause = (v: boolean) => {
    pausedRef.current = v;
    setPaused(v);
    if (v) cancelAnimation(prog);
    else if (target.current && !moment && !highlight) animateTo(target.current.t, target.current.done);
  };

  const changeSpeed = (v: number) => {
    speedRef.current = v;
    setSpeed(v);
    if (!pausedRef.current && target.current && !moment && !highlight) {
      cancelAnimation(prog);
      animateTo(target.current.t, target.current.done);
    }
  };

  /** Jump instantly to the next decision (or the end). */
  const skipToMoment = (toEnd = false) => {
    if (moment || highlight) return;
    cancelAnimation(prog);
    let m: Moment | null = null;
    while (!eng.finished) {
      m = dir.detect();
      if (m) {
        if (!toEnd) break;
        const res = dir.resolve(m, dir.autoChoice(m));
        extras.current.decisions++;
        if (res.effects) extras.current.effects.push(res.effects);
        if (res.highlight) extras.current.highlights.push(res.highlight);
        m = null;
      }
      eng.simulateStep();
    }
    const snap = eng.snapshots[eng.step];
    prog.set(eng.step);
    seg.set({ s0: eng.step, s1: eng.step, from: gapsOf(snap), to: gapsOf(snap) });
    setSnapIdx(eng.step);
    if (m) {
      const cur = gapsOf(snap);
      seg.set({ s0: eng.step, s1: eng.step + m.at, from: cur, to: cur });
      const mm = m;
      animateTo(eng.step + m.at, () => {
        haptic.warning();
        setMoment(mm);
      });
    } else if (eng.finished) {
      finishUp();
    }
  };

  const choose = (id: string) => {
    if (!moment) return;
    const res = dir.resolve(moment, id);
    extras.current.decisions++;
    if (res.effects) extras.current.effects.push(res.effects);
    if (res.highlight) extras.current.highlights.push(res.highlight);
    setResolution(res);
    if (res.good === true) haptic.success();
    else if (res.good === false) haptic.error();
  };

  const resume = () => {
    setMoment(null);
    setResolution(null);
    simulateAndAnimate();
  };

  const continueAfterMoment = () => {
    if (resolution?.highlight) {
      const spec = specFromMoment(world, prep, resolution.highlight);
      afterHighlight.current = resume;
      setMoment(null);
      setResolution(null);
      setHighlight(spec);
    } else resume();
  };

  const snap = eng.snapshots[snapIdx] ?? eng.snapshots[0];
  const prev = eng.snapshots[Math.max(0, snapIdx - 1)];
  const pos = playerIdx >= 0 ? snap.order.indexOf(playerIdx) + 1 : 0;
  const lapLabel = prep.meta.round.hours
    ? `HOUR ${Math.max(1, Math.ceil(((prep.meta.round.hours ?? 1) * snap.step) / eng.steps))}/${prep.meta.round.hours}`
    : `LAP ${Math.max(1, snap.lap)}/${prep.meta.round.laps}`;
  const mapH = Math.min(360, height * 0.42);
  const ahead = pos > 1 ? snap.order[pos - 2] : -1;
  const behind = pos > 0 && pos < snap.order.length ? snap.order[pos] : -1;
  const events = eng.events.filter((ev) => ev.step <= snapIdx).slice(-3).reverse();

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Backdrop tint={s.color} />
      <View style={{ paddingTop: insets.top + 4, paddingHorizontal: S.md, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <IconBtn icon="close" size={36} onPress={() => setConfirmLeave(true)} />
        <View style={{ flex: 1 }}>
          <Txt v="h2" numberOfLines={1}>
            {lapLabel}
          </Txt>
          <Txt v="label" color={C.textDim} numberOfLines={1}>
            {prep.meta.round.name}
          </Txt>
        </View>
        {snap.flag === 'sc' ? <Pill label={s.discipline === 'american' ? 'Caution' : 'Safety car'} color={C.gold} /> : <Pill label="Green" color={C.green} />}
        <Icon name={snap.wet >= 0.3 ? 'rain' : snap.wet > 0.1 ? 'cloud' : 'sun'} color={snap.wet >= 0.3 ? C.blue : C.gold} size={22} />
      </View>

      <View style={{ alignItems: 'center', marginTop: 4 }}>
        <TrackBroadcast trackId={prep.meta.track.id} width={width} height={mapH} entries={eng.entries} prog={prog} seg={seg} playerIndex={playerIdx} rivalIndex={rival} pitted={snap.pitted} accent={s.color} />
        {snap.wet >= 0.3 ? <RainOverlay width={width} height={mapH} /> : null}
      </View>

      {playerIdx >= 0 ? (
        <View style={{ flexDirection: 'row', marginHorizontal: S.md, gap: 8 }}>
          <View style={{ backgroundColor: C.red, borderRadius: R.sm, paddingHorizontal: 12, justifyContent: 'center', transform: [{ skewX: '-8deg' }] }}>
            <Txt v="numBig" color="#FFFFFF" style={{ fontSize: 30, lineHeight: 34 }}>
              {snap.status[playerIdx] === 'out' ? 'OUT' : `P${pos}`}
            </Txt>
          </View>
          <View style={{ flex: 1, backgroundColor: C.surface, borderRadius: R.sm, padding: 8, borderWidth: 1, borderColor: C.line, gap: 2 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Txt v="small" color={C.textDim}>
                {ahead >= 0 ? `Ahead ${eng.entries[ahead].code}` : 'Leading'}
              </Txt>
              <Txt v="num" style={{ fontSize: 14 }}>
                {ahead >= 0 && snap.status[playerIdx] === 'run' ? `${(snap.gaps[playerIdx] - snap.gaps[ahead]).toFixed(1)}s` : '—'}
              </Txt>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Txt v="small" color={C.textDim}>
                {behind >= 0 && snap.status[behind] === 'run' ? `Behind ${eng.entries[behind].code}` : 'Behind'}
              </Txt>
              <Txt v="num" style={{ fontSize: 14 }}>
                {behind >= 0 && snap.status[behind] === 'run' && snap.status[playerIdx] === 'run' ? `${(snap.gaps[behind] - snap.gaps[playerIdx]).toFixed(1)}s` : '—'}
              </Txt>
            </View>
          </View>
          <View style={{ backgroundColor: C.surface, borderRadius: R.sm, padding: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.line }}>
            <TyreDot c={snap.tyres[playerIdx]} size={20} />
            <Txt v="small" color={C.textDim} style={{ fontSize: 10.5, marginTop: 2 }}>
              {Math.round(eng.cars[playerIdx].tyreAge)} laps
            </Txt>
          </View>
        </View>
      ) : null}

      <ScrollView style={{ flex: 1, marginTop: 8 }} contentContainerStyle={{ paddingHorizontal: S.md, paddingBottom: 8 }} showsVerticalScrollIndicator={false}>
        <Tower engine={eng} snap={snap} prev={prev} playerIndex={playerIdx} rows={10} />
        <View style={{ marginTop: 8, gap: 4 }}>
          {events.map((ev, k) => (
            <Animated.View key={`${ev.step}-${k}-${ev.text}`} entering={FadeIn}>
              <Txt v="small" color={ev.player ? C.gold : C.textDim} numberOfLines={1}>
                {prep.meta.round.hours ? '' : `L${eng.displayLap(ev.step)} · `}
                {ev.text}
              </Txt>
            </Animated.View>
          ))}
        </View>
      </ScrollView>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: S.md, paddingTop: 8, paddingBottom: insets.bottom + 10, borderTopWidth: 1, borderColor: C.line, backgroundColor: withAlpha(C.bg, 0.9) }}>
        <IconBtn icon={paused ? 'play' : 'pause'} size={44} onPress={() => setPause(!paused)} bg={paused ? C.red : C.surface2} />
        {[1, 2, 4, 12].map((v) => (
          <Press key={v} onPress={() => changeSpeed(v)} feedback="tick">
            <View style={{ paddingHorizontal: 10, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: speed === v ? C.surface3 : C.surface, borderWidth: 1, borderColor: speed === v ? C.lineStrong : C.line }}>
              <Txt v="h3" color={speed === v ? C.text : C.textMute} style={{ fontSize: 14 }}>
                {v === 12 ? 'x12' : `x${v}`}
              </Txt>
            </View>
          </Press>
        ))}
        <View style={{ flex: 1 }} />
        <IconBtn icon="skip" size={40} onPress={() => skipToMoment(false)} />
        <IconBtn icon="ff" size={40} onPress={() => skipToMoment(true)} />
      </View>

      {toast && !moment && !highlight ? (
        <Animated.View entering={FadeInDown} style={{ position: 'absolute', top: insets.top + 56 + mapH - 40, left: S.md, right: S.md, alignItems: 'center' }} pointerEvents="none">
          <View style={{ backgroundColor: withAlpha('#000000', 0.8), borderRadius: R.pill, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: withAlpha(C.gold, 0.5) }}>
            <Txt v="small" color={C.gold} style={{ fontFamily: F.bodySemi }} numberOfLines={1}>
              {toast}
            </Txt>
          </View>
        </Animated.View>
      ) : null}

      {moment ? <MomentSheet key={`${moment.type}${moment.step}`} moment={moment} resolution={resolution} onChoose={choose} onContinue={continueAfterMoment} /> : null}

      {highlight ? (
        <HighlightPlayer
          spec={highlight}
          onDone={() => {
            setHighlight(null);
            const next = afterHighlight.current;
            afterHighlight.current = null;
            next?.();
          }}
        />
      ) : null}

      <Modal visible={confirmLeave} transparent animationType="fade" onRequestClose={() => setConfirmLeave(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(2,4,10,0.85)', justifyContent: 'center', padding: S.lg }}>
          <Card>
            <Txt v="h1">Skip to the result?</Txt>
            <Txt v="body" color={C.textDim} style={{ marginTop: 6 }}>
              The rest of the race will be simulated with your default instincts.
            </Txt>
            <View style={{ flexDirection: 'row', gap: S.sm, marginTop: S.lg }}>
              <Btn label="Keep watching" kind="ghost" small style={{ flex: 1 }} onPress={() => setConfirmLeave(false)} />
              <Btn
                label="Skip"
                small
                style={{ flex: 1 }}
                onPress={() => {
                  setConfirmLeave(false);
                  skipToMoment(true);
                }}
              />
            </View>
          </Card>
        </View>
      </Modal>
    </View>
  );
}

function RainOverlay({ width, height }: { width: number; height: number }) {
  const streaks = useMemo(() => {
    const rng = new Rng(7);
    return Array.from({ length: 34 }, () => ({ x: rng.float(0, width), y: rng.float(0, height), l: rng.float(8, 22) }));
  }, [width, height]);
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, width, height, opacity: 0.35 }}>
      {streaks.map((s, i) => (
        <View key={i} style={{ position: 'absolute', left: s.x, top: s.y, width: 1.2, height: s.l, backgroundColor: '#BFE3FF', transform: [{ rotate: '14deg' }] }} />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------

function Results({ prep, outcome }: { prep: PreparedRace; outcome: RaceOutcome }) {
  const world = useWorld()!;
  const e = prep.engine;
  const cls = e.classification();
  const r = outcome.summary;
  const s = seriesDef(prep.meta.seriesId);
  const points = world.season.series[prep.meta.seriesId]?.results.find((x) => x.round === prep.meta.roundIndex)?.points ?? {};
  const hls = world.active?.highlights.filter((h) => outcome.highlightIds.includes(h.id)) ?? [];
  const [reel, setReel] = useState<number | null>(null);
  return (
    <Screen
      tint={r.pos === 1 ? C.gold : s.color}
      header={<Header title="Race result" sub={prep.meta.round.name} back={false} />}
      footer={<Btn label="Continue" icon="chevron" onPress={() => router.replace('/career')} />}
    >
      <Animated.View entering={ZoomIn.springify().damping(14)} style={{ alignItems: 'center', marginVertical: S.md }}>
        <PosBadge pos={r.pos} dnf={r.pos === 0} size={76} />
        <Txt v="title" center style={{ marginTop: S.md }}>
          {r.headline}
        </Txt>
        <Txt v="small" color={C.textDim} style={{ marginTop: 4 }}>
          Started P{r.grid} · +{r.points} pts · Championship P{outcome.standingsPos}
          {r.fastestLap ? ' · Fastest lap' : ''}
        </Txt>
      </Animated.View>
      {outcome.newMoments.length ? (
        <View style={{ gap: 6 }}>
          {outcome.newMoments.map((m) => (
            <Card key={m.id} accent={C.gold} style={{ padding: 12 }}>
              <Txt v="h3" color={C.gold}>
                {m.title}
              </Txt>
              <Txt v="small" color={C.textDim}>
                {m.text}
              </Txt>
            </Card>
          ))}
        </View>
      ) : null}
      {hls.length ? (
        <>
          <SectionTitle title="Highlights" right={hls.length > 1 ? <PlayAllChip onPress={() => setReel(0)} /> : undefined} />
          <HighlightRows items={hls} meta="sub" onPlay={(i) => setReel(i)} />
        </>
      ) : null}
      <SectionTitle title="Classification" />
      <Card padded={false} style={{ padding: 8 }}>
        {cls.order.map((i, k) => {
          const en = e.entries[i];
          const out = e.cars[i].status === 'out';
          const me = en.isPlayer;
          return (
            <View key={en.driverId} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, paddingHorizontal: 6, borderRadius: 8, backgroundColor: me ? withAlpha(C.red, 0.18) : 'transparent' }}>
              <Txt v="num" style={{ width: 28 }} color={out ? C.red : k < 3 ? C.gold : C.text}>
                {out ? 'DNF' : k + 1}
              </Txt>
              <View style={{ width: 4, height: 18, borderRadius: 2, backgroundColor: en.colors.primary }} />
              <Txt v="bodyStrong" style={{ flex: 1, fontSize: 14 }} numberOfLines={1}>
                {en.name}
              </Txt>
              <Txt v="small" color={C.textDim} style={{ width: 70, textAlign: 'right' }}>
                {out ? (e.cars[i].outReason === 'mech' ? 'Mechanical' : 'Accident') : gapLabel(e, e.snapshots[e.snapshots.length - 1], i, false)}
              </Txt>
              <Txt v="num" style={{ width: 34, textAlign: 'right' }}>
                {points[en.driverId] ? `+${points[en.driverId]}` : ''}
              </Txt>
            </View>
          );
        })}
      </Card>
      {reel !== null ? <HighlightReel specs={hls.map((h) => h.spec)} start={reel} onClose={() => setReel(null)} /> : null}
    </Screen>
  );
}

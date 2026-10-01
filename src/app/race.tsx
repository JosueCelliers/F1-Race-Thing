/**
 * A race weekend: event poster and qualifying call, the starting grid, the
 * live broadcast with decisions and highlights, then the result.
 */
import { Redirect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, View, type LayoutChangeEvent } from 'react-native';
import { cancelAnimation, Easing, runOnJS, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { series as seriesDef } from '../content/series';
import { HighlightPlayer } from '../highlights/HighlightPlayer';
import { BattleBoard, ControlDock, EventStrip, FullTiming, ProgressRail, RaceTopBar, Telemetry } from '../race/Hud';
import { MomentSheet } from '../race/MomentSheet';
import { GridView, PreRace, Results } from '../race/Stages';
import { TrackBroadcast, type Segment } from '../race/TrackBroadcast';
import { finishRace, nextRaceMeta, prepareRace, specFromMoment, type PreparedRace, type RaceExtras, type RaceMeta, type RaceOutcome } from '../sim/career';
import { topRival } from '../sim/events';
import type { Snapshot } from '../sim/race/engine';
import type { Moment, MomentResolution } from '../sim/race/moments';
import { Rng } from '../sim/rng';
import type { HighlightSpec } from '../sim/types';
import { useGame, useWorld } from '../state/store';
import { haptic } from '../ui/haptics';
import { Backdrop, Btn, Screen, SheetModal, Txt } from '../ui/kit';
import { useScreen } from '../ui/screen';
import { C, S, withAlpha } from '../ui/theme';

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
  const { width, height } = useScreen();
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
  const [timing, setTiming] = useState(false);
  const [zone, setZone] = useState<{ w: number; h: number } | null>(null);
  const onZone = (e: LayoutChangeEvent) => {
    const { width: w, height: h } = e.nativeEvent.layout;
    if (!zone || Math.abs(zone.w - w) > 1 || Math.abs(zone.h - h) > 1) setZone({ w, h });
  };
  const [confirmLeave, setConfirmLeave] = useState(false);
  // Android back mid-race asks first instead of silently abandoning the race.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setConfirmLeave(true);
      return true;
    });
    return () => sub.remove();
  }, []);
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
  const hours = prep.meta.round.hours;
  const lapNow = hours ? Math.max(1, Math.ceil((hours * snap.step) / eng.steps)) : Math.max(1, snap.lap);
  const lapTotal = hours ?? prep.meta.round.laps;
  const events = eng.events.filter((ev) => ev.step <= snapIdx);
  const caution = s.discipline === 'american' ? 'Caution' : 'Safety car';
  const trackW = zone ? zone.w : width;
  const trackH = zone ? zone.h : 0;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Backdrop tint={s.color} intensity={0.6} />
      <View style={{ paddingTop: insets.top + 6, paddingBottom: 6 }}>
        <RaceTopBar
          pos={pos}
          out={playerIdx >= 0 && snap.status[playerIdx] === 'out'}
          lapNow={lapNow}
          lapTotal={lapTotal}
          unit={hours ? 'HOUR' : 'LAP'}
          title={`${prep.meta.round.name} · ${s.short}`}
          flag={snap.flag}
          wet={snap.wet}
          cautionLabel={caution}
          onClose={() => setConfirmLeave(true)}
        />
      </View>

      {/* The track is the main element: it takes every pixel the HUD leaves free. */}
      <View onLayout={onZone} style={{ flex: 1, minHeight: 180 }}>
        {trackH > 0 ? (
          <>
            <TrackBroadcast
              trackId={prep.meta.track.id}
              width={trackW}
              height={trackH}
              entries={eng.entries}
              prog={prog}
              seg={seg}
              playerIndex={playerIdx}
              rivalIndex={rival}
              pitted={snap.pitted}
              accent={s.color}
            />
            {snap.wet >= 0.3 ? <RainOverlay width={trackW} height={trackH} /> : null}
          </>
        ) : null}
      </View>
      <ProgressRail value={snap.step / eng.steps} />

      {playerIdx >= 0 ? <Telemetry eng={eng} snap={snap} prev={prev} player={playerIdx} /> : null}
      <BattleBoard eng={eng} snap={snap} prev={prev} player={playerIdx} onFull={() => setTiming(true)} rows={height < 760 ? 4 : 5} />
      <View style={{ borderTopWidth: 1, borderColor: C.line, backgroundColor: withAlpha(C.surface, 0.6) }}>
        <EventStrip events={events} lapOf={hours ? undefined : (st) => eng.displayLap(st)} />
      </View>
      <ControlDock paused={paused} speed={speed} onPause={() => setPause(!paused)} onSpeed={changeSpeed} onSkip={() => skipToMoment(false)} onEnd={() => skipToMoment(true)} bottom={insets.bottom} />

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

      <FullTiming visible={timing} onClose={() => setTiming(false)} eng={eng} snap={snap} prev={prev} player={playerIdx} title={`${hours ? 'Hour' : 'Lap'} ${lapNow}/${lapTotal}`} />

      <SheetModal visible={confirmLeave} onClose={() => setConfirmLeave(false)}>
        <Txt v="h1">Skip to the result?</Txt>
        <Txt v="body" color={C.textDim} style={{ marginTop: 6 }}>
          The rest of the race is simulated with your default instincts.
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
      </SheetModal>
    </View>
  );
}

function RainOverlay({ width, height }: { width: number; height: number }) {
  const streaks = useMemo(() => {
    const rng = new Rng(7);
    return Array.from({ length: 34 }, () => ({ x: rng.float(0, width), y: rng.float(0, height), l: rng.float(8, 22) }));
  }, [width, height]);
  return (
    <View style={{ pointerEvents: 'none', position: 'absolute', top: 0, left: 0, width, height, opacity: 0.35 }}>
      {streaks.map((s, i) => (
        <View key={i} style={{ position: 'absolute', left: s.x, top: s.y, width: 1.2, height: s.l, backgroundColor: '#BFE3FF', transform: [{ rotate: '14deg' }] }} />
      ))}
    </View>
  );
}

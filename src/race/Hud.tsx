/**
 * The live race HUD: position plate and lap counter up top, a telemetry strip
 * (gaps and tyres), the battle around you, the latest race event as a lower
 * third, and the playback dock in the thumb zone. Full timing is one tap away
 * in a bottom sheet.
 */
import React, { useEffect, useRef } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import type { RaceEngine, RaceEvent, Snapshot } from '../sim/race/engine';
import { Icon } from '../ui/Icon';
import { IconBtn, Press, SheetModal, Txt } from '../ui/kit';
import { C, F, R, S, withAlpha } from '../ui/theme';
import { gapLabel, TyreDot } from './Tower';

const SKEW = '-11deg';
const UNSKEW = '11deg';

// ---------------------------------------------------------------------------
// Top bar
// ---------------------------------------------------------------------------

/** Big race position. Flashes green when you gain a place, red when you lose one. */
export function PositionPlate({ pos, out, size = 52 }: { pos: number; out: boolean; size?: number }) {
  const prev = useRef(pos);
  const flash = useSharedValue(0);
  const dir = useSharedValue(0);
  useEffect(() => {
    if (pos !== prev.current && prev.current > 0 && pos > 0) {
      dir.set(pos < prev.current ? 1 : -1);
      flash.set(withSequence(withTiming(1, { duration: 80 }), withTiming(0, { duration: 650 })));
    }
    prev.current = pos;
  }, [pos, flash, dir]);
  const bump = useAnimatedStyle(() => ({ transform: [{ scale: 1 + flash.value * 0.08 }] }));
  const tint = useAnimatedStyle(() => ({ opacity: flash.value, backgroundColor: dir.value > 0 ? C.green : '#FFFFFF' }));
  return (
    <Animated.View style={bump} accessibilityLabel={out ? 'Out of the race' : `Position ${pos}`}>
      <View
        style={{
          height: size,
          minWidth: size * 1.35,
          paddingHorizontal: 10,
          backgroundColor: out ? C.surface3 : C.red,
          borderRadius: R.xs,
          transform: [{ skewX: SKEW }],
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Animated.View style={[{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }, tint]} />
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 1, backgroundColor: withAlpha('#FFFFFF', 0.4) }} />
        <View style={{ transform: [{ skewX: UNSKEW }], flexDirection: 'row', alignItems: 'baseline' }}>
          {out ? (
            <Text style={{ fontFamily: F.display, fontSize: size * 0.5, color: C.textDim }}>OUT</Text>
          ) : (
            <>
              <Text style={{ fontFamily: F.display, fontSize: size * 0.36, lineHeight: size * 0.8, color: withAlpha('#FFFFFF', 0.75) }}>P</Text>
              <Text style={{ fontFamily: F.display, fontSize: size * 0.68, lineHeight: size * 0.8, color: '#FFFFFF', fontVariant: ['tabular-nums'] }}>{pos}</Text>
            </>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

function StatusChip({ label, color, icon }: { label: string; color: string; icon?: 'sun' | 'cloud' | 'rain' }) {
  return (
    <View
      style={{
        height: 26,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 8,
        borderRadius: R.xs,
        backgroundColor: withAlpha(color, 0.14),
        borderWidth: 1,
        borderColor: withAlpha(color, 0.45),
      }}
    >
      {icon ? <Icon name={icon} size={13} color={color} strokeWidth={2.4} /> : <View style={{ width: 7, height: 7, backgroundColor: color, transform: [{ skewX: '-12deg' }] }} />}
      <Txt v="micro" color={color} style={{ letterSpacing: 1 }}>
        {label}
      </Txt>
    </View>
  );
}

export function RaceTopBar({
  pos,
  out,
  lapNow,
  lapTotal,
  unit,
  title,
  flag,
  wet,
  cautionLabel,
  onClose,
}: {
  pos: number;
  out: boolean;
  lapNow: number;
  lapTotal: number;
  unit: 'LAP' | 'HOUR';
  title: string;
  flag: 'green' | 'sc';
  wet: number;
  cautionLabel: string;
  onClose: () => void;
}) {
  const weather =
    wet >= 0.3 ? { label: 'Wet', color: C.blue, icon: 'rain' as const } : wet > 0.1 ? { label: 'Damp', color: C.cyan, icon: 'cloud' as const } : { label: 'Dry', color: C.amber, icon: 'sun' as const };
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: S.md }}>
      <IconBtn icon="close" label="Leave race" onPress={onClose} bg="transparent" size={40} />
      {pos > 0 || out ? <PositionPlate pos={pos} out={out} /> : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
          <Txt v="micro" color={C.textDim}>
            {unit}
          </Txt>
          <Text style={{ fontFamily: F.display, fontSize: 30, lineHeight: 32, color: C.text, fontVariant: ['tabular-nums'] }}>{lapNow}</Text>
          <Text style={{ fontFamily: F.title, fontSize: 16, color: C.textMute, fontVariant: ['tabular-nums'] }}>/{lapTotal}</Text>
        </View>
        <Txt v="micro" color={C.textMute} numberOfLines={1}>
          {title}
        </Txt>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        {flag === 'sc' ? <StatusChip label={cautionLabel} color={C.amber} /> : <StatusChip label="Green" color={C.green} />}
        <StatusChip label={weather.label} color={weather.color} icon={weather.icon} />
      </View>
    </View>
  );
}

/** Thin race-progress rail under the track. */
export function ProgressRail({ value }: { value: number }) {
  return (
    <View style={{ height: 3, backgroundColor: C.surface3 }}>
      <View style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, height: 3, backgroundColor: C.red }} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Telemetry
// ---------------------------------------------------------------------------

function TelCell({ label, value, sub, trend, color = C.text }: { label: string; value: string; sub?: string; trend?: 'closing' | 'opening' | null; color?: string }) {
  return (
    <View style={{ flex: 1, paddingHorizontal: 12, paddingVertical: 7, gap: 1 }}>
      <Txt v="micro" color={C.textMute}>
        {label}
      </Txt>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 5 }}>
        <Text style={{ fontFamily: F.display, fontSize: 22, lineHeight: 25, color, fontVariant: ['tabular-nums'] }} numberOfLines={1}>
          {value}
        </Text>
        {trend ? (
          <Txt v="micro" color={trend === 'closing' ? C.green : C.red} style={{ fontSize: 9 }}>
            {trend === 'closing' ? '▲' : '▼'}
          </Txt>
        ) : null}
      </View>
      {sub ? (
        <Txt v="micro" color={C.textDim} numberOfLines={1} style={{ letterSpacing: 0.8 }}>
          {sub}
        </Txt>
      ) : null}
    </View>
  );
}

export function Telemetry({ eng, snap, prev, player }: { eng: RaceEngine; snap: Snapshot; prev: Snapshot; player: number }) {
  const pos = snap.order.indexOf(player) + 1;
  const running = snap.status[player] === 'run';
  const ahead = pos > 1 ? snap.order[pos - 2] : -1;
  const behind = pos > 0 && pos < snap.order.length ? snap.order[pos] : -1;
  const gapTo = (s: Snapshot, a: number, b: number) => (a >= 0 && b >= 0 && s.status[a] === 'run' && s.status[b] === 'run' ? Math.abs(s.gaps[a] - s.gaps[b]) : NaN);
  const ga = gapTo(snap, player, ahead);
  const gaPrev = gapTo(prev, player, ahead);
  const gb = gapTo(snap, player, behind);
  const gbPrev = gapTo(prev, player, behind);
  const trend = (now: number, before: number, closingIsGood: boolean): 'closing' | 'opening' | null => {
    if (!Number.isFinite(now) || !Number.isFinite(before) || Math.abs(now - before) < 0.05) return null;
    const closing = now < before;
    return closing === closingIsGood ? 'closing' : 'opening';
  };
  const fmt = (g: number) => (Number.isFinite(g) ? (g >= 100 ? `${Math.round(g)}s` : `${g.toFixed(1)}s`) : '—');
  const car = eng.cars[player];
  const tyreName = { S: 'Soft', M: 'Medium', H: 'Hard', I: 'Inter' }[snap.tyres[player]];
  return (
    <View style={{ flexDirection: 'row', backgroundColor: C.surface, borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.line }}>
      <TelCell
        label="Gap ahead"
        value={!running ? '—' : ahead < 0 ? 'Lead' : fmt(ga)}
        sub={ahead >= 0 ? eng.entries[ahead].code : 'Clear air'}
        trend={trend(ga, gaPrev, true)}
        color={ahead < 0 && running ? C.gold : C.text}
      />
      <View style={{ width: 1, backgroundColor: C.line }} />
      <TelCell
        label="Gap behind"
        value={!running || behind < 0 ? '—' : fmt(gb)}
        sub={behind >= 0 ? eng.entries[behind].code : '—'}
        trend={trend(gb, gbPrev, false) === 'closing' ? 'opening' : trend(gb, gbPrev, false) === 'opening' ? 'closing' : null}
      />
      <View style={{ width: 1, backgroundColor: C.line }} />
      <View style={{ flex: 1, paddingHorizontal: 12, paddingVertical: 7, gap: 3 }}>
        <Txt v="micro" color={C.textMute}>
          Tyres
        </Txt>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
          <TyreDot c={snap.tyres[player]} size={22} />
          <View>
            <Txt v="micro" color={C.text} style={{ letterSpacing: 0.8 }}>
              {tyreName}
            </Txt>
            <Txt v="micro" color={C.textDim} style={{ letterSpacing: 0.8 }}>
              {Math.round(car.tyreAge)} laps
            </Txt>
          </View>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Battle board
// ---------------------------------------------------------------------------

function TimingRow({ eng, snap, prev, i, player, interval }: { eng: RaceEngine; snap: Snapshot; prev?: Snapshot; i: number; player: number; interval: boolean }) {
  const e = eng.entries[i];
  const pos = snap.order.indexOf(i) + 1;
  const before = prev ? prev.order.indexOf(i) + 1 : pos;
  const delta = before - pos;
  const me = i === player;
  const out = snap.status[i] === 'out';
  const podium = pos <= 3 && !out;
  return (
    <View style={{ height: 30, flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 10, backgroundColor: me ? withAlpha(C.red, 0.16) : 'transparent', opacity: out ? 0.45 : 1 }}>
      <View style={{ width: 3, alignSelf: 'stretch', backgroundColor: me ? C.red : 'transparent' }} />
      <View
        style={{
          width: 30,
          height: 20,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: me ? C.red : podium ? (pos === 1 ? C.gold : pos === 2 ? C.silver : C.bronze) : C.surface3,
          transform: [{ skewX: SKEW }],
          borderRadius: R.xs,
        }}
      >
        <Text style={{ transform: [{ skewX: UNSKEW }], fontFamily: F.title, fontSize: 14, color: podium && !me ? '#07090E' : '#FFFFFF', fontVariant: ['tabular-nums'] }}>{out ? '–' : pos}</Text>
      </View>
      <View style={{ width: 4, height: 16, backgroundColor: e.colors.primary, transform: [{ skewX: '-14deg' }] }} />
      <Text style={{ fontFamily: F.heading, fontSize: 15, letterSpacing: 1, color: me ? '#FFFFFF' : C.text, width: 44 }}>{e.code}</Text>
      <Txt v="micro" color={delta > 0 ? C.green : delta < 0 ? C.red : 'transparent'} style={{ width: 10, fontSize: 9 }}>
        {delta > 0 ? '▲' : delta < 0 ? '▼' : '·'}
      </Txt>
      <Txt v="small" color={C.textMute} numberOfLines={1} style={{ flex: 1, fontSize: 12 }}>
        {e.isPlayer ? 'You' : e.isTeammate ? 'Teammate' : ''}
      </Txt>
      {snap.pitted[i] ? (
        <Txt v="micro" color={C.amber} style={{ marginRight: 2 }}>
          Pit
        </Txt>
      ) : null}
      <Text style={{ fontFamily: F.heading, fontSize: 14, color: me ? C.text : C.textDim, minWidth: 52, textAlign: 'right', fontVariant: ['tabular-nums'] }}>{gapLabel(eng, snap, i, interval)}</Text>
      <View style={{ width: 18, alignItems: 'flex-end' }}>{!out ? <TyreDot c={snap.tyres[i]} size={14} /> : null}</View>
    </View>
  );
}

/** Leader plus the cars around you. Rows show the interval to the car ahead. */
export function BattleBoard({ eng, snap, prev, player, onFull, rows = 5 }: { eng: RaceEngine; snap: Snapshot; prev?: Snapshot; player: number; onFull: () => void; rows?: number }) {
  const order = snap.order;
  const p = Math.max(0, order.indexOf(player));
  const half = Math.floor(rows / 2);
  const startIdx = Math.max(0, Math.min(order.length - rows, p - half));
  const near = order.slice(startIdx, startIdx + rows);
  const showLeader = startIdx > 0;
  return (
    <View>
      <Press onPress={onFull} feedback="tick" label="Open full timing" testID="full-timing">
        <View style={{ height: 34, flexDirection: 'row', alignItems: 'center', paddingHorizontal: S.md, gap: 8 }}>
          <View style={{ width: 3, height: 11, backgroundColor: C.red, transform: [{ skewX: '-18deg' }] }} />
          <Txt v="label" color={C.text} style={{ flex: 1 }}>
            {player >= 0 ? 'Your battle' : 'Timing'}
          </Txt>
          <Txt v="micro" color={C.textDim}>
            Full timing
          </Txt>
          <Icon name="chevron" size={14} color={C.textDim} strokeWidth={2.6} />
        </View>
      </Press>
      {showLeader ? (
        <>
          <TimingRow eng={eng} snap={snap} prev={prev} i={order[0]} player={player} interval={false} />
          <View style={{ height: 1, marginHorizontal: S.md, marginVertical: 2, backgroundColor: C.line }} />
        </>
      ) : null}
      {near.map((i) => (
        <TimingRow key={eng.entries[i].driverId} eng={eng} snap={snap} prev={prev} i={i} player={player} interval={order.indexOf(i) > 0} />
      ))}
    </View>
  );
}

export function FullTiming({
  visible,
  onClose,
  eng,
  snap,
  prev,
  player,
  title,
}: {
  visible: boolean;
  onClose: () => void;
  eng: RaceEngine;
  snap: Snapshot;
  prev?: Snapshot;
  player: number;
  title: string;
}) {
  return (
    <SheetModal visible={visible} onClose={onClose}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: S.sm }}>
        <Txt v="h1">Timing</Txt>
        <Txt v="micro" color={C.textDim}>
          {title} · gap to leader
        </Txt>
      </View>
      <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false}>
        {snap.order.map((i) => (
          <TimingRow key={eng.entries[i].driverId} eng={eng} snap={snap} prev={prev} i={i} player={player} interval={false} />
        ))}
      </ScrollView>
    </SheetModal>
  );
}

// ---------------------------------------------------------------------------
// Event lower third
// ---------------------------------------------------------------------------

const EVENT_TAG: Partial<Record<RaceEvent['kind'], { label: string; color: string }>> = {
  overtake: { label: 'Move', color: C.cyan },
  crash: { label: 'Crash', color: C.red },
  collision: { label: 'Contact', color: C.red },
  mech: { label: 'Failure', color: C.red },
  pit: { label: 'Pit', color: C.amber },
  sc: { label: 'Caution', color: C.amber },
  scEnd: { label: 'Green', color: C.green },
  rain: { label: 'Rain', color: C.blue },
  dry: { label: 'Drying', color: C.cyan },
  fastest: { label: 'Fastest', color: C.purple },
  mistake: { label: 'Mistake', color: C.orange },
  spin: { label: 'Spin', color: C.orange },
  lead: { label: 'Leader', color: C.gold },
  penalty: { label: 'Penalty', color: C.orange },
  start: { label: 'Start', color: C.green },
  finish: { label: 'Flag', color: C.text },
  info: { label: 'Info', color: C.steel },
};

export function EventStrip({ events, lapOf }: { events: RaceEvent[]; lapOf?: (step: number) => number }) {
  const last = events[events.length - 1];
  if (!last) {
    return (
      <View style={{ height: 40, justifyContent: 'center', paddingHorizontal: S.md }}>
        <Txt v="micro" color={C.textMute}>
          Race control
        </Txt>
      </View>
    );
  }
  const tag = EVENT_TAG[last.kind] ?? EVENT_TAG.info!;
  return (
    <Animated.View key={`${last.step}-${last.text}`} entering={FadeInDown.duration(220)} style={{ height: 40, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: S.md }}>
      <View
        style={{
          minWidth: 64,
          height: 22,
          paddingHorizontal: 7,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: last.player ? C.red : withAlpha(tag.color, 0.16),
          borderWidth: 1,
          borderColor: last.player ? C.red : withAlpha(tag.color, 0.5),
          transform: [{ skewX: SKEW }],
        }}
      >
        <Txt v="micro" color={last.player ? '#FFFFFF' : tag.color} style={{ transform: [{ skewX: UNSKEW }], letterSpacing: 1 }}>
          {tag.label}
        </Txt>
      </View>
      <Txt v="small" color={last.player ? C.text : C.textDim} numberOfLines={1} style={{ flex: 1, fontSize: 13.5, fontFamily: last.player ? F.bodySemi : F.body }}>
        {lapOf ? <Txt v="small" color={C.textMute} style={{ fontSize: 12 }}>{`L${lapOf(last.step)}  `}</Txt> : null}
        {last.text}
      </Txt>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Playback dock
// ---------------------------------------------------------------------------

const SPEEDS = [1, 2, 4, 12];

export function ControlDock({
  paused,
  speed,
  onPause,
  onSpeed,
  onSkip,
  onEnd,
  bottom,
}: {
  paused: boolean;
  speed: number;
  onPause: () => void;
  onSpeed: (v: number) => void;
  onSkip: () => void;
  onEnd: () => void;
  bottom: number;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: S.md,
        paddingTop: S.sm,
        paddingBottom: bottom + S.sm,
        borderTopWidth: 1,
        borderColor: C.line,
        backgroundColor: C.bg,
      }}
    >
      <IconBtn icon={paused ? 'play' : 'pause'} label={paused ? 'Resume' : 'Pause'} size={48} onPress={onPause} bg={paused ? C.red : C.surface2} />
      <View
        style={{ flex: 1, height: 44, flexDirection: 'row', backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: R.xs, transform: [{ skewX: SKEW }], overflow: 'hidden' }}
      >
        {SPEEDS.map((v, k) => {
          const on = speed === v;
          return (
            <Press key={v} onPress={() => onSpeed(v)} feedback="tick" style={{ flex: 1 }} label={`Speed ${v}x`} testID={`speed-${v}`}>
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? C.red : 'transparent', borderLeftWidth: k ? 1 : 0, borderColor: C.line }}>
                <Text style={{ transform: [{ skewX: UNSKEW }], fontFamily: F.title, fontSize: 17, color: on ? '#FFFFFF' : C.textDim, fontVariant: ['tabular-nums'] }}>{`${v}×`}</Text>
              </View>
            </Press>
          );
        })}
      </View>
      <IconBtn icon="skip" label="Skip to next decision" size={48} onPress={onSkip} />
      <IconBtn icon="ff" label="Skip to the finish" size={48} onPress={onEnd} />
    </View>
  );
}

export function LiveBadge() {
  return (
    <Animated.View entering={FadeIn} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.red }} />
      <Txt v="micro" color={C.red}>
        Live
      </Txt>
    </Animated.View>
  );
}

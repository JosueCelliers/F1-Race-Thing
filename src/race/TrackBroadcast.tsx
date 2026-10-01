/**
 * Broadcast-style track map with animated car dots. Car positions are computed
 * on the UI thread from a continuous race progress value and per-car gaps
 * (see RaceEngine snapshots), so animation stays smooth at any speed.
 */
import React, { useMemo } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { TrackMap, useTrackLayout } from '../art/TrackMap';
import type { EngineEntry } from '../sim/race/engine';
import { Txt } from '../ui/kit';
import { C, F, readableOn } from '../ui/theme';

export interface Segment {
  s0: number;
  s1: number;
  from: number[];
  to: number[];
}

interface DotProps {
  i: number;
  entry: EngineEntry;
  prog: SharedValue<number>;
  seg: SharedValue<Segment>;
  samples: number[];
  count: number;
  scale: number;
  tx: number;
  ty: number;
  size: number;
  highlight: 'player' | 'rival' | 'mate' | null;
  pit: boolean;
}

function CarDot({ i, entry, prog, seg, samples, count, scale, tx, ty, size, highlight, pit }: DotProps) {
  const half = size / 2;
  const style = useAnimatedStyle(() => {
    const s = seg.value;
    const p = prog.value;
    const span = s.s1 - s.s0;
    let t = span > 0 ? (p - s.s0) / span : 1;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const from = s.from[i];
    const to = s.to[i];
    let opacity = 1;
    let g: number;
    if (!(from === from)) {
      return { opacity: 0, transform: [{ translateX: -100 }, { translateY: -100 }] };
    }
    if (!(to === to)) {
      g = from;
      opacity = 1 - t;
    } else {
      g = from + (to - from) * t;
    }
    let f = p - g;
    f = f - Math.floor(f);
    const pos = f * count;
    const k = Math.floor(pos) % count;
    const k2 = (k + 1) % count;
    const fr = pos - Math.floor(pos);
    const x = samples[k * 2] + (samples[k2 * 2] - samples[k * 2]) * fr;
    const y = samples[k * 2 + 1] + (samples[k2 * 2 + 1] - samples[k * 2 + 1]) * fr;
    return {
      opacity,
      transform: [{ translateX: x * scale + tx - half }, { translateY: y * scale + ty - half }],
    };
  });
  const bg = entry.colors.primary;
  const ring = highlight === 'player' ? '#FFFFFF' : highlight === 'rival' ? C.amber : entry.colors.secondary;
  return (
    <Animated.View
      style={[
        { pointerEvents: 'none' },
        {
          position: 'absolute',
          left: 0,
          top: 0,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
          borderWidth: highlight === 'player' ? 2.5 : 1.5,
          borderColor: ring,
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: highlight === 'player' ? '0px 0px 0px 3px rgba(255, 45, 85, 0.85)' : '0px 1px 3px rgba(0, 0, 0, 0.5)',
        },
        style,
      ]}
    >
      <Txt v="num" color={readableOn(bg)} style={{ fontFamily: F.display, fontSize: size * 0.5, lineHeight: size * 0.62 }}>
        {entry.number}
      </Txt>
      {highlight === 'player' ? (
        <View style={{ position: 'absolute', top: -18, backgroundColor: C.red, borderRadius: 2, paddingHorizontal: 5, transform: [{ skewX: '-11deg' }] }}>
          <Txt v="label" color="#FFFFFF" style={{ fontSize: 9, lineHeight: 13, letterSpacing: 0.8, transform: [{ skewX: '11deg' }] }}>
            YOU
          </Txt>
        </View>
      ) : pit ? (
        <View style={{ position: 'absolute', top: -13, backgroundColor: C.amber, borderRadius: 2, paddingHorizontal: 3 }}>
          <Txt v="label" color="#0B0F19" style={{ fontSize: 7.5, lineHeight: 10 }}>
            PIT
          </Txt>
        </View>
      ) : null}
    </Animated.View>
  );
}

export function TrackBroadcast({
  trackId,
  width,
  height,
  entries,
  prog,
  seg,
  playerIndex,
  rivalIndex,
  pitted,
  accent,
}: {
  trackId: string;
  width: number;
  height: number;
  entries: EngineEntry[];
  prog: SharedValue<number>;
  seg: SharedValue<Segment>;
  playerIndex: number;
  rivalIndex?: number;
  pitted: boolean[];
  accent?: string;
}) {
  const pad = 26;
  const { geom, tf } = useTrackLayout(trackId, width, height, pad);
  const samples = useMemo(() => Array.from(geom.samples), [geom]);
  const order = useMemo(() => {
    const idx = entries.map((_, i) => i);
    // Player drawn last (on top).
    return idx.sort((a, b) => (a === playerIndex ? 1 : 0) - (b === playerIndex ? 1 : 0));
  }, [entries, playerIndex]);
  const size = entries.length > 24 ? 15 : 17;
  return (
    <View style={{ width, height }}>
      <TrackMap trackId={trackId} width={width} height={height} variant="broadcast" pad={pad} color={accent} />
      {order.map((i) => (
        <CarDot
          key={entries[i].driverId}
          i={i}
          entry={entries[i]}
          prog={prog}
          seg={seg}
          samples={samples}
          count={geom.count}
          scale={tf.scale}
          tx={tf.tx}
          ty={tf.ty}
          size={i === playerIndex ? size + 5 : size}
          highlight={i === playerIndex ? 'player' : i === rivalIndex ? 'rival' : entries[i].isTeammate ? 'mate' : null}
          pit={!!pitted[i]}
        />
      ))}
    </View>
  );
}

import React from 'react';
import { View } from 'react-native';
import type { Compound, RaceEngine, Snapshot } from '../sim/race/engine';
import { Txt } from '../ui/kit';
import { C } from '../ui/theme';

const TYRE_COLORS: Record<Compound, string> = { S: C.red, M: C.amber, H: '#E9E4DA', I: C.green };

export function TyreDot({ c, size = 12 }: { c: Compound; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: Math.max(2, size * 0.14),
        borderColor: TYRE_COLORS[c],
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0B0E14',
      }}
    >
      <Txt v="label" color={TYRE_COLORS[c]} style={{ fontSize: size * 0.42, lineHeight: size * 0.56, letterSpacing: 0 }}>
        {c}
      </Txt>
    </View>
  );
}

export function gapLabel(engine: RaceEngine, snap: Snapshot, i: number, interval: boolean): string {
  if (snap.status[i] === 'out') return 'OUT';
  const pos = snap.order.indexOf(i);
  if (pos === 0) return engine.cfg.round.hours ? `H${Math.max(1, Math.ceil(((engine.cfg.round.hours ?? 1) * snap.step) / engine.steps))}` : 'LEAD';
  const lapT = snap.refLap / engine.lapsPerStep;
  const ahead = snap.order[pos - 1];
  const g = interval && snap.status[ahead] !== 'out' ? snap.gaps[i] - snap.gaps[ahead] : snap.gaps[i];
  if (!interval && g >= lapT) {
    const l = Math.floor(g / lapT);
    return `+${l}L`;
  }
  if (g >= 100) return `+${Math.round(g)}`;
  return `+${g.toFixed(1)}`;
}

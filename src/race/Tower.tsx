import React from 'react';
import { View } from 'react-native';
import type { Compound, RaceEngine, Snapshot } from '../sim/race/engine';
import { Txt } from '../ui/kit';
import { C, F, withAlpha } from '../ui/theme';

const TYRE_COLORS: Record<Compound, string> = { S: '#FF3B5C', M: '#FFC940', H: '#F4F6FB', I: '#24D17E' };

export function TyreDot({ c, size = 12 }: { c: Compound; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 2.2, borderColor: TYRE_COLORS[c], alignItems: 'center', justifyContent: 'center', backgroundColor: '#0B0F19' }}>
      <Txt v="label" color={TYRE_COLORS[c]} style={{ fontSize: size * 0.45, lineHeight: size * 0.6, letterSpacing: 0 }}>
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

export function Tower({ engine, snap, prev, playerIndex, rows = 10 }: { engine: RaceEngine; snap: Snapshot; prev?: Snapshot; playerIndex: number; rows?: number }) {
  const order = snap.order;
  const pPos = order.indexOf(playerIndex);
  let list: number[];
  if (pPos < 0 || pPos < rows) list = order.slice(0, rows);
  else list = [...order.slice(0, rows - 4), -1, ...order.slice(Math.max(0, pPos - 1), pPos + 2)];
  return (
    <View style={{ gap: 1 }}>
      {list.map((i, k) => {
        if (i === -1) return <View key={`sep${k}`} style={{ height: 6 }} />;
        const e = engine.entries[i];
        const pos = order.indexOf(i) + 1;
        const before = prev ? prev.order.indexOf(i) + 1 : pos;
        const delta = before - pos;
        const me = i === playerIndex;
        const out = snap.status[i] === 'out';
        return (
          <View
            key={e.driverId}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              height: 24,
              paddingHorizontal: 6,
              borderRadius: 6,
              backgroundColor: me ? withAlpha(C.red, 0.28) : k % 2 ? withAlpha('#FFFFFF', 0.025) : 'transparent',
              opacity: out ? 0.45 : 1,
            }}
          >
            <Txt v="num" style={{ width: 22, fontSize: 13 }} color={pos <= 3 ? C.gold : C.text}>
              {pos}
            </Txt>
            <View style={{ width: 3, height: 15, backgroundColor: e.colors.primary, borderRadius: 2, marginRight: 6 }} />
            <Txt v="num" style={{ width: 40, fontSize: 13, fontFamily: F.heading }} color={me ? '#FFFFFF' : C.text}>
              {e.code}
            </Txt>
            <Txt v="small" style={{ width: 12, fontSize: 10 }} color={delta > 0 ? C.green : delta < 0 ? C.red : 'transparent'}>
              {delta > 0 ? '▲' : delta < 0 ? '▼' : '·'}
            </Txt>
            <View style={{ flex: 1 }} />
            {snap.pitted[i] ? (
              <Txt v="label" color={C.gold} style={{ fontSize: 9, marginRight: 6 }}>
                PIT
              </Txt>
            ) : null}
            <Txt v="num" style={{ fontSize: 12.5, minWidth: 48, textAlign: 'right' }} color={C.textDim}>
              {gapLabel(engine, snap, i, false)}
            </Txt>
            <View style={{ width: 20, alignItems: 'flex-end' }}>{!out ? <TyreDot c={snap.tyres[i]} size={13} /> : null}</View>
          </View>
        );
      })}
    </View>
  );
}

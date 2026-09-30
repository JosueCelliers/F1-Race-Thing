import React, { useMemo, useState } from 'react';
import { Modal, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import type { Effects, LifeEventOutcome } from '../content/types';
import type { WheelSlice } from '../sim/creation';
import { describeEffects, type EventResolution } from '../sim/events';
import type { LifeEventInstance } from '../sim/types';
import { haptic } from './haptics';
import { Btn, Card, Press, Txt } from './kit';
import { SpinWheel, type SpinRequest } from './SpinWheel';
import { C, R, S, withAlpha } from './theme';

function effectScore(e: Effects): number {
  let s = 0;
  s += e.morale ?? 0;
  s += (e.reputation ?? 0) * 2;
  s += (e.fans ?? 0) / 15;
  s += e.teamRelation ?? 0;
  s += (e.teammateRelation ?? 0) * 0.5;
  s += (e.money ?? 0) / 80;
  s += (e.form ?? 0) * 3;
  s += (e.growth ?? 0) * 4;
  if (e.skills) s += Object.values(e.skills).reduce((a, v) => a + (v ?? 0) * 5, 0);
  s -= (e.injuryRaces ?? 0) * 10;
  return s;
}

export function outcomeSlices(outcomes: LifeEventOutcome[]): WheelSlice[] {
  return outcomes.map((o, i) => {
    const sc = effectScore(o.effects);
    const label = sc > 6 ? '🎉 Great' : sc > 0 ? '👍 Good' : sc > -6 ? '😬 Meh' : '💥 Bad';
    const color = sc > 6 ? '#24D17E' : sc > 0 ? '#9BE15D' : sc > -6 ? '#FFC940' : '#FF3B5C';
    return { id: `o${i}`, label, weight: o.weight, color, value: i };
  });
}

export function EffectChips({ effects }: { effects: Effects }) {
  const list = describeEffects(effects);
  if (!list.length) return null;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {list.map((e, i) => (
        <View key={i} style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: R.pill, backgroundColor: withAlpha(e.good ? C.green : C.red, 0.16) }}>
          <Txt v="small" color={e.good ? C.green : '#FF7A8A'} style={{ fontSize: 12 }}>
            {e.text}
          </Txt>
        </View>
      ))}
    </View>
  );
}

export function LifeEventSheet({ event, onChoose, onClose }: { event: LifeEventInstance; onChoose: (i: number) => EventResolution | undefined; onClose: () => void }) {
  const [res, setRes] = useState<EventResolution | null>(null);
  const [spun, setSpun] = useState(false);
  const [req, setReq] = useState<SpinRequest | null>(null);
  const slices = useMemo(() => (res?.outcomes ? outcomeSlices(res.outcomes) : []), [res]);

  const choose = (i: number) => {
    const r = onChoose(i);
    if (!r) {
      onClose();
      return;
    }
    setRes(r);
    if (r.outcomes && r.outcomeIndex !== undefined) {
      setTimeout(() => setReq({ id: Date.now(), target: r.outcomeIndex! }), 350);
    } else {
      setSpun(true);
      haptic.success();
    }
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => {}}>
      <View style={{ flex: 1, backgroundColor: 'rgba(2,4,10,0.82)', justifyContent: 'center', padding: S.lg }}>
        <Animated.View entering={FadeInDown.springify().damping(16)}>
          <Card style={{ padding: 20 }} accent={C.gold}>
            <Txt v="label" color={C.gold}>
              Life in the paddock
            </Txt>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 }}>
              <Txt v="title" style={{ fontSize: 30 }}>
                {event.title}
              </Txt>
            </View>
            <Txt v="body" color={C.textDim} style={{ marginTop: 8 }}>
              {event.text}
            </Txt>
            {!res ? (
              <View style={{ marginTop: S.lg, gap: S.sm }}>
                {event.options.map((o, i) => (
                  <Press key={i} testID={`event-opt-${i}`} onPress={() => choose(i)}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.surface2, borderRadius: R.md, padding: 14, borderWidth: 1, borderColor: C.lineStrong }}>
                      <Txt v="h1">{o.emoji ?? '•'}</Txt>
                      <View style={{ flex: 1 }}>
                        <Txt v="h3">{o.label}</Txt>
                        {o.hint ? (
                          <Txt v="small" color={C.textDim}>
                            {o.hint}
                          </Txt>
                        ) : null}
                      </View>
                    </View>
                  </Press>
                ))}
              </View>
            ) : (
              <View style={{ marginTop: S.lg, gap: S.md }}>
                {res.outcomes && !spun ? (
                  <View style={{ alignItems: 'center' }}>
                    <Txt v="label" color={C.textDim} style={{ marginBottom: 8 }}>
                      Spin for the outcome
                    </Txt>
                    <SpinWheel
                      slices={slices}
                      size={210}
                      request={req}
                      fast
                      hubLabel="…"
                      onDone={() => {
                        setSpun(true);
                        haptic.success();
                      }}
                    />
                  </View>
                ) : null}
                {spun ? (
                  <Animated.View entering={ZoomIn.springify().damping(14)} style={{ gap: S.md }}>
                    <Txt v="bodyStrong">{res.text}</Txt>
                    <EffectChips effects={res.effects} />
                    <Animated.View entering={FadeIn.delay(250)}>
                      <Btn label="Continue" onPress={onClose} />
                    </Animated.View>
                  </Animated.View>
                ) : null}
              </View>
            )}
          </Card>
        </Animated.View>
      </View>
    </Modal>
  );
}

import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import type { Effects, LifeEventOutcome } from '../content/types';
import type { WheelSlice } from '../sim/creation';
import { describeEffects, type EventResolution } from '../sim/events';
import type { LifeEventInstance } from '../sim/types';
import { haptic } from './haptics';
import { Icon } from './Icon';
import { Btn, Press, SheetModal, Txt } from './kit';
import { SpinWheel, type SpinRequest } from './SpinWheel';
import { C, F, R, S, withAlpha } from './theme';

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
    const label = sc > 6 ? 'Great' : sc > 0 ? 'Good' : sc > -6 ? 'Meh' : 'Bad';
    const color = sc > 6 ? C.green : sc > 0 ? C.cyan : sc > -6 ? C.amber : C.red;
    return { id: `o${i}`, label, weight: o.weight, color, value: i };
  });
}

export function EffectChips({ effects }: { effects: Effects }) {
  const list = describeEffects(effects);
  if (!list.length) return null;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {list.map((e, i) => (
        <View
          key={i}
          style={{
            height: 26,
            justifyContent: 'center',
            paddingHorizontal: 9,
            borderRadius: R.xs,
            backgroundColor: withAlpha(e.good ? C.green : C.red, 0.14),
            borderWidth: 1,
            borderColor: withAlpha(e.good ? C.green : C.red, 0.4),
          }}
        >
          <Txt v="small" color={e.good ? C.green : '#FF7A8A'} style={{ fontSize: 12.5, fontFamily: F.bodySemi }}>
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
    <SheetModal accent={C.gold} dismissable={false}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ backgroundColor: C.gold, paddingHorizontal: 7, paddingVertical: 2, transform: [{ skewX: '-11deg' }] }}>
          <Txt v="micro" color="#07090E" style={{ transform: [{ skewX: '11deg' }] }}>
            Life in the paddock
          </Txt>
        </View>
      </View>
      <Text style={{ fontFamily: F.display, fontSize: 32, lineHeight: 36, color: C.text, textTransform: 'uppercase', marginTop: 8 }}>{event.title}</Text>
      <Txt v="body" color={C.text} style={{ marginTop: 4, fontSize: 16, lineHeight: 22 }}>
        {event.text}
      </Txt>
      {!res ? (
        <View style={{ marginTop: S.lg, gap: S.sm }}>
          {event.options.map((o, i) => (
            <Press key={i} testID={`event-opt-${i}`} onPress={() => choose(i)} label={o.hint ? `${o.label}. ${o.hint}` : o.label}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  minHeight: 64,
                  backgroundColor: C.surface2,
                  borderRadius: R.sm,
                  paddingVertical: 10,
                  paddingRight: 12,
                  borderWidth: 1,
                  borderColor: C.lineStrong,
                  overflow: 'hidden',
                }}
              >
                <View style={{ width: 44, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderColor: C.line, marginVertical: -10 }}>
                  <Text style={{ fontFamily: F.display, fontSize: 22, color: C.gold }}>{String.fromCharCode(65 + i)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: F.title, fontSize: 18, lineHeight: 21, color: C.text, textTransform: 'uppercase' }}>{o.label}</Text>
                  {o.hint ? (
                    <Txt v="small" color={C.textDim} style={{ fontSize: 13 }}>
                      {o.hint}
                    </Txt>
                  ) : null}
                </View>
                <Icon name="chevron" size={16} color={C.textMute} strokeWidth={2.6} />
              </View>
            </Press>
          ))}
        </View>
      ) : (
        <View style={{ marginTop: S.lg, gap: S.md }}>
          {res.outcomes && !spun ? (
            <View style={{ alignItems: 'center' }}>
              <Txt v="micro" color={C.textDim} style={{ marginBottom: 12 }}>
                Fate decides
              </Txt>
              <SpinWheel
                slices={slices}
                size={230}
                request={req}
                fast
                hubLabel="FATE"
                onDone={() => {
                  setSpun(true);
                  haptic.success();
                }}
              />
            </View>
          ) : null}
          {spun ? (
            <Animated.View entering={FadeInDown.duration(260)} style={{ gap: S.md }}>
              <Txt v="bodyStrong" style={{ fontSize: 16, lineHeight: 22 }}>
                {res.text}
              </Txt>
              <EffectChips effects={res.effects} />
              <Animated.View entering={FadeIn.delay(250)}>
                <Btn label="Continue" onPress={onClose} />
              </Animated.View>
            </Animated.View>
          ) : null}
        </View>
      )}
    </SheetModal>
  );
}

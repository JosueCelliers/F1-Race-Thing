import React, { useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, SlideInDown, ZoomIn } from 'react-native-reanimated';
import type { Moment, MomentResolution } from '../sim/race/moments';
import { Btn, Press, Txt } from '../ui/kit';
import { C, F, R, S, withAlpha } from '../ui/theme';

const RISK = [
  { color: C.green, label: 'Low risk' },
  { color: C.gold, label: 'Medium risk' },
  { color: C.red, label: 'High risk' },
];

export function MomentSheet({
  moment,
  resolution,
  onChoose,
  onContinue,
}: {
  moment: Moment;
  resolution: MomentResolution | null;
  onChoose: (id: string) => void;
  onContinue: () => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  return (
    <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, justifyContent: 'flex-end' }}>
      <Animated.View entering={FadeIn.duration(200)} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(2,4,10,0.55)' }} />
      <Animated.View entering={SlideInDown.springify().damping(18)} style={{ backgroundColor: C.surface, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: S.lg, paddingBottom: 34, borderTopWidth: 1, borderColor: C.lineStrong }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ backgroundColor: C.red, borderRadius: 5, paddingHorizontal: 7, paddingVertical: 2, transform: [{ skewX: '-10deg' }] }}>
            <Txt v="label" color="#FFFFFF" style={{ fontSize: 10.5 }}>
              {moment.importance >= 3 ? '⚠ Career moment' : 'Decision'}
            </Txt>
          </View>
          <Txt v="label" color={C.textDim}>
            {moment.title}
          </Txt>
        </View>
        <Txt v="h1" style={{ marginTop: 10, fontFamily: F.title, fontSize: 23, lineHeight: 26 }}>
          {moment.text}
        </Txt>
        {!resolution ? (
          <View style={{ gap: S.sm, marginTop: S.lg }}>
            {moment.options.map((o) => (
              <Press
                key={o.id}
                disabled={!!picked}
                onPress={() => {
                  setPicked(o.id);
                  onChoose(o.id);
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: picked === o.id ? C.surface3 : C.surface2, borderRadius: R.md, paddingVertical: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: C.lineStrong, overflow: 'hidden' }}>
                  <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: RISK[o.risk].color }} />
                  <Txt v="h1">{o.emoji}</Txt>
                  <View style={{ flex: 1 }}>
                    <Txt v="h2" style={{ fontSize: 18 }}>
                      {o.label}
                    </Txt>
                    <Txt v="small" color={C.textDim}>
                      {o.hint}
                    </Txt>
                  </View>
                  <Txt v="label" color={RISK[o.risk].color} style={{ fontSize: 9 }}>
                    {RISK[o.risk].label}
                  </Txt>
                </View>
              </Press>
            ))}
          </View>
        ) : (
          <Animated.View entering={ZoomIn.springify().damping(15)} style={{ marginTop: S.lg, gap: S.md }}>
            <View style={{ backgroundColor: withAlpha(resolution.good === true ? C.green : resolution.good === false ? C.red : C.blue, 0.14), borderRadius: R.md, padding: 14 }}>
              <Txt v="bodyStrong">{resolution.text}</Txt>
            </View>
            <Btn label={resolution.highlight ? 'Watch it' : 'Continue'} icon={resolution.highlight ? 'film' : 'play'} onPress={onContinue} />
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
}

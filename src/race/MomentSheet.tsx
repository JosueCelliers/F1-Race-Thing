/**
 * A race decision arrives from the bottom edge as a broadcast moment: a kicker
 * and headline, the situation in one sentence, then the choices as big cards
 * styled by risk. Going for it looks dangerous; playing it safe looks calm.
 */
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown, SlideInDown, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, Line, Pattern, Rect } from 'react-native-svg';
import type { Moment, MomentOption, MomentResolution } from '../sim/race/moments';
import { haptic } from '../ui/haptics';
import { Btn, Press, Txt } from '../ui/kit';
import { appMaxWidth } from '../ui/screen';
import { C, F, R, S, withAlpha } from '../ui/theme';

const RISK = [
  { label: 'Low risk', color: C.cyan },
  { label: 'Medium risk', color: C.amber },
  { label: 'High risk', color: C.red },
] as const;

export function RiskMeter({ risk, onRed }: { risk: 0 | 1 | 2; onRed?: boolean }) {
  const col = onRed ? '#FFFFFF' : RISK[risk].color;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ flexDirection: 'row', gap: 2 }}>
        {[0, 1, 2].map((k) => (
          <View key={k} style={{ width: 10, height: 6, backgroundColor: k <= risk ? col : withAlpha(onRed ? '#FFFFFF' : C.text, 0.15), transform: [{ skewX: '-20deg' }] }} />
        ))}
      </View>
      <Txt v="micro" color={col}>
        {RISK[risk].label}
      </Txt>
    </View>
  );
}

/** Diagonal hazard texture for high-risk choices. */
function Hazard({ id }: { id: string }) {
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
      <Defs>
        <Pattern id={id} width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)">
          <Line x1="0" y1="0" x2="0" y2="14" stroke="#FFFFFF" strokeOpacity={0.07} strokeWidth={6} />
        </Pattern>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}

export function OptionCard({ o, onPress, state, tall }: { o: MomentOption; onPress: () => void; state: 'open' | 'picked' | 'faded'; tall: boolean }) {
  const high = o.risk === 2;
  const col = RISK[o.risk].color;
  return (
    <Press
      onPress={state === 'open' ? onPress : undefined}
      disabled={state !== 'open'}
      testID={`moment-opt-${o.id}`}
      label={`${o.label}. ${o.hint}. ${RISK[o.risk].label}`}
      style={{ flex: tall ? 1 : undefined }}
    >
      <View
        style={[
          styles.card,
          tall ? { minHeight: 148, justifyContent: 'space-between' } : { minHeight: 76 },
          high ? { backgroundColor: C.redDeep, borderColor: withAlpha('#FFFFFF', 0.25) } : { backgroundColor: o.risk === 1 ? C.surface2 : C.surface, borderColor: withAlpha(col, 0.55) },
          state === 'faded' && { opacity: 0.28 },
          state === 'picked' && { borderColor: '#FFFFFF', borderWidth: 2 },
        ]}
      >
        {high ? (
          <>
            <LinearGradient colors={[C.red, C.redDeep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            <Hazard id={`hz-${o.id}`} />
          </>
        ) : (
          <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: col }} />
        )}
        <RiskMeter risk={o.risk} onRed={high} />
        <View style={{ gap: 3, marginTop: tall ? 0 : 6 }}>
          <Text style={[styles.optLabel, { color: high ? '#FFFFFF' : C.text }]} numberOfLines={2}>
            {o.label}
          </Text>
          <Txt v="small" color={high ? withAlpha('#FFFFFF', 0.82) : C.textDim} numberOfLines={2} style={{ fontSize: 13, lineHeight: 17 }}>
            {o.hint}
          </Txt>
        </View>
      </View>
    </Press>
  );
}

/** Five red lights come on one by one; they go out when you commit. */
function StartLights({ out }: { out: boolean }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, alignSelf: 'flex-start', marginBottom: S.md }}>
      {[0, 1, 2, 3, 4].map((k) => (
        <Light key={k} index={k} out={out} />
      ))}
    </View>
  );
}

function Light({ index, out }: { index: number; out: boolean }) {
  const on = useSharedValue(0);
  useEffect(() => {
    if (out) on.set(withTiming(0, { duration: 90 }));
    else {
      on.set(withDelay(180 + index * 260, withTiming(1, { duration: 70 })));
      const t = setTimeout(() => haptic.tick(), 180 + index * 260);
      return () => clearTimeout(t);
    }
  }, [on, index, out]);
  const st = useAnimatedStyle(() => ({ opacity: 0.18 + on.value * 0.82, transform: [{ scale: 0.92 + on.value * 0.08 }] }));
  return (
    <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: '#1A0A0E', borderWidth: 2, borderColor: '#2A3140', alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[{ width: 20, height: 20, borderRadius: 10, backgroundColor: C.red }, st]} />
    </View>
  );
}

const VERDICT = {
  good: { word: 'It works', color: C.green },
  bad: { word: 'It goes wrong', color: C.red },
  neutral: { word: 'Done', color: C.cyan },
};

export function MomentSheet({ moment, resolution, onChoose, onContinue }: { moment: Moment; resolution: MomentResolution | null; onChoose: (id: string) => void; onContinue: () => void }) {
  const insets = useSafeAreaInsets();
  const [picked, setPicked] = useState<string | null>(null);
  const big = moment.importance >= 3;
  const [kicker, headline] = moment.title.includes(' · ') ? moment.title.split(' · ') : [moment.type === 'start' ? 'Race start' : 'Race control', moment.title];
  const two = moment.options.length === 2;
  const verdict = resolution ? (resolution.good === true ? VERDICT.good : resolution.good === false ? VERDICT.bad : VERDICT.neutral) : null;
  const sweep = useSharedValue(0);
  useEffect(() => {
    sweep.set(withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }));
  }, [sweep]);
  const accentLine = useAnimatedStyle(() => ({ transform: [{ scaleX: sweep.value }] }));

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View entering={FadeIn.duration(180)} style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(3,4,8,0.62)' }]} />
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Animated.View entering={SlideInDown.duration(300).easing(Easing.out(Easing.cubic))} style={{ width: '100%', maxWidth: appMaxWidth, alignSelf: 'center' }}>
          <View style={[styles.sheet, { paddingBottom: insets.bottom + S.lg }]}>
            <Animated.View style={[{ position: 'absolute', left: 0, right: 0, top: 0, height: 3, backgroundColor: big ? C.gold : C.red, transformOrigin: 'left' }, accentLine]} />
            {moment.type === 'start' ? <StartLights out={!!picked} /> : null}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ backgroundColor: big ? C.gold : C.red, paddingHorizontal: 7, paddingVertical: 2, transform: [{ skewX: '-11deg' }] }}>
                <Txt v="micro" color={big ? '#07090E' : '#FFFFFF'} style={{ transform: [{ skewX: '11deg' }] }}>
                  {big ? 'Career moment' : 'Decision'}
                </Txt>
              </View>
              <Txt v="micro" color={C.textDim}>
                {kicker}
              </Txt>
            </View>
            <Text style={styles.headline} numberOfLines={2} adjustsFontSizeToFit>
              {headline}
            </Text>
            <Txt v="body" color={C.text} style={{ fontSize: 16.5, lineHeight: 23, marginTop: 2 }}>
              {moment.text}
            </Txt>

            {!resolution ? (
              <View style={{ flexDirection: two ? 'row' : 'column', gap: S.sm, marginTop: S.lg }}>
                {moment.options.map((o) => (
                  <OptionCard
                    key={o.id}
                    o={o}
                    tall={two}
                    state={!picked ? 'open' : picked === o.id ? 'picked' : 'faded'}
                    onPress={() => {
                      setPicked(o.id);
                      onChoose(o.id);
                    }}
                  />
                ))}
              </View>
            ) : (
              <Animated.View entering={FadeInDown.duration(260)} style={{ marginTop: S.lg, gap: S.md }}>
                <View style={[styles.verdict, { borderColor: withAlpha(verdict!.color, 0.5) }]}>
                  <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: verdict!.color }} />
                  <Text style={[styles.verdictWord, { color: verdict!.color }]}>{verdict!.word}</Text>
                  <Txt v="bodyStrong" style={{ fontSize: 16, lineHeight: 22 }}>
                    {resolution.text}
                  </Txt>
                </View>
                <Btn label={resolution.highlight ? 'Watch it' : 'Continue'} icon={resolution.highlight ? 'film' : 'play'} onPress={onContinue} testID="moment-continue" />
              </Animated.View>
            )}
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: R.xl,
    borderTopRightRadius: R.xl,
    borderTopWidth: 1,
    borderColor: C.lineStrong,
    paddingHorizontal: S.lg,
    paddingTop: S.lg + 2,
    overflow: 'hidden',
  },
  headline: {
    fontFamily: F.display,
    fontSize: 40,
    lineHeight: 44,
    color: C.text,
    textTransform: 'uppercase',
    marginTop: 6,
  },
  card: {
    borderRadius: R.sm,
    borderWidth: 1,
    paddingLeft: 16,
    paddingRight: 12,
    paddingVertical: 12,
    overflow: 'hidden',
  },
  optLabel: {
    fontFamily: F.title,
    fontSize: 21,
    lineHeight: 24,
    textTransform: 'uppercase',
  },
  verdict: {
    backgroundColor: C.surface2,
    borderWidth: 1,
    borderRadius: R.sm,
    paddingLeft: 16,
    paddingRight: 12,
    paddingVertical: 12,
    gap: 4,
    overflow: 'hidden',
  },
  verdictWord: {
    fontFamily: F.display,
    fontSize: 24,
    lineHeight: 27,
    textTransform: 'uppercase',
  },
});

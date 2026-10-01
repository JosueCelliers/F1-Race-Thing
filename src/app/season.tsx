import { Redirect, router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { Trophy } from '../art/Badges';
import { Flag } from '../art/Flag';
import { series as seriesDef } from '../content/series';
import { endSeason, isFarewell } from '../sim/career';
import { overall } from '../sim/drivers';
import { useSession } from '../state/session';
import { useGame, useWorld } from '../state/store';
import { Confetti } from '../ui/Confetti';
import { haptic } from '../ui/haptics';
import { Btn, Header, Screen, SectionTitle, StatBar, Txt } from '../ui/kit';
import { C, F, R, S, withAlpha } from '../ui/theme';

export default function SeasonReview() {
  const world = useWorld();
  const mutate = useGame((s) => s.mutate);
  const review = useSession((s) => s.review);
  const setReview = useSession((s) => s.setReview);
  const ran = useRef(false);
  const a = world?.active;

  useEffect(() => {
    if (!world || !a || ran.current) return;
    if (a.phase === 'seasonEnd') {
      ran.current = true;
      let r;
      mutate((w) => {
        r = endSeason(w);
      });
      if (r) setReview(r);
    }
  }, [world, a, mutate, setReview]);

  useEffect(() => {
    if (review?.season?.champion) haptic.success();
  }, [review]);

  if (!world || !a) return <Redirect href="/" />;
  if (!review) {
    if (a.phase === 'offers') return <Redirect href="/offers" />;
    return <Screen>{null}</Screen>;
  }
  const s = review.season;
  const sd = s ? seriesDef(s.series) : undefined;
  const me = world.drivers[a.driverId];
  const dev = review.dev;
  const champ = !!s?.champion;

  return (
    <Screen
      tint={champ ? C.gold : s?.colors.primary}
      backdrop={{ number: s && !champ ? s.pos : undefined, intensity: 0.9 }}
      header={<Header kicker={sd ? `${sd.name} · season review` : 'Season review'} title={`${s?.year ?? world.year} review`} back={false} />}
      footer={<Btn label={isFarewell(world) ? 'Say goodbye' : review.retireWheel ? 'Decide your future' : 'Contract offers'} onPress={() => router.replace('/offers')} />}
    >
      {s ? (
        <Animated.View entering={ZoomIn.duration(320)} style={{ alignItems: 'center', marginTop: S.sm }}>
          {champ ? (
            <Trophy size={120} />
          ) : (
            <View
              style={{
                height: 92,
                minWidth: 124,
                paddingHorizontal: 16,
                backgroundColor: s.pos <= 3 ? [C.gold, C.silver, C.bronze][s.pos - 1] : C.red,
                borderRadius: R.xs,
                transform: [{ skewX: '-11deg' }],
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ transform: [{ skewX: '11deg' }], fontFamily: F.display, fontSize: 68, lineHeight: 76, color: s.pos <= 3 ? '#07090E' : '#FFFFFF' }}>P{s.pos}</Text>
            </View>
          )}
          <Text style={[styles.head, { color: champ ? C.gold : C.text }]}>{champ ? 'Champion' : 'In the standings'}</Text>
          <Txt v="body" color={C.textDim} center>
            {s.teamName} · {s.points} points
          </Txt>
        </Animated.View>
      ) : (
        <View style={[panel, { padding: 14, marginTop: S.md }]}>
          <Text style={[styles.head, { fontSize: 26, textAlign: 'left', marginTop: 0 }]}>A year out of the car</Text>
          <Txt v="body" color={C.textDim} style={{ marginTop: 6 }}>
            No seat, no races. The phone has to ring this winter.
          </Txt>
        </View>
      )}

      {s ? (
        <Animated.View entering={FadeInDown.delay(200)} style={[panel, { flexDirection: 'row', marginTop: S.lg }]}>
          {[
            ['Wins', s.wins],
            ['Podiums', s.podiums],
            ['Poles', s.poles],
            ['DNFs', s.dnfs],
          ].map(([l, v], i) => (
            <View key={l as string} style={[{ flex: 1, alignItems: 'center', paddingVertical: 10 }, i > 0 && { borderLeftWidth: 1, borderColor: C.line }]}>
              <Text style={{ fontFamily: F.display, fontSize: 28, lineHeight: 30, color: (l === 'Wins' || l === 'Podiums') && v ? C.gold : C.text }}>{v}</Text>
              <Txt v="micro" color={C.textMute}>
                {l}
              </Txt>
            </View>
          ))}
        </Animated.View>
      ) : null}

      {s?.teammateName ? (
        <View style={[panel, { marginTop: S.md, paddingLeft: 15, paddingRight: 12, paddingVertical: 12, borderColor: withAlpha(s.beatTeammate ? C.green : C.red, 0.4) }]}>
          <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: s.beatTeammate ? C.green : C.red }} />
          <Txt v="micro" color={C.textMute}>
            Teammate battle
          </Txt>
          <Text style={{ fontFamily: F.title, fontSize: 19, color: C.text, textTransform: 'uppercase', marginTop: 2 }}>
            {s.beatTeammate ? `You beat ${s.teammateName}` : `${s.teammateName} beat you`}
          </Text>
        </View>
      ) : null}

      {dev ? (
        <>
          <SectionTitle
            title="Development"
            style={{ marginBottom: S.sm }}
            right={
              <Txt v="micro" color={dev.ovrAfter >= dev.ovrBefore ? C.green : C.red}>
                OVR {dev.ovrBefore} → {dev.ovrAfter}
              </Txt>
            }
          />
          <View style={[panel, { padding: 14, gap: 12 }]}>
            {(['pace', 'racecraft', 'consistency', 'wet'] as const).map((k, i) => (
              <StatBar key={k} label={k} value={dev.after[k]} delta={Math.round(dev.after[k] - dev.before[k])} compact delay={200 + i * 100} />
            ))}
            <Txt v="small" color={C.textMute} style={{ fontSize: 12.5 }}>
              Age {review.age} next season · current rating {Math.round(overall(me.skills))}
            </Txt>
          </View>
        </>
      ) : null}

      <SectionTitle title="Champions around the world" style={{ marginBottom: S.sm }} />
      <View style={panel}>
        {review.champions.map((c, i) => {
          const mine = c.driverId === me.id;
          return (
            <View
              key={c.series}
              style={[
                { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 54, paddingRight: 12 },
                i > 0 && { borderTopWidth: 1, borderColor: C.line },
                mine && { backgroundColor: withAlpha(C.gold, 0.08) },
              ]}
            >
              <View style={{ width: 3, alignSelf: 'stretch', backgroundColor: mine ? C.gold : seriesDef(c.series).color }} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Txt v="micro" color={C.textMute}>
                  {seriesDef(c.series).name}
                </Txt>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Flag id={c.nation} width={16} />
                  <Txt v="bodyStrong" numberOfLines={1} color={c.isPlayer ? C.gold : C.text} style={{ flexShrink: 1, fontSize: 14.5 }}>
                    {c.driverName}
                    {mine ? ' (you)' : ''}
                  </Txt>
                </View>
              </View>
              <Txt v="small" color={C.textDim} numberOfLines={1} style={{ maxWidth: '40%', fontSize: 12.5 }}>
                {c.teamName}
              </Txt>
            </View>
          );
        })}
      </View>
      {champ ? <Confetti count={80} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: {
    fontFamily: F.display,
    fontSize: 40,
    lineHeight: 44,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginTop: S.md,
  },
});

const panel = StyleSheet.create({ p: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: R.sm, overflow: 'hidden' } }).p;

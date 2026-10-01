import { Redirect, router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
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
import { Btn, Card, Header, Pill, PosBadge, Screen, SectionTitle, StatBar, Txt } from '../ui/kit';
import { C, S, withAlpha } from '../ui/theme';

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
      header={<Header title={`${s?.year ?? world.year} review`} sub={sd?.name ?? 'A year on the sidelines'} back={false} />}
      footer={<Btn label={isFarewell(world) ? 'Say goodbye' : review.retireWheel ? 'Decide your future' : 'Contract offers'} icon="chevron" onPress={() => router.replace('/offers')} />}
    >
      {s ? (
        <Animated.View entering={ZoomIn.springify().damping(14)} style={{ alignItems: 'center', marginTop: S.md }}>
          {champ ? <Trophy size={110} /> : <PosBadge pos={s.pos} size={84} />}
          <Txt v="display" center style={{ marginTop: S.md, fontSize: champ ? 40 : 34 }} color={champ ? C.gold : C.text}>
            {champ ? 'Champion!' : `P${s.pos} in the standings`}
          </Txt>
          <Txt v="body" color={C.textDim} center>
            {s.teamName} · {s.points} points
          </Txt>
        </Animated.View>
      ) : (
        <Card style={{ marginTop: S.md }}>
          <Txt v="h1">A year out of the car</Txt>
          <Txt v="body" color={C.textDim} style={{ marginTop: 6 }}>
            No seat, no races. The phone has to ring this winter.
          </Txt>
        </Card>
      )}

      {s ? (
        <Animated.View entering={FadeInDown.delay(200)} style={{ flexDirection: 'row', gap: S.sm, marginTop: S.lg }}>
          {[
            ['Wins', s.wins],
            ['Podiums', s.podiums],
            ['Poles', s.poles],
            ['DNFs', s.dnfs],
          ].map(([l, v]) => (
            <View key={l as string} style={{ flex: 1, alignItems: 'center', backgroundColor: C.surface, borderRadius: 14, paddingVertical: 10, borderWidth: 1, borderColor: C.line }}>
              <Txt v="numBig" style={{ fontSize: 28, lineHeight: 30 }}>
                {v}
              </Txt>
              <Txt v="label" color={C.textDim} style={{ fontSize: 10 }}>
                {l}
              </Txt>
            </View>
          ))}
        </Animated.View>
      ) : null}

      {s?.teammateName ? (
        <Card style={{ marginTop: S.md }} accent={s.beatTeammate ? C.green : C.red}>
          <Txt v="label" color={C.textDim}>
            Teammate battle
          </Txt>
          <Txt v="h2" style={{ marginTop: 4 }}>
            {s.beatTeammate ? `You beat ${s.teammateName}` : `${s.teammateName} beat you`}
          </Txt>
        </Card>
      ) : null}

      {dev ? (
        <>
          <SectionTitle title="Development" right={<Pill label={`OVR ${dev.ovrBefore} → ${dev.ovrAfter}`} color={dev.ovrAfter >= dev.ovrBefore ? C.green : C.red} />} />
          <Card>
            <View style={{ gap: 12 }}>
              {(['pace', 'racecraft', 'consistency', 'wet'] as const).map((k) => (
                <StatBar
                  key={k}
                  label={k}
                  value={dev.after[k]}
                  delta={Math.round(dev.after[k] - dev.before[k])}
                  color={k === 'pace' ? C.red : k === 'racecraft' ? C.orange : k === 'consistency' ? C.cyan : C.blue}
                />
              ))}
            </View>
            <Txt v="small" color={C.textMute} style={{ marginTop: 10 }}>
              Age {review.age} next season · current rating {Math.round(overall(me.skills))}
            </Txt>
          </Card>
        </>
      ) : null}

      <SectionTitle title="Champions around the world" />
      <Card padded={false} style={{ padding: 8 }}>
        {review.champions.map((c) => (
          <View
            key={c.series}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8, borderRadius: 10, backgroundColor: c.driverId === me.id ? withAlpha(C.gold, 0.15) : 'transparent' }}
          >
            <View style={{ width: 4, height: 28, borderRadius: 2, backgroundColor: seriesDef(c.series).color }} />
            <View style={{ flex: 1 }}>
              <Txt v="label" color={seriesDef(c.series).color}>
                {seriesDef(c.series).name}
              </Txt>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Flag id={c.nation} width={16} />
                <Txt v="bodyStrong" numberOfLines={1}>
                  {c.driverName}
                  {c.isPlayer ? (c.driverId === me.id ? ' (you!)' : ' ★') : ''}
                </Txt>
              </View>
            </View>
            <Txt v="small" color={C.textDim}>
              {c.teamName}
            </Txt>
          </View>
        ))}
      </Card>
      {champ ? <Confetti count={80} /> : null}
    </Screen>
  );
}

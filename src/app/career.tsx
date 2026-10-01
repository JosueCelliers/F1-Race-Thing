/**
 * The career hub: who you are, what's next, where you stand. The next race is
 * an event poster; the race button lives in the thumb zone.
 */
import { Redirect, router, useIsFocused } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { series as seriesDef, SPECIAL_MAP } from '../content/series';
import { DriverFile } from '../hub/DriverFile';
import { ActionDock, ChampionshipStrip, DockBtn, DriverHud, EventPoster, LastRaceStrip, QuickResultSheet, RivalStrip, TeamPanel } from '../hub/Parts';
import { playRaceInstant } from '../sim/autoplay';
import { answerInvite, dueInvite, forecast, nextRaceMeta, setFarewell, simulateReserveSeason, type RaceOutcome } from '../sim/career';
import { ageOf, ovr, totalStats } from '../sim/drivers';
import { resolveLifeEvent, topRival } from '../sim/events';
import { formatMoney } from '../sim/market';
import { mixSeed, Rng } from '../sim/rng';
import { standings } from '../sim/season';
import type { LifeEventInstance } from '../sim/types';
import { useGame, useWorld } from '../state/store';
import { haptic } from '../ui/haptics';
import { Icon, type IconName } from '../ui/Icon';
import { Backdrop, Btn, IconBtn, SectionTitle, SheetModal, StatCell, Txt } from '../ui/kit';
import { LifeEventSheet } from '../ui/LifeEventSheet';
import { Segmented } from '../ui/Segmented';
import { StandingsTable, TeamStandingsTable } from '../ui/Standings';
import { C, F, R, S, withAlpha } from '../ui/theme';
import { CareerTimeline } from '../ui/Timeline';

type Tab = 'season' | 'standings' | 'career' | 'driver';

export default function CareerHub() {
  const world = useWorld();
  const mutate = useGame((s) => s.mutate);
  const [tab, setTab] = useState<Tab>('season');
  const [quick, setQuick] = useState<RaceOutcome | null>(null);
  // Keeps the life-event sheet open on its outcome after the sim clears `pendingEvent`.
  const [openEvent, setOpenEvent] = useState<LifeEventInstance | null>(null);
  const [confirmFarewell, setConfirmFarewell] = useState(false);
  // Modals render above every screen, so only show ours while the hub is in front.
  const focused = useIsFocused();
  const insets = useSafeAreaInsets();
  const a = world?.active;
  const me = a ? world!.drivers[a.driverId] : undefined;
  const meta = useMemo(() => (world && a ? nextRaceMeta(world) : null), [world, a, a?.raceCount, a?.phase, world?.season.year]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!world || !a || !me) return <Redirect href="/" />;

  const team = me.contract ? world.teams[me.contract.team] : undefined;
  const s = me.contract ? seriesDef(me.contract.series) : undefined;
  const age = ageOf(me, world.year);
  const invite = dueInvite(world);
  const pendingInvite = invite && invite.status === 'pending' ? invite : undefined;
  const fc = meta ? forecast(world, meta) : { wetStart: false, rainLater: false };
  const blocked = !!a.pendingEvent || !!pendingInvite;
  const ss = s ? world.season.series[s.id] : undefined;
  const table = ss ? standings(ss) : [];
  const myPos = table.findIndex((r) => r.driverId === me.id) + 1;
  const myPts = ss?.points[me.id] ?? 0;
  const leaderPts = table[0]?.points ?? 0;
  const rival = topRival(a, world);
  const tot = totalStats(me);

  const quickRace = () => {
    haptic.medium();
    let out: RaceOutcome | null = null;
    mutate((w) => {
      out = playRaceInstant(w, meta ?? undefined);
    });
    setQuick(out);
  };

  // What the thumb zone offers depends on where the season is.
  let dock: React.ReactNode = null;
  let note: string | undefined;
  if (a.phase === 'season' && meta) {
    note = pendingInvite ? 'Answer the invitation first' : a.pendingEvent ? 'Something in the paddock needs you first' : undefined;
    dock = (
      <>
        <Btn label="Watch the race" sub="Live, with your calls" onPress={() => router.push('/race?mode=watch')} disabled={blocked} style={{ flex: 1 }} testID="watch-race" />
        <DockBtn icon="skip" label="Quick result" onPress={quickRace} disabled={blocked} testID="quick-result" />
      </>
    );
  } else if (a.phase === 'season' && !meta && !me.contract) {
    dock = <Btn label="Simulate the season" icon="ff" sub="Watch from the sidelines" onPress={() => mutate((w) => simulateReserveSeason(w))} style={{ flex: 1 }} />;
  } else if (a.phase === 'seasonEnd' || a.phase === 'offers') {
    dock = (
      <Btn label={a.phase === 'offers' ? 'View offers' : 'Season review'} icon="trophy" kind="gold" onPress={() => router.push(a.phase === 'offers' ? '/offers' : '/season')} style={{ flex: 1 }} />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Backdrop tint={team?.colors.primary ?? C.red} intensity={0.7} />
      {/* Status-bar spacer outside the scroll view, so the sticky tabs stop below it. */}
      <View style={{ height: insets.top }} />
      <ScrollView style={{ flex: 1 }} stickyHeaderIndices={[1]} contentContainerStyle={{ paddingBottom: S.xl }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: S.lg, paddingTop: S.sm, gap: S.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: S.sm }}>
            <IconBtn icon="home" label="Home" onPress={() => router.dismissTo('/')} />
            <View style={{ flex: 1 }}>
              <Txt v="micro" color={C.red}>
                {world.year} season
              </Txt>
              <Text style={hubStyles.title} numberOfLines={1} adjustsFontSizeToFit>
                {s ? s.name : 'Without a seat'}
              </Text>
            </View>
            <IconBtn icon="globe" label="World" onPress={() => router.push('/world')} />
          </View>
          <DriverHud me={me} team={team} age={age} rating={ovr(me)} money={`$${formatMoney(a.money)}`} />
        </View>

        <View style={{ backgroundColor: C.bg, paddingHorizontal: S.lg, paddingTop: S.sm }}>
          <Segmented<Tab>
            value={tab}
            onChange={setTab}
            options={[
              { id: 'season', label: 'Season' },
              { id: 'standings', label: 'Standings' },
              { id: 'career', label: 'Career' },
              { id: 'driver', label: 'Driver' },
            ]}
          />
        </View>

        <View style={{ paddingHorizontal: S.lg }}>
          {tab === 'season' ? (
            <Animated.View entering={FadeIn.duration(220)} style={{ gap: S.md, marginTop: S.md }}>
              {a.injury && a.injury.racesOut > 0 ? (
                <Notice color={C.red} icon="heart" title="Injured">
                  {a.injury.desc}: out for {a.injury.racesOut} more race{a.injury.racesOut > 1 ? 's' : ''}. A reserve driver takes your seat.
                </Notice>
              ) : null}

              {pendingInvite ? (
                <Animated.View entering={ZoomIn.duration(240)}>
                  <Notice color={C.gold} icon="crown" title="Special invitation" heading={SPECIAL_MAP[pendingInvite.special ?? '']?.name ?? 'One-off race'}>
                    {world.teams[pendingInvite.team].name} want you for a one-off drive in the {seriesDef(pendingInvite.series).name}. {SPECIAL_MAP[pendingInvite.special ?? '']?.description ?? ''}
                  </Notice>
                  <View style={{ flexDirection: 'row', gap: S.sm, marginTop: S.sm }}>
                    <Btn label="Accept" icon="check" small style={{ flex: 1 }} onPress={() => mutate((w) => answerInvite(w, pendingInvite.id, true))} />
                    <Btn label="Decline" kind="ghost" small style={{ flex: 1 }} onPress={() => mutate((w) => answerInvite(w, pendingInvite.id, false))} />
                  </View>
                </Animated.View>
              ) : null}

              {a.phase === 'season' && meta ? (
                <Animated.View entering={FadeInDown.duration(320)}>
                  <EventPoster meta={meta} forecast={fc} disabled={blocked} onMoments={() => router.push('/race?mode=highlights')} />
                </Animated.View>
              ) : null}

              {a.phase === 'season' && !meta && !me.contract ? (
                <Notice color={C.steel} icon="info" title="On the sidelines" heading="No race seat this year">
                  You’re working the simulator and waiting for a call. The season goes on without you.
                </Notice>
              ) : null}

              {a.phase === 'seasonEnd' || a.phase === 'offers' ? (
                <Notice color={C.gold} icon="trophy" title="Season complete" heading={a.phase === 'offers' ? 'Your future awaits' : `The ${world.year} season is over`}>
                  {a.phase === 'offers' ? 'Teams have made their offers. Time to choose.' : 'See how it went, then talk contracts.'}
                </Notice>
              ) : null}

              {a.lastResult ? <LastRaceStrip r={a.lastResult} /> : null}

              {s && ss ? (
                <View>
                  <SectionTitle title="Championship" style={{ marginTop: S.sm, marginBottom: S.sm }} />
                  <ChampionshipStrip pos={ss.round > 0 ? myPos : 0} pts={myPts} behind={leaderPts - myPts} left={ss.calendar.length - ss.round} />
                  <View style={[hubStyles.table, { marginTop: S.sm }]}>
                    <StandingsTable world={world} seriesId={s.id} highlight={me.id} limit={6} compact />
                  </View>
                </View>
              ) : null}

              {team ? (
                <View>
                  <SectionTitle title="Team" style={{ marginTop: S.sm, marginBottom: S.sm }} />
                  <TeamPanel
                    team={team}
                    until={me.contract?.until}
                    principal={team.principal.name}
                    formerDriver={!!(team.principal.driverId && world.drivers[team.principal.driverId]?.careerId)}
                    teamRel={a.teamRelation}
                    mateRel={a.teammateRelation}
                  />
                </View>
              ) : null}

              {rival ? (
                <RivalStrip
                  rival={rival}
                  colors={rival.contract ? world.teams[rival.contract.team]?.colors : undefined}
                  battles={a.rivals[rival.id]?.battles ?? 0}
                  incidents={a.rivals[rival.id]?.incidents ?? 0}
                />
              ) : null}
            </Animated.View>
          ) : null}

          {tab === 'standings' && s ? (
            <Animated.View entering={FadeIn.duration(220)}>
              <SectionTitle title={`${s.name} drivers`} style={{ marginBottom: S.sm }} />
              <View style={hubStyles.table}>
                <StandingsTable world={world} seriesId={s.id} highlight={me.id} />
              </View>
              <SectionTitle title="Teams" style={{ marginBottom: S.sm }} />
              <View style={hubStyles.table}>
                <TeamStandingsTable world={world} seriesId={s.id} highlight={team?.id} />
              </View>
              <Btn label="Other championships" icon="globe" kind="secondary" small style={{ marginTop: S.lg }} onPress={() => router.push('/world')} />
            </Animated.View>
          ) : null}

          {tab === 'career' ? (
            <Animated.View entering={FadeIn.duration(220)}>
              <View style={[hubStyles.strip, { marginTop: S.md }]}>
                <StatCell label="Starts" value={tot.starts} size={28} />
                <StatCell label="Wins" value={tot.wins} size={28} align="center" color={tot.wins ? C.gold : C.text} />
                <StatCell label="Podiums" value={tot.podiums} size={28} align="center" />
                <StatCell label="Titles" value={tot.titles} size={28} align="right" color={tot.titles ? C.gold : C.text} />
              </View>
              <CareerTimeline seasons={a.seasons} moments={a.moments} current={s ? { year: world.year, series: s.id, teamName: team?.name ?? '', pos: myPos, pts: myPts } : undefined} />
            </Animated.View>
          ) : null}

          {tab === 'driver' ? (
            <Animated.View entering={FadeIn.duration(220)} style={{ gap: S.md }}>
              <DriverFile me={me} team={team} age={age} rating={ovr(me)} seriesName={s?.name} />
              {a.phase === 'season' ? (
                a.flags.farewell === world.year ? (
                  <View>
                    <Notice color={C.gold} icon="flag" title="Farewell season">
                      You’ve told the world {world.year} is your last year. Make it count.
                    </Notice>
                    <Btn label="Change your mind" kind="ghost" small style={{ marginTop: S.sm }} onPress={() => mutate((w) => setFarewell(w, false))} />
                  </View>
                ) : (
                  <Btn label="Announce your farewell season" kind="ghost" small icon="flag" onPress={() => setConfirmFarewell(true)} />
                )
              ) : null}
            </Animated.View>
          ) : null}
        </View>
      </ScrollView>

      {dock ? <ActionDock note={note}>{dock}</ActionDock> : null}

      {(a.pendingEvent || openEvent) && !quick && focused ? (
        <LifeEventSheet
          event={(a.pendingEvent ?? openEvent)!}
          onChoose={(i) => {
            setOpenEvent(a.pendingEvent ?? null);
            let res;
            mutate((w) => {
              res = resolveLifeEvent(w, i, new Rng(mixSeed(w.seed, 'ev', a.raceCount, i)));
            });
            return res;
          }}
          onClose={() => setOpenEvent(null)}
        />
      ) : null}

      {quick ? <QuickResultSheet outcome={quick} onClose={() => setQuick(null)} /> : null}

      <SheetModal visible={confirmFarewell && focused} onClose={() => setConfirmFarewell(false)} accent={C.gold}>
        <Txt v="h1">One last season?</Txt>
        <Txt v="body" color={C.textDim} style={{ marginTop: 6 }}>
          Tell the paddock that {world.year} is your final year. At the end of the season you can retire with a proper send-off, or change your mind.
        </Txt>
        <View style={{ flexDirection: 'row', gap: S.sm, marginTop: S.lg }}>
          <Btn label="Not yet" kind="ghost" small style={{ flex: 1 }} onPress={() => setConfirmFarewell(false)} />
          <Btn
            label="Announce it"
            kind="gold"
            small
            style={{ flex: 1 }}
            onPress={() => {
              setConfirmFarewell(false);
              haptic.success();
              mutate((w) => setFarewell(w, true));
            }}
          />
        </View>
      </SheetModal>
    </View>
  );
}

/** A full-width notice strip: coloured edge, kicker, optional heading, one paragraph. */
function Notice({ color, icon, title, heading, children }: { color: string; icon: IconName; title: string; heading?: string; children: React.ReactNode }) {
  return (
    <View style={[hubStyles.notice, { borderColor: withAlpha(color, 0.4) }]}>
      <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: color }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Icon name={icon} size={14} color={color} strokeWidth={2.4} />
        <Txt v="micro" color={color}>
          {title}
        </Txt>
      </View>
      {heading ? <Text style={hubStyles.noticeHead}>{heading}</Text> : null}
      <Txt v="small" color={C.textDim} style={{ fontSize: 13.5, lineHeight: 19 }}>
        {children}
      </Txt>
    </View>
  );
}

const hubStyles = StyleSheet.create({
  title: {
    fontFamily: F.display,
    fontSize: 28,
    lineHeight: 31,
    color: C.text,
    textTransform: 'uppercase',
  },
  table: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: R.sm,
    overflow: 'hidden',
  },
  strip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: R.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  notice: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderRadius: R.sm,
    paddingLeft: 15,
    paddingRight: 12,
    paddingVertical: 12,
    gap: 4,
    overflow: 'hidden',
  },
  noticeHead: {
    fontFamily: F.title,
    fontSize: 21,
    lineHeight: 24,
    color: C.text,
    textTransform: 'uppercase',
  },
});

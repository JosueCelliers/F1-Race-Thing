import { Redirect, router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Modal, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { Flag } from '../art/Flag';
import { Portrait } from '../art/Portrait';
import { series as seriesDef, SPECIAL_MAP } from '../content/series';
import { family, personality } from '../content/traits';
import { playRaceInstant } from '../sim/autoplay';
import { answerInvite, dueInvite, forecast, nextRaceMeta, simulateReserveSeason, type RaceOutcome } from '../sim/career';
import { ageOf, fullName, ovr, totalStats } from '../sim/drivers';
import { resolveLifeEvent, topRival } from '../sim/events';
import { formatMoney } from '../sim/market';
import { mixSeed, Rng } from '../sim/rng';
import { standings } from '../sim/season';
import { useGame, useWorld } from '../state/store';
import { DriverCard, OvrBadge } from '../ui/DriverCard';
import { haptic } from '../ui/haptics';
import { Icon } from '../ui/Icon';
import { Btn, Card, Header, IconBtn, Pill, PosBadge, Screen, SectionTitle, StatBar, Txt } from '../ui/kit';
import { LifeEventSheet } from '../ui/LifeEventSheet';
import { LastResultCard, NextRaceCard } from '../ui/RaceCards';
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

  return (
    <Screen
      tint={team?.colors.primary}
      header={
        <Header
          title={`${world.year} season`}
          sub={s ? s.name : 'Without a seat'}
          onBack={() => router.replace('/')}
          right={<IconBtn icon="home" onPress={() => router.replace('/')} />}
        />
      }
    >
      {/* Driver strip */}
      <Card style={{ padding: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Portrait looks={me.looks} gender={me.gender} suit={team?.colors} size={64} age={age} />
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Flag id={me.nation} width={20} />
              <Txt v="h2" numberOfLines={1} style={{ flex: 1 }}>
                {fullName(me)}
              </Txt>
            </View>
            <Txt v="small" color={C.textDim} numberOfLines={1}>
              Age {age} · {team ? team.name : 'Free agent'}
            </Txt>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
              <Stat icon="heart" value={`${Math.round(me.morale)}`} label="morale" color={me.morale > 60 ? C.green : me.morale > 35 ? C.gold : C.red} />
              <Stat icon="fans" value={fmtFans(me.fans)} label="fans" color={C.cyan} />
              <Stat icon="money" value={`$${formatMoney(a.money)}`} label="" color={C.gold} />
            </View>
          </View>
          <OvrBadge ovr={ovr(me)} size={0.85} />
        </View>
      </Card>

      <View style={{ marginTop: S.md }}>
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

      {tab === 'season' ? (
        <Animated.View entering={FadeIn.duration(250)}>
          {a.injury && a.injury.racesOut > 0 ? (
            <Card style={{ marginTop: S.md }} accent={C.red}>
              <Txt v="label" color={C.red}>
                Injured
              </Txt>
              <Txt v="body" style={{ marginTop: 4 }}>
                {a.injury.desc}: out for {a.injury.racesOut} more race{a.injury.racesOut > 1 ? 's' : ''}. A reserve driver takes your seat.
              </Txt>
            </Card>
          ) : null}

          {pendingInvite ? (
            <Animated.View entering={ZoomIn.springify().damping(14)}>
              <Card style={{ marginTop: S.md, borderColor: withAlpha(C.purple, 0.6) }} accent={C.purple}>
                <Txt v="label" color={C.purple}>
                  ✉️ Special invitation
                </Txt>
                <Txt v="h1" style={{ marginTop: 4 }}>
                  {SPECIAL_MAP[pendingInvite.special ?? '']?.name ?? 'One-off race'}
                </Txt>
                <Txt v="body" color={C.textDim} style={{ marginTop: 4 }}>
                  {world.teams[pendingInvite.team].name} want you for a one-off drive in the {seriesDef(pendingInvite.series).name}. {SPECIAL_MAP[pendingInvite.special ?? '']?.description ?? ''}
                </Txt>
                <View style={{ flexDirection: 'row', gap: S.sm, marginTop: S.md }}>
                  <Btn label="Accept" icon="check" small style={{ flex: 1 }} onPress={() => mutate((w) => answerInvite(w, pendingInvite.id, true))} />
                  <Btn label="Decline" kind="ghost" small style={{ flex: 1 }} onPress={() => mutate((w) => answerInvite(w, pendingInvite.id, false))} />
                </View>
              </Card>
            </Animated.View>
          ) : null}

          {a.phase === 'season' && meta ? (
            <Animated.View entering={FadeInDown.duration(350)} style={{ marginTop: S.md }}>
              <NextRaceCard
                meta={meta}
                forecast={fc}
                disabled={blocked}
                onWatch={() => router.push('/race?mode=watch')}
                onHighlights={() => router.push('/race?mode=highlights')}
                onQuick={quickRace}
              />
            </Animated.View>
          ) : null}

          {a.phase === 'season' && !meta && !me.contract ? (
            <Card style={{ marginTop: S.md }}>
              <Txt v="h1">No race seat this year</Txt>
              <Txt v="body" color={C.textDim} style={{ marginTop: 6 }}>
                You're on the sidelines, working the simulator and waiting for a call. The season will go on without you.
              </Txt>
              <Btn label="Simulate the season" icon="ff" style={{ marginTop: S.md }} onPress={() => mutate((w) => simulateReserveSeason(w))} />
            </Card>
          ) : null}

          {a.phase === 'seasonEnd' || a.phase === 'offers' ? (
            <Card style={{ marginTop: S.md, borderColor: withAlpha(C.gold, 0.5) }} accent={C.gold}>
              <Txt v="label" color={C.gold}>
                Season complete
              </Txt>
              <Txt v="h1" style={{ marginTop: 4 }}>
                {a.phase === 'offers' ? 'Your future awaits' : `The ${world.year} season is over`}
              </Txt>
              <Btn label={a.phase === 'offers' ? 'View offers' : 'Season review'} icon="trophy" kind="gold" style={{ marginTop: S.md }} onPress={() => router.push(a.phase === 'offers' ? '/offers' : '/season')} />
            </Card>
          ) : null}

          {a.lastResult ? (
            <View style={{ marginTop: S.md }}>
              <LastResultCard r={a.lastResult} />
            </View>
          ) : null}

          {s && ss ? (
            <>
              <SectionTitle title="Championship" right={<Pill label={`P${myPos || '-'} · ${myPts} pts`} color={C.surface3} />} />
              <Card padded={false} style={{ padding: 6 }}>
                <StandingsTable world={world} seriesId={s.id} highlight={me.id} limit={6} compact />
              </Card>
              {myPos > 1 ? (
                <Txt v="small" color={C.textDim} style={{ marginTop: 6, textAlign: 'center' }}>
                  {leaderPts - myPts} points behind the leader · {ss.calendar.length - ss.round} round{ss.calendar.length - ss.round === 1 ? '' : 's'} left
                </Txt>
              ) : null}
            </>
          ) : null}

          {team ? (
            <>
              <SectionTitle title="Team" />
              <Card>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Txt v="h2">{team.name}</Txt>
                  <Pill label={me.contract ? `Contract to ${me.contract.until}` : ''} color={C.surface3} />
                </View>
                <Txt v="small" color={C.textDim} style={{ marginTop: 2 }}>
                  Team principal: {team.principal.name}
                  {team.principal.driverId && world.drivers[team.principal.driverId]?.careerId ? ' (a former driver of yours!)' : ''}
                </Txt>
                <View style={{ gap: 10, marginTop: S.md }}>
                  <StatBar label="Car performance" value={team.perf} color={team.colors.secondary === '#FFFFFF' ? C.red : team.colors.secondary} />
                  <StatBar label="Relationship with team" value={a.teamRelation} color={C.green} />
                  <StatBar label="Relationship with teammate" value={a.teammateRelation} color={C.blue} />
                </View>
              </Card>
            </>
          ) : null}

          {rival ? (
            <>
              <SectionTitle title="Rival" />
              <Card accent={C.red}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Portrait looks={rival.looks} gender={rival.gender} suit={rival.contract ? world.teams[rival.contract.team]?.colors : undefined} size={52} />
                  <View style={{ flex: 1 }}>
                    <Txt v="h3">{fullName(rival)}</Txt>
                    <Txt v="small" color={C.textDim}>
                      {a.rivals[rival.id]?.battles ?? 0} battles · {a.rivals[rival.id]?.incidents ?? 0} incidents
                    </Txt>
                  </View>
                  <Icon name="fire" color={C.red} />
                </View>
              </Card>
            </>
          ) : null}
        </Animated.View>
      ) : null}

      {tab === 'standings' && s ? (
        <Animated.View entering={FadeIn.duration(250)}>
          <SectionTitle title={`${s.name} drivers`} />
          <Card padded={false} style={{ padding: 6 }}>
            <StandingsTable world={world} seriesId={s.id} highlight={me.id} />
          </Card>
          <SectionTitle title="Teams" />
          <Card padded={false} style={{ padding: 6 }}>
            <TeamStandingsTable world={world} seriesId={s.id} highlight={team?.id} />
          </Card>
          <Btn label="Other championships" icon="globe" kind="secondary" small style={{ marginTop: S.lg }} onPress={() => router.push('/world')} />
        </Animated.View>
      ) : null}

      {tab === 'career' ? (
        <Animated.View entering={FadeIn.duration(250)}>
          <View style={{ flexDirection: 'row', gap: S.sm, marginTop: S.md }}>
            <Big label="Starts" value={tot.starts} />
            <Big label="Wins" value={tot.wins} color={C.gold} />
            <Big label="Podiums" value={tot.podiums} />
            <Big label="Titles" value={tot.titles} color={C.gold} />
          </View>
          <CareerTimeline seasons={a.seasons} moments={a.moments} current={s ? { year: world.year, series: s.id, teamName: team?.name ?? '', pos: myPos, pts: myPts } : undefined} />
        </Animated.View>
      ) : null}

      {tab === 'driver' ? (
        <Animated.View entering={FadeIn.duration(250)} style={{ marginTop: S.md, gap: S.md }}>
          <DriverCard
            d={{
              first: me.first,
              last: me.last,
              nation: me.nation,
              gender: me.gender,
              looks: me.looks,
              age,
              ovr: ovr(me),
              skills: me.skills,
              number: me.number,
              teamName: team?.name,
              seriesName: s?.name,
              tags: [
                { label: `${personality(me.personality).emoji} ${personality(me.personality).label}` },
                { label: `${family(me.family).emoji} ${family(me.family).label}` },
                { label: `🔥 Aggression ${Math.round(me.aggression)}` },
                { label: `⭐ Reputation ${Math.round(me.reputation)}` },
              ],
            }}
            colors={team?.colors}
          />
          <Card>
            <Txt v="label" color={C.textDim}>
              By championship
            </Txt>
            {Object.entries(me.stats).map(([sid, st]) => (
              <View key={sid} style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                <Txt v="bodyStrong">{seriesDef(sid).name}</Txt>
                <Txt v="small" color={C.textDim}>
                  {st.starts} starts · {st.wins} W · {st.podiums} P · {st.titles} titles
                </Txt>
              </View>
            ))}
            {Object.keys(me.stats).length === 0 ? (
              <Txt v="small" color={C.textMute} style={{ marginTop: 6 }}>
                No races yet.
              </Txt>
            ) : null}
          </Card>
          <Btn label="Retire at season end" kind="ghost" small icon="flag" onPress={() => router.push('/offers?retire=1')} disabled={a.phase !== 'offers'} />
        </Animated.View>
      ) : null}

      {a.pendingEvent ? (
        <LifeEventSheet
          event={a.pendingEvent}
          onChoose={(i) => {
            let res;
            mutate((w) => {
              res = resolveLifeEvent(w, i, new Rng(mixSeed(w.seed, 'ev', a.raceCount, i)));
            });
            return res;
          }}
          onClose={() => mutate(() => {})}
        />
      ) : null}

      {quick ? <QuickResult outcome={quick} onClose={() => setQuick(null)} /> : null}
    </Screen>
  );
}

function fmtFans(k: number) {
  if (k >= 1000) return `${(k / 1000).toFixed(1)}M`;
  return `${Math.round(k)}k`;
}

function Stat({ icon, value, label, color }: { icon: 'heart' | 'fans' | 'money'; value: string; label: string; color: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Icon name={icon} size={14} color={color} />
      <Txt v="small" color={C.text} style={{ fontFamily: F.bodySemi }}>
        {value}
      </Txt>
      {label ? (
        <Txt v="small" color={C.textMute}>
          {label}
        </Txt>
      ) : null}
    </View>
  );
}

function Big({ label, value, color = C.text }: { label: string; value: number; color?: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: C.surface, borderRadius: R.md, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: C.line }}>
      <Txt v="numBig" color={color} style={{ fontSize: 28, lineHeight: 30 }}>
        {value}
      </Txt>
      <Txt v="label" color={C.textDim} style={{ fontSize: 10 }}>
        {label}
      </Txt>
    </View>
  );
}

function QuickResult({ outcome, onClose }: { outcome: RaceOutcome; onClose: () => void }) {
  const r = outcome.summary;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(2,4,10,0.85)', justifyContent: 'center', padding: S.lg }}>
        <Animated.View entering={ZoomIn.springify().damping(15)}>
          <Card style={{ padding: 20, alignItems: 'center' }}>
            <Txt v="label" color={C.textDim}>
              {r.name}
            </Txt>
            <View style={{ marginVertical: S.md }}>
              <PosBadge pos={r.pos} dnf={r.pos === 0} size={70} />
            </View>
            <Txt v="h1" center>
              {r.headline}
            </Txt>
            <Txt v="small" color={C.textDim} style={{ marginTop: 6 }} center>
              Started P{r.grid} · {r.points} pts · Championship P{outcome.standingsPos}
            </Txt>
            {outcome.newMoments.length ? (
              <View style={{ marginTop: S.md, gap: 6, alignSelf: 'stretch' }}>
                {outcome.newMoments.map((m) => (
                  <View key={m.id} style={{ backgroundColor: withAlpha(C.gold, 0.12), borderRadius: R.sm, padding: 10 }}>
                    <Txt v="h3" color={C.gold}>
                      {m.title}
                    </Txt>
                    <Txt v="small" color={C.textDim}>
                      {m.text}
                    </Txt>
                  </View>
                ))}
              </View>
            ) : null}
            <Btn label="Continue" style={{ marginTop: S.lg, alignSelf: 'stretch' }} onPress={onClose} />
          </Card>
        </Animated.View>
      </View>
    </Modal>
  );
}

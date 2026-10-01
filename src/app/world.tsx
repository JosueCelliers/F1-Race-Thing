import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Flag } from '../art/Flag';
import { SERIES, series as seriesDef, SPECIAL_EVENTS } from '../content/series';
import { fullName } from '../sim/drivers';
import { useWorld } from '../state/store';
import { Icon } from '../ui/Icon';
import { Header, Press, Screen, SectionTitle, Txt } from '../ui/kit';
import { Segmented } from '../ui/Segmented';
import { StandingsTable, TeamStandingsTable } from '../ui/Standings';
import { C, F, R, S, withAlpha } from '../ui/theme';

type Tab = 'champions' | 'standings' | 'legends' | 'news';

/** Championship selector: neutral plates, the selected one lit in its series colour. */
function SeriesChips({ value, onChange }: { value: string; onChange: (s: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: S.md, marginHorizontal: -S.lg }} contentContainerStyle={{ gap: 6, paddingHorizontal: S.lg }}>
      {SERIES.map((s) => {
        const on = value === s.id;
        return (
          <Press key={s.id} onPress={() => onChange(s.id)} feedback="tick" label={s.name}>
            <View
              style={{
                height: 40,
                justifyContent: 'center',
                paddingHorizontal: 14,
                backgroundColor: on ? s.color : C.surface,
                borderWidth: 1,
                borderColor: on ? s.color : C.line,
                borderRadius: R.xs,
                transform: [{ skewX: '-11deg' }],
              }}
            >
              <View style={{ transform: [{ skewX: '11deg' }], flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {!on ? <View style={{ width: 3, height: 12, backgroundColor: s.color }} /> : null}
                <Txt v="label" color={on ? '#FFFFFF' : C.textDim}>
                  {s.short}
                </Txt>
              </View>
            </View>
          </Press>
        );
      })}
    </ScrollView>
  );
}

function Row({ children, first, mine }: { children: React.ReactNode; first: boolean; mine?: boolean }) {
  return (
    <View
      style={[
        { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, paddingRight: 12, paddingVertical: 6 },
        !first && { borderTopWidth: 1, borderColor: C.line },
        mine && { backgroundColor: withAlpha(C.gold, 0.08) },
      ]}
    >
      <View style={{ width: 3, alignSelf: 'stretch', marginVertical: -6, backgroundColor: mine ? C.gold : 'transparent' }} />
      {children}
    </View>
  );
}

export default function WorldScreen() {
  const world = useWorld();
  const [tab, setTab] = useState<Tab>('champions');
  const [sid, setSid] = useState('prime');
  const legends = useMemo(() => {
    if (!world) return [];
    return Object.values(world.drivers)
      .map((d) => {
        const titles = Object.values(d.stats).reduce((a, s) => a + s.titles, 0);
        const wins = Object.values(d.stats).reduce((a, s) => a + s.wins, 0);
        const primeTitles = d.stats.prime?.titles ?? 0;
        const primeWins = d.stats.prime?.wins ?? 0;
        return { d, titles, wins, primeTitles, primeWins, score: primeTitles * 100 + primeWins * 6 + titles * 20 + wins };
      })
      .filter((x) => x.wins > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 25);
  }, [world, world?.year]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!world) {
    return (
      <Screen header={<Header title="The World" />}>
        <Txt v="body" color={C.textDim} style={{ marginTop: S.lg }}>
          The universe is created when you spin your first driver.
        </Txt>
      </Screen>
    );
  }
  const s = seriesDef(sid);
  const champs = world.history.filter((h) => h.series === sid).sort((a, b) => b.year - a.year);
  const playerId = world.active?.driverId;

  return (
    <Screen header={<Header kicker={`Season ${world.year} · ${SERIES.length} championships`} title="The World" />} tint={C.cyan} backdrop={{ intensity: 0.6 }}>
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { id: 'champions', label: 'Champions' },
          { id: 'standings', label: 'Standings' },
          { id: 'legends', label: 'Legends' },
          { id: 'news', label: 'News' },
        ]}
      />
      {tab === 'champions' || tab === 'standings' ? <SeriesChips value={sid} onChange={setSid} /> : null}

      {tab === 'champions' ? (
        <Animated.View entering={FadeIn}>
          <Txt v="small" color={C.textDim} style={{ marginTop: S.md }}>
            {s.description}
          </Txt>
          <View style={[panel, { marginTop: S.md }]}>
            {champs.length === 0 ? (
              <Txt v="small" color={C.textMute} style={{ padding: 12 }}>
                No champions yet.
              </Txt>
            ) : null}
            {champs.map((c, i) => (
              <Row key={`${c.year}`} first={i === 0} mine={c.isPlayer}>
                <Text style={{ width: 46, fontFamily: F.title, fontSize: 16, color: C.textDim }}>{c.year}</Text>
                <Flag id={c.nation} width={20} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Txt v="bodyStrong" numberOfLines={1} color={c.isPlayer ? C.gold : C.text} style={{ fontSize: 14.5 }}>
                    {c.driverName}
                  </Txt>
                  <Txt v="small" color={C.textMute} numberOfLines={1} style={{ fontSize: 12.5 }}>
                    {c.teamName} · {c.wins} win{c.wins === 1 ? '' : 's'} · {c.points} pts
                  </Txt>
                </View>
                {c.isPlayer ? <Icon name="star" size={15} color={C.gold} fill={C.gold} /> : null}
              </Row>
            ))}
          </View>
          <SectionTitle title="Crown jewels" />
          {SPECIAL_EVENTS.map((sp) => {
            const wins = world.specialWinners
              .filter((w) => w.special === sp.id)
              .sort((a, b) => b.year - a.year)
              .slice(0, 5);
            return (
              <View key={sp.id} style={[panel, { marginBottom: S.sm }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 6 }}>
                  <Icon name="trophy" size={16} color={C.gold} strokeWidth={2.2} />
                  <Text style={{ fontFamily: F.title, fontSize: 17, color: C.text, textTransform: 'uppercase', flex: 1 }} numberOfLines={1}>
                    {sp.name}
                  </Text>
                </View>
                {wins.length === 0 ? (
                  <Txt v="small" color={C.textMute} style={{ paddingHorizontal: 12, paddingBottom: 10 }}>
                    Not yet run.
                  </Txt>
                ) : (
                  wins.map((w) => (
                    <View key={`${w.year}-${w.driverId}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, minHeight: 32, borderTopWidth: 1, borderColor: C.line }}>
                      <Text style={{ width: 40, fontFamily: F.heading, fontSize: 13, color: C.textDim }}>{w.year}</Text>
                      <Flag id={w.nation} width={16} />
                      <Txt v="small" color={w.isPlayer ? C.gold : C.text} numberOfLines={1} style={{ flex: 1, fontSize: 13 }}>
                        {w.driverName} · {w.teamName}
                      </Txt>
                    </View>
                  ))
                )}
              </View>
            );
          })}
        </Animated.View>
      ) : null}

      {tab === 'standings' ? (
        <Animated.View entering={FadeIn}>
          <SectionTitle title={`${s.name} ${world.season.year}`} style={{ marginBottom: S.sm }} />
          <View style={panel}>
            <StandingsTable world={world} seriesId={sid} highlight={playerId} />
          </View>
          <SectionTitle title="Teams" style={{ marginBottom: S.sm }} />
          <View style={panel}>
            <TeamStandingsTable world={world} seriesId={sid} />
          </View>
        </Animated.View>
      ) : null}

      {tab === 'legends' ? (
        <Animated.View entering={FadeIn} style={{ marginTop: S.md }}>
          <Txt v="small" color={C.textDim}>
            The greatest drivers in the history of this universe, AI and yours alike. Yours are in gold.
          </Txt>
          <View style={[panel, { marginTop: S.md }]}>
            {legends.map((x, i) => (
              <Row key={x.d.id} first={i === 0} mine={!!x.d.careerId}>
                <Text style={{ width: 26, fontFamily: F.display, fontSize: 19, color: i < 3 ? C.gold : C.textDim, textAlign: 'center' }}>{i + 1}</Text>
                <Flag id={x.d.nation} width={20} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Txt v="bodyStrong" numberOfLines={1} color={x.d.careerId ? C.gold : C.text} style={{ fontSize: 14.5 }}>
                    {fullName(x.d)}
                  </Txt>
                  <Txt v="small" color={C.textMute} style={{ fontSize: 12.5 }}>
                    {legendLine(x.titles, x.primeTitles, x.wins)} · {x.d.status === 'retired' ? 'retired' : 'active'}
                  </Txt>
                </View>
                {x.d.careerId ? <Icon name="star" size={15} color={C.gold} fill={C.gold} /> : null}
              </Row>
            ))}
          </View>
        </Animated.View>
      ) : null}

      {tab === 'news' ? (
        <Animated.View entering={FadeIn} style={{ marginTop: S.md }}>
          {world.news.length === 0 ? (
            <Txt v="small" color={C.textMute}>
              Nothing yet.
            </Txt>
          ) : null}
          {world.news.length ? (
            <View style={panel}>
              {world.news.map((n, i) => (
                <Row key={n.id} first={i === 0} mine={n.important}>
                  <Text style={{ width: 42, fontFamily: F.title, fontSize: 15, color: C.textDim }}>{n.year}</Text>
                  <Txt v="small" color={n.important ? C.text : C.textDim} style={{ flex: 1, fontSize: 13.5 }}>
                    {n.text}
                  </Txt>
                </Row>
              ))}
            </View>
          ) : null}
        </Animated.View>
      ) : null}
    </Screen>
  );
}

function legendLine(titles: number, prime: number, wins: number): string {
  const parts: string[] = [];
  if (titles) parts.push(`${titles} title${titles === 1 ? '' : 's'}${prime ? (prime === titles ? ' (all Prime)' : ` (${prime} Prime)`) : ''}`);
  parts.push(`${wins} win${wins === 1 ? '' : 's'}`);
  return parts.join(' · ');
}

const panel = StyleSheet.create({ p: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: R.sm, overflow: 'hidden' } }).p;

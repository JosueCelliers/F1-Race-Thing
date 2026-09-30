import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Flag } from '../art/Flag';
import { SERIES, series as seriesDef, SPECIAL_EVENTS } from '../content/series';
import { fullName } from '../sim/drivers';
import { useWorld } from '../state/store';
import { Card, Header, Press, Screen, SectionTitle, Txt } from '../ui/kit';
import { Segmented } from '../ui/Segmented';
import { StandingsTable, TeamStandingsTable } from '../ui/Standings';
import { C, R, S, withAlpha } from '../ui/theme';

type Tab = 'champions' | 'standings' | 'legends' | 'news';

function SeriesChips({ value, onChange }: { value: string; onChange: (s: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: S.md }} contentContainerStyle={{ gap: 6 }}>
      {SERIES.map((s) => (
        <Press key={s.id} onPress={() => onChange(s.id)} feedback="tick">
          <View style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: R.pill, backgroundColor: value === s.id ? s.color : C.surface, borderWidth: 1, borderColor: value === s.id ? s.color : C.line }}>
            <Txt v="label" color={value === s.id ? '#FFFFFF' : C.textDim}>
              {s.short}
            </Txt>
          </View>
        </Press>
      ))}
    </ScrollView>
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
    <Screen header={<Header title="The World" sub={`Season ${world.year}`} />}>
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
          <Card padded={false} style={{ marginTop: S.md, padding: 8 }}>
            {champs.length === 0 ? (
              <Txt v="small" color={C.textMute} style={{ padding: 8 }}>
                No champions yet.
              </Txt>
            ) : null}
            {champs.map((c) => (
              <View key={`${c.year}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8, borderRadius: 10, backgroundColor: c.isPlayer ? withAlpha(C.gold, 0.14) : 'transparent' }}>
                <Txt v="num" color={C.textDim} style={{ width: 44 }}>
                  {c.year}
                </Txt>
                <Flag id={c.nation} width={20} />
                <View style={{ flex: 1 }}>
                  <Txt v="bodyStrong" numberOfLines={1}>
                    {c.driverName}
                    {c.isPlayer ? ' ★' : ''}
                  </Txt>
                  <Txt v="small" color={C.textMute} numberOfLines={1}>
                    {c.teamName} · {c.wins} wins · {c.points} pts
                  </Txt>
                </View>
              </View>
            ))}
          </Card>
          <SectionTitle title="Crown jewels" />
          {SPECIAL_EVENTS.map((sp) => {
            const wins = world.specialWinners.filter((w) => w.special === sp.id).sort((a, b) => b.year - a.year).slice(0, 5);
            return (
              <Card key={sp.id} style={{ marginBottom: S.sm }}>
                <Txt v="h3">
                  {sp.emoji} {sp.name}
                </Txt>
                {wins.length === 0 ? (
                  <Txt v="small" color={C.textMute}>
                    Not yet run.
                  </Txt>
                ) : (
                  wins.map((w) => (
                    <View key={`${w.year}-${w.driverId}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                      <Txt v="small" color={C.textDim} style={{ width: 40 }}>
                        {w.year}
                      </Txt>
                      <Flag id={w.nation} width={16} />
                      <Txt v="small" color={w.isPlayer ? C.gold : C.text} numberOfLines={1} style={{ flex: 1 }}>
                        {w.driverName}
                        {w.isPlayer ? ' ★' : ''} · {w.teamName}
                      </Txt>
                    </View>
                  ))
                )}
              </Card>
            );
          })}
        </Animated.View>
      ) : null}

      {tab === 'standings' ? (
        <Animated.View entering={FadeIn}>
          <SectionTitle title={`${s.name} ${world.season.year}`} />
          <Card padded={false} style={{ padding: 6 }}>
            <StandingsTable world={world} seriesId={sid} highlight={playerId} />
          </Card>
          <SectionTitle title="Teams" />
          <Card padded={false} style={{ padding: 6 }}>
            <TeamStandingsTable world={world} seriesId={sid} />
          </Card>
        </Animated.View>
      ) : null}

      {tab === 'legends' ? (
        <Animated.View entering={FadeIn} style={{ marginTop: S.md }}>
          <Txt v="small" color={C.textDim}>
            The greatest drivers in the history of this universe — AI and yours alike (★).
          </Txt>
          <Card padded={false} style={{ marginTop: S.md, padding: 8 }}>
            {legends.map((x, i) => (
              <View key={x.d.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8, borderRadius: 10, backgroundColor: x.d.careerId ? withAlpha(C.gold, 0.12) : 'transparent' }}>
                <Txt v="num" style={{ width: 24 }} color={i < 3 ? C.gold : C.textDim}>
                  {i + 1}
                </Txt>
                <Flag id={x.d.nation} width={20} />
                <View style={{ flex: 1 }}>
                  <Txt v="bodyStrong" numberOfLines={1}>
                    {fullName(x.d)}
                    {x.d.careerId ? ' ★' : ''}
                  </Txt>
                  <Txt v="small" color={C.textMute}>
                    {x.titles} titles ({x.primeTitles} Prime) · {x.wins} wins · {x.d.status === 'retired' ? 'retired' : 'active'}
                  </Txt>
                </View>
              </View>
            ))}
          </Card>
        </Animated.View>
      ) : null}

      {tab === 'news' ? (
        <Animated.View entering={FadeIn} style={{ marginTop: S.md, gap: 6 }}>
          {world.news.length === 0 ? (
            <Txt v="small" color={C.textMute}>
              Nothing yet.
            </Txt>
          ) : null}
          {world.news.map((n) => (
            <View key={n.id} style={{ flexDirection: 'row', gap: 10, backgroundColor: C.surface, borderRadius: R.md, padding: 12, borderWidth: 1, borderColor: n.important ? withAlpha(C.gold, 0.4) : C.line }}>
              <Txt v="num" color={C.textDim} style={{ width: 40, fontSize: 14 }}>
                {n.year}
              </Txt>
              <Txt v="small" color={n.important ? C.text : C.textDim} style={{ flex: 1 }}>
                {n.text}
              </Txt>
            </View>
          ))}
        </Animated.View>
      ) : null}
    </Screen>
  );
}

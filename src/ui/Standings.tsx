import React from 'react';
import { Text, View } from 'react-native';
import { Flag } from '../art/Flag';
import { standings, teamStandings } from '../sim/season';
import type { World } from '../sim/types';
import { PosBadge, Txt } from './kit';
import { C, F, withAlpha } from './theme';

/** Championship table in timing-screen style: position plate, team stripe, flag, name, points. */
export function StandingsTable({ world, seriesId, highlight, limit, compact }: { world: World; seriesId: string; highlight?: string; limit?: number; compact?: boolean }) {
  const ss = world.season.series[seriesId];
  if (!ss) return null;
  // Before the first round there is no order yet: show the entry list, fastest teams first.
  const preSeason = ss.round === 0;
  const table = standings(ss).filter((r) => r.races > 0 || preSeason);
  const all = preSeason ? [...table].sort((x, y) => (world.teams[y.teamId]?.perf ?? 0) - (world.teams[x.teamId]?.perf ?? 0)) : table;
  let rows = all;
  const leader = rows[0]?.points ?? 0;
  if (limit && rows.length > limit) {
    const hi = rows.findIndex((r) => r.driverId === highlight);
    const top = rows.slice(0, limit);
    if (hi >= limit) top[limit - 1] = rows[hi];
    rows = top;
  }
  return (
    <View>
      {rows.map((r, k) => {
        const d = world.drivers[r.driverId];
        const team = world.teams[r.teamId];
        const pos = all.indexOf(r) + 1;
        const me = r.driverId === highlight;
        if (!d) return null;
        const gapRow = limit && k === rows.length - 1 && pos > rows.length;
        return (
          <View key={r.driverId}>
            {gapRow ? <View style={{ height: 1, marginHorizontal: 12, marginVertical: 2, backgroundColor: C.line }} /> : null}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                height: compact ? 38 : 48,
                paddingRight: 12,
                backgroundColor: me ? withAlpha(C.red, 0.14) : k % 2 ? withAlpha('#FFFFFF', 0.02) : 'transparent',
              }}
            >
              <View style={{ width: 3, alignSelf: 'stretch', backgroundColor: me ? C.red : 'transparent' }} />
              {preSeason ? (
                <View style={{ width: 26, alignItems: 'center' }}>
                  <Txt v="micro" color={C.textMute}>
                    #{d.number}
                  </Txt>
                </View>
              ) : (
                <PosBadge pos={pos} size={28} player={me} />
              )}
              <View style={{ width: 4, height: 18, backgroundColor: team?.colors.primary ?? C.textMute, transform: [{ skewX: '-14deg' }] }} />
              <Flag id={d.nation} width={18} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontFamily: F.heading, fontSize: 15, letterSpacing: 0.3, color: me ? '#FFFFFF' : C.text }} numberOfLines={1}>
                  {d.first.charAt(0)}. {d.last}
                  {me ? <Text style={{ color: C.textDim, fontFamily: F.body }}>{'  you'}</Text> : null}
                </Text>
                {!compact ? (
                  <Txt v="small" color={C.textMute} numberOfLines={1} style={{ fontSize: 12 }}>
                    {team?.name ?? ''}
                    {r.wins ? ` · ${r.wins} win${r.wins > 1 ? 's' : ''}` : ''}
                  </Txt>
                ) : null}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                {preSeason ? null : <Text style={{ fontFamily: F.title, fontSize: 17, color: C.text, fontVariant: ['tabular-nums'] }}>{r.points}</Text>}
                {!compact && pos > 1 && !preSeason ? (
                  <Txt v="micro" color={C.textMute}>
                    -{leader - r.points}
                  </Txt>
                ) : null}
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

export function TeamStandingsTable({ world, seriesId, highlight }: { world: World; seriesId: string; highlight?: string }) {
  const ss = world.season.series[seriesId];
  if (!ss) return null;
  const rows = teamStandings(ss);
  const teams = Object.values(world.teams).filter((t) => t.series === seriesId);
  for (const t of teams) if (!rows.find((r) => r.teamId === t.id)) rows.push({ teamId: t.id, points: 0 });
  return (
    <View>
      {rows.map((r, i) => {
        const t = world.teams[r.teamId];
        const me = r.teamId === highlight;
        return (
          <View
            key={r.teamId}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              height: 42,
              paddingRight: 12,
              backgroundColor: me ? withAlpha(C.red, 0.14) : i % 2 ? withAlpha('#FFFFFF', 0.02) : 'transparent',
            }}
          >
            <View style={{ width: 3, alignSelf: 'stretch', backgroundColor: me ? C.red : 'transparent' }} />
            <PosBadge pos={i + 1} size={28} player={me} />
            <View style={{ width: 14, height: 18, overflow: 'hidden', transform: [{ skewX: '-14deg' }] }}>
              <View style={{ flex: 3, backgroundColor: t.colors.primary }} />
              <View style={{ flex: 1, backgroundColor: t.colors.secondary }} />
            </View>
            <Text style={{ flex: 1, fontFamily: F.heading, fontSize: 15, color: me ? '#FFFFFF' : C.text }} numberOfLines={1}>
              {t.name}
            </Text>
            <Text style={{ fontFamily: F.title, fontSize: 17, color: C.text, fontVariant: ['tabular-nums'] }}>{r.points}</Text>
          </View>
        );
      })}
    </View>
  );
}

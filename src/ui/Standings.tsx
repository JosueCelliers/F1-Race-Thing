import React from 'react';
import { View } from 'react-native';
import { Flag } from '../art/Flag';
import { standings, teamStandings } from '../sim/season';
import type { World } from '../sim/types';
import { PosBadge, Txt } from './kit';
import { C, withAlpha } from './theme';

export function StandingsTable({ world, seriesId, highlight, limit, compact }: { world: World; seriesId: string; highlight?: string; limit?: number; compact?: boolean }) {
  const ss = world.season.series[seriesId];
  if (!ss) return null;
  const all = standings(ss).filter((r) => r.races > 0 || ss.round === 0);
  let rows = all;
  const leader = rows[0]?.points ?? 0;
  if (limit && rows.length > limit) {
    const hi = rows.findIndex((r) => r.driverId === highlight);
    const top = rows.slice(0, limit);
    if (hi >= limit) top[limit - 1] = rows[hi];
    rows = top;
  }
  return (
    <View style={{ gap: 2 }}>
      {rows.map((r) => {
        const d = world.drivers[r.driverId];
        const team = world.teams[r.teamId];
        const pos = all.indexOf(r) + 1;
        const me = r.driverId === highlight;
        if (!d) return null;
        return (
          <View
            key={r.driverId}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              paddingVertical: compact ? 6 : 8,
              paddingHorizontal: 10,
              borderRadius: 10,
              backgroundColor: me ? withAlpha(C.red, 0.18) : 'transparent',
              borderWidth: me ? 1 : 0,
              borderColor: withAlpha(C.red, 0.5),
            }}
          >
            <PosBadge pos={pos} size={26} />
            <View style={{ width: 3, height: 22, borderRadius: 2, backgroundColor: team?.colors.primary ?? C.textMute }} />
            <Flag id={d.nation} width={20} />
            <View style={{ flex: 1 }}>
              <Txt v="bodyStrong" numberOfLines={1} style={{ fontSize: 14 }}>
                {d.first.charAt(0)}. {d.last}
                {me ? '  (you)' : ''}
              </Txt>
              {!compact ? (
                <Txt v="small" color={C.textMute} numberOfLines={1}>
                  {team?.name ?? ''}
                  {r.wins ? ` · ${r.wins} win${r.wins > 1 ? 's' : ''}` : ''}
                </Txt>
              ) : null}
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Txt v="num">{r.points}</Txt>
              {!compact && pos > 1 ? (
                <Txt v="small" color={C.textMute}>
                  -{leader - r.points}
                </Txt>
              ) : null}
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
    <View style={{ gap: 2 }}>
      {rows.map((r, i) => {
        const t = world.teams[r.teamId];
        const me = r.teamId === highlight;
        return (
          <View
            key={r.teamId}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7, paddingHorizontal: 10, borderRadius: 10, backgroundColor: me ? withAlpha(C.red, 0.15) : 'transparent' }}
          >
            <PosBadge pos={i + 1} size={26} />
            <View style={{ width: 16, height: 16, borderRadius: 4, backgroundColor: t.colors.primary, borderWidth: 2, borderColor: t.colors.secondary }} />
            <Txt v="bodyStrong" style={{ flex: 1, fontSize: 14 }} numberOfLines={1}>
              {t.name}
            </Txt>
            <Txt v="num">{r.points}</Txt>
          </View>
        );
      })}
    </View>
  );
}

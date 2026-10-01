import React from 'react';
import { Text, View } from 'react-native';
import { series as seriesDef } from '../content/series';
import type { CareerMoment, CareerSeason } from '../sim/types';
import { Icon, type IconName } from './Icon';
import { Press, PosBadge, SectionTitle, Txt } from './kit';
import { C, F, R, withAlpha } from './theme';

const MOMENT_ICON: Record<string, IconName> = {
  debut: 'flag',
  firstPoints: 'check',
  firstPodium: 'podium',
  firstWin: 'medal',
  firstPole: 'clock',
  title: 'trophy',
  crownJewel: 'crown',
  bigCrash: 'fire',
  injury: 'heart',
  transfer: 'swap',
  promotion: 'chart',
  categorySwitch: 'swap',
  record: 'chart',
  rivalry: 'fire',
  event: 'info',
  milestone: 'star',
  retire: 'helmet',
  legacy: 'user',
  dropped: 'close',
};

export function momentIcon(kind: string): IconName {
  return MOMENT_ICON[kind] ?? 'star';
}

/** Season-by-season career spine: one plate per season, the big moments hanging off it. */
export function CareerTimeline({
  seasons,
  moments,
  current,
  onHighlight,
}: {
  seasons: CareerSeason[];
  moments: CareerMoment[];
  current?: { year: number; series: string; teamName: string; pos: number; pts: number };
  onHighlight?: (id: string) => void;
}) {
  const years = new Set<number>([...seasons.map((s) => s.year), ...moments.map((m) => m.year)]);
  if (current) years.add(current.year);
  const list = [...years].sort((a, b) => b - a);
  return (
    <View>
      <SectionTitle title="Timeline" />
      {list.map((y) => {
        const s = seasons.find((x) => x.year === y);
        const ms = moments.filter((m) => m.year === y && m.importance >= 2).reverse();
        const isCurrent = current && current.year === y && !s;
        const sid = s?.series ?? (isCurrent ? current!.series : undefined);
        const sd = sid ? seriesDef(sid) : undefined;
        return (
          <View key={y} style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ alignItems: 'center', width: 46 }}>
              <Text style={{ fontFamily: F.title, fontSize: 17, color: isCurrent ? C.red : C.textDim }}>{y}</Text>
              <View style={{ flex: 1, width: 2, backgroundColor: C.surface3, marginTop: 4 }} />
            </View>
            <View style={{ flex: 1, paddingBottom: 16, gap: 8 }}>
              {sd ? (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    backgroundColor: C.surface,
                    borderRadius: R.sm,
                    paddingVertical: 10,
                    paddingRight: 10,
                    borderWidth: 1,
                    borderColor: s?.champion ? withAlpha(C.gold, 0.55) : C.line,
                    overflow: 'hidden',
                  }}
                >
                  <View style={{ width: 4, alignSelf: 'stretch', backgroundColor: s?.colors.primary ?? sd.color }} />
                  <View style={{ flex: 1 }}>
                    <Txt v="micro" color={C.textMute}>
                      {sd.name}
                    </Txt>
                    <Txt v="bodyStrong" numberOfLines={1}>
                      {s?.teamName ?? current?.teamName}
                    </Txt>
                    <Txt v="small" color={C.textDim} style={{ fontSize: 12.5 }}>
                      {s ? `${s.points} pts · ${s.wins} W · ${s.podiums} P${s.dnfs ? ` · ${s.dnfs} DNF` : ''}` : 'In progress'}
                    </Txt>
                  </View>
                  {s?.champion ? <Icon name="trophy" color={C.gold} size={22} /> : null}
                  {s ? <PosBadge pos={s.pos} size={32} /> : current && current.pos ? <PosBadge pos={current.pos} size={32} /> : null}
                </View>
              ) : null}
              {ms.map((m) => {
                const big = m.importance >= 3;
                return (
                  <Press key={m.id} disabled={!m.highlightId || !onHighlight} onPress={() => m.highlightId && onHighlight?.(m.highlightId)} scale={0.98}>
                    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start', paddingLeft: 4 }}>
                      <View
                        style={{ width: 26, height: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: withAlpha(big ? C.gold : C.steel, 0.14), borderRadius: R.xs, marginTop: 1 }}
                      >
                        <Icon name={momentIcon(m.kind)} size={15} color={big ? C.gold : C.textDim} strokeWidth={2.2} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Txt v="bodyStrong" color={big ? C.gold : C.text} style={{ fontSize: 14.5 }}>
                          {m.title}
                        </Txt>
                        <Txt v="small" color={C.textDim} style={{ fontSize: 13 }}>
                          {m.text}
                        </Txt>
                      </View>
                      {m.highlightId && onHighlight ? <Icon name="play" size={16} color={C.red} /> : null}
                    </View>
                  </Press>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
}

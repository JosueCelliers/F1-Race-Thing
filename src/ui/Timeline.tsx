import React from 'react';
import { View } from 'react-native';
import { series as seriesDef } from '../content/series';
import type { CareerMoment, CareerSeason } from '../sim/types';
import { Icon } from './Icon';
import { Press, PosBadge, SectionTitle, Txt } from './kit';
import { C, R, withAlpha } from './theme';

const MOMENT_ICON: Record<string, string> = {
  debut: '🚦',
  firstPoints: '✅',
  firstPodium: '🍾',
  firstWin: '🥇',
  firstPole: '⏱️',
  title: '🏆',
  crownJewel: '👑',
  bigCrash: '💥',
  injury: '🩼',
  transfer: '✍️',
  promotion: '⬆️',
  categorySwitch: '🔀',
  record: '📈',
  rivalry: '😤',
  event: '📰',
  milestone: '🎯',
  retire: '👋',
  legacy: '🧬',
  dropped: '🪑',
};

export function momentIcon(kind: string) {
  return MOMENT_ICON[kind] ?? '•';
}

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
          <View key={y} style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ alignItems: 'center', width: 44 }}>
              <Txt v="h3" color={C.textDim}>
                {y}
              </Txt>
              <View style={{ flex: 1, width: 2, backgroundColor: C.surface3, marginTop: 4 }} />
            </View>
            <View style={{ flex: 1, paddingBottom: 16, gap: 6 }}>
              {sd ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.surface, borderRadius: R.md, padding: 10, borderWidth: 1, borderColor: s?.champion ? withAlpha(C.gold, 0.6) : C.line }}>
                  <View style={{ width: 4, alignSelf: 'stretch', borderRadius: 2, backgroundColor: s?.colors.primary ?? sd.color }} />
                  <View style={{ flex: 1 }}>
                    <Txt v="label" color={sd.color}>
                      {sd.name}
                    </Txt>
                    <Txt v="bodyStrong" numberOfLines={1}>
                      {s?.teamName ?? current?.teamName}
                    </Txt>
                    <Txt v="small" color={C.textMute}>
                      {s ? `${s.points} pts · ${s.wins} W · ${s.podiums} P${s.dnfs ? ` · ${s.dnfs} DNF` : ''}` : 'In progress'}
                    </Txt>
                  </View>
                  {s?.champion ? <Icon name="trophy" color={C.gold} size={24} /> : null}
                  {s ? <PosBadge pos={s.pos} size={32} /> : current && current.pos ? <PosBadge pos={current.pos} size={32} /> : null}
                </View>
              ) : null}
              {ms.map((m) => (
                <Press key={m.id} disabled={!m.highlightId || !onHighlight} onPress={() => m.highlightId && onHighlight?.(m.highlightId)} scale={0.98}>
                  <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start', paddingHorizontal: 6 }}>
                    <Txt v="body">{momentIcon(m.kind)}</Txt>
                    <View style={{ flex: 1 }}>
                      <Txt v="bodyStrong" color={m.importance >= 3 ? C.gold : C.text}>
                        {m.title}
                      </Txt>
                      <Txt v="small" color={C.textDim}>
                        {m.text}
                      </Txt>
                    </View>
                    {m.highlightId && onHighlight ? <Icon name="play" size={16} color={C.red} /> : null}
                  </View>
                </Press>
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
}

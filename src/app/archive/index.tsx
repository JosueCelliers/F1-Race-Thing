import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Flag } from '../../art/Flag';
import { Portrait } from '../../art/Portrait';
import { HighlightReel } from '../../highlights/HighlightPlayer';
import { highlightTone } from '../../sim/career';
import { computeRecords, TIER_INFO, TIER_ORDER } from '../../sim/legacy';
import type { CareerIndexEntry, CareerRecord, HighlightSpec } from '../../sim/types';
import { useGame, useWorld } from '../../state/store';
import { Icon } from '../../ui/Icon';
import { Btn, Card, Header, Press, Screen, SectionTitle, Txt } from '../../ui/kit';
import { Segmented } from '../../ui/Segmented';
import { C, R, S, withAlpha } from '../../ui/theme';

function CareerRow({ c }: { c: CareerIndexEntry }) {
  const info = TIER_INFO[c.tier];
  return (
    <Press onPress={() => router.push(`/archive/${c.id}`)} scale={0.98}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.surface, borderRadius: R.lg, padding: 12, borderWidth: 1, borderColor: withAlpha(info.color, 0.35) }}>
        <Portrait looks={c.looks} gender={c.gender} suit={c.lastTeamColors} size={58} />
        <View style={{ flex: 1, gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Flag id={c.nation} width={18} />
            <Txt v="h3" numberOfLines={1} style={{ flex: 1 }}>
              {c.name}
            </Txt>
          </View>
          <Txt v="label" color={info.color}>
            {c.title}
          </Txt>
          <Txt v="small" color={C.textDim} numberOfLines={1}>
            {c.startYear}–{c.endYear} · {c.totals.starts} races · {plural(c.totals.wins, 'win')} · {plural(c.totals.titles, 'title')}
          </Txt>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Txt v="label" color={C.textMute} style={{ fontSize: 9 }}>
            #{c.index}
          </Txt>
          <Icon name="chevron" color={C.textMute} size={18} />
        </View>
      </View>
    </Press>
  );
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** The clips that best tell a career's story: its glory, or its heartbreak. */
function reelFor(rec: CareerRecord | undefined, kind: 'glory' | 'heartbreak'): HighlightSpec[] {
  if (!rec) return [];
  const scored = rec.highlights.map((h, i) => ({ h, i, tone: h.tone ?? highlightTone(h.spec), imp: h.importance ?? 1 }));
  let pool = scored.filter((x) => (kind === 'glory' ? x.tone !== 'bad' : x.tone === 'bad'));
  if (!pool.length) pool = scored;
  return pool
    .sort((x, y) => y.imp - x.imp)
    .slice(0, kind === 'glory' ? 6 : 5)
    .sort((x, y) => x.i - y.i)
    .map((x) => x.h.spec);
}

function StandoutCard({ c, label, color, reel, onPlay }: { c: CareerIndexEntry; label: string; color: string; reel: number; onPlay: () => void }) {
  const info = TIER_INFO[c.tier];
  return (
    <View style={{ flex: 1, backgroundColor: C.surface, borderRadius: R.lg, padding: 12, borderWidth: 1, borderColor: withAlpha(color, 0.5), overflow: 'hidden' }}>
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 56, backgroundColor: withAlpha(color, 0.16) }} />
      <Press onPress={() => router.push(`/archive/${c.id}`)} scale={0.98} label={`${label}: ${c.name}`}>
        <View style={{ alignItems: 'center', gap: 4 }}>
          <Txt v="label" color={color} style={{ fontSize: 10 }}>
            {label}
          </Txt>
          <Portrait looks={c.looks} gender={c.gender} suit={c.lastTeamColors} size={72} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, maxWidth: '100%' }}>
            <Flag id={c.nation} width={16} />
            <Txt v="h3" numberOfLines={1} style={{ flexShrink: 1 }}>
              {c.name}
            </Txt>
          </View>
          <Txt v="label" color={info.color} center numberOfLines={1} style={{ fontSize: 10 }}>
            {c.title}
          </Txt>
          <Txt v="small" color={C.textDim} center numberOfLines={1}>
            {plural(c.totals.wins, 'win')} · {plural(c.totals.titles, 'title')}
          </Txt>
        </View>
      </Press>
      {reel ? (
        <Press onPress={onPlay} feedback="tick" label={`Play ${label.toLowerCase()} reel`} style={{ marginTop: 10 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              paddingVertical: 8,
              borderRadius: R.md,
              backgroundColor: withAlpha(color, 0.18),
              borderWidth: 1,
              borderColor: withAlpha(color, 0.5),
            }}
          >
            <Icon name="play" size={13} color={C.text} />
            <Txt v="label" style={{ fontSize: 10.5 }}>
              {reel} clip{reel === 1 ? '' : 's'}
            </Txt>
          </View>
        </Press>
      ) : null}
    </View>
  );
}

export default function Archive() {
  const world = useWorld();
  const archive = useGame((s) => s.archive);
  const [tab, setTab] = useState<'careers' | 'records'>('careers');
  const entries = useMemo(() => [...(world?.careers ?? [])].sort((a, b) => b.legacy - a.legacy), [world?.careers, world?.careers.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const records = useMemo(() => computeRecords(Object.values(archive)), [archive]);
  const [reel, setReel] = useState<HighlightSpec[] | null>(null);
  const best = entries[0];
  const worst = entries.length > 1 ? entries[entries.length - 1] : undefined;
  const bestReel = useMemo(() => reelFor(best ? archive[best.id] : undefined, 'glory'), [best, archive]);
  const worstReel = useMemo(() => reelFor(worst ? archive[worst.id] : undefined, 'heartbreak'), [worst, archive]);

  return (
    <Screen header={<Header title="The Archive" sub={`${entries.length} career${entries.length === 1 ? '' : 's'}`} />}>
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { id: 'careers', label: 'Careers' },
          { id: 'records', label: 'Records' },
        ]}
      />
      {entries.length === 0 ? (
        <Card style={{ marginTop: S.lg, alignItems: 'center', paddingVertical: 28 }}>
          <Txt v="h1" center>
            No careers yet
          </Txt>
          <Txt v="body" color={C.textDim} center style={{ marginTop: 6 }}>
            Every driver you create ends up here — legends, cult heroes and glorious disasters.
          </Txt>
          <Btn label="Spin a driver" icon="dice" style={{ marginTop: S.lg, alignSelf: 'stretch' }} onPress={() => router.replace(world?.active ? '/career' : '/create')} />
        </Card>
      ) : null}
      {tab === 'careers' && best && worst ? (
        <>
          <SectionTitle title="Standouts" />
          <View style={{ flexDirection: 'row', gap: S.sm }}>
            <StandoutCard c={best} label="Greatest career" color={C.gold} reel={bestReel.length} onPlay={() => setReel(bestReel)} />
            <StandoutCard c={worst} label="Biggest disaster" color={C.red} reel={worstReel.length} onPlay={() => setReel(worstReel)} />
          </View>
        </>
      ) : null}
      {tab === 'careers'
        ? TIER_ORDER.map((tier) => {
            const list = entries.filter((e) => e.tier === tier);
            if (!list.length) return null;
            const info = TIER_INFO[tier];
            return (
              <View key={tier}>
                <SectionTitle
                  title={`${info.emoji} ${info.label}`}
                  right={
                    <Txt v="label" color={C.textMute}>
                      {list.length}
                    </Txt>
                  }
                />
                <View style={{ gap: S.sm }}>
                  {list.map((c, i) => (
                    <Animated.View key={c.id} entering={FadeInDown.delay(Math.min(i, 8) * 50)}>
                      <CareerRow c={c} />
                    </Animated.View>
                  ))}
                </View>
              </View>
            );
          })
        : null}
      {tab === 'records' && entries.length ? (
        <View style={{ marginTop: S.md, gap: S.sm }}>
          {records.map((r) => (
            <Press key={r.id} onPress={() => router.push(`/archive/${r.careerId}`)} scale={0.98}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.surface, borderRadius: R.md, padding: 12, borderWidth: 1, borderColor: C.line }}>
                <Txt v="h1">{r.emoji}</Txt>
                <View style={{ flex: 1 }}>
                  <Txt v="label" color={C.textDim}>
                    {r.title}
                  </Txt>
                  <Txt v="bodyStrong" numberOfLines={1}>
                    {r.name}
                  </Txt>
                </View>
                <Txt v="h2" color={C.gold}>
                  {r.value}
                </Txt>
              </View>
            </Press>
          ))}
        </View>
      ) : null}
      {reel ? <HighlightReel specs={reel} onClose={() => setReel(null)} /> : null}
    </Screen>
  );
}

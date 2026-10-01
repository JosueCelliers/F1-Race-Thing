/**
 * The Archive: every driver you have been. The greatest career and the
 * biggest disaster lead, then every career grouped by verdict, plus the
 * records across all of them.
 */
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Flag } from '../../art/Flag';
import { Portrait } from '../../art/Portrait';
import { HighlightReel } from '../../highlights/HighlightPlayer';
import { highlightTone } from '../../sim/career';
import { computeRecords, TIER_INFO, TIER_ORDER } from '../../sim/legacy';
import type { CareerIndexEntry, CareerRecord, HighlightSpec } from '../../sim/types';
import { useGame, useWorld } from '../../state/store';
import { Icon } from '../../ui/Icon';
import { Btn, Header, Press, Screen, SectionTitle, Txt } from '../../ui/kit';
import { Segmented } from '../../ui/Segmented';
import { C, F, R, S, withAlpha } from '../../ui/theme';
import { RECORD_ICON, TIER_STYLE } from '../../ui/tiers';

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

function CareerRow({ c, first }: { c: CareerIndexEntry; first: boolean }) {
  const tier = TIER_STYLE[c.tier];
  return (
    <Press onPress={() => router.push(`/archive/${c.id}`)} scale={0.98} label={`${c.name}, ${c.title}`}>
      <View style={[styles.row, !first && { borderTopWidth: 1, borderColor: C.line }]}>
        <View style={{ width: 3, alignSelf: 'stretch', backgroundColor: tier.color }} />
        <View style={{ borderRadius: R.xs, overflow: 'hidden', backgroundColor: C.surface2 }}>
          <Portrait looks={c.looks} gender={c.gender} suit={c.lastTeamColors} size={50} shape="square" />
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Flag id={c.nation} width={17} />
            <Text style={styles.name} numberOfLines={1}>
              {c.name}
            </Text>
          </View>
          <Txt v="micro" color={tier.color} numberOfLines={1}>
            {c.title}
          </Txt>
          <Txt v="small" color={C.textDim} numberOfLines={1} style={{ fontSize: 12.5 }}>
            {c.startYear}–{c.endYear} · {c.totals.starts} races · {plural(c.totals.wins, 'win')} · {plural(c.totals.titles, 'title')}
          </Txt>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 2 }}>
          <Txt v="micro" color={C.textMute}>
            #{c.index}
          </Txt>
          <Icon name="chevron" color={C.textMute} size={16} strokeWidth={2.4} />
        </View>
      </View>
    </Press>
  );
}

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
  const tier = TIER_STYLE[c.tier];
  return (
    <View style={[styles.standout, { borderColor: withAlpha(color, 0.45) }]}>
      <View style={{ backgroundColor: color, paddingVertical: 4, paddingHorizontal: 10 }}>
        <Txt v="micro" color="#07090E">
          {label}
        </Txt>
      </View>
      <Press onPress={() => router.push(`/archive/${c.id}`)} scale={0.98} label={`${label}: ${c.name}`}>
        <View style={{ alignItems: 'center', paddingTop: 10, paddingHorizontal: 10, gap: 3 }}>
          <View style={{ borderRadius: R.xs, overflow: 'hidden', backgroundColor: withAlpha(color, 0.12) }}>
            <Portrait looks={c.looks} gender={c.gender} suit={c.lastTeamColors} size={78} shape="square" />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, maxWidth: '100%', marginTop: 4 }}>
            <Flag id={c.nation} width={16} />
            <Text style={[styles.name, { fontSize: 16 }]} numberOfLines={1}>
              {c.name}
            </Text>
          </View>
          <Txt v="micro" color={tier.color} center numberOfLines={1}>
            {c.title}
          </Txt>
          <Txt v="small" color={C.textDim} center numberOfLines={1} style={{ fontSize: 12.5 }}>
            {plural(c.totals.wins, 'win')} · {plural(c.totals.titles, 'title')}
          </Txt>
        </View>
      </Press>
      {reel ? (
        <Press onPress={onPlay} feedback="tick" label={`Play ${label.toLowerCase()} reel`} style={{ margin: 10 }}>
          <View
            style={{
              height: 40,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              borderRadius: R.xs,
              backgroundColor: withAlpha(color, 0.16),
              borderWidth: 1,
              borderColor: withAlpha(color, 0.5),
            }}
          >
            <Icon name="play" size={13} color={C.text} />
            <Txt v="micro" color={C.text}>
              {reel} clip{reel === 1 ? '' : 's'}
            </Txt>
          </View>
        </Press>
      ) : (
        <View style={{ height: 10 }} />
      )}
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
  const titles = entries.reduce((n, e) => n + e.totals.titles, 0);

  return (
    <Screen header={<Header kicker={`${plural(entries.length, 'career')} · ${plural(titles, 'title')}`} title="The Archive" />} backdrop={{ intensity: 0.7 }} tint={C.gold}>
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { id: 'careers', label: 'Careers' },
          { id: 'records', label: 'Records' },
        ]}
      />
      {entries.length === 0 ? (
        <View style={[styles.panel, { marginTop: S.lg, alignItems: 'center', paddingVertical: 28, paddingHorizontal: S.lg }]}>
          <Icon name="archive" size={30} color={C.gold} strokeWidth={2} />
          <Text style={[styles.name, { fontSize: 24, marginTop: S.sm }]}>No careers yet</Text>
          <Txt v="body" color={C.textDim} center style={{ marginTop: 6 }}>
            Every driver you create ends up here: legends, cult heroes and glorious disasters.
          </Txt>
          <Btn label="Spin a driver" icon="dice" style={{ marginTop: S.lg, alignSelf: 'stretch' }} onPress={() => router.replace(world?.active ? '/career' : '/create')} />
        </View>
      ) : null}

      {tab === 'careers' && best && worst ? (
        <>
          <SectionTitle title="Standouts" style={{ marginBottom: S.sm }} />
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
            const st = TIER_STYLE[tier];
            return (
              <View key={tier}>
                <SectionTitle
                  title={TIER_INFO[tier].label}
                  style={{ marginBottom: S.sm }}
                  right={
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <Icon name={st.icon} size={13} color={st.color} strokeWidth={2.4} />
                      <Txt v="micro" color={C.textMute}>
                        {list.length}
                      </Txt>
                    </View>
                  }
                />
                <View style={styles.panel}>
                  {list.map((c, i) => (
                    <Animated.View key={c.id} entering={FadeInDown.duration(240).delay(Math.min(i, 8) * 40)}>
                      <CareerRow c={c} first={i === 0} />
                    </Animated.View>
                  ))}
                </View>
              </View>
            );
          })
        : null}

      {tab === 'records' && entries.length ? (
        <View style={[styles.panel, { marginTop: S.md }]}>
          {records.map((r, i) => (
            <Press key={r.id} onPress={() => router.push(`/archive/${r.careerId}`)} scale={0.98} label={`${r.title}: ${r.name}, ${r.value}`}>
              <View style={[styles.row, i > 0 && { borderTopWidth: 1, borderColor: C.line }, { paddingLeft: 12 }]}>
                <View style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: withAlpha(C.gold, 0.12), borderRadius: R.xs }}>
                  <Icon name={RECORD_ICON[r.id] ?? 'star'} size={18} color={C.gold} strokeWidth={2.2} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Txt v="micro" color={C.textMute} numberOfLines={1}>
                    {r.title}
                  </Txt>
                  <Text style={[styles.name, { fontSize: 15.5 }]} numberOfLines={1}>
                    {r.name}
                  </Text>
                </View>
                <Text style={{ fontFamily: F.display, fontSize: 22, color: C.gold }}>{r.value}</Text>
              </View>
            </Press>
          ))}
        </View>
      ) : null}
      {reel ? <HighlightReel specs={reel} onClose={() => setReel(null)} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: R.sm,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingRight: 12,
    paddingVertical: 10,
  },
  name: {
    fontFamily: F.title,
    fontSize: 17,
    lineHeight: 20,
    color: C.text,
    textTransform: 'uppercase',
    flexShrink: 1,
  },
  standout: {
    flex: 1,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderRadius: R.sm,
    overflow: 'hidden',
  },
});

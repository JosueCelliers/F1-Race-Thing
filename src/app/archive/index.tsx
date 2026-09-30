import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Flag } from '../../art/Flag';
import { Portrait } from '../../art/Portrait';
import { computeRecords, TIER_INFO, TIER_ORDER } from '../../sim/legacy';
import type { CareerIndexEntry } from '../../sim/types';
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
            {c.startYear}–{c.endYear} · {c.totals.starts} races · {c.totals.wins} wins · {c.totals.titles} titles
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

export default function Archive() {
  const world = useWorld();
  const archive = useGame((s) => s.archive);
  const [tab, setTab] = useState<'careers' | 'records'>('careers');
  const entries = useMemo(() => [...(world?.careers ?? [])].sort((a, b) => b.legacy - a.legacy), [world?.careers, world?.careers.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const records = useMemo(() => computeRecords(Object.values(archive)), [archive]);

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
    </Screen>
  );
}

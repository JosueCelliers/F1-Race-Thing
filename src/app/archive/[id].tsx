import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { Trophy } from '../../art/Badges';
import { Flag } from '../../art/Flag';
import { Helmet } from '../../art/Helmet';
import { Portrait } from '../../art/Portrait';
import { nation } from '../../content/nations';
import { series as seriesDef, SPECIAL_MAP } from '../../content/series';
import { HighlightPlayer } from '../../highlights/HighlightPlayer';
import { hasTripleCrown, TIER_INFO } from '../../sim/legacy';
import { formatMoney } from '../../sim/market';
import type { HighlightSpec } from '../../sim/types';
import { useGame, useWorld } from '../../state/store';
import { Confetti } from '../../ui/Confetti';
import { Icon } from '../../ui/Icon';
import { Btn, Card, Header, Pill, Press, Screen, SectionTitle, Txt } from '../../ui/kit';
import { C, R, S, shade, withAlpha } from '../../ui/theme';
import { CareerTimeline } from '../../ui/Timeline';

const WHEEL_LABELS: Record<string, string> = {
  nation: 'Nationality',
  family: 'Family',
  age: 'Debut age',
  pace: 'Pace',
  racecraft: 'Racecraft',
  consistency: 'Consistency',
  wet: 'Wet weather',
  aggression: 'Style',
  personality: 'Known as',
  potential: 'Potential',
  series: 'First series',
  team: 'First team',
};

export default function CareerDetail() {
  const { id, fresh } = useLocalSearchParams<{ id: string; fresh?: string }>();
  const rec = useGame((s) => s.archive[id]);
  const world = useWorld();
  const [replay, setReplay] = useState<HighlightSpec | null>(null);
  if (!rec) {
    return (
      <Screen header={<Header title="Archive" />}>
        <Txt v="body" color={C.textDim} style={{ marginTop: S.lg }}>
          This career could not be found.
        </Txt>
      </Screen>
    );
  }
  const d = rec.driver;
  const info = TIER_INFO[rec.verdict.tier];
  const last = rec.seasons[rec.seasons.length - 1];
  const colors = last?.colors;
  const t = rec.totals;
  const tc = hasTripleCrown(t.specials);
  const isFresh = fresh === '1';
  const highlights = [...rec.highlights].sort((a, b) => ((b as { importance?: number }).importance ?? 0) - ((a as { importance?: number }).importance ?? 0)).slice(0, 12);
  const openHighlight = (hid: string) => {
    const h = rec.highlights.find((x) => x.id === hid);
    if (h) setReplay(h.spec);
  };

  return (
    <Screen
      tint={info.color}
      header={<Header title={isFresh ? 'Career over' : `Career #${rec.index}`} sub={`${rec.startYear}–${rec.endYear}`} onBack={() => router.replace(isFresh ? '/' : '/archive')} />}
      footer={
        isFresh ? (
          <Btn label="Spin your next driver" icon="dice" onPress={() => router.replace('/create')} sub={world ? `The world moves on to ${world.year + 1}` : undefined} />
        ) : undefined
      }
    >
      <Animated.View entering={ZoomIn.springify().damping(15)}>
        <View style={{ borderRadius: R.xl, overflow: 'hidden', borderWidth: 1, borderColor: withAlpha(info.color, 0.5) }}>
          <LinearGradient colors={[withAlpha(info.color, 0.35), shade(colors?.primary ?? '#1F2B47', -0.6), '#0A0D16']} style={{ padding: S.lg, alignItems: 'center' }}>
            <Portrait looks={d.looks} gender={d.gender} suit={colors} size={132} age={rec.retireAge} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: S.sm }}>
              <Flag id={d.nation} width={26} />
              <Txt v="label" color={C.textDim}>
                {nation(d.nation).adjective} · retired at {rec.retireAge}
              </Txt>
            </View>
            <Txt v="title" center style={{ marginTop: 4 }}>
              {d.first} {d.last}
            </Txt>
            <View style={{ marginTop: S.sm, backgroundColor: info.color, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6, transform: [{ skewX: '-8deg' }] }}>
              <Txt v="h2" color="#0B0F19">
                {info.emoji} {rec.verdict.title}
              </Txt>
            </View>
            <Txt v="body" color={C.textDim} center style={{ marginTop: S.sm }}>
              {rec.verdict.blurb}
            </Txt>
            <Txt v="label" color={C.gold} style={{ marginTop: S.sm }}>
              Legacy score {rec.legacy}
            </Txt>
          </LinearGradient>
        </View>
      </Animated.View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: S.sm, marginTop: S.md }}>
        {[
          ['Races', t.starts],
          ['Wins', t.wins],
          ['Podiums', t.podiums],
          ['Poles', t.poles],
          ['Titles', t.titles],
          ['Crashes', t.crashes],
          ['Teams', t.teams],
          ['Seasons', t.seasons],
        ].map(([l, v]) => (
          <View key={l as string} style={{ width: '23%', flexGrow: 1, alignItems: 'center', backgroundColor: C.surface, borderRadius: R.md, paddingVertical: 10, borderWidth: 1, borderColor: C.line }}>
            <Txt v="numBig" style={{ fontSize: 26, lineHeight: 28 }} color={l === 'Titles' || l === 'Wins' ? C.gold : C.text}>
              {v}
            </Txt>
            <Txt v="label" color={C.textDim} style={{ fontSize: 9.5 }}>
              {l}
            </Txt>
          </View>
        ))}
      </View>

      {Object.keys(t.specials).length || tc ? (
        <>
          <SectionTitle title="Trophy cabinet" />
          <Card style={{ flexDirection: 'row', flexWrap: 'wrap', gap: S.md, alignItems: 'center' }}>
            {tc ? (
              <View style={{ alignItems: 'center' }}>
                <Trophy size={48} />
                <Txt v="label" color={C.gold}>
                  Triple Crown
                </Txt>
              </View>
            ) : null}
            {Object.entries(t.specials).map(([sp, n]) => (
              <View key={sp} style={{ alignItems: 'center' }}>
                <Txt v="h1">{SPECIAL_MAP[sp]?.emoji ?? '🏆'}</Txt>
                <Txt v="label" color={C.text}>
                  {n}× {SPECIAL_MAP[sp]?.short ?? sp}
                </Txt>
              </View>
            ))}
          </Card>
        </>
      ) : null}

      {isFresh && (rec.verdict.tier === 'legend' || rec.verdict.tier === 'great') ? <Confetti count={70} /> : null}

      <SectionTitle title="The wheels said…" />
      <Card>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {rec.picks.map((p) => (
            <Pill key={p.wheel} label={`${WHEEL_LABELS[p.wheel] ?? p.wheel}: ${p.wheel === 'team' ? rec.seasons[0]?.teamName ?? p.label : p.label}`} color={C.surface2} textColor={C.text} />
          ))}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: S.md }}>
          <Helmet design={d.helmet} size={46} />
          <Txt v="small" color={C.textDim} style={{ flex: 1 }}>
            Peak rating {rec.peakOvr} · career earnings ${formatMoney(t.earnings)} · {d.fans >= 1000 ? `${(d.fans / 1000).toFixed(1)}M` : `${Math.round(d.fans)}k`} fans
          </Txt>
        </View>
      </Card>

      {highlights.length ? (
        <>
          <SectionTitle title="Highlight reel" />
          <View style={{ gap: 6 }}>
            {highlights.map((h) => (
              <Press key={h.id} onPress={() => setReplay(h.spec)} scale={0.98}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.surface, padding: 12, borderRadius: R.md, borderWidth: 1, borderColor: C.line }}>
                  <Icon name="film" color={C.red} />
                  <View style={{ flex: 1 }}>
                    <Txt v="h3" numberOfLines={1}>
                      {h.spec.caption}
                    </Txt>
                    <Txt v="small" color={C.textDim} numberOfLines={1}>
                      {h.year} · {h.trackName}
                    </Txt>
                  </View>
                  <Icon name="play" color={C.text} size={16} />
                </View>
              </Press>
            ))}
          </View>
        </>
      ) : null}

      {rec.rivals.length ? (
        <>
          <SectionTitle title="Rivals" />
          <Card padded={false} style={{ padding: 8 }}>
            {rec.rivals.map((r) => (
              <View key={r.driverId} style={{ flexDirection: 'row', alignItems: 'center', padding: 8, gap: 10 }}>
                <Icon name="fire" color={r.heat > 40 ? C.red : C.orange} size={18} />
                <Txt v="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>
                  {r.name}
                </Txt>
                <Txt v="small" color={C.textDim}>
                  {r.battles} battles · {r.incidents} incidents
                </Txt>
              </View>
            ))}
          </Card>
        </>
      ) : null}

      <CareerTimeline seasons={rec.seasons} moments={rec.moments} onHighlight={openHighlight} />
      <Txt v="small" color={C.textMute} center style={{ marginTop: S.sm }}>
        {rec.endReason}
      </Txt>
      {rec.seasons.length ? (
        <Txt v="small" color={C.textMute} center>
          Last raced in {seriesDef(last.series).name} with {last.teamName}
        </Txt>
      ) : null}
      {replay ? <HighlightPlayer spec={replay} onDone={() => setReplay(null)} /> : null}
    </Screen>
  );
}

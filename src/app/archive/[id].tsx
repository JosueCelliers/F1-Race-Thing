/**
 * A career, told as a magazine retrospective: the verdict up top, the numbers,
 * the trophies, what the wheels decided, the glory and heartbreak reels, the
 * rivals and the season-by-season story. Straight after retirement it is the
 * "career over" screen and leads into the next driver.
 */
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import { Trophy } from '../../art/Badges';
import { Flag } from '../../art/Flag';
import { Helmet } from '../../art/Helmet';
import { Portrait } from '../../art/Portrait';
import { nation } from '../../content/nations';
import { series as seriesDef, SPECIAL_MAP } from '../../content/series';
import { HighlightReel } from '../../highlights/HighlightPlayer';
import { highlightTone } from '../../sim/career';
import { hasTripleCrown } from '../../sim/legacy';
import { formatMoney } from '../../sim/market';
import type { HighlightSpec } from '../../sim/types';
import { useGame, useWorld } from '../../state/store';
import { Confetti } from '../../ui/Confetti';
import { HighlightRows, PlayAllChip, type HighlightItem } from '../../ui/HighlightList';
import { Icon } from '../../ui/Icon';
import { Backdrop, Btn, CountUp, Header, IconBtn, Screen, SectionTitle, Txt } from '../../ui/kit';
import { useScreen } from '../../ui/screen';
import { C, F, R, S, withAlpha } from '../../ui/theme';
import { TIER_STYLE } from '../../ui/tiers';
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
  const insets = useSafeAreaInsets();
  const { width } = useScreen();
  const [reel, setReel] = useState<{ specs: HighlightSpec[]; start: number } | null>(null);
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
  const tier = TIER_STYLE[rec.verdict.tier];
  const last = rec.seasons[rec.seasons.length - 1];
  const colors = last?.colors;
  const t = rec.totals;
  const tc = hasTripleCrown(t.specials);
  const isFresh = fresh === '1';
  // Best and worst moments: the most important clips of each kind, told in order.
  const scored: HighlightItem[] = rec.highlights.map((h) => ({ ...h, tone: h.tone ?? highlightTone(h.spec) }));
  const pick = (list: HighlightItem[], n: number) =>
    list
      .map((h, i) => ({ h, i, imp: rec.highlights[i]?.importance ?? 1 }))
      .sort((x, y) => y.imp - x.imp)
      .slice(0, n)
      .sort((x, y) => x.i - y.i)
      .map((x) => x.h);
  const glory = pick(scored.map((h) => (h.tone === 'bad' ? null : h)).filter(Boolean) as HighlightItem[], 8);
  const heartbreak = pick(
    scored.filter((h) => h.tone === 'bad'),
    5,
  );
  const openHighlight = (hid: string) => {
    const h = rec.highlights.find((x) => x.id === hid);
    if (h) setReel({ specs: [h.spec], start: 0 });
  };
  const heroH = 250;
  const stats: [string, number, boolean?][] = [
    ['Races', t.starts],
    ['Wins', t.wins, true],
    ['Podiums', t.podiums],
    ['Poles', t.poles],
    ['Titles', t.titles, true],
    ['Crashes', t.crashes],
    ['Teams', t.teams],
    ['Seasons', t.seasons],
  ];

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Backdrop tint={tier.color} intensity={0.9} />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top, paddingBottom: S.xl }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: S.sm, paddingHorizontal: S.lg, paddingTop: S.sm }}>
          <IconBtn icon="back" label="Back" onPress={() => router.dismissTo(isFresh ? '/' : '/archive')} />
          <View style={{ flex: 1 }}>
            <Txt v="micro" color={C.red}>
              {isFresh ? 'Career over' : `Career #${rec.index}`}
            </Txt>
            <Txt v="small" color={C.textDim} style={{ fontSize: 12.5 }}>
              {rec.startYear}–{rec.endYear} · retired at {rec.retireAge}
            </Txt>
          </View>
        </View>

        {/* Hero */}
        <View style={{ height: heroH, marginTop: S.sm, overflow: 'hidden' }}>
          <Svg width={width} height={heroH} style={StyleSheet.absoluteFill}>
            <Defs>
              <RadialGradient id="careerLight" cx="0.5" cy="0.5" r="0.5">
                <Stop offset="0" stopColor={colors?.primary ?? tier.color} stopOpacity="0.55" />
                <Stop offset="1" stopColor={colors?.primary ?? tier.color} stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Ellipse cx={width * 0.5} cy={heroH * 0.6} rx={width * 0.55} ry={heroH * 0.6} fill="url(#careerLight)" />
          </Svg>
          <Animated.View entering={FadeInDown.duration(450)} style={{ position: 'absolute', alignSelf: 'center', bottom: -10 }}>
            <Portrait looks={d.looks} gender={d.gender} suit={colors} size={250} age={rec.retireAge} shape="none" bg="none" />
          </Animated.View>
          <LinearGradient colors={[withAlpha(C.bg, 0), C.bg]} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: heroH * 0.28 }} />
          <View style={{ position: 'absolute', left: S.lg, top: S.md }}>
            <Helmet design={d.helmet} size={54} />
          </View>
          <View style={{ position: 'absolute', right: S.lg, top: S.md, alignItems: 'flex-end' }}>
            <Txt v="micro" color={C.textDim}>
              Legacy
            </Txt>
            <CountUp value={rec.legacy} duration={900} delay={250} color={C.gold} style={{ fontSize: 44, lineHeight: 46 }} />
          </View>
        </View>

        <View style={{ paddingHorizontal: S.lg, marginTop: -S.xs }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
            <Flag id={d.nation} width={24} />
            <Txt v="label" color={C.textDim}>
              {nation(d.nation).name}
            </Txt>
          </View>
          <Text style={styles.name} numberOfLines={2} adjustsFontSizeToFit>
            {d.first} {d.last}
          </Text>
          <Animated.View entering={ZoomIn.duration(300).delay(200)} style={{ alignSelf: 'center', marginTop: S.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: tier.color, paddingHorizontal: 14, height: 38, transform: [{ skewX: '-11deg' }], borderRadius: R.xs }}>
              <View style={{ transform: [{ skewX: '11deg' }], flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Icon name={tier.icon} size={18} color="#07090E" strokeWidth={2.4} />
                <Text style={{ fontFamily: F.title, fontSize: 19, color: '#07090E', textTransform: 'uppercase' }}>{rec.verdict.title}</Text>
              </View>
            </View>
          </Animated.View>
          <Txt v="body" color={C.text} center style={{ marginTop: S.md, fontSize: 16, lineHeight: 23 }}>
            {rec.verdict.blurb}
          </Txt>

          {/* Numbers */}
          <Animated.View entering={FadeIn.delay(300)} style={[styles.panel, { flexDirection: 'row', flexWrap: 'wrap', marginTop: S.lg }]}>
            {stats.map(([l, v, gold], i) => (
              <View key={l} style={[styles.statCell, i % 4 !== 0 && { borderLeftWidth: 1 }, i >= 4 && { borderTopWidth: 1 }]}>
                <Text style={{ fontFamily: F.display, fontSize: 28, lineHeight: 30, color: gold && v ? C.gold : C.text, fontVariant: ['tabular-nums'] }}>{v}</Text>
                <Txt v="micro" color={C.textMute}>
                  {l}
                </Txt>
              </View>
            ))}
          </Animated.View>

          {Object.keys(t.specials).length || tc ? (
            <>
              <SectionTitle title="Trophy cabinet" style={{ marginBottom: S.sm }} />
              <View style={[styles.panel, { flexDirection: 'row', flexWrap: 'wrap', gap: S.lg, alignItems: 'center', padding: S.lg }]}>
                {tc ? (
                  <View style={{ alignItems: 'center', gap: 4 }}>
                    <Trophy size={48} />
                    <Txt v="micro" color={C.gold}>
                      Triple Crown
                    </Txt>
                  </View>
                ) : null}
                {Object.entries(t.specials).map(([sp, n]) => (
                  <View key={sp} style={{ alignItems: 'center', gap: 4 }}>
                    <Trophy size={40} color="silver" />
                    <Txt v="micro" color={C.text}>
                      {n}× {SPECIAL_MAP[sp]?.short ?? sp}
                    </Txt>
                  </View>
                ))}
              </View>
            </>
          ) : null}

          {isFresh && (rec.verdict.tier === 'legend' || rec.verdict.tier === 'great') ? <Confetti count={70} /> : null}

          <SectionTitle title="The wheels said" style={{ marginBottom: S.sm }} />
          <View style={styles.panel}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {rec.picks.map((p, i) => (
                <View key={p.wheel} style={[styles.pick, i % 2 === 1 && { borderLeftWidth: 1 }, i >= 2 && { borderTopWidth: 1 }]}>
                  <Txt v="micro" color={C.textMute}>
                    {WHEEL_LABELS[p.wheel] ?? p.wheel}
                  </Txt>
                  <Txt v="bodyStrong" numberOfLines={1} style={{ fontSize: 14 }}>
                    {p.wheel === 'team' ? (rec.seasons[0]?.teamName ?? p.label) : p.label}
                  </Txt>
                </View>
              ))}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderTopWidth: 1, borderColor: C.line }}>
              <Txt v="small" color={C.textDim} style={{ flex: 1, fontSize: 13 }}>
                Peak rating {rec.peakOvr} · earned ${formatMoney(t.earnings)} · {d.fans >= 1000 ? `${(d.fans / 1000).toFixed(1)}M` : `${Math.round(d.fans)}k`} fans
              </Txt>
            </View>
          </View>

          {glory.length ? (
            <>
              <SectionTitle
                title="Glory reel"
                style={{ marginBottom: S.sm }}
                right={glory.length > 1 ? <PlayAllChip onPress={() => setReel({ specs: glory.map((h) => h.spec), start: 0 })} /> : undefined}
              />
              <HighlightRows items={glory} onPlay={(i) => setReel({ specs: glory.map((h) => h.spec), start: i })} />
            </>
          ) : null}

          {heartbreak.length ? (
            <>
              <SectionTitle
                title="Heartbreak reel"
                style={{ marginBottom: S.sm }}
                right={heartbreak.length > 1 ? <PlayAllChip onPress={() => setReel({ specs: heartbreak.map((h) => h.spec), start: 0 })} /> : undefined}
              />
              <HighlightRows items={heartbreak} onPlay={(i) => setReel({ specs: heartbreak.map((h) => h.spec), start: i })} />
            </>
          ) : null}

          {rec.rivals.length ? (
            <>
              <SectionTitle title="Rivals" style={{ marginBottom: S.sm }} />
              <View style={styles.panel}>
                {rec.rivals.map((r, i) => (
                  <View key={r.driverId} style={[{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, minHeight: 46 }, i > 0 && { borderTopWidth: 1, borderColor: C.line }]}>
                    <Icon name="fire" color={r.heat > 40 ? C.red : C.orange} size={17} />
                    <Txt v="bodyStrong" style={{ flex: 1, fontSize: 14.5 }} numberOfLines={1}>
                      {r.name}
                    </Txt>
                    <Txt v="small" color={C.textDim} style={{ fontSize: 12.5 }}>
                      {r.battles} battles · {r.incidents} incidents
                    </Txt>
                  </View>
                ))}
              </View>
            </>
          ) : null}

          <CareerTimeline seasons={rec.seasons} moments={rec.moments} onHighlight={openHighlight} />
          <View style={[styles.panel, { padding: 12, gap: 2, borderColor: withAlpha(tier.color, 0.3) }]}>
            <Txt v="micro" color={tier.color}>
              The end
            </Txt>
            <Txt v="small" color={C.textDim} style={{ fontSize: 13 }}>
              {rec.endReason}
              {rec.seasons.length ? ` Last raced in ${seriesDef(last.series).name} with ${last.teamName}.` : ''}
            </Txt>
          </View>
        </View>
      </ScrollView>
      {isFresh ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom + S.md }]}>
          <Btn label="Spin your next driver" icon="dice" onPress={() => router.replace('/create')} sub={world ? `The world moves on to ${world.year + 1}` : undefined} />
        </View>
      ) : null}
      {reel ? <HighlightReel specs={reel.specs} start={reel.start} onClose={() => setReel(null)} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  name: {
    fontFamily: F.display,
    fontSize: 44,
    lineHeight: 47,
    color: C.text,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginTop: 2,
  },
  panel: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: R.sm,
    overflow: 'hidden',
  },
  statCell: {
    width: '25%',
    alignItems: 'center',
    paddingVertical: 10,
    borderColor: C.line,
  },
  pick: {
    width: '50%',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderColor: C.line,
  },
  footer: {
    paddingHorizontal: S.lg,
    paddingTop: S.sm,
    backgroundColor: C.bg,
    borderTopWidth: 1,
    borderColor: C.line,
  },
});

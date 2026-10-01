/**
 * The race weekend around the live broadcast: the event poster with the
 * qualifying call, the starting grid, and the result.
 */
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Flag } from '../art/Flag';
import { TrackMap } from '../art/TrackMap';
import { series as seriesDef } from '../content/series';
import { HighlightReel } from '../highlights/HighlightPlayer';
import { forecast, type PreparedRace, type RaceMeta, type RaceOutcome } from '../sim/career';
import { useWorld } from '../state/store';
import { HighlightRows, PlayAllChip } from '../ui/HighlightList';
import { Icon, type IconName } from '../ui/Icon';
import { Backdrop, Btn, CornerTicks, CountUp, IconBtn, SectionTitle, StatCell, Txt } from '../ui/kit';
import { useScreen } from '../ui/screen';
import { C, F, R, S, withAlpha } from '../ui/theme';
import { OptionCard } from './MomentSheet';
import { gapLabel } from './Tower';

const SKEW = '-11deg';
const UNSKEW = '11deg';

/** Top bar used across the weekend: back (optional), kicker and title. */
function WeekendBar({ kicker, title, onBack }: { kicker: string; title: string; onBack?: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: S.sm, paddingHorizontal: S.lg, paddingTop: S.sm }}>
      {onBack ? <IconBtn icon="back" label="Back" onPress={onBack} /> : null}
      <View style={{ flex: 1 }}>
        <Txt v="micro" color={C.red} numberOfLines={1}>
          {kicker}
        </Txt>
        <Text style={styles.barTitle} numberOfLines={1} adjustsFontSizeToFit>
          {title}
        </Text>
      </View>
    </View>
  );
}

function Tag({ label, color, icon }: { label: string; color: string; icon?: IconName }) {
  return (
    <View
      style={{
        height: 26,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 9,
        backgroundColor: withAlpha(color, 0.14),
        borderWidth: 1,
        borderColor: withAlpha(color, 0.45),
        borderRadius: R.xs,
      }}
    >
      {icon ? <Icon name={icon} size={13} color={color} strokeWidth={2.4} /> : null}
      <Txt v="micro" color={color} style={{ letterSpacing: 1 }}>
        {label}
      </Txt>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Event poster + qualifying
// ---------------------------------------------------------------------------

export function PreRace({ meta, onQuali }: { meta: RaceMeta; onQuali: (c: 'push' | 'banker') => void }) {
  const world = useWorld()!;
  const insets = useSafeAreaInsets();
  const { width, height } = useScreen();
  const s = seriesDef(meta.seriesId);
  const fc = forecast(world, meta);
  const t = meta.track;
  const mapW = width - S.lg * 2;
  // The poster grows into whatever height the phone has beyond the fixed blocks.
  const mapH = Math.round(Math.max(mapW * 0.56, Math.min(mapW * 0.9, height - 560)));
  const passing = t.overtaking > 0.6 ? 'Easy' : t.overtaking > 0.35 ? 'Medium' : 'Hard';
  const weather = fc.wetStart
    ? { label: 'Wet start', color: C.blue, icon: 'rain' as const }
    : fc.rainLater
      ? { label: 'Rain threat', color: C.cyan, icon: 'cloud' as const }
      : { label: 'Dry', color: C.amber, icon: 'sun' as const };
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Backdrop tint={s.color} intensity={0.8} />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top, paddingBottom: S.lg }} showsVerticalScrollIndicator={false} bounces={false}>
        <WeekendBar kicker={`${s.name}${meta.oneOff ? ' · One-off' : ` · Round ${meta.roundIndex + 1}/${meta.totalRounds}`}`} title={meta.round.name} onBack={() => router.back()} />

        <Animated.View entering={FadeInDown.duration(380)} style={{ marginHorizontal: S.lg, marginTop: S.md }}>
          <View style={styles.poster}>
            <CornerTicks color={C.lineStrong} />
            <TrackMap trackId={t.id} width={mapW - 2} height={mapH} variant="broadcast" sectors />
            <View style={{ position: 'absolute', left: 12, top: 10, flexDirection: 'row', gap: 10 }}>
              {['S1', 'S2', 'S3'].map((x, i) => (
                <View key={x} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <View style={{ width: 10, height: 3, backgroundColor: [C.red, '#E9E4DA', '#8C94A4'][i] }} />
                  <Txt v="micro" color={C.textMute}>
                    {x}
                  </Txt>
                </View>
              ))}
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: S.md }}>
            <Flag id={t.nation} width={26} />
            <Txt v="h2" numberOfLines={1} style={{ flexShrink: 1 }}>
              {t.name}
            </Txt>
          </View>
          <Txt v="small" color={C.textDim} style={{ marginTop: 2 }}>
            {t.city}
            {t.night ? ' · Night race' : ''}
          </Txt>
        </Animated.View>

        <View style={[styles.statStrip, { marginHorizontal: S.lg, marginTop: S.md }]}>
          <StatCell label={meta.round.hours ? 'Hours' : 'Laps'} value={meta.round.hours ?? meta.round.laps} size={24} />
          <StatCell label="Length" value={`${t.lengthKm.toFixed(1)}km`} size={24} />
          <StatCell label="Type" value={t.kind[0].toUpperCase() + t.kind.slice(1)} size={24} />
          <StatCell label="Passing" value={passing} size={24} align="right" />
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginHorizontal: S.lg, marginTop: S.md }}>
          <Tag label={weather.label} color={weather.color} icon={weather.icon} />
          {meta.reasons.map((r) => (
            <Tag key={r} label={r} color={r.startsWith('Title') ? C.gold : r === 'Crown jewel' ? C.gold : C.steel} />
          ))}
        </View>

        <View style={{ marginHorizontal: S.lg }}>
          <SectionTitle title="Qualifying" style={{ marginTop: S.lg, marginBottom: S.sm }} />
          <Txt v="body" color={C.text}>
            Final run. The track is {fc.wetStart ? 'wet and treacherous' : 'rubbered in and fast'}. How hard do you push?
          </Txt>
        </View>
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + S.md }]}>
        <View style={{ flexDirection: 'row', gap: S.sm }}>
          <OptionCard o={{ id: 'push', label: 'Push to the limit', hint: 'Faster lap · 20% chance of a mistake', risk: 2, emoji: '' }} tall state="open" onPress={() => onQuali('push')} />
          <OptionCard o={{ id: 'banker', label: 'Banker lap', hint: 'Clean and safe', risk: 0, emoji: '' }} tall state="open" onPress={() => onQuali('banker')} />
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Starting grid
// ---------------------------------------------------------------------------

const SLOT_H = 46;
const ROW_STEP = 38;

export function GridView({ prep, onStart }: { prep: PreparedRace; onStart: () => void }) {
  const insets = useSafeAreaInsets();
  const e = prep.engine;
  const p = e.playerIndex;
  const pos = p >= 0 ? e.cfg.grid.indexOf(p) + 1 : 0;
  const s = seriesDef(prep.meta.seriesId);
  const field = e.cfg.grid.length;
  const scroll = useRef<ScrollView>(null);
  const rolling = prep.meta.track.kind === 'oval';
  useEffect(() => {
    if (pos <= 6) return;
    const t = setTimeout(() => scroll.current?.scrollTo({ y: Math.max(0, (pos - 5) * ROW_STEP), animated: true }), 500);
    return () => clearTimeout(t);
  }, [pos]);
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Backdrop tint={s.color} number={pos || undefined} intensity={0.8} />
      <View style={{ paddingTop: insets.top }}>
        <WeekendBar kicker={`Starting grid · ${field} cars`} title={prep.meta.round.name} />
        <Animated.View entering={ZoomIn.duration(300)} style={{ flexDirection: 'row', alignItems: 'center', gap: S.md, paddingHorizontal: S.lg, marginTop: S.md }}>
          {p >= 0 ? (
            <>
              <View
                style={{
                  height: 76,
                  minWidth: 108,
                  paddingHorizontal: 14,
                  backgroundColor: pos === 1 ? C.gold : C.red,
                  borderRadius: R.xs,
                  transform: [{ skewX: SKEW }],
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ transform: [{ skewX: UNSKEW }], fontFamily: F.display, fontSize: 56, lineHeight: 62, color: pos === 1 ? '#07090E' : '#FFFFFF' }}>P{pos}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.gridHead}>{pos === 1 ? 'Pole position' : pos <= 3 ? 'Front row fight' : pos <= field / 2 ? 'In the hunt' : 'Work to do'}</Text>
                <Txt v="small" color={prep.qualiMistake ? C.red : C.textDim} style={{ fontSize: 13.5 }}>
                  {prep.qualiMistake ? 'You pushed too hard and ran wide on the final lap.' : `Qualified P${pos} of ${field}.`}
                </Txt>
              </View>
            </>
          ) : (
            <Text style={styles.gridHead}>Watching from the garage</Text>
          )}
        </Animated.View>
      </View>

      <ScrollView ref={scroll} style={{ flex: 1, marginTop: S.md }} contentContainerStyle={{ paddingHorizontal: S.lg, paddingBottom: S.xl, paddingTop: S.sm }} showsVerticalScrollIndicator={false}>
        <View style={{ height: Math.ceil(field / 2) * ROW_STEP * 2 + SLOT_H - ROW_STEP }}>
          {e.cfg.grid.map((idx, k) => {
            const en = e.entries[idx];
            const me = idx === p;
            const left = k % 2 === 0;
            return (
              <Animated.View
                key={en.driverId}
                entering={FadeIn.duration(200).delay(Math.min(k, 14) * 25)}
                style={[styles.slot, { top: k * ROW_STEP, left: left ? 0 : '52%', right: left ? '52%' : 0 }, me && { borderColor: C.red, backgroundColor: withAlpha(C.red, 0.16) }]}
              >
                <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 2, backgroundColor: me ? C.red : withAlpha('#F2EEE6', 0.35) }} />
                <Text style={[styles.slotPos, { color: me ? C.red : k < 3 ? C.gold : C.textDim }]}>{k + 1}</Text>
                <View style={{ width: 4, height: 20, backgroundColor: en.colors.primary, transform: [{ skewX: '-14deg' }] }} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.slotCode, me && { color: '#FFFFFF' }]}>{en.code}</Text>
                  <Txt v="micro" color={C.textMute} numberOfLines={1} style={{ letterSpacing: 0.6 }}>
                    {me ? 'You' : en.name.split(' ').slice(-1)[0]}
                  </Txt>
                </View>
                <Txt v="micro" color={C.textMute}>
                  #{en.number}
                </Txt>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + S.md }]}>
        <Btn label={rolling ? 'Green flag' : 'Lights out'} icon="flag" sub={rolling ? 'Rolling start behind the pace car' : 'Five red lights. Then go.'} onPress={onStart} testID="lights-out" />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Result
// ---------------------------------------------------------------------------

export function Results({ prep, outcome }: { prep: PreparedRace; outcome: RaceOutcome }) {
  const world = useWorld()!;
  const insets = useSafeAreaInsets();
  const e = prep.engine;
  const cls = e.classification();
  const r = outcome.summary;
  const s = seriesDef(prep.meta.seriesId);
  const points = world.season.series[prep.meta.seriesId]?.results.find((x) => x.round === prep.meta.roundIndex)?.points ?? {};
  const hls = world.active?.highlights.filter((h) => outcome.highlightIds.includes(h.id)) ?? [];
  const [reel, setReel] = useState<number | null>(null);
  const dnf = r.pos === 0;
  const gained = dnf ? 0 : r.grid - r.pos;
  const podium = !dnf && r.pos <= 3;
  const plate = dnf ? C.surface3 : r.pos === 1 ? C.gold : r.pos === 2 ? C.silver : r.pos === 3 ? C.bronze : C.red;
  const last = e.snapshots[e.snapshots.length - 1];
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Backdrop tint={r.pos === 1 ? C.gold : s.color} number={dnf ? undefined : r.pos} intensity={0.9} />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top, paddingBottom: S.xl }} showsVerticalScrollIndicator={false}>
        <WeekendBar kicker={`Race result · ${s.short}`} title={prep.meta.round.name} />

        <Animated.View entering={FadeInDown.duration(380)} style={{ paddingHorizontal: S.lg, marginTop: S.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: S.md }}>
            <Animated.View
              entering={ZoomIn.duration(320)}
              style={{ height: 96, minWidth: 128, paddingHorizontal: 16, backgroundColor: plate, borderRadius: R.xs, transform: [{ skewX: SKEW }], alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ transform: [{ skewX: UNSKEW }], fontFamily: F.display, fontSize: dnf ? 50 : 72, lineHeight: 80, color: podium ? '#07090E' : '#FFFFFF' }}>{dnf ? 'DNF' : `P${r.pos}`}</Text>
            </Animated.View>
            <View style={{ flex: 1, gap: 4 }}>
              <Txt v="micro" color={C.textDim}>
                {dnf ? (r.dnfReason ?? 'Retired') : `Finished P${r.pos} of ${e.cfg.grid.length}`}
              </Txt>
              {!dnf ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Txt v="label" color={C.textMute}>
                    P{r.grid}
                  </Txt>
                  <Icon name="chevron" size={12} color={C.textMute} strokeWidth={2.6} />
                  <Txt v="label" color={C.text}>
                    P{r.pos}
                  </Txt>
                  {gained !== 0 ? (
                    <Txt v="label" color={gained > 0 ? C.green : C.red}>
                      {gained > 0 ? `▲${gained}` : `▼${-gained}`}
                    </Txt>
                  ) : null}
                </View>
              ) : null}
            </View>
          </View>
          <Text style={styles.resultHead}>{r.headline}</Text>
          <View style={[styles.statStrip, { marginTop: S.md }]}>
            <View>
              <Txt v="micro" color={C.textMute}>
                Points
              </Txt>
              <CountUp value={r.points} delay={250} color={r.points ? C.text : C.textDim} style={{ fontSize: 28, lineHeight: 30 }} />
            </View>
            <StatCell label="Started" value={`P${r.grid}`} size={28} align="center" />
            <StatCell label="Championship" value={`P${outcome.standingsPos}`} size={28} align="center" />
            <StatCell label="Fastest lap" value={r.fastestLap ? 'Yes' : '—'} size={28} align="right" color={r.fastestLap ? C.purple : C.textDim} />
          </View>
        </Animated.View>

        <View style={{ paddingHorizontal: S.lg }}>
          {outcome.newMoments.length ? (
            <View style={{ gap: 6, marginTop: S.lg }}>
              {outcome.newMoments.map((m, i) => (
                <Animated.View key={m.id} entering={FadeInDown.duration(260).delay(200 + i * 80)} style={styles.momentStrip}>
                  <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: C.gold }} />
                  <Icon name="trophy" size={18} color={C.gold} strokeWidth={2.2} />
                  <View style={{ flex: 1 }}>
                    <Txt v="label" color={C.gold}>
                      {m.title}
                    </Txt>
                    <Txt v="small" color={C.textDim} style={{ fontSize: 13 }}>
                      {m.text}
                    </Txt>
                  </View>
                </Animated.View>
              ))}
            </View>
          ) : null}

          {hls.length ? (
            <>
              <SectionTitle title="Highlights" right={hls.length > 1 ? <PlayAllChip onPress={() => setReel(0)} /> : undefined} style={{ marginTop: S.lg, marginBottom: S.sm }} />
              <HighlightRows items={hls} meta="sub" onPlay={(i) => setReel(i)} />
            </>
          ) : null}

          <SectionTitle title="Classification" style={{ marginTop: S.lg, marginBottom: S.sm }} />
          <View style={styles.table}>
            {cls.order.map((i, k) => {
              const en = e.entries[i];
              const out = e.cars[i].status === 'out';
              const me = en.isPlayer;
              const pd = !out && k < 3;
              return (
                <View key={en.driverId} style={[styles.row, me && { backgroundColor: withAlpha(C.red, 0.16) }, k % 2 === 1 && !me && { backgroundColor: withAlpha('#FFFFFF', 0.02) }]}>
                  <View style={{ width: 3, alignSelf: 'stretch', backgroundColor: me ? C.red : 'transparent' }} />
                  <View
                    style={{
                      width: 32,
                      height: 20,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: out ? withAlpha(C.red, 0.16) : me ? C.red : pd ? [C.gold, C.silver, C.bronze][k] : C.surface3,
                      transform: [{ skewX: SKEW }],
                      borderRadius: R.xs,
                    }}
                  >
                    <Text style={{ transform: [{ skewX: UNSKEW }], fontFamily: F.title, fontSize: out ? 11 : 14, color: out ? C.red : pd && !me ? '#07090E' : '#FFFFFF' }}>{out ? 'DNF' : k + 1}</Text>
                  </View>
                  <View style={{ width: 4, height: 18, backgroundColor: en.colors.primary, transform: [{ skewX: '-14deg' }] }} />
                  <Txt v="bodyStrong" style={{ flex: 1, fontSize: 14 }} numberOfLines={1} color={me ? '#FFFFFF' : C.text}>
                    {en.name}
                  </Txt>
                  <Txt v="small" color={C.textDim} style={{ width: 76, textAlign: 'right', fontSize: 12.5 }}>
                    {out ? (e.cars[i].outReason === 'mech' ? 'Mechanical' : 'Accident') : gapLabel(e, last, i, false)}
                  </Txt>
                  <Text style={{ width: 34, textAlign: 'right', fontFamily: F.title, fontSize: 15, color: points[en.driverId] ? C.text : C.textMute }}>
                    {points[en.driverId] ? `+${points[en.driverId]}` : ''}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + S.md }]}>
        <Btn label="Continue" sub={`Championship P${outcome.standingsPos}`} onPress={() => router.replace('/career')} testID="result-continue" />
      </View>
      {reel !== null ? <HighlightReel specs={hls.map((h) => h.spec)} start={reel} onClose={() => setReel(null)} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  barTitle: {
    fontFamily: F.display,
    fontSize: 30,
    lineHeight: 34,
    color: C.text,
    textTransform: 'uppercase',
  },
  poster: {
    backgroundColor: withAlpha(C.surface, 0.9),
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: R.sm,
    alignItems: 'center',
    overflow: 'hidden',
  },
  statStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: R.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  footer: {
    paddingHorizontal: S.lg,
    paddingTop: S.sm,
    backgroundColor: C.bg,
    borderTopWidth: 1,
    borderColor: C.line,
  },
  gridHead: {
    fontFamily: F.display,
    fontSize: 28,
    lineHeight: 31,
    color: C.text,
    textTransform: 'uppercase',
  },
  slot: {
    position: 'absolute',
    height: SLOT_H,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: R.xs,
    overflow: 'hidden',
  },
  slotPos: {
    fontFamily: F.display,
    fontSize: 22,
    lineHeight: 26,
    minWidth: 24,
  },
  slotCode: {
    fontFamily: F.heading,
    fontSize: 16,
    lineHeight: 18,
    letterSpacing: 1,
    color: C.text,
  },
  resultHead: {
    fontFamily: F.display,
    fontSize: 34,
    lineHeight: 37,
    color: C.text,
    textTransform: 'uppercase',
    marginTop: S.md,
  },
  momentStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: withAlpha(C.gold, 0.3),
    borderRadius: R.sm,
    paddingLeft: 15,
    paddingRight: 12,
    paddingVertical: 10,
    overflow: 'hidden',
  },
  table: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: R.sm,
    overflow: 'hidden',
    paddingVertical: 4,
  },
  row: {
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 10,
  },
});

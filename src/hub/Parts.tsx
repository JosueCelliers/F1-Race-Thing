/**
 * Career hub furniture: the driver HUD strip, the next-event poster, the
 * championship snapshot, team and rival panels, the thumb-zone action dock
 * and the quick-result sheet.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Flag } from '../art/Flag';
import { Portrait } from '../art/Portrait';
import { TrackMap } from '../art/TrackMap';
import { series as seriesDef, SPECIAL_MAP } from '../content/series';
import type { RaceMeta, RaceOutcome } from '../sim/career';
import type { Driver, RaceSummary, TeamState } from '../sim/types';
import { Icon, type IconName } from '../ui/Icon';
import { Btn, Press, SheetModal, StatBar, StatCell, TeamStripe, Txt } from '../ui/kit';
import { C, F, R, ratingColor, S, withAlpha } from '../ui/theme';

const SKEW = '-11deg';
const UNSKEW = '11deg';

export function fmtFans(k: number) {
  if (k >= 1000) return `${(k / 1000).toFixed(1)}M`;
  return `${Math.round(k)}k`;
}

function Chip({ icon, value, label, color }: { icon: IconName; value: string; label?: string; color: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Icon name={icon} size={13} color={color} strokeWidth={2.4} />
      <Text style={{ fontFamily: F.title, fontSize: 14, color: C.text }}>{value}</Text>
      {label ? (
        <Txt v="micro" color={C.textMute} style={{ letterSpacing: 0.8 }}>
          {label}
        </Txt>
      ) : null}
    </View>
  );
}

/** Who you are right now: portrait, name, team, rating and the three resources. */
export function DriverHud({ me, team, age, rating, money }: { me: Driver; team?: TeamState; age: number; rating: number; money: string }) {
  return (
    <View style={styles.hud}>
      <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: team?.colors.primary ?? C.steel }} />
      <View style={{ borderRadius: R.xs, overflow: 'hidden', backgroundColor: C.surface2 }}>
        <Portrait looks={me.looks} gender={me.gender} suit={team?.colors} size={60} age={age} shape="square" />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Flag id={me.nation} width={18} />
          <Text style={styles.hudName} numberOfLines={1}>
            {me.first} {me.last}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <TeamStripe colors={team?.colors} height={12} width={4} />
          <Txt v="small" color={C.textDim} numberOfLines={1} style={{ flexShrink: 1, fontSize: 12.5 }}>
            {team ? team.name : 'Free agent'} · #{me.number} · Age {age}
          </Txt>
        </View>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 3 }}>
          <Chip icon="heart" value={`${Math.round(me.morale)}`} label="Morale" color={me.morale > 60 ? C.green : me.morale > 35 ? C.amber : C.red} />
          <Chip icon="fans" value={fmtFans(me.fans)} color={C.cyan} />
          <Chip icon="money" value={money} color={C.gold} />
        </View>
      </View>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontFamily: F.display, fontSize: 38, lineHeight: 40, color: ratingColor(rating), fontVariant: ['tabular-nums'] }}>{rating}</Text>
        <Txt v="micro" color={C.textMute}>
          OVR
        </Txt>
      </View>
    </View>
  );
}

export function reasonColor(r: string): string {
  if (r.startsWith('Title')) return C.gold;
  if (r === 'Crown jewel') return C.gold;
  if (r === 'Home race') return C.green;
  if (r.startsWith('Rival')) return C.red;
  if (r === 'Debut') return C.cyan;
  return C.steel;
}

export function Tag({ label, color, icon }: { label: string; color: string; icon?: IconName }) {
  return (
    <View
      style={{
        height: 24,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 8,
        backgroundColor: withAlpha(color, 0.14),
        borderWidth: 1,
        borderColor: withAlpha(color, 0.45),
        borderRadius: R.xs,
      }}
    >
      {icon ? <Icon name={icon} size={12} color={color} strokeWidth={2.4} /> : null}
      <Txt v="micro" color={color} style={{ letterSpacing: 1 }}>
        {label}
      </Txt>
    </View>
  );
}

/** The next race as an event poster. */
export function EventPoster({ meta, forecast, onMoments, disabled }: { meta: RaceMeta; forecast: { wetStart: boolean; rainLater: boolean }; onMoments: () => void; disabled?: boolean }) {
  const s = seriesDef(meta.seriesId);
  const special = meta.round.special ? SPECIAL_MAP[meta.round.special] : undefined;
  const weather = forecast.wetStart
    ? { label: 'Wet race', color: C.blue, icon: 'rain' as const }
    : forecast.rainLater
      ? { label: 'Rain possible', color: C.cyan, icon: 'cloud' as const }
      : { label: 'Dry', color: C.amber, icon: 'sun' as const };
  return (
    <View style={[styles.poster, { borderColor: withAlpha(s.color, 0.4) }]}>
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 3, backgroundColor: s.color }} />
      <View style={{ position: 'absolute', right: -8, top: 18, opacity: 0.9 }}>
        <TrackMap trackId={meta.track.id} width={150} height={118} color="#F2EEE6" />
      </View>
      <Txt v="micro" color={C.red}>
        {meta.oneOff ? 'Special invitation' : `Next race · ${s.short} · Round ${meta.roundIndex + 1} of ${meta.totalRounds}`}
      </Txt>
      <Text style={styles.posterTitle} numberOfLines={2}>
        {special ? special.name : meta.round.name}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, maxWidth: '62%' }}>
        <Flag id={meta.track.nation} width={18} />
        <Txt v="small" color={C.textDim} numberOfLines={1} style={{ flexShrink: 1, fontSize: 13 }}>
          {meta.track.name}
        </Txt>
      </View>
      <Txt v="small" color={C.textMute} style={{ fontSize: 12.5, marginTop: 1 }}>
        {meta.round.hours ? `${meta.round.hours} hours` : `${meta.round.laps} laps`} · {meta.track.lengthKm.toFixed(1)} km{meta.track.night ? ' · Night' : ''}
      </Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: S.md }}>
        <Tag label={weather.label} color={weather.color} icon={weather.icon} />
        {meta.reasons.map((r) => (
          <Tag key={r} label={r} color={reasonColor(r)} />
        ))}
      </View>
      <Press onPress={onMoments} disabled={disabled} feedback="tick" label="Watch key moments only" testID="key-moments">
        <View style={{ height: 44, flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: S.sm, opacity: disabled ? 0.4 : 1 }}>
          <Icon name="film" size={16} color={C.text} strokeWidth={2.3} />
          <Txt v="label" color={C.text}>
            Key moments
          </Txt>
          <Txt v="small" color={C.textMute} style={{ fontSize: 12.5 }}>
            Just the decisions, at speed
          </Txt>
        </View>
      </Press>
    </View>
  );
}

/** Your championship at a glance. */
export function ChampionshipStrip({ pos, pts, behind, left }: { pos: number; pts: number; behind: number; left: number }) {
  return (
    <View style={styles.strip}>
      <StatCell label="Position" value={pos ? `P${pos}` : '—'} size={26} color={pos === 1 ? C.gold : C.text} />
      <StatCell label="Points" value={pts} size={26} align="center" />
      <StatCell label="To leader" value={pos > 1 ? `-${behind}` : pos === 1 ? 'Lead' : '—'} size={26} align="center" color={pos === 1 ? C.gold : C.text} />
      <StatCell label="Rounds left" value={left} size={26} align="right" />
    </View>
  );
}

export function LastRaceStrip({ r }: { r: RaceSummary }) {
  const s = seriesDef(r.series);
  const dnf = r.pos === 0;
  const podium = !dnf && r.pos <= 3;
  return (
    <View style={styles.row}>
      <View
        style={{
          height: 44,
          minWidth: 58,
          paddingHorizontal: 8,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: dnf ? withAlpha(C.red, 0.16) : podium ? [C.gold, C.silver, C.bronze][r.pos - 1] : C.surface3,
          transform: [{ skewX: SKEW }],
          borderRadius: R.xs,
        }}
      >
        <Text style={{ transform: [{ skewX: UNSKEW }], fontFamily: F.display, fontSize: 26, color: dnf ? C.red : podium ? '#07090E' : C.text }}>{dnf ? 'DNF' : `P${r.pos}`}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt v="micro" color={C.textMute} numberOfLines={1}>
          Last race · {s.short} · {r.name}
        </Txt>
        <Txt v="bodyStrong" numberOfLines={2} style={{ fontSize: 15 }}>
          {r.headline}
        </Txt>
        <Txt v="small" color={C.textDim} style={{ fontSize: 12.5 }}>
          Started P{r.grid}
          {r.points ? ` · +${r.points} pts` : ''}
          {r.fastestLap ? ' · Fastest lap' : ''}
          {r.pole ? ' · Pole' : ''}
          {r.wet ? ' · Wet' : ''}
        </Txt>
      </View>
    </View>
  );
}

export function TeamPanel({ team, until, principal, formerDriver, teamRel, mateRel }: { team: TeamState; until?: number; principal: string; formerDriver: boolean; teamRel: number; mateRel: number }) {
  return (
    <View style={[styles.panel, { gap: 12 }]}>
      <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: team.colors.primary }} />
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.panelTitle} numberOfLines={1}>
            {team.name}
          </Text>
          <Txt v="small" color={C.textDim} style={{ fontSize: 12.5 }}>
            Principal: {principal}
            {formerDriver ? ' · a former driver of yours' : ''}
          </Txt>
        </View>
        {until ? <Tag label={`Contract to ${until}`} color={C.steel} /> : null}
      </View>
      <StatBar label="Car performance" value={team.perf} compact />
      <StatBar label="Relationship with team" value={teamRel} compact />
      <StatBar label="Relationship with teammate" value={mateRel} compact />
    </View>
  );
}

export function RivalStrip({ rival, colors, battles, incidents }: { rival: Driver; colors?: TeamState['colors']; battles: number; incidents: number }) {
  return (
    <View style={[styles.row, { borderColor: withAlpha(C.red, 0.35) }]}>
      <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: C.red }} />
      <View style={{ borderRadius: R.xs, overflow: 'hidden', backgroundColor: C.surface2 }}>
        <Portrait looks={rival.looks} gender={rival.gender} suit={colors} size={50} shape="square" />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt v="micro" color={C.red}>
          Rival
        </Txt>
        <Text style={styles.panelTitle} numberOfLines={1}>
          {rival.first} {rival.last}
        </Text>
        <Txt v="small" color={C.textDim} style={{ fontSize: 12.5 }}>
          {battles} battle{battles === 1 ? '' : 's'} · {incidents} incident{incidents === 1 ? '' : 's'}
        </Txt>
      </View>
      <Icon name="fire" color={C.red} size={22} />
    </View>
  );
}

/** Square secondary action for the dock. */
export function DockBtn({ icon, label, onPress, disabled, testID }: { icon: IconName; label: string; onPress: () => void; disabled?: boolean; testID?: string }) {
  return (
    <Press onPress={onPress} disabled={disabled} label={label} testID={testID}>
      <View
        style={{
          width: 76,
          height: 62,
          backgroundColor: C.surface2,
          borderWidth: 1,
          borderColor: C.line,
          borderRadius: R.xs,
          transform: [{ skewX: SKEW }],
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.4 : 1,
        }}
      >
        <View style={{ transform: [{ skewX: UNSKEW }], alignItems: 'center', gap: 4 }}>
          <Icon name={icon} size={20} color={C.text} strokeWidth={2.3} />
          <Txt v="micro" color={C.textDim} style={{ fontSize: 9, letterSpacing: 0.8 }}>
            {label}
          </Txt>
        </View>
      </View>
    </Press>
  );
}

/** The sticky thumb-zone dock. */
export function ActionDock({ children, note }: { children: React.ReactNode; note?: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.dock, { paddingBottom: insets.bottom + S.md }]}>
      {note ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <Icon name="info" size={13} color={C.amber} strokeWidth={2.4} />
          <Txt v="small" color={C.amber} style={{ fontSize: 12.5 }}>
            {note}
          </Txt>
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: S.sm }}>{children}</View>
    </View>
  );
}

export function QuickResultSheet({ outcome, onClose }: { outcome: RaceOutcome; onClose: () => void }) {
  const r = outcome.summary;
  const dnf = r.pos === 0;
  const podium = !dnf && r.pos <= 3;
  const plate = dnf ? C.surface3 : r.pos === 1 ? C.gold : r.pos === 2 ? C.silver : r.pos === 3 ? C.bronze : C.red;
  return (
    <SheetModal onClose={onClose} accent={podium ? C.gold : C.red}>
      <Txt v="micro" color={C.textDim}>
        Quick result · {r.name}
      </Txt>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: S.md, marginTop: S.sm }}>
        <Animated.View entering={ZoomIn.duration(260)}>
          <View style={{ height: 70, minWidth: 96, paddingHorizontal: 12, backgroundColor: plate, borderRadius: R.xs, transform: [{ skewX: SKEW }], alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ transform: [{ skewX: UNSKEW }], fontFamily: F.display, fontSize: dnf ? 36 : 50, color: podium ? '#07090E' : '#FFFFFF' }}>{dnf ? 'DNF' : `P${r.pos}`}</Text>
          </View>
        </Animated.View>
        <Text style={[styles.panelTitle, { flex: 1, fontSize: 22, lineHeight: 25 }]}>{r.headline}</Text>
      </View>
      <View style={[styles.strip, { marginTop: S.md }]}>
        <StatCell label="Started" value={`P${r.grid}`} size={24} />
        <StatCell label="Points" value={`+${r.points}`} size={24} align="center" />
        <StatCell label="Championship" value={`P${outcome.standingsPos}`} size={24} align="right" />
      </View>
      {outcome.newMoments.length ? (
        <View style={{ marginTop: S.md, gap: 6 }}>
          {outcome.newMoments.map((m, i) => (
            <Animated.View key={m.id} entering={FadeInDown.duration(240).delay(120 + i * 70)} style={[styles.row, { borderColor: withAlpha(C.gold, 0.3) }]}>
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
      <Btn label="Continue" onPress={onClose} style={{ marginTop: S.lg }} />
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  hud: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: R.sm,
    paddingLeft: 13,
    paddingRight: 12,
    paddingVertical: 10,
    overflow: 'hidden',
  },
  hudName: {
    fontFamily: F.title,
    fontSize: 20,
    lineHeight: 23,
    color: C.text,
    textTransform: 'uppercase',
    flexShrink: 1,
  },
  poster: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderRadius: R.sm,
    paddingHorizontal: S.lg,
    paddingTop: S.lg,
    paddingBottom: S.xs,
    overflow: 'hidden',
  },
  posterTitle: {
    fontFamily: F.display,
    fontSize: 40,
    lineHeight: 43,
    color: C.text,
    textTransform: 'uppercase',
    marginTop: 4,
    maxWidth: '68%',
  },
  strip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: R.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: R.sm,
    paddingLeft: 13,
    paddingRight: 12,
    paddingVertical: 10,
    overflow: 'hidden',
  },
  panel: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: R.sm,
    paddingLeft: 15,
    paddingRight: 14,
    paddingVertical: 12,
    overflow: 'hidden',
  },
  panelTitle: {
    fontFamily: F.title,
    fontSize: 19,
    lineHeight: 22,
    color: C.text,
    textTransform: 'uppercase',
  },
  dock: {
    paddingHorizontal: S.lg,
    paddingTop: S.sm,
    backgroundColor: C.bg,
    borderTopWidth: 1,
    borderColor: C.line,
  },
});

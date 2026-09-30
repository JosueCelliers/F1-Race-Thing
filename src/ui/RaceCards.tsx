import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { View } from 'react-native';
import { Flag } from '../art/Flag';
import { TrackMap } from '../art/TrackMap';
import { series as seriesDef, SPECIAL_MAP } from '../content/series';
import type { RaceMeta } from '../sim/career';
import type { RaceSummary } from '../sim/types';
import { Icon } from './Icon';
import { Btn, Card, Pill, PosBadge, Txt } from './kit';
import { C, R, S, shade, withAlpha } from './theme';

export function reasonColor(r: string): string {
  if (r.startsWith('Title')) return C.gold;
  if (r === 'Crown jewel') return C.purple;
  if (r === 'Home race') return C.green;
  if (r.startsWith('Rival')) return C.red;
  if (r === 'Debut') return C.cyan;
  return C.surface3;
}

export function NextRaceCard({
  meta,
  forecast,
  onWatch,
  onHighlights,
  onQuick,
  disabled,
}: {
  meta: RaceMeta;
  forecast: { wetStart: boolean; rainLater: boolean };
  onWatch: () => void;
  onHighlights: () => void;
  onQuick: () => void;
  disabled?: boolean;
}) {
  const s = seriesDef(meta.seriesId);
  const special = meta.round.special ? SPECIAL_MAP[meta.round.special] : undefined;
  const wet = forecast.wetStart ? 'Wet race' : forecast.rainLater ? 'Rain possible' : 'Dry';
  return (
    <View style={{ borderRadius: R.lg, overflow: 'hidden', borderWidth: 1, borderColor: withAlpha(s.color, 0.45) }}>
      <LinearGradient colors={[withAlpha(s.color, 0.3), C.surface, C.surface]} locations={[0, 0.5, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: S.lg }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Txt v="label" color={shade(s.color, 0.35)}>
            {meta.oneOff ? 'Special invitation' : `${s.short} · Round ${meta.roundIndex + 1} of ${meta.totalRounds}`}
          </Txt>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Icon name={forecast.wetStart ? 'rain' : forecast.rainLater ? 'cloud' : 'sun'} size={16} color={forecast.wetStart || forecast.rainLater ? C.blue : C.gold} />
            <Txt v="small" color={C.textDim}>
              {wet}
            </Txt>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: S.md, marginTop: S.sm, alignItems: 'center' }}>
          <View style={{ flex: 1, gap: 6 }}>
            <Txt v="h1" numberOfLines={2}>
              {special ? `${special.emoji} ` : ''}
              {meta.round.name}
            </Txt>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Flag id={meta.track.nation} width={20} />
              <Txt v="small" color={C.textDim} numberOfLines={1} style={{ flex: 1 }}>
                {meta.track.name}
              </Txt>
            </View>
            <Txt v="small" color={C.textMute}>
              {meta.round.hours ? `${meta.round.hours} hours` : `${meta.round.laps} laps`} · {meta.track.lengthKm.toFixed(1)} km
            </Txt>
          </View>
          <View style={{ backgroundColor: withAlpha('#000000', 0.25), borderRadius: R.md }}>
            <TrackMap trackId={meta.track.id} width={112} height={92} />
          </View>
        </View>
        {meta.reasons.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: S.md }}>
            {meta.reasons.map((r) => (
              <Pill key={r} label={r} color={reasonColor(r)} />
            ))}
          </View>
        ) : null}
        <View style={{ gap: S.sm, marginTop: S.lg }}>
          <Btn label="Watch the race" icon="play" onPress={onWatch} disabled={disabled} sub="Broadcast view with decisions" />
          <View style={{ flexDirection: 'row', gap: S.sm }}>
            <Btn label="Key moments" icon="film" kind="secondary" small onPress={onHighlights} disabled={disabled} style={{ flex: 1 }} />
            <Btn label="Quick result" icon="skip" kind="ghost" small onPress={onQuick} disabled={disabled} style={{ flex: 1 }} />
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

export function LastResultCard({ r }: { r: RaceSummary }) {
  const s = seriesDef(r.series);
  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: S.md }}>
        <PosBadge pos={r.pos} dnf={r.pos === 0} size={44} />
        <View style={{ flex: 1 }}>
          <Txt v="label" color={C.textDim}>
            Last race · {s.short} · {r.name}
          </Txt>
          <Txt v="h2" style={{ marginTop: 2 }} numberOfLines={2}>
            {r.headline}
          </Txt>
          <Txt v="small" color={C.textDim} style={{ marginTop: 2 }}>
            Started P{r.grid}
            {r.points ? ` · +${r.points} pts` : ''}
            {r.fastestLap ? ' · Fastest lap' : ''}
            {r.pole ? ' · Pole' : ''}
            {r.wet ? ' · Wet' : ''}
          </Txt>
        </View>
      </View>
    </Card>
  );
}

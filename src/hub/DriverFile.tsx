/**
 * The driver tab: the same file you were handed at the reveal, kept up to
 * date: portrait and rating, ability, personality, and record by series.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import { Flag } from '../art/Flag';
import { nation } from '../content/nations';
import { Portrait } from '../art/Portrait';
import { series as seriesDef } from '../content/series';
import { family, personality } from '../content/traits';
import type { Driver, TeamState } from '../sim/types';
import { NumberPlate, SectionTitle, StatBar, Txt } from '../ui/kit';
import { useScreen } from '../ui/screen';
import { C, F, R, ratingColor, S } from '../ui/theme';

function Tile({ label, value, line, accent }: { label: string; value: string; line: string; accent: string }) {
  return (
    <View style={styles.tile}>
      <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: accent }} />
      <Txt v="micro" color={C.textMute}>
        {label}
      </Txt>
      <Text style={styles.tileValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Txt v="small" color={C.textDim} numberOfLines={2} style={{ fontSize: 12.5, lineHeight: 16 }}>
        {line}
      </Txt>
    </View>
  );
}

const aggressionWord = (a: number) => (a >= 80 ? 'Kamikaze' : a >= 62 ? 'Aggressive' : a >= 42 ? 'Balanced' : a >= 25 ? 'Calculated' : 'Ice calm');

export function DriverFile({ me, team, age, rating, seriesName }: { me: Driver; team?: TeamState; age: number; rating: number; seriesName?: string }) {
  const { width } = useScreen();
  const pers = personality(me.personality);
  const fam = family(me.family);
  const tint = team?.colors.primary ?? C.red;
  const heroH = 190;
  return (
    <View>
      <View style={{ height: heroH, marginHorizontal: -S.lg, overflow: 'hidden' }}>
        <Svg width={width} height={heroH} style={StyleSheet.absoluteFill}>
          <Defs>
            <RadialGradient id="fileLight" cx="0.5" cy="0.5" r="0.5">
              <Stop offset="0" stopColor={tint} stopOpacity="0.5" />
              <Stop offset="1" stopColor={tint} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Ellipse cx={width * 0.28} cy={heroH * 0.55} rx={width * 0.42} ry={heroH * 0.6} fill="url(#fileLight)" />
        </Svg>
        <View style={{ position: 'absolute', left: S.lg, bottom: -8 }}>
          <Portrait looks={me.looks} gender={me.gender} suit={team?.colors} size={186} age={age} shape="none" bg="none" />
        </View>
        <View style={{ position: 'absolute', right: S.lg, top: S.md, alignItems: 'flex-end', gap: 8 }}>
          <View style={{ alignItems: 'flex-end' }}>
            <Txt v="micro" color={C.textDim}>
              Overall
            </Txt>
            <Text style={{ fontFamily: F.display, fontSize: 64, lineHeight: 66, color: ratingColor(rating), fontVariant: ['tabular-nums'] }}>{rating}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Txt v="label" color={C.text}>
              {nation(me.nation).name}
            </Txt>
            <Flag id={me.nation} width={24} />
          </View>
          <NumberPlate number={me.number} colors={team?.colors} size={32} />
        </View>
      </View>
      <Text style={styles.first} numberOfLines={1}>
        {me.first}
      </Text>
      <Text style={styles.last} numberOfLines={1} adjustsFontSizeToFit>
        {me.last}
      </Text>
      <Txt v="small" color={C.textDim} style={{ fontSize: 13 }}>
        Age {age}
        {team ? ` · ${team.name}` : ' · Free agent'}
        {seriesName ? ` · ${seriesName}` : ''}
      </Txt>

      <SectionTitle title="Ability" style={{ marginTop: S.lg, marginBottom: S.sm }} />
      <View style={styles.grid}>
        {(
          [
            ['Pace', me.skills.pace],
            ['Racecraft', me.skills.racecraft],
            ['Consistency', me.skills.consistency],
            ['Wet', me.skills.wet],
          ] as const
        ).map(([label, v], i) => (
          <View key={label} style={styles.cell}>
            <StatBar label={label} value={Math.round(v)} compact delay={i * 90} />
          </View>
        ))}
      </View>

      <SectionTitle title="Personality" style={{ marginTop: S.lg, marginBottom: S.sm }} />
      <View style={styles.grid}>
        <Tile label="Known as" value={pers.label} line={pers.description} accent={C.steel} />
        <Tile label="Family" value={fam.label} line={fam.description} accent={C.steel} />
        <Tile
          label="Driving style"
          value={aggressionWord(me.aggression)}
          line={`Aggression ${Math.round(me.aggression)}/100`}
          accent={me.aggression >= 62 ? C.orange : me.aggression < 42 ? C.cyan : '#C6CDD8'}
        />
        <Tile
          label="Reputation"
          value={`${Math.round(me.reputation)}`}
          line={me.reputation >= 70 ? 'A paddock name' : me.reputation >= 40 ? 'Getting noticed' : 'Still unknown'}
          accent={ratingColor(me.reputation)}
        />
      </View>

      <SectionTitle title="By championship" style={{ marginTop: S.lg, marginBottom: S.sm }} />
      <View style={styles.table}>
        {Object.entries(me.stats).map(([sid, st], k) => (
          <View key={sid} style={[styles.trow, k > 0 && { borderTopWidth: 1, borderColor: C.line }]}>
            <View style={{ width: 4, height: 18, backgroundColor: seriesDef(sid).color, transform: [{ skewX: '-14deg' }] }} />
            <Txt v="bodyStrong" style={{ flex: 1, fontSize: 14.5 }} numberOfLines={1}>
              {seriesDef(sid).name}
            </Txt>
            <Txt v="small" color={C.textDim} style={{ fontSize: 12.5 }}>
              {st.starts} starts · {st.wins} W · {st.podiums} P{st.titles ? ` · ${st.titles} title${st.titles === 1 ? '' : 's'}` : ''}
            </Txt>
          </View>
        ))}
        {Object.keys(me.stats).length === 0 ? (
          <View style={styles.trow}>
            <Txt v="small" color={C.textMute}>
              No races yet.
            </Txt>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  first: {
    fontFamily: F.title,
    fontSize: 20,
    lineHeight: 22,
    color: C.textDim,
    textTransform: 'uppercase',
    marginTop: S.sm,
  },
  last: {
    fontFamily: F.display,
    fontSize: 46,
    lineHeight: 48,
    color: C.text,
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: S.sm,
  },
  cell: {
    width: '48.5%',
    flexGrow: 1,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: R.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tile: {
    width: '48.5%',
    flexGrow: 1,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: R.sm,
    paddingLeft: 14,
    paddingRight: 10,
    paddingVertical: 10,
    gap: 2,
    overflow: 'hidden',
  },
  tileValue: {
    fontFamily: F.title,
    fontSize: 19,
    lineHeight: 23,
    color: C.text,
    textTransform: 'uppercase',
  },
  table: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: R.sm,
    overflow: 'hidden',
  },
  trow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 46,
    paddingHorizontal: 12,
  },
});

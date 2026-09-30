import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { View } from 'react-native';
import { Flag } from '../art/Flag';
import { Portrait } from '../art/Portrait';
import { nation } from '../content/nations';
import type { Gender, Looks, Skills, TeamColors } from '../sim/types';
import { Pill, StatBar, Txt } from './kit';
import { C, F, R, shade, withAlpha } from './theme';

export interface CardDriver {
  first: string;
  last: string;
  nation: string;
  gender: Gender;
  looks: Looks;
  age?: number;
  ovr?: number;
  skills?: Partial<Skills>;
  tags?: { label: string; color?: string }[];
  teamName?: string;
  seriesName?: string;
  number?: number;
}

export function OvrBadge({ ovr, size = 1 }: { ovr: number; size?: number }) {
  const color = ovr >= 85 ? C.gold : ovr >= 75 ? C.cyan : ovr >= 62 ? C.green : ovr >= 50 ? C.blue : C.textDim;
  return (
    <View style={{ alignItems: 'center' }}>
      <Txt v="numBig" color={color} style={{ fontSize: 40 * size, lineHeight: 42 * size }}>
        {Math.round(ovr)}
      </Txt>
      <Txt v="label" color={C.textDim} style={{ fontSize: 10 * size, marginTop: -2 }}>
        OVR
      </Txt>
    </View>
  );
}

export function DriverCard({ d, colors, dev }: { d: CardDriver; colors?: TeamColors; dev?: Partial<Skills> }) {
  const tc = colors ?? { primary: '#2A3550', secondary: '#5B6CFF', accent: '#FFFFFF' };
  const n = nation(d.nation);
  return (
    <View style={{ borderRadius: R.xl, overflow: 'hidden', borderWidth: 1, borderColor: withAlpha(tc.secondary, 0.5) }}>
      <LinearGradient colors={[shade(tc.primary, -0.1), shade(tc.primary, -0.62), '#0A0D16']} locations={[0, 0.55, 1]} start={{ x: 0, y: 0 }} end={{ x: 0.4, y: 1 }} style={{ padding: 16 }}>
        <View style={{ position: 'absolute', right: -40, top: -30, width: 180, height: 180, borderRadius: 90, backgroundColor: withAlpha(tc.secondary, 0.14) }} />
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <View style={{ flex: 1, gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              {d.ovr !== undefined ? <OvrBadge ovr={d.ovr} /> : null}
              <View style={{ gap: 4 }}>
                <Flag id={d.nation} width={34} />
                <Txt v="label" color={C.textDim}>
                  {n.adjective}
                </Txt>
              </View>
            </View>
            <View>
              <Txt v="h3" color={C.textDim} style={{ fontFamily: F.titleUp }}>
                {d.first}
              </Txt>
              <Txt v="title" numberOfLines={1} style={{ fontSize: 34, lineHeight: 36 }}>
                {d.last}
              </Txt>
            </View>
            {d.age !== undefined || d.number !== undefined ? (
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {d.age !== undefined ? <Pill label={`Age ${d.age}`} color={withAlpha('#FFFFFF', 0.12)} textColor={C.text} /> : null}
                {d.number !== undefined ? <Pill label={`#${d.number}`} color={withAlpha('#FFFFFF', 0.12)} textColor={C.text} /> : null}
              </View>
            ) : null}
          </View>
          <View style={{ marginRight: -6, marginTop: -4 }}>
            <Portrait looks={d.looks} gender={d.gender} suit={tc} size={138} bg="none" shape="none" age={d.age} />
          </View>
        </View>
        {d.tags && d.tags.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
            {d.tags.map((t, i) => (
              <Pill key={i} label={t.label} color={t.color ?? withAlpha('#FFFFFF', 0.12)} textColor={t.color ? undefined : C.text} />
            ))}
          </View>
        ) : null}
        {d.skills ? (
          <View style={{ marginTop: 14, gap: 10 }}>
            <View style={{ flexDirection: 'row', gap: 14 }}>
              <View style={{ flex: 1 }}>{d.skills.pace !== undefined ? <StatBar label="Pace" value={d.skills.pace} color={C.red} delta={dev?.pace} /> : null}</View>
              <View style={{ flex: 1 }}>{d.skills.racecraft !== undefined ? <StatBar label="Racecraft" value={d.skills.racecraft} color={C.orange} delta={dev?.racecraft} /> : null}</View>
            </View>
            <View style={{ flexDirection: 'row', gap: 14 }}>
              <View style={{ flex: 1 }}>{d.skills.consistency !== undefined ? <StatBar label="Consistency" value={d.skills.consistency} color={C.cyan} delta={dev?.consistency} /> : null}</View>
              <View style={{ flex: 1 }}>{d.skills.wet !== undefined ? <StatBar label="Wet" value={d.skills.wet} color={C.blue} delta={dev?.wet} /> : null}</View>
            </View>
          </View>
        ) : null}
        {d.teamName ? (
          <View style={{ marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: withAlpha('#FFFFFF', 0.1), flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Txt v="h3">{d.teamName}</Txt>
            {d.seriesName ? (
              <Txt v="label" color={C.textDim}>
                {d.seriesName}
              </Txt>
            ) : null}
          </View>
        ) : null}
      </LinearGradient>
    </View>
  );
}

/**
 * Art gallery used during development to review every generated asset.
 */
import React, { useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import { TrackMap } from '../art/TrackMap';
import { Flag } from '../art/Flag';
import { Portrait } from '../art/Portrait';
import { CarSide, CarTop } from '../art/Car';
import { Helmet } from '../art/Helmet';
import { TeamBadge, Trophy, ChequeredMark } from '../art/Badges';
import { NATIONS } from '../content/nations';
import { TRACKS } from '../content/tracks';
import { TEAMS } from '../content/teams';
import { HELMET_PATTERNS } from '../content/looks';
import { LIVERIES } from '../art/liveries';
import { generateHelmet, generateLooks } from '../sim/drivers';
import { Rng } from '../sim/rng';
import { C } from '../ui/theme';
import { Txt } from '../ui/kit';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 24 }}>
      <Txt v="h2" style={{ marginBottom: 8 }}>
        {title}
      </Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>{children}</View>
    </View>
  );
}

export default function Dev() {
  const rng = useMemo(() => new Rng(42), []);
  const people = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => {
        const n = NATIONS[(i * 7) % NATIONS.length];
        const gender = i % 4 === 3 ? 'f' : 'm';
        return { n, gender: gender as 'm' | 'f', looks: generateLooks(rng, n.id, gender), team: TEAMS[(i * 3) % TEAMS.length], helmet: generateHelmet(rng, n.id) };
      }),
    [rng],
  );
  const classes = ['formula', 'indy', 'prototype', 'gt'];
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16 }}>
      <Section title="Portraits">
        {people.map((p, i) => (
          <View key={i} style={{ alignItems: 'center' }}>
            <Portrait looks={p.looks} gender={p.gender} suit={p.team.colors} size={96} age={i % 5 === 0 ? 44 : undefined} />
            <Txt v="small" color={C.textDim}>
              {p.n.id} {p.looks.hair}
            </Txt>
          </View>
        ))}
      </Section>
      <Section title="Flags">
        {NATIONS.map((n) => (
          <View key={n.id} style={{ alignItems: 'center', gap: 2 }}>
            <Flag id={n.id} width={42} />
            <Txt v="small" color={C.textDim}>
              {n.id}
            </Txt>
          </View>
        ))}
      </Section>
      <Section title="Helmets">
        {HELMET_PATTERNS.map((pat, i) => (
          <Helmet key={pat} size={64} design={{ pattern: pat, colors: [people[i].helmet.colors[0], people[i].helmet.colors[1], people[i].helmet.colors[2]] }} />
        ))}
      </Section>
      {classes.map((cc) => (
        <Section key={cc} title={`Side · ${cc}`}>
          {Object.keys(LIVERIES).map((l, i) => {
            const team = TEAMS[(i * 5 + cc.length) % TEAMS.length];
            return <CarSide key={l} carClass={cc} colors={team.colors} livery={l} number={i + 3} helmet={people[i].helmet} width={170} />;
          })}
        </Section>
      ))}
      <Section title="Top views">
        {classes.map((cc, k) =>
          Object.keys(LIVERIES)
            .slice(0, 4)
            .map((l, i) => {
              const team = TEAMS[(i * 7 + k * 3) % TEAMS.length];
              return <CarTop key={cc + l} carClass={cc} colors={team.colors} livery={l} number={i + 10} helmet={people[i].helmet} width={100} />;
            }),
        )}
      </Section>
      <Section title="Badges & trophies">
        {TEAMS.slice(0, 10).map((t) => (
          <TeamBadge key={t.id} colors={t.colors} short={t.short} size={40} />
        ))}
        <Trophy size={70} />
        <Trophy size={70} color="silver" />
        <Trophy size={70} color="bronze" />
        <ChequeredMark size={60} />
      </Section>
      <Section title="Tracks">
        {TRACKS.map((t) => (
          <View key={t.id} style={{ alignItems: 'center', backgroundColor: C.surface, borderRadius: 12, padding: 4 }}>
            <TrackMap trackId={t.id} width={150} height={120} />
            <Txt v="small" color={C.textDim}>
              {t.id}
            </Txt>
          </View>
        ))}
      </Section>
      <Section title="Broadcast map">
        <View style={{ backgroundColor: C.surface, borderRadius: 12 }}>
          <TrackMap trackId="riviera" width={360} height={300} variant="broadcast" sectors />
        </View>
      </Section>
    </ScrollView>
  );
}

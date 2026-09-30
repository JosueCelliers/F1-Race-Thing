/**
 * Development-only: plays any highlight scene with demo actors so every cinematic
 * can be reviewed in isolation. Usage: /dev-highlight?kind=crash&car=gt&env=city&night=1&wet=1
 */
import { Redirect, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { TEAMS } from '../content/teams';
import { HighlightPlayer } from '../highlights/HighlightPlayer';
import { generateHelmet, generateLooks } from '../sim/drivers';
import { Rng } from '../sim/rng';
import type { HighlightActor, HighlightKind, HighlightSpec } from '../sim/types';
import { Btn } from '../ui/kit';
import { C } from '../ui/theme';

const NAMES = ['Raphaël Notari', 'Emma Turner', 'Ben Martin', 'Sota Ishikawa'];

export default function DevHighlight() {
  const p = useLocalSearchParams<{ kind?: string; car?: string; env?: string; night?: string; wet?: string; series?: string }>();
  const [run, setRun] = useState(0);
  const spec = useMemo<HighlightSpec>(() => {
    const rng = new Rng(7);
    const actors: HighlightActor[] = NAMES.map((name, i) => {
      const team = TEAMS[(i * 11 + 3) % TEAMS.length];
      const gender = i === 1 ? 'f' : 'm';
      return {
        name,
        short: name.split(' ')[1].slice(0, 3).toUpperCase(),
        number: [15, 83, 1, 44][i],
        colors: team.colors,
        livery: team.livery,
        helmet: generateHelmet(rng, 'FR'),
        isPlayer: i === 0,
        looks: generateLooks(rng, ['FR', 'GB', 'GB', 'JP'][i], gender),
        gender,
        age: 27,
      };
    });
    return {
      kind: (p.kind ?? 'overtake') as HighlightKind,
      seed: 1234,
      carClass: p.car ?? 'formula',
      env: p.env ?? 'forest',
      night: p.night === '1',
      wet: p.wet === '1',
      actors,
      caption: `${(p.kind ?? 'overtake').toUpperCase()}!`,
      sub: 'Notari makes it stick into turn 1',
      where: 'Turn 1',
      series: p.series ?? 'prime',
      event: 'Principality Grand Prix',
      year: 2031,
      lap: 'Lap 12',
    };
  }, [p.kind, p.car, p.env, p.night, p.wet, p.series]);
  if (!__DEV__) return <Redirect href="/" />;
  return (
    <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', padding: 24 }}>
      <Btn label="Play" onPress={() => setRun((r) => r + 1)} />
      {run > 0 ? <HighlightPlayer key={run} spec={spec} onDone={() => {}} /> : null}
    </View>
  );
}

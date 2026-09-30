import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Modal, TextInput, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { Flag } from '../art/Flag';
import { series as seriesDef } from '../content/series';
import { family, personality } from '../content/traits';
import { startCareer } from '../sim/career';
import { AGGRESSION_LEVELS, buildWheel, pickSlice, POTENTIALS, rollIdentity, rollSkills, WET_LABELS, WHEEL_ORDER, type Identity, type Picks, type WheelDef } from '../sim/creation';
import { generateLooks, generateName, overall } from '../sim/drivers';
import { mixSeed, Rng } from '../sim/rng';
import { useGame } from '../state/store';
import { DriverCard } from '../ui/DriverCard';
import { haptic } from '../ui/haptics';
import { Btn, Card, Header, IconBtn, Pill, Screen, Txt } from '../ui/kit';
import { SpinWheel, type SpinRequest } from '../ui/SpinWheel';
import { C, F, R, S, withAlpha } from '../ui/theme';

function PickChip({ label, flag, emoji }: { label: string; flag?: string; emoji?: string }) {
  return (
    <Animated.View
      entering={ZoomIn.springify().damping(14)}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.surface2, borderRadius: R.pill, paddingHorizontal: 9, paddingVertical: 5, borderWidth: 1, borderColor: C.line }}
    >
      {flag ? <Flag id={flag} width={16} /> : emoji ? <Txt v="small">{emoji}</Txt> : null}
      <Txt v="small" color={C.text} style={{ fontFamily: F.bodySemi }}>
        {label}
      </Txt>
    </Animated.View>
  );
}

const SHORT: Record<string, string> = {
  pace: 'Pace',
  racecraft: 'Racecraft',
  consistency: 'Consistency',
  wet: 'Wet',
  age: 'Age',
};

export default function Create() {
  const world = useGame((s) => s.world);
  const ensureWorld = useGame((s) => s.ensureWorld);
  const mutate = useGame((s) => s.mutate);
  const spinSpeed = useGame((s) => s.settings.spinSpeed);
  const { width } = useWindowDimensions();
  const [seed] = useState(() => Math.floor(Math.random() * 2 ** 31));
  const rng = useRef(new Rng(seed));
  const [step, setStep] = useState(0);
  const [picks, setPicks] = useState<Picks>({});
  const [wheel, setWheel] = useState<WheelDef | null>(null);
  const [request, setRequest] = useState<SpinRequest | null>(null);
  const [winner, setWinner] = useState<number | null>(null);
  const [phase, setPhase] = useState<'idle' | 'spinning' | 'result'>('idle');
  const [auto, setAuto] = useState(false);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState({ first: '', last: '' });
  const identRng = useRef(new Rng(mixSeed(seed, 'identity')));

  useEffect(() => {
    if (!world) {
      const t = setTimeout(() => ensureWorld(), 60);
      return () => clearTimeout(t);
    }
  }, [world, ensureWorld]);

  const done = step >= WHEEL_ORDER.length;

  useEffect(() => {
    if (!world || done) return;
    setWheel(buildWheel(WHEEL_ORDER[step], picks, world, rng.current));
    setWinner(null);
    setPhase('idle');
    // picks intentionally not a dependency: a wheel is built once per step.
  }, [step, world, done]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (done && world && !identity) setIdentity(rollIdentity(world, picks, identRng.current));
  }, [done, world, identity, picks]);

  const spin = useCallback(() => {
    if (!wheel || phase !== 'idle') return;
    const target = pickSlice(wheel, rng.current);
    setRequest({ id: Date.now() + Math.random(), target });
    setPhase('spinning');
  }, [wheel, phase]);

  useEffect(() => {
    if (auto && phase === 'idle' && wheel && !done) {
      const t = setTimeout(spin, 250);
      return () => clearTimeout(t);
    }
  }, [auto, phase, wheel, done, spin]);

  const onDone = useCallback(
    (index: number) => {
      if (!wheel) return;
      const slice = wheel.slices[index];
      setWinner(index);
      setPicks((p) => ({ ...p, [wheel.id]: slice }));
      setPhase('result');
      haptic.success();
      setTimeout(() => setStep((s) => s + 1), auto ? 650 : 1500);
    },
    [wheel, auto],
  );

  const skills = useMemo(() => (done ? rollSkills(picks, new Rng(mixSeed(seed, 'career'))) : null), [done, picks, seed]);

  const start = () => {
    if (!identity || !world) return;
    haptic.success();
    mutate((w) => startCareer(w, picks, identity, mixSeed(seed, 'career')));
    router.replace('/career');
  };

  if (!world) {
    return (
      <Screen scroll={false}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <ActivityIndicator color={C.red} size="large" />
          <Txt v="h2">Building the universe…</Txt>
          <Txt v="small" color={C.textDim} center>
            Simulating the seasons before your driver arrives
          </Txt>
        </View>
      </Screen>
    );
  }

  const size = Math.min(width - 36, 360);
  const current = wheel && winner !== null ? wheel.slices[winner] : null;

  // ---------------------------------------------------------------- Identity
  if (done && identity && skills) {
    const team = world.teams[String(picks.team?.value)];
    const s = seriesDef(String(picks.series?.value));
    const fam = family(String(picks.family?.value));
    const pers = personality(String(picks.personality?.value));
    const age = Number(picks.age?.value);
    const aggr = AGGRESSION_LEVELS.find((a) => a.value === Number(picks.aggression?.value));
    const pot = POTENTIALS.find((p) => p.value === Number(picks.potential?.value));
    const parent = identity.parentId ? world.drivers[identity.parentId] : undefined;
    const reroll = (gender?: 'm' | 'f') => {
      haptic.tap();
      const g = gender ?? identity.gender;
      if (gender && gender !== identity.gender) {
        const nat = String(picks.nation?.value);
        const nm = generateName(identRng.current, nat, g, parent?.last);
        setIdentity({ ...identity, gender: g, first: nm.first, last: nm.last, looks: generateLooks(identRng.current, nat, g) });
      } else {
        setIdentity({ ...identity, looks: generateLooks(identRng.current, String(picks.nation?.value), g) });
      }
    };
    return (
      <Screen
        tint={team?.colors.primary}
        header={<Header title="Your driver" sub="The wheels have spoken" onBack={() => router.replace('/')} />}
        footer={<Btn label="Start career" icon="flag" onPress={start} sub={`${team?.name} · ${s.name}`} />}
      >
        <Animated.View entering={FadeInDown.duration(500)}>
          <DriverCard
            d={{
              first: identity.first,
              last: identity.last,
              nation: String(picks.nation?.value),
              gender: identity.gender,
              looks: identity.looks,
              age,
              ovr: overall(skills),
              skills,
              number: identity.number,
              teamName: team?.name,
              seriesName: s.name,
              tags: [
                { label: `${fam.emoji} ${fam.label}` },
                { label: `${pers.emoji} ${pers.label}` },
                { label: `🔥 ${aggr?.label ?? 'Balanced'}` },
                { label: `📈 ${pot?.label ?? 'Solid'} potential` },
              ],
            }}
            colors={team?.colors}
          />
        </Animated.View>
        {parent ? (
          <Card style={{ marginTop: S.md }} accent={C.gold}>
            <Txt v="label" color={C.gold}>
              Racing blood
            </Txt>
            <Txt v="body" style={{ marginTop: 4 }}>
              Child of {parent.first} {parent.last}
              {parent.careerId ? ' — one of your own former drivers.' : ', a former race winner.'}
            </Txt>
          </Card>
        ) : null}
        <View style={{ flexDirection: 'row', gap: S.sm, marginTop: S.md }}>
          <Btn label="New look" icon="dice" kind="secondary" small onPress={() => reroll()} style={{ flex: 1 }} />
          <Btn
            label="Rename"
            icon="edit"
            kind="secondary"
            small
            onPress={() => {
              setNameDraft({ first: identity.first, last: identity.last });
              setRenaming(true);
            }}
            style={{ flex: 1 }}
          />
          <IconBtn icon="swap" size={48} onPress={() => reroll(identity.gender === 'm' ? 'f' : 'm')} />
        </View>
        <Card style={{ marginTop: S.md }}>
          <Txt v="label" color={C.textDim}>
            Wet weather · {WET_LABELS[Number(picks.wet?.value ?? 3) - 1]}
          </Txt>
          <Txt v="small" color={C.textDim} style={{ marginTop: 6 }}>
            {pers.description}
          </Txt>
          <Txt v="small" color={C.textDim} style={{ marginTop: 6 }}>
            {fam.description}
          </Txt>
        </Card>
        <Modal visible={renaming} transparent animationType="fade" onRequestClose={() => setRenaming(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 24 }}>
            <Card>
              <Txt v="h1">Rename driver</Txt>
              {(['first', 'last'] as const).map((k) => (
                <TextInput
                  key={k}
                  value={nameDraft[k]}
                  onChangeText={(v) => setNameDraft((d) => ({ ...d, [k]: v.slice(0, 20) }))}
                  placeholder={k === 'first' ? 'First name' : 'Last name'}
                  placeholderTextColor={C.textMute}
                  style={{ marginTop: 12, backgroundColor: C.surface2, color: C.text, borderRadius: R.sm, padding: 12, fontFamily: F.bodySemi, fontSize: 16 }}
                />
              ))}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
                <Btn label="Cancel" kind="ghost" small onPress={() => setRenaming(false)} style={{ flex: 1 }} />
                <Btn
                  label="Save"
                  small
                  onPress={() => {
                    const first = nameDraft.first.trim() || identity.first;
                    const last = nameDraft.last.trim() || identity.last;
                    setIdentity({ ...identity, first, last });
                    setRenaming(false);
                  }}
                  style={{ flex: 1 }}
                />
              </View>
            </Card>
          </View>
        </Modal>
      </Screen>
    );
  }

  // ---------------------------------------------------------------- Wheels
  const chips = WHEEL_ORDER.filter((w) => picks[w]).map((w) => {
    const p = picks[w]!;
    if (w === 'nation') return { key: w, label: p.label, flag: String(p.value) };
    if (p.stars) return { key: w, label: `${SHORT[w]} ${'★'.repeat(p.stars)}` };
    if (w === 'age') return { key: w, label: `Age ${p.label}`, emoji: '🎂' };
    if (w === 'wet') return { key: w, label: `Wet ${'★'.repeat(Number(p.value))}` };
    return { key: w, label: p.label, emoji: p.emoji };
  });

  return (
    <Screen
      scroll
      header={
        <Header
          title="Spin your driver"
          sub={`Wheel ${Math.min(step + 1, WHEEL_ORDER.length)} of ${WHEEL_ORDER.length}`}
          onBack={() => router.replace('/')}
          right={<IconBtn icon="ff" onPress={() => setAuto((a) => !a)} bg={auto ? C.red : C.surface2} />}
        />
      }
    >
      <View style={{ height: 4, backgroundColor: C.surface2, borderRadius: 2, overflow: 'hidden', marginBottom: S.md }}>
        <View style={{ width: `${(step / WHEEL_ORDER.length) * 100}%`, height: '100%', backgroundColor: C.red }} />
      </View>
      {wheel ? (
        <Animated.View key={wheel.id} entering={FadeIn.duration(350)} style={{ alignItems: 'center' }}>
          <Txt v="label" color={C.textDim}>
            {wheel.emoji} {wheel.blurb}
          </Txt>
          <Txt v="title" style={{ marginTop: 2 }}>
            {wheel.title}
          </Txt>
          <View style={{ height: 50, justifyContent: 'center' }}>
            {current ? (
              <Animated.View key={`r${winner}`} entering={ZoomIn.springify().damping(12)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                {current.flag ? <Flag id={current.flag} width={40} /> : current.emoji ? <Txt v="h1">{current.emoji}</Txt> : null}
                <Txt v="display" color={C.gold} style={{ fontSize: 38, lineHeight: 42 }}>
                  {current.stars ? '★'.repeat(current.stars) : current.label}
                </Txt>
              </Animated.View>
            ) : (
              <Txt v="display" color={withAlpha('#FFFFFF', 0.15)} style={{ fontSize: 38, lineHeight: 42 }}>
                {phase === 'spinning' ? '· · ·' : '?'}
              </Txt>
            )}
          </View>
          <View style={{ marginTop: 16 }}>
            <SpinWheel slices={wheel.slices} size={size} request={request} onDone={onDone} onPressHub={spin} disabled={phase !== 'idle'} fast={auto || spinSpeed === 'fast'} winner={winner} />
          </View>
        </Animated.View>
      ) : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: S.lg, justifyContent: 'center' }}>
        {chips.map((c) => (
          <PickChip key={c.key} label={c.label} flag={c.flag} emoji={c.emoji} />
        ))}
      </View>
      <View style={{ marginTop: S.lg, gap: S.sm }}>
        <Btn label={phase === 'spinning' ? 'Spinning…' : phase === 'result' ? 'Next wheel…' : 'Spin'} icon="refresh" onPress={spin} disabled={phase !== 'idle' || auto} />
        {!auto ? <Btn label="Spin all remaining" kind="ghost" small icon="ff" onPress={() => setAuto(true)} /> : null}
      </View>
      <View style={{ height: 8 }} />
      <Pill label={picks.series ? seriesDef(String(picks.series.value)).name : 'Your journey starts here'} color={C.surface2} textColor={C.textDim} style={{ alignSelf: 'center', marginTop: S.md }} />
    </Screen>
  );
}

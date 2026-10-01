/**
 * The payoff after twelve wheels: a driver file. Portrait, rating and nation
 * up top (readable in a glance), then identity and ability, then what the
 * paddock thinks of you and where you are starting. START CAREER never leaves
 * the thumb zone.
 */
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown, FadeInLeft, SlideInDown, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import { Flag } from '../art/Flag';
import { Portrait } from '../art/Portrait';
import { nation } from '../content/nations';
import { series as seriesDef } from '../content/series';
import { WET_LABELS, type Identity, type Picks, type WheelId } from '../sim/creation';
import { overall } from '../sim/drivers';
import type { Skills, TeamState, World } from '../sim/types';
import { Icon } from '../ui/Icon';
import { Backdrop, Btn, CountUp, IconBtn, NumberPlate, SectionTitle, SheetModal, StatBar, StatCell, TeamStripe, Txt } from '../ui/kit';
import { useScreen } from '../ui/screen';
import { C, F, R, ratingColor, S, withAlpha } from '../ui/theme';
import { describePick, sliceAccent } from './SpinHud';

interface Props {
  world: World;
  picks: Picks;
  identity: Identity;
  skills: Skills;
  onStart: () => void;
  onBack: () => void;
  onNewLook: () => void;
  onSwap: () => void;
  onRename: (first: string, last: string) => void;
}

/** Where the rookie stands: field average, car rank and a one-line read on the first season. */
function outlook(world: World, team: TeamState | undefined, sid: string, rating: number) {
  const teams = Object.values(world.teams)
    .filter((t) => t.series === sid)
    .sort((a, b) => b.perf - a.perf);
  const rank = team ? teams.findIndex((t) => t.id === team.id) + 1 : teams.length;
  const ids = teams.flatMap((t) => t.drivers).filter((id) => world.drivers[id]);
  const avg = ids.length ? ids.reduce((a, id) => a + overall(world.drivers[id].skills), 0) / ids.length : rating;
  const delta = rating - avg;
  const topCar = rank <= Math.ceil(teams.length / 3);
  let line: string;
  if (delta >= 4 && topCar) line = 'Title contender from the first race.';
  else if (delta >= 4) line = 'Faster than the car. Drag it into the points and get noticed.';
  else if (delta >= -2 && topCar) line = 'A good car and the pace to match it. Podiums are realistic.';
  else if (delta >= -2) line = 'A midfield fight. Points are the target, a podium a bonus.';
  else if (topCar) line = 'A great seat to learn in, if you can keep up with it.';
  else line = 'A steep learning curve. Survive, grow, get noticed.';
  return { rank, count: teams.length, avg: Math.round(avg), line };
}

/** One diagonal pass of light across the hero when the file opens. */
function Sweep({ width, height }: { width: number; height: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.set(withDelay(250, withTiming(1, { duration: 750, easing: Easing.inOut(Easing.cubic) })));
  }, [t]);
  const st = useAnimatedStyle(() => ({ transform: [{ translateX: -width * 0.6 + t.value * width * 1.8 }, { skewX: '-20deg' }], opacity: t.value < 1 ? 1 : 0 }));
  return (
    <Animated.View style={[{ position: 'absolute', top: 0, left: 0, width: width * 0.35, height, pointerEvents: 'none' }, st]}>
      <LinearGradient colors={[withAlpha('#FFFFFF', 0), withAlpha('#FFFFFF', 0.14), withAlpha('#FFFFFF', 0)]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
    </Animated.View>
  );
}

function TraitTile({ label, value, line, accent, delay }: { label: string; value: string; line: string; accent: string; delay: number }) {
  return (
    <Animated.View entering={FadeInDown.duration(300).delay(delay)} style={styles.tile}>
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
    </Animated.View>
  );
}

export function DriverReveal({ world, picks, identity, skills, onStart, onBack, onNewLook, onSwap, onRename }: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useScreen();
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState({ first: identity.first, last: identity.last });

  const team = world.teams[String(picks.team?.value)];
  const sid = String(picks.series?.value ?? team?.series ?? 'cadet');
  const s = seriesDef(sid);
  const nat = nation(String(picks.nation?.value));
  const age = Number(picks.age?.value);
  const rating = Math.round(overall(skills));
  const parent = identity.parentId ? world.drivers[identity.parentId] : undefined;
  const look = outlook(world, team, sid, rating);
  const tint = team?.colors.primary ?? C.red;
  const pick = (id: WheelId) => picks[id];
  const trait = (id: WheelId, fallback: string) => {
    const p = pick(id);
    return { value: p?.label ?? '—', line: p ? describePick(id, p, world) : '', accent: (p && sliceAccent(id, p)) ?? fallback };
  };
  const fam = trait('family', C.steel);
  const pers = trait('personality', C.steel);
  const style = trait('aggression', C.steel);
  const pot = trait('potential', C.steel);

  const heroH = Math.round(Math.min(330, width * 0.8));
  const portrait = Math.round(heroH * 0.94);
  const footerH = 62 + S.sm + S.md + insets.bottom;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Backdrop tint={tint} number={identity.number} intensity={0.9} />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top, paddingBottom: footerH + S.lg }} showsVerticalScrollIndicator={false} bounces={false} overScrollMode="never">
        {/* Top bar */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: S.sm, paddingHorizontal: S.lg, paddingTop: S.sm }}>
          <IconBtn icon="back" label="Back to home" onPress={onBack} />
          <View style={{ flex: 1 }}>
            <Txt v="micro" color={C.red}>
              Driver file
            </Txt>
            <Txt v="small" color={C.textDim} numberOfLines={1} style={{ fontSize: 12.5 }}>
              Rookie · {world.year + 1} season
            </Txt>
          </View>
          <IconBtn icon="dice" label="New look" onPress={onNewLook} />
          <IconBtn
            icon="edit"
            label="Rename"
            onPress={() => {
              setDraft({ first: identity.first, last: identity.last });
              setRenaming(true);
            }}
          />
          <IconBtn icon="swap" label="Swap gender" onPress={onSwap} />
        </View>

        {/* Hero: portrait, rating, nation */}
        <View style={{ height: heroH, marginTop: S.sm, overflow: 'hidden' }}>
          <Svg width={width} height={heroH} style={StyleSheet.absoluteFill}>
            <Defs>
              <RadialGradient id="revealLight" cx="0.5" cy="0.5" r="0.5">
                <Stop offset="0" stopColor={tint} stopOpacity="0.55" />
                <Stop offset="0.55" stopColor={tint} stopOpacity="0.14" />
                <Stop offset="1" stopColor={tint} stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Ellipse cx={width * 0.34} cy={heroH * 0.52} rx={width * 0.52} ry={heroH * 0.56} fill="url(#revealLight)" />
          </Svg>
          {/* Team colours as accents: two diagonal bars behind the bust */}
          <View
            style={{ position: 'absolute', left: width * 0.06, top: -20, bottom: -20, width: 10, backgroundColor: withAlpha(team?.colors.primary ?? C.red, 0.85), transform: [{ skewX: '-18deg' }] }}
          />
          <View
            style={{
              position: 'absolute',
              left: width * 0.06 + 16,
              top: -20,
              bottom: -20,
              width: 4,
              backgroundColor: withAlpha(team?.colors.secondary ?? C.text, 0.7),
              transform: [{ skewX: '-18deg' }],
            }}
          />
          <Animated.View entering={FadeInDown.duration(450)} style={{ position: 'absolute', left: width * 0.02, bottom: -portrait * 0.04 }}>
            <Portrait looks={identity.looks} gender={identity.gender} suit={team?.colors} size={portrait} age={age} shape="none" bg="none" />
          </Animated.View>
          <LinearGradient colors={[withAlpha(C.bg, 0), C.bg]} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: heroH * 0.22 }} />

          {/* Rating column */}
          <View style={{ position: 'absolute', right: S.lg, top: S.md, alignItems: 'flex-end', gap: 10 }}>
            <View style={{ alignItems: 'flex-end' }}>
              <Txt v="micro" color={C.textDim}>
                Overall
              </Txt>
              <CountUp value={rating} duration={900} delay={300} color={ratingColor(rating)} style={{ fontSize: 84, lineHeight: 84, letterSpacing: -2 }} />
            </View>
            <Animated.View entering={FadeIn.delay(450)} style={{ alignItems: 'flex-end', gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Txt v="label" color={C.text}>
                  {nat.name}
                </Txt>
                <Flag id={nat.id} width={30} />
              </View>
              <Txt v="label" color={C.textDim}>
                Age {age}
              </Txt>
              <NumberPlate number={identity.number} colors={team?.colors} size={38} />
            </Animated.View>
          </View>
          <Sweep width={width} height={heroH} />
        </View>

        {/* Identity */}
        <View style={{ paddingHorizontal: S.lg, marginTop: -S.xl }}>
          <Animated.View entering={FadeInLeft.duration(350).delay(150)}>
            <Text style={styles.first} numberOfLines={1}>
              {identity.first}
            </Text>
            <Text style={styles.last} numberOfLines={1} adjustsFontSizeToFit>
              {identity.last}
            </Text>
          </Animated.View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <TeamStripe colors={team?.colors} height={16} width={5} />
            <Txt v="bodyStrong" numberOfLines={1} style={{ flexShrink: 1 }}>
              {team?.name ?? 'No seat'}
            </Txt>
            <Txt v="small" color={C.textDim} numberOfLines={1} style={{ flexShrink: 1 }}>
              · {s.name}
            </Txt>
          </View>

          {/* Ability */}
          <SectionTitle
            title="Ability"
            style={{ marginTop: S.lg, marginBottom: S.sm }}
            right={
              <Txt v="micro" color={C.textMute}>
                {WET_LABELS[Number(picks.wet?.value ?? 3) - 1]}
              </Txt>
            }
          />
          <View style={styles.grid}>
            {(
              [
                ['Pace', skills.pace],
                ['Racecraft', skills.racecraft],
                ['Consistency', skills.consistency],
                ['Wet', skills.wet],
              ] as const
            ).map(([label, v], i) => (
              <View key={label} style={styles.cell}>
                <StatBar label={label} value={Math.round(v)} compact delay={350 + i * 110} />
              </View>
            ))}
          </View>

          {/* Personality */}
          <SectionTitle title="Personality" style={{ marginTop: S.lg, marginBottom: S.sm }} />
          <View style={styles.grid}>
            <TraitTile label="Family" value={fam.value} line={fam.line} accent={fam.accent} delay={500} />
            <TraitTile label="Known as" value={pers.value} line={pers.line} accent={pers.accent} delay={560} />
            <TraitTile label="Driving style" value={style.value} line={style.line} accent={style.accent} delay={620} />
            <TraitTile label="Potential" value={pot.value} line={pot.line} accent={pot.accent} delay={680} />
          </View>

          {parent ? (
            <Animated.View entering={FadeInDown.duration(300).delay(700)} style={[styles.strip, { marginTop: S.sm, borderColor: withAlpha(C.gold, 0.35) }]}>
              <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: C.gold }} />
              <Icon name="crown" size={20} color={C.gold} strokeWidth={2.2} />
              <View style={{ flex: 1 }}>
                <Txt v="micro" color={C.gold}>
                  Racing blood
                </Txt>
                <Txt v="small" color={C.text} style={{ fontSize: 13.5 }}>
                  Child of {parent.first} {parent.last}
                  {parent.careerId ? ', one of your own former drivers.' : ', a former race winner.'}
                </Txt>
              </View>
            </Animated.View>
          ) : null}

          {/* Team & championship */}
          <SectionTitle title="First season" style={{ marginTop: S.lg, marginBottom: S.sm }} />
          <View style={[styles.strip, { flexDirection: 'column', alignItems: 'stretch', gap: 12 }]}>
            <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: team?.colors.primary ?? C.steel }} />
            <Txt v="bodyStrong" style={{ fontSize: 15.5 }}>
              {look.line}
            </Txt>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <StatCell label="You" value={rating} color={ratingColor(rating)} size={26} />
              <StatCell label="Field avg" value={look.avg} size={26} align="center" />
              <StatCell label="Car" value={`${look.rank}/${look.count}`} size={26} align="center" />
              <StatCell label="Series" value={s.short} size={26} align="right" />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky launch */}
      <Animated.View entering={SlideInDown.duration(320).delay(500)} style={[styles.footer, { paddingBottom: insets.bottom + S.md }]}>
        <LinearGradient colors={[withAlpha(C.bg, 0), C.bg]} style={{ position: 'absolute', left: 0, right: 0, top: -30, height: 30, pointerEvents: 'none' }} />
        <Btn label="Start career" icon="flag" sub={`${team?.name ?? s.name} · ${s.name}`} onPress={onStart} testID="start-career" />
      </Animated.View>

      <SheetModal visible={renaming} onClose={() => setRenaming(false)}>
        <Txt v="h1">Rename driver</Txt>
        <Txt v="small" color={C.textDim} style={{ marginTop: 2 }}>
          The wheels chose the rest. The name is yours.
        </Txt>
        {(['first', 'last'] as const).map((k) => (
          <TextInput
            key={k}
            value={draft[k]}
            onChangeText={(v) => setDraft((d) => ({ ...d, [k]: v.slice(0, 20) }))}
            placeholder={k === 'first' ? 'First name' : 'Last name'}
            placeholderTextColor={C.textMute}
            autoCapitalize="words"
            style={styles.input}
          />
        ))}
        <View style={{ flexDirection: 'row', gap: S.sm, marginTop: S.lg }}>
          <Btn label="Cancel" kind="ghost" small onPress={() => setRenaming(false)} style={{ flex: 1 }} />
          <Btn
            label="Save"
            small
            onPress={() => {
              onRename(draft.first.trim() || identity.first, draft.last.trim() || identity.last);
              setRenaming(false);
            }}
            style={{ flex: 1 }}
          />
        </View>
      </SheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  first: {
    fontFamily: F.title,
    fontSize: 22,
    lineHeight: 24,
    color: C.textDim,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  last: {
    fontFamily: F.display,
    fontSize: 54,
    lineHeight: 56,
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
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: R.sm,
    paddingLeft: 15,
    paddingRight: 12,
    paddingVertical: 12,
    overflow: 'hidden',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: S.lg,
    paddingTop: S.sm,
    backgroundColor: C.bg,
  },
  input: {
    marginTop: S.md,
    height: 50,
    backgroundColor: C.surface2,
    color: C.text,
    borderRadius: R.sm,
    borderWidth: 1,
    borderColor: C.lineStrong,
    paddingHorizontal: 14,
    fontFamily: F.bodySemi,
    fontSize: 17,
  },
});

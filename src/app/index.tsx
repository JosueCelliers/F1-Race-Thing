import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { useWindowDimensions, View } from 'react-native';
import Animated, { Easing, FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { ChequeredMark } from '../art/Badges';
import { CarSide } from '../art/Car';
import { Flag } from '../art/Flag';
import { Portrait } from '../art/Portrait';
import { series as seriesDef } from '../content/series';
import { ageOf, fullName, ovr } from '../sim/drivers';
import { useGame, useWorld } from '../state/store';
import { OvrBadge } from '../ui/DriverCard';
import { Icon, type IconName } from '../ui/Icon';
import { Btn, Card, IconBtn, Press, Screen, Txt } from '../ui/kit';
import { C, F, R, S, withAlpha } from '../ui/theme';

function Hero() {
  const { width } = useWindowDimensions();
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [t]);
  const car = useAnimatedStyle(() => ({ transform: [{ translateX: -8 + t.value * 16 }, { translateY: Math.sin(t.value * Math.PI) * -2 }] }));
  const streaks = useAnimatedStyle(() => ({ opacity: 0.35 + t.value * 0.4, transform: [{ translateX: -t.value * 30 }] }));
  const w = Math.min(width - 32, 420);
  return (
    <View style={{ height: w * 0.42, justifyContent: 'center', alignItems: 'center', marginTop: S.md }}>
      <Animated.View style={[{ position: 'absolute', left: 0, right: 0, top: w * 0.12, gap: 10 }, streaks]}>
        {[0.6, 0.9, 0.4, 0.75].map((o, i) => (
          <LinearGradient
            key={i}
            colors={['transparent', withAlpha(i % 2 ? C.red : '#FFFFFF', o * 0.6)]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ height: 2, width: w * (0.5 + i * 0.1), marginLeft: i * 12 }}
          />
        ))}
      </Animated.View>
      <Animated.View style={car}>
        <CarSide
          carClass="formula"
          colors={{ primary: '#E10613', secondary: '#FFFFFF', accent: '#FFC940' }}
          livery="arrow"
          number={1}
          helmet={{ pattern: 'halo', colors: ['#FFFFFF', '#E10613', '#FFC940'] }}
          width={w * 0.95}
        />
      </Animated.View>
    </View>
  );
}

function Tile({ icon, title, sub, onPress, color }: { icon: IconName; title: string; sub: string; onPress: () => void; color: string }) {
  return (
    <Press onPress={onPress} style={{ flex: 1 }}>
      <View style={{ backgroundColor: C.surface, borderRadius: R.lg, padding: 14, borderWidth: 1, borderColor: C.line, gap: 10, minHeight: 110 }}>
        <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: withAlpha(color, 0.16), alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} color={color} size={21} />
        </View>
        <View>
          <Txt v="h3">{title}</Txt>
          <Txt v="small" color={C.textDim} numberOfLines={1}>
            {sub}
          </Txt>
        </View>
      </View>
    </Press>
  );
}

export default function Home() {
  const world = useWorld();
  const archiveCount = useGame((s) => Object.keys(s.archive).length);
  const a = world?.active;
  const me = a ? world!.drivers[a.driverId] : undefined;
  const team = me?.contract ? world!.teams[me.contract.team] : undefined;
  const s = me?.contract ? seriesDef(me.contract.series) : undefined;

  return (
    <Screen
      footer={
        <Txt v="small" color={C.textMute} center>
          {world ? `Universe year ${world.year}${world.careers.length ? ` · ${world.careers.length} career${world.careers.length > 1 ? 's' : ''} in the books` : ''}` : 'A new universe awaits'}
        </Txt>
      }
    >
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: S.sm }}>
        <IconBtn icon="settings" onPress={() => router.push('/settings')} />
      </View>
      <Animated.View entering={FadeInDown.duration(600)} style={{ alignItems: 'center', marginTop: S.sm }}>
        <ChequeredMark size={44} />
        <Txt v="display" style={{ fontSize: 50, lineHeight: 50, marginTop: 6 }}>
          Chequered
        </Txt>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 28, height: 4, backgroundColor: C.red, transform: [{ skewX: '-20deg' }] }} />
          <Txt v="display" color={C.red} style={{ fontSize: 50, lineHeight: 52 }}>
            Lives
          </Txt>
          <View style={{ width: 28, height: 4, backgroundColor: C.red, transform: [{ skewX: '-20deg' }] }} />
        </View>
        <Txt v="label" color={C.textDim} style={{ marginTop: 6 }}>
          Spin a driver · Live the career · Build a legacy
        </Txt>
      </Animated.View>

      <Hero />

      <Animated.View entering={FadeInUp.delay(150).duration(500)} style={{ gap: S.md }}>
        {a && me ? (
          <Card style={{ padding: 14, borderColor: withAlpha(team?.colors.primary ?? C.red, 0.6) }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Portrait looks={me.looks} gender={me.gender} suit={team?.colors} size={62} age={ageOf(me, world!.year)} />
              <View style={{ flex: 1 }}>
                <Txt v="label" color={C.textDim}>
                  Current career
                </Txt>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Flag id={me.nation} width={18} />
                  <Txt v="h2" numberOfLines={1} style={{ flex: 1 }}>
                    {fullName(me)}
                  </Txt>
                </View>
                <Txt v="small" color={C.textDim} numberOfLines={1}>
                  {world!.year} · {s?.name ?? 'Free agent'}
                  {team ? ` · ${team.name}` : ''}
                </Txt>
              </View>
              <OvrBadge ovr={ovr(me)} size={0.7} />
            </View>
            <Btn label="Continue career" icon="play" style={{ marginTop: 12 }} onPress={() => router.push('/career')} />
          </Card>
        ) : (
          <Btn label="Spin a new driver" icon="dice" onPress={() => router.push('/create')} sub={world?.careers.length ? 'The world has moved on. Who is next?' : 'Twelve wheels decide who you are'} />
        )}
        <View style={{ flexDirection: 'row', gap: S.md }}>
          <Tile
            icon="archive"
            title="The Archive"
            sub={archiveCount ? `${archiveCount} career${archiveCount > 1 ? 's' : ''}` : 'Your past lives'}
            color={C.gold}
            onPress={() => router.push('/archive')}
          />
          <Tile icon="globe" title="The World" sub="Champions & records" color={C.cyan} onPress={() => router.push('/world')} />
        </View>
      </Animated.View>
      <Txt v="small" color={C.textMute} center style={{ marginTop: S.lg, fontFamily: F.body }}>
        All championships, teams and drivers are fictional.
      </Txt>
    </Screen>
  );
}

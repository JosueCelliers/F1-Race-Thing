/**
 * Special cinematics: race start (lights out), pit stop, podium and title.
 */
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import Svg, { Path, Rect, Text as SvgText } from 'react-native-svg';
import { Trophy } from '../art/Badges';
import { CarTop } from '../art/Car';
import { Helmet } from '../art/Helmet';
import { TEAMS } from '../content/teams';
import { environment } from '../content/environments';
import type { HighlightSpec } from '../sim/types';
import { Txt } from '../ui/kit';
import { C, F, shade } from '../ui/theme';
import { Particles, type Emitter } from './fx';
import { kf, seeded } from './kit';

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

function Light({ prog, on }: { prog: SharedValue<number>; on: number }) {
  const style = useAnimatedStyle(() => {
    const lit = prog.value >= on && prog.value < 0.62;
    return { backgroundColor: lit ? '#FF1E2D' : '#2A0A0E', shadowOpacity: lit ? 0.9 : 0 };
  });
  return <Animated.View style={[{ width: 20, height: 20, borderRadius: 10, shadowColor: '#FF1E2D', shadowRadius: 10, shadowOffset: { width: 0, height: 0 } }, style]} />;
}

function GridCar({ prog, x, y, launch, children }: { prog: SharedValue<number>; x: number; y: number; launch: number; children: React.ReactNode }) {
  const style = useAnimatedStyle(() => {
    const t = Math.max(0, prog.value - 0.62 - launch);
    return { transform: [{ translateX: x }, { translateY: y - t * t * 2600 }, { rotate: '-90deg' }] };
  });
  return <Animated.View style={[{ position: 'absolute', left: 0, top: 0 }, style]}>{children}</Animated.View>;
}

export function StartScene({ spec, prog, W, H }: { spec: HighlightSpec; prog: SharedValue<number>; W: number; H: number }) {
  const env = environment(spec.env);
  const oval = spec.caption.includes('GREEN');
  const carW = W * 0.24;
  const carH = carW * 0.4;
  const player = spec.actors[0];
  const slots = useMemo(() => {
    const r = seeded(spec.seed);
    const out: { x: number; y: number; colors: (typeof TEAMS)[number]['colors']; livery: string; player: boolean; launch: number }[] = [];
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 2; col++) {
        const isPlayer = row === 1 && col === 0;
        const t = TEAMS[Math.floor(r() * TEAMS.length)];
        out.push({
          x: W * (col === 0 ? 0.34 : 0.62) - carW / 2,
          y: H * 0.5 + row * carW * 1.02 + (col ? carW * 0.5 : 0),
          colors: isPlayer && player ? player.colors : t.colors,
          livery: isPlayer && player ? player.livery : t.livery,
          player: isPlayer,
          launch: r() * 0.04,
        });
      }
    }
    return out;
  }, [spec.seed, W, H, carW, player]);
  const emitters: Emitter[] = slots.map((s, i) => ({ t0: 0.62, t1: 0.72, x: s.x + carW / 2, y: s.y + carW * 0.55, count: 5, kind: 'smoke', seed: 30 + i }));
  const flagStyle = useAnimatedStyle(() => ({ opacity: prog.value > 0.55 ? 1 : 0, transform: [{ rotate: `${Math.sin(prog.value * 50) * 20}deg` }] }));
  return (
    <View style={{ width: W, height: H, overflow: 'hidden', backgroundColor: spec.night ? '#15171D' : '#2E3139' }}>
      <Svg width={W} height={H} style={{ position: 'absolute' }}>
        <Rect x={0} y={0} width={W * 0.12} height={H} fill={spec.night ? shade(env.ground, -0.5) : env.ground} />
        <Rect x={W * 0.88} y={0} width={W * 0.12} height={H} fill={spec.night ? shade(env.ground, -0.5) : env.ground} />
        {Array.from({ length: 30 }, (_, i) => (
          <Rect key={`k${i}`} x={W * 0.11} y={i * (H / 30)} width={W * 0.025} height={H / 30} fill={i % 2 ? env.kerb[0] : env.kerb[1]} />
        ))}
        {Array.from({ length: 30 }, (_, i) => (
          <Rect key={`r${i}`} x={W * 0.865} y={i * (H / 30)} width={W * 0.025} height={H / 30} fill={i % 2 ? env.kerb[0] : env.kerb[1]} />
        ))}
        {slots.map((s, i) => (
          <Path key={i} d={`M${s.x - 6} ${s.y - 8} l${carW * 0.5} 0 M${s.x - 6} ${s.y - 8} l0 ${carW * 0.3}`} stroke="#FFFFFF" strokeWidth={3} opacity={0.7} />
        ))}
        <Rect x={W * 0.12} y={H * 0.44} width={W * 0.76} height={10} fill="#FFFFFF" opacity={0.9} />
        {Array.from({ length: 16 }, (_, i) => (
          <Rect key={`c${i}`} x={W * 0.12 + i * ((W * 0.76) / 16)} y={H * 0.44} width={(W * 0.76) / 32} height={10} fill="#111" />
        ))}
        <SvgText x={W * 0.5} y={H * 0.42} fontSize={14} fontFamily={F.heading} fill="#FFFFFF" opacity={0.6} textAnchor="middle">
          START
        </SvgText>
      </Svg>
      {slots.map((s, i) => (
        <GridCar key={i} prog={prog} x={s.x} y={s.y} launch={s.player ? 0 : s.launch}>
          <View style={{ width: carW, height: carH }}>
            {s.player ? <View style={{ position: 'absolute', left: -6, top: -6, right: -6, bottom: -6, borderRadius: 14, borderWidth: 2, borderColor: '#FFFFFF', opacity: 0.8 }} /> : null}
            <CarTop carClass={spec.carClass} colors={s.colors} livery={s.livery} helmet={s.player ? player?.helmet : undefined} number={s.player ? player?.number : undefined} width={carW} />
          </View>
        </GridCar>
      ))}
      <Particles prog={prog} emitters={emitters} />
      {oval ? (
        <Animated.View style={[{ position: 'absolute', top: H * 0.08, left: W / 2 - 40, width: 80, height: 54, backgroundColor: '#24D17E', borderRadius: 4 }, flagStyle]} />
      ) : (
        <View style={{ position: 'absolute', top: H * 0.08, left: W / 2 - 100, width: 200, paddingVertical: 10, backgroundColor: '#0A0B0F', borderRadius: 12, flexDirection: 'row', justifyContent: 'space-evenly', borderWidth: 2, borderColor: '#2A2D36' }}>
          {[0, 1, 2, 3, 4].map((k) => (
            <View key={k} style={{ gap: 6, alignItems: 'center' }}>
              <Light prog={prog} on={0.08 + k * 0.1} />
              <Light prog={prog} on={0.08 + k * 0.1} />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Pit stop
// ---------------------------------------------------------------------------

function Crew({ prog, x, y, color, phase }: { prog: SharedValue<number>; x: number; y: number; color: string; phase: number }) {
  const style = useAnimatedStyle(() => {
    const active = prog.value > 0.28 && prog.value < 0.6;
    const j = active ? Math.sin(prog.value * 120 + phase) * 2 : 0;
    return { transform: [{ translateX: x + j }, { translateY: y }] };
  });
  return (
    <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width: 16, height: 16, borderRadius: 8, backgroundColor: color, borderWidth: 2, borderColor: '#FFFFFF' }, style]} />
  );
}

export function PitScene({ spec, prog, W, H }: { spec: HighlightSpec; prog: SharedValue<number>; W: number; H: number }) {
  const actor = spec.actors[0];
  const carW = W * 0.5;
  const carH = carW * 0.4;
  const boxY = H * 0.5;
  const stopX = W * 0.5 - carW / 2;
  const stopTime = useMemo(() => 2.1 + (spec.seed % 17) / 10, [spec.seed]);
  const carStyle = useAnimatedStyle(() => {
    const x = kf(prog.value, [
      [0, -carW - 20],
      [0.26, stopX],
      [0.62, stopX],
      [1, W + 40],
    ]);
    return { transform: [{ translateX: x }, { translateY: boxY - carH / 2 }] };
  });
  const [timerText, setTimerText] = React.useState('0.0');
  React.useEffect(() => {
    let raf = 0;
    const loop = () => {
      const p = prog.value;
      const t = p < 0.28 ? 0 : p > 0.6 ? stopTime : ((p - 0.28) / 0.32) * stopTime;
      setTimerText(t.toFixed(1));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [prog, stopTime]);
  const col = actor?.colors.primary ?? C.red;
  const crew = [
    [-0.02, -0.55],
    [0.62, -0.55],
    [-0.02, 1.25],
    [0.62, 1.25],
    [0.9, 0.3],
    [-0.2, 0.3],
    [0.12, -0.6],
    [0.12, 1.3],
  ];
  return (
    <View style={{ width: W, height: H, overflow: 'hidden', backgroundColor: '#2A2D35' }}>
      <Svg width={W} height={H} style={{ position: 'absolute' }}>
        <Rect x={0} y={H * 0.1} width={W} height={H * 0.24} fill="#1A1C22" />
        <Rect x={W * 0.2} y={H * 0.1} width={W * 0.6} height={H * 0.24} fill={shade(col, -0.5)} />
        <SvgText x={W * 0.5} y={H * 0.25} fontSize={H * 0.07} fontFamily={F.display} fill="#FFFFFF" opacity={0.85} textAnchor="middle">
          {actor?.short ?? 'PIT'}
        </SvgText>
        <Rect x={0} y={H * 0.34} width={W} height={4} fill="#FFD400" />
        <Rect x={W * 0.2} y={boxY - carH} width={W * 0.6} height={carH * 2} fill="none" stroke="#FFFFFF" strokeWidth={3} strokeDasharray="10 8" opacity={0.6} />
        <Rect x={0} y={H * 0.82} width={W} height={4} fill="#FFFFFF" opacity={0.5} />
      </Svg>
      <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width: carW, height: carH }, carStyle]}>
        {actor ? <CarTop carClass={spec.carClass} colors={actor.colors} livery={actor.livery} number={actor.number} helmet={actor.helmet} width={carW} /> : null}
      </Animated.View>
      {crew.map(([cx, cy], i) => (
        <Crew key={i} prog={prog} x={stopX + cx * carW} y={boxY + cy * carH * 0.5 - 8} color={col} phase={i} />
      ))}
      <View style={{ position: 'absolute', right: 16, top: H * 0.38, backgroundColor: '#0A0B0F', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#2A2D36' }}>
        <Txt v="numBig" color={C.gold} style={{ fontSize: 28 }}>
          {timerText}s
        </Txt>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Podium & title
// ---------------------------------------------------------------------------

function Rise({ prog, from, at, children, style }: { prog: SharedValue<number>; from: number; at: number; children: React.ReactNode; style?: object }) {
  const a = useAnimatedStyle(() => {
    const t = Math.min(1, Math.max(0, (prog.value - at) / 0.18));
    const e = 1 - Math.pow(1 - t, 3);
    return { opacity: t, transform: [{ translateY: (1 - e) * from }, { scale: 0.85 + e * 0.15 }] };
  });
  return <Animated.View style={[style, a]}>{children}</Animated.View>;
}

export function PodiumScene({ spec, prog, W, H }: { spec: HighlightSpec; prog: SharedValue<number>; W: number; H: number }) {
  const blocks = [
    { pos: 2, x: W * 0.08, h: H * 0.2 },
    { pos: 1, x: W * 0.36, h: H * 0.29 },
    { pos: 3, x: W * 0.64, h: H * 0.15 },
  ];
  const bw = W * 0.28;
  const emitters: Emitter[] = [
    { t0: 0.45, t1: 0.95, x: W * 0.5, y: H * 0.5, count: 50, kind: 'champagne', dir: -Math.PI / 2 - 0.5, spread: 0.35, speed: 300, seed: 41 },
    { t0: 0.35, t1: 0.9, x: W * 0.5, y: H * 0.05, count: 50, kind: 'confetti', dir: Math.PI / 2, spread: 1.4, speed: 120, seed: 42 },
  ];
  return (
    <View style={{ width: W, height: H, overflow: 'hidden' }}>
      <LinearGradient colors={['#1B2440', '#0A0D16']} style={{ position: 'absolute', left: 0, top: 0, width: W, height: H }} />
      {[0.15, 0.5, 0.85].map((x, i) => (
        <View key={i} style={{ position: 'absolute', left: W * x - 60, top: -40, width: 120, height: H * 0.9, backgroundColor: '#FFFFFF', opacity: 0.05, transform: [{ rotate: `${(i - 1) * 12}deg` }] }} />
      ))}
      {blocks.map((b, i) => {
        const actor = spec.actors[b.pos - 1];
        return (
          <Rise key={b.pos} prog={prog} from={H * 0.3} at={0.05 + i * 0.08} style={{ position: 'absolute', left: b.x, bottom: 0, width: bw, alignItems: 'center' }}>
            {actor ? <Helmet design={actor.helmet} size={bw * 0.62} /> : null}
            {actor ? (
              <Txt v="h3" center numberOfLines={1} color={actor.isPlayer ? C.gold : C.text} style={{ marginBottom: 4 }}>
                {actor.short}
              </Txt>
            ) : null}
            <LinearGradient colors={['#E8ECF4', '#9AA3B5']} style={{ width: bw, height: b.h, alignItems: 'center', paddingTop: 8, borderTopLeftRadius: 6, borderTopRightRadius: 6 }}>
              <Txt v="display" color="#1B2233" style={{ fontSize: 40 }}>
                {b.pos}
              </Txt>
            </LinearGradient>
          </Rise>
        );
      })}
      <Rise prog={prog} from={-40} at={0.3} style={{ position: 'absolute', left: W / 2 - 34, top: H * 0.1 }}>
        <Trophy size={68} />
      </Rise>
      <Particles prog={prog} emitters={emitters} />
    </View>
  );
}

function Rays({ prog, W, H }: { prog: SharedValue<number>; W: number; H: number }) {
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${prog.value * 60}deg` }] }));
  const size = Math.max(W, H) * 1.6;
  const rays = Array.from({ length: 16 }, (_, i) => {
    const a0 = (i * Math.PI * 2) / 16;
    const a1 = a0 + Math.PI / 32;
    const r = size / 2;
    return `M${r} ${r} L${r + Math.cos(a0) * r} ${r + Math.sin(a0) * r} L${r + Math.cos(a1) * r} ${r + Math.sin(a1) * r}Z`;
  });
  return (
    <Animated.View style={[{ position: 'absolute', left: W / 2 - size / 2, top: H * 0.42 - size / 2, width: size, height: size }, style]}>
      <Svg width={size} height={size}>
        {rays.map((d, i) => (
          <Path key={i} d={d} fill="#FFC940" opacity={0.08} />
        ))}
      </Svg>
    </Animated.View>
  );
}

export function TitleScene({ spec, prog, W, H }: { spec: HighlightSpec; prog: SharedValue<number>; W: number; H: number }) {
  const actor = spec.actors[0];
  const emitters: Emitter[] = useMemo(() => {
    const r = seeded(spec.seed);
    const list: Emitter[] = [];
    for (let i = 0; i < 5; i++) {
      list.push({ t0: 0.2 + i * 0.13, t1: 0.22 + i * 0.13, x: W * (0.15 + r() * 0.7), y: H * (0.12 + r() * 0.25), count: 26, kind: 'firework', seed: 50 + i });
    }
    list.push({ t0: 0.3, t1: 0.95, x: W / 2, y: -10, count: 60, kind: 'confetti', dir: Math.PI / 2, spread: 1.5, speed: 140, seed: 60 });
    return list;
  }, [spec.seed, W, H]);
  const trophy = useAnimatedStyle(() => {
    const t = Math.min(1, Math.max(0, (prog.value - 0.08) / 0.3));
    const bounce = 1 + Math.sin(t * Math.PI) * 0.12;
    return { opacity: t, transform: [{ translateY: (1 - t) * 120 }, { scale: (0.6 + t * 0.4) * bounce }] };
  });
  return (
    <View style={{ width: W, height: H, overflow: 'hidden' }}>
      <LinearGradient colors={['#2A1F05', '#0A0806']} style={{ position: 'absolute', left: 0, top: 0, width: W, height: H }} />
      <Rays prog={prog} W={W} H={H} />
      <Animated.View style={[{ position: 'absolute', left: W / 2 - 70, top: H * 0.16, alignItems: 'center' }, trophy]}>
        <Trophy size={140} />
      </Animated.View>
      {actor ? (
        <Rise prog={prog} from={40} at={0.35} style={{ position: 'absolute', left: W / 2 - 40, top: H * 0.62, alignItems: 'center' }}>
          <Helmet design={actor.helmet} size={80} />
        </Rise>
      ) : null}
      <Particles prog={prog} emitters={emitters} />
    </View>
  );
}

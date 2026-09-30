/**
 * Particle and screen effects for highlights: smoke, sparks, debris, spray,
 * confetti, rain streaks and speed lines. Particles are deterministic (seeded)
 * and driven by the scene's progress value on the UI thread.
 */
import React, { useMemo } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { seeded } from './kit';

export interface Emitter {
  /** Emission window in scene progress. */
  t0: number;
  t1: number;
  /** Origin in scene px (may follow a moving object via originX/originY keys). */
  x: number;
  y: number;
  count: number;
  kind: 'smoke' | 'spark' | 'debris' | 'dust' | 'spray' | 'confetti' | 'champagne' | 'firework' | 'flame';
  /** Life of each particle as a fraction of the scene. */
  life?: number;
  spread?: number;
  dir?: number;
  speed?: number;
  colors?: string[];
  size?: number;
  /** Horizontal drift per unit progress (e.g. scrolling world). */
  drift?: number;
  seed?: number;
  /** Moving origin: evaluated at each particle's birth time (JS side). */
  origin?: (t: number) => [number, number];
}

interface P {
  ox: number;
  oy: number;
  born: number;
  life: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  spin: number;
  gravity: number;
  grow: number;
}

const DEFAULTS: Record<Emitter['kind'], { life: number; speed: number; size: number; colors: string[]; gravity: number; grow: number; spread: number }> = {
  smoke: { life: 0.35, speed: 60, size: 16, colors: ['#E8ECF2', '#CBD2DC', '#F4F6F9'], gravity: -40, grow: 2.6, spread: 0.8 },
  dust: { life: 0.4, speed: 90, size: 18, colors: ['#D9B982', '#C7A46A', '#E6CC9C'], gravity: -20, grow: 2.4, spread: 1.4 },
  spark: { life: 0.12, speed: 320, size: 3, colors: ['#FFE08A', '#FFB020', '#FFFFFF'], gravity: 260, grow: 0.3, spread: 1.2 },
  debris: { life: 0.4, speed: 240, size: 6, colors: ['#1E2027', '#3A3D48'], gravity: 420, grow: 1, spread: 1.6 },
  spray: { life: 0.18, speed: 140, size: 9, colors: ['#DCEFFF', '#FFFFFF'], gravity: -10, grow: 2.2, spread: 0.5 },
  confetti: { life: 0.6, speed: 240, size: 7, colors: ['#FFC940', '#FF2D46', '#3BA7FF', '#24D17E', '#FFFFFF', '#A874FF'], gravity: 200, grow: 1, spread: 1.2 },
  champagne: { life: 0.3, speed: 260, size: 5, colors: ['#FFF3C4', '#FFE08A', '#FFFFFF'], gravity: 340, grow: 1.2, spread: 0.45 },
  firework: { life: 0.28, speed: 200, size: 4, colors: ['#FFC940', '#FF5FA2', '#2EE6D6', '#FFFFFF'], gravity: 80, grow: 0.6, spread: Math.PI },
  flame: { life: 0.12, speed: 60, size: 12, colors: ['#FF8A1F', '#FFC940', '#FF3B30'], gravity: -120, grow: 0.4, spread: 0.6 },
};

function Particle({ p, prog, e }: { p: P; prog: SharedValue<number>; e: Emitter }) {
  const d = DEFAULTS[e.kind];
  const round = e.kind !== 'debris' && e.kind !== 'confetti' && e.kind !== 'spark';
  const style = useAnimatedStyle(() => {
    const t = (prog.value - p.born) / p.life;
    if (t < 0 || t > 1) return { opacity: 0 };
    const secs = t * p.life * 4;
    const x = p.ox + p.vx * secs + (e.drift ?? 0) * (prog.value - p.born);
    const y = p.oy + p.vy * secs + 0.5 * p.gravity * secs * secs;
    const s = 1 + (p.grow - 1) * t;
    const fade = e.kind === 'smoke' || e.kind === 'dust' || e.kind === 'spray' ? (1 - t) * 0.75 : t > 0.7 ? (1 - t) / 0.3 : 1;
    return {
      opacity: fade,
      transform: [{ translateX: x - p.size / 2 }, { translateY: y - p.size / 2 }, { scale: s }, { rotate: `${p.spin * t}deg` }],
    };
  });
  void d;
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: 0,
          top: 0,
          width: e.kind === 'spark' ? p.size * 4 : p.size,
          height: p.size,
          borderRadius: round ? p.size : 1,
          backgroundColor: p.color,
        },
        style,
      ]}
    />
  );
}

export function Particles({ prog, emitters }: { prog: SharedValue<number>; emitters: Emitter[] }) {
  const parts = useMemo(() => {
    const out: { p: P; e: Emitter; key: string }[] = [];
    emitters.forEach((e, ei) => {
      const d = DEFAULTS[e.kind];
      const rnd = seeded((e.seed ?? 1) * 97 + ei * 13 + 5);
      for (let i = 0; i < e.count; i++) {
        const born = e.t0 + (e.t1 - e.t0) * (i / Math.max(1, e.count));
        const spread = e.spread ?? d.spread;
        const dir = (e.dir ?? -Math.PI / 2) + (rnd() - 0.5) * 2 * spread;
        const sp = (e.speed ?? d.speed) * (0.5 + rnd());
        const o = e.origin ? e.origin(born) : [e.x, e.y];
        out.push({
          key: `${ei}-${i}`,
          e,
          p: {
            ox: o[0],
            oy: o[1],
            born,
            life: (e.life ?? d.life) * (0.7 + rnd() * 0.6),
            vx: Math.cos(dir) * sp,
            vy: Math.sin(dir) * sp,
            size: (e.size ?? d.size) * (0.6 + rnd() * 0.8),
            color: (e.colors ?? d.colors)[Math.floor(rnd() * (e.colors ?? d.colors).length)],
            spin: (rnd() - 0.5) * 900,
            gravity: d.gravity,
            grow: d.grow,
          },
        });
      }
    });
    return out;
  }, [emitters]);
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}>
      {parts.map((x) => (
        <Particle key={x.key} p={x.p} e={x.e} prog={prog} />
      ))}
    </View>
  );
}

/** Horizontal speed streaks. */
export function SpeedLines({ prog, W, H, intensity = 1, y0 = 0 }: { prog: SharedValue<number>; W: number; H: number; intensity?: number; y0?: number }) {
  const lines = useMemo(() => {
    const r = seeded(33);
    return Array.from({ length: 14 }, () => ({ y: y0 + r() * H, w: 40 + r() * 120, speed: 3 + r() * 5, off: r() }));
  }, [H, y0]);
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width: W, height: H + y0 }}>
      {lines.map((l, i) => (
        <SpeedLine key={i} l={l} prog={prog} W={W} intensity={intensity} />
      ))}
    </View>
  );
}

function SpeedLine({ l, prog, W, intensity }: { l: { y: number; w: number; speed: number; off: number }; prog: SharedValue<number>; W: number; intensity: number }) {
  const style = useAnimatedStyle(() => {
    const t = (prog.value * l.speed + l.off) % 1;
    return { opacity: 0.35 * intensity, transform: [{ translateX: W - t * (W + l.w * 2) }] };
  });
  return <Animated.View style={[{ position: 'absolute', top: l.y, left: 0, width: l.w, height: 1.5, backgroundColor: '#FFFFFF', borderRadius: 1 }, style]} />;
}

/** Diagonal rain streaks. */
export function Rain({ prog, W, H, density = 40 }: { prog: SharedValue<number>; W: number; H: number; density?: number }) {
  const drops = useMemo(() => {
    const r = seeded(71);
    return Array.from({ length: density }, () => ({ x: r() * W * 1.3, off: r(), len: 10 + r() * 16, speed: 5 + r() * 4 }));
  }, [W, density]);
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, overflow: 'hidden' }}>
      {drops.map((d, i) => (
        <Drop key={i} d={d} prog={prog} H={H} />
      ))}
    </View>
  );
}

function Drop({ d, prog, H }: { d: { x: number; off: number; len: number; speed: number }; prog: SharedValue<number>; H: number }) {
  const style = useAnimatedStyle(() => {
    const t = (prog.value * d.speed + d.off) % 1;
    return { transform: [{ translateX: d.x - t * H * 0.35 }, { translateY: -20 + t * (H + 40) }, { rotate: '18deg' }] };
  });
  return <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width: 1.4, height: d.len, backgroundColor: '#CFE8FF', opacity: 0.6 }, style]} />;
}

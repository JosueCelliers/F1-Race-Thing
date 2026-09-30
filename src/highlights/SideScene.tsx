/**
 * Side-on "tracking camera" cinematics: overtakes, defences, finishes, engine
 * failures, rain and safety-car shots. The world scrolls in parallax layers
 * while cars move relative to the camera using keyframes.
 */
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import Svg, { G, Rect } from 'react-native-svg';
import { CarSide } from '../art/Car';
import { environment } from '../content/environments';
import type { HighlightSpec } from '../sim/types';
import { Particles, Rain, SpeedLines, type Emitter } from './fx';
import { kf } from './kit';
import { BarrierLayer, FarLayer, MidLayer, TrackLayer } from './scenery';

interface SideCar {
  actor: number;
  lane: 0 | 1;
  x: number[][];
  sc?: boolean;
}

interface Scenario {
  cars: SideCar[];
  world: number[][];
  finish?: number;
  flag?: 'chequered' | 'yellow';
  flash?: number;
  emit?: (car: (i: number, t: number) => { x: number; y: number; w: number; h: number }) => Emitter[];
}

export function sideScenario(kind: string): Scenario {
  const steady = [
    [0, 0],
    [1, 2.4],
  ];
  switch (kind) {
    case 'overtake':
      return {
        cars: [
          {
            actor: 0,
            lane: 1,
            x: [
              [0, 0.0],
              [0.25, 0.06],
              [0.62, 0.42],
              [1, 0.46],
            ],
          },
          {
            actor: 1,
            lane: 0,
            x: [
              [0, 0.32],
              [0.3, 0.3],
              [0.62, 0.2],
              [1, 0.08],
            ],
          },
        ],
        world: steady,
      };
    case 'defend':
      return {
        cars: [
          {
            actor: 0,
            lane: 0,
            x: [
              [0, 0.36],
              [1, 0.42],
            ],
          },
          {
            actor: 1,
            lane: 1,
            x: [
              [0, -0.05],
              [0.35, 0.24],
              [0.55, 0.27],
              [0.82, 0.04],
              [1, 0.0],
            ],
          },
        ],
        world: steady,
        emit: (car) => [{ t0: 0.5, t1: 0.66, ...front(car(1, 0.55)), count: 10, kind: 'smoke', drift: -600, seed: 3 }],
      };
    case 'failedPass':
      return {
        cars: [
          {
            actor: 0,
            lane: 1,
            x: [
              [0, -0.05],
              [0.4, 0.3],
              [0.6, 0.18],
              [1, 0.02],
            ],
          },
          {
            actor: 1,
            lane: 0,
            x: [
              [0, 0.36],
              [1, 0.4],
            ],
          },
        ],
        world: steady,
        emit: (car) => [{ t0: 0.38, t1: 0.58, ...front(car(0, 0.45)), count: 14, kind: 'smoke', drift: -600, seed: 4 }],
      };
    case 'finishWin':
      return {
        cars: [
          {
            actor: 0,
            lane: 1,
            x: [
              [0, -0.7],
              [0.5, 0.24],
              [0.75, 0.38],
              [1, 0.42],
            ],
          },
        ],
        world: [
          [0, 0],
          [0.5, 1.2],
          [1, 1.45],
        ],
        finish: 0.5,
        flag: 'chequered',
        emit: () => [
          { t0: 0.5, t1: 0.62, x: 0.5, y: 0.25, count: 40, kind: 'confetti', spread: 1.3, speed: 260, seed: 5 },
          { t0: 0.52, t1: 0.7, x: 0.2, y: 0.3, count: 26, kind: 'confetti', spread: 1.2, speed: 220, seed: 6 },
        ],
      };
    case 'photoFinish':
      return {
        cars: [
          {
            actor: 0,
            lane: 1,
            x: [
              [0, -0.7],
              [0.5, 0.26],
              [1, 0.34],
            ],
          },
          {
            actor: 1,
            lane: 0,
            x: [
              [0, -0.66],
              [0.5, 0.22],
              [1, 0.28],
            ],
          },
        ],
        world: [
          [0, 0],
          [0.5, 1.2],
          [1, 1.3],
        ],
        finish: 0.5,
        flag: 'chequered',
        flash: 0.5,
      };
    case 'engineFailure':
      return {
        cars: [
          {
            actor: 0,
            lane: 1,
            x: [
              [0, 0.25],
              [1, -0.05],
            ],
          },
        ],
        world: [
          [0, 0],
          [0.5, 1.1],
          [1, 1.5],
        ],
        emit: (car) => [
          { t0: 0.15, t1: 0.95, x: 0, y: 0, count: 34, kind: 'smoke', origin: (t: number) => rear(car(0, t)), drift: -240, seed: 7 },
          { t0: 0.3, t1: 0.7, x: 0, y: 0, count: 14, kind: 'flame', origin: (t: number) => rear(car(0, t)), seed: 8 },
        ],
      };
    case 'rainStart':
      return {
        cars: [
          {
            actor: 0,
            lane: 1,
            x: [
              [0, 0.1],
              [1, 0.22],
            ],
          },
          {
            actor: 1,
            lane: 0,
            x: [
              [0, 0.4],
              [1, 0.34],
            ],
          },
        ],
        world: steady,
        emit: (car) => [
          { t0: 0, t1: 1, x: 0, y: 0, count: 40, kind: 'spray', origin: (t: number) => rear(car(0, t)), dir: Math.PI, spread: 0.35, drift: -500, seed: 9 },
          { t0: 0, t1: 1, x: 0, y: 0, count: 30, kind: 'spray', origin: (t: number) => rear(car(1, t)), dir: Math.PI, spread: 0.35, drift: -500, seed: 10 },
        ],
      };
    case 'safetyCar':
      return {
        cars: [
          {
            actor: 99,
            lane: 0,
            x: [
              [0, 0.44],
              [1, 0.47],
            ],
            sc: true,
          },
          {
            actor: 0,
            lane: 1,
            x: [
              [0, 0.02],
              [1, 0.06],
            ],
          },
        ],
        world: [
          [0, 0],
          [1, 1.2],
        ],
        flag: 'yellow',
      };
    default:
      return {
        cars: [
          {
            actor: 0,
            lane: 1,
            x: [
              [0, 0.1],
              [1, 0.4],
            ],
          },
        ],
        world: steady,
      };
  }
}

function rear(c: { x: number; y: number; w: number; h: number }): [number, number] {
  return [c.x + c.w * 0.04, c.y + c.h * 0.7];
}
function front(c: { x: number; y: number; w: number; h: number }): { x: number; y: number } {
  return { x: c.x + c.w * 0.8, y: c.y + c.h * 0.85 };
}

function Scroller({
  prog,
  keys,
  factor,
  W,
  children,
  top,
  height,
}: {
  prog: SharedValue<number>;
  keys: number[][];
  factor: number;
  W: number;
  children: React.ReactNode;
  top: number;
  height: number;
}) {
  const style = useAnimatedStyle(() => {
    const off = kf(prog.value, keys) * factor * W;
    return { transform: [{ translateX: -(off % W) }] };
  });
  return <Animated.View style={[{ position: 'absolute', left: 0, top, width: W * 2, height }, style]}>{children}</Animated.View>;
}

function MovingCar({ prog, keys, x0, y, w, children, bob }: { prog: SharedValue<number>; keys: number[][]; x0: number; y: number; w: number; children: React.ReactNode; bob: number }) {
  const style = useAnimatedStyle(() => {
    const x = kf(prog.value, keys) * x0;
    const shake = Math.sin(prog.value * 90 + bob) * 0.8;
    return { transform: [{ translateX: x }, { translateY: shake }] };
  });
  return <Animated.View style={[{ position: 'absolute', left: 0, top: y, width: w }, style]}>{children}</Animated.View>;
}

function FinishLine({ prog, keys, at, W, top, height }: { prog: SharedValue<number>; keys: number[][]; at: number; W: number; top: number; height: number }) {
  // The line is a fixed world object that arrives under the camera at `at`.
  const style = useAnimatedStyle(() => {
    const off = (kf(prog.value, keys) - kf(at, keys)) * 2.0 * W;
    return { transform: [{ translateX: W * 0.72 - off }, { skewX: '-24deg' }] };
  });
  const cells = [];
  for (let r = 0; r < 14; r++) for (let c = 0; c < 2; c++) cells.push(<Rect key={`${r}${c}`} x={c * 7} y={r * (height / 14)} width={7} height={height / 14} fill={(r + c) % 2 ? '#111' : '#FFF'} />);
  return (
    <Animated.View style={[{ position: 'absolute', left: 0, top, width: 14, height }, style]}>
      <Svg width={14} height={height}>
        <G>{cells}</G>
      </Svg>
    </Animated.View>
  );
}

function WavingFlag({ prog, kind, x, y }: { prog: SharedValue<number>; kind: 'chequered' | 'yellow'; x: number; y: number }) {
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${Math.sin(prog.value * 40) * 28 - 10}deg` }] }));
  const cells = [];
  if (kind === 'chequered') for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) cells.push(<Rect key={`${r}${c}`} x={c * 8} y={r * 7} width={8} height={7} fill={(r + c) % 2 ? '#111' : '#FFF'} />);
  return (
    <View style={{ position: 'absolute', left: x, top: y }}>
      <View style={{ position: 'absolute', left: 0, top: 30, width: 12, height: 26, borderRadius: 6, backgroundColor: '#FF8A1F' }} />
      <View style={{ position: 'absolute', left: 1, top: 18, width: 10, height: 10, borderRadius: 5, backgroundColor: '#E8C9A8' }} />
      <Animated.View style={[{ position: 'absolute', left: 6, top: 26, width: 4, height: 60, transformOrigin: 'bottom' }, style]}>
        <View style={{ position: 'absolute', left: 0, top: -30, width: 2.5, height: 60, backgroundColor: '#D8DDE6' }} />
        <View style={{ position: 'absolute', left: 2, top: -30, width: 40, height: 28 }}>
          {kind === 'chequered' ? (
            <Svg width={40} height={28}>
              {cells}
            </Svg>
          ) : (
            <View style={{ width: 40, height: 28, backgroundColor: '#FFD400' }} />
          )}
        </View>
      </Animated.View>
    </View>
  );
}

function ScLightBar({ prog }: { prog: SharedValue<number> }) {
  const a = useAnimatedStyle(() => ({ opacity: Math.sin(prog.value * 60) > 0 ? 1 : 0.2 }));
  const b = useAnimatedStyle(() => ({ opacity: Math.sin(prog.value * 60) > 0 ? 0.2 : 1 }));
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      <Animated.View style={[{ width: 12, height: 5, borderRadius: 2, backgroundColor: '#FFB020' }, a]} />
      <Animated.View style={[{ width: 12, height: 5, borderRadius: 2, backgroundColor: '#24D17E' }, b]} />
    </View>
  );
}

export function SideScene({ spec, prog, W, H }: { spec: HighlightSpec; prog: SharedValue<number>; W: number; H: number }) {
  const env = environment(spec.env);
  const sc = useMemo(() => sideScenario(spec.kind), [spec.kind]);
  const night = spec.night;
  const wet = spec.wet || spec.kind === 'rainStart';
  const sky = night ? env.skyNight : wet ? ['#5E6B7E', '#9AA6B5'] : env.sky;
  const trackTop = H * 0.62;
  const laneBottom = [H * 0.77, H * 0.94];
  const carW = [W * 0.56, W * 0.68];

  const carBox = (i: number, t: number) => {
    const c = sc.cars[i];
    const w = carW[c.lane];
    const h = w * (64 / 220);
    const x = kf(t, c.x) * W;
    return { x: x, y: laneBottom[c.lane] - h, w, h };
  };
  const emitters = useMemo(() => {
    const list = sc.emit?.(carBox) ?? [];
    return list.map((e) => (e.kind === 'confetti' && e.x < 1 ? { ...e, x: e.x * W, y: e.y * H } : e));
  }, [sc, W, H]); // eslint-disable-line react-hooks/exhaustive-deps

  const sorted = [...sc.cars.map((c, i) => ({ c, i }))].sort((a, b) => a.c.lane - b.c.lane);

  return (
    <View style={{ width: W, height: H, overflow: 'hidden' }}>
      <LinearGradient colors={sky as [string, string]} style={{ position: 'absolute', left: 0, top: 0, width: W, height: H * 0.66 }} />
      <Scroller prog={prog} keys={sc.world} factor={0.12} W={W} top={H * 0.2} height={H * 0.32}>
        <FarLayer env={env} W={W} H={H * 0.32} night={night} seed={spec.seed} />
      </Scroller>
      <View style={{ position: 'absolute', left: 0, top: H * 0.5, width: W, height: H * 0.14, backgroundColor: night ? '#1C2A1F' : env.ground }} />
      <Scroller prog={prog} keys={sc.world} factor={0.5} W={W} top={H * 0.3} height={H * 0.28}>
        <MidLayer env={env} W={W} H={H * 0.28} night={night} seed={spec.seed} />
      </Scroller>
      <Scroller prog={prog} keys={sc.world} factor={1.2} W={W} top={H * 0.555} height={H * 0.075}>
        <BarrierLayer env={env} W={W} H={H * 0.075} night={night} />
      </Scroller>
      <Scroller prog={prog} keys={sc.world} factor={2.0} W={W} top={trackTop} height={H - trackTop}>
        <TrackLayer W={W} H={H - trackTop} env={env} wet={wet} night={night} />
      </Scroller>
      {sc.finish !== undefined ? <FinishLine prog={prog} keys={sc.world} at={sc.finish} W={W} top={trackTop} height={H - trackTop} /> : null}
      {sc.flag ? <WavingFlag prog={prog} kind={sc.flag} x={W * 0.78} y={H * 0.36} /> : null}
      <SpeedLines prog={prog} W={W} H={H * 0.3} y0={H * 0.62} intensity={sc.finish !== undefined ? 0.6 : 1} />
      {sorted.map(({ c, i }) => {
        const actor = c.sc ? undefined : (spec.actors[c.actor] ?? spec.actors[0]);
        const w = carW[c.lane];
        const h = w * (64 / 220);
        return (
          <MovingCar key={i} prog={prog} keys={c.x} x0={W} y={laneBottom[c.lane] - h} w={w} bob={i * 2}>
            {c.sc ? (
              <View>
                <CarSide carClass="gt" colors={{ primary: '#F4F6FA', secondary: '#FFB020', accent: '#24D17E' }} livery="pinstripe" width={w} />
                <View style={{ position: 'absolute', left: w * 0.47, top: h * 0.05 }}>
                  <ScLightBar prog={prog} />
                </View>
              </View>
            ) : actor ? (
              <CarSide carClass={spec.carClass} colors={actor.colors} livery={actor.livery} number={actor.number} helmet={actor.helmet} width={w} />
            ) : null}
          </MovingCar>
        );
      })}
      <Particles prog={prog} emitters={emitters} />
      {wet ? <Rain prog={prog} W={W} H={H} density={46} /> : null}
      {night ? <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, backgroundColor: 'rgba(5,10,30,0.18)' }} /> : null}
    </View>
  );
}

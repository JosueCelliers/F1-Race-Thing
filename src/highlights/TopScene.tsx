/**
 * Top-down "helicopter camera" cinematics at a hairpin: dive-bombs, failed
 * lunges, collisions, spins and crashes. Cars follow smoothed racing lines.
 */
import React, { useMemo } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle, Defs, G, Path, Pattern, Rect, Text as SvgText } from 'react-native-svg';
import { CarTop } from '../art/Car';
import { environment, SPONSORS } from '../content/environments';
import type { HighlightSpec } from '../sim/types';
import { shade } from '../ui/theme';
import { Particles, Rain, type Emitter } from './fx';
import { chaikin, kf, makePath, pathAt, type PathData } from './kit';

type Pt = [number, number];

/** Hairpin centreline in unit space (x in W, y in H). */
const CENTRE: Pt[] = [
  [0.3, 1.2],
  [0.3, 0.72],
  [0.31, 0.5],
  [0.37, 0.36],
  [0.5, 0.28],
  [0.63, 0.32],
  [0.72, 0.44],
  [0.76, 0.62],
  [0.8, 0.85],
  [0.84, 1.2],
];

function offsetLine(W: number, H: number, offsets: number[]): Pt[] {
  const pts = chaikin(
    CENTRE.map(([x, y]) => [x * W, y * H] as Pt),
    3,
  );
  const n = pts.length;
  return pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(n - 1, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    // Right-hand normal (towards the inside of this right-hander).
    const nx = -dy / len;
    const ny = dx / len;
    const u = i / (n - 1);
    const off = sampleOffsets(offsets, u) * W;
    return [p[0] + nx * off, p[1] + ny * off];
  });
}

function sampleOffsets(o: number[], u: number): number {
  const f = u * (o.length - 1);
  const i = Math.min(o.length - 2, Math.floor(f));
  const t = f - i;
  return o[i] + (o[i + 1] - o[i]) * t;
}

interface TopCar {
  actor: number;
  path: PathData;
  u: number[][];
  rot?: number[][];
  slide?: number[][];
}

function Mover({ prog, car, size, children, shake }: { prog: SharedValue<number>; car: TopCar; size: number; children: React.ReactNode; shake?: number }) {
  const { pts, cum, total } = car.path;
  const style = useAnimatedStyle(() => {
    const u = kf(prog.value, car.u);
    const r = pathAt(pts, cum, total, u);
    const extraRot = car.rot ? kf(prog.value, car.rot) : 0;
    const slide = car.slide ? kf(prog.value, car.slide) : 0;
    const heading = r[2] + (extraRot * Math.PI) / 180;
    const sx = r[0] + Math.cos(r[2] - Math.PI / 2) * slide;
    const sy = r[1] + Math.sin(r[2] - Math.PI / 2) * slide;
    const j = shake ? Math.sin(prog.value * 200) * shake : 0;
    return {
      transform: [{ translateX: sx - size / 2 + j }, { translateY: sy - (size * 0.4) / 2 }, { rotate: `${heading}rad` }],
    };
  });
  return <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width: size, height: size * 0.4 }, style]}>{children}</Animated.View>;
}

/** How far the helicopter camera is zoomed in on the corner. */
const ZOOM = 1.45;

export function TopScene({ spec, prog, W: VW, H: VH }: { spec: HighlightSpec; prog: SharedValue<number>; W: number; H: number }) {
  const env = environment(spec.env);
  const night = spec.night;
  // The corner is drawn larger than the viewport (at full resolution, no bitmap
  // scaling) and the camera pans to keep the cars framed.
  const W = VW * ZOOM;
  const H = VH * ZOOM;
  const carSize = W * 0.2;
  const trackW = W * 0.24;

  const setup = useMemo(() => {
    const racing = makePath(offsetLine(W, H, [-0.07, -0.07, -0.06, 0.02, 0.07, 0.06, 0.0, -0.06, -0.07]));
    const inside = makePath(offsetLine(W, H, [0.05, 0.06, 0.07, 0.08, 0.08, 0.07, 0.04, -0.02, -0.05]));
    const wide = makePath(offsetLine(W, H, [0.05, 0.06, 0.06, 0.04, -0.02, -0.1, -0.16, -0.16, -0.12]));
    const straight = makePath([
      [0.3 * W, 1.2 * H],
      [0.3 * W, 0.55 * H],
      [0.24 * W, 0.2 * H],
      [0.2 * W, 0.1 * H],
    ]);
    const cars: TopCar[] = [];
    const emitters: Emitter[] = [];
    const at = (car: TopCar, t: number) => {
      const r = pathAt(car.path.pts, car.path.cum, car.path.total, kf(t, car.u));
      return [r[0], r[1]] as [number, number];
    };
    switch (spec.kind) {
      case 'dive': {
        const a: TopCar = {
          actor: 0,
          path: inside,
          u: [
            [0, 0.0],
            [0.3, 0.3],
            [0.52, 0.5],
            [1, 0.98],
          ],
        };
        const d: TopCar = {
          actor: 1,
          path: racing,
          u: [
            [0, 0.07],
            [0.3, 0.34],
            [0.52, 0.49],
            [1, 0.86],
          ],
        };
        cars.push(d, a);
        emitters.push({ t0: 0.18, t1: 0.36, x: 0, y: 0, count: 14, kind: 'smoke', origin: (t) => at(a, t), seed: 11 });
        break;
      }
      case 'failedPass': {
        const a: TopCar = {
          actor: 0,
          path: wide,
          u: [
            [0, 0.0],
            [0.3, 0.3],
            [0.55, 0.47],
            [1, 0.72],
          ],
        };
        const d: TopCar = {
          actor: 1,
          path: racing,
          u: [
            [0, 0.07],
            [0.3, 0.35],
            [0.55, 0.55],
            [1, 0.97],
          ],
        };
        cars.push(d, a);
        emitters.push({ t0: 0.2, t1: 0.42, x: 0, y: 0, count: 16, kind: 'smoke', origin: (t) => at(a, t), seed: 12 });
        emitters.push({ t0: 0.5, t1: 0.9, x: 0, y: 0, count: 18, kind: 'dust', origin: (t) => at(a, t), seed: 13 });
        break;
      }
      case 'collision':
      case 'crash': {
        const crashOut = spec.kind === 'crash';
        const a: TopCar = {
          actor: 0,
          path: inside,
          u: [
            [0, 0.0],
            [0.3, 0.3],
            [0.45, 0.43],
            [1, crashOut ? 0.5 : 0.8],
          ],
          rot: crashOut
            ? [
                [0, 0],
                [0.45, 0],
                [0.8, 400],
                [1, 430],
              ]
            : undefined,
          slide: crashOut
            ? [
                [0, 0],
                [0.45, 0],
                [0.9, -W * 0.12],
                [1, -W * 0.13],
              ]
            : undefined,
        };
        const d: TopCar = {
          actor: 1,
          path: racing,
          u: [
            [0, 0.08],
            [0.3, 0.36],
            [0.45, 0.45],
            [1, crashOut ? 0.78 : 0.55],
          ],
          rot: crashOut
            ? undefined
            : [
                [0, 0],
                [0.45, 0],
                [0.85, 520],
                [1, 540],
              ],
          slide: crashOut
            ? undefined
            : [
                [0, 0],
                [0.45, 0],
                [0.9, -W * 0.14],
                [1, -W * 0.15],
              ],
        };
        if (spec.actors.length < 2) {
          // Single-car crash into the barrier.
          const solo: TopCar = {
            actor: 0,
            path: straight,
            u: [
              [0, 0],
              [0.45, 0.72],
              [0.55, 0.8],
              [1, 0.82],
            ],
            rot: [
              [0, 0],
              [0.4, 0],
              [0.7, 160],
              [1, 200],
            ],
          };
          cars.push(solo);
          emitters.push({ t0: 0.3, t1: 0.45, x: 0, y: 0, count: 10, kind: 'smoke', origin: (t) => at(solo, t), seed: 14 });
          emitters.push({ t0: 0.52, t1: 0.58, x: 0.22 * W, y: 0.16 * H, count: 26, kind: 'debris', seed: 15 });
          emitters.push({ t0: 0.52, t1: 0.9, x: 0.22 * W, y: 0.16 * H, count: 22, kind: 'dust', seed: 16 });
          emitters.push({ t0: 0.52, t1: 0.56, x: 0.22 * W, y: 0.16 * H, count: 16, kind: 'spark', seed: 17 });
        } else {
          cars.push(d, a);
          const contact = at(a, 0.45);
          emitters.push({ t0: 0.44, t1: 0.5, x: contact[0], y: contact[1], count: 22, kind: 'spark', seed: 18 });
          emitters.push({ t0: 0.44, t1: 0.52, x: contact[0], y: contact[1], count: 14, kind: 'debris', seed: 19 });
          emitters.push({ t0: 0.5, t1: 0.95, x: 0, y: 0, count: 20, kind: 'smoke', origin: (t) => at(crashOut ? a : d, t), seed: 20 });
        }
        break;
      }
      case 'spin': {
        const s: TopCar = {
          actor: 0,
          path: racing,
          u: [
            [0, 0.05],
            [0.4, 0.4],
            [0.8, 0.55],
            [1, 0.57],
          ],
          rot: [
            [0, 0],
            [0.35, 0],
            [0.85, 540],
            [1, 560],
          ],
          slide: [
            [0, 0],
            [0.4, 0],
            [0.9, -W * 0.08],
            [1, -W * 0.09],
          ],
        };
        cars.push(s);
        emitters.push({ t0: 0.35, t1: 0.9, x: 0, y: 0, count: 26, kind: 'smoke', origin: (t) => at(s, t), seed: 21 });
        break;
      }
      default: {
        const a: TopCar = {
          actor: 0,
          path: racing,
          u: [
            [0, 0],
            [1, 1],
          ],
        };
        cars.push(a);
      }
    }
    return { cars, emitters, racing };
  }, [spec.kind, spec.actors.length, W, H]);

  const centre = useMemo(() => {
    const pts = chaikin(
      CENTRE.map(([x, y]) => [x * W, y * H] as Pt),
      3,
    );
    return 'M' + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L');
  }, [W, H]);

  const shakeStyle = useAnimatedStyle(() => {
    const impact = spec.kind === 'collision' || spec.kind === 'crash' ? Math.max(0, 1 - Math.abs(prog.value - 0.5) * 8) : 0;
    return { transform: [{ translateX: Math.sin(prog.value * 180) * 6 * impact }, { translateY: Math.cos(prog.value * 160) * 5 * impact }] };
  });

  const cam = useMemo(() => setup.cars.map((c) => ({ pts: c.path.pts, cum: c.path.cum, total: c.path.total, u: c.u })), [setup]);
  const camStyle = useAnimatedStyle(() => {
    let cx = 0;
    let cy = 0;
    for (const c of cam) {
      const r = pathAt(c.pts, c.cum, c.total, kf(prog.value, c.u));
      cx += r[0];
      cy += r[1];
    }
    cx /= Math.max(1, cam.length);
    cy /= Math.max(1, cam.length);
    const tx = Math.min(0, Math.max(VW - W, VW / 2 - cx));
    const ty = Math.min(0, Math.max(VH - H, VH * 0.55 - cy));
    return { transform: [{ translateX: tx }, { translateY: ty }] };
  });

  const grass = night ? shade(env.ground, -0.55) : env.ground;
  const gravel = night ? '#6B6049' : '#D6C18E';
  const sponsor = SPONSORS[spec.seed % SPONSORS.length];

  return (
    <View style={{ width: VW, height: VH, overflow: 'hidden' }}>
      <Animated.View style={[{ width: VW, height: VH }, shakeStyle]}>
        <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width: W, height: H }, camStyle]}>
          <Svg width={W} height={H}>
            <Defs>
              <Pattern id="grass" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
                <Rect x="0" y="0" width="40" height="40" fill={grass} />
                <Rect x="0" y="0" width="20" height="40" fill={shade(grass, 0.06)} />
              </Pattern>
              <Pattern id="gravel" width="8" height="8" patternUnits="userSpaceOnUse">
                <Rect x="0" y="0" width="8" height="8" fill={gravel} />
                <Circle cx="2" cy="2" r="0.9" fill={shade(gravel, -0.2)} />
                <Circle cx="6" cy="5" r="0.7" fill={shade(gravel, 0.15)} />
              </Pattern>
            </Defs>
            <Rect x={0} y={0} width={W} height={H} fill="url(#grass)" />
            {/* Gravel trap outside the hairpin */}
            <Path d={`M${W * 0.02} ${H * 0.02} L${W * 0.98} ${H * 0.02} L${W * 0.98} ${H * 0.3} C${W * 0.8} ${H * 0.05} ${W * 0.2} ${H * 0.05} ${W * 0.02} ${H * 0.36}Z`} fill="url(#gravel)" />
            {/* Tyre wall */}
            {Array.from({ length: 22 }, (_, i) => (
              <Circle key={i} cx={W * 0.02 + (i * W * 0.96) / 21} cy={H * 0.03} r={W * 0.02} fill={i % 3 === 0 ? '#E10600' : '#1A1C22'} stroke="#0B0C10" strokeWidth={1} />
            ))}
            {/* Advertising board */}
            <Rect x={W * 0.3} y={H * 0.075} width={W * 0.4} height={H * 0.045} rx={3} fill="#111827" />
            <SvgText x={W * 0.5} y={H * 0.11} fontSize={H * 0.032} fontFamily="BarlowCondensed-Black-Italic" fontWeight="900" fill="#FFFFFF" textAnchor="middle">
              {sponsor}
            </SvgText>
            {/* Track */}
            <Path d={centre} stroke={shade('#3B3F48', night ? -0.35 : 0)} strokeWidth={trackW + 10} fill="none" strokeLinejoin="round" />
            <Path d={centre} stroke={env.kerb[0]} strokeWidth={trackW + 10} strokeDasharray="10 10" fill="none" strokeOpacity={0.95} />
            <Path d={centre} stroke={spec.wet ? '#2E323B' : night ? '#262930' : '#40444E'} strokeWidth={trackW} fill="none" strokeLinejoin="round" />
            <Path d={centre} stroke="#FFFFFF" strokeOpacity={0.06} strokeWidth={trackW * 0.3} fill="none" />
            {/* Braking boards */}
            {[0.6, 0.66, 0.72].map((y, i) => (
              <G key={i}>
                <Rect x={W * 0.06} y={H * y} width={W * 0.07} height={H * 0.03} fill="#FFFFFF" />
                <SvgText x={W * 0.095} y={H * y + H * 0.024} fontSize={H * 0.022} fontFamily="BarlowCondensed-Bold" fontWeight="700" fill="#111" textAnchor="middle">
                  {['50', '100', '150'][i]}
                </SvgText>
              </G>
            ))}
          </Svg>
          {setup.cars.map((c, i) => {
            const actor = spec.actors[c.actor] ?? spec.actors[0];
            if (!actor) return null;
            return (
              <Mover key={i} prog={prog} car={c} size={carSize}>
                <CarTop carClass={spec.carClass} colors={actor.colors} livery={actor.livery} number={actor.number} helmet={actor.helmet} width={carSize} />
              </Mover>
            );
          })}
          <Particles prog={prog} emitters={setup.emitters} />
        </Animated.View>
        {spec.wet ? <Rain prog={prog} W={VW} H={VH} density={34} /> : null}
        {night ? <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width: VW, height: VH, backgroundColor: 'rgba(5,10,30,0.25)' }} /> : null}
      </Animated.View>
    </View>
  );
}

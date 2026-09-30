/**
 * Special cinematics: race start (lights out), pit stop, podium and title.
 */
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import { View } from 'react-native';
import Animated, { runOnJS, useAnimatedReaction, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle, Path, Rect, Text as SvgText } from 'react-native-svg';
import { Trophy } from '../art/Badges';
import { CarTop } from '../art/Car';
import { Helmet } from '../art/Helmet';
import { Portrait } from '../art/Portrait';
import { SERIES } from '../content/series';
import { TEAMS } from '../content/teams';
import { environment } from '../content/environments';
import type { HighlightSpec } from '../sim/types';
import { Txt } from '../ui/kit';
import { C, F, shade, withAlpha } from '../ui/theme';
import { Particles, type Emitter } from './fx';
import { kf, seeded } from './kit';

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

function Light({ prog, on }: { prog: SharedValue<number>; on: number }) {
  // A dark lamp with a glowing lit layer on top whose opacity switches on.
  const style = useAnimatedStyle(() => ({ opacity: prog.value >= on && prog.value < 0.62 ? 1 : 0 }));
  return (
    <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#2A0A0E' }}>
      <Animated.View
        style={[{ position: 'absolute', left: 0, top: 0, width: 20, height: 20, borderRadius: 10, backgroundColor: '#FF1E2D', boxShadow: '0px 0px 10px rgba(255, 30, 45, 0.9)' }, style]}
      />
    </View>
  );
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
        <View
          style={{
            position: 'absolute',
            top: H * 0.08,
            left: W / 2 - 100,
            width: 200,
            paddingVertical: 10,
            backgroundColor: '#0A0B0F',
            borderRadius: 12,
            flexDirection: 'row',
            justifyContent: 'space-evenly',
            borderWidth: 2,
            borderColor: '#2A2D36',
          }}
        >
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
// Pit stop (close top-down shot of the box)
// ---------------------------------------------------------------------------

const TYRE_BANDS = ['#FF3B5C', '#FFD400', '#F4F6FA'];

/** A crew member seen from above: shoulders + helmet, optionally carrying a tyre. */
function CrewMember({
  prog,
  xs,
  ys,
  color,
  helmet,
  tyre,
  band,
  flip,
  jitter,
}: {
  prog: SharedValue<number>;
  xs: number[][];
  ys: number[][];
  color: string;
  helmet: string;
  tyre?: number[][];
  band?: string;
  flip?: boolean;
  jitter?: number;
}) {
  const body = useAnimatedStyle(() => {
    const p = prog.value;
    const busy = jitter && p > 0.3 && p < 0.56 ? Math.sin(p * 140 + jitter) * 1.6 : 0;
    return { transform: [{ translateX: kf(p, xs) + busy }, { translateY: kf(p, ys) }] };
  });
  const tyreStyle = useAnimatedStyle(() => ({ opacity: tyre ? kf(prog.value, tyre) : 0 }));
  return (
    <Animated.View style={[{ position: 'absolute', left: -16, top: -16, width: 32, height: 32 }, body]}>
      {tyre ? (
        <Animated.View
          style={[
            { position: 'absolute', left: 4, top: flip ? -12 : 27, width: 24, height: 13, borderRadius: 4, backgroundColor: '#15161A', borderWidth: 2, borderColor: band ?? '#FFD400' },
            tyreStyle,
          ]}
        />
      ) : null}
      <Svg width={32} height={32} viewBox="0 0 26 26">
        <Path d="M2 13 C2 7 7 5 13 5 C19 5 24 7 24 13 C24 19 19 21 13 21 C7 21 2 19 2 13Z" fill={color} />
        <Path d="M4 13 L22 13" stroke="#000000" strokeOpacity={0.18} strokeWidth={2} />
        <Circle cx={13} cy={13} r={5.6} fill={helmet} stroke="#0B0C10" strokeWidth={1} />
        <Path d={flip ? 'M9.5 10.5 L16.5 10.5' : 'M9.5 15.5 L16.5 15.5'} stroke="#0B0C10" strokeWidth={1.6} strokeLinecap="round" />
      </Svg>
    </Animated.View>
  );
}

function PitTimer({ prog, stopTime }: { prog: SharedValue<number>; stopTime: number }) {
  const [text, setText] = React.useState('0.0');
  useAnimatedReaction(
    () => {
      const p = prog.value;
      const t = p < 0.27 ? 0 : p > 0.58 ? stopTime : ((p - 0.27) / 0.31) * stopTime;
      return Math.round(t * 10);
    },
    (v, prev) => {
      if (v !== prev) runOnJS(setText)((v / 10).toFixed(1));
    },
  );
  return (
    <Txt v="numBig" color={C.gold} style={{ fontSize: 30, lineHeight: 34 }}>
      {text}s
    </Txt>
  );
}

function ReleaseLight({ prog }: { prog: SharedValue<number> }) {
  const red = useAnimatedStyle(() => ({ opacity: prog.value < 0.58 ? 1 : 0.15 }));
  const green = useAnimatedStyle(() => ({ opacity: prog.value >= 0.58 ? 1 : 0.15 }));
  return (
    <View style={{ backgroundColor: '#0A0B0F', borderRadius: 8, padding: 4, gap: 3, borderWidth: 1, borderColor: '#2A2D36' }}>
      <Animated.View style={[{ width: 14, height: 14, borderRadius: 7, backgroundColor: '#FF2D46' }, red]} />
      <Animated.View style={[{ width: 14, height: 14, borderRadius: 7, backgroundColor: '#24D17E' }, green]} />
    </View>
  );
}

export function PitScene({ spec, prog, W, H }: { spec: HighlightSpec; prog: SharedValue<number>; W: number; H: number }) {
  const actor = spec.actors[0];
  const col = actor?.colors.primary ?? C.red;
  const sec = actor?.colors.secondary ?? '#FFFFFF';
  const carW = W * 0.66;
  const carH = carW * 0.4;
  const garageH = H * 0.2;
  const boxY = H * 0.54;
  const stopX = (W - carW) / 2;
  const top = boxY - carH / 2;
  const bottom = boxY + carH / 2;
  const stopTime = useMemo(() => 2.1 + (spec.seed % 17) / 10, [spec.seed]);
  const band = TYRE_BANDS[spec.seed % TYRE_BANDS.length];
  const passer = TEAMS[(spec.seed * 7) % TEAMS.length];

  const carStyle = useAnimatedStyle(() => {
    const x = kf(prog.value, [
      [0, -carW - 30],
      [0.14, stopX - carW * 0.25],
      [0.26, stopX],
      [0.6, stopX],
      [0.72, stopX + carW * 0.35],
      [1, W + carW],
    ]);
    const lift = prog.value > 0.28 && prog.value < 0.57 ? 1.03 : 1;
    return { transform: [{ translateX: x }, { translateY: top }, { scale: lift }] };
  });
  const passStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: kf(prog.value, [
          [0.25, -W * 0.7],
          [0.55, W * 1.2],
        ]),
      },
      { translateY: H * 0.87 - carH * 0.3 },
    ],
  }));

  // Wheel stations (fractions of car length) and the crew that work them.
  const fx = stopX + carW * 0.75;
  const rx = stopX + carW * 0.19;
  const standY = garageH + 16;
  const crew = useMemo(() => {
    const list: { xs: number[][]; ys: number[][]; tyre?: number[][]; flip?: boolean; jitter?: number }[] = [];
    const stations = [
      { x: fx, side: -1 },
      { x: fx, side: 1 },
      { x: rx, side: -1 },
      { x: rx, side: 1 },
    ];
    stations.forEach((st, i) => {
      const wy = st.side < 0 ? top - 12 : bottom + 12;
      const standX = W * (0.14 + i * 0.1);
      // Wheel gunner
      list.push({
        xs: [
          [0.2, standX],
          [0.27, st.x - 8],
          [0.58, st.x - 8],
          [0.64, st.x - 30],
        ],
        ys: [
          [0.2, standY],
          [0.27, wy],
          [0.58, wy],
          [0.64, wy + st.side * 24],
        ],
        flip: st.side > 0,
        jitter: i + 1,
      });
      // Tyre carrier: brings the new tyre in
      list.push({
        xs: [
          [0.2, standX + W * 0.45],
          [0.3, st.x + 16],
          [0.58, st.x + 16],
          [0.66, st.x + 44],
        ],
        ys: [
          [0.2, standY],
          [0.3, wy + st.side * 20],
          [0.42, wy + st.side * 4],
          [0.58, wy + st.side * 4],
          [0.66, wy + st.side * 30],
        ],
        tyre: [
          [0.2, 1],
          [0.44, 1],
          [0.5, 0],
        ],
        flip: st.side > 0,
      });
    });
    // Front and rear jacks
    list.push({
      xs: [
        [0.2, W * 0.9],
        [0.26, stopX + carW + 16],
        [0.58, stopX + carW + 16],
        [0.6, W * 0.95],
      ],
      ys: [
        [0.2, standY],
        [0.26, boxY],
        [0.58, boxY],
        [0.62, boxY - carH * 0.8],
      ],
    });
    list.push({
      xs: [
        [0.24, -20],
        [0.28, stopX - 16],
        [0.58, stopX - 16],
        [0.62, stopX - 40],
      ],
      ys: [
        [0.24, boxY],
        [0.28, boxY],
        [0.58, boxY],
        [0.62, boxY + carH * 0.7],
      ],
    });
    return list;
  }, [W, fx, rx, top, bottom, boxY, carW, carH, stopX, standY]);

  return (
    <View style={{ width: W, height: H, overflow: 'hidden', backgroundColor: '#34373F' }}>
      <Svg width={W} height={H} style={{ position: 'absolute' }}>
        {/* Garage */}
        <Rect x={0} y={0} width={W} height={garageH} fill="#1B1D23" />
        <Rect x={W * 0.08} y={0} width={W * 0.84} height={garageH} fill={shade(col, -0.62)} />
        <Rect x={W * 0.08} y={garageH - 6} width={W * 0.84} height={6} fill={col} />
        {[0.08, 0.36, 0.64, 0.92].map((x) => (
          <Rect key={x} x={W * x - 3} y={0} width={6} height={garageH} fill="#101116" />
        ))}
        <SvgText x={W * 0.5} y={garageH * 0.62} fontSize={garageH * 0.34} fontFamily={F.display} fill="#FFFFFF" opacity={0.18} textAnchor="middle">
          {actor?.name.split(' ').slice(-1)[0].toUpperCase() ?? 'PIT'}
        </SvgText>
        {/* Working lane + box markings */}
        <Rect x={0} y={garageH} width={W} height={3} fill="#FFD400" />
        <Rect x={stopX - 30} y={top - 34} width={carW + 60} height={carH + 68} fill={withAlpha(col, 0.14)} stroke={col} strokeWidth={3} rx={6} />
        {[
          [fx, top - 20],
          [fx, bottom + 20],
          [rx, top - 20],
          [rx, bottom + 20],
        ].map(([x, y], i) => (
          <Path key={i} d={`M${x - 12} ${y} L${x + 12} ${y} M${x} ${y - 8} L${x} ${y + 8}`} stroke="#FFFFFF" strokeOpacity={0.7} strokeWidth={3} />
        ))}
        {/* Fast lane + pit wall */}
        <Path d={`M0 ${H * 0.8} L${W} ${H * 0.8}`} stroke="#FFFFFF" strokeOpacity={0.55} strokeWidth={3} strokeDasharray="18 12" />
        <Rect x={0} y={H * 0.96} width={W} height={H * 0.04} fill="#9AA0AA" />
        <Rect x={0} y={H * 0.955} width={W} height={3} fill="#E10600" />
      </Svg>
      <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width: carW * 0.8 }, passStyle]}>
        <CarTop carClass={spec.carClass} colors={passer.colors} livery={passer.livery} width={carW * 0.8} />
      </Animated.View>
      <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width: carW, height: carH }, carStyle]}>
        {actor ? <CarTop carClass={spec.carClass} colors={actor.colors} livery={actor.livery} number={actor.number} helmet={actor.helmet} width={carW} /> : null}
      </Animated.View>
      {crew.map((c, i) => (
        <CrewMember key={i} prog={prog} xs={c.xs} ys={c.ys} tyre={c.tyre} band={band} flip={c.flip} jitter={c.jitter} color={col} helmet={sec} />
      ))}
      <View style={{ position: 'absolute', right: 12, top: garageH + 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ backgroundColor: '#0A0B0F', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: '#2A2D36' }}>
          <PitTimer prog={prog} stopTime={stopTime} />
        </View>
        <ReleaseLight prog={prog} />
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

/** Driver bust if we know their face, otherwise their helmet. */
function Bust({ actor, size, trophy }: { actor: HighlightSpec['actors'][number]; size: number; trophy?: 'gold' | 'silver' | 'bronze' }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }}>
      {actor.looks && actor.gender ? (
        <Portrait looks={actor.looks} gender={actor.gender} suit={actor.colors} size={size} bg="none" shape="none" age={actor.age} />
      ) : (
        <Helmet design={actor.helmet} size={size * 0.72} />
      )}
      {trophy ? (
        <View style={{ position: 'absolute', right: -size * 0.12, top: size * 0.12 }}>
          <Trophy size={size * 0.42} color={trophy} />
        </View>
      ) : null}
    </View>
  );
}

export function PodiumScene({ spec, prog, W, H }: { spec: HighlightSpec; prog: SharedValue<number>; W: number; H: number }) {
  const bw = W * 0.3;
  const blocks = [
    { pos: 2, x: W * 0.05, h: H * 0.2, trophy: 'silver' as const },
    { pos: 1, x: W * 0.35, h: H * 0.28, trophy: 'gold' as const },
    { pos: 3, x: W * 0.65, h: H * 0.14, trophy: 'bronze' as const },
  ];
  const banner = spec.series ? (SERIES.find((x) => x.id === spec.series)?.color ?? C.red) : C.red;
  const emitters: Emitter[] = useMemo(
    () => [
      { t0: 0.45, t1: 0.95, x: W * 0.5, y: H * 0.42, count: 50, kind: 'champagne', dir: -Math.PI / 2 - 0.5, spread: 0.35, speed: 300, seed: 41 },
      { t0: 0.55, t1: 0.95, x: W * 0.2, y: H * 0.5, count: 30, kind: 'champagne', dir: -Math.PI / 2 + 0.4, spread: 0.3, speed: 260, seed: 43 },
      { t0: 0.35, t1: 0.9, x: W * 0.5, y: H * 0.05, count: 50, kind: 'confetti', dir: Math.PI / 2, spread: 1.4, speed: 120, seed: 42 },
    ],
    [W, H],
  );
  return (
    <View style={{ width: W, height: H, overflow: 'hidden' }}>
      <LinearGradient colors={['#1B2440', '#0A0D16']} style={{ position: 'absolute', left: 0, top: 0, width: W, height: H }} />
      {/* Backdrop banner */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: H * 0.06,
          height: H * 0.16,
          backgroundColor: shade(banner, -0.45),
          borderTopWidth: 4,
          borderBottomWidth: 4,
          borderColor: banner,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Txt v="display" color="#FFFFFF" style={{ fontSize: H * 0.07, opacity: 0.9 }} numberOfLines={1}>
          {spec.event ? spec.event.toUpperCase() : 'PODIUM'}
        </Txt>
      </View>
      {[0.15, 0.5, 0.85].map((x, i) => (
        <View
          key={i}
          style={{ position: 'absolute', left: W * x - 60, top: -40, width: 120, height: H * 0.95, backgroundColor: '#FFFFFF', opacity: 0.05, transform: [{ rotate: `${(i - 1) * 12}deg` }] }}
        />
      ))}
      {blocks.map((b, i) => {
        const actor = spec.actors[b.pos - 1];
        return (
          <Rise key={b.pos} prog={prog} from={H * 0.3} at={0.05 + i * 0.08} style={{ position: 'absolute', left: b.x, bottom: 0, width: bw, alignItems: 'center' }}>
            {actor ? <Bust actor={actor} size={bw * (b.pos === 1 ? 1.05 : 0.92)} trophy={b.trophy} /> : null}
            {actor ? (
              <Txt v="h3" center numberOfLines={1} color={actor.isPlayer ? C.gold : C.text} style={{ marginBottom: 4 }}>
                {actor.short}
              </Txt>
            ) : null}
            <LinearGradient colors={['#E8ECF4', '#9AA3B5']} style={{ width: bw - 6, height: b.h, alignItems: 'center', paddingTop: 8, borderTopLeftRadius: 6, borderTopRightRadius: 6 }}>
              <Txt v="display" color="#1B2233" style={{ fontSize: 40 }}>
                {b.pos}
              </Txt>
            </LinearGradient>
          </Rise>
        );
      })}
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
    <Animated.View style={[{ position: 'absolute', left: W / 2 - size / 2, top: H * 0.4 - size / 2, width: size, height: size }, style]}>
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
      list.push({ t0: 0.2 + i * 0.13, t1: 0.22 + i * 0.13, x: W * (0.15 + r() * 0.7), y: H * (0.1 + r() * 0.22), count: 26, kind: 'firework', seed: 50 + i });
    }
    list.push({ t0: 0.3, t1: 0.95, x: W / 2, y: -10, count: 60, kind: 'confetti', dir: Math.PI / 2, spread: 1.5, speed: 140, seed: 60 });
    return list;
  }, [spec.seed, W, H]);
  const trophy = useAnimatedStyle(() => {
    const t = Math.min(1, Math.max(0, (prog.value - 0.08) / 0.3));
    const bounce = 1 + Math.sin(t * Math.PI) * 0.12;
    const lift = Math.max(0, prog.value - 0.55) * 60;
    return { opacity: t, transform: [{ translateY: (1 - t) * 120 - lift }, { scale: (0.6 + t * 0.4) * bounce }] };
  });
  const bust = Math.min(W * 0.62, H * 0.5);
  return (
    <View style={{ width: W, height: H, overflow: 'hidden' }}>
      <LinearGradient colors={['#2A1F05', '#0A0806']} style={{ position: 'absolute', left: 0, top: 0, width: W, height: H }} />
      <Rays prog={prog} W={W} H={H} />
      {actor ? (
        <Rise prog={prog} from={60} at={0.3} style={{ position: 'absolute', left: W / 2 - bust / 2, bottom: 0 }}>
          <Bust actor={actor} size={bust} />
        </Rise>
      ) : null}
      <Animated.View style={[{ position: 'absolute', left: W / 2 - 60, top: H * 0.08, alignItems: 'center' }, trophy]}>
        <Trophy size={120} />
      </Animated.View>
      <Particles prog={prog} emitters={emitters} />
    </View>
  );
}

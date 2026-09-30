/**
 * Side-view scenery layers for highlight cinematics. Every layer tiles
 * seamlessly with period W so it can scroll forever for a sense of speed.
 * All scenery is original vector art driven by the track's environment theme.
 */
import React from 'react';
import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { SPONSORS } from '../content/environments';
import type { EnvironmentDef } from '../content/types';
import { mix, shade } from '../ui/theme';
import { seeded } from './kit';

function periodic(W: number, fn: (x0: number) => React.ReactNode) {
  return (
    <>
      <G>{fn(0)}</G>
      <G transform={`translate(${W} 0)`}>{fn(0)}</G>
    </>
  );
}

/** Distant silhouette (hills, mountains, city skyline, sea, dunes, forest, plains). */
export function FarLayer({ env, W, H, night, seed }: { env: EnvironmentDef; W: number; H: number; night: boolean; seed: number }) {
  const r = seeded(seed);
  const base = H;
  const col = night ? shade(env.farColor, -0.55) : env.farColor;
  const col2 = night ? shade(env.farColor, -0.45) : shade(env.farColor, 0.12);
  let shape: (x0: number) => React.ReactNode;
  switch (env.far) {
    case 'mountains': {
      const peaks = Array.from({ length: 6 }, (_, i) => ({ x: (i + 0.5) * (W / 6) + (r() - 0.5) * 20, h: H * (0.45 + r() * 0.45) }));
      const d =
        `M0 ${base} L0 ${base - H * 0.3} ` +
        peaks.map((p) => `L${p.x - 30} ${base - p.h * 0.55} L${p.x} ${base - p.h} L${p.x + 34} ${base - p.h * 0.6}`).join(' ') +
        ` L${W} ${base - H * 0.3} L${W} ${base}Z`;
      const snow = peaks.map((p, i) => (
        <Path key={i} d={`M${p.x - 12} ${base - p.h * 0.83} L${p.x} ${base - p.h} L${p.x + 13} ${base - p.h * 0.84} L${p.x + 4} ${base - p.h * 0.8} Z`} fill="#FFFFFF" opacity={night ? 0.25 : 0.85} />
      ));
      shape = () => (
        <>
          <Path d={d} fill={col} />
          {snow}
        </>
      );
      break;
    }
    case 'city': {
      const blocks = Array.from({ length: 14 }, (_, i) => ({ x: (i * W) / 14, w: W / 14 - 3, h: H * (0.3 + r() * 0.65) }));
      shape = () => (
        <>
          {blocks.map((b, i) => (
            <G key={i}>
              <Rect x={b.x} y={base - b.h} width={b.w} height={b.h} fill={i % 2 ? col : col2} />
              {Array.from({ length: Math.floor(b.h / 12) }, (_, k) => (
                <Rect key={k} x={b.x + 4} y={base - b.h + 6 + k * 12} width={b.w - 8} height={3} fill={night ? '#FFD66B' : '#FFFFFF'} opacity={night ? (k % 3 === 0 ? 0.2 : 0.75) : 0.12} />
              ))}
            </G>
          ))}
        </>
      );
      break;
    }
    case 'sea':
      shape = () => (
        <>
          <Rect x={0} y={base - H * 0.28} width={W} height={H * 0.28} fill={col} />
          <Path d={`M0 ${base - H * 0.28} L${W} ${base - H * 0.28}`} stroke="#FFFFFF" strokeOpacity={night ? 0.15 : 0.45} strokeWidth={1.5} />
          {[0.15, 0.55, 0.8].map((f, i) => (
            <G key={i}>
              <Path d={`M${W * f} ${base - H * 0.3} l18 0 l-3 5 l-12 0Z`} fill={night ? '#20283A' : '#FFFFFF'} opacity={0.85} />
              <Path d={`M${W * f + 9} ${base - H * 0.3} l0 -16`} stroke={night ? '#20283A' : '#FFFFFF'} strokeWidth={1.2} />
            </G>
          ))}
          <Path d={`M${W * 0.35} ${base - H * 0.28} l0 -${H * 0.3}`} stroke={col2} strokeWidth={6} />
          <Circle cx={W * 0.35} cy={base - H * 0.58} r={4} fill={night ? '#FFE9A8' : '#FFFFFF'} />
        </>
      );
      break;
    case 'dunes': {
      const d = `M0 ${base} L0 ${base - H * 0.35} C${W * 0.15} ${base - H * 0.7} ${W * 0.3} ${base - H * 0.2} ${W * 0.5} ${base - H * 0.42} C${W * 0.7} ${base - H * 0.65} ${W * 0.85} ${base - H * 0.25} ${W} ${base - H * 0.35} L${W} ${base}Z`;
      shape = () => <Path d={d} fill={col} />;
      break;
    }
    case 'forest': {
      const trees = Array.from({ length: 22 }, (_, i) => ({ x: (i * W) / 22, h: H * (0.4 + r() * 0.35) }));
      shape = () => (
        <>
          <Rect x={0} y={base - H * 0.3} width={W} height={H * 0.3} fill={col} />
          {trees.map((t, i) => (
            <Path key={i} d={`M${t.x - 14} ${base - H * 0.25} L${t.x + 5} ${base - t.h} L${t.x + 24} ${base - H * 0.25}Z`} fill={i % 2 ? col : col2} />
          ))}
        </>
      );
      break;
    }
    case 'plains': {
      const d = `M0 ${base} L0 ${base - H * 0.22} C${W * 0.3} ${base - H * 0.3} ${W * 0.6} ${base - H * 0.16} ${W} ${base - H * 0.22} L${W} ${base}Z`;
      shape = () => (
        <>
          <Path d={d} fill={col} />
          {[0.2, 0.62].map((f, i) => (
            <G key={i}>
              <Path d={`M${W * f} ${base - H * 0.22} l0 -${H * 0.3}`} stroke={col2} strokeWidth={2} />
              <Path d={`M${W * f} ${base - H * 0.52} l-10 -4 M${W * f} ${base - H * 0.52} l9 -6 M${W * f} ${base - H * 0.52} l1 10`} stroke={col2} strokeWidth={2} />
            </G>
          ))}
        </>
      );
      break;
    }
    default: {
      const d = `M0 ${base} L0 ${base - H * 0.3} C${W * 0.2} ${base - H * 0.62} ${W * 0.35} ${base - H * 0.2} ${W * 0.55} ${base - H * 0.45} C${W * 0.75} ${base - H * 0.7} ${W * 0.9} ${base - H * 0.28} ${W} ${base - H * 0.3} L${W} ${base}Z`;
      shape = () => <Path d={d} fill={col} />;
    }
  }
  return (
    <Svg width={W * 2} height={H}>
      {periodic(W, shape)}
    </Svg>
  );
}

const CROWD = ['#FF3B5C', '#FFC940', '#3BA7FF', '#FFFFFF', '#24D17E', '#FF8A1F', '#A874FF'];

/** Mid-distance props: grandstands, trees, billboards, buildings... */
export function MidLayer({ env, W, H, night, seed }: { env: EnvironmentDef; W: number; H: number; night: boolean; seed: number }) {
  const r = seeded(seed + 7);
  const items: React.ReactNode[] = [];
  const dark = night ? 0.55 : 0;
  const slots = 5;
  for (let i = 0; i < slots; i++) {
    const x = (i * W) / slots + r() * 10;
    const prop = env.props[Math.floor(r() * env.props.length)];
    const k = `${i}`;
    switch (prop) {
      case 'grandstand': {
        const w = W / slots - 6;
        const h = H * 0.62;
        items.push(
          <G key={k}>
            <Path d={`M${x} ${H} L${x} ${H - h} L${x + w} ${H - h - 14} L${x + w} ${H}Z`} fill={shade('#4A5470', -dark)} />
            <Path d={`M${x - 4} ${H - h + 2} L${x + w + 4} ${H - h - 14} L${x + w + 4} ${H - h - 20} L${x - 4} ${H - h - 4}Z`} fill={shade('#D8DDE8', -dark)} />
            {Array.from({ length: 5 }, (_, row) =>
              Array.from({ length: Math.floor(w / 7) }, (_, c) => (
                <Circle key={`${row}-${c}`} cx={x + 4 + c * 7} cy={H - h + 14 + row * 11 - (c * 14) / (w / 7)} r={2.4} fill={CROWD[(row * 3 + c) % CROWD.length]} opacity={night ? 0.55 : 0.9} />
              )),
            )}
          </G>,
        );
        break;
      }
      case 'billboards': {
        const w = W / slots - 14;
        const text = SPONSORS[Math.floor(r() * SPONSORS.length)];
        const bg = [shade('#FF2D46', -dark), shade('#1E88E5', -dark), shade('#111827', -dark), shade('#FFC940', -dark)][i % 4];
        items.push(
          <G key={k}>
            <Rect x={x + 6} y={H - H * 0.34} width={3} height={H * 0.34} fill="#2A2F3A" />
            <Rect x={x + w - 6} y={H - H * 0.34} width={3} height={H * 0.34} fill="#2A2F3A" />
            <Rect x={x} y={H - H * 0.5} width={w} height={H * 0.2} rx={2} fill={bg} />
            <SvgText
              x={x + w / 2}
              y={H - H * 0.36}
              fontSize={H * 0.11}
              fontFamily="BarlowCondensed-Black-Italic"
              fontWeight="900"
              fill={bg === shade('#FFC940', -dark) ? '#111' : '#FFFFFF'}
              textAnchor="middle"
            >
              {text}
            </SvgText>
          </G>,
        );
        break;
      }
      case 'trees':
        items.push(
          <G key={k}>
            <Rect x={x + 20} y={H - H * 0.3} width={6} height={H * 0.3} fill={shade('#5A3E2B', -dark)} />
            <Circle cx={x + 23} cy={H - H * 0.45} r={H * 0.2} fill={shade('#3E8A3A', -dark)} />
            <Circle cx={x + 40} cy={H - H * 0.36} r={H * 0.15} fill={shade('#4C9A44', -dark)} />
            <Circle cx={x + 8} cy={H - H * 0.35} r={H * 0.13} fill={shade('#357A33', -dark)} />
          </G>,
        );
        break;
      case 'pines':
        items.push(
          <G key={k}>
            {[0, 26, 50].map((dx, j) => (
              <G key={j}>
                <Path d={`M${x + dx} ${H} L${x + dx + 12} ${H - H * (0.6 + j * 0.08)} L${x + dx + 24} ${H}Z`} fill={shade(j % 2 ? '#2E6B3A' : '#285F33', -dark)} />
              </G>
            ))}
          </G>,
        );
        break;
      case 'palms':
        items.push(
          <G key={k}>
            <Path d={`M${x + 20} ${H} Q${x + 14} ${H - H * 0.4} ${x + 28} ${H - H * 0.7}`} stroke={shade('#7A5A3A', -dark)} strokeWidth={5} fill="none" />
            {[-50, -20, 10, 40, 160, 200].map((a, j) => {
              const rad = (a * Math.PI) / 180;
              return (
                <Path
                  key={j}
                  d={`M${x + 28} ${H - H * 0.7} q${Math.cos(rad) * 20} ${Math.sin(rad) * 20 - 10} ${Math.cos(rad) * 34} ${Math.sin(rad) * 34 + 8}`}
                  stroke={shade('#2F8A4A', -dark)}
                  strokeWidth={4}
                  fill="none"
                  strokeLinecap="round"
                />
              );
            })}
          </G>,
        );
        break;
      case 'buildings': {
        const w = W / slots - 10;
        const h = H * (0.55 + r() * 0.4);
        const c = [shade('#E8D8C0', -dark), shade('#F2C49B', -dark), shade('#D9E2EA', -dark)][i % 3];
        items.push(
          <G key={k}>
            <Rect x={x} y={H - h} width={w} height={h} fill={c} />
            {Array.from({ length: 3 }, (_, row) =>
              Array.from({ length: 3 }, (_, col) => (
                <Rect key={`${row}${col}`} x={x + 6 + col * (w / 3.2)} y={H - h + 8 + row * 16} width={w / 5} height={9} fill={night ? '#FFD66B' : '#5B7FA6'} opacity={night ? 0.8 : 0.7} />
              )),
            )}
          </G>,
        );
        break;
      }
      case 'yachts':
        items.push(
          <G key={k}>
            <Path d={`M${x} ${H - 10} L${x + 60} ${H - 10} L${x + 50} ${H} L${x + 8} ${H}Z`} fill={shade('#FFFFFF', -dark * 0.8)} />
            <Rect x={x + 16} y={H - 20} width={28} height={10} rx={2} fill={shade('#DCE6F0', -dark)} />
            <Path d={`M${x + 30} ${H - 20} L${x + 30} ${H - H * 0.7}`} stroke={shade('#C8D2DC', -dark)} strokeWidth={2} />
          </G>,
        );
        break;
      case 'lights':
        items.push(
          <G key={k}>
            <Rect x={x + 20} y={H - H * 0.85} width={4} height={H * 0.85} fill="#3A4150" />
            <Rect x={x + 8} y={H - H * 0.92} width={28} height={10} rx={2} fill={night ? '#FFF6D6' : '#C8CED8'} />
            {night ? <Circle cx={x + 22} cy={H - H * 0.87} r={26} fill="#FFF6D6" opacity={0.18} /> : null}
          </G>,
        );
        break;
      default:
        break;
    }
  }
  return (
    <Svg width={W * 2} height={H}>
      {periodic(W, () => items)}
    </Svg>
  );
}

/** Barrier strip right behind the track. */
export function BarrierLayer({ env, W, H, night }: { env: EnvironmentDef; W: number; H: number; night: boolean }) {
  const d = night ? -0.4 : 0;
  let content: React.ReactNode;
  switch (env.barrier) {
    case 'wall':
      content = (
        <>
          <Rect x={0} y={0} width={W} height={H} fill={shade('#C9CED8', d)} />
          {Array.from({ length: 8 }, (_, i) => (
            <Rect key={i} x={(i * W) / 8} y={0} width={1.5} height={H} fill="#8A92A3" />
          ))}
          <Rect x={0} y={0} width={W} height={H * 0.25} fill={shade('#1E88E5', d)} opacity={0.85} />
        </>
      );
      break;
    case 'tyres':
      content = (
        <>
          {Array.from({ length: Math.ceil(W / 14) }, (_, i) =>
            [0, 1].map((row) => (
              <Circle
                key={`${i}-${row}`}
                cx={i * 14 + 7 + (row ? 7 : 0)}
                cy={H * 0.35 + row * H * 0.35}
                r={H * 0.24}
                fill={row ? '#191B22' : i % 4 === 0 ? shade('#E10600', d) : '#20232C'}
                stroke="#0A0B0F"
                strokeWidth={1}
              />
            )),
          )}
        </>
      );
      break;
    case 'fence':
      content = (
        <>
          <Rect x={0} y={H * 0.5} width={W} height={H * 0.5} fill={shade('#9AA3B2', d)} />
          {Array.from({ length: 30 }, (_, i) => (
            <Path key={i} d={`M${(i * W) / 30} 0 L${(i * W) / 30} ${H}`} stroke="#5C6577" strokeWidth={1} />
          ))}
        </>
      );
      break;
    default:
      content = (
        <>
          {Array.from({ length: 10 }, (_, i) => (
            <Rect key={i} x={(i * W) / 10} y={H * 0.2} width={4} height={H * 0.8} fill="#4A5160" />
          ))}
          <Rect x={0} y={H * 0.25} width={W} height={H * 0.18} fill={shade('#C7CDD7', d)} />
          <Rect x={0} y={H * 0.55} width={W} height={H * 0.18} fill={shade('#B6BDC9', d)} />
        </>
      );
  }
  return (
    <Svg width={W * 2} height={H}>
      {periodic(W, () => content)}
    </Svg>
  );
}

/** Asphalt with lane dashes; tiles every W. */
export function TrackLayer({ W, H, env, wet, night }: { W: number; H: number; env: EnvironmentDef; wet: boolean; night: boolean }) {
  const asphalt = night ? '#23262E' : wet ? '#30343D' : '#3D414B';
  const kerb = env.kerb;
  const block = W / 12;
  return (
    <Svg width={W * 2} height={H}>
      <Defs>
        <LinearGradient id="asph" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={shade(asphalt, -0.15)} />
          <Stop offset="0.5" stopColor={asphalt} />
          <Stop offset="1" stopColor={shade(asphalt, 0.08)} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={W * 2} height={H} fill="url(#asph)" />
      {periodic(W, () => (
        <>
          {Array.from({ length: 12 }, (_, i) => (
            <Rect key={`k${i}`} x={i * block} y={H - H * 0.12} width={block} height={H * 0.12} fill={i % 2 ? kerb[0] : kerb[1]} />
          ))}
          {Array.from({ length: 12 }, (_, i) => (
            <Rect key={`t${i}`} x={i * block} y={0} width={block} height={H * 0.06} fill={i % 2 ? mix(kerb[0], '#000000', 0.2) : mix(kerb[1], '#000000', 0.2)} />
          ))}
          {Array.from({ length: 4 }, (_, i) => (
            <Rect key={`d${i}`} x={i * (W / 4) + 10} y={H * 0.47} width={W / 10} height={2.5} fill="#FFFFFF" opacity={0.35} />
          ))}
          {wet ? Array.from({ length: 6 }, (_, i) => <Rect key={`w${i}`} x={i * (W / 6)} y={H * 0.2 + (i % 3) * H * 0.18} width={W / 9} height={1.5} fill="#BFE3FF" opacity={0.35} />) : null}
        </>
      ))}
    </Svg>
  );
}

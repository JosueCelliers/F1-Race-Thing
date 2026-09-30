import React from 'react';
import Svg, { Circle, ClipPath, Defs, G, LinearGradient, Path, Polygon, Rect, Stop } from 'react-native-svg';
import { nation } from '../content/nations';
import type { FlagSpec } from '../content/types';

/**
 * Stylised national flags drawn from compact specs (simplified emblems, no
 * coats of arms) so they stay crisp at 16px and look identical on every device.
 */
const W = 60;
const H = 40;

function stripes(spec: Extract<FlagSpec, { kind: 'h' | 'v' }>) {
  const ratios = spec.ratios ?? spec.colors.map(() => 1);
  const total = ratios.reduce((a, b) => a + b, 0);
  let acc = 0;
  return spec.colors.map((c, i) => {
    const start = acc / total;
    acc += ratios[i];
    const size = ratios[i] / total;
    return spec.kind === 'h' ? <Rect key={i} x={0} y={start * H} width={W} height={size * H + 0.5} fill={c} /> : <Rect key={i} x={start * W} y={0} width={size * W + 0.5} height={H} fill={c} />;
  });
}

function nordic(spec: Extract<FlagSpec, { kind: 'nordic' }>) {
  const cx = 20;
  return (
    <>
      <Rect x={0} y={0} width={W} height={H} fill={spec.bg} />
      {spec.border ? (
        <>
          <Rect x={cx - 7} y={0} width={14} height={H} fill={spec.border} />
          <Rect x={0} y={H / 2 - 7} width={W} height={14} fill={spec.border} />
        </>
      ) : null}
      <Rect x={cx - 4.5} y={0} width={9} height={H} fill={spec.cross} />
      <Rect x={0} y={H / 2 - 4.5} width={W} height={9} fill={spec.cross} />
    </>
  );
}

function star(cx: number, cy: number, r: number, points = 5, rot = -Math.PI / 2) {
  const pts: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const rr = i % 2 === 0 ? r : r * 0.42;
    const a = rot + (i * Math.PI) / points;
    pts.push(`${(cx + Math.cos(a) * rr).toFixed(2)},${(cy + Math.sin(a) * rr).toFixed(2)}`);
  }
  return pts.join(' ');
}

function unionJack(w: number, h: number) {
  const red = '#C8102E';
  return (
    <G>
      <Rect x={0} y={0} width={w} height={h} fill="#012169" />
      <Path d={`M0 0L${w} ${h}M${w} 0L0 ${h}`} stroke="#FFFFFF" strokeWidth={h * 0.2} />
      <Path d={`M0 0L${w} ${h}M${w} 0L0 ${h}`} stroke={red} strokeWidth={h * 0.07} />
      <Path d={`M${w / 2} 0V${h}M0 ${h / 2}H${w}`} stroke="#FFFFFF" strokeWidth={h * 0.33} />
      <Path d={`M${w / 2} 0V${h}M0 ${h / 2}H${w}`} stroke={red} strokeWidth={h * 0.2} />
    </G>
  );
}

function custom(id: string) {
  switch (id) {
    case 'GB':
      return unionJack(W, H);
    case 'CH':
      return (
        <>
          <Rect x={0} y={0} width={W} height={H} fill="#DA291C" />
          <Rect x={W / 2 - 3.5} y={9} width={7} height={22} fill="#FFFFFF" />
          <Rect x={W / 2 - 11} y={H / 2 - 3.5} width={22} height={7} fill="#FFFFFF" />
        </>
      );
    case 'PT':
      return (
        <>
          <Rect x={0} y={0} width={W} height={H} fill="#DA291C" />
          <Rect x={0} y={0} width={W * 0.4} height={H} fill="#046A38" />
          <Circle cx={W * 0.4} cy={H / 2} r={7.5} fill="#FFE900" />
          <Rect x={W * 0.4 - 3.5} y={H / 2 - 4} width={7} height={8} rx={1.5} fill="#DA291C" stroke="#FFFFFF" strokeWidth={1} />
        </>
      );
    case 'BR':
      return (
        <>
          <Rect x={0} y={0} width={W} height={H} fill="#009C3B" />
          <Polygon points={`${W / 2},4 ${W - 5},${H / 2} ${W / 2},${H - 4} 5,${H / 2}`} fill="#FFDF00" />
          <Circle cx={W / 2} cy={H / 2} r={8.5} fill="#002776" />
          <Path d={`M${W / 2 - 8.3} ${H / 2 - 1.5} Q${W / 2} ${H / 2 - 5} ${W / 2 + 8.3} ${H / 2 + 1.5}`} stroke="#FFFFFF" strokeWidth={1.6} fill="none" />
        </>
      );
    case 'AR':
      return (
        <>
          <Rect x={0} y={0} width={W} height={H} fill="#74ACDF" />
          <Rect x={0} y={H / 3} width={W} height={H / 3} fill="#FFFFFF" />
          <Circle cx={W / 2} cy={H / 2} r={4.2} fill="#F6B40E" stroke="#85340A" strokeWidth={0.6} />
        </>
      );
    case 'MX':
      return (
        <>
          <Rect x={0} y={0} width={W} height={H} fill="#FFFFFF" />
          <Rect x={0} y={0} width={W / 3} height={H} fill="#006847" />
          <Rect x={(W * 2) / 3} y={0} width={W / 3 + 0.5} height={H} fill="#CE1126" />
          <Circle cx={W / 2} cy={H / 2} r={5} fill="#8C5A2B" />
          <Path d={`M${W / 2 - 5} ${H / 2 + 4} Q${W / 2} ${H / 2 + 8} ${W / 2 + 5} ${H / 2 + 4}`} stroke="#3C8D3F" strokeWidth={1.6} fill="none" />
        </>
      );
    case 'US': {
      const rows = [];
      for (let i = 0; i < 13; i++) rows.push(<Rect key={i} x={0} y={(i * H) / 13} width={W} height={H / 13 + 0.2} fill={i % 2 === 0 ? '#B31942' : '#FFFFFF'} />);
      const stars = [];
      for (let r = 0; r < 5; r++) for (let c = 0; c < 6; c++) stars.push(<Circle key={`${r}-${c}`} cx={2.6 + c * 3.9 + (r % 2) * 1.9} cy={2.4 + r * 3.9} r={0.85} fill="#FFFFFF" />);
      return (
        <>
          {rows}
          <Rect x={0} y={0} width={W * 0.42} height={(H * 7) / 13} fill="#0A3161" />
          {stars}
        </>
      );
    }
    case 'CA':
      return (
        <>
          <Rect x={0} y={0} width={W} height={H} fill="#FFFFFF" />
          <Rect x={0} y={0} width={W / 4} height={H} fill="#D52B1E" />
          <Rect x={(W * 3) / 4} y={0} width={W / 4 + 0.5} height={H} fill="#D52B1E" />
          <Path
            d="M30 7 L32 12 L35 10.5 L34 17 L38 13.5 L39 16 L43 15 L41.5 20 L43.5 21 L37 26 L37.8 28.5 L31 27.5 L31 33 L29 33 L29 27.5 L22.2 28.5 L23 26 L16.5 21 L18.5 20 L17 15 L21 16 L22 13.5 L26 17 L25 10.5 L28 12 Z"
            fill="#D52B1E"
          />
        </>
      );
    case 'AU':
    case 'NZ': {
      const nz = id === 'NZ';
      return (
        <>
          <Rect x={0} y={0} width={W} height={H} fill={nz ? '#00247D' : '#012169'} />
          <G>{unionJack(W / 2, H / 2)}</G>
          {nz ? (
            <>
              <Polygon points={star(45, 10, 2.8)} fill="#CC142B" stroke="#FFFFFF" strokeWidth={0.6} />
              <Polygon points={star(40, 19, 2.6)} fill="#CC142B" stroke="#FFFFFF" strokeWidth={0.6} />
              <Polygon points={star(50, 18, 2.6)} fill="#CC142B" stroke="#FFFFFF" strokeWidth={0.6} />
              <Polygon points={star(45, 31, 3)} fill="#CC142B" stroke="#FFFFFF" strokeWidth={0.6} />
            </>
          ) : (
            <>
              <Polygon points={star(15, 30, 4.5, 7)} fill="#FFFFFF" />
              <Polygon points={star(45, 8, 2.2, 7)} fill="#FFFFFF" />
              <Polygon points={star(38, 18, 2.2, 7)} fill="#FFFFFF" />
              <Polygon points={star(52, 16, 2.2, 7)} fill="#FFFFFF" />
              <Polygon points={star(45, 32, 2.4, 7)} fill="#FFFFFF" />
            </>
          )}
        </>
      );
    }
    case 'JP':
      return (
        <>
          <Rect x={0} y={0} width={W} height={H} fill="#FFFFFF" />
          <Circle cx={W / 2} cy={H / 2} r={11} fill="#BC002D" />
        </>
      );
    case 'CN':
      return (
        <>
          <Rect x={0} y={0} width={W} height={H} fill="#EE1C25" />
          <Polygon points={star(10, 10, 6)} fill="#FFFF00" />
          <Polygon points={star(20, 4, 2, 5, 0.3)} fill="#FFFF00" />
          <Polygon points={star(24, 8, 2, 5, 0.9)} fill="#FFFF00" />
          <Polygon points={star(24, 14, 2, 5, 1.4)} fill="#FFFF00" />
          <Polygon points={star(20, 18, 2, 5, 0.3)} fill="#FFFF00" />
        </>
      );
    case 'IN':
      return (
        <>
          <Rect x={0} y={0} width={W} height={H / 3} fill="#FF9933" />
          <Rect x={0} y={H / 3} width={W} height={H / 3} fill="#FFFFFF" />
          <Rect x={0} y={(H * 2) / 3} width={W} height={H / 3 + 0.5} fill="#138808" />
          <Circle cx={W / 2} cy={H / 2} r={5} fill="none" stroke="#000080" strokeWidth={1.2} />
          <Circle cx={W / 2} cy={H / 2} r={1} fill="#000080" />
        </>
      );
    case 'ZA':
      return (
        <>
          <Rect x={0} y={0} width={W} height={H / 2} fill="#E03C31" />
          <Rect x={0} y={H / 2} width={W} height={H / 2} fill="#001489" />
          <Path d={`M0 0 L${W * 0.42} ${H / 2} L0 ${H} Z`} fill="#FFFFFF" />
          <Path d={`M0 0 L${W * 0.42} ${H / 2} L${W} ${H / 2} M0 ${H} L${W * 0.42} ${H / 2}`} stroke="#FFFFFF" strokeWidth={13} />
          <Path d={`M0 0 L${W * 0.42} ${H / 2} L${W} ${H / 2} M0 ${H} L${W * 0.42} ${H / 2}`} stroke="#007749" strokeWidth={8} />
          <Path d={`M0 6 L${W * 0.3} ${H / 2} L0 ${H - 6} Z`} fill="#FFB81C" />
          <Path d={`M0 9.5 L${W * 0.24} ${H / 2} L0 ${H - 9.5} Z`} fill="#000000" />
        </>
      );
    case 'NA':
      return (
        <>
          <Rect x={0} y={0} width={W} height={H} fill="#009543" />
          <Polygon points={`0,0 ${W},0 0,${H}`} fill="#003580" />
          <Path d={`M${W + 4} -4 L-4 ${H + 4}`} stroke="#FFFFFF" strokeWidth={15} />
          <Path d={`M${W + 4} -4 L-4 ${H + 4}`} stroke="#D21034" strokeWidth={10} />
          <Polygon points={star(12, 11, 6.5, 12)} fill="#FFCE00" />
          <Circle cx={12} cy={11} r={3.2} fill="#FFCE00" stroke="#003580" strokeWidth={0.8} />
        </>
      );
    default:
      return <Rect x={0} y={0} width={W} height={H} fill="#888" />;
  }
}

let clipCounter = 0;

function flagContent(s: FlagSpec): React.ReactNode {
  if (s.kind === 'h' || s.kind === 'v') return stripes(s);
  if (s.kind === 'nordic') return nordic(s);
  return custom(s.id);
}

/** Flag drawn into a 60x40 box as an SVG group (for embedding in other SVGs). */
export function FlagShape({ id, spec }: { id: string; spec?: FlagSpec }) {
  const s = spec ?? nation(id).flag;
  const clipId = React.useMemo(() => `flagshape${clipCounter++}`, []);
  return (
    <G>
      <Defs>
        <ClipPath id={clipId}>
          <Rect x={0} y={0} width={W} height={H} rx={5} ry={5} />
        </ClipPath>
      </Defs>
      <G clipPath={`url(#${clipId})`}>{flagContent(s)}</G>
      <Rect x={0.5} y={0.5} width={W - 1} height={H - 1} rx={5} ry={5} fill="none" stroke="#000000" strokeOpacity={0.3} strokeWidth={1.2} />
    </G>
  );
}

export function Flag({ id, width = 24, radius = 3, spec }: { id: string; width?: number; radius?: number; spec?: FlagSpec }) {
  const s = spec ?? nation(id).flag;
  const height = (width * H) / W;
  const clipId = React.useMemo(() => `flagclip${clipCounter++}`, []);
  const content = flagContent(s);
  const r = (radius * W) / width;
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${W} ${H}`}>
      <Defs>
        <ClipPath id={clipId}>
          <Rect x={0} y={0} width={W} height={H} rx={r} ry={r} />
        </ClipPath>
        <LinearGradient id={`${clipId}g`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.18" />
          <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0" />
          <Stop offset="1" stopColor="#000000" stopOpacity="0.15" />
        </LinearGradient>
      </Defs>
      <G clipPath={`url(#${clipId})`}>
        {content}
        <Rect x={0} y={0} width={W} height={H} fill={`url(#${clipId}g)`} />
      </G>
      <Rect x={0.5} y={0.5} width={W - 1} height={H - 1} rx={r} ry={r} fill="none" stroke="#000000" strokeOpacity={0.25} strokeWidth={1} />
    </Svg>
  );
}

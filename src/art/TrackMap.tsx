import React, { useMemo } from 'react';
import Svg, { Circle, G, Line, Path } from 'react-native-svg';
import { track as trackDef } from '../content/tracks';
import { buildTrackGeometry, fitTransform, pointAt, type TrackGeometry } from '../sim/trackGeometry';
import { C } from '../ui/theme';

export function trackGeometry(trackId: string): TrackGeometry {
  const t = trackDef(trackId);
  return buildTrackGeometry(t.shape, { key: t.id, samples: 400, alpha: t.tension });
}

export function useTrackLayout(trackId: string, w: number, h: number, pad = 18) {
  return useMemo(() => {
    const geom = trackGeometry(trackId);
    const tf = fitTransform(geom, w, h, pad);
    return { geom, tf };
  }, [trackId, w, h, pad]);
}

export interface TrackMapProps {
  trackId: string;
  width: number;
  height: number;
  variant?: 'thumb' | 'broadcast';
  pad?: number;
  color?: string;
  sectors?: boolean;
}

export const TrackMap = React.memo(function TrackMap({ trackId, width, height, variant = 'thumb', pad, color, sectors }: TrackMapProps) {
  const p = pad ?? (variant === 'thumb' ? 8 : 18);
  const { geom, tf } = useTrackLayout(trackId, width, height, p);
  const s = tf.scale;
  const broadcast = variant === 'broadcast';
  const outer = (broadcast ? 16 : 7) / s;
  const mid = (broadcast ? 10 : 4.2) / s;
  const inner = (broadcast ? 1.6 : 1.4) / s;
  const start = pointAt(geom, 0);
  const perp = start.angle + Math.PI / 2;
  const half = (broadcast ? 9 : 5) / s;
  const sectorPaths = useMemo(() => {
    if (!sectors) return [];
    const n = geom.count;
    const out: string[] = [];
    for (let k = 0; k < 3; k++) {
      const a = Math.floor((n * k) / 3);
      const b = Math.floor((n * (k + 1)) / 3);
      let d = '';
      for (let i = a; i <= b; i++) {
        const j = i % n;
        d += `${i === a ? 'M' : 'L'}${geom.samples[j * 2].toFixed(1)} ${geom.samples[j * 2 + 1].toFixed(1)}`;
      }
      out.push(d);
    }
    return out;
  }, [geom, sectors]);
  // Sectors read as one restrained family: signal red, off-white, steel.
  const sectorColors = [C.red, '#E9E4DA', '#8C94A4'];
  return (
    <Svg width={width} height={height}>
      <G transform={`translate(${tf.tx} ${tf.ty}) scale(${s})`}>
        {/* Run-off edge, asphalt, then a fine racing line: no glow. */}
        <Path d={geom.path} stroke={broadcast ? '#3A4457' : '#0B101B'} strokeWidth={outer} fill="none" strokeLinejoin="round" strokeLinecap="round" />
        <Path d={geom.path} stroke={broadcast ? '#1A2130' : '#3A4868'} strokeWidth={broadcast ? outer - 2.6 / s : mid} fill="none" strokeLinejoin="round" />
        {sectorPaths.map((d, i) => (
          <Path key={i} d={d} stroke={sectorColors[i]} strokeOpacity={0.75} strokeWidth={inner * 1.3} fill="none" strokeLinejoin="round" />
        ))}
        {!sectors ? <Path d={geom.path} stroke={color ?? (broadcast ? '#F2EEE6' : '#E8ECF4')} strokeOpacity={broadcast ? 0.3 : 0.95} strokeWidth={inner} fill="none" strokeLinejoin="round" /> : null}
        <Line
          x1={start.x + Math.cos(perp) * half}
          y1={start.y + Math.sin(perp) * half}
          x2={start.x - Math.cos(perp) * half}
          y2={start.y - Math.sin(perp) * half}
          stroke="#FFFFFF"
          strokeWidth={(broadcast ? 3 : 2) / s}
        />
        {broadcast ? <Circle cx={start.x} cy={start.y} r={2.5 / s} fill="#FFFFFF" /> : null}
      </G>
    </Svg>
  );
});

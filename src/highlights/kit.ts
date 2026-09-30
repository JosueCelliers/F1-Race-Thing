/**
 * Worklet-safe helpers for highlight animations.
 */

/** Keyframe interpolation with smoothstep easing. keys: [[p, v], ...] sorted by p. */
export function kf(p: number, keys: number[][]): number {
  'worklet';
  if (p <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (p <= keys[i][0]) {
      const p0 = keys[i - 1][0];
      const v0 = keys[i - 1][1];
      const p1 = keys[i][0];
      const v1 = keys[i][1];
      const t = p1 > p0 ? (p - p0) / (p1 - p0) : 1;
      const e = t * t * (3 - 2 * t);
      return v0 + (v1 - v0) * e;
    }
  }
  return keys[keys.length - 1][1];
}

/** Linear keyframes (no easing). */
export function kl(p: number, keys: number[][]): number {
  'worklet';
  if (p <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (p <= keys[i][0]) {
      const p0 = keys[i - 1][0];
      const v0 = keys[i - 1][1];
      const p1 = keys[i][0];
      const v1 = keys[i][1];
      const t = p1 > p0 ? (p - p0) / (p1 - p0) : 1;
      return v0 + (v1 - v0) * t;
    }
  }
  return keys[keys.length - 1][1];
}

export interface PathData {
  pts: number[];
  cum: number[];
  total: number;
}

export function makePath(points: [number, number][]): PathData {
  const pts: number[] = [];
  const cum: number[] = [0];
  for (let i = 0; i < points.length; i++) {
    pts.push(points[i][0], points[i][1]);
    if (i > 0) cum.push(cum[i - 1] + Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]));
  }
  return { pts, cum, total: cum[cum.length - 1] };
}

/** Smooth a polyline with Chaikin corner cutting (JS only). */
export function chaikin(points: [number, number][], iterations = 3): [number, number][] {
  let pts = points;
  for (let k = 0; k < iterations; k++) {
    const out: [number, number][] = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[i + 1];
      out.push([x0 * 0.75 + x1 * 0.25, y0 * 0.75 + y1 * 0.25]);
      out.push([x0 * 0.25 + x1 * 0.75, y0 * 0.25 + y1 * 0.75]);
    }
    out.push(pts[pts.length - 1]);
    pts = out;
  }
  return pts;
}

/** Point + heading (radians) at arc-length fraction u of a path. */
export function pathAt(pts: number[], cum: number[], total: number, u: number): number[] {
  'worklet';
  const n = cum.length;
  const d = Math.max(0, Math.min(1, u)) * total;
  let i = 1;
  while (i < n - 1 && cum[i] < d) i++;
  const seg = cum[i] - cum[i - 1] || 1;
  const t = (d - cum[i - 1]) / seg;
  const x0 = pts[(i - 1) * 2];
  const y0 = pts[(i - 1) * 2 + 1];
  const x1 = pts[i * 2];
  const y1 = pts[i * 2 + 1];
  return [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, Math.atan2(y1 - y0, x1 - x0)];
}

/** Tiny seeded PRNG usable to lay out deterministic particles. */
export function seeded(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

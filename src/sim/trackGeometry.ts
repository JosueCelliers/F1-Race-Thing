/**
 * Track geometry: turns a handful of control points into a smooth closed
 * racing line (centripetal Catmull-Rom) and an arc-length parameterised
 * sample table used to place cars along the lap.
 */

export type Pt = [number, number];

export interface TrackGeometry {
  /** Evenly spaced (by arc length) samples: x0, y0, x1, y1, ... */
  samples: number[];
  count: number;
  length: number;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  /** Dense polyline as an SVG path string (closed). */
  path: string;
}

function dist(a: Pt, b: Pt): number {
  return Math.hypot(b[0] - a[0], b[1] - a[1]);
}

/** Dense sampling of a closed centripetal Catmull-Rom spline. */
export function catmullRomClosed(points: Pt[], perSegment = 18, alpha = 0.5): Pt[] {
  const n = points.length;
  const out: Pt[] = [];
  if (n < 3) return points.slice();
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];
    const t0 = 0;
    const t1 = t0 + Math.pow(Math.max(dist(p0, p1), 1e-6), alpha);
    const t2 = t1 + Math.pow(Math.max(dist(p1, p2), 1e-6), alpha);
    const t3 = t2 + Math.pow(Math.max(dist(p2, p3), 1e-6), alpha);
    for (let s = 0; s < perSegment; s++) {
      const t = t1 + ((t2 - t1) * s) / perSegment;
      const a1x = ((t1 - t) / (t1 - t0)) * p0[0] + ((t - t0) / (t1 - t0)) * p1[0];
      const a1y = ((t1 - t) / (t1 - t0)) * p0[1] + ((t - t0) / (t1 - t0)) * p1[1];
      const a2x = ((t2 - t) / (t2 - t1)) * p1[0] + ((t - t1) / (t2 - t1)) * p2[0];
      const a2y = ((t2 - t) / (t2 - t1)) * p1[1] + ((t - t1) / (t2 - t1)) * p2[1];
      const a3x = ((t3 - t) / (t3 - t2)) * p2[0] + ((t - t2) / (t3 - t2)) * p3[0];
      const a3y = ((t3 - t) / (t3 - t2)) * p2[1] + ((t - t2) / (t3 - t2)) * p3[1];
      const b1x = ((t2 - t) / (t2 - t0)) * a1x + ((t - t0) / (t2 - t0)) * a2x;
      const b1y = ((t2 - t) / (t2 - t0)) * a1y + ((t - t0) / (t2 - t0)) * a2y;
      const b2x = ((t3 - t) / (t3 - t1)) * a2x + ((t - t1) / (t3 - t1)) * a3x;
      const b2y = ((t3 - t) / (t3 - t1)) * a2y + ((t - t1) / (t3 - t1)) * a3y;
      const cx = ((t2 - t) / (t2 - t1)) * b1x + ((t - t1) / (t2 - t1)) * b2x;
      const cy = ((t2 - t) / (t2 - t1)) * b1y + ((t - t1) / (t2 - t1)) * b2y;
      out.push([cx, cy]);
    }
  }
  return out;
}

/** Resample a closed polyline into `count` points evenly spaced by arc length. */
export function resampleClosed(poly: Pt[], count: number): { pts: Pt[]; length: number } {
  const n = poly.length;
  const cum: number[] = [0];
  for (let i = 1; i <= n; i++) {
    cum.push(cum[i - 1] + dist(poly[i - 1], poly[i % n]));
  }
  const length = cum[n];
  const pts: Pt[] = [];
  let seg = 0;
  for (let k = 0; k < count; k++) {
    const target = (length * k) / count;
    while (seg < n - 1 && cum[seg + 1] < target) seg++;
    const segLen = cum[seg + 1] - cum[seg] || 1;
    const t = (target - cum[seg]) / segLen;
    const a = poly[seg];
    const b = poly[(seg + 1) % n];
    pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
  }
  return { pts, length };
}

const cache = new Map<string, TrackGeometry>();

export function buildTrackGeometry(shape: Pt[], opts: { samples?: number; alpha?: number; key?: string } = {}): TrackGeometry {
  const key = opts.key ? `${opts.key}:${opts.samples ?? 360}` : undefined;
  if (key && cache.has(key)) return cache.get(key)!;
  const dense = catmullRomClosed(shape, 18, opts.alpha ?? 0.5);
  const { pts, length } = resampleClosed(dense, opts.samples ?? 360);
  const samples: number[] = [];
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of pts) {
    samples.push(x, y);
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  let path = '';
  for (let i = 0; i < dense.length; i++) {
    const [x, y] = dense[i];
    path += `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  path += 'Z';
  const geom: TrackGeometry = { samples, count: pts.length, length, minX, minY, maxX, maxY, path };
  if (key) cache.set(key, geom);
  return geom;
}

/** Position and heading at lap fraction t (0..1, wraps). */
export function pointAt(geom: TrackGeometry, t: number): { x: number; y: number; angle: number } {
  const n = geom.count;
  let f = t - Math.floor(t);
  const pos = f * n;
  const i = Math.floor(pos) % n;
  const j = (i + 1) % n;
  const frac = pos - Math.floor(pos);
  const s = geom.samples;
  const x = s[i * 2] + (s[j * 2] - s[i * 2]) * frac;
  const y = s[i * 2 + 1] + (s[j * 2 + 1] - s[i * 2 + 1]) * frac;
  const angle = Math.atan2(s[j * 2 + 1] - s[i * 2 + 1], s[j * 2] - s[i * 2]);
  f = 0;
  return { x, y, angle };
}

/** Fit geometry bounds into a w x h viewport with padding. */
export function fitTransform(geom: TrackGeometry, w: number, h: number, pad = 16): { scale: number; tx: number; ty: number } {
  const gw = geom.maxX - geom.minX || 1;
  const gh = geom.maxY - geom.minY || 1;
  const scale = Math.min((w - pad * 2) / gw, (h - pad * 2) / gh);
  const tx = (w - gw * scale) / 2 - geom.minX * scale;
  const ty = (h - gh * scale) / 2 - geom.minY * scale;
  return { scale, tx, ty };
}

/** Signed curvature-ish measure at sample index, useful for finding corners. */
export function headingChange(geom: TrackGeometry, i: number, span = 4): number {
  const n = geom.count;
  const s = geom.samples;
  const a = (i - span + n) % n;
  const b = i % n;
  const c = (i + span) % n;
  const h1 = Math.atan2(s[b * 2 + 1] - s[a * 2 + 1], s[b * 2] - s[a * 2]);
  const h2 = Math.atan2(s[c * 2 + 1] - s[b * 2 + 1], s[c * 2] - s[b * 2]);
  let d = h2 - h1;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

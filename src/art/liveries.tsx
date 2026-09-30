/**
 * Livery patterns. Each pattern is defined in normalised car space
 * (u: rear 0 → nose 1, v: 0 → 1 across or up) and mapped onto any car body,
 * so every pattern works on every car class in both views.
 *
 * Add a livery: add an entry to LIVERIES and reference its id from a team.
 */
import React from 'react';
import { G, Path, Rect } from 'react-native-svg';
import type { TeamColors } from '../sim/types';
import { shade } from '../ui/theme';

type UV = [number, number];

export interface LiveryShape {
  poly: UV[];
  color: 'secondary' | 'accent' | 'dark' | 'light';
  opacity?: number;
}

export const LIVERIES: Record<string, LiveryShape[]> = {
  classic: [
    {
      poly: [
        [0.12, 0.4],
        [1, 0.4],
        [1, 0.6],
        [0.12, 0.6],
      ],
      color: 'secondary',
    },
    {
      poly: [
        [0.12, 0.61],
        [1, 0.61],
        [1, 0.66],
        [0.12, 0.66],
      ],
      color: 'accent',
    },
  ],
  arrow: [
    {
      poly: [
        [0.3, 0],
        [0.6, 0.5],
        [0.3, 1],
        [0.18, 1],
        [0.48, 0.5],
        [0.18, 0],
      ],
      color: 'secondary',
    },
    {
      poly: [
        [0.5, 0],
        [0.8, 0.5],
        [0.5, 1],
        [0.44, 1],
        [0.74, 0.5],
        [0.44, 0],
      ],
      color: 'accent',
    },
  ],
  split: [
    {
      poly: [
        [0.52, 0],
        [1.1, 0],
        [1.1, 1],
        [0.36, 1],
      ],
      color: 'secondary',
    },
    {
      poly: [
        [0.5, 0],
        [0.53, 0],
        [0.37, 1],
        [0.34, 1],
      ],
      color: 'accent',
    },
  ],
  sash: [
    {
      poly: [
        [0.28, 0],
        [0.44, 0],
        [0.7, 1],
        [0.54, 1],
      ],
      color: 'secondary',
    },
    {
      poly: [
        [0.46, 0],
        [0.5, 0],
        [0.76, 1],
        [0.72, 1],
      ],
      color: 'accent',
    },
  ],
  fade: [
    {
      poly: [
        [0.55, 0],
        [1.1, 0],
        [1.1, 1],
        [0.55, 1],
      ],
      color: 'secondary',
      opacity: 0.55,
    },
    {
      poly: [
        [0.72, 0],
        [1.1, 0],
        [1.1, 1],
        [0.72, 1],
      ],
      color: 'secondary',
    },
    {
      poly: [
        [0.1, 0.46],
        [1, 0.46],
        [1, 0.54],
        [0.1, 0.54],
      ],
      color: 'accent',
      opacity: 0.8,
    },
  ],
  pinstripe: [
    {
      poly: [
        [0.05, 0.3],
        [1, 0.3],
        [1, 0.34],
        [0.05, 0.34],
      ],
      color: 'secondary',
    },
    {
      poly: [
        [0.05, 0.48],
        [1, 0.48],
        [1, 0.52],
        [0.05, 0.52],
      ],
      color: 'accent',
    },
    {
      poly: [
        [0.05, 0.66],
        [1, 0.66],
        [1, 0.7],
        [0.05, 0.7],
      ],
      color: 'secondary',
    },
  ],
  halves: [
    {
      poly: [
        [0.56, 0],
        [1.1, 0],
        [1.1, 1],
        [0.56, 1],
      ],
      color: 'secondary',
    },
    {
      poly: [
        [0.53, 0],
        [0.56, 0],
        [0.56, 1],
        [0.53, 1],
      ],
      color: 'accent',
    },
  ],
  bolt: [
    {
      poly: [
        [0.15, 0.35],
        [0.5, 0.3],
        [0.45, 0.48],
        [0.95, 0.42],
        [0.55, 0.7],
        [0.6, 0.56],
        [0.15, 0.62],
      ],
      color: 'secondary',
    },
    {
      poly: [
        [0.62, 0.43],
        [0.95, 0.42],
        [0.62, 0.52],
      ],
      color: 'accent',
    },
  ],
};

export function liveryColor(c: LiveryShape['color'], colors: TeamColors): string {
  switch (c) {
    case 'secondary':
      return colors.secondary;
    case 'accent':
      return colors.accent;
    case 'dark':
      return shade(colors.primary, -0.45);
    case 'light':
      return shade(colors.primary, 0.35);
  }
}

/** Draw a livery in a rectangle (x, y, w, h). The caller clips to the body. */
export function LiveryLayer({ id, colors, x, y, w, h, flipV }: { id: string; colors: TeamColors; x: number; y: number; w: number; h: number; flipV?: boolean }) {
  const shapes = LIVERIES[id] ?? LIVERIES.classic;
  return (
    <G>
      <Rect x={x - 2} y={y - 2} width={w + 4} height={h + 4} fill={colors.primary} />
      {shapes.map((s, i) => {
        const d = s.poly.map(([u, v], k) => `${k === 0 ? 'M' : 'L'}${(x + u * w).toFixed(1)} ${(y + (flipV ? 1 - v : v) * h).toFixed(1)}`).join(' ') + 'Z';
        return <Path key={i} d={d} fill={liveryColor(s.color, colors)} opacity={s.opacity ?? 1} />;
      })}
    </G>
  );
}

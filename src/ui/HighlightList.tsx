import React from 'react';
import { View } from 'react-native';
import type { HighlightSpec, HighlightTone } from '../sim/types';
import { Icon } from './Icon';
import { Press, Txt } from './kit';
import { C, R, withAlpha } from './theme';

export interface HighlightItem {
  id: string;
  spec: HighlightSpec;
  year?: number;
  trackName?: string;
  tone?: HighlightTone;
}

const TONE_COLOR: Record<HighlightTone, string> = { good: C.gold, bad: C.red, neutral: C.cyan };

/** Tappable list of highlight clips. `onPlay(i)` starts playback at row i. */
export function HighlightRows({ items, onPlay, meta = 'track' }: { items: HighlightItem[]; onPlay: (index: number) => void; meta?: 'track' | 'sub' }) {
  return (
    <View style={{ gap: 6 }}>
      {items.map((h, i) => {
        const tone = TONE_COLOR[h.tone ?? 'neutral'];
        const line = meta === 'sub' ? h.spec.sub : [h.year, h.trackName].filter(Boolean).join(' · ');
        return (
          <Press key={h.id} onPress={() => onPlay(i)} scale={0.98} label={`Play highlight: ${h.spec.caption}`}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                backgroundColor: C.surface,
                paddingRight: 12,
                height: 58,
                borderRadius: R.sm,
                borderWidth: 1,
                borderColor: C.line,
                overflow: 'hidden',
              }}
            >
              <View style={{ width: 3, alignSelf: 'stretch', backgroundColor: tone }} />
              <View style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: withAlpha(tone, 0.14), borderRadius: R.xs }}>
                <Icon name="film" color={tone} size={20} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt v="h3" numberOfLines={1}>
                  {h.spec.caption}
                </Txt>
                {line ? (
                  <Txt v="small" color={C.textDim} numberOfLines={1} style={{ fontSize: 12.5 }}>
                    {line}
                  </Txt>
                ) : null}
              </View>
              <View style={{ width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: C.surface3 }}>
                <Icon name="play" color={C.text} size={13} />
              </View>
            </View>
          </Press>
        );
      })}
    </View>
  );
}

/** Small "Play all" chip for section headers. */
export function PlayAllChip({ onPress, label = 'Play all' }: { onPress: () => void; label?: string }) {
  return (
    <Press onPress={onPress} feedback="tick" label={label}>
      <View style={{ height: 30, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, backgroundColor: C.red, borderRadius: R.xs, transform: [{ skewX: '-11deg' }] }}>
        <View style={{ transform: [{ skewX: '11deg' }], flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon name="play" size={12} color="#FFFFFF" />
          <Txt v="micro" color="#FFFFFF">
            {label}
          </Txt>
        </View>
      </View>
    </Press>
  );
}

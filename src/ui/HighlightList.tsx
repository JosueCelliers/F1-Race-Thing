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

const TONE_COLOR: Record<HighlightTone, string> = { good: C.gold, bad: C.red, neutral: C.blue };

/** Tappable list of highlight clips. `onPlay(i)` starts playback at row i. */
export function HighlightRows({ items, onPlay, meta = 'track' }: { items: HighlightItem[]; onPlay: (index: number) => void; meta?: 'track' | 'sub' }) {
  return (
    <View style={{ gap: 6 }}>
      {items.map((h, i) => {
        const tone = TONE_COLOR[h.tone ?? 'neutral'];
        const line = meta === 'sub' ? h.spec.sub : [h.year, h.trackName].filter(Boolean).join(' · ');
        return (
          <Press key={h.id} onPress={() => onPlay(i)} scale={0.98} label={`Play highlight: ${h.spec.caption}`}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.surface, padding: 10, borderRadius: R.md, borderWidth: 1, borderColor: C.line }}>
              <View style={{ width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: withAlpha(tone, 0.16) }}>
                <Icon name="film" color={tone} size={20} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt v="h3" numberOfLines={1}>
                  {h.spec.caption}
                </Txt>
                {line ? (
                  <Txt v="small" color={C.textDim} numberOfLines={1}>
                    {line}
                  </Txt>
                ) : null}
              </View>
              <Icon name="play" color={C.text} size={16} />
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
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 5,
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: R.pill,
          backgroundColor: C.surface3,
          borderWidth: 1,
          borderColor: C.lineStrong,
        }}
      >
        <Icon name="play" size={12} color={C.text} />
        <Txt v="label" style={{ fontSize: 10.5 }}>
          {label}
        </Txt>
      </View>
    </Press>
  );
}

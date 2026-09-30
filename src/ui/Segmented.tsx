import React from 'react';
import { View } from 'react-native';
import { Press, Txt } from './kit';
import { C, R } from './theme';

export function Segmented<T extends string>({ options, value, onChange }: { options: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={{ flexDirection: 'row', backgroundColor: C.surface, borderRadius: R.md, padding: 4, borderWidth: 1, borderColor: C.line }}>
      {options.map((o) => {
        const active = o.id === value;
        return (
          <Press key={o.id} onPress={() => onChange(o.id)} feedback="tick" style={{ flex: 1 }} scale={0.97}>
            <View style={{ paddingVertical: 9, borderRadius: R.sm, backgroundColor: active ? C.surface3 : 'transparent', alignItems: 'center' }}>
              <Txt v="h3" color={active ? C.text : C.textMute} style={{ fontSize: 14 }}>
                {o.label}
              </Txt>
            </View>
          </Press>
        );
      })}
    </View>
  );
}

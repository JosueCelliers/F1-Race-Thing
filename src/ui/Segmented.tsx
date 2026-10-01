import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Press } from './kit';
import { C, F } from './theme';

/**
 * Broadcast tabs: uppercase condensed labels on a hairline, the active one lit
 * with a red underline. Scrolls sideways when the labels don't fit.
 */
export function Segmented<T extends string>({ options, value, onChange }: { options: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  const wide = options.length > 4;
  const tabs = options.map((o) => <Tab key={o.id} label={o.label} active={o.id === value} onPress={() => onChange(o.id)} grow={!wide} />);
  return (
    <View style={{ borderBottomWidth: 1, borderColor: C.line }} accessibilityRole="tablist">
      {wide ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 4 }}>
          {tabs}
        </ScrollView>
      ) : (
        <View style={{ flexDirection: 'row' }}>{tabs}</View>
      )}
    </View>
  );
}

function Tab({ label, active, onPress, grow }: { label: string; active: boolean; onPress: () => void; grow: boolean }) {
  const bar = useAnimatedStyle(() => ({ opacity: withTiming(active ? 1 : 0, { duration: 160 }), transform: [{ scaleX: withTiming(active ? 1 : 0.4, { duration: 200 }) }, { skewX: '-20deg' }] }));
  return (
    <Press onPress={onPress} feedback="tick" scale={0.97} style={grow ? { flex: 1 } : undefined} label={label}>
      <View style={{ height: 46, paddingHorizontal: grow ? 4 : 14, alignItems: 'center', justifyContent: 'center' }} accessibilityState={{ selected: active }}>
        <Text style={{ fontFamily: F.title, fontSize: 15, letterSpacing: 1, textTransform: 'uppercase', color: active ? C.text : C.textMute }} numberOfLines={1}>
          {label}
        </Text>
        <Animated.View style={[{ position: 'absolute', left: grow ? 10 : 8, right: grow ? 10 : 8, bottom: -1, height: 3, backgroundColor: C.red }, bar]} />
      </View>
    </Press>
  );
}

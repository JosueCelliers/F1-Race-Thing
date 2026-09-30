import React, { useEffect, useMemo } from 'react';
import { useWindowDimensions, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

const COLORS = ['#FFC940', '#FF2D46', '#3BA7FF', '#24D17E', '#FFFFFF', '#A874FF', '#FF8A1F'];

function Piece({ x, delay, color, w, h, drift, spin, height, duration }: { x: number; delay: number; color: string; w: number; h: number; drift: number; spin: number; height: number; duration: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(delay, withTiming(1, { duration, easing: Easing.in(Easing.quad) }));
  }, [t, delay, duration]);
  const style = useAnimatedStyle(() => ({
    opacity: t.value > 0.92 ? (1 - t.value) * 12 : t.value > 0 ? 1 : 0,
    transform: [
      { translateX: x + Math.sin(t.value * 9 + drift) * 24 + drift * t.value * 40 },
      { translateY: -30 + t.value * (height + 60) },
      { rotate: `${t.value * spin}deg` },
      { scaleX: Math.cos(t.value * 14 + drift) },
    ],
  }));
  return <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width: w, height: h, backgroundColor: color, borderRadius: 1.5 }, style]} />;
}

export function Confetti({ count = 60, burst = 0 }: { count?: number; burst?: number }) {
  const { width, height } = useWindowDimensions();
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        key: `${burst}-${i}`,
        x: Math.random() * width,
        delay: Math.random() * 900,
        color: COLORS[i % COLORS.length],
        w: 6 + Math.random() * 6,
        h: 8 + Math.random() * 8,
        drift: Math.random() * 2 - 1,
        spin: 360 + Math.random() * 720,
        duration: 2200 + Math.random() * 1600,
      })),
    [count, width, burst],
  );
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
      {pieces.map(({ key, ...p }) => (
        <Piece key={key} {...p} height={height} />
      ))}
    </View>
  );
}

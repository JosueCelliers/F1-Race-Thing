/**
 * Full-screen cinematic player for a HighlightSpec: picks the right scene,
 * drives its progress, and overlays broadcast-style graphics.
 */
import React, { useEffect, useRef } from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeOut, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { HighlightSpec } from '../sim/types';
import { haptic } from '../ui/haptics';
import { Txt } from '../ui/kit';
import { C, F, withAlpha } from '../ui/theme';
import { SideScene } from './SideScene';
import { PitScene, PodiumScene, StartScene, TitleScene } from './SpecialScenes';
import { TopScene } from './TopScene';

const SIDE = new Set(['overtake', 'defend', 'finishWin', 'photoFinish', 'engineFailure', 'rainStart', 'safetyCar']);
const TOP = new Set(['dive', 'failedPass', 'collision', 'crash', 'spin']);

const DURATION: Record<string, number> = {
  start: 4200,
  overtake: 4200,
  dive: 4400,
  failedPass: 4200,
  defend: 4000,
  collision: 4600,
  crash: 4400,
  spin: 4000,
  pitStop: 4600,
  finishWin: 4800,
  photoFinish: 4600,
  podium: 5000,
  title: 5600,
  engineFailure: 4200,
  rainStart: 3800,
  safetyCar: 3800,
};

const CAPTION_AT: Record<string, number> = {
  start: 0.62,
  overtake: 0.55,
  dive: 0.55,
  failedPass: 0.55,
  defend: 0.6,
  collision: 0.48,
  crash: 0.52,
  spin: 0.5,
  pitStop: 0.62,
  finishWin: 0.5,
  photoFinish: 0.5,
  podium: 0.3,
  title: 0.3,
  engineFailure: 0.35,
  rainStart: 0.3,
  safetyCar: 0.3,
};

function Caption({ prog, at, caption, sub, color }: { prog: ReturnType<typeof useSharedValue<number>>; at: number; caption: string; sub?: string; color: string }) {
  const style = useAnimatedStyle(() => {
    const t = Math.min(1, Math.max(0, (prog.value - at) / 0.08));
    const e = 1 - Math.pow(1 - t, 3);
    return { opacity: t, transform: [{ translateX: (1 - e) * -60 }, { skewX: '-10deg' }] };
  });
  const subStyle = useAnimatedStyle(() => {
    const t = Math.min(1, Math.max(0, (prog.value - at - 0.06) / 0.08));
    return { opacity: t, transform: [{ translateX: (1 - t) * -30 }] };
  });
  return (
    <View pointerEvents="none" style={{ gap: 6 }}>
      <Animated.View style={[{ alignSelf: 'flex-start', backgroundColor: color, paddingHorizontal: 16, paddingVertical: 6 }, style]}>
        <Txt v="display" color="#FFFFFF" style={{ fontSize: 30, lineHeight: 34 }} numberOfLines={2}>
          {caption}
        </Txt>
      </Animated.View>
      {sub ? (
        <Animated.View style={[{ alignSelf: 'flex-start', backgroundColor: withAlpha('#000000', 0.75), paddingHorizontal: 12, paddingVertical: 5 }, subStyle]}>
          <Txt v="bodyStrong" color="#FFFFFF" numberOfLines={2}>
            {sub}
          </Txt>
        </Animated.View>
      ) : null}
    </View>
  );
}

export function HighlightPlayer({ spec, onDone }: { spec: HighlightSpec; onDone: () => void }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const prog = useSharedValue(0);
  const done = useRef(false);
  const W = width;
  const H = Math.min(Math.round(width * 1.12), height - insets.top - insets.bottom - 160);
  const dur = DURATION[spec.kind] ?? 4200;

  const finish = () => {
    if (done.current) return;
    done.current = true;
    onDone();
  };

  useEffect(() => {
    prog.value = 0;
    prog.value = withTiming(1, { duration: dur, easing: Easing.linear }, (ok) => {
      if (ok) runOnJS(finish)();
    });
    const impactAt = spec.kind === 'collision' || spec.kind === 'crash' ? 0.48 : spec.kind === 'finishWin' || spec.kind === 'title' ? 0.5 : -1;
    const t = impactAt > 0 ? setTimeout(() => (spec.kind === 'title' || spec.kind === 'finishWin' ? haptic.success() : haptic.thud()), dur * impactAt) : undefined;
    return () => {
      if (t) clearTimeout(t);
    };
  }, [spec]); // eslint-disable-line react-hooks/exhaustive-deps

  const flash = useAnimatedStyle(() => {
    const k = spec.kind;
    const at = k === 'photoFinish' ? 0.5 : k === 'crash' || k === 'collision' ? 0.48 : k === 'title' ? 0.1 : -1;
    if (at < 0) return { opacity: 0 };
    const d = Math.abs(prog.value - at);
    return { opacity: d < 0.05 ? (1 - d / 0.05) * 0.85 : 0 };
  });
  const bar = useAnimatedStyle(() => ({ width: `${prog.value * 100}%` }));

  let scene: React.ReactNode;
  if (SIDE.has(spec.kind)) scene = <SideScene spec={spec} prog={prog} W={W} H={H} />;
  else if (TOP.has(spec.kind)) scene = <TopScene spec={spec} prog={prog} W={W} H={H} />;
  else if (spec.kind === 'start') scene = <StartScene spec={spec} prog={prog} W={W} H={H} />;
  else if (spec.kind === 'pitStop') scene = <PitScene spec={spec} prog={prog} W={W} H={H} />;
  else if (spec.kind === 'podium') scene = <PodiumScene spec={spec} prog={prog} W={W} H={H} />;
  else if (spec.kind === 'title') scene = <TitleScene spec={spec} prog={prog} W={W} H={H} />;
  else scene = <SideScene spec={spec} prog={prog} W={W} H={H} />;

  const captionColor = ['crash', 'collision', 'engineFailure', 'spin', 'failedPass'].includes(spec.kind) ? '#C4001D' : spec.kind === 'title' || spec.kind === 'finishWin' || spec.kind === 'podium' ? '#B98100' : C.red;

  return (
    <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(180)} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: '#000', zIndex: 50 }}>
      <Pressable style={{ flex: 1 }} onPress={finish}>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <View style={{ width: W, height: H }}>
            {scene}
            <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 0, width: W, height: H, backgroundColor: '#FFFFFF' }, flash]} />
            <View style={{ position: 'absolute', left: 12, top: 12, flexDirection: 'row', gap: 6 }}>
              <View style={{ backgroundColor: C.red, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 }}>
                <Txt v="label" color="#FFFFFF">
                  ● Replay
                </Txt>
              </View>
              {spec.where ? (
                <View style={{ backgroundColor: withAlpha('#000000', 0.6), paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 }}>
                  <Txt v="label" color="#FFFFFF">
                    {spec.where}
                  </Txt>
                </View>
              ) : null}
            </View>
            <View style={{ position: 'absolute', left: 14, right: 14, bottom: 18 }}>
              <Caption prog={prog} at={CAPTION_AT[spec.kind] ?? 0.5} caption={spec.caption} sub={spec.sub} color={captionColor} />
            </View>
          </View>
        </View>
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: insets.bottom + 18, alignItems: 'center', gap: 8 }}>
          <View style={{ width: W * 0.5, height: 3, borderRadius: 2, backgroundColor: '#222', overflow: 'hidden' }}>
            <Animated.View style={[{ height: 3, backgroundColor: C.red }, bar]} />
          </View>
          <Txt v="label" color={C.textMute} style={{ fontFamily: F.bodySemi }}>
            Tap to skip
          </Txt>
        </View>
      </Pressable>
    </Animated.View>
  );
}

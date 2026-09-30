/**
 * Full-screen cinematic player for a HighlightSpec: picks the right scene,
 * drives its progress, and frames it in a vertical "broadcast replay" package
 * (series bug, event line, lower-third caption, progress). `HighlightReel`
 * chains several highlights back to back.
 */
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, useWindowDimensions, View } from 'react-native';
import Animated, { cancelAnimation, Easing, FadeIn, FadeOut, runOnJS, useAnimatedStyle, useSharedValue, withRepeat, withTiming, type SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SERIES } from '../content/series';
import { Helmet } from '../art/Helmet';
import type { HighlightActor, HighlightSpec } from '../sim/types';
import { haptic } from '../ui/haptics';
import { Icon } from '../ui/Icon';
import { Press, Txt } from '../ui/kit';
import { C, F, withAlpha } from '../ui/theme';
import { SideScene } from './SideScene';
import { PitScene, PodiumScene, StartScene, TitleScene } from './SpecialScenes';
import { TopScene } from './TopScene';

const SIDE = new Set(['overtake', 'defend', 'finishWin', 'photoFinish', 'engineFailure', 'rainStart', 'safetyCar']);
const TOP = new Set(['dive', 'failedPass', 'collision', 'crash', 'spin']);
const BAD = new Set(['crash', 'collision', 'engineFailure', 'spin', 'failedPass']);
const GOLD = new Set(['title', 'finishWin', 'podium', 'photoFinish']);

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

const KIND_LABEL: Record<string, string> = {
  start: 'The start',
  overtake: 'Overtake',
  dive: 'Late braking',
  failedPass: 'Attack',
  defend: 'Defence',
  collision: 'Contact',
  crash: 'Crash',
  spin: 'Spin',
  pitStop: 'Pit stop',
  finishWin: 'Chequered flag',
  photoFinish: 'Photo finish',
  podium: 'Podium',
  title: 'Championship',
  engineFailure: 'Failure',
  rainStart: 'Weather',
  safetyCar: 'Safety car',
};

function Caption({ prog, at, caption, sub, color }: { prog: SharedValue<number>; at: number; caption: string; sub?: string; color: string }) {
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
      <Animated.View style={[{ alignSelf: 'flex-start', backgroundColor: color, paddingHorizontal: 16, paddingVertical: 6, maxWidth: '100%' }, style]}>
        <Txt v="display" color="#FFFFFF" style={{ fontSize: 32, lineHeight: 36 }} numberOfLines={2}>
          {caption}
        </Txt>
      </Animated.View>
      {sub ? (
        <Animated.View style={[{ alignSelf: 'flex-start', backgroundColor: withAlpha('#0B0F19', 0.92), paddingHorizontal: 12, paddingVertical: 6, borderLeftWidth: 3, borderColor: color }, subStyle]}>
          <Txt v="bodyStrong" color="#FFFFFF" numberOfLines={2}>
            {sub}
          </Txt>
        </Animated.View>
      ) : null}
    </View>
  );
}

function lastName(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (parts.length > 1 ? parts.slice(1).join(' ') : parts[0]).toUpperCase();
}

/** Who is involved: helmet, number and name for each car in the shot. */
function ActorStrip({ actors, kind, prog }: { actors: HighlightActor[]; kind: string; prog: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const t = Math.min(1, Math.max(0, (prog.value - 0.04) / 0.1));
    return { opacity: t, transform: [{ translateY: (1 - t) * 8 }] };
  });
  const list = actors.slice(0, kind === 'podium' ? 3 : 2);
  if (!list.length) return null;
  return (
    <Animated.View style={[{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }, style]}>
      {list.map((a, i) => (
        <React.Fragment key={`${a.number}-${i}`}>
          {i > 0 && kind !== 'podium' ? (
            <Txt v="label" color={C.textMute}>
              vs
            </Txt>
          ) : null}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingRight: 10,
              borderRadius: 10,
              backgroundColor: withAlpha(a.colors.primary, 0.16),
              borderWidth: 1,
              borderColor: withAlpha(a.colors.primary, 0.55),
            }}
          >
            <Helmet design={a.helmet} size={36} />
            <View>
              <Txt v="label" color={a.isPlayer ? C.gold : C.textDim} style={{ fontSize: 9.5 }}>
                {kind === 'podium' ? `P${i + 1} · ` : ''}#{a.number}
                {a.isPlayer ? ' · You' : ''}
              </Txt>
              <Txt v="h3" numberOfLines={1} style={{ fontSize: 15 }}>
                {lastName(a.name)}
              </Txt>
            </View>
          </View>
        </React.Fragment>
      ))}
    </Animated.View>
  );
}

function LiveDot() {
  const o = useSharedValue(1);
  useEffect(() => {
    o.value = withRepeat(withTiming(0.25, { duration: 520 }), -1, true);
    return () => cancelAnimation(o);
  }, [o]);
  const st = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#FFFFFF' }, st]} />;
}

export function HighlightPlayer({
  spec,
  onDone,
  onClose,
  index,
  total,
}: {
  spec: HighlightSpec;
  /** Called when the clip ends or is tapped through. */
  onDone: () => void;
  /** Close the whole reel (shows an X when provided). */
  onClose?: () => void;
  index?: number;
  total?: number;
}) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const prog = useSharedValue(0);
  const done = useRef(false);
  const W = Math.min(width, 600);
  const TOP_H = 92;
  const BOTTOM_H = 200;
  const H = Math.round(Math.max(W * 0.9, Math.min(W * 1.2, height - insets.top - insets.bottom - TOP_H - BOTTOM_H)));
  const dur = DURATION[spec.kind] ?? 4200;
  const series = spec.series ? SERIES.find((s) => s.id === spec.series) : undefined;
  const accent = series?.color ?? C.red;
  const inReel = total !== undefined && total > 1;

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

  const captionColor = BAD.has(spec.kind) ? '#C4001D' : GOLD.has(spec.kind) ? '#B98100' : C.red;
  const context = [spec.where, spec.lap].filter(Boolean).join(' · ');

  return (
    <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(180)} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: '#04060B', zIndex: 50 }}>
      <LinearGradient colors={[withAlpha(accent, 0.28), 'rgba(4,6,11,0)']} style={{ position: 'absolute', left: 0, right: 0, top: 0, height: insets.top + TOP_H + 80 }} />
      <Pressable style={{ flex: 1, alignItems: 'center' }} onPress={finish} accessibilityLabel={`${spec.caption}. Tap to ${inReel ? 'play the next highlight' : 'skip'}`}>
        {/* Broadcast bug */}
        <View style={{ width: W, paddingTop: insets.top + 10, paddingHorizontal: 16, height: insets.top + TOP_H, justifyContent: 'flex-start' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.red, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
              <LiveDot />
              <Txt v="label" color="#FFFFFF" style={{ fontSize: 11 }}>
                Replay
              </Txt>
            </View>
            <Txt v="label" color={series ? accent : C.textDim} style={{ fontSize: 11, flex: 1 }} numberOfLines={1}>
              {series ? series.name : (KIND_LABEL[spec.kind] ?? 'Highlight')}
            </Txt>
            {inReel ? (
              <Txt v="num" color={C.textDim} style={{ fontSize: 14 }}>
                {(index ?? 0) + 1}/{total}
              </Txt>
            ) : null}
            {onClose ? (
              <Press onPress={onClose} label="Close replay" feedback="tick">
                <View style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: withAlpha('#FFFFFF', 0.1) }}>
                  <Icon name="close" size={16} color={C.text} />
                </View>
              </Press>
            ) : null}
          </View>
          <Txt v="h1" style={{ marginTop: 8, fontSize: 22, lineHeight: 26 }} numberOfLines={1}>
            {spec.event ?? KIND_LABEL[spec.kind] ?? 'Highlight'}
            {spec.year ? (
              <Txt v="h1" color={C.textMute} style={{ fontSize: 22, lineHeight: 26 }}>
                {'  '}
                {spec.year}
              </Txt>
            ) : null}
          </Txt>
          {context ? (
            <Txt v="small" color={C.textDim} numberOfLines={1}>
              {context}
            </Txt>
          ) : null}
        </View>

        {/* Camera */}
        <View style={{ width: W, height: H, overflow: 'hidden' }}>
          {scene}
          <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 0, width: W, height: H, backgroundColor: '#FFFFFF' }, flash]} />
          <LinearGradient pointerEvents="none" colors={['rgba(4,6,11,0.55)', 'rgba(4,6,11,0)']} style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 26 }} />
          <LinearGradient pointerEvents="none" colors={['rgba(4,6,11,0)', 'rgba(4,6,11,0.7)']} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 40 }} />
        </View>

        {/* Lower third */}
        <View style={{ width: W, paddingHorizontal: 14, marginTop: -30 }}>
          <Caption prog={prog} at={CAPTION_AT[spec.kind] ?? 0.5} caption={spec.caption} sub={spec.sub} color={captionColor} />
        </View>
        <View style={{ width: W, paddingHorizontal: 14, marginTop: 16 }}>
          <ActorStrip actors={spec.actors} kind={spec.kind} prog={prog} />
        </View>

        <View style={{ flex: 1 }} />
        <View style={{ width: W, paddingHorizontal: 24, paddingBottom: insets.bottom + 18, alignItems: 'center', gap: 10 }}>
          <View style={{ alignSelf: 'stretch', height: 3, borderRadius: 2, backgroundColor: withAlpha('#FFFFFF', 0.12), overflow: 'hidden' }}>
            <Animated.View style={[{ height: 3, backgroundColor: accent }, bar]} />
          </View>
          <Txt v="label" color={C.textMute} style={{ fontFamily: F.bodySemi }}>
            {inReel && (index ?? 0) + 1 < (total ?? 0) ? 'Tap for the next highlight' : 'Tap to skip'}
          </Txt>
        </View>
      </Pressable>
    </Animated.View>
  );
}

/** Plays a list of highlights back to back in a full-screen modal (safe to use from scrolling screens). */
export function HighlightReel({ specs, start = 0, onClose }: { specs: HighlightSpec[]; start?: number; onClose: () => void }) {
  const [i, setI] = useState(start);
  const spec = specs[i];
  if (!spec) return null;
  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <HighlightPlayer
        key={i}
        spec={spec}
        index={i}
        total={specs.length}
        onClose={specs.length > 1 ? onClose : undefined}
        onDone={() => {
          if (i + 1 < specs.length) setI(i + 1);
          else onClose();
        }}
      />
    </Modal>
  );
}

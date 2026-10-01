import Constants from 'expo-constants';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useGame } from '../state/store';
import { Icon, type IconName } from '../ui/Icon';
import { Btn, Header, Press, Screen, SectionTitle, SheetModal, Txt } from '../ui/kit';
import { C, F, R, S } from '../ui/theme';

function Row({ icon, title, sub, right, first }: { icon: IconName; title: string; sub?: string; right: React.ReactNode; first?: boolean }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, paddingHorizontal: 12, paddingVertical: 8 }, !first && { borderTopWidth: 1, borderColor: C.line }]}>
      <View style={{ width: 34, height: 34, alignItems: 'center', justifyContent: 'center', backgroundColor: C.surface2, borderRadius: R.xs }}>
        <Icon name={icon} color={C.textDim} size={18} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: F.title, fontSize: 16.5, color: C.text, textTransform: 'uppercase' }}>{title}</Text>
        {sub ? (
          <Txt v="small" color={C.textMute} style={{ fontSize: 12.5 }}>
            {sub}
          </Txt>
        ) : null}
      </View>
      {right}
    </View>
  );
}

/** Skewed on/off switch: the block slides, the track lights red. */
function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <Press onPress={() => onChange(!value)} feedback="tick" label={label}>
      <View accessibilityRole="switch" accessibilityState={{ checked: value }} style={{ width: 58, height: 44, justifyContent: 'center' }}>
        <View style={{ height: 30, borderRadius: R.xs, backgroundColor: value ? C.red : C.surface3, padding: 3, alignItems: value ? 'flex-end' : 'flex-start', transform: [{ skewX: '-11deg' }] }}>
          <View style={{ width: 24, height: 24, borderRadius: R.xs, backgroundColor: '#FFFFFF' }} />
        </View>
      </View>
    </Press>
  );
}

function Choice<T extends string | number>({ options, value, onChange }: { options: { v: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={{ flexDirection: 'row', height: 40, borderWidth: 1, borderColor: C.line, backgroundColor: C.surface2, borderRadius: R.xs, overflow: 'hidden', transform: [{ skewX: '-11deg' }] }}>
      {options.map((o, k) => {
        const on = value === o.v;
        return (
          <Press key={String(o.v)} onPress={() => onChange(o.v)} feedback="tick" label={o.label}>
            <View
              style={{
                height: '100%',
                minWidth: 44,
                paddingHorizontal: 10,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: on ? C.red : 'transparent',
                borderLeftWidth: k ? 1 : 0,
                borderColor: C.line,
              }}
            >
              <Text style={{ transform: [{ skewX: '11deg' }], fontFamily: F.title, fontSize: 14, color: on ? '#FFFFFF' : C.textDim, textTransform: 'uppercase' }}>{o.label}</Text>
            </View>
          </Press>
        );
      })}
    </View>
  );
}

export default function Settings() {
  const settings = useGame((s) => s.settings);
  const setSettings = useGame((s) => s.setSettings);
  const reset = useGame((s) => s.resetUniverse);
  const [confirm, setConfirm] = useState(0);
  return (
    <Screen header={<Header kicker="Chequered Lives" title="Settings" />}>
      <SectionTitle title="Gameplay" style={{ marginTop: S.sm, marginBottom: S.sm }} />
      <View style={panel}>
        <Row
          first
          icon="vibrate"
          title="Haptics"
          sub="Wheel ticks, impacts and celebrations"
          right={<Toggle label="Haptics" value={settings.haptics} onChange={(v) => setSettings({ haptics: v })} />}
        />
        <Row
          icon="refresh"
          title="Wheel spin"
          sub="How long each wheel spins"
          right={
            <Choice
              value={settings.spinSpeed}
              onChange={(v) => setSettings({ spinSpeed: v })}
              options={[
                { v: 'normal', label: 'Normal' },
                { v: 'fast', label: 'Fast' },
              ]}
            />
          }
        />
        <Row
          icon="ff"
          title="Broadcast speed"
          sub="Default speed when watching races"
          right={
            <Choice
              value={settings.speed}
              onChange={(v) => setSettings({ speed: v })}
              options={[
                { v: 1, label: '1×' },
                { v: 2, label: '2×' },
                { v: 4, label: '4×' },
              ]}
            />
          }
        />
      </View>

      <SectionTitle title="Universe" style={{ marginBottom: S.sm }} />
      <View style={[panel, { padding: 14 }]}>
        <Txt v="body" color={C.textDim}>
          All your careers live in one connected world. Resetting deletes the world, every archived career and all records.
        </Txt>
        <Btn label="Reset universe" kind="danger" small icon="close" style={{ marginTop: S.md }} onPress={() => setConfirm(1)} />
      </View>

      <SectionTitle title="About" style={{ marginBottom: S.sm }} />
      <View style={[panel, { padding: 14 }]}>
        <Text style={{ fontFamily: F.display, fontSize: 24, color: C.text, textTransform: 'uppercase' }}>Chequered Lives</Text>
        <Txt v="small" color={C.textDim} style={{ marginTop: 4 }}>
          Version {Constants.expoConfig?.version ?? '0.1.0'}
        </Txt>
        <Txt v="small" color={C.textDim} style={{ marginTop: 8 }}>
          All championships, teams, sponsors, circuits and drivers in this game are fictional. Any resemblance to real people or organisations is coincidental.
        </Txt>
        <Txt v="small" color={C.textDim} style={{ marginTop: 8 }}>
          Art, cars, portraits, flags, icons and track layouts are original. Typeface: Barlow & Barlow Condensed by The Barlow Project Authors, SIL Open Font License 1.1.
        </Txt>
      </View>

      <SectionTitle title="Open-source licences" style={{ marginBottom: S.sm }} />
      <View style={panel}>
        {LICENCES.map((l, i) => (
          <View key={l.name} style={[{ paddingHorizontal: 14, paddingVertical: 10 }, i > 0 && { borderTopWidth: 1, borderColor: C.line }]}>
            <Txt v="bodyStrong" style={{ fontSize: 14.5 }}>
              {l.name}
            </Txt>
            <Txt v="small" color={C.textDim} style={{ fontSize: 12.5 }}>
              {l.by} · {l.licence}
            </Txt>
          </View>
        ))}
      </View>

      <SheetModal visible={confirm > 0} onClose={() => setConfirm(0)} accent={C.redDeep}>
        <Txt v="h1">{confirm === 1 ? 'Reset the universe?' : 'Are you absolutely sure?'}</Txt>
        <Txt v="body" color={C.textDim} style={{ marginTop: 6 }}>
          {confirm === 1 ? 'Your current career, every archived career and all world history will be erased.' : 'This cannot be undone.'}
        </Txt>
        <View style={{ flexDirection: 'row', gap: S.sm, marginTop: S.lg }}>
          <Btn label="Cancel" kind="ghost" small style={{ flex: 1 }} onPress={() => setConfirm(0)} />
          <Btn
            label={confirm === 1 ? 'Continue' : 'Erase everything'}
            kind="danger"
            small
            style={{ flex: 1 }}
            onPress={() => {
              if (confirm === 1) setConfirm(2);
              else {
                reset();
                setConfirm(0);
                router.replace('/');
              }
            }}
          />
        </View>
      </SheetModal>
    </Screen>
  );
}

const LICENCES = [
  { name: 'Barlow, Barlow Condensed', by: 'The Barlow Project Authors', licence: 'SIL Open Font License 1.1' },
  { name: 'Material Symbols (bundled by Expo Router)', by: 'Google', licence: 'Apache License 2.0' },
  { name: 'Expo, Expo Router, React Native, React', by: '650 Industries, Meta Platforms and contributors', licence: 'MIT' },
  { name: 'Reanimated, Worklets, Gesture Handler, Screens', by: 'Software Mansion and contributors', licence: 'MIT' },
  { name: 'react-native-svg, safe-area-context', by: 'Contributors', licence: 'MIT' },
  { name: 'zustand', by: 'Paul Henschel and contributors', licence: 'MIT' },
];

const panel = StyleSheet.create({ p: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: R.sm, overflow: 'hidden' } }).p;

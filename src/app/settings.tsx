import Constants from 'expo-constants';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Modal, View } from 'react-native';
import { useGame } from '../state/store';
import { Icon, type IconName } from '../ui/Icon';
import { Btn, Card, Header, ModalScrim, Press, Screen, SectionTitle, Txt } from '../ui/kit';
import { C, R, S } from '../ui/theme';

function Row({ icon, title, sub, right }: { icon: IconName; title: string; sub?: string; right: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 }}>
      <Icon name={icon} color={C.textDim} />
      <View style={{ flex: 1 }}>
        <Txt v="bodyStrong">{title}</Txt>
        {sub ? (
          <Txt v="small" color={C.textMute}>
            {sub}
          </Txt>
        ) : null}
      </View>
      {right}
    </View>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Press onPress={() => onChange(!value)} feedback="tick">
      <View style={{ width: 50, height: 30, borderRadius: 15, backgroundColor: value ? C.green : C.surface3, padding: 3, alignItems: value ? 'flex-end' : 'flex-start' }}>
        <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFFFFF' }} />
      </View>
    </Press>
  );
}

function Choice<T extends string | number>({ options, value, onChange }: { options: { v: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 4, backgroundColor: C.surface2, borderRadius: R.sm, padding: 3 }}>
      {options.map((o) => (
        <Press key={String(o.v)} onPress={() => onChange(o.v)} feedback="tick">
          <View style={{ paddingHorizontal: 9, paddingVertical: 6, borderRadius: 7, backgroundColor: value === o.v ? C.surface3 : 'transparent' }}>
            <Txt v="label" color={value === o.v ? C.text : C.textMute} style={{ fontSize: 10 }}>
              {o.label}
            </Txt>
          </View>
        </Press>
      ))}
    </View>
  );
}

export default function Settings() {
  const settings = useGame((s) => s.settings);
  const setSettings = useGame((s) => s.setSettings);
  const reset = useGame((s) => s.resetUniverse);
  const [confirm, setConfirm] = useState(0);
  return (
    <Screen header={<Header title="Settings" />}>
      <SectionTitle title="Gameplay" />
      <Card style={{ paddingVertical: 6 }}>
        <Row icon="vibrate" title="Haptics" sub="Wheel ticks, impacts and celebrations" right={<Toggle value={settings.haptics} onChange={(v) => setSettings({ haptics: v })} />} />
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
                { v: 1, label: 'x1' },
                { v: 2, label: 'x2' },
                { v: 4, label: 'x4' },
              ]}
            />
          }
        />
      </Card>

      <SectionTitle title="Universe" />
      <Card>
        <Txt v="body" color={C.textDim}>
          All your careers live in one connected world. Resetting deletes the world, every archived career and all records.
        </Txt>
        <Btn label="Reset universe" kind="danger" small icon="close" style={{ marginTop: S.md }} onPress={() => setConfirm(1)} />
      </Card>

      <SectionTitle title="About" />
      <Card>
        <Txt v="h2">Chequered Lives</Txt>
        <Txt v="small" color={C.textDim} style={{ marginTop: 4 }}>
          Version {Constants.expoConfig?.version ?? '0.1.0'}
        </Txt>
        <Txt v="small" color={C.textDim} style={{ marginTop: 8 }}>
          All championships, teams, sponsors, circuits and drivers in this game are fictional. Any resemblance to real people or organisations is coincidental.
        </Txt>
        <Txt v="small" color={C.textDim} style={{ marginTop: 8 }}>
          Art, cars, portraits, flags, icons and track layouts are original. Typeface: Barlow & Barlow Condensed by The Barlow Project Authors, SIL Open Font License 1.1.
        </Txt>
      </Card>

      <SectionTitle title="Open-source licences" />
      <Card>
        {LICENCES.map((l, i) => (
          <View key={l.name} style={{ marginTop: i ? 10 : 0 }}>
            <Txt v="bodyStrong">{l.name}</Txt>
            <Txt v="small" color={C.textDim}>
              {l.by} · {l.licence}
            </Txt>
          </View>
        ))}
      </Card>

      <Modal visible={confirm > 0} transparent animationType="fade" onRequestClose={() => setConfirm(0)}>
        <ModalScrim bg="rgba(2,4,10,0.85)">
          <Card>
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
          </Card>
        </ModalScrim>
      </Modal>
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

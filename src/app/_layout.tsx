import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { AppState, useWindowDimensions, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { flushSave, useGame } from '../state/store';
import { Backdrop } from '../ui/kit';
import { appMaxWidth } from '../ui/screen';
import { C, FONT_FILES } from '../ui/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded] = useFonts(FONT_FILES);
  const win = useWindowDimensions();
  const framed = !!appMaxWidth && win.width > appMaxWidth + 2;
  const ready = useGame((s) => s.ready);
  const load = useGame((s) => s.load);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (fontsLoaded && ready) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, ready]);

  // Saves are debounced; write immediately when the app goes to the background.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') flushSave();
    });
    return () => sub.remove();
  }, []);

  if (!fontsLoaded || !ready) return <View style={{ flex: 1, backgroundColor: C.bg }} />;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar style="light" />
      {/* Wide web windows: the phone column sits on the same night-grid atmosphere instead of flat black. */}
      {framed ? (
        <>
          <Backdrop tint={C.red} intensity={0.45} />
          <View style={{ position: 'absolute', top: 0, bottom: 0, left: (win.width - appMaxWidth!) / 2 - 1, width: 1, backgroundColor: C.lineStrong }} />
          <View style={{ position: 'absolute', top: 0, bottom: 0, right: (win.width - appMaxWidth!) / 2 - 1, width: 1, backgroundColor: C.lineStrong }} />
        </>
      ) : null}
      <View style={{ flex: 1, width: '100%', maxWidth: appMaxWidth, alignSelf: 'center', overflow: 'hidden', backgroundColor: C.bg }}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: C.bg },
            animation: 'fade_from_bottom',
          }}
        >
          <Stack.Screen name="index" options={{ animation: 'fade' }} />
          <Stack.Screen name="race" options={{ gestureEnabled: false, animation: 'fade' }} />
          <Stack.Screen name="create" options={{ gestureEnabled: false }} />
        </Stack>
      </View>
    </GestureHandlerRootView>
  );
}

import { router } from 'expo-router';
import React from 'react';
import { Btn, Screen, Txt } from '../ui/kit';

export default function Home() {
  return (
    <Screen>
      <Txt v="display" style={{ marginTop: 80 }}>
        Chequered Lives
      </Txt>
      <Btn label="Art gallery" onPress={() => router.push('/dev')} style={{ marginTop: 24 }} />
    </Screen>
  );
}

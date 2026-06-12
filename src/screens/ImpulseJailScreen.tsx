// ImpulseJailScreen.tsx — 24h timer, release/bury, graveyard (built in Feature 8).
import React from 'react';
import { Screen, Placeholder } from '../components/shared';

export default function ImpulseJailScreen() {
  return (
    <Screen>
      <Placeholder emoji="🔒" title="Impulse Jail" subtitle="impulse buys ko 24h ke liye yahan band karenge ✨" />
    </Screen>
  );
}

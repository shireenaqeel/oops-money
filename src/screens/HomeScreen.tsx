// HomeScreen.tsx — budget card, danger alerts, recent expenses (built in Feature 3).
import React from 'react';
import { Screen, Placeholder } from '../components/shared';

export default function HomeScreen() {
  return (
    <Screen>
      <Placeholder emoji="🏠" title="Home" subtitle="budget card, alerts aur recent kharche yahan aayenge ✨" />
    </Screen>
  );
}

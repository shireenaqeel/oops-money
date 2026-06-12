// AddExpenseModal.tsx — amount, category, mood, note, splurge toggle (built in Feature 4).
// Will open as a bottom sheet from a + button on Home; placeholder for now.
import React from 'react';
import { Screen, Placeholder } from '../components/shared';

export default function AddExpenseModal() {
  return (
    <Screen>
      <Placeholder emoji="✦" title="Add Expense" subtitle="naya kharcha add karne ka form yahan aayega ✨" />
    </Screen>
  );
}

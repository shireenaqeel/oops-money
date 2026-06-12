// SettingsScreen.tsx — shows the saved onboarding values + a reset button (testing helper for now).
// Full settings UI (edit budget/income, notifications, etc.) gets built out in later features.
import React from 'react';
import { View, Text, Pressable, StyleSheet, Alert, ScrollView } from 'react-native';
import { Screen } from '../components/shared';
import { useAppContext } from '../hooks/useAppContext';
import { colors, spacing, radius, typography } from '../constants/theme';
import { fmtINR } from '../utils';

export default function SettingsScreen() {
  const { income, budget, splurgeFund, resetAll } = useAppContext();

  // Ask for confirmation, then wipe all data and return to onboarding.
  function confirmReset() {
    Alert.alert('Sab reset kar dein?', 'Saara data (income, budget, kharche) delete ho jayega. Pakka?', [
      { text: 'rehne do', style: 'cancel' },
      { text: 'haan, reset', style: 'destructive', onPress: () => resetAll() },
    ]);
  }

  // One labelled row showing a saved amount.
  function Row({ emoji, label, value }: { emoji: string; label: string; value: string }) {
    const n = parseInt(value, 10) || 0;
    return (
      <View style={styles.row}>
        <Text style={styles.rowEmoji}>{emoji}</Text>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{n > 0 ? fmtINR(n) : '—'}</Text>
      </View>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Settings 🎀</Text>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>YOUR SETUP</Text>
          <Row emoji="💰" label="Monthly income" value={income} />
          <Row emoji="🎯" label="Monthly budget" value={budget} />
          <Row emoji="🛍️" label="Splurge fund" value={splurgeFund} />
        </View>

        <Pressable style={styles.resetBtn} onPress={confirmReset}>
          <Text style={styles.resetText}>reset app data (testing)</Text>
        </Pressable>
        <Text style={styles.note}>(yeh button onboarding dobara test karne ke liye hai)</Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg },
  heading: { fontSize: typography.heading.fontSize, fontWeight: '800', color: colors.text, marginBottom: spacing.lg },
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: radius.cards,
    padding: spacing.lg,
    shadowColor: colors.cardShadow,
    shadowOpacity: 1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardLabel: { fontSize: typography.tiny.fontSize, color: colors.textMuted, letterSpacing: 2, marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  rowEmoji: { fontSize: 20, marginRight: spacing.md },
  rowLabel: { flex: 1, fontSize: typography.body.fontSize, color: colors.text },
  rowValue: { fontSize: typography.body.fontSize, fontWeight: '700', color: colors.text },
  resetBtn: {
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.buttons,
    borderWidth: 1.5,
    borderColor: colors.coral,
    alignItems: 'center',
  },
  resetText: { color: colors.dangerDeep, fontSize: typography.body.fontSize, fontWeight: '700' },
  note: { fontSize: typography.small.fontSize, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm },
});

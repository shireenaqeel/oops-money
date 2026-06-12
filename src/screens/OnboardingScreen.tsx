// OnboardingScreen.tsx — first-launch welcome. The full income → budget → splurge flow comes in Feature 2.
// For now: a themed welcome with a button that marks onboarding done and reveals the main tabs.
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Screen } from '../components/shared';
import { useAppContext } from '../hooks/useAppContext';
import { colors, spacing, radius, typography } from '../constants/theme';

export default function OnboardingScreen() {
  const { completeOnboarding } = useAppContext();
  return (
    <Screen>
      <View style={styles.wrap}>
        <Text style={styles.emoji}>💸</Text>
        <Text style={styles.title}>Oops Money</Text>
        <Text style={styles.tagline}>oops, maine phir se kharch kar diya</Text>
        <Pressable style={styles.btn} onPress={completeOnboarding}>
          <Text style={styles.btnText}>chalo shuru karein ✦</Text>
        </Pressable>
        <Text style={styles.note}>(full setup — income, budget, splurge fund — Feature 2 mein aayega)</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emoji: { fontSize: 64, marginBottom: spacing.md },
  title: { fontSize: typography.heading.fontSize, fontWeight: '800', color: colors.text },
  tagline: { fontSize: typography.body.fontSize, color: colors.textLight, marginTop: spacing.xs, fontStyle: 'italic', textAlign: 'center' },
  btn: {
    backgroundColor: colors.rose,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.buttons,
    marginTop: spacing.xl,
  },
  btnText: { color: colors.cardBg, fontSize: typography.body.fontSize, fontWeight: '700' },
  note: { fontSize: typography.tiny.fontSize, color: colors.textMuted, marginTop: spacing.lg, textAlign: 'center' },
});

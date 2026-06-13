// NightShield.tsx — late-night shopping shield (V2). When you open the add-expense sheet
// between 11pm–4am, this sassy interception shows FIRST: sleep on it, or proceed anyway.
// It also surfaces one of your own future-me letters as a gentle reminder.
import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useAppContext } from '../hooks/useAppContext';
import { spacing, radius, typography, ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

// A few late-night sassy lines; one is picked at random each time the shield appears.
const LINES = [
  'raat ke is time pe cart bharne ka mann? 🌙',
  '3am ki shopping = subah ka regret, trust me',
  'late-night impulse detected... saans lo, babe ✨',
  'neend > Nykaa cart, I promise bestie',
  'kal subah bhi yeh deal yahin hogi (pakka)',
];

export default function NightShield({ onProceed, onSnooze }: { onProceed: () => void; onSnooze: () => void }) {
  const { letters } = useAppContext();
  const styles = makeStyles(useTheme());
  // Pick one sassy line + (if you've written any) one of your own future-me letters for this showing.
  const line = useMemo(() => LINES[Math.floor(Math.random() * LINES.length)], []);
  const letter = useMemo(() => (letters.length ? letters[Math.floor(Math.random() * letters.length)] : null), [letters]);

  return (
    <View style={styles.sheet}>
      <View style={styles.grabber} />
      <Text style={styles.moon}>🌙</Text>
      <Text style={styles.title}>so jao na, babe</Text>
      <Text style={styles.line}>{line}</Text>

      {/* your own past words, shown back to you */}
      {letter ? (
        <View style={styles.letterCard}>
          <Text style={styles.letterLabel}>tumne khud likha tha 💌</Text>
          <Text style={styles.letterText}>"{letter.text}"</Text>
        </View>
      ) : null}

      {/* primary: walk away */}
      <Pressable style={styles.sleepBtn} onPress={onSnooze}>
        <Text style={styles.sleepText}>theek hai, so jaati hoon 😴</Text>
      </Pressable>

      {/* secondary: proceed to the real form anyway */}
      <Pressable style={styles.proceedBtn} onPress={onProceed} hitSlop={8}>
        <Text style={styles.proceedText}>nahi, abhi log karna hai</Text>
      </Pressable>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  sheet: {
    backgroundColor: colors.cardBg,
    borderTopLeftRadius: radius.modals,
    borderTopRightRadius: radius.modals,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  grabber: { width: 40, height: 4, borderRadius: 999, backgroundColor: colors.border, marginBottom: spacing.lg },
  moon: { fontSize: 56, marginBottom: spacing.sm },
  title: { fontSize: typography.heading.fontSize, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  line: { fontSize: typography.body.fontSize, color: colors.textLight, textAlign: 'center', lineHeight: 22, marginBottom: spacing.lg },

  letterCard: {
    width: '100%',
    backgroundColor: colors.lilac,
    borderRadius: radius.inputs,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  letterLabel: { fontSize: typography.tiny.fontSize, color: colors.text, opacity: 0.6, letterSpacing: 1, marginBottom: spacing.xs },
  letterText: { fontSize: typography.body.fontSize, color: colors.text, fontStyle: 'italic', lineHeight: 21 },

  sleepBtn: { width: '100%', backgroundColor: colors.periwinkle, paddingVertical: spacing.md, borderRadius: radius.buttons, alignItems: 'center' },
  sleepText: { color: colors.onAccent, fontSize: typography.body.fontSize, fontWeight: '700' },
  proceedBtn: { paddingVertical: spacing.md, marginTop: spacing.xs },
  proceedText: { color: colors.textMuted, fontSize: typography.small.fontSize, fontWeight: '600' },
});

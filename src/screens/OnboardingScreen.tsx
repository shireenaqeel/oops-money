// OnboardingScreen.tsx — first-launch setup flow: income → budget → splurge fund → done (Feature 2).
// Collects 3 amounts over 3 steps, then saves everything and reveals the main tabs.
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Screen } from '../components/shared';
import { useAppContext } from '../hooks/useAppContext';
import { spacing, radius, typography, ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useLang } from '../hooks/useLang';
import { L } from '../i18n';
import { fmtINR } from '../utils';

// Static content for each step. `optional` steps can be skipped (saved as 0).
// Each step keeps a Hinglish + English title/subtitle; the right one is picked at render.
const STEPS = [
  {
    key: 'income' as const,
    emoji: '💰',
    title: 'Har mahine kitna aata hai?',
    titleEn: 'How much comes in each month?',
    subtitle: 'Salary, pocket money, freelance — total monthly income likho',
    subtitleEn: 'Salary, pocket money, freelance — write your total monthly income',
    placeholder: 'e.g. 30000',
    optional: false,
  },
  {
    key: 'budget' as const,
    emoji: '🎯',
    title: 'Kitna kharch karna hai?',
    titleEn: 'How much do you want to spend?',
    subtitle: 'Is mahine ka spending budget. Income se thoda kam rakhna = smart move!',
    subtitleEn: "This month's spending budget. Keeping it below income = smart move!",
    placeholder: 'e.g. 15000',
    optional: false,
  },
  {
    key: 'splurge' as const,
    emoji: '🛍️',
    title: 'Splurge fund banayein?',
    titleEn: 'Set up a splurge fund?',
    subtitle: 'Guilt-free shopping ke liye alag paisa. Isme kharch karo, no shame! (optional)',
    subtitleEn: 'Separate money for guilt-free shopping. Spend it, no shame! (optional)',
    placeholder: 'e.g. 3000',
    optional: true,
  },
];

export default function OnboardingScreen() {
  const { saveOnboarding } = useAppContext();
  const colors = useTheme();
  const styles = makeStyles(colors);
  useLang(); // subscribe so text re-renders when language toggles
  const [step, setStep] = useState(0);
  const [values, setValues] = useState({ income: '', budget: '', splurge: '' });

  const current = STEPS[step];
  const raw = values[current.key];
  const num = parseInt(raw, 10) || 0;
  const canContinue = current.optional || num > 0; // required steps need a positive amount
  const isLast = step === STEPS.length - 1;

  // Keep only digits as the user types (no symbols, no decimals — rupees only).
  function onChange(text: string) {
    const digits = text.replace(/[^0-9]/g, '');
    setValues((v) => ({ ...v, [current.key]: digits }));
  }

  // Advance to the next step, or finish + save on the last step.
  async function onNext() {
    if (!canContinue) return;
    if (isLast) {
      await saveOnboarding({
        income: values.income || '0',
        budget: values.budget || '0',
        splurgeFund: values.splurge || '0',
      });
    } else {
      setStep((s) => s + 1);
    }
  }

  // Go back one step (no-op on the first step).
  function onBack() {
    setStep((s) => Math.max(0, s - 1));
  }

  return (
    <Screen>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* progress dots */}
        <View style={styles.dots}>
          {STEPS.map((s, i) => (
            <View key={s.key} style={[styles.dot, i === step && styles.dotActive, i < step && styles.dotDone]} />
          ))}
        </View>

        {/* back button (hidden on first step) */}
        <Pressable onPress={onBack} style={styles.backBtn} hitSlop={12} disabled={step === 0}>
          <Text style={[styles.backText, step === 0 && styles.hidden]}>{L('‹ wapas', '‹ back')}</Text>
        </Pressable>

        <View style={styles.body}>
          <Text style={styles.emoji}>{current.emoji}</Text>
          <Text style={styles.title}>{L(current.title, current.titleEn)}</Text>
          <Text style={styles.subtitle}>{L(current.subtitle, current.subtitleEn)}</Text>

          {/* amount input */}
          <View style={styles.inputRow}>
            <Text style={styles.rupee}>₹</Text>
            <TextInput
              style={styles.input}
              value={raw}
              onChangeText={onChange}
              placeholder={current.placeholder}
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={onNext}
            />
          </View>

          {/* live formatted preview */}
          <Text style={styles.preview}>{num > 0 ? fmtINR(num) : ' '}</Text>
        </View>

        {/* continue / finish button */}
        <Pressable style={[styles.btn, !canContinue && styles.btnDisabled]} onPress={onNext} disabled={!canContinue}>
          <Text style={styles.btnText}>{isLast ? L('ho gaya, chalo! ✦', "all done, let's go! ✦") : L('aage badho ✦', 'next ✦')}</Text>
        </Pressable>

        {/* skip hint for the optional splurge step */}
        {current.optional && num === 0 ? (
          <Text style={styles.skipHint}>{L('khali chhod do toh skip ho jayega', 'leave it blank to skip')}</Text>
        ) : null}
      </KeyboardAvoidingView>
    </Screen>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  flex: { flex: 1, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.lg },
  dot: { width: 8, height: 8, borderRadius: 999, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.rose, width: 22 },
  dotDone: { backgroundColor: colors.mint },
  backBtn: { marginTop: spacing.md, alignSelf: 'flex-start' },
  backText: { fontSize: typography.body.fontSize, color: colors.textLight },
  hidden: { opacity: 0 },
  body: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emoji: { fontSize: 60, marginBottom: spacing.lg },
  title: { fontSize: typography.heading.fontSize, fontWeight: '800', color: colors.text, textAlign: 'center' },
  subtitle: {
    fontSize: typography.body.fontSize,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 21,
    paddingHorizontal: spacing.sm,
  },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xl },
  rupee: { fontSize: 40, color: colors.rose, fontWeight: '700', marginRight: spacing.xs },
  input: { fontSize: 44, fontWeight: '800', color: colors.text, minWidth: 120, textAlign: 'center' },
  preview: { fontSize: typography.body.fontSize, color: colors.textLight, marginTop: spacing.sm, minHeight: 22 },
  btn: { backgroundColor: colors.rose, paddingVertical: spacing.md, borderRadius: radius.buttons, alignItems: 'center' },
  btnDisabled: { backgroundColor: colors.textMuted, opacity: 0.5 },
  btnText: { color: colors.onAccent, fontSize: typography.body.fontSize, fontWeight: '700' },
  skipHint: { fontSize: typography.small.fontSize, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm },
});

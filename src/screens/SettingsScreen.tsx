// SettingsScreen.tsx — shows the saved onboarding values + a reset button (testing helper for now).
// Full settings UI (edit budget/income, notifications, etc.) gets built out in later features.
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, ScrollView, TextInput, Switch } from 'react-native';
import { Screen } from '../components/shared';
import CSVImportModal from './CSVImportModal';
import CycleTracker from '../components/CycleTracker';
import { useAppContext } from '../hooks/useAppContext';
import { colors, spacing, radius, typography } from '../constants/theme';
import { fmtINR } from '../utils';

export default function SettingsScreen() {
  const { income, budget, splurgeFund, letters, addLetter, deleteLetter, resetAll, nightShield, setNightShield } = useAppContext();
  const [draft, setDraft] = useState('');
  const [showImport, setShowImport] = useState(false);

  // Save the typed letter to your future self.
  function saveLetter() {
    const text = draft.trim();
    if (!text) return;
    addLetter(text);
    setDraft('');
  }

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

        {/* late-night shopping shield toggle */}
        <View style={styles.shieldRow}>
          <Text style={styles.shieldEmoji}>🌙</Text>
          <View style={styles.flex1}>
            <Text style={styles.shieldTitle}>Late-night shield</Text>
            <Text style={styles.shieldSub}>11pm–4am pe kharcha add karne se pehle ek "so jao babe" reminder</Text>
          </View>
          <Switch value={nightShield} onValueChange={setNightShield} trackColor={{ false: colors.border, true: colors.periwinkle }} thumbColor={colors.cardBg} />
        </View>

        {/* csv import */}
        <Pressable style={styles.importBtn} onPress={() => setShowImport(true)}>
          <Text style={styles.importEmoji}>📂</Text>
          <View style={styles.flex1}>
            <Text style={styles.importTitle}>Import bank statement</Text>
            <Text style={styles.importSub}>HDFC / ICICI / SBI / Paytm CSV — auto-detect categories</Text>
          </View>
          <Text style={styles.importArrow}>›</Text>
        </Pressable>

        {/* period / cycle tracking */}
        <CycleTracker />

        {/* future-me letters */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>FUTURE-ME LETTERS 💌</Text>
          <Text style={styles.letterHint}>future tum ko ek note likho — jail ke time yeh dikhega taaki yaad rahe kyun bachat kar rahi ho</Text>
          <TextInput
            style={styles.letterInput}
            value={draft}
            onChangeText={setDraft}
            placeholder="dear future me, please mat khareedna woh..."
            placeholderTextColor={colors.textMuted}
            multiline
          />
          <Pressable style={[styles.letterBtn, !draft.trim() && styles.letterBtnDisabled]} onPress={saveLetter} disabled={!draft.trim()}>
            <Text style={styles.letterBtnText}>save letter ✦</Text>
          </Pressable>

          {letters.map((l) => (
            <View key={l.id} style={styles.letterItem}>
              <Text style={styles.letterText}>💌 {l.text}</Text>
              <Pressable onPress={() => deleteLetter(l.id)} hitSlop={10}>
                <Text style={styles.letterDel}>✕</Text>
              </Pressable>
            </View>
          ))}
        </View>

        <Pressable style={styles.resetBtn} onPress={confirmReset}>
          <Text style={styles.resetText}>reset app data (testing)</Text>
        </Pressable>
        <Text style={styles.note}>(yeh button onboarding dobara test karne ke liye hai)</Text>
      </ScrollView>
      <CSVImportModal visible={showImport} onClose={() => setShowImport(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg },
  flex1: { flex: 1 },
  heading: { fontSize: typography.heading.fontSize, fontWeight: '800', color: colors.text, marginBottom: spacing.lg },
  shieldRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.lilac, borderRadius: radius.cards, padding: spacing.md, marginBottom: spacing.md },
  shieldEmoji: { fontSize: 22, marginRight: spacing.md },
  shieldTitle: { fontSize: typography.body.fontSize, fontWeight: '700', color: colors.text },
  shieldSub: { fontSize: typography.small.fontSize, color: colors.text, opacity: 0.7, marginTop: 1, marginRight: spacing.sm },
  importBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.powderBlue, borderRadius: radius.cards, padding: spacing.md, marginBottom: spacing.md },
  importEmoji: { fontSize: 22, marginRight: spacing.md },
  importTitle: { fontSize: typography.body.fontSize, fontWeight: '700', color: colors.text },
  importSub: { fontSize: typography.small.fontSize, color: colors.text, opacity: 0.7, marginTop: 1 },
  importArrow: { fontSize: 22, color: colors.text, opacity: 0.5 },
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
  letterHint: { fontSize: typography.small.fontSize, color: colors.textLight, lineHeight: 18, marginBottom: spacing.md },
  letterInput: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.inputs, padding: spacing.md, fontSize: typography.body.fontSize, color: colors.text, minHeight: 70, textAlignVertical: 'top' },
  letterBtn: { backgroundColor: colors.lilac, paddingVertical: spacing.sm, borderRadius: radius.buttons, alignItems: 'center', marginTop: spacing.sm },
  letterBtnDisabled: { backgroundColor: colors.textMuted, opacity: 0.5 },
  letterBtnText: { color: colors.cardBg, fontSize: typography.small.fontSize, fontWeight: '700' },
  letterItem: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.cream, borderRadius: radius.inputs, padding: spacing.md, marginTop: spacing.sm },
  letterText: { flex: 1, fontSize: typography.small.fontSize, color: colors.text, fontStyle: 'italic', lineHeight: 19 },
  letterDel: { fontSize: 14, color: colors.textMuted, marginLeft: spacing.sm },

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

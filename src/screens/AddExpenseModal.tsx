// AddExpenseModal.tsx — bottom-sheet form to log a spend: amount, category, mood, note, date, splurge (Feature 4).
// Controlled by a `visible` prop; calls addExpense() then closes. Uses React Native's built-in Modal (no extra package).
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Modal,
  ScrollView,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAppContext } from '../hooks/useAppContext';
import { colors, spacing, radius, typography } from '../constants/theme';
import { CATS, CAT_GROUPS, findCat } from '../constants/categories';
import { MOODS } from '../constants/moods';
import { COPY } from '../constants/copy';
import { fmtINR, getToday, getYesterday } from '../utils';

export default function AddExpenseModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { addExpense, customCats } = useAppContext();
  const allCats = [...CATS, ...customCats];
  const groups = ['All', ...CAT_GROUPS];

  const [amount, setAmount] = useState('');
  const [group, setGroup] = useState('All');
  const [catId, setCatId] = useState(CATS[0].id);
  const [mood, setMood] = useState('');
  const [note, setNote] = useState('');
  const [yesterday, setYesterday] = useState(false);
  const [isSplurge, setIsSplurge] = useState(false);
  const [saved, setSaved] = useState(false);

  const num = parseInt(amount, 10) || 0;
  const canLog = num > 0;
  const visibleCats = group === 'All' ? allCats : allCats.filter((c) => c.group === group);

  // Reset every field back to defaults.
  function reset() {
    setAmount('');
    setNote('');
    setMood('');
    setIsSplurge(false);
    setYesterday(false);
    setGroup('All');
    setCatId(CATS[0].id);
    setSaved(false);
  }

  // Clear the form and close the sheet.
  function close() {
    reset();
    onClose();
  }

  // Keep only digits as the amount is typed (rupees, no decimals).
  function onAmount(text: string) {
    setAmount(text.replace(/[^0-9]/g, ''));
  }

  // Save the expense, show a quick success state, then close.
  async function onLog() {
    if (!canLog) return;
    const cat = findCat(catId, customCats);
    await addExpense({
      amount: num,
      catId,
      note: note.trim(),
      date: yesterday ? getYesterday() : getToday(),
      color: cat.color,
      mood: mood || undefined,
      isSplurge,
    });
    setSaved(true);
    setTimeout(close, 900);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      {/* tap the dark area to dismiss */}
      <Pressable style={styles.overlay} onPress={close} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetWrap}>
        <ScrollView style={styles.sheet} contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.grabber} />
          <Text style={styles.title}>naya kharcha ✦</Text>

          {/* amount */}
          <Text style={styles.label}>{COPY.amountPlaceholder}</Text>
          <View style={styles.amountRow}>
            <Text style={styles.rupee}>₹</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={onAmount}
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              autoFocus
            />
          </View>

          {/* category groups */}
          <Text style={styles.label}>category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.groupStrip} contentContainerStyle={styles.groupStripContent}>
            {groups.map((g) => (
              <Pressable key={g} onPress={() => setGroup(g)} style={[styles.groupPill, group === g && styles.groupPillActive]}>
                <Text style={[styles.groupText, group === g && styles.groupTextActive]}>{g}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* category pills */}
          <View style={styles.catWrap}>
            {visibleCats.map((c) => {
              const selected = c.id === catId;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => setCatId(c.id)}
                  style={[styles.catPill, { backgroundColor: selected ? c.color : c.bg }]}
                >
                  <Text style={[styles.catText, selected && styles.catTextSelected]}>{c.name}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* mood */}
          <Text style={styles.label}>kaisa mood tha? (optional)</Text>
          <View style={styles.moodRow}>
            {MOODS.map((m) => {
              const selected = m.id === mood;
              return (
                <Pressable key={m.id} onPress={() => setMood(selected ? '' : m.id)} style={[styles.moodPill, selected && styles.moodPillActive]}>
                  <Text style={styles.moodEmoji}>{m.emoji}</Text>
                  <Text style={[styles.moodLabel, selected && styles.moodLabelActive]}>{m.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* note */}
          <TextInput
            style={styles.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder="little note... (Sephora haul, gym fee, etc.)"
            placeholderTextColor={colors.textMuted}
          />

          {/* date toggle */}
          <View style={styles.dateRow}>
            <Pressable onPress={() => setYesterday(false)} style={[styles.datePill, !yesterday && styles.datePillActive]}>
              <Text style={[styles.dateText, !yesterday && styles.dateTextActive]}>Today</Text>
            </Pressable>
            <Pressable onPress={() => setYesterday(true)} style={[styles.datePill, yesterday && styles.datePillActive]}>
              <Text style={[styles.dateText, yesterday && styles.dateTextActive]}>Yesterday</Text>
            </Pressable>
          </View>

          {/* splurge toggle */}
          <View style={styles.splurgeRow}>
            <View style={styles.flex1}>
              <Text style={styles.splurgeTitle}>Splurge fund se? 🛍️</Text>
              <Text style={styles.splurgeSub}>guilt-free zone — no shame babe</Text>
            </View>
            <Switch
              value={isSplurge}
              onValueChange={setIsSplurge}
              trackColor={{ false: colors.border, true: colors.rose }}
              thumbColor={colors.cardBg}
            />
          </View>

          {/* log button */}
          <Pressable style={[styles.logBtn, saved && styles.logBtnSaved, !canLog && styles.logBtnDisabled]} onPress={onLog} disabled={!canLog || saved}>
            <Text style={styles.logText}>{saved ? COPY.logged : 'log this spend ✦'}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#00000055' },
  sheetWrap: { flex: 1, justifyContent: 'flex-end' },
  sheet: { maxHeight: '90%', backgroundColor: colors.cardBg, borderTopLeftRadius: radius.modals, borderTopRightRadius: radius.modals },
  sheetContent: { padding: spacing.lg, paddingBottom: spacing.xl },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 999, backgroundColor: colors.border, marginBottom: spacing.md },
  title: { fontSize: typography.title.fontSize, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  label: { fontSize: typography.small.fontSize, color: colors.textLight, marginTop: spacing.md, marginBottom: spacing.sm },
  flex1: { flex: 1 },

  amountRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: spacing.xs },
  rupee: { fontSize: 32, color: colors.rose, fontWeight: '700', marginRight: spacing.sm },
  amountInput: { flex: 1, fontSize: 36, fontWeight: '800', color: colors.text },

  groupStrip: { marginBottom: spacing.sm },
  groupStripContent: { gap: spacing.sm, paddingRight: spacing.md },
  groupPill: { paddingVertical: spacing.xs, paddingHorizontal: spacing.md, borderRadius: radius.chips, backgroundColor: colors.cream },
  groupPillActive: { backgroundColor: colors.lavender },
  groupText: { fontSize: typography.small.fontSize, color: colors.textLight, fontWeight: '600' },
  groupTextActive: { color: colors.cardBg },

  catWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  catPill: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.chips },
  catText: { fontSize: typography.small.fontSize, color: colors.text, fontWeight: '500' },
  catTextSelected: { color: colors.cardBg, fontWeight: '700' },

  moodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  moodPill: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xs, paddingHorizontal: spacing.md, borderRadius: radius.chips, backgroundColor: colors.cream },
  moodPillActive: { backgroundColor: colors.butter },
  moodEmoji: { fontSize: 16 },
  moodLabel: { fontSize: typography.small.fontSize, color: colors.textLight },
  moodLabelActive: { color: colors.text, fontWeight: '700' },

  noteInput: { borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: spacing.sm, fontSize: typography.body.fontSize, color: colors.text, marginTop: spacing.md },

  dateRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  datePill: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: radius.chips, backgroundColor: colors.cream },
  datePillActive: { backgroundColor: colors.skyBlue },
  dateText: { fontSize: typography.small.fontSize, color: colors.textLight, fontWeight: '600' },
  dateTextActive: { color: colors.cardBg },

  splurgeRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.lg, backgroundColor: colors.blush, borderRadius: radius.inputs, padding: spacing.md },
  splurgeTitle: { fontSize: typography.body.fontSize, fontWeight: '700', color: colors.text },
  splurgeSub: { fontSize: typography.small.fontSize, color: colors.textLight, marginTop: 1 },

  logBtn: { backgroundColor: colors.rose, paddingVertical: spacing.md, borderRadius: radius.buttons, alignItems: 'center', marginTop: spacing.xl },
  logBtnSaved: { backgroundColor: colors.mint },
  logBtnDisabled: { backgroundColor: colors.textMuted, opacity: 0.5 },
  logText: { color: colors.cardBg, fontSize: typography.body.fontSize, fontWeight: '700' },
});

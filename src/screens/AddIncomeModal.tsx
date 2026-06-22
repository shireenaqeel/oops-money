// AddIncomeModal.tsx — log money IN (salary, gift, refund, etc.). Mirrors AddExpenseModal but
// simpler: amount, source, note, date. Pass `editing` to edit an existing income.
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Modal, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAppContext } from '../hooks/useAppContext';
import { Income } from '../types';
import { spacing, radius, typography, ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useLang } from '../hooks/useLang';
import { L } from '../i18n';
import { fmtDateLabel, getToday, getYesterday } from '../utils';
import { INCOME_SOURCES, findSource } from '../constants/incomes';

const INCOME_GREEN = '#5FBF93'; // fixed green accent so it reads as "money in" in every theme

// Local yyyy-mm-dd for a picked Date.
function isoOf(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export default function AddIncomeModal({
  visible,
  onClose,
  editing,
}: {
  visible: boolean;
  onClose: () => void;
  editing?: Income | null;
}) {
  const { addIncome, updateIncome, deleteIncome } = useAppContext();
  const colors = useTheme();
  const styles = makeStyles(colors);
  useLang(); // subscribe so text re-renders when language toggles
  const isEditing = !!editing;
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState(INCOME_SOURCES[0].id);
  const [note, setNote] = useState('');
  const [date, setDate] = useState(getToday());
  const [showPicker, setShowPicker] = useState(false);

  // Reset / prefill each time the sheet opens.
  useEffect(() => {
    if (!visible) return;
    if (editing) {
      setAmount(String(editing.amount));
      setSource(editing.source);
      setNote(editing.note);
      setDate(editing.date);
    } else {
      setAmount('');
      setSource(INCOME_SOURCES[0].id);
      setNote('');
      setDate(getToday());
    }
  }, [visible, editing]);

  const num = parseInt(amount, 10) || 0;
  const canSave = num > 0;
  const isToday = date === getToday();
  const isYesterday = date === getYesterday();
  const isOtherDate = !isToday && !isYesterday;

  // Save the income (add or update) and close.
  async function onSave() {
    if (!canSave) return;
    const payload = { amount: num, source, note: note.trim(), date, color: findSource(source).color };
    if (editing) await updateIncome(editing.id, payload);
    else await addIncome(payload);
    onClose();
  }

  // Confirm then delete (edit mode only).
  function onDelete() {
    if (!editing) return;
    Alert.alert(L('income hatana hai?', 'Delete this income?'), L('Yeh entry delete ho jayegi.', 'This income entry will be removed.'), [
      { text: L('rehne do', 'cancel'), style: 'cancel' },
      { text: L('haan, delete', 'yes, delete'), style: 'destructive', onPress: async () => { await deleteIncome(editing.id); onClose(); } },
    ]);
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.flex1} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>{isEditing ? L('income edit karo 💰', 'edit income 💰') : L('paisa aaya! 💰', 'money in! 💰')}</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>

          {/* amount */}
          <Text style={styles.label}>{L('kitna aaya, babe?', 'how much, babe?')}</Text>
          <View style={styles.amountRow}>
            <Text style={styles.rupee}>₹</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={(t) => setAmount(t.replace(/[^0-9]/g, ''))}
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              autoFocus={!isEditing}
            />
          </View>

          {/* source */}
          <Text style={styles.label}>{L('kahan se aaya?', 'where from?')}</Text>
          <View style={styles.sourceWrap}>
            {INCOME_SOURCES.map((s) => {
              const selected = s.id === source;
              return (
                <Pressable key={s.id} onPress={() => setSource(s.id)} style={[styles.sourcePill, { backgroundColor: selected ? s.color : s.bg }]}>
                  <Text style={[styles.sourceText, selected && styles.sourceTextSelected]}>{s.name}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* date */}
          <Text style={styles.label}>{L('kab aaya?', 'when?')}</Text>
          <View style={styles.dateRow}>
            <Pressable onPress={() => setDate(getToday())} style={[styles.datePill, isToday && styles.datePillActive]}>
              <Text style={[styles.dateText, isToday && styles.dateTextActive]}>{L('Today', 'Today')}</Text>
            </Pressable>
            <Pressable onPress={() => setDate(getYesterday())} style={[styles.datePill, isYesterday && styles.datePillActive]}>
              <Text style={[styles.dateText, isYesterday && styles.dateTextActive]}>{L('Yesterday', 'Yesterday')}</Text>
            </Pressable>
            <Pressable onPress={() => setShowPicker(true)} style={[styles.datePill, isOtherDate && styles.datePillActive]}>
              <Text style={[styles.dateText, isOtherDate && styles.dateTextActive]}>{isOtherDate ? `📅 ${fmtDateLabel(date)}` : L('📅 koi din', '📅 pick a day')}</Text>
            </Pressable>
          </View>
          {showPicker ? (
            <DateTimePicker
              value={new Date(date + 'T00:00:00')}
              mode="date"
              maximumDate={new Date()}
              onChange={(event, selected) => {
                setShowPicker(false);
                if (event.type === 'set' && selected) setDate(isoOf(selected));
              }}
            />
          ) : null}

          {/* note */}
          <TextInput
            style={styles.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder={L('note... (June salary, mummy ne diya, etc.)', 'note... (June salary, from mom, etc.)')}
            placeholderTextColor={colors.textMuted}
          />

          {/* save */}
          <Pressable style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]} onPress={onSave} disabled={!canSave}>
            <Text style={styles.saveText}>{isEditing ? L('save changes ✦', 'save changes ✦') : L('add income 💰', 'add income 💰')}</Text>
          </Pressable>

          {isEditing ? (
            <Pressable style={styles.deleteBtn} onPress={onDelete}>
              <Text style={styles.deleteText}>{L('🗑️ delete', '🗑️ delete')}</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  flex1: { flex: 1, backgroundColor: colors.cream },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  title: { fontSize: typography.heading.fontSize, fontWeight: '800', color: colors.text },
  close: { fontSize: 20, color: colors.textMuted },
  label: { fontSize: typography.small.fontSize, color: colors.textLight, marginTop: spacing.lg, marginBottom: spacing.sm },
  amountRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: INCOME_GREEN, paddingBottom: spacing.xs },
  rupee: { fontSize: typography.display.fontSize, fontWeight: '800', color: colors.text, marginRight: spacing.xs },
  amountInput: { flex: 1, fontSize: typography.display.fontSize, fontWeight: '800', color: colors.text, padding: 0 },
  sourceWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  sourcePill: { borderRadius: radius.chips, paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  sourceText: { fontSize: typography.small.fontSize, color: colors.text, fontWeight: '600' },
  sourceTextSelected: { color: '#FFFFFF' },
  dateRow: { flexDirection: 'row', gap: spacing.sm },
  datePill: { backgroundColor: colors.cardBg, borderRadius: radius.chips, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border },
  datePillActive: { backgroundColor: INCOME_GREEN, borderColor: INCOME_GREEN },
  dateText: { fontSize: typography.small.fontSize, color: colors.textLight, fontWeight: '600' },
  dateTextActive: { color: '#FFFFFF' },
  noteInput: { marginTop: spacing.lg, borderWidth: 1, borderColor: colors.border, borderRadius: radius.inputs, padding: spacing.md, fontSize: typography.body.fontSize, color: colors.text, backgroundColor: colors.cardBg },
  saveBtn: { backgroundColor: INCOME_GREEN, paddingVertical: spacing.md, borderRadius: radius.buttons, alignItems: 'center', marginTop: spacing.xl },
  saveBtnDisabled: { opacity: 0.45 },
  saveText: { color: '#FFFFFF', fontSize: typography.body.fontSize, fontWeight: '700' },
  deleteBtn: { alignItems: 'center', paddingVertical: spacing.md, marginTop: spacing.xs },
  deleteText: { color: colors.dangerDeep, fontSize: typography.small.fontSize, fontWeight: '600' },
});

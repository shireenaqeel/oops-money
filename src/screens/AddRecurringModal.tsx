// AddRecurringModal.tsx — sheet to add a recurring monthly bill: name, amount, day of month, category (Feature 10).
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { useAppContext } from '../hooks/useAppContext';
import { colors, spacing, radius, typography } from '../constants/theme';
import { findCat } from '../constants/categories';

// Common categories for bills (keeps the picker short).
const BILL_CATS = ['rent', 'subscriptions', 'utilities', 'gym', 'transport', 'medicines', 'padhai'];

export default function AddRecurringModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { addRecurring } = useAppContext();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [day, setDay] = useState('');
  const [catId, setCatId] = useState(BILL_CATS[0]);

  // Reset each time the sheet opens.
  useEffect(() => {
    if (visible) {
      setName('');
      setAmount('');
      setDay('');
      setCatId(BILL_CATS[0]);
    }
  }, [visible]);

  const num = parseInt(amount, 10) || 0;
  const dayNum = parseInt(day, 10) || 0;
  const canSave = name.trim().length > 0 && num > 0 && dayNum >= 1 && dayNum <= 31;

  // Create the bill and close.
  async function onSave() {
    if (!canSave) return;
    await addRecurring(name.trim(), num, catId, dayNum);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.wrap}>
        <View style={styles.sheet}>
          <View style={styles.grabber} />
          <Text style={styles.title}>recurring bill add karo 🔁</Text>

          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="bill name (Netflix, Rent, Gym...)" placeholderTextColor={colors.textMuted} autoFocus />
          <View style={styles.row}>
            <View style={[styles.amountBox, styles.flex1]}>
              <Text style={styles.rupee}>₹</Text>
              <TextInput style={styles.amountInput} value={amount} onChangeText={(t) => setAmount(t.replace(/[^0-9]/g, ''))} placeholder="amount" placeholderTextColor={colors.textMuted} keyboardType="number-pad" />
            </View>
            <View style={styles.dayBox}>
              <TextInput style={styles.dayInput} value={day} onChangeText={(t) => setDay(t.replace(/[^0-9]/g, '').slice(0, 2))} placeholder="day" placeholderTextColor={colors.textMuted} keyboardType="number-pad" />
            </View>
          </View>
          <Text style={styles.dayHint}>mahine ke kaunse din due hota hai? (1–31)</Text>

          <Text style={styles.label}>category</Text>
          <View style={styles.catWrap}>
            {BILL_CATS.map((id) => {
              const cat = findCat(id);
              const selected = id === catId;
              return (
                <Pressable key={id} onPress={() => setCatId(id)} style={[styles.catPill, { backgroundColor: selected ? cat.color : cat.bg }]}>
                  <Text style={[styles.catText, selected && styles.catTextSelected]}>{cat.name}</Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable style={[styles.btn, !canSave && styles.btnDisabled]} onPress={onSave} disabled={!canSave}>
            <Text style={styles.btnText}>save bill ✦</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#00000055' },
  wrap: { flex: 1, justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.cardBg, borderTopLeftRadius: radius.modals, borderTopRightRadius: radius.modals, padding: spacing.lg, paddingBottom: spacing.xl },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 999, backgroundColor: colors.border, marginBottom: spacing.md },
  title: { fontSize: typography.title.fontSize, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  flex1: { flex: 1 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.inputs, padding: spacing.md, fontSize: typography.body.fontSize, color: colors.text, marginBottom: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
  amountBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: radius.inputs, paddingHorizontal: spacing.md },
  rupee: { fontSize: 18, color: colors.skyBlue, fontWeight: '700', marginRight: spacing.xs },
  amountInput: { flex: 1, paddingVertical: spacing.md, fontSize: typography.body.fontSize, color: colors.text },
  dayBox: { width: 70, borderWidth: 1, borderColor: colors.border, borderRadius: radius.inputs },
  dayInput: { paddingVertical: spacing.md, fontSize: typography.body.fontSize, color: colors.text, textAlign: 'center' },
  dayHint: { fontSize: typography.tiny.fontSize, color: colors.textMuted, marginTop: spacing.xs },
  label: { fontSize: typography.small.fontSize, color: colors.textLight, marginTop: spacing.md, marginBottom: spacing.sm },
  catWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  catPill: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.chips },
  catText: { fontSize: typography.small.fontSize, color: colors.text, fontWeight: '500' },
  catTextSelected: { color: colors.cardBg, fontWeight: '700' },
  btn: { backgroundColor: colors.skyBlue, paddingVertical: spacing.md, borderRadius: radius.buttons, alignItems: 'center', marginTop: spacing.lg },
  btnDisabled: { backgroundColor: colors.textMuted, opacity: 0.5 },
  btnText: { color: colors.cardBg, fontSize: typography.body.fontSize, fontWeight: '700' },
});

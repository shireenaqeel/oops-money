// AddToJailModal.tsx — small sheet to sentence a tempting item to impulse jail: name, amount, optional why (Feature 8).
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { useAppContext } from '../hooks/useAppContext';
import BrokeMath from '../components/BrokeMath';
import { colors, spacing, radius, typography } from '../constants/theme';
import { COPY } from '../constants/copy';

export default function AddToJailModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { addImpulse } = useAppContext();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);

  // Reset fields each time the sheet opens.
  useEffect(() => {
    if (visible) {
      setName('');
      setAmount('');
      setNote('');
      setSaved(false);
    }
  }, [visible]);

  const num = parseInt(amount, 10) || 0;
  const canSave = name.trim().length > 0 && num > 0;

  // Sentence the item, show the success line, then close.
  async function onSentence() {
    if (!canSave) return;
    await addImpulse(name.trim(), num, note.trim());
    setSaved(true);
    setTimeout(onClose, 1000);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.wrap}>
        <View style={styles.sheet}>
          <View style={styles.grabber} />
          <Text style={styles.title}>impulse jail mein daalo 🔒</Text>
          <Text style={styles.sub}>jo cheez khareedne ka mann hai — 24 ghante ruko, phir decide karo</Text>

          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="kya cheez? (woh dress, gadget...)"
            placeholderTextColor={colors.textMuted}
            autoFocus
          />
          <View style={styles.amountRow}>
            <Text style={styles.rupee}>₹</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={(t) => setAmount(t.replace(/[^0-9]/g, ''))}
              placeholder="kitne ka hai?"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
            />
          </View>
          <BrokeMath amount={num} />
          <TextInput
            style={styles.input}
            value={note}
            onChangeText={setNote}
            placeholder="kyun chahiye? (optional)"
            placeholderTextColor={colors.textMuted}
          />

          <Pressable style={[styles.btn, saved && styles.btnSaved, !canSave && styles.btnDisabled]} onPress={onSentence} disabled={!canSave || saved}>
            <Text style={styles.btnText}>{saved ? COPY.jailSuccess : 'sentence it 🔒'}</Text>
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
  title: { fontSize: typography.title.fontSize, fontWeight: '700', color: colors.text },
  sub: { fontSize: typography.small.fontSize, color: colors.textLight, marginTop: spacing.xs, marginBottom: spacing.md, lineHeight: 19 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.inputs, padding: spacing.md, fontSize: typography.body.fontSize, color: colors.text, marginBottom: spacing.sm },
  amountRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: radius.inputs, paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  rupee: { fontSize: 20, color: colors.lilac, fontWeight: '700', marginRight: spacing.xs },
  amountInput: { flex: 1, paddingVertical: spacing.md, fontSize: typography.body.fontSize, color: colors.text },
  btn: { backgroundColor: colors.lilac, paddingVertical: spacing.md, borderRadius: radius.buttons, alignItems: 'center', marginTop: spacing.md },
  btnSaved: { backgroundColor: colors.mint },
  btnDisabled: { backgroundColor: colors.textMuted, opacity: 0.5 },
  btnText: { color: colors.cardBg, fontSize: typography.body.fontSize, fontWeight: '700' },
});

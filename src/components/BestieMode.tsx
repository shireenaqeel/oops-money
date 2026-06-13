// BestieMode.tsx — accountability bestie (V2, local), lives in Settings.
// Save a bestie (name + optional WhatsApp number); "confess" opens WhatsApp/share with a sassy auto-message.
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useAppContext } from '../hooks/useAppContext';
import { colors, spacing, radius, typography } from '../constants/theme';
import { monthExpenses, sumExpenses } from '../utils/calculations';
import { buildConfession, confessToBestie } from '../utils/bestie';

export default function BestieMode() {
  const { bestieName, bestiePhone, setBestie, expenses, budget } = useAppContext();
  const [name, setName] = useState(bestieName);
  const [phone, setPhone] = useState(bestiePhone);
  const saved = bestieName.trim().length > 0;
  const dirty = name.trim() !== bestieName || phone.trim() !== bestiePhone;

  // This month's spend vs budget, for the confession message.
  const now = new Date();
  const spent = sumExpenses(monthExpenses(expenses, now.getMonth(), now.getFullYear()));
  const bud = parseInt(budget, 10) || 0;

  // Open WhatsApp / share sheet with the auto-built confession.
  function confess() {
    const msg = buildConfession(spent, bud, name.trim() || bestieName);
    confessToBestie(msg, phone.trim() || bestiePhone);
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>BESTIE MODE 🤝</Text>
      <Text style={styles.hint}>apni accountability bestie add karo — jab budget gaya, ek tap me unhe confess karo (WhatsApp/SMS se). sab tumhare phone pe, koi data share nahi hota apne aap.</Text>

      <View style={styles.row}>
        <Text style={styles.emoji}>👯</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="bestie ka naam"
          placeholderTextColor={colors.textMuted}
        />
      </View>
      <View style={styles.row}>
        <Text style={styles.emoji}>📱</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="WhatsApp number (optional, with code: 91...)"
          placeholderTextColor={colors.textMuted}
          keyboardType="phone-pad"
        />
      </View>

      <Pressable style={[styles.saveBtn, !dirty && styles.saveBtnDisabled]} onPress={() => setBestie(name.trim(), phone.trim())} disabled={!dirty}>
        <Text style={styles.saveText}>{saved ? 'update bestie ✦' : 'save bestie ✦'}</Text>
      </Pressable>

      {saved ? (
        <Pressable style={styles.confessBtn} onPress={confess}>
          <Text style={styles.confessText}>💌 confess to {bestieName} now</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: radius.cards,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: colors.cardShadow,
    shadowOpacity: 1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardLabel: { fontSize: typography.tiny.fontSize, color: colors.textMuted, letterSpacing: 2, marginBottom: spacing.sm },
  hint: { fontSize: typography.small.fontSize, color: colors.textLight, lineHeight: 18, marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cream, borderRadius: radius.inputs, paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  emoji: { fontSize: 18, marginRight: spacing.sm },
  input: { flex: 1, paddingVertical: spacing.sm, fontSize: typography.body.fontSize, color: colors.text },
  saveBtn: { backgroundColor: colors.lavender, paddingVertical: spacing.sm, borderRadius: radius.buttons, alignItems: 'center', marginTop: spacing.xs },
  saveBtnDisabled: { backgroundColor: colors.textMuted, opacity: 0.5 },
  saveText: { color: colors.cardBg, fontSize: typography.small.fontSize, fontWeight: '700' },
  confessBtn: { backgroundColor: colors.coral, paddingVertical: spacing.md, borderRadius: radius.buttons, alignItems: 'center', marginTop: spacing.sm },
  confessText: { color: colors.text, fontSize: typography.body.fontSize, fontWeight: '700' },
});

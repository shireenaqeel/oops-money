// RegretAuditModal.tsx — reviews purchases that are 7+ days old and unrated, one at a time (Feature 9).
// For each, you tap worth it / meh / regret. The verdict is saved on the expense.
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import { useAppContext } from '../hooks/useAppContext';
import { Expense } from '../types';
import { colors, spacing, radius, typography } from '../constants/theme';
import { fmtINR, fmtDateLabel, daysSince } from '../utils';
import { findCat } from '../constants/categories';
import { COPY } from '../constants/copy';

const VERDICTS = [
  { id: 'worth', emoji: '😍', label: 'worth it!' },
  { id: 'meh', emoji: '😐', label: 'meh' },
  { id: 'regret', emoji: '😭', label: 'regret' },
] as const;

export default function RegretAuditModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { expenses, customCats, rateExpense } = useAppContext();
  const [queue, setQueue] = useState<Expense[]>([]);
  const [index, setIndex] = useState(0);

  // Snapshot the eligible items when the sheet opens (7+ days old and not yet rated).
  useEffect(() => {
    if (visible) {
      setQueue(expenses.filter((e) => daysSince(e.date) >= 7 && !e.regret));
      setIndex(0);
    }
  }, [visible]);

  const current = queue[index];

  // Save the verdict and move to the next item.
  function rate(verdict: 'worth' | 'meh' | 'regret') {
    if (!current) return;
    rateExpense(current.id, verdict);
    setIndex((i) => i + 1);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={styles.wrap}>
        <View style={styles.sheet}>
          <View style={styles.grabber} />
          {!current ? (
            <View style={styles.doneWrap}>
              <Text style={styles.doneEmoji}>✨</Text>
              <Text style={styles.doneText}>{queue.length === 0 ? 'kuch review karne ko nahi babe — sab fresh hai' : 'all done! honesty looks good on you 💅'}</Text>
              <Pressable style={styles.closeBtn} onPress={onClose}>
                <Text style={styles.closeText}>ho gaya ✦</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <Text style={styles.progress}>
                {index + 1} / {queue.length}
              </Text>
              <Text style={styles.prompt}>{COPY.regretPrompt}</Text>

              <View style={styles.itemCard}>
                <Text style={styles.itemEmoji}>{findCat(current.catId, customCats).name.split(' ')[0]}</Text>
                <Text style={styles.itemAmt}>{fmtINR(current.amount)}</Text>
                <Text style={styles.itemName}>{current.note || findCat(current.catId, customCats).name}</Text>
                <Text style={styles.itemDate}>
                  {daysSince(current.date)} days ago · {fmtDateLabel(current.date)}
                </Text>
              </View>

              <View style={styles.verdicts}>
                {VERDICTS.map((v) => (
                  <Pressable key={v.id} style={styles.verdictBtn} onPress={() => rate(v.id)}>
                    <Text style={styles.verdictEmoji}>{v.emoji}</Text>
                    <Text style={styles.verdictLabel}>{v.label}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#00000055' },
  wrap: { flex: 1, justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.cardBg, borderTopLeftRadius: radius.modals, borderTopRightRadius: radius.modals, padding: spacing.lg, paddingBottom: spacing.xl },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 999, backgroundColor: colors.border, marginBottom: spacing.md },

  progress: { fontSize: typography.tiny.fontSize, color: colors.textMuted, letterSpacing: 1, textAlign: 'center' },
  prompt: { fontSize: typography.title.fontSize, fontWeight: '700', color: colors.text, textAlign: 'center', marginTop: spacing.xs, marginBottom: spacing.lg },

  itemCard: { backgroundColor: colors.coral, borderRadius: radius.cards, padding: spacing.lg, alignItems: 'center' },
  itemEmoji: { fontSize: 36 },
  itemAmt: { fontSize: typography.display.fontSize, fontWeight: '800', color: colors.text, marginTop: spacing.xs },
  itemName: { fontSize: typography.body.fontSize, color: colors.text, marginTop: spacing.xs, textAlign: 'center' },
  itemDate: { fontSize: typography.small.fontSize, color: colors.text, opacity: 0.7, marginTop: spacing.xs },

  verdicts: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  verdictBtn: { flex: 1, backgroundColor: colors.cream, borderRadius: radius.inputs, paddingVertical: spacing.md, alignItems: 'center' },
  verdictEmoji: { fontSize: 26 },
  verdictLabel: { fontSize: typography.small.fontSize, color: colors.text, fontWeight: '600', marginTop: spacing.xs },

  doneWrap: { alignItems: 'center', paddingVertical: spacing.lg },
  doneEmoji: { fontSize: 44, marginBottom: spacing.md },
  doneText: { fontSize: typography.body.fontSize, color: colors.textLight, textAlign: 'center', marginBottom: spacing.lg },
  closeBtn: { backgroundColor: colors.rose, paddingVertical: spacing.md, paddingHorizontal: spacing.xl, borderRadius: radius.buttons },
  closeText: { color: colors.cardBg, fontSize: typography.body.fontSize, fontWeight: '700' },
});

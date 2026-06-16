// GoalsModal.tsx — "Sapna Jar" savings goals (V2). Set a dream, stash money toward it, watch the jar fill.
// Opened from Settings. Fully local — just a list of goals with a saved/target progress bar.
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Modal, ScrollView } from 'react-native';
import { useAppContext } from '../hooks/useAppContext';
import { spacing, radius, typography, ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useLang } from '../hooks/useLang';
import { L } from '../i18n';
import { fmtINR } from '../utils';

// Keep only digits from a typed amount.
const digits = (t: string) => t.replace(/[^0-9]/g, '');

export default function GoalsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { goals, addGoal, addToGoal, withdrawFromGoal, deleteGoal } = useAppContext();
  const colors = useTheme();
  const styles = makeStyles(colors);
  useLang(); // subscribe so text re-renders when language toggles
  const [emoji, setEmoji] = useState('🫙');
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [amts, setAmts] = useState<Record<string, string>>({}); // per-goal "add savings" inputs

  // Create a new goal from the form, then reset it.
  function create() {
    const t = parseInt(target, 10) || 0;
    if (!name.trim() || t <= 0) return;
    addGoal(name.trim(), emoji.trim() || '🫙', t);
    setName('');
    setTarget('');
    setEmoji('🫙');
  }

  // The amount typed for a given goal (or 0).
  const amtOf = (id: string) => parseInt(amts[id] || '', 10) || 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={styles.sheetWrap}>
        <ScrollView style={styles.sheet} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.grabber} />
          <Text style={styles.title}>{L('Sapna Jar 🫙', 'Dream Jar 🫙')}</Text>
          <Text style={styles.sub}>{L('apne sapne ke liye paise side karo — jar bharta dekho ✨', 'set money aside for your dream — watch the jar fill ✨')}</Text>

          {/* new goal form */}
          <View style={styles.form}>
            <View style={styles.formTop}>
              <TextInput style={styles.emojiInput} value={emoji} onChangeText={setEmoji} maxLength={2} />
              <TextInput
                style={styles.nameInput}
                value={name}
                onChangeText={setName}
                placeholder={L('sapna (jaise: Goa trip)', 'dream (e.g. Goa trip)')}
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <View style={styles.formBottom}>
              <View style={styles.targetRow}>
                <Text style={styles.rupee}>₹</Text>
                <TextInput
                  style={styles.targetInput}
                  value={target}
                  onChangeText={(t) => setTarget(digits(t))}
                  placeholder={L('target', 'target')}
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                />
              </View>
              <Pressable style={[styles.addGoalBtn, (!name.trim() || !target) && styles.disabled]} onPress={create} disabled={!name.trim() || !target}>
                <Text style={styles.addGoalText}>{L('+ naya sapna', '+ new dream')}</Text>
              </Pressable>
            </View>
          </View>

          {/* goals list */}
          {goals.length === 0 ? (
            <Text style={styles.empty}>{L('abhi koi sapna nahi babe — ek add karo ✨', 'no dreams yet babe — add one ✨')}</Text>
          ) : (
            goals.map((g) => {
              const pct = g.target > 0 ? Math.min(Math.round((g.saved / g.target) * 100), 100) : 0;
              const done = g.saved >= g.target;
              const left = Math.max(g.target - g.saved, 0);
              return (
                <View key={g.id} style={styles.goalCard}>
                  <View style={styles.goalHead}>
                    <Text style={styles.goalEmoji}>{g.emoji}</Text>
                    <View style={styles.flex1}>
                      <Text style={styles.goalName}>{g.name}</Text>
                      <Text style={styles.goalAmt}>
                        {fmtINR(g.saved)} <Text style={styles.goalOf}>/ {fmtINR(g.target)}</Text> · {pct}%
                      </Text>
                    </View>
                    <Pressable onPress={() => deleteGoal(g.id)} hitSlop={10}>
                      <Text style={styles.del}>✕</Text>
                    </Pressable>
                  </View>

                  <View style={styles.track}>
                    <View style={[styles.fill, { width: `${pct}%`, backgroundColor: done ? colors.mint : colors.sage }]} />
                  </View>

                  {done ? (
                    <Text style={styles.doneText}>{L('🎉 sapna poora! you did it babe 💚', '🎉 dream complete! you did it babe 💚')}</Text>
                  ) : (
                    <Text style={styles.leftText}>{L(`${fmtINR(left)} aur — almost there 🌸`, `${fmtINR(left)} more — almost there 🌸`)}</Text>
                  )}

                  {/* add / withdraw savings */}
                  <View style={styles.actionRow}>
                    <View style={styles.amtBox}>
                      <Text style={styles.amtRupee}>₹</Text>
                      <TextInput
                        style={styles.amtInput}
                        value={amts[g.id] || ''}
                        onChangeText={(t) => setAmts((p) => ({ ...p, [g.id]: digits(t) }))}
                        placeholder={L('amount', 'amount')}
                        placeholderTextColor={colors.textMuted}
                        keyboardType="number-pad"
                      />
                    </View>
                    <Pressable
                      style={[styles.jodoBtn, amtOf(g.id) <= 0 && styles.disabled]}
                      disabled={amtOf(g.id) <= 0}
                      onPress={() => {
                        addToGoal(g.id, amtOf(g.id));
                        setAmts((p) => ({ ...p, [g.id]: '' }));
                      }}
                    >
                      <Text style={styles.jodoText}>{L('jodo 🪙', 'add 🪙')}</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.nikaloBtn, amtOf(g.id) <= 0 && styles.disabled]}
                      disabled={amtOf(g.id) <= 0}
                      onPress={() => {
                        withdrawFromGoal(g.id, amtOf(g.id));
                        setAmts((p) => ({ ...p, [g.id]: '' }));
                      }}
                    >
                      <Text style={styles.nikaloText}>{L('nikalo', 'withdraw')}</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })
          )}

          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>{L('done ✦', 'done ✦')}</Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#00000055' },
  sheetWrap: { flex: 1, justifyContent: 'flex-end' },
  sheet: { maxHeight: '90%', backgroundColor: colors.cardBg, borderTopLeftRadius: radius.modals, borderTopRightRadius: radius.modals },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 999, backgroundColor: colors.border, marginBottom: spacing.md },
  flex1: { flex: 1 },
  title: { fontSize: typography.title.fontSize, fontWeight: '700', color: colors.text },
  sub: { fontSize: typography.small.fontSize, color: colors.textLight, marginTop: 2, marginBottom: spacing.lg },

  form: { backgroundColor: colors.blush, borderRadius: radius.inputs, padding: spacing.md, marginBottom: spacing.lg },
  formTop: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  emojiInput: { width: 46, textAlign: 'center', backgroundColor: colors.cardBg, borderRadius: radius.small, fontSize: 20, paddingVertical: spacing.sm },
  nameInput: { flex: 1, backgroundColor: colors.cardBg, borderRadius: radius.small, paddingHorizontal: spacing.md, fontSize: typography.body.fontSize, color: colors.text },
  formBottom: { flexDirection: 'row', gap: spacing.sm },
  targetRow: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardBg, borderRadius: radius.small, paddingHorizontal: spacing.md },
  rupee: { fontSize: 16, color: colors.rose, fontWeight: '700', marginRight: spacing.xs },
  targetInput: { flex: 1, paddingVertical: spacing.sm, fontSize: typography.body.fontSize, color: colors.text },
  addGoalBtn: { backgroundColor: colors.rose, paddingHorizontal: spacing.md, justifyContent: 'center', borderRadius: radius.small },
  addGoalText: { color: colors.onAccent, fontWeight: '700', fontSize: typography.small.fontSize },

  empty: { fontSize: typography.body.fontSize, color: colors.textLight, fontStyle: 'italic', textAlign: 'center', paddingVertical: spacing.lg },

  goalCard: { backgroundColor: colors.cream, borderRadius: radius.inputs, padding: spacing.md, marginBottom: spacing.md },
  goalHead: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  goalEmoji: { fontSize: 26, marginRight: spacing.sm },
  goalName: { fontSize: typography.body.fontSize, fontWeight: '700', color: colors.text },
  goalAmt: { fontSize: typography.small.fontSize, color: colors.text, marginTop: 1 },
  goalOf: { color: colors.textLight },
  del: { fontSize: 16, color: colors.textMuted, paddingHorizontal: spacing.xs },

  track: { height: 10, backgroundColor: colors.cardBg, borderRadius: radius.chips, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.chips },
  doneText: { fontSize: typography.small.fontSize, color: colors.sage, fontWeight: '700', marginTop: spacing.sm },
  leftText: { fontSize: typography.small.fontSize, color: colors.textLight, marginTop: spacing.sm },

  actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  amtBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardBg, borderRadius: radius.chips, paddingHorizontal: spacing.md },
  amtRupee: { fontSize: 15, color: colors.rose, fontWeight: '700', marginRight: spacing.xs },
  amtInput: { flex: 1, paddingVertical: spacing.sm, fontSize: typography.small.fontSize, color: colors.text },
  jodoBtn: { backgroundColor: colors.mint, paddingHorizontal: spacing.md, justifyContent: 'center', borderRadius: radius.chips },
  jodoText: { color: colors.text, fontWeight: '700', fontSize: typography.small.fontSize },
  nikaloBtn: { backgroundColor: colors.cream, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, justifyContent: 'center', borderRadius: radius.chips },
  nikaloText: { color: colors.textLight, fontWeight: '600', fontSize: typography.small.fontSize },
  disabled: { opacity: 0.4 },

  closeBtn: { backgroundColor: colors.lavender, paddingVertical: spacing.md, borderRadius: radius.buttons, alignItems: 'center', marginTop: spacing.sm },
  closeText: { color: colors.onAccent, fontSize: typography.body.fontSize, fontWeight: '700' },
});

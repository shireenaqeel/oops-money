// MonthlyWrappedModal.tsx — a shareable "wrapped" recap of the current month (Feature 16).
// Uses React Native's built-in Share for a text recap (no extra package).
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, ScrollView, Share, ActivityIndicator } from 'react-native';
import { useAppContext } from '../hooks/useAppContext';
import { Expense } from '../types';
import { spacing, radius, typography, ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useLang } from '../hooks/useLang';
import { L, getLang } from '../i18n';
import { fmtINR } from '../utils';
import { monthExpenses, sumExpenses, getStreaks } from '../utils/calculations';
import { generateWrapped } from '../utils/gemini';
import { findCat } from '../constants/categories';
import { MOODS } from '../constants/moods';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function MonthlyWrappedModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { expenses, budget, impulse, customCats, geminiKey } = useAppContext();
  const colors = useTheme();
  const styles = makeStyles(colors);
  useLang();
  const useAI = geminiKey.trim().length > 0;
  const [narrative, setNarrative] = useState<string | null>(null);
  const [aiState, setAiState] = useState<'idle' | 'loading' | 'error'>('idle');

  // One stat tile inside the wrapped card (defined here so it can read the themed styles).
  const Stat = ({ emoji, value, label }: { emoji: string; value: string; label: string }) => (
    <View style={styles.stat}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const now = new Date();
  const monthName = MONTH_NAMES[now.getMonth()];
  const thisMonth = monthExpenses(expenses, now.getMonth(), now.getFullYear());
  const total = sumExpenses(thisMonth);

  // top category by spend
  const catTotals = new Map<string, number>();
  thisMonth.forEach((e) => catTotals.set(e.catId, (catTotals.get(e.catId) || 0) + e.amount));
  let topCatId = '';
  let topCatVal = 0;
  catTotals.forEach((v, k) => {
    if (v > topCatVal) {
      topCatVal = v;
      topCatId = k;
    }
  });
  const topCat = topCatId ? findCat(topCatId, customCats) : null;

  // biggest single purchase
  const biggest = thisMonth.reduce<Expense | null>((m, e) => (e.amount > (m?.amount ?? 0) ? e : m), null);

  // money resisted in impulse jail (buried)
  const savedInJail = impulse.filter((i) => i.status === 'buried').reduce((s, i) => s + i.amount, 0);

  // top mood by spend
  const moodTotals = MOODS.map((mood) => ({ mood, amt: sumExpenses(thisMonth.filter((e) => e.mood === mood.id)) })).sort((a, b) => b.amt - a.amt);
  const topMood = moodTotals[0]?.amt > 0 ? moodTotals[0].mood : null;

  const noSpendDays = getStreaks(expenses, budget).noSpendDays;
  const regretCount = thisMonth.filter((e) => e.regret === 'regret').length;

  // Plain-facts summary of the month, fed to the AI to write the recap from.
  const budgetNum = Number(budget) || 0;
  const facts = [
    `Month: ${monthName}.`,
    `Total spent: ${fmtINR(total)}.`,
    budgetNum > 0 ? `Budget was ${fmtINR(budgetNum)} — ${total > budgetNum ? `went over by ${fmtINR(total - budgetNum)}` : `stayed under, saved ${fmtINR(budgetNum - total)}`}.` : '',
    topCat ? `Top category: ${topCat.name} (${fmtINR(topCatVal)}).` : '',
    biggest ? `Biggest single purchase: ${fmtINR(biggest.amount)}.` : '',
    `${thisMonth.length} transactions.`,
    `${noSpendDays} no-spend days.`,
    savedInJail > 0 ? `Resisted ${fmtINR(savedInJail)} of impulse buys in "jail".` : '',
    topMood ? `Spent most when feeling: ${topMood.label}.` : '',
    regretCount > 0 ? `${regretCount} purchases tagged as regrets.` : 'No regrets tagged.',
  ].filter(Boolean).join(' ');

  // Ask the AI to write the recap (only when a key is set).
  async function makeNarrative() {
    setAiState('loading');
    const res = await generateWrapped(geminiKey.trim(), facts, getLang() === 'hinglish');
    if (res.ok) {
      setNarrative(res.text);
      setAiState('idle');
    } else {
      setAiState('error');
    }
  }

  // Auto-write it once when the modal opens with a key set and enough data.
  useEffect(() => {
    if (visible && useAI && !narrative && aiState === 'idle' && thisMonth.length > 0) makeNarrative();
    if (!visible) { setNarrative(null); setAiState('idle'); } // reset for next open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Share a text version of the recap (includes the AI paragraph when present).
  function onShare() {
    const lines = [
      `✨ my ${monthName} money wrapped ✨`,
      ``,
      narrative ? `${narrative}\n` : '',
      `💸 spent: ${fmtINR(total)}`,
      topCat ? `🏆 top: ${topCat.name} (${fmtINR(topCatVal)})` : '',
      `🧾 ${thisMonth.length} transactions`,
      `🍽️ ${noSpendDays} no-spend days`,
      savedInJail > 0 ? `🪦 resisted ${fmtINR(savedInJail)} of impulse buys` : '',
      `— tracked on Oops Money 🌸`,
    ].filter(Boolean);
    Share.share({ message: lines.join('\n') });
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={styles.wrap}>
        <ScrollView style={styles.sheet} contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false}>
          <View style={styles.grabber} />

          <View style={styles.card}>
            <Text style={styles.kicker}>my money wrapped ✨</Text>
            <Text style={styles.month}>{monthName}</Text>

            <Text style={styles.bigLabel}>total spent</Text>
            <Text style={styles.bigValue}>{fmtINR(total)}</Text>

            <View style={styles.statsGrid}>
              <Stat emoji={topCat ? topCat.name.split(' ')[0] : '✨'} value={topCat ? fmtINR(topCatVal) : '—'} label="top category" />
              <Stat emoji="💥" value={biggest ? fmtINR(biggest.amount) : '—'} label="biggest splurge" />
              <Stat emoji="🍽️" value={String(noSpendDays)} label="no-spend days" />
              <Stat emoji="🪦" value={savedInJail > 0 ? fmtINR(savedInJail) : '₹0'} label="resisted in jail" />
              <Stat emoji={topMood ? topMood.emoji : '😶'} value={topMood ? topMood.label : '—'} label="top mood" />
              <Stat emoji="😭" value={String(regretCount)} label="regrets" />
            </View>

            {/* AI-written recap (only with a Gemini key) */}
            {useAI ? (
              <View style={styles.aiBox}>
                <View style={styles.aiHead}>
                  <Text style={styles.aiKicker}>{L('AI recap ✨', 'AI recap ✨')}</Text>
                  {aiState !== 'loading' ? (
                    <Pressable onPress={makeNarrative} hitSlop={8}>
                      <Text style={styles.aiRedo}>{narrative || aiState === 'error' ? L('🔄 dubara', '🔄 redo') : ''}</Text>
                    </Pressable>
                  ) : null}
                </View>
                {aiState === 'loading' ? (
                  <View style={styles.aiLoading}>
                    <ActivityIndicator size="small" color={colors.text} />
                    <Text style={styles.aiLoadingText}>{L('Paisa tumhara mahina likh rahi hai…', 'Paisa is writing your month…')}</Text>
                  </View>
                ) : aiState === 'error' ? (
                  <Text style={styles.aiErr}>{L('AI recap abhi nahi ban paya 🙈 dubara try karo', "couldn't write the recap just now 🙈 tap redo")}</Text>
                ) : narrative ? (
                  <Text style={styles.aiText}>{narrative}</Text>
                ) : null}
              </View>
            ) : null}

            <Text style={styles.footer}>Oops Money 🌸</Text>
          </View>

          <Pressable style={styles.shareBtn} onPress={onShare}>
            <Text style={styles.shareText}>share it ✦</Text>
          </Pressable>
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>close</Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#00000066' },
  wrap: { flex: 1, justifyContent: 'flex-end' },
  sheet: { maxHeight: '92%', backgroundColor: colors.cream, borderTopLeftRadius: radius.modals, borderTopRightRadius: radius.modals },
  sheetContent: { padding: spacing.lg, paddingBottom: spacing.xl },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 999, backgroundColor: colors.border, marginBottom: spacing.md },

  card: { backgroundColor: colors.lavender, borderRadius: radius.cards, padding: spacing.lg, alignItems: 'center' },
  kicker: { fontSize: typography.tiny.fontSize, color: colors.onAccent, letterSpacing: 2, textTransform: 'uppercase' },
  month: { fontSize: typography.heading.fontSize, fontWeight: '800', color: colors.onAccent },
  bigLabel: { fontSize: typography.small.fontSize, color: colors.onAccent, opacity: 0.85, marginTop: spacing.md },
  bigValue: { fontSize: typography.display.fontSize, fontWeight: '800', color: colors.onAccent },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
  stat: { width: '47%', flexGrow: 1, backgroundColor: colors.cardBg, borderRadius: radius.inputs, padding: spacing.md, alignItems: 'center' },
  statEmoji: { fontSize: 22 },
  statValue: { fontSize: typography.body.fontSize, fontWeight: '800', color: colors.text, marginTop: 2 },
  statLabel: { fontSize: typography.tiny.fontSize, color: colors.textLight, marginTop: 1 },

  aiBox: { alignSelf: 'stretch', backgroundColor: colors.cardBg, borderRadius: radius.inputs, padding: spacing.md, marginTop: spacing.lg },
  aiHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
  aiKicker: { fontSize: typography.tiny.fontSize, color: colors.textMuted, letterSpacing: 2, textTransform: 'uppercase' },
  aiRedo: { fontSize: typography.tiny.fontSize, color: colors.textLight, fontWeight: '700' },
  aiText: { fontSize: typography.small.fontSize, color: colors.text, lineHeight: 21 },
  aiLoading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  aiLoadingText: { fontSize: typography.small.fontSize, color: colors.textLight, fontStyle: 'italic' },
  aiErr: { fontSize: typography.small.fontSize, color: colors.textLight },

  footer: { fontSize: typography.small.fontSize, color: colors.onAccent, fontStyle: 'italic', marginTop: spacing.lg },

  shareBtn: { backgroundColor: colors.rose, paddingVertical: spacing.md, borderRadius: radius.buttons, alignItems: 'center', marginTop: spacing.lg },
  shareText: { color: colors.onAccent, fontSize: typography.body.fontSize, fontWeight: '700' },
  closeBtn: { paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.xs },
  closeText: { color: colors.textLight, fontSize: typography.body.fontSize },
});

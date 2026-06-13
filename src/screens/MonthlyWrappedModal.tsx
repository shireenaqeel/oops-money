// MonthlyWrappedModal.tsx — a shareable "wrapped" recap of the current month (Feature 16).
// Uses React Native's built-in Share for a text recap (no extra package).
import React from 'react';
import { View, Text, Pressable, StyleSheet, Modal, ScrollView, Share } from 'react-native';
import { useAppContext } from '../hooks/useAppContext';
import { Expense } from '../types';
import { spacing, radius, typography, ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { fmtINR } from '../utils';
import { monthExpenses, sumExpenses, getStreaks } from '../utils/calculations';
import { findCat } from '../constants/categories';
import { MOODS } from '../constants/moods';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function MonthlyWrappedModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { expenses, budget, impulse, customCats } = useAppContext();
  const colors = useTheme();
  const styles = makeStyles(colors);

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

  // Share a text version of the recap.
  function onShare() {
    const lines = [
      `✨ my ${monthName} money wrapped ✨`,
      ``,
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

  footer: { fontSize: typography.small.fontSize, color: colors.onAccent, fontStyle: 'italic', marginTop: spacing.lg },

  shareBtn: { backgroundColor: colors.rose, paddingVertical: spacing.md, borderRadius: radius.buttons, alignItems: 'center', marginTop: spacing.lg },
  shareText: { color: colors.onAccent, fontSize: typography.body.fontSize, fontWeight: '700' },
  closeBtn: { paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.xs },
  closeText: { color: colors.textLight, fontSize: typography.body.fontSize },
});

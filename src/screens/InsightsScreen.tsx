// InsightsScreen.tsx — summary cards, 7-day bar, 6-month trend, category breakdown, and tips (Feature 6).
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Screen } from '../components/shared';
import BarChart, { BarDatum } from '../components/BarChart';
import { useAppContext } from '../hooks/useAppContext';
import { colors, spacing, radius, typography } from '../constants/theme';
import { fmtINR } from '../utils';
import { monthExpenses, sumExpenses } from '../utils/calculations';
import { findCat } from '../constants/categories';

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// Local yyyy-mm-dd for a Date (matches how expenses store their date).
function toISO(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export default function InsightsScreen() {
  const { expenses, budget, customCats } = useAppContext();

  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  const thisMonth = monthExpenses(expenses, month, year);
  const total = sumExpenses(thisMonth);
  const dayAvg = Math.round(total / Math.max(now.getDate(), 1));

  // Spend per category this month, biggest first.
  const byCat = [...new Set(thisMonth.map((e) => e.catId))]
    .map((catId) => ({ cat: findCat(catId, customCats), amount: sumExpenses(thisMonth.filter((e) => e.catId === catId)) }))
    .sort((a, b) => b.amount - a.amount);

  // Last 7 days (uses all expenses, not just this month).
  const weekData: BarDatum[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - 6 + i);
    const iso = toISO(d);
    return { label: DAY_LETTERS[d.getDay()], value: sumExpenses(expenses.filter((e) => e.date === iso)) };
  });

  // Last 6 months trend.
  const monthData: BarDatum[] = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now);
    d.setMonth(now.getMonth() - 5 + i);
    return { label: MONTHS_SHORT[d.getMonth()], value: sumExpenses(monthExpenses(expenses, d.getMonth(), d.getFullYear())) };
  });

  // Friendly tips based on the numbers.
  const tips = buildTips(total, byCat, budget, now);

  if (expenses.length === 0) {
    return (
      <Screen>
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📊</Text>
          <Text style={styles.emptyText}>add some spends first babe</Text>
          <Text style={styles.emptyHint}>insights tabhi dikhenge jab thoda data hoga ✨</Text>
        </View>
      </Screen>
    );
  }

  const summary = [
    { icon: '💸', val: fmtINR(total), label: 'total spent' },
    { icon: '📅', val: fmtINR(dayAvg), label: 'daily avg' },
    { icon: byCat[0]?.cat.name.split(' ')[0] ?? '✨', val: byCat[0] ? fmtINR(byCat[0].amount) : '—', label: 'biggest splurge' },
    { icon: '🗂️', val: String(byCat.length), label: 'categories used' },
  ];

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>Insights ✿</Text>

        {/* summary cards */}
        <View style={styles.grid}>
          {summary.map((c, i) => (
            <View key={i} style={styles.gridCard}>
              <Text style={styles.gridIcon}>{c.icon}</Text>
              <Text style={styles.gridVal}>{c.val}</Text>
              <Text style={styles.gridLabel}>{c.label}</Text>
            </View>
          ))}
        </View>

        {/* weekly chart */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>LAST 7 DAYS ✦</Text>
          <BarChart data={weekData} color={colors.rose} />
        </View>

        {/* monthly chart */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>6 MONTH TREND ✦</Text>
          <BarChart data={monthData} color={colors.lavender} />
        </View>

        {/* category breakdown */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>WHERE IT WENT ✦</Text>
          {byCat.length === 0 ? (
            <Text style={styles.muted}>is mahine ka kuch nahi — abhi tak 🌸</Text>
          ) : (
            byCat.map(({ cat, amount }) => {
              const pct = total > 0 ? Math.round((amount / total) * 100) : 0;
              return (
                <View key={cat.id} style={styles.breakRow}>
                  <View style={styles.breakTop}>
                    <Text style={styles.breakName}>{cat.name}</Text>
                    <Text style={styles.breakAmt}>
                      {fmtINR(amount)} <Text style={styles.breakPct}>{pct}%</Text>
                    </Text>
                  </View>
                  <View style={styles.breakTrack}>
                    <View style={[styles.breakFill, { width: `${pct}%`, backgroundColor: cat.color }]} />
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* tips */}
        {tips.length > 0 ? (
          <View style={styles.tipsCard}>
            <Text style={styles.sectionLabel}>POOKIE'S ADVICE ✦</Text>
            {tips.map((t, i) => (
              <Text key={i} style={styles.tipLine}>
                {t}
              </Text>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

// Build a few personalised tips (mirrors the prototype's advice rules).
function buildTips(total: number, byCat: { cat: { name: string }; amount: number }[], budgetStr: string, now: Date): string[] {
  const tips: string[] = [];
  if (total === 0) {
    tips.push('Start logging your spends to get personalised tips 🌸');
    return tips;
  }
  const budget = Number(budgetStr) || 0;
  const remaining = budget - total;
  if (byCat[0]) {
    tips.push(`💡 ${byCat[0].cat.name} is your top category. 24-hour rule try karo — ek din ruko phir socho still chahiye kya!`);
  }
  if (budget > 0 && total <= budget) {
    const daysLeft = Math.max(30 - now.getDate(), 1);
    tips.push(`✨ ${fmtINR(remaining)} bacha hai — yaani ~${fmtINR(Math.round(remaining / daysLeft))} per day month end tak!`);
  }
  if (budget > 0 && total / budget > 0.9) {
    tips.push('🎯 Budget limit ke kareeb! Ab sirf zaroori kharche — month end aa raha hai.');
  }
  return tips;
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  heading: { fontSize: typography.heading.fontSize, fontWeight: '800', color: colors.text, marginBottom: spacing.md },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  gridCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: colors.cardBg,
    borderRadius: radius.cards,
    padding: spacing.md,
    shadowColor: colors.cardShadow,
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  gridIcon: { fontSize: 20, marginBottom: spacing.xs },
  gridVal: { fontSize: typography.title.fontSize, fontWeight: '700', color: colors.text },
  gridLabel: { fontSize: typography.tiny.fontSize, color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 },

  card: {
    backgroundColor: colors.cardBg,
    borderRadius: radius.cards,
    padding: spacing.lg,
    marginTop: spacing.md,
    shadowColor: colors.cardShadow,
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  sectionLabel: { fontSize: typography.tiny.fontSize, color: colors.textMuted, letterSpacing: 2, marginBottom: spacing.md },
  muted: { fontSize: typography.small.fontSize, color: colors.textLight },

  breakRow: { marginBottom: spacing.md },
  breakTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  breakName: { fontSize: typography.small.fontSize, color: colors.text },
  breakAmt: { fontSize: typography.small.fontSize, color: colors.text, fontWeight: '700' },
  breakPct: { color: colors.textLight, fontWeight: '400' },
  breakTrack: { height: 7, backgroundColor: colors.cream, borderRadius: radius.chips, overflow: 'hidden' },
  breakFill: { height: '100%', borderRadius: radius.chips },

  tipsCard: { backgroundColor: colors.butter, borderRadius: radius.cards, padding: spacing.lg, marginTop: spacing.md },
  tipLine: { fontSize: typography.small.fontSize, color: colors.text, lineHeight: 20, marginBottom: spacing.sm },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyEmoji: { fontSize: 44, marginBottom: spacing.md },
  emptyText: { fontSize: typography.body.fontSize, color: colors.textLight, fontStyle: 'italic' },
  emptyHint: { fontSize: typography.small.fontSize, color: colors.textMuted, marginTop: spacing.xs },
});

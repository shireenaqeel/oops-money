// HomeScreen.tsx — the main screen: budget card, danger alerts, and recent expenses (Feature 3).
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Alert as RNAlert } from 'react-native';
import { Screen } from '../components/shared';
import AddExpenseModal from './AddExpenseModal';
import RegretAuditModal from './RegretAuditModal';
import { useAppContext } from '../hooks/useAppContext';
import { Expense } from '../types';
import { colors, spacing, radius, typography } from '../constants/theme';
import { fmtINR, fmtDateLabel, getToday, daysSince } from '../utils';
import { monthExpenses, sumExpenses, getBudgetState, getAlerts } from '../utils/calculations';
import { findCat } from '../constants/categories';
import { COPY } from '../constants/copy';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function HomeScreen() {
  const { expenses, budget, customCats, deleteExpense } = useAppContext();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [showRegret, setShowRegret] = useState(false);

  // Purchases that are 7+ days old and not yet rated — ready for a "was it worth it?" check.
  const regretCount = expenses.filter((e) => daysSince(e.date) >= 7 && !e.regret).length;

  // Open the modal to log a new expense.
  function openAdd() {
    setEditing(null);
    setShowAdd(true);
  }

  // Open the modal pre-filled to edit an existing expense.
  function openEdit(e: Expense) {
    setEditing(e);
    setShowAdd(true);
  }

  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  const thisMonth = monthExpenses(expenses, month, year);
  const spent = sumExpenses(thisMonth);
  const bs = getBudgetState(spent, budget);
  const alerts = getAlerts(expenses, budget, customCats, month, year, getToday());
  const recent = thisMonth.slice(0, 8); // newest first (expenses are stored newest-first)

  // Confirm, then delete an expense.
  function askDelete(id: string) {
    RNAlert.alert('Delete this kharcha?', 'Pakka hatana hai?', [
      { text: 'rehne do', style: 'cancel' },
      { text: 'haan, delete', style: 'destructive', onPress: () => deleteExpense(id) },
    ]);
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.diaryLabel}>my money diary ✦</Text>

        {/* ── budget card ── */}
        <View style={styles.card}>
          <Text style={styles.spentLabel}>spent in {MONTH_NAMES[month]}</Text>
          <Text style={styles.bigTotal}>{fmtINR(spent)}</Text>

          {bs.hasBudget ? (
            <>
              <View style={styles.pill}>
                <Text style={styles.pillText}>
                  {bs.over ? `${fmtINR(Math.abs(bs.remaining))} over 💀` : `${fmtINR(bs.remaining)} left 🌸`}
                </Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${bs.pct}%`, backgroundColor: bs.barColor }]} />
              </View>
              <Text style={styles.barCaption}>
                {bs.over ? 'oops, budget gaya — sambhaalo babe' : bs.pct >= 75 ? COPY.nearBudget : COPY.budgetSafe}
              </Text>
            </>
          ) : (
            <Text style={styles.noBudget}>Settings mein budget set karo taaki track kar sako 🎯</Text>
          )}
        </View>

        {/* ── regret audit nudge ── */}
        {regretCount > 0 ? (
          <Pressable style={styles.regretBanner} onPress={() => setShowRegret(true)}>
            <Text style={styles.regretEmoji}>🤔</Text>
            <View style={styles.flex1}>
              <Text style={styles.regretTitle}>was it worth it?</Text>
              <Text style={styles.regretSub}>{regretCount} purchase{regretCount > 1 ? 's' : ''} ready for a regret check</Text>
            </View>
            <Text style={styles.regretArrow}>›</Text>
          </Pressable>
        ) : null}

        {/* ── danger alerts ── */}
        {alerts.map((a, i) => (
          <View key={i} style={styles.alertCard}>
            <Text style={styles.alertEmoji}>{a.emoji}</Text>
            <View style={styles.flex1}>
              <Text style={styles.alertTitle}>{a.title}</Text>
              <Text style={styles.alertSub}>{a.sub}</Text>
            </View>
          </View>
        ))}

        {/* ── recent expenses ── */}
        <Text style={styles.sectionLabel}>RECENT</Text>
        {recent.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🌷</Text>
            <Text style={styles.emptyText}>{COPY.empty}</Text>
            <Text style={styles.emptyHint}>neeche pink "+" dabake apna pehla kharcha add karo ✨</Text>
          </View>
        ) : (
          recent.map((e) => {
            const cat = findCat(e.catId, customCats);
            const emoji = cat.name.split(' ')[0];
            const label = cat.name.slice(cat.name.indexOf(' ') + 1);
            return (
              <Pressable key={e.id} style={styles.histItem} onPress={() => openEdit(e)}>
                <View style={[styles.histIcon, { backgroundColor: cat.bg }]}>
                  <Text style={styles.histEmoji}>{emoji}</Text>
                </View>
                <View style={styles.flex1}>
                  <Text style={styles.histName}>{label}</Text>
                  {e.note ? (
                    <Text style={styles.histNote} numberOfLines={1}>
                      {e.note}
                    </Text>
                  ) : null}
                  <Text style={styles.histDate}>
                    {fmtDateLabel(e.date)}
                    {e.mood ? ` · ${e.mood}` : ''}
                    {e.isSplurge ? ' · splurge 🛍️' : ''}
                  </Text>
                </View>
                <Text style={styles.histAmount}>{fmtINR(e.amount)}</Text>
                <Pressable onPress={() => askDelete(e.id)} hitSlop={10} style={styles.delBtn}>
                  <Text style={styles.delText}>✕</Text>
                </Pressable>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      {/* floating + button to log a new expense */}
      <Pressable style={styles.fab} onPress={openAdd}>
        <Text style={styles.fabPlus}>+</Text>
      </Pressable>

      <AddExpenseModal
        visible={showAdd}
        editing={editing}
        onClose={() => {
          setShowAdd(false);
          setEditing(null);
        }}
      />
      <RegretAuditModal visible={showRegret} onClose={() => setShowRegret(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  flex1: { flex: 1, minWidth: 0 },
  diaryLabel: { fontSize: typography.tiny.fontSize, color: colors.textMuted, letterSpacing: 3, textTransform: 'uppercase', textAlign: 'center', marginBottom: spacing.md },

  // budget card
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: radius.cards,
    padding: spacing.lg,
    alignItems: 'center',
    shadowColor: colors.cardShadow,
    shadowOpacity: 1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  spentLabel: { fontSize: typography.small.fontSize, color: colors.textLight },
  bigTotal: { fontSize: typography.display.fontSize, fontWeight: '800', color: colors.text, marginTop: spacing.xs },
  pill: { backgroundColor: colors.cream, borderRadius: radius.chips, paddingVertical: spacing.xs, paddingHorizontal: spacing.md, marginTop: spacing.md },
  pillText: { fontSize: typography.small.fontSize, color: colors.text, fontWeight: '700' },
  barTrack: { height: 8, width: '100%', backgroundColor: colors.cream, borderRadius: radius.chips, marginTop: spacing.md, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: radius.chips },
  barCaption: { fontSize: typography.small.fontSize, color: colors.textLight, marginTop: spacing.sm, textAlign: 'center' },
  noBudget: { fontSize: typography.small.fontSize, color: colors.textLight, marginTop: spacing.md, textAlign: 'center' },

  // regret banner
  regretBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.coral, borderRadius: radius.inputs, padding: spacing.md, marginTop: spacing.md },
  regretEmoji: { fontSize: 22, marginRight: spacing.md },
  regretTitle: { fontSize: typography.body.fontSize, fontWeight: '700', color: colors.text },
  regretSub: { fontSize: typography.small.fontSize, color: colors.text, opacity: 0.75, marginTop: 1 },
  regretArrow: { fontSize: 22, color: colors.text, opacity: 0.5 },

  // alerts
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.blush,
    borderRadius: radius.inputs,
    padding: spacing.md,
    marginTop: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.rose,
  },
  alertEmoji: { fontSize: 22, marginRight: spacing.md },
  alertTitle: { fontSize: typography.body.fontSize, fontWeight: '700', color: colors.dangerDeep },
  alertSub: { fontSize: typography.small.fontSize, color: colors.text, marginTop: 2 },

  // recent
  sectionLabel: { fontSize: typography.tiny.fontSize, color: colors.textMuted, letterSpacing: 2, marginTop: spacing.xl, marginBottom: spacing.sm },
  histItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: radius.inputs,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: colors.cardShadow,
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  histIcon: { width: 38, height: 38, borderRadius: 999, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  histEmoji: { fontSize: 18 },
  histName: { fontSize: typography.body.fontSize, fontWeight: '600', color: colors.text },
  histNote: { fontSize: typography.small.fontSize, color: colors.textLight, fontStyle: 'italic', marginTop: 1 },
  histDate: { fontSize: typography.tiny.fontSize, color: colors.textMuted, marginTop: 2 },
  histAmount: { fontSize: typography.body.fontSize, fontWeight: '700', color: colors.text, marginHorizontal: spacing.sm },
  delBtn: { padding: spacing.xs },
  delText: { fontSize: 14, color: colors.textMuted },

  // empty
  empty: { alignItems: 'center', paddingVertical: spacing.xl },
  emptyEmoji: { fontSize: 40, marginBottom: spacing.sm },
  emptyText: { fontSize: typography.body.fontSize, color: colors.textLight, fontStyle: 'italic' },
  emptyHint: { fontSize: typography.small.fontSize, color: colors.textMuted, marginTop: spacing.xs, textAlign: 'center' },

  // floating action button
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 58,
    height: 58,
    borderRadius: 999,
    backgroundColor: colors.rose,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.rose,
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  fabPlus: { color: colors.cardBg, fontSize: 30, fontWeight: '400', marginTop: -2 },
});

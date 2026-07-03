// HomeScreen.tsx — the main screen: budget card, danger alerts, and recent expenses (Feature 3).
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Alert as RNAlert } from 'react-native';
import { Screen } from '../components/shared';
import AddExpenseModal from './AddExpenseModal';
import AddIncomeModal from './AddIncomeModal';
import IncomeHistoryModal from './IncomeHistoryModal';
import RegretAuditModal from './RegretAuditModal';
import BillDuePrompt from './BillDuePrompt';
import AlertList from '../components/AlertList';
import QuickAddBar from '../components/QuickAddBar';
import { useAppContext } from '../hooks/useAppContext';
import { Expense } from '../types';
import { spacing, radius, typography, ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useLang } from '../hooks/useLang';
import { L } from '../i18n';
import { fmtINR, fmtDateLabel, getToday, daysSince } from '../utils';
import { monthExpenses, sumExpenses, getBudgetState, getAlerts, getStreaks } from '../utils/calculations';
import { buildConfession, confessToBestie } from '../utils/bestie';
import { findCat } from '../constants/categories';
import { findSource, sumIncomes, monthIncomes } from '../constants/incomes';
import { Income } from '../types';
import { COPY } from '../constants/copy';

const INCOME_GREEN = '#5FBF93';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const REGRET_EMOJI: Record<string, string> = { worth: '😍', meh: '😐', regret: '😭' };

export default function HomeScreen() {
  const colors = useTheme();
  const styles = makeStyles(colors);
  useLang(); // subscribe so text re-renders when language toggles
  const { expenses, incomes, budget, splurgeFund, customCats, catBudgets, bestieName, bestiePhone, deleteExpense, deleteIncome } = useAppContext();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [showIncome, setShowIncome] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [showIncomeHistory, setShowIncomeHistory] = useState(false);
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
  const bs = getBudgetState(spent, budget, colors);
  const alerts = getAlerts(expenses, budget, splurgeFund, customCats, month, year, getToday(), catBudgets);
  const streaks = getStreaks(expenses, budget);

  // Income this month + net (money in − money out).
  const thisMonthIncome = monthIncomes(incomes, month, year);
  const earned = sumIncomes(thisMonthIncome);
  const net = earned - spent;
  const hasMoneyFlow = earned > 0; // only show the in/out/net card once there's income logged

  // Merge expenses + incomes into one recent "money diary", newest date first.
  const recent = [
    ...thisMonth.map((e) => ({ kind: 'expense' as const, date: e.date, exp: e })),
    ...thisMonthIncome.map((i) => ({ kind: 'income' as const, date: i.date, inc: i })),
  ]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 10);

  // Open WhatsApp/share with a sassy confession to the bestie (over-budget nudge).
  function confessToFriend() {
    confessToBestie(buildConfession(spent, Number(budget) || 0, bestieName), bestiePhone);
  }

  // Confirm, then delete an expense.
  function askDelete(id: string) {
    RNAlert.alert(L('Delete this kharcha?', 'Delete this expense?'), L('Pakka hatana hai?', 'Sure you want to remove it?'), [
      { text: L('rehne do', 'cancel'), style: 'cancel' },
      { text: L('haan, delete', 'yes, delete'), style: 'destructive', onPress: () => deleteExpense(id) },
    ]);
  }

  // Open the modal to add a new income.
  function openAddIncome() {
    setEditingIncome(null);
    setShowIncome(true);
  }

  // Open the modal pre-filled to edit an income.
  function openEditIncome(i: Income) {
    setEditingIncome(i);
    setShowIncome(true);
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.diaryLabel}>{L('my money diary ✦', 'my money diary ✦')}</Text>

        {/* ── budget card ── */}
        <View style={styles.card}>
          <Text style={styles.spentLabel}>{L('spent in', 'spent in')} {MONTH_NAMES[month]}</Text>
          <Text style={styles.bigTotal}>{fmtINR(spent)}</Text>

          {bs.hasBudget ? (
            <>
              <View style={styles.pill}>
                <Text style={styles.pillText}>
                  {bs.over ? `${fmtINR(Math.abs(bs.remaining))} ${L('over', 'over')} 💀` : `${fmtINR(bs.remaining)} ${L('left', 'left')} 🌸`}
                </Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${bs.pct}%`, backgroundColor: bs.barColor }]} />
              </View>
              <Text style={styles.barCaption}>
                {bs.over ? L('oops, budget gaya — sambhaalo babe', 'oops, budget blown — careful babe') : bs.pct >= 75 ? COPY.nearBudget : COPY.budgetSafe}
              </Text>
            </>
          ) : (
            <Text style={styles.noBudget}>{L('Settings mein budget set karo taaki track kar sako 🎯', 'Set a budget in Settings so you can track it 🎯')}</Text>
          )}
        </View>

        {/* ── money in / out / net (only once income is logged) — tap for full history ── */}
        {hasMoneyFlow ? (
          <Pressable style={styles.flowCard} onPress={() => setShowIncomeHistory(true)}>
            <View style={styles.flowRow}>
              <View style={styles.flowItem}>
                <Text style={styles.flowLabel}>💰 {L('aaya', 'in')}</Text>
                <Text style={[styles.flowAmt, { color: INCOME_GREEN }]}>{fmtINR(earned)}</Text>
              </View>
              <View style={styles.flowDivider} />
              <View style={styles.flowItem}>
                <Text style={styles.flowLabel}>💸 {L('gaya', 'out')}</Text>
                <Text style={[styles.flowAmt, { color: colors.dangerDeep }]}>{fmtINR(spent)}</Text>
              </View>
              <View style={styles.flowDivider} />
              <View style={styles.flowItem}>
                <Text style={styles.flowLabel}>✨ {L('bacha', 'net')}</Text>
                <Text style={[styles.flowAmt, { color: net < 0 ? colors.dangerDeep : INCOME_GREEN }]}>{fmtINR(net)}</Text>
              </View>
            </View>

            {/* proportion bar: how much of income is still left vs spent */}
            <View style={styles.flowBarTrack}>
              <View style={[styles.flowBarFill, { width: `${Math.min(100, earned > 0 ? (spent / earned) * 100 : 0)}%` }]} />
            </View>
            <Text style={styles.flowCaption}>
              {net < 0
                ? L('income se zyada kharch ho gaya 💀', 'spent more than you earned 💀')
                : L(`income ka ${Math.round((net / earned) * 100)}% bacha liya 💚`, `saved ${Math.round((net / earned) * 100)}% of income 💚`)}
              {'  ·  '}
              {L('tap → saara income', 'tap → all income')}
            </Text>
          </Pressable>
        ) : null}

        {/* ── streaks ── */}
        <View style={styles.streakCard}>
          {streaks.hasBudget ? (
            <View style={styles.streakItem}>
              <Text style={styles.streakNum}>🔥 {streaks.streak}</Text>
              <Text style={styles.streakLbl}>{L('din budget mein', 'days in budget')}</Text>
            </View>
          ) : null}
          <View style={styles.streakItem}>
            <Text style={styles.streakNum}>🍽️ {streaks.noSpendDays}</Text>
            <Text style={styles.streakLbl}>no-spend days</Text>
          </View>
        </View>
        {streaks.noSpendToday ? <Text style={styles.noSpendLine}>{COPY.noSpendDay}</Text> : null}

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

        {/* ── bestie confession nudge (over budget) ── */}
        {bs.over && bestieName ? (
          <Pressable style={styles.bestieBanner} onPress={confessToFriend}>
            <Text style={styles.bestieEmoji}>🤝</Text>
            <View style={styles.flex1}>
              <Text style={styles.bestieTitle}>{L(`${bestieName} ko confess karo?`, `Confess to ${bestieName}?`)}</Text>
              <Text style={styles.bestieSub}>{L('budget gaya 💀 — bestie ko ek tap me batao', 'budget blown 💀 — tell your bestie in one tap')}</Text>
            </View>
            <Text style={styles.bestieArrow}>💌</Text>
          </Pressable>
        ) : null}

        {/* ── quick add: type "chai 40" ── */}
        <QuickAddBar />

        {/* ── danger alerts ── */}
        <AlertList alerts={alerts} />

        {/* ── recent expenses ── */}
        <Text style={styles.sectionLabel}>RECENT</Text>
        {recent.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🌷</Text>
            <Text style={styles.emptyText}>{COPY.empty}</Text>
            <Text style={styles.emptyHint}>{L('neeche pink "+" dabake apna pehla kharcha add karo ✨', 'tap the pink "+" below to add your first expense ✨')}</Text>
          </View>
        ) : (
          recent.map((row) => {
            if (row.kind === 'income') {
              const i = row.inc;
              const src = findSource(i.source);
              const emoji = src.name.split(' ')[0];
              const label = src.name.slice(src.name.indexOf(' ') + 1);
              return (
                <Pressable key={`inc-${i.id}`} style={styles.histItem} onPress={() => openEditIncome(i)}>
                  <View style={[styles.histIcon, { backgroundColor: src.bg }]}>
                    <Text style={styles.histEmoji}>{emoji}</Text>
                  </View>
                  <View style={styles.flex1}>
                    <Text style={styles.histName}>{label}</Text>
                    {i.note ? <Text style={styles.histNote} numberOfLines={1}>{i.note}</Text> : null}
                    <Text style={styles.histDate}>{fmtDateLabel(i.date)} · {L('income', 'income')} 💰</Text>
                  </View>
                  <Text style={[styles.histAmount, { color: INCOME_GREEN }]}>+{fmtINR(i.amount)}</Text>
                  <Pressable onPress={() => deleteIncome(i.id)} hitSlop={10} style={styles.delBtn}>
                    <Text style={styles.delText}>✕</Text>
                  </Pressable>
                </Pressable>
              );
            }
            const e = row.exp;
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
                    {e.regret ? ` · ${REGRET_EMOJI[e.regret]}` : ''}
                    {e.receiptUri ? ' · 📎' : ''}
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

      {/* floating action pills: green income (top), pink expense (bottom) */}
      <View style={styles.fabStack}>
        <Pressable style={[styles.fabPill, styles.fabPillIncome]} onPress={openAddIncome}>
          <Text style={styles.fabPillIcon}>💰</Text>
          <Text style={styles.fabPillText}>{L('income', 'income')}</Text>
        </Pressable>
        <Pressable style={[styles.fabPill, styles.fabPillExpense]} onPress={openAdd}>
          <Text style={styles.fabPillPlus}>＋</Text>
          <Text style={styles.fabPillText}>{L('kharcha', 'expense')}</Text>
        </Pressable>
      </View>

      <AddExpenseModal
        visible={showAdd}
        editing={editing}
        onClose={() => {
          setShowAdd(false);
          setEditing(null);
        }}
      />
      <AddIncomeModal
        visible={showIncome}
        editing={editingIncome}
        onClose={() => {
          setShowIncome(false);
          setEditingIncome(null);
        }}
      />
      <IncomeHistoryModal
        visible={showIncomeHistory}
        onClose={() => setShowIncomeHistory(false)}
        onEdit={(i) => {
          setShowIncomeHistory(false);
          openEditIncome(i);
        }}
      />
      <RegretAuditModal visible={showRegret} onClose={() => setShowRegret(false)} />
      <BillDuePrompt />
    </Screen>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
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

  // streaks
  streakCard: { flexDirection: 'row', backgroundColor: colors.periwinkle, borderRadius: radius.cards, padding: spacing.md, marginTop: spacing.md },
  streakItem: { flex: 1, alignItems: 'center' },
  streakNum: { fontSize: typography.title.fontSize, fontWeight: '800', color: colors.text },
  streakLbl: { fontSize: typography.tiny.fontSize, color: colors.text, opacity: 0.7, marginTop: 2 },
  noSpendLine: { fontSize: typography.small.fontSize, color: colors.sage, fontWeight: '700', textAlign: 'center', marginTop: spacing.sm },

  // regret banner
  regretBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.coral, borderRadius: radius.inputs, padding: spacing.md, marginTop: spacing.md },
  regretEmoji: { fontSize: 22, marginRight: spacing.md },
  regretTitle: { fontSize: typography.body.fontSize, fontWeight: '700', color: colors.text },
  regretSub: { fontSize: typography.small.fontSize, color: colors.text, opacity: 0.75, marginTop: 1 },
  regretArrow: { fontSize: 22, color: colors.text, opacity: 0.5 },

  // bestie banner
  bestieBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.lilac, borderRadius: radius.inputs, padding: spacing.md, marginTop: spacing.md },
  bestieEmoji: { fontSize: 22, marginRight: spacing.md },
  bestieTitle: { fontSize: typography.body.fontSize, fontWeight: '700', color: colors.text },
  bestieSub: { fontSize: typography.small.fontSize, color: colors.text, opacity: 0.75, marginTop: 1 },
  bestieArrow: { fontSize: 20 },

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
  fabPlus: { color: colors.onAccent, fontSize: 30, fontWeight: '400', marginTop: -2 },

  fabStack: { position: 'absolute', right: spacing.lg, bottom: spacing.lg, gap: spacing.sm, alignItems: 'flex-end' },
  fabPill: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.md, borderRadius: radius.buttons, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 5 },
  fabPillIncome: { backgroundColor: INCOME_GREEN, shadowColor: INCOME_GREEN },
  fabPillExpense: { backgroundColor: colors.rose, shadowColor: colors.rose },
  fabPillIcon: { fontSize: 16 },
  fabPillPlus: { fontSize: 16, color: '#FFFFFF', fontWeight: '700' },
  fabPillText: { fontSize: typography.small.fontSize, color: '#FFFFFF', fontWeight: '700' },

  flowCard: { backgroundColor: colors.cardBg, borderRadius: radius.cards, padding: spacing.md, marginTop: spacing.md, shadowColor: colors.cardShadow, shadowOpacity: 1, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  flowRow: { flexDirection: 'row', alignItems: 'center' },
  flowItem: { flex: 1, alignItems: 'center' },
  flowDivider: { width: 1, alignSelf: 'stretch', backgroundColor: colors.border },
  flowLabel: { fontSize: typography.tiny.fontSize, color: colors.textLight, marginBottom: 2 },
  flowAmt: { fontSize: typography.title.fontSize, fontWeight: '700', color: colors.text },
  flowBarTrack: { height: 8, borderRadius: 999, backgroundColor: colors.mint, overflow: 'hidden', marginTop: spacing.md },
  flowBarFill: { height: '100%', borderRadius: 999, backgroundColor: colors.coral },
  flowCaption: { fontSize: typography.tiny.fontSize, color: colors.textLight, marginTop: spacing.sm, textAlign: 'center' },
});

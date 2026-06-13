// InsightsScreen.tsx — summary cards, 7-day bar, 6-month trend, category breakdown, and tips (Feature 6).
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Screen } from '../components/shared';
import BarChart, { BarDatum } from '../components/BarChart';
import AlertList from '../components/AlertList';
import SpendCalendar from '../components/SpendCalendar';
import MonthlyWrappedModal from './MonthlyWrappedModal';
import { useAppContext } from '../hooks/useAppContext';
import { colors, spacing, radius, typography } from '../constants/theme';
import { fmtINR, getToday } from '../utils';
import { monthExpenses, sumExpenses, getAlerts } from '../utils/calculations';
import { getCycleInfo, getCycleSpendInsight } from '../utils/cycle';
import { findCat } from '../constants/categories';
import { MOODS } from '../constants/moods';

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// Local yyyy-mm-dd for a Date (matches how expenses store their date).
function toISO(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export default function InsightsScreen() {
  const { expenses, budget, splurgeFund, customCats, catBudgets, periodStarts, cycleLength } = useAppContext();
  const [showWrapped, setShowWrapped] = useState(false);

  // Cycle insights (V2): current phase + whether PMS-week spending runs higher.
  const cycleInfo = getCycleInfo(periodStarts, cycleLength, getToday());
  const cycleSpend = getCycleSpendInsight(expenses, periodStarts, cycleLength, getToday());

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

  // Spend per mood this month (only expenses that have a mood tagged), biggest first.
  const moodExp = thisMonth.filter((e) => e.mood);
  const moodTotal = sumExpenses(moodExp);
  const byMood = MOODS.map((m) => ({ mood: m, amount: sumExpenses(moodExp.filter((e) => e.mood === m.id)) }))
    .filter((x) => x.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  // Regret patterns this month (only rated expenses count).
  const ratedMonth = thisMonth.filter((e) => e.regret);
  const rWorth = ratedMonth.filter((e) => e.regret === 'worth').length;
  const rMeh = ratedMonth.filter((e) => e.regret === 'meh').length;
  const rRegret = ratedMonth.filter((e) => e.regret === 'regret').length;
  const regretItems = ratedMonth.filter((e) => e.regret === 'regret');
  const regretSum = sumExpenses(regretItems);
  let topRegretName = '';
  if (regretItems.length) {
    const m = new Map<string, number>();
    regretItems.forEach((e) => m.set(e.catId, (m.get(e.catId) || 0) + e.amount));
    let id = '';
    let val = 0;
    m.forEach((v, k) => {
      if (v > val) {
        val = v;
        id = k;
      }
    });
    topRegretName = findCat(id, customCats).name;
  }

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

        {/* monthly wrapped */}
        <Pressable style={styles.wrappedBtn} onPress={() => setShowWrapped(true)}>
          <Text style={styles.wrappedText}>✨ see your Monthly Wrapped</Text>
          <Text style={styles.wrappedArrow}>›</Text>
        </Pressable>

        {/* danger alerts (same as Home) */}
        <AlertList alerts={getAlerts(expenses, budget, splurgeFund, customCats, month, year, getToday(), catBudgets)} />

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

        {/* spend calendar heatmap */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>{MONTHS_SHORT[month].toUpperCase()} CALENDAR ✦</Text>
          <SpendCalendar expenses={expenses} month={month} year={year} />
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

        {/* mood vs money */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>MOOD vs MONEY ✦</Text>
          {byMood.length === 0 ? (
            <Text style={styles.muted}>kharcha log karte waqt mood tag karo — phir yahan pattern dikhega 😊</Text>
          ) : (
            <>
              <Text style={styles.moodHeadline}>{buildMoodLine(byMood[0].mood.id)}</Text>
              {byMood.map(({ mood, amount }) => {
                const pct = moodTotal > 0 ? Math.round((amount / moodTotal) * 100) : 0;
                return (
                  <View key={mood.id} style={styles.breakRow}>
                    <View style={styles.breakTop}>
                      <Text style={styles.breakName}>
                        {mood.emoji} {mood.label}
                      </Text>
                      <Text style={styles.breakAmt}>
                        {fmtINR(amount)} <Text style={styles.breakPct}>{pct}%</Text>
                      </Text>
                    </View>
                    <View style={styles.breakTrack}>
                      <View style={[styles.breakFill, { width: `${pct}%`, backgroundColor: colors.periwinkle }]} />
                    </View>
                  </View>
                );
              })}
            </>
          )}
        </View>

        {/* regret check */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>REGRET CHECK ✦</Text>
          {ratedMonth.length === 0 ? (
            <Text style={styles.muted}>7 din purane kharchon ka regret check Home pe karo — phir pattern yahan dikhega 💭</Text>
          ) : (
            <>
              <View style={styles.regretRow}>
                <Text style={styles.regretStat}>😍 {rWorth}</Text>
                <Text style={styles.regretStat}>😐 {rMeh}</Text>
                <Text style={styles.regretStat}>😭 {rRegret}</Text>
              </View>
              {regretSum > 0 ? (
                <Text style={styles.regretLine}>{fmtINR(regretSum)} regret wale kharchon pe gaye 😭</Text>
              ) : (
                <Text style={styles.regretLine}>abhi tak koi regret nahi — slay queen 💅</Text>
              )}
              {topRegretName ? <Text style={styles.regretLine}>sabse zyada regret: {topRegretName}</Text> : null}
            </>
          )}
        </View>

        {/* cycle vs money (V2) */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>CYCLE vs MONEY ✦</Text>
          {!cycleSpend.hasData ? (
            <Text style={styles.muted}>Settings 🎀 mein period log karo — phir yahan dikhega ki PMS week mein kharcha badhta hai ya nahi 🌸</Text>
          ) : (
            <>
              <Text style={styles.moodHeadline}>{buildCycleLine(cycleSpend.higherPct, cycleInfo.phase)}</Text>
              <View style={styles.breakRow}>
                <View style={styles.breakTop}>
                  <Text style={styles.breakName}>🩸 PMS week (daily avg)</Text>
                  <Text style={styles.breakAmt}>{fmtINR(cycleSpend.pmsDailyAvg)}</Text>
                </View>
                <View style={styles.breakTrack}>
                  <View style={[styles.breakFill, { width: `${cyclePct(cycleSpend.pmsDailyAvg, cycleSpend.otherDailyAvg)}%`, backgroundColor: colors.coral }]} />
                </View>
              </View>
              <View style={styles.breakRow}>
                <View style={styles.breakTop}>
                  <Text style={styles.breakName}>🌙 baaki din (daily avg)</Text>
                  <Text style={styles.breakAmt}>{fmtINR(cycleSpend.otherDailyAvg)}</Text>
                </View>
                <View style={styles.breakTrack}>
                  <View style={[styles.breakFill, { width: `${cyclePct(cycleSpend.otherDailyAvg, cycleSpend.pmsDailyAvg)}%`, backgroundColor: colors.sage }]} />
                </View>
              </View>
            </>
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
      <MonthlyWrappedModal visible={showWrapped} onClose={() => setShowWrapped(false)} />
    </Screen>
  );
}

// Bar width (0–100) for one daily-avg value relative to the larger of the two.
function cyclePct(value: number, other: number): number {
  const max = Math.max(value, other, 1);
  return Math.round((value / max) * 100);
}

// A supportive one-liner about PMS-week spending. `higherPct` = how much higher PMS daily spend is.
function buildCycleLine(higherPct: number | null, phase: string): string {
  const phasePrefix = phase === 'pms' ? 'PMS week chal raha hai abhi — ' : phase === 'period' ? 'period time — ' : '';
  if (higherPct == null) return `${phasePrefix}thoda aur data aane do, pattern banta jayega 🌸`;
  if (higherPct >= 15) return `${phasePrefix}PMS week mein daily kharcha ~${higherPct}% zyada hota hai — cravings real hain babe 💕 thoda heads-up rakho`;
  if (higherPct <= -15) return `${phasePrefix}PMS week mein actually kam kharcha — proud of you 💅`;
  return `${phasePrefix}PMS aur baaki dino mein kharcha lagbhag barabar — balanced queen ✨`;
}

// A sassy one-liner about the mood you spend most in.
function buildMoodLine(topMoodId: string): string {
  const lines: Record<string, string> = {
    stressed: '😩 stress mein sabse zyada kharch — stress shopping much? deep breath babe 💕',
    sad: '🥺 sad spending detected — shopping se mood theek nahi hota, chai try karo ☕',
    bored: '🥱 boredom = wallet ka dushman... thoda Netflix kar lo instead 😬',
    treat: '🥳 treat-yourself queen 👑 par thoda sambhaal ke spend karo',
    happy: '😊 happy spends! at least mood toh achha tha 🌸',
    meh: '😐 meh mood mein bhi paise ja rahe hain 👀',
  };
  return lines[topMoodId] ?? 'apne mood patterns pe nazar rakho babe ✨';
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
  wrappedBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.lavender, borderRadius: radius.cards, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  wrappedText: { flex: 1, fontSize: typography.body.fontSize, fontWeight: '700', color: colors.cardBg },
  wrappedArrow: { fontSize: 22, color: colors.cardBg },

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
  moodHeadline: { fontSize: typography.small.fontSize, color: colors.text, fontStyle: 'italic', lineHeight: 20, marginBottom: spacing.md },
  regretRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: spacing.sm },
  regretStat: { fontSize: typography.title.fontSize, fontWeight: '700', color: colors.text },
  regretLine: { fontSize: typography.small.fontSize, color: colors.text, marginTop: spacing.xs },

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

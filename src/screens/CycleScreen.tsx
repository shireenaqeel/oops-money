// CycleScreen.tsx — the dedicated period/cycle page (V2). Everything cycle lives here:
// logging + current phase + next-period prediction + history (via CycleTracker), and the
// "cycle vs money" insight (does PMS week make me spend more?). Private, all on-device.
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Screen } from '../components/shared';
import CycleTracker from '../components/CycleTracker';
import { useAppContext } from '../hooks/useAppContext';
import { spacing, radius, typography, ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useLang } from '../hooks/useLang';
import { L } from '../i18n';
import { fmtINR, getToday } from '../utils';
import { getCycleInfo, getCycleSpendInsight } from '../utils/cycle';

export default function CycleScreen() {
  const { expenses, periodStarts, cycleLength } = useAppContext();
  const colors = useTheme();
  const styles = makeStyles(colors);
  useLang(); // subscribe so text re-renders when language toggles

  // Current phase + whether PMS-week spending runs higher than other days.
  const cycleInfo = getCycleInfo(periodStarts, cycleLength, getToday());
  const cycleSpend = getCycleSpendInsight(expenses, periodStarts, cycleLength, getToday());

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>Cycle 🌸</Text>
        <Text style={styles.subhead}>{L('period log karo, phase + agla period dekho, aur jaano ki PMS week mein kharcha badhta hai ya nahi. sab tumhare phone pe, private 🤍', 'log your period, see your phase + next period, and learn if PMS week bumps up your spending. all on your phone, private 🤍')}</Text>

        {/* logging + phase + prediction + history */}
        <CycleTracker />

        {/* cycle vs money */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>CYCLE vs MONEY ✦</Text>
          {!cycleSpend.hasData ? (
            <Text style={styles.muted}>{L('upar period log karo — phir yahan dikhega ki PMS week mein kharcha badhta hai ya nahi 🌸', 'log your period above — then see whether PMS-week spending goes up or not 🌸')}</Text>
          ) : (
            <>
              <Text style={styles.headline}>{buildCycleLine(cycleSpend.higherPct, cycleInfo.phase)}</Text>
              <View style={styles.breakRow}>
                <View style={styles.breakTop}>
                  <Text style={styles.breakName}>{L('🩸 PMS week (daily avg)', '🩸 PMS week (daily avg)')}</Text>
                  <Text style={styles.breakAmt}>{fmtINR(cycleSpend.pmsDailyAvg)}</Text>
                </View>
                <View style={styles.breakTrack}>
                  <View style={[styles.breakFill, { width: `${cyclePct(cycleSpend.pmsDailyAvg, cycleSpend.otherDailyAvg)}%`, backgroundColor: colors.coral }]} />
                </View>
              </View>
              <View style={styles.breakRow}>
                <View style={styles.breakTop}>
                  <Text style={styles.breakName}>{L('🌙 baaki din (daily avg)', '🌙 other days (daily avg)')}</Text>
                  <Text style={styles.breakAmt}>{fmtINR(cycleSpend.otherDailyAvg)}</Text>
                </View>
                <View style={styles.breakTrack}>
                  <View style={[styles.breakFill, { width: `${cyclePct(cycleSpend.otherDailyAvg, cycleSpend.pmsDailyAvg)}%`, backgroundColor: colors.sage }]} />
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>
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
  const phasePrefix = phase === 'pms' ? L('PMS week chal raha hai abhi — ', 'PMS week right now — ') : phase === 'period' ? L('period time — ', 'period time — ') : '';
  if (higherPct == null) return `${phasePrefix}${L('thoda aur data aane do, pattern banta jayega 🌸', 'give it a bit more data, the pattern will build 🌸')}`;
  if (higherPct >= 15) return `${phasePrefix}${L(`PMS week mein daily kharcha ~${higherPct}% zyada hota hai — cravings real hain babe 💕 thoda heads-up rakho`, `daily spending is ~${higherPct}% higher in PMS week — cravings are real babe 💕 stay a little aware`)}`;
  if (higherPct <= -15) return `${phasePrefix}${L('PMS week mein actually kam kharcha — proud of you 💅', 'you actually spend less in PMS week — proud of you 💅')}`;
  return `${phasePrefix}${L('PMS aur baaki dino mein kharcha lagbhag barabar — balanced queen ✨', 'PMS and other days spend about the same — balanced queen ✨')}`;
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  heading: { fontSize: typography.heading.fontSize, fontWeight: '800', color: colors.text, marginBottom: spacing.xs },
  subhead: { fontSize: typography.small.fontSize, color: colors.textLight, lineHeight: 19, marginBottom: spacing.md },
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
  headline: { fontSize: typography.small.fontSize, color: colors.text, fontStyle: 'italic', lineHeight: 20, marginBottom: spacing.md },
  breakRow: { marginBottom: spacing.md },
  breakTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  breakName: { fontSize: typography.small.fontSize, color: colors.text },
  breakAmt: { fontSize: typography.small.fontSize, color: colors.text, fontWeight: '700' },
  breakTrack: { height: 7, backgroundColor: colors.cream, borderRadius: radius.chips, overflow: 'hidden' },
  breakFill: { height: '100%', borderRadius: radius.chips },
});

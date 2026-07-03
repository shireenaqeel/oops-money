// CycleCalendar.tsx — a Flo/Clue-style month grid for cycle tracking.
// Each day is colour-coded: logged period, predicted period, fertile window, ovulation, PMS.
// Today gets a ring; days with a symptom/mood log get a little dot. Tap any day to log it.
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { spacing, radius, typography, ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useLang } from '../hooks/useLang';
import { L } from '../i18n';
import { CycleDayLog } from '../types';
import { cycleMarksForRange, DayKind } from '../utils/cycle';

// Local yyyy-mm-dd for a Date.
function iso(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function CycleCalendar({
  periodStarts,
  periodEnds,
  cycleDayLogs,
  effLen,
  effPeriod,
  todayIso,
  hideFertile = false,
  onSelectDay,
}: {
  periodStarts: string[];
  periodEnds: Record<string, string>;
  cycleDayLogs: Record<string, CycleDayLog>;
  effLen: number;
  effPeriod: number;
  todayIso: string;
  hideFertile?: boolean; // irregular / PCOS mode — don't shade unreliable fertile/ovulation days
  onSelectDay: (dateIso: string) => void;
}) {
  const colors = useTheme();
  const styles = makeStyles(colors);
  useLang();

  const today = new Date(todayIso + 'T00:00:00');
  // Which month we're viewing (offset from today's month, 0 = current).
  const [monthOffset, setMonthOffset] = useState(0);
  const view = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const year = view.getFullYear();
  const month = view.getMonth();

  const firstWeekday = new Date(year, month, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Marks covering the whole visible month (a little padding either side is harmless).
  const fromIso = iso(new Date(year, month, 1));
  const toIso = iso(new Date(year, month, daysInMonth));
  const marks = cycleMarksForRange(periodStarts, periodEnds, effLen, effPeriod, fromIso, toIso);
  // In irregular/PCOS mode, calendar-method ovulation & fertile days aren't reliable — hide them.
  if (hideFertile) {
    Object.keys(marks).forEach((d) => {
      if (marks[d] === 'fertile' || marks[d] === 'ovulation') delete marks[d];
    });
  }

  // Fill grid: leading blanks for the first week, then each day.
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  // Colours per day kind: solid fill for period/ovulation, soft tint for the rest.
  const fillFor = (kind: DayKind | undefined): { bg: string; border: string; solid: boolean } => {
    switch (kind) {
      case 'period':
        return { bg: colors.rose, border: colors.rose, solid: true };
      case 'predPeriod':
        return { bg: colors.blush, border: colors.rose, solid: false };
      case 'ovulation':
        return { bg: colors.babyBlue, border: colors.babyBlue, solid: true };
      case 'fertile':
        return { bg: colors.powderBlue, border: colors.powderBlue, solid: false };
      case 'pms':
        return { bg: colors.coral, border: colors.coral, solid: false };
      default:
        return { bg: 'transparent', border: 'transparent', solid: false };
    }
  };

  return (
    <View style={styles.wrap}>
      {/* month nav */}
      <View style={styles.navRow}>
        <Pressable onPress={() => setMonthOffset((m) => m - 1)} hitSlop={10} style={styles.navBtn}>
          <Text style={styles.navText}>‹</Text>
        </Pressable>
        <Text style={styles.monthLabel}>{`${MONTHS[month]} ${year}`}</Text>
        <Pressable onPress={() => setMonthOffset((m) => m + 1)} hitSlop={10} style={styles.navBtn}>
          <Text style={styles.navText}>›</Text>
        </Pressable>
      </View>

      {/* weekday header */}
      <View style={styles.weekRow}>
        {WEEKDAYS.map((w, i) => (
          <Text key={i} style={styles.weekday}>
            {w}
          </Text>
        ))}
      </View>

      {/* day grid */}
      <View style={styles.grid}>
        {cells.map((d, idx) => {
          if (d == null) return <View key={`b${idx}`} style={styles.cell} />;
          const dIso = iso(new Date(year, month, d));
          const kind = marks[dIso];
          const { bg, border, solid } = fillFor(kind);
          const isToday = dIso === todayIso;
          const hasLog = !!cycleDayLogs[dIso];
          const isPeriodStart = periodStarts.includes(dIso);
          return (
            <Pressable key={dIso} style={styles.cell} onPress={() => onSelectDay(dIso)}>
              <View
                style={[
                  styles.dayCircle,
                  { backgroundColor: bg, borderColor: border, borderWidth: kind ? 1.5 : 0 },
                  isToday && styles.todayCircle,
                ]}
              >
                <Text style={[styles.dayNum, solid && { color: colors.onAccent, fontWeight: '700' }]}>{d}</Text>
                {isPeriodStart ? <Text style={styles.startDrop}>🩸</Text> : null}
              </View>
              {hasLog ? <View style={styles.logDot} /> : <View style={styles.logDotPlaceholder} />}
            </Pressable>
          );
        })}
      </View>

      {/* legend */}
      <View style={styles.legend}>
        <Legend colors={colors} color={colors.rose} text={L('period', 'period')} />
        <Legend colors={colors} color={colors.blush} text={L('predicted', 'predicted')} />
        {!hideFertile ? <Legend colors={colors} color={colors.powderBlue} text={L('fertile', 'fertile')} /> : null}
        {!hideFertile ? <Legend colors={colors} color={colors.babyBlue} text={L('ovulation', 'ovulation')} /> : null}
        <Legend colors={colors} color={colors.coral} text="PMS" />
      </View>
    </View>
  );
}

// One little swatch + label in the legend.
function Legend({ colors, color, text }: { colors: ThemeColors; color: string; text: string }) {
  const styles = makeStyles(colors);
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{text}</Text>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrap: { backgroundColor: colors.cardBg, borderRadius: radius.cards, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
    navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
    navBtn: { width: 34, height: 34, borderRadius: 999, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' },
    navText: { fontSize: 20, fontWeight: '800', color: colors.text, lineHeight: 22 },
    monthLabel: { fontSize: typography.body.fontSize, fontWeight: '700', color: colors.text },
    weekRow: { flexDirection: 'row', marginBottom: spacing.xs },
    weekday: { flex: 1, textAlign: 'center', fontSize: typography.tiny.fontSize, color: colors.textMuted, fontWeight: '600' },
    grid: { flexDirection: 'row', flexWrap: 'wrap' },
    cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 3 },
    dayCircle: { width: 34, height: 34, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
    todayCircle: { borderWidth: 2, borderColor: colors.text },
    dayNum: { fontSize: typography.small.fontSize, color: colors.text },
    startDrop: { position: 'absolute', top: -8, fontSize: 9 },
    logDot: { width: 4, height: 4, borderRadius: 999, backgroundColor: colors.lavender, marginTop: 2 },
    logDotPlaceholder: { width: 4, height: 4, marginTop: 2 },
    legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.md, marginTop: spacing.md },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    legendDot: { width: 9, height: 9, borderRadius: 999 },
    legendText: { fontSize: typography.tiny.fontSize, color: colors.textLight },
  });

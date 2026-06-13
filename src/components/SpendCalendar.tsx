// SpendCalendar.tsx — a month heatmap of daily spending (V2). Pure view over expenses, no storage.
// Darker/hotter cell = more spent that day; empty = no-spend day. Lives in Insights.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Expense } from '../types';
import { colors, spacing, radius, typography } from '../constants/theme';
import { fmtINRShort } from '../utils';

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// Local yyyy-mm-dd for a Date.
function iso(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

// Pick a heat colour for a day given its spend vs the month's busiest day.
function heatColor(spent: number, max: number): string {
  if (spent <= 0) return colors.cream; // no-spend day
  const r = max > 0 ? spent / max : 0;
  if (r <= 0.33) return colors.mint; // light day
  if (r <= 0.66) return colors.peach; // medium
  return colors.rose; // heavy day
}

export default function SpendCalendar({ expenses, month, year }: { expenses: Expense[]; month?: number; year?: number }) {
  const now = new Date();
  const m = month ?? now.getMonth();
  const y = year ?? now.getFullYear();

  // Sum spend per day for this month.
  const byDay = new Map<string, number>();
  expenses.forEach((e) => {
    const d = new Date(e.date + 'T00:00:00');
    if (d.getMonth() === m && d.getFullYear() === y) byDay.set(e.date, (byDay.get(e.date) || 0) + Number(e.amount));
  });
  const max = Math.max(0, ...byDay.values());

  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const firstWeekday = new Date(y, m, 1).getDay(); // 0=Sun
  const todayIso = iso(now);

  // Build the grid cells: leading blanks to align day 1, then each day.
  const cells: ({ day: number; date: string; spent: number } | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    const date = iso(new Date(y, m, day));
    cells.push({ day, date, spent: byDay.get(date) || 0 });
  }

  return (
    <View>
      {/* weekday header */}
      <View style={styles.row}>
        {DAY_LETTERS.map((d, i) => (
          <Text key={i} style={styles.dow}>
            {d}
          </Text>
        ))}
      </View>

      {/* day cells */}
      <View style={styles.grid}>
        {cells.map((c, i) =>
          c === null ? (
            <View key={`b${i}`} style={styles.cell} />
          ) : (
            <View key={c.date} style={styles.cell}>
              <View style={[styles.tile, { backgroundColor: heatColor(c.spent, max) }, c.date === todayIso && styles.today]}>
                <Text style={styles.dayNum}>{c.day}</Text>
              </View>
            </View>
          )
        )}
      </View>

      {/* legend */}
      <View style={styles.legend}>
        <Text style={styles.legendText}>kam</Text>
        <View style={[styles.dot, { backgroundColor: colors.cream }]} />
        <View style={[styles.dot, { backgroundColor: colors.mint }]} />
        <View style={[styles.dot, { backgroundColor: colors.peach }]} />
        <View style={[styles.dot, { backgroundColor: colors.rose }]} />
        <Text style={styles.legendText}>zyada</Text>
        {max > 0 ? <Text style={styles.legendMax}>busiest: {fmtINRShort(max)}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, padding: 2 },
  tile: { flex: 1, borderRadius: radius.small, alignItems: 'center', justifyContent: 'center' },
  dow: { width: `${100 / 7}%`, textAlign: 'center', fontSize: typography.tiny.fontSize, color: colors.textMuted, fontWeight: '700', marginBottom: spacing.xs },
  today: { borderWidth: 2, borderColor: colors.lavender },
  dayNum: { fontSize: typography.tiny.fontSize, color: colors.text, fontWeight: '600' },

  legend: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.md },
  legendText: { fontSize: typography.tiny.fontSize, color: colors.textMuted },
  dot: { width: 14, height: 14, borderRadius: 4 },
  legendMax: { fontSize: typography.tiny.fontSize, color: colors.textLight, marginLeft: 'auto' },
});

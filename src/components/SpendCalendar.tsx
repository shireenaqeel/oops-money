// SpendCalendar.tsx — a month heatmap of daily spending (V2). Pure view over expenses, no storage.
// Darker/hotter cell = more spent that day; empty = no-spend day. Lives in Insights.
// Tap any day to see that day's total + the list of expenses below the grid.
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Expense, Category } from '../types';
import { spacing, radius, typography, ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useLang } from '../hooks/useLang';
import { L } from '../i18n';
import { fmtINR, fmtINRShort } from '../utils';
import { findCat } from '../constants/categories';

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Local yyyy-mm-dd for a Date.
function iso(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

// Turn a yyyy-mm-dd into a friendly "12 Jun" label.
function prettyDate(isoStr: string): string {
  const [, mm, dd] = isoStr.split('-');
  return `${Number(dd)} ${MONTHS[Number(mm) - 1]}`;
}

// Pick a heat colour for a day given its spend vs the month's busiest day.
function heatColor(spent: number, max: number, colors: ThemeColors): string {
  if (spent <= 0) return colors.cream; // no-spend day
  const r = max > 0 ? spent / max : 0;
  if (r <= 0.33) return colors.mint; // light day
  if (r <= 0.66) return colors.peach; // medium
  return colors.rose; // heavy day
}

export default function SpendCalendar({
  expenses,
  month,
  year,
  customCats = [],
}: {
  expenses: Expense[];
  month?: number;
  year?: number;
  customCats?: Category[];
}) {
  const colors = useTheme();
  const styles = makeStyles(colors);
  useLang(); // subscribe so text re-renders when language toggles
  const [selected, setSelected] = useState<string | null>(null); // tapped day, yyyy-mm-dd
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

  // Tap a day to open its detail; tap the same day again to close.
  const onTapDay = (date: string) => setSelected((cur) => (cur === date ? null : date));

  // Expenses logged on the selected day (newest first), for the detail list.
  const dayExpenses = selected ? expenses.filter((e) => e.date === selected) : [];
  const dayTotal = selected ? byDay.get(selected) || 0 : 0;

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
            <Pressable key={c.date} style={styles.cell} onPress={() => onTapDay(c.date)}>
              <View
                style={[
                  styles.tile,
                  { backgroundColor: heatColor(c.spent, max, colors) },
                  c.date === todayIso && styles.today,
                  c.date === selected && styles.selected,
                ]}
              >
                <Text style={styles.dayNum}>{c.day}</Text>
              </View>
            </Pressable>
          )
        )}
      </View>

      {/* legend */}
      <View style={styles.legend}>
        <Text style={styles.legendText}>{L('kam', 'low')}</Text>
        <View style={[styles.dot, { backgroundColor: colors.cream }]} />
        <View style={[styles.dot, { backgroundColor: colors.mint }]} />
        <View style={[styles.dot, { backgroundColor: colors.peach }]} />
        <View style={[styles.dot, { backgroundColor: colors.rose }]} />
        <Text style={styles.legendText}>{L('zyada', 'high')}</Text>
        {max > 0 ? <Text style={styles.legendMax}>{L('busiest', 'busiest')}: {fmtINRShort(max)}</Text> : null}
      </View>

      {/* tapped-day detail */}
      {selected ? (
        <View style={styles.detail}>
          <View style={styles.detailHead}>
            <Text style={styles.detailDate}>{prettyDate(selected)}</Text>
            <Text style={styles.detailTotal}>
              {fmtINR(dayTotal)}
              {dayExpenses.length > 0 ? <Text style={styles.detailCount}>  ·  {dayExpenses.length} {L('items', 'items')}</Text> : null}
            </Text>
          </View>

          {dayExpenses.length === 0 ? (
            <Text style={styles.noSpend}>{L('no spend day! tune kuch kharch nahi kiya 🍽️', 'no spend day! you ate 🍽️')}</Text>
          ) : (
            dayExpenses.map((e) => {
              const cat = findCat(e.catId, customCats);
              const emoji = cat.name.split(' ')[0];
              const label = cat.name.split(' ').slice(1).join(' ') || cat.name;
              return (
                <View key={e.id} style={styles.expRow}>
                  <Text style={styles.expEmoji}>{emoji}</Text>
                  <View style={styles.expMid}>
                    <Text style={styles.expCat}>{label}</Text>
                    {e.note ? <Text style={styles.expNote} numberOfLines={1}>{e.note}</Text> : null}
                  </View>
                  <Text style={styles.expAmt}>{fmtINR(e.amount)}</Text>
                </View>
              );
            })
          )}
        </View>
      ) : null}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  row: { flexDirection: 'row' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, padding: 2 },
  tile: { flex: 1, borderRadius: radius.small, alignItems: 'center', justifyContent: 'center' },
  dow: { width: `${100 / 7}%`, textAlign: 'center', fontSize: typography.tiny.fontSize, color: colors.textMuted, fontWeight: '700', marginBottom: spacing.xs },
  today: { borderWidth: 2, borderColor: colors.lavender },
  selected: { borderWidth: 2, borderColor: colors.text },
  dayNum: { fontSize: typography.tiny.fontSize, color: colors.text, fontWeight: '600' },

  legend: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.md },
  legendText: { fontSize: typography.tiny.fontSize, color: colors.textMuted },
  dot: { width: 14, height: 14, borderRadius: 4 },
  legendMax: { fontSize: typography.tiny.fontSize, color: colors.textLight, marginLeft: 'auto' },

  detail: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  detailHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: spacing.sm },
  detailDate: { fontSize: typography.title.fontSize, fontWeight: '700', color: colors.text },
  detailTotal: { fontSize: typography.body.fontSize, fontWeight: '700', color: colors.text },
  detailCount: { fontSize: typography.small.fontSize, fontWeight: '400', color: colors.textLight },
  noSpend: { fontSize: typography.small.fontSize, color: colors.textLight, paddingVertical: spacing.sm },

  expRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, gap: spacing.sm },
  expEmoji: { fontSize: 20 },
  expMid: { flex: 1 },
  expCat: { fontSize: typography.body.fontSize, color: colors.text, fontWeight: '600' },
  expNote: { fontSize: typography.small.fontSize, color: colors.textLight },
  expAmt: { fontSize: typography.body.fontSize, color: colors.text, fontWeight: '700' },
});

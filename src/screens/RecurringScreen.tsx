// RecurringScreen.tsx — recurring monthly bills with a due-date countdown + one-tap log (Feature 10).
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Alert } from 'react-native';
import { Screen } from '../components/shared';
import AddRecurringModal from './AddRecurringModal';
import { useAppContext } from '../hooks/useAppContext';
import { colors, spacing, radius, typography } from '../constants/theme';
import { fmtINR } from '../utils';
import { findCat } from '../constants/categories';

// Days in the current month (for the due-date countdown).
function daysInThisMonth(): number {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

export default function RecurringScreen() {
  const { recurring, customCats, logRecurring, deleteRecurring } = useAppContext();
  const [showAdd, setShowAdd] = useState(false);

  const today = new Date().getDate();
  const monthLen = daysInThisMonth();
  const monthlyTotal = recurring.reduce((s, r) => s + r.amount, 0);

  // How many days until the bill's due day (wraps to next month if already passed).
  function daysLeft(day: number): number {
    return day >= today ? day - today : monthLen - today + day;
  }

  // Log the bill as today's expense, with a little confirmation.
  function onLog(id: string, name: string) {
    logRecurring(id);
    Alert.alert('logged babe 🌸', `${name} aaj ke kharche mein add ho gaya`);
  }

  // Confirm then delete a bill.
  function onDelete(id: string) {
    Alert.alert('bill hatana hai?', 'Yeh recurring bill delete ho jayega.', [
      { text: 'rehne do', style: 'cancel' },
      { text: 'haan, delete', style: 'destructive', onPress: () => deleteRecurring(id) },
    ]);
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>Recurring Bills 🔁</Text>
        <Text style={styles.intro}>har mahine ke regular kharche — rent, subscriptions, gym, etc.</Text>

        {recurring.length > 0 ? (
          <View style={styles.totalBanner}>
            <Text style={styles.totalAmt}>{fmtINR(monthlyTotal)}</Text>
            <Text style={styles.totalLabel}>har mahine fixed kharcha</Text>
          </View>
        ) : null}

        {recurring.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🧾</Text>
            <Text style={styles.emptyText}>koi bill nahi abhi</Text>
            <Text style={styles.emptyHint}>neeche "+" se apna pehla recurring bill add karo ✨</Text>
          </View>
        ) : (
          recurring
            .slice()
            .sort((a, b) => daysLeft(a.day) - daysLeft(b.day))
            .map((rec) => {
              const cat = findCat(rec.catId, customCats);
              const emoji = cat.name.split(' ')[0];
              const left = daysLeft(rec.day);
              const dueText = left === 0 ? 'due today! 👀' : `${left} day${left > 1 ? 's' : ''} left`;
              return (
                <View key={rec.id} style={styles.billCard}>
                  <View style={[styles.billIcon, { backgroundColor: cat.bg }]}>
                    <Text style={styles.billEmoji}>{emoji}</Text>
                  </View>
                  <View style={styles.flex1}>
                    <Text style={styles.billName}>{rec.name}</Text>
                    <Text style={styles.billDue}>
                      every {rec.day}
                      {ordinal(rec.day)} · {dueText}
                    </Text>
                  </View>
                  <View style={styles.billRight}>
                    <Text style={styles.billAmt}>{fmtINR(rec.amount)}</Text>
                    <Pressable style={styles.logBtn} onPress={() => onLog(rec.id, rec.name)}>
                      <Text style={styles.logText}>log now</Text>
                    </Pressable>
                  </View>
                  <Pressable onPress={() => onDelete(rec.id)} hitSlop={10} style={styles.delBtn}>
                    <Text style={styles.delText}>✕</Text>
                  </Pressable>
                </View>
              );
            })
        )}
      </ScrollView>

      <Pressable style={styles.fab} onPress={() => setShowAdd(true)}>
        <Text style={styles.fabPlus}>+</Text>
      </Pressable>
      <AddRecurringModal visible={showAdd} onClose={() => setShowAdd(false)} />
    </Screen>
  );
}

// Ordinal suffix for the day number (1st, 2nd, 3rd, 4th...).
function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  flex1: { flex: 1, minWidth: 0 },
  heading: { fontSize: typography.heading.fontSize, fontWeight: '800', color: colors.text },
  intro: { fontSize: typography.small.fontSize, color: colors.textLight, marginTop: spacing.xs, marginBottom: spacing.md },

  totalBanner: { backgroundColor: colors.powderBlue, borderRadius: radius.cards, padding: spacing.lg, alignItems: 'center', marginBottom: spacing.md },
  totalAmt: { fontSize: typography.display.fontSize, fontWeight: '800', color: colors.text },
  totalLabel: { fontSize: typography.small.fontSize, color: colors.text, marginTop: spacing.xs },

  billCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardBg, borderRadius: radius.inputs, padding: spacing.md, marginBottom: spacing.sm, shadowColor: colors.cardShadow, shadowOpacity: 1, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  billIcon: { width: 38, height: 38, borderRadius: 999, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  billEmoji: { fontSize: 18 },
  billName: { fontSize: typography.body.fontSize, fontWeight: '600', color: colors.text },
  billDue: { fontSize: typography.small.fontSize, color: colors.textLight, marginTop: 1 },
  billRight: { alignItems: 'flex-end', marginHorizontal: spacing.sm },
  billAmt: { fontSize: typography.body.fontSize, fontWeight: '700', color: colors.text },
  logBtn: { backgroundColor: colors.cream, borderRadius: radius.buttons, paddingVertical: 3, paddingHorizontal: spacing.sm, marginTop: spacing.xs },
  logText: { fontSize: typography.tiny.fontSize, color: colors.textLight, fontWeight: '700' },
  delBtn: { padding: spacing.xs },
  delText: { fontSize: 14, color: colors.textMuted },

  empty: { alignItems: 'center', paddingVertical: spacing.xl },
  emptyEmoji: { fontSize: 40, marginBottom: spacing.sm },
  emptyText: { fontSize: typography.body.fontSize, color: colors.textLight, fontStyle: 'italic' },
  emptyHint: { fontSize: typography.small.fontSize, color: colors.textMuted, marginTop: spacing.xs, textAlign: 'center' },

  fab: { position: 'absolute', right: spacing.lg, bottom: spacing.lg, width: 58, height: 58, borderRadius: 999, backgroundColor: colors.skyBlue, alignItems: 'center', justifyContent: 'center', shadowColor: colors.skyBlue, shadowOpacity: 0.5, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  fabPlus: { color: colors.cardBg, fontSize: 30, marginTop: -2 },
});

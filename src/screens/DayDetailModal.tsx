// DayDetailModal.tsx — full-screen page for ONE day's spends, opened by tapping a day in the
// Insights calendar. Shows only that day's total + its expenses; nothing else from Insights.
// Pure view over the passed-in expenses — no storage, no navigation stack (it's a full Modal).
import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Expense, Category } from '../types';
import { spacing, radius, typography, ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useLang } from '../hooks/useLang';
import { L } from '../i18n';
import { fmtINR } from '../utils';
import { findCat } from '../constants/categories';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Turn a yyyy-mm-dd into a friendly "12 Jun" label.
function prettyDate(isoStr: string): string {
  const [, mm, dd] = isoStr.split('-');
  return `${Number(dd)} ${MONTHS[Number(mm) - 1]}`;
}

export default function DayDetailModal({
  date,
  expenses,
  customCats = [],
  onClose,
}: {
  date: string | null; // yyyy-mm-dd of the tapped day; null = closed
  expenses: Expense[]; // that day's expenses (already filtered by caller)
  customCats?: Category[];
  onClose: () => void;
}) {
  const colors = useTheme();
  const styles = makeStyles(colors);
  useLang(); // subscribe so text re-renders when language toggles

  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <Modal visible={date !== null} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        {/* header: back + date + total */}
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={onClose} hitSlop={8}>
            <Text style={styles.backText}>← {L('wapas', 'back')}</Text>
          </Pressable>
          <Text style={styles.date}>{date ? prettyDate(date) : ''}</Text>
          <Text style={styles.total}>
            {fmtINR(total)}
            {expenses.length > 0 ? <Text style={styles.count}>  ·  {expenses.length} {L('items', 'items')}</Text> : null}
          </Text>
        </View>

        {/* the day's expenses */}
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {expenses.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🍽️</Text>
              <Text style={styles.emptyText}>{L('no spend day! tune kuch kharch nahi kiya', 'no spend day! you ate')}</Text>
            </View>
          ) : (
            expenses.map((e) => {
              const cat = findCat(e.catId, customCats);
              const emoji = cat.name.split(' ')[0];
              const label = cat.name.split(' ').slice(1).join(' ') || cat.name;
              return (
                <View key={e.id} style={styles.row}>
                  <Text style={styles.emoji}>{emoji}</Text>
                  <View style={styles.mid}>
                    <Text style={styles.cat}>{label}</Text>
                    {e.note ? <Text style={styles.note} numberOfLines={2}>{e.note}</Text> : null}
                  </View>
                  <Text style={styles.amt}>{fmtINR(e.amount)}</Text>
                </View>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { alignSelf: 'flex-start', paddingVertical: spacing.xs, paddingHorizontal: spacing.md, borderRadius: radius.buttons, backgroundColor: colors.cardBg, marginBottom: spacing.md },
  backText: { fontSize: typography.small.fontSize, color: colors.text, fontWeight: '600' },
  date: { fontSize: typography.heading.fontSize, fontWeight: '700', color: colors.text },
  total: { fontSize: typography.title.fontSize, fontWeight: '700', color: colors.text, marginTop: spacing.xs },
  count: { fontSize: typography.body.fontSize, fontWeight: '400', color: colors.textLight },

  content: { padding: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardBg, borderRadius: radius.cards, padding: spacing.md, marginBottom: spacing.sm, gap: spacing.md },
  emoji: { fontSize: 26 },
  mid: { flex: 1 },
  cat: { fontSize: typography.body.fontSize, color: colors.text, fontWeight: '600' },
  note: { fontSize: typography.small.fontSize, color: colors.textLight, marginTop: 2 },
  amt: { fontSize: typography.title.fontSize, color: colors.text, fontWeight: '700' },

  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl },
  emptyEmoji: { fontSize: 44, marginBottom: spacing.md },
  emptyText: { fontSize: typography.body.fontSize, color: colors.textLight, textAlign: 'center' },
});

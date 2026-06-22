// IncomeHistoryModal.tsx — full list of all income entries (money IN). Opened from the Home
// in/out/net card. Tap an entry to edit it. Pure view over context.incomes.
import React from 'react';
import { View, Text, Pressable, StyleSheet, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../hooks/useAppContext';
import { Income } from '../types';
import { spacing, radius, typography, ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useLang } from '../hooks/useLang';
import { L } from '../i18n';
import { fmtINR, fmtDateLabel } from '../utils';
import { findSource, sumIncomes } from '../constants/incomes';

const INCOME_GREEN = '#5FBF93';

export default function IncomeHistoryModal({
  visible,
  onClose,
  onEdit,
}: {
  visible: boolean;
  onClose: () => void;
  onEdit: (i: Income) => void;
}) {
  const { incomes } = useAppContext();
  const colors = useTheme();
  const styles = makeStyles(colors);
  useLang();

  const sorted = [...incomes].sort((a, b) => (a.date < b.date ? 1 : -1));
  const total = sumIncomes(incomes);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={onClose} hitSlop={8}>
            <Text style={styles.backText}>← {L('wapas', 'back')}</Text>
          </Pressable>
          <Text style={styles.title}>{L('saara income 💰', 'all income 💰')}</Text>
          <Text style={styles.total}>{fmtINR(total)} {L('total', 'total')}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {sorted.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>💰</Text>
              <Text style={styles.emptyText}>{L('abhi koi income nahi 🌸', 'no income yet 🌸')}</Text>
            </View>
          ) : (
            sorted.map((i) => {
              const src = findSource(i.source);
              const emoji = src.name.split(' ')[0];
              const label = src.name.slice(src.name.indexOf(' ') + 1);
              return (
                <Pressable key={i.id} style={styles.row} onPress={() => onEdit(i)}>
                  <View style={[styles.icon, { backgroundColor: src.bg }]}>
                    <Text style={styles.iconEmoji}>{emoji}</Text>
                  </View>
                  <View style={styles.mid}>
                    <Text style={styles.name}>{label}</Text>
                    {i.note ? <Text style={styles.note} numberOfLines={1}>{i.note}</Text> : null}
                    <Text style={styles.date}>{fmtDateLabel(i.date)}</Text>
                  </View>
                  <Text style={styles.amt}>+{fmtINR(i.amount)}</Text>
                </Pressable>
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
  title: { fontSize: typography.heading.fontSize, fontWeight: '800', color: colors.text },
  total: { fontSize: typography.title.fontSize, fontWeight: '700', color: INCOME_GREEN, marginTop: spacing.xs },

  content: { padding: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardBg, borderRadius: radius.cards, padding: spacing.md, marginBottom: spacing.sm, gap: spacing.md },
  icon: { width: 40, height: 40, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  iconEmoji: { fontSize: 20 },
  mid: { flex: 1 },
  name: { fontSize: typography.body.fontSize, color: colors.text, fontWeight: '600' },
  note: { fontSize: typography.small.fontSize, color: colors.textLight, marginTop: 1 },
  date: { fontSize: typography.tiny.fontSize, color: colors.textMuted, marginTop: 1 },
  amt: { fontSize: typography.title.fontSize, color: INCOME_GREEN, fontWeight: '700' },

  empty: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyEmoji: { fontSize: 44, marginBottom: spacing.md },
  emptyText: { fontSize: typography.body.fontSize, color: colors.textLight },
});

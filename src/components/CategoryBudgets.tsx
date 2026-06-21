// CategoryBudgets.tsx — set a monthly spending limit per category (V2), lives in Settings.
// Shows this-month spent vs the limit with a colour-coded bar; over-limit also fires a Home/Insights alert.
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useAppContext } from '../hooks/useAppContext';
import { spacing, radius, typography, ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useLang } from '../hooks/useLang';
import { L } from '../i18n';
import { fmtINR } from '../utils';
import { monthExpenses, sumExpenses } from '../utils/calculations';
import { CATS, findCat, effectiveBuiltins } from '../constants/categories';

export default function CategoryBudgets() {
  const { expenses, customCats, catOverrides, catBudgets, setCatBudget, removeCatBudget } = useAppContext();
  const colors = useTheme();
  const styles = makeStyles(colors);
  useLang(); // subscribe so text re-renders when language toggles
  void catOverrides; // read so the list recomputes when a built-in is edited/hidden
  const allCats = [...effectiveBuiltins(), ...customCats];
  const [pickedCat, setPickedCat] = useState(allCats[0]?.id ?? CATS[0].id);
  const [amount, setAmount] = useState('');

  const now = new Date();
  const monthExp = monthExpenses(expenses, now.getMonth(), now.getFullYear());

  // Save the typed limit for the picked category, then clear the input.
  function save() {
    const n = parseInt(amount, 10) || 0;
    if (n <= 0) return;
    setCatBudget(pickedCat, n);
    setAmount('');
  }

  const limits = Object.entries(catBudgets).filter(([, v]) => v > 0);

  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>{L('CATEGORY BUDGETS 🎯', 'CATEGORY BUDGETS 🎯')}</Text>
      <Text style={styles.hint}>{L('kisi category ka monthly limit set karo — cross hua toh Home pe alert milega', 'set a monthly limit for a category — cross it and you get an alert on Home')}</Text>

      {/* category picker */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.strip} contentContainerStyle={styles.stripContent}>
        {allCats.map((c) => {
          const selected = c.id === pickedCat;
          return (
            <Pressable key={c.id} onPress={() => setPickedCat(c.id)} style={[styles.catPill, { backgroundColor: selected ? c.color : c.bg }]}>
              <Text style={[styles.catText, selected && styles.catTextSel]}>{c.name}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* amount + save */}
      <View style={styles.inputRow}>
        <Text style={styles.rupee}>₹</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={(t) => setAmount(t.replace(/[^0-9]/g, ''))}
          placeholder={L('limit', 'limit')}
          placeholderTextColor={colors.textMuted}
          keyboardType="number-pad"
        />
        <Pressable style={[styles.saveBtn, !amount && styles.saveBtnDisabled]} onPress={save} disabled={!amount}>
          <Text style={styles.saveText}>{L('set ✦', 'set ✦')}</Text>
        </Pressable>
      </View>

      {/* existing limits with this-month progress */}
      {limits.length === 0 ? (
        <Text style={styles.none}>{L('abhi koi category limit nahi 🌸', 'no category limits yet 🌸')}</Text>
      ) : (
        limits.map(([catId, limit]) => {
          const cat = findCat(catId, customCats);
          const spent = sumExpenses(monthExp.filter((e) => e.catId === catId));
          const pct = Math.min(Math.round((spent / limit) * 100), 100);
          const over = spent > limit;
          const barColor = over ? colors.budgetOver : pct >= 75 ? colors.budgetWarning : colors.budgetSafe;
          return (
            <View key={catId} style={styles.limitRow}>
              <View style={styles.limitTop}>
                <Text style={styles.limitName}>{cat.name}</Text>
                <Text style={styles.limitAmt}>
                  {fmtINR(spent)} <Text style={styles.limitOf}>/ {fmtINR(limit)}</Text>
                </Text>
                <Pressable onPress={() => removeCatBudget(catId)} hitSlop={10}>
                  <Text style={styles.limitDel}>✕</Text>
                </Pressable>
              </View>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${pct}%`, backgroundColor: barColor }]} />
              </View>
              {over ? <Text style={styles.overText}>{L(`limit cross 💀 ${fmtINR(spent - limit)} zyada`, `limit crossed 💀 ${fmtINR(spent - limit)} over`)}</Text> : null}
            </View>
          );
        })
      )}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: radius.cards,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: colors.cardShadow,
    shadowOpacity: 1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardLabel: { fontSize: typography.tiny.fontSize, color: colors.textMuted, letterSpacing: 2, marginBottom: spacing.sm },
  hint: { fontSize: typography.small.fontSize, color: colors.textLight, lineHeight: 18, marginBottom: spacing.md },

  strip: { marginBottom: spacing.md },
  stripContent: { gap: spacing.sm, paddingRight: spacing.md },
  catPill: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.chips },
  catText: { fontSize: typography.small.fontSize, color: colors.text, fontWeight: '500' },
  catTextSel: { color: colors.onAccent, fontWeight: '700' },

  inputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  rupee: { fontSize: 20, color: colors.rose, fontWeight: '700' },
  input: { flex: 1, backgroundColor: colors.cream, borderRadius: radius.chips, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: typography.body.fontSize, color: colors.text },
  saveBtn: { backgroundColor: colors.rose, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.chips },
  saveBtnDisabled: { backgroundColor: colors.textMuted, opacity: 0.5 },
  saveText: { color: colors.onAccent, fontWeight: '700', fontSize: typography.small.fontSize },

  none: { fontSize: typography.small.fontSize, color: colors.textLight },
  limitRow: { marginTop: spacing.sm },
  limitTop: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  limitName: { flex: 1, fontSize: typography.small.fontSize, color: colors.text, fontWeight: '600' },
  limitAmt: { fontSize: typography.small.fontSize, color: colors.text, fontWeight: '700', marginRight: spacing.sm },
  limitOf: { color: colors.textLight, fontWeight: '400' },
  limitDel: { fontSize: 14, color: colors.textMuted },
  track: { height: 7, backgroundColor: colors.cream, borderRadius: radius.chips, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.chips },
  overText: { fontSize: typography.tiny.fontSize, color: colors.dangerDeep, fontWeight: '700', marginTop: spacing.xs },
});

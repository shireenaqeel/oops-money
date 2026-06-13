// BrokeMath.tsx — shows an amount translated into relatable units (coffees, days of salary...). Feature 12.
// Drop <BrokeMath amount={n} /> anywhere there's an amount; renders nothing when amount is 0.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppContext } from '../hooks/useAppContext';
import { spacing, radius, typography, ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { brokeMath } from '../utils';

export default function BrokeMath({ amount }: { amount: number }) {
  const { income } = useAppContext();
  const styles = makeStyles(useTheme());
  const lines = brokeMath(amount, Number(income) || 0);
  if (lines.length === 0) return null;
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>broke math 🧮</Text>
      <View style={styles.chips}>
        {lines.map((l, i) => (
          <View key={i} style={styles.chip}>
            <Text style={styles.chipText}>{l}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  wrap: { marginTop: spacing.sm },
  label: { fontSize: typography.tiny.fontSize, color: colors.textMuted, letterSpacing: 1, marginBottom: spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: { backgroundColor: colors.babyBlue, borderRadius: radius.chips, paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
  chipText: { fontSize: typography.small.fontSize, color: colors.text, fontWeight: '600' },
});

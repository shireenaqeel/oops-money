// AlertList.tsx — renders the danger-alert cards. Shared by Home and Insights so the look stays consistent. Feature 13.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Alert } from '../utils/calculations';
import { colors, spacing, radius, typography } from '../constants/theme';

export default function AlertList({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) return null;
  return (
    <>
      {alerts.map((a, i) => (
        <View key={i} style={styles.card}>
          <Text style={styles.emoji}>{a.emoji}</Text>
          <View style={styles.flex1}>
            <Text style={styles.title}>{a.title}</Text>
            <Text style={styles.sub}>{a.sub}</Text>
          </View>
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.blush, borderRadius: radius.inputs, padding: spacing.md, marginTop: spacing.md, borderLeftWidth: 4, borderLeftColor: colors.rose },
  emoji: { fontSize: 22, marginRight: spacing.md },
  flex1: { flex: 1 },
  title: { fontSize: typography.body.fontSize, fontWeight: '700', color: colors.dangerDeep },
  sub: { fontSize: typography.small.fontSize, color: colors.text, marginTop: 2 },
});

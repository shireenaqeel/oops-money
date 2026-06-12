// shared.tsx — reusable UI building blocks used across screens. Keep small, dumb, presentational.
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../constants/theme';

// Full-screen wrapper: cream background + safe-area padding. Wrap every screen in this.
export function Screen({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <SafeAreaView style={[styles.screen, style]}>{children}</SafeAreaView>;
}

// Temporary centered placeholder for screens not built yet (emoji + title + optional subtitle).
export function Placeholder({ emoji, title, subtitle }: { emoji: string; title: string; subtitle?: string }) {
  return (
    <View style={styles.center}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  emoji: { fontSize: 44, marginBottom: spacing.md },
  title: { fontSize: typography.title.fontSize, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  subtitle: { fontSize: typography.small.fontSize, color: colors.textLight, textAlign: 'center', lineHeight: 20 },
});

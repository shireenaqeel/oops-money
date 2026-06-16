// PaisaPersonality.tsx — a shareable "money personality" card for the Insights screen (V2).
// Reads your expenses, works out your archetype, and lets you share it via the phone share sheet.
import React from 'react';
import { View, Text, Pressable, StyleSheet, Share } from 'react-native';
import { useAppContext } from '../hooks/useAppContext';
import { useTheme } from '../hooks/useTheme';
import { spacing, radius, typography, ThemeColors } from '../constants/theme';
import { getPaisaPersonality } from '../utils/personality';

export default function PaisaPersonality() {
  const { expenses, customCats } = useAppContext();
  const colors = useTheme();
  const styles = makeStyles(colors);

  const p = getPaisaPersonality(expenses, customCats);

  // Hand a fun recap to the phone's share sheet (WhatsApp / Insta / notes).
  function share() {
    Share.share({
      message: `my money personality is ${p.emoji} ${p.title} 😭\n\n"${p.tagline}"\n\n— as told by Oops Money 💸`,
    }).catch(() => {});
  }

  return (
    <View style={styles.card}>
      <Text style={styles.label}>YOUR PAISA PERSONALITY 🔮</Text>
      <Text style={styles.emoji}>{p.emoji}</Text>
      <Text style={styles.title}>{p.title}</Text>
      <Text style={styles.tagline}>{p.tagline}</Text>
      <Text style={styles.stat}>{p.stat}</Text>
      {p.enough ? (
        <Pressable style={styles.shareBtn} onPress={share}>
          <Text style={styles.shareText}>share it ✦</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.lilac,
      borderRadius: radius.cards,
      padding: spacing.lg,
      marginBottom: spacing.md,
      alignItems: 'center',
    },
    label: { fontSize: typography.tiny.fontSize, color: colors.text, opacity: 0.6, letterSpacing: 2, marginBottom: spacing.sm },
    emoji: { fontSize: 48, marginBottom: spacing.xs },
    title: { fontSize: typography.title.fontSize, fontWeight: '800', color: colors.text, textAlign: 'center' },
    tagline: { fontSize: typography.small.fontSize, color: colors.text, fontStyle: 'italic', textAlign: 'center', lineHeight: 20, marginTop: spacing.sm },
    stat: { fontSize: typography.tiny.fontSize, color: colors.text, opacity: 0.7, textAlign: 'center', marginTop: spacing.sm },
    shareBtn: { backgroundColor: colors.rose, paddingVertical: spacing.sm, paddingHorizontal: spacing.xl, borderRadius: radius.buttons, marginTop: spacing.md },
    shareText: { color: colors.onAccent, fontSize: typography.small.fontSize, fontWeight: '700' },
  });

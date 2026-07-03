// PaisaAIFeed.tsx — the "Paisa AI ✨" card. Shows a few smart, auto-generated observations about
// your spending (from utils/paisaAI). Fully on-device, no LLM. Tap "aur batao" to cycle through more.
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useAppContext } from '../hooks/useAppContext';
import { spacing, radius, typography, ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useLang } from '../hooks/useLang';
import { L } from '../i18n';
import { getToday } from '../utils';
import { getPaisaInsights, Tone } from '../utils/paisaAI';
import PaisaChat from './PaisaChat';

const SHOW = 3; // how many insights to show at once

export default function PaisaAIFeed() {
  const { expenses, incomes, budget, customCats, periodStarts, cycleLength } = useAppContext();
  const colors = useTheme();
  const styles = makeStyles(colors);
  useLang(); // re-render on language toggle
  const [offset, setOffset] = useState(0);
  const [showChat, setShowChat] = useState(false);

  const insights = getPaisaInsights({ expenses, incomes, budget, customCats, periodStarts, cycleLength, today: getToday() });
  if (insights.length === 0) return null; // nothing worth saying yet — stay quiet

  // Tint (accent bar + soft bg) per tone.
  const toneStyle = (tone: Tone): { accent: string; bg: string } => {
    switch (tone) {
      case 'good':
        return { accent: colors.sage, bg: colors.mint };
      case 'warn':
        return { accent: colors.dangerDeep, bg: colors.coral };
      default:
        return { accent: colors.lavender, bg: colors.babyBlue };
    }
  };

  // The window of insights currently shown (cycles round when "aur batao" is tapped).
  const shown = Array.from({ length: Math.min(SHOW, insights.length) }, (_, i) => insights[(offset + i) % insights.length]);
  const hasMore = insights.length > SHOW;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{L('Paisa AI ✨', 'Paisa AI ✨')}</Text>
        <Text style={styles.badge}>{L('on-device', 'on-device')}</Text>
      </View>
      <Text style={styles.sub}>{L('tumhare kharche padh ke, bina internet ke 🤍', 'reading your spending, no internet needed 🤍')}</Text>

      {shown.map((ins, i) => {
        const t = toneStyle(ins.tone);
        return (
          <View key={`${ins.id}-${i}`} style={[styles.row, { backgroundColor: t.bg + '55', borderLeftColor: t.accent }]}>
            <Text style={styles.rowEmoji}>{ins.emoji}</Text>
            <Text style={styles.rowText}>{ins.text}</Text>
          </View>
        );
      })}

      <View style={styles.actionRow}>
        {hasMore ? (
          <Pressable style={styles.moreBtn} onPress={() => setOffset((o) => (o + SHOW) % insights.length)} hitSlop={6}>
            <Text style={styles.moreText}>{L('🔄 aur batao', '🔄 tell me more')}</Text>
          </Pressable>
        ) : <View />}
        <Pressable style={styles.askBtn} onPress={() => setShowChat(true)} hitSlop={6}>
          <Text style={styles.askText}>{L('💬 Paisa se pucho', '💬 Ask Paisa')}</Text>
        </Pressable>
      </View>

      <PaisaChat visible={showChat} onClose={() => setShowChat(false)} />
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: { backgroundColor: colors.cardBg, borderRadius: radius.cards, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    title: { fontSize: typography.title.fontSize, fontWeight: '700', color: colors.text },
    badge: { fontSize: typography.tiny.fontSize, color: colors.textLight, backgroundColor: colors.cream, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.chips, overflow: 'hidden' },
    sub: { fontSize: typography.small.fontSize, color: colors.textLight, marginTop: 2, marginBottom: spacing.md },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderLeftWidth: 3, borderRadius: radius.small, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, marginBottom: spacing.sm },
    rowEmoji: { fontSize: 20 },
    rowText: { flex: 1, fontSize: typography.small.fontSize, color: colors.text, fontWeight: '600', lineHeight: 19 },
    actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xs },
    moreBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.sm },
    moreText: { fontSize: typography.small.fontSize, color: colors.textLight, fontWeight: '700' },
    askBtn: { backgroundColor: colors.lavender, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.buttons },
    askText: { fontSize: typography.small.fontSize, color: colors.onAccent, fontWeight: '700' },
  });

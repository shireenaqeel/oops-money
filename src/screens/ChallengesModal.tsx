// ChallengesModal.tsx — money challenges (V3). Take on a challenge (no-Zomato week, ₹500 week,
// no-shopping 3 days, no-spend 3 days), track it live, win a 🏆. Opened from Settings, fully local.
import React from 'react';
import { View, Text, Pressable, StyleSheet, Modal, ScrollView } from 'react-native';
import { useAppContext } from '../hooks/useAppContext';
import { spacing, radius, typography, ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { CHALLENGE_TEMPLATES, evaluateChallenge } from '../utils/challenges';

export default function ChallengesModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { challenges, expenses, customCats, startChallenge, abandonChallenge } = useAppContext();
  const colors = useTheme();
  const styles = makeStyles(colors);

  // Evaluate every taken-on challenge against the expenses (drop any with a missing template).
  const evaluated = challenges
    .map((c) => ({ ch: c, st: evaluateChallenge(c, expenses, customCats) }))
    .filter((x) => x.st !== null) as { ch: typeof challenges[number]; st: NonNullable<ReturnType<typeof evaluateChallenge>> }[];

  const wins = evaluated.filter((x) => x.st.status === 'won').length;
  const activeTemplateIds = new Set(evaluated.filter((x) => x.st.status === 'active').map((x) => x.ch.templateId));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={styles.sheetWrap}>
        <ScrollView style={styles.sheet} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.grabber} />
          <Text style={styles.title}>Challenges 🏆</Text>
          <Text style={styles.sub}>ek chhota challenge lo, jeeto, trophy kamao 💪 {wins > 0 ? `· ${wins} 🏆 jeete` : ''}</Text>

          {/* your active / finished challenges */}
          {evaluated.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>YOUR CHALLENGES</Text>
              {evaluated.map(({ ch, st }) => {
                const badge = st.status === 'won' ? '🏆 jeet gayi!' : st.status === 'failed' ? '💔 oops, gaya' : `⏳ ${st.daysLeft} din baaki`;
                const badgeColor = st.status === 'won' ? colors.mint : st.status === 'failed' ? colors.coral : colors.butter;
                return (
                  <View key={ch.id} style={styles.activeCard}>
                    <View style={styles.activeHead}>
                      <Text style={styles.activeEmoji}>{st.template.emoji}</Text>
                      <View style={styles.flex1}>
                        <Text style={styles.activeTitle}>{st.template.title}</Text>
                        <Text style={styles.activeDetail}>{st.detail}</Text>
                      </View>
                      <Pressable onPress={() => abandonChallenge(ch.id)} hitSlop={10}>
                        <Text style={styles.del}>✕</Text>
                      </Pressable>
                    </View>
                    <View style={styles.track}>
                      <View style={[styles.fill, { width: `${st.progressPct}%`, backgroundColor: st.status === 'failed' ? colors.coral : colors.sage }]} />
                    </View>
                    <View style={[styles.badge, { backgroundColor: badgeColor }]}>
                      <Text style={styles.badgeText}>{badge}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* pick a new challenge */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>NAYA CHALLENGE LO</Text>
            {CHALLENGE_TEMPLATES.map((t) => {
              const taken = activeTemplateIds.has(t.id);
              return (
                <View key={t.id} style={styles.tplCard}>
                  <Text style={styles.tplEmoji}>{t.emoji}</Text>
                  <View style={styles.flex1}>
                    <Text style={styles.tplTitle}>{t.title}</Text>
                    <Text style={styles.tplDesc}>{t.desc}</Text>
                  </View>
                  <Pressable style={[styles.startBtn, taken && styles.disabled]} onPress={() => startChallenge(t.id)} disabled={taken}>
                    <Text style={styles.startText}>{taken ? 'chal raha' : 'start'}</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>

          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>done ✦</Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#00000055' },
    sheetWrap: { flex: 1, justifyContent: 'flex-end' },
    sheet: { maxHeight: '90%', backgroundColor: colors.cardBg, borderTopLeftRadius: radius.modals, borderTopRightRadius: radius.modals },
    content: { padding: spacing.lg, paddingBottom: spacing.xl },
    grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 999, backgroundColor: colors.border, marginBottom: spacing.md },
    flex1: { flex: 1 },
    title: { fontSize: typography.title.fontSize, fontWeight: '700', color: colors.text },
    sub: { fontSize: typography.small.fontSize, color: colors.textLight, marginTop: 2, marginBottom: spacing.lg },

    section: { marginBottom: spacing.lg },
    sectionLabel: { fontSize: typography.tiny.fontSize, color: colors.textMuted, letterSpacing: 2, marginBottom: spacing.sm },

    activeCard: { backgroundColor: colors.cream, borderRadius: radius.inputs, padding: spacing.md, marginBottom: spacing.sm },
    activeHead: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
    activeEmoji: { fontSize: 24, marginRight: spacing.sm },
    activeTitle: { fontSize: typography.body.fontSize, fontWeight: '700', color: colors.text },
    activeDetail: { fontSize: typography.small.fontSize, color: colors.textLight, marginTop: 1 },
    del: { fontSize: 16, color: colors.textMuted, paddingHorizontal: spacing.xs },
    track: { height: 8, backgroundColor: colors.cardBg, borderRadius: radius.chips, overflow: 'hidden' },
    fill: { height: '100%', borderRadius: radius.chips },
    badge: { alignSelf: 'flex-start', borderRadius: radius.chips, paddingVertical: 3, paddingHorizontal: spacing.sm, marginTop: spacing.sm },
    badgeText: { fontSize: typography.tiny.fontSize, fontWeight: '700', color: colors.text },

    tplCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cream, borderRadius: radius.inputs, padding: spacing.md, marginBottom: spacing.sm },
    tplEmoji: { fontSize: 24, marginRight: spacing.sm },
    tplTitle: { fontSize: typography.body.fontSize, fontWeight: '700', color: colors.text },
    tplDesc: { fontSize: typography.small.fontSize, color: colors.textLight, marginTop: 1, marginRight: spacing.sm },
    startBtn: { backgroundColor: colors.rose, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.buttons },
    startText: { color: colors.onAccent, fontWeight: '700', fontSize: typography.small.fontSize },
    disabled: { opacity: 0.4 },

    closeBtn: { backgroundColor: colors.lavender, paddingVertical: spacing.md, borderRadius: radius.buttons, alignItems: 'center', marginTop: spacing.sm },
    closeText: { color: colors.onAccent, fontSize: typography.body.fontSize, fontWeight: '700' },
  });

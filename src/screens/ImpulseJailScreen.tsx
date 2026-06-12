// ImpulseJailScreen.tsx — jail tempting purchases for 24h, then release (buy) or bury (resist) (Feature 8).
// Bury is allowed anytime; release unlocks only after the 24h cool-off. Buried items go to the graveyard.
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Alert } from 'react-native';
import { Screen } from '../components/shared';
import AddToJailModal from './AddToJailModal';
import { useAppContext } from '../hooks/useAppContext';
import { colors, spacing, radius, typography } from '../constants/theme';
import { fmtINR } from '../utils';
import { buriedMsg } from '../constants/copy';

const JAIL_MS = 24 * 60 * 60 * 1000; // 24-hour cool-off

export default function ImpulseJailScreen() {
  const { impulse, buryImpulse, releaseImpulse, deleteImpulse } = useAppContext();
  const [showAdd, setShowAdd] = useState(false);
  const [nowTs, setNowTs] = useState(Date.now());

  // Tick every second while something is still jailed, so the countdown stays live.
  useEffect(() => {
    if (!impulse.some((i) => i.status === 'jailed')) return;
    const t = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(t);
  }, [impulse]);

  const jailed = impulse.filter((i) => i.status === 'jailed');
  const buried = impulse.filter((i) => i.status === 'buried');
  const released = impulse.filter((i) => i.status === 'released');
  const totalSaved = buried.reduce((s, i) => s + i.amount, 0);

  // How much time is left on an item's 24h clock.
  function remainingText(createdAt: number): string {
    const ms = createdAt + JAIL_MS - nowTs;
    if (ms <= 0) return 'time served — ab decide karo!';
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    if (h > 0) return `${h}h ${m}m left 🔒`;
    if (m > 0) return `${m}m ${s}s left 🔒`;
    return `${s}s left 🔒`;
  }

  // Release unlocks only once the clock has run out.
  function isUnlocked(createdAt: number): boolean {
    return nowTs >= createdAt + JAIL_MS;
  }

  // Bury with a celebratory "you saved" message.
  function onBury(id: string, amount: number) {
    buryImpulse(id);
    Alert.alert('buried! 🪦', buriedMsg(fmtINR(amount)));
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>Impulse Jail 🔒</Text>
        <Text style={styles.intro}>khareedne ka mann hai? pehle yahan band karo. 24 ghante baad bhi chahiye toh le lena 💅</Text>

        {/* total saved banner */}
        {totalSaved > 0 ? (
          <View style={styles.savedBanner}>
            <Text style={styles.savedAmt}>{fmtINR(totalSaved)}</Text>
            <Text style={styles.savedLabel}>impulse buys resist karke bachaye 👑</Text>
          </View>
        ) : null}

        {/* jailed items */}
        <Text style={styles.sectionLabel}>IN JAIL ({jailed.length})</Text>
        {jailed.length === 0 ? (
          <Text style={styles.muted}>jail khali hai — koi temptation? neeche "+" dabao</Text>
        ) : (
          jailed.map((item) => {
            const unlocked = isUnlocked(item.createdAt);
            return (
              <View key={item.id} style={styles.jailCard}>
                <View style={styles.jailTop}>
                  <View style={styles.flex1}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    {item.note ? <Text style={styles.itemNote}>{item.note}</Text> : null}
                    <Text style={[styles.timer, unlocked && styles.timerDone]}>{remainingText(item.createdAt)}</Text>
                  </View>
                  <Text style={styles.itemAmt}>{fmtINR(item.amount)}</Text>
                </View>
                <View style={styles.actions}>
                  <Pressable style={styles.buryBtn} onPress={() => onBury(item.id, item.amount)}>
                    <Text style={styles.buryText}>bury it 🪦</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.releaseBtn, !unlocked && styles.releaseLocked]}
                    onPress={() => (unlocked ? releaseImpulse(item.id) : null)}
                    disabled={!unlocked}
                  >
                    <Text style={[styles.releaseText, !unlocked && styles.releaseTextLocked]}>{unlocked ? 'release (buy) ✦' : 'release locked 🔒'}</Text>
                  </Pressable>
                </View>
              </View>
            );
          })
        )}

        {/* graveyard */}
        {buried.length > 0 ? (
          <>
            <Text style={styles.sectionLabel}>RECEIPTS GRAVEYARD 🪦</Text>
            {buried.map((item) => (
              <Pressable key={item.id} style={styles.tomb} onLongPress={() => deleteImpulse(item.id)}>
                <Text style={styles.tombEmoji}>🪦</Text>
                <View style={styles.flex1}>
                  <Text style={styles.tombName}>{item.name}</Text>
                  <Text style={styles.tombSaved}>RIP bestie — saved {fmtINR(item.amount)}</Text>
                </View>
              </Pressable>
            ))}
          </>
        ) : null}

        {/* released (you caved) */}
        {released.length > 0 ? (
          <>
            <Text style={styles.sectionLabel}>YOU CAVED 🛍️</Text>
            {released.map((item) => (
              <Pressable key={item.id} style={styles.cavedRow} onLongPress={() => deleteImpulse(item.id)}>
                <Text style={styles.cavedName}>{item.name}</Text>
                <Text style={styles.cavedAmt}>{fmtINR(item.amount)}</Text>
              </Pressable>
            ))}
            <Text style={styles.hint}>(long-press kisi item ko hatane ke liye)</Text>
          </>
        ) : null}
      </ScrollView>

      <Pressable style={styles.fab} onPress={() => setShowAdd(true)}>
        <Text style={styles.fabPlus}>+</Text>
      </Pressable>
      <AddToJailModal visible={showAdd} onClose={() => setShowAdd(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  flex1: { flex: 1, minWidth: 0 },
  heading: { fontSize: typography.heading.fontSize, fontWeight: '800', color: colors.text },
  intro: { fontSize: typography.small.fontSize, color: colors.textLight, marginTop: spacing.xs, lineHeight: 19, marginBottom: spacing.md },

  savedBanner: { backgroundColor: colors.sage, borderRadius: radius.cards, padding: spacing.lg, alignItems: 'center', marginBottom: spacing.md },
  savedAmt: { fontSize: typography.display.fontSize, fontWeight: '800', color: colors.text },
  savedLabel: { fontSize: typography.small.fontSize, color: colors.text, marginTop: spacing.xs },

  sectionLabel: { fontSize: typography.tiny.fontSize, color: colors.textMuted, letterSpacing: 2, marginTop: spacing.lg, marginBottom: spacing.sm },
  muted: { fontSize: typography.small.fontSize, color: colors.textLight, fontStyle: 'italic' },

  jailCard: { backgroundColor: colors.lilac, borderRadius: radius.cards, padding: spacing.md, marginBottom: spacing.sm },
  jailTop: { flexDirection: 'row', alignItems: 'flex-start' },
  itemName: { fontSize: typography.body.fontSize, fontWeight: '700', color: colors.text },
  itemNote: { fontSize: typography.small.fontSize, color: colors.textLight, fontStyle: 'italic', marginTop: 1 },
  timer: { fontSize: typography.small.fontSize, color: colors.text, fontWeight: '700', marginTop: spacing.xs },
  timerDone: { color: colors.dangerDeep },
  itemAmt: { fontSize: typography.title.fontSize, fontWeight: '800', color: colors.text },

  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  buryBtn: { flex: 1, backgroundColor: colors.cardBg, paddingVertical: spacing.sm, borderRadius: radius.buttons, alignItems: 'center' },
  buryText: { fontSize: typography.small.fontSize, fontWeight: '700', color: colors.text },
  releaseBtn: { flex: 1, backgroundColor: colors.rose, paddingVertical: spacing.sm, borderRadius: radius.buttons, alignItems: 'center' },
  releaseLocked: { backgroundColor: colors.cardBg, opacity: 0.6 },
  releaseText: { fontSize: typography.small.fontSize, fontWeight: '700', color: colors.cardBg },
  releaseTextLocked: { color: colors.textMuted },

  tomb: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.cardBg, borderRadius: radius.inputs, padding: spacing.md, marginBottom: spacing.sm },
  tombEmoji: { fontSize: 24 },
  tombName: { fontSize: typography.body.fontSize, fontWeight: '600', color: colors.text },
  tombSaved: { fontSize: typography.small.fontSize, color: colors.sage, marginTop: 1, fontWeight: '700' },

  cavedRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.cardBg, borderRadius: radius.inputs, padding: spacing.md, marginBottom: spacing.sm },
  cavedName: { fontSize: typography.small.fontSize, color: colors.textLight },
  cavedAmt: { fontSize: typography.small.fontSize, color: colors.textLight, fontWeight: '700' },
  hint: { fontSize: typography.tiny.fontSize, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs },

  fab: { position: 'absolute', right: spacing.lg, bottom: spacing.lg, width: 58, height: 58, borderRadius: 999, backgroundColor: colors.lilac, alignItems: 'center', justifyContent: 'center', shadowColor: colors.lilac, shadowOpacity: 0.5, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  fabPlus: { color: colors.cardBg, fontSize: 30, marginTop: -2 },
});

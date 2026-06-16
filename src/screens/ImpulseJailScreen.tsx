// ImpulseJailScreen.tsx — jail tempting purchases for 24h, then release (buy) or bury (resist) (Feature 8).
// Bury is allowed anytime; release unlocks only after the 24h cool-off. Buried items go to the graveyard.
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Alert } from 'react-native';
import { Screen } from '../components/shared';
import AddToJailModal from './AddToJailModal';
import { useAppContext } from '../hooks/useAppContext';
import { ImpulseItem } from '../types';
import { spacing, radius, typography, ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useLang } from '../hooks/useLang';
import { L } from '../i18n';
import { fmtINR, fmtDateLabel } from '../utils';
import { buriedMsg } from '../constants/copy';

const JAIL_MS = 24 * 60 * 60 * 1000; // 24-hour cool-off

// Local yyyy-mm-dd from a ms timestamp (for the "buried <date>" label).
function isoOfMs(ms: number): string {
  const d = new Date(ms);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export default function ImpulseJailScreen() {
  const { impulse, letters, buryImpulse, releaseImpulse, rejailImpulse, deleteImpulse } = useAppContext();
  const colors = useTheme();
  const styles = makeStyles(colors);
  useLang(); // subscribe so text re-renders when language toggles
  const [showAdd, setShowAdd] = useState(false);
  const [nowTs, setNowTs] = useState(Date.now());
  const [letterSeed] = useState(() => Math.floor(Math.random() * 100000)); // pick one letter per visit
  const featuredLetter = letters.length > 0 ? letters[letterSeed % letters.length] : null;

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
    if (ms <= 0) return L('time served — ab decide karo!', 'time served — decide now!');
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

  // Release = buy it (logs an expense). Warn first if the 24h cool-off isn't over yet.
  function onRelease(item: ImpulseItem) {
    if (isUnlocked(item.createdAt)) {
      releaseImpulse(item.id);
      return;
    }
    Alert.alert(L('itni jaldi? 👀', 'so soon? 👀'), L(`abhi ${remainingText(item.createdAt).replace(' 🔒', '')} — pakka abhi khareedna hai? (spending mein add ho jayega)`, `still ${remainingText(item.createdAt).replace(' 🔒', '')} — sure you want to buy now? (it'll be added to spending)`), [
      { text: L('ruk jaungi 💪', "I'll wait 💪"), style: 'cancel' },
      { text: L('haan, buy 🛍️', 'yes, buy 🛍️'), style: 'destructive', onPress: () => releaseImpulse(item.id) },
    ]);
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>Impulse Jail 🔒</Text>
        <Text style={styles.intro}>{L('khareedne ka mann hai? pehle yahan band karo. 24 ghante baad bhi chahiye toh le lena 💅', 'tempted to buy? jail it here first. if you still want it after 24 hours, go ahead 💅')}</Text>

        {/* a letter from past you (Feature 11) */}
        {featuredLetter ? (
          <View style={styles.letterCard}>
            <Text style={styles.letterLabel}>{L('💌 future you se ek baat', '💌 a word from future you')}</Text>
            <Text style={styles.letterBody}>{featuredLetter.text}</Text>
          </View>
        ) : null}

        {/* total saved banner */}
        {totalSaved > 0 ? (
          <View style={styles.savedBanner}>
            <Text style={styles.savedAmt}>{fmtINR(totalSaved)}</Text>
            <Text style={styles.savedLabel}>{L('impulse buys resist karke bachaye 👑', 'saved by resisting impulse buys 👑')}</Text>
          </View>
        ) : null}

        {/* jailed items */}
        <Text style={styles.sectionLabel}>IN JAIL ({jailed.length})</Text>
        {jailed.length === 0 ? (
          <Text style={styles.muted}>{L('jail khali hai — koi temptation? neeche "+" dabao', 'jail is empty — any temptation? tap "+" below')}</Text>
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
                  <Pressable style={[styles.releaseBtn, !unlocked && styles.releaseEarly]} onPress={() => onRelease(item)}>
                    <Text style={styles.releaseText}>{unlocked ? 'release (buy) ✦' : 'buy anyway 🛍️'}</Text>
                  </Pressable>
                </View>
              </View>
            );
          })
        )}

        {/* graveyard */}
        {buried.length > 0 ? (
          <>
            <Text style={styles.sectionLabel}>RECEIPTS GRAVEYARD 🪦 ({buried.length})</Text>
            <View style={styles.graveyard}>
              {buried.map((item) => (
                <Pressable key={item.id} style={styles.tomb} onLongPress={() => deleteImpulse(item.id)}>
                  <Text style={styles.tombEmoji}>🪦</Text>
                  <Text style={styles.tombName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.tombRip}>RIP bestie</Text>
                  <Text style={styles.tombSaved}>saved {fmtINR(item.amount)}</Text>
                  {item.decidedAt ? <Text style={styles.tombDate}>buried {fmtDateLabel(isoOfMs(item.decidedAt))}</Text> : null}
                  <Pressable style={styles.bringBackBtn} onPress={() => rejailImpulse(item.id)}>
                    <Text style={styles.bringBackText}>bring back 🔁</Text>
                  </Pressable>
                </Pressable>
              ))}
            </View>
            <Text style={styles.hint}>(long-press tombstone = remove)</Text>
          </>
        ) : null}

        {/* released (you caved) */}
        {released.length > 0 ? (
          <>
            <Text style={styles.sectionLabel}>YOU CAVED 🛍️</Text>
            <Text style={styles.muted}>{L('ye spending mein add ho gaye — Home pe dikhenge', 'these got added to spending — they show on Home')}</Text>
            {released.map((item) => (
              <Pressable key={item.id} style={styles.cavedRow} onLongPress={() => deleteImpulse(item.id)}>
                <Text style={styles.cavedName}>{item.name}</Text>
                <Text style={styles.cavedAmt}>{fmtINR(item.amount)}</Text>
              </Pressable>
            ))}
            <Text style={styles.hint}>{L('(long-press kisi item ko hatane ke liye)', '(long-press an item to remove it)')}</Text>
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

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  flex1: { flex: 1, minWidth: 0 },
  heading: { fontSize: typography.heading.fontSize, fontWeight: '800', color: colors.text },
  intro: { fontSize: typography.small.fontSize, color: colors.textLight, marginTop: spacing.xs, lineHeight: 19, marginBottom: spacing.md },

  letterCard: { backgroundColor: colors.butter, borderRadius: radius.cards, padding: spacing.lg, marginBottom: spacing.md },
  letterLabel: { fontSize: typography.tiny.fontSize, color: colors.textLight, letterSpacing: 1, marginBottom: spacing.xs },
  letterBody: { fontSize: typography.body.fontSize, color: colors.text, fontStyle: 'italic', lineHeight: 21 },

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
  releaseEarly: { backgroundColor: colors.peach },
  releaseText: { fontSize: typography.small.fontSize, fontWeight: '700', color: colors.onAccent },

  graveyard: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tomb: { width: '48%', flexGrow: 1, alignItems: 'center', backgroundColor: colors.cardBg, borderTopLeftRadius: 40, borderTopRightRadius: 40, borderBottomLeftRadius: radius.small, borderBottomRightRadius: radius.small, paddingVertical: spacing.lg, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border },
  tombEmoji: { fontSize: 30 },
  tombName: { fontSize: typography.small.fontSize, fontWeight: '700', color: colors.text, marginTop: spacing.xs, textDecorationLine: 'line-through', maxWidth: '100%' },
  tombRip: { fontSize: typography.tiny.fontSize, color: colors.textMuted, fontStyle: 'italic', marginTop: 1 },
  tombSaved: { fontSize: typography.body.fontSize, color: colors.sage, fontWeight: '800', marginTop: spacing.xs },
  tombDate: { fontSize: typography.tiny.fontSize, color: colors.textMuted, marginTop: 1 },
  bringBackBtn: { backgroundColor: colors.lilac, paddingVertical: spacing.xs, paddingHorizontal: spacing.md, borderRadius: radius.buttons, marginTop: spacing.sm },
  bringBackText: { fontSize: typography.tiny.fontSize, color: colors.onAccent, fontWeight: '700' },

  cavedRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.cardBg, borderRadius: radius.inputs, padding: spacing.md, marginBottom: spacing.sm },
  cavedName: { fontSize: typography.small.fontSize, color: colors.textLight },
  cavedAmt: { fontSize: typography.small.fontSize, color: colors.textLight, fontWeight: '700' },
  hint: { fontSize: typography.tiny.fontSize, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs },

  fab: { position: 'absolute', right: spacing.lg, bottom: spacing.lg, width: 58, height: 58, borderRadius: 999, backgroundColor: colors.lilac, alignItems: 'center', justifyContent: 'center', shadowColor: colors.lilac, shadowOpacity: 0.5, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  fabPlus: { color: colors.onAccent, fontSize: 30, marginTop: -2 },
});

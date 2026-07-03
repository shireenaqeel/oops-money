// SettingsScreen.tsx — shows the saved onboarding values + a reset button (testing helper for now).
// Full settings UI (edit budget/income, notifications, etc.) gets built out in later features.
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, ScrollView, TextInput, Switch } from 'react-native';
import { Screen } from '../components/shared';
import CSVImportModal from './CSVImportModal';
import CategoryBudgets from '../components/CategoryBudgets';
import BestieMode from '../components/BestieMode';
import CloudBackup from '../components/CloudBackup';
import AICoachSettings from '../components/AICoachSettings';
import GoalsModal from './GoalsModal';
import CycleModal from './CycleModal';
import WishlistModal from './WishlistModal';
import ChallengesModal from './ChallengesModal';
import EventsModal from './EventsModal';
import { useAppContext } from '../hooks/useAppContext';
import { spacing, radius, typography, ThemeColors } from '../constants/theme';
import { useTheme, useThemeMeta } from '../hooks/useTheme';
import { useLang } from '../hooks/useLang';
import { L } from '../i18n';
import { fmtINR } from '../utils';

export default function SettingsScreen() {
  const { income, budget, splurgeFund, letters, addLetter, deleteLetter, resetAll, resetCategories, catOverrides, nightShield, setNightShield, billReminders, setBillReminders, recurring } = useAppContext();
  const colors = useTheme();
  const styles = makeStyles(colors);
  const { themeId, setTheme, palettes } = useThemeMeta();
  const { lang, setLang } = useLang();
  const [draft, setDraft] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [showGoals, setShowGoals] = useState(false);
  const [showCycle, setShowCycle] = useState(false);
  const [showWishlist, setShowWishlist] = useState(false);
  const [showChallenges, setShowChallenges] = useState(false);
  const [showEvents, setShowEvents] = useState(false);

  // Toggle bill reminders; if permission is denied, flip back off and explain.
  async function toggleBills(on: boolean) {
    const ok = await setBillReminders(on);
    if (on && !ok) {
      Alert.alert(L('Notifications band hain', 'Notifications are off'), L('Phone settings mein Oops Money ke liye notifications allow karo, phir try karo 🔔', 'Allow notifications for Oops Money in phone settings, then try again 🔔'));
    } else if (on && ok && recurring.length === 0) {
      Alert.alert(L('reminders on! 🔔', 'reminders on! 🔔'), L('Abhi koi bill nahi hai — Bills tab 🔁 mein bill add karo, reminder apne aap set ho jayega.', 'No bills yet — add one in the Bills tab 🔁 and a reminder sets itself.'));
    }
  }

  // Save the typed letter to your future self.
  function saveLetter() {
    const text = draft.trim();
    if (!text) return;
    addLetter(text);
    setDraft('');
  }

  // Restore the original built-in categories (undo any rename/delete). Custom categories stay.
  function confirmResetCats() {
    Alert.alert(
      L('Categories default pe reset karein?', 'Reset categories to default?'),
      L('Tumne built-in categories mein jo naam/emoji badle ya jo hataye, woh wapas original ho jayenge. Teri apni custom categories rahengi. 🌸', 'Any renames or deletes you made to built-in categories will be undone. Your own custom categories stay. 🌸'),
      [
        { text: L('rehne do', 'cancel'), style: 'cancel' },
        { text: L('haan, reset', 'yes, reset'), style: 'destructive', onPress: () => resetCategories() },
      ]
    );
  }

  // Ask for confirmation, then wipe all data and return to onboarding.
  function confirmReset() {
    Alert.alert(L('Sab reset kar dein?', 'Reset everything?'), L('Saara data (income, budget, kharche) delete ho jayega. Pakka?', 'All your data (income, budget, expenses) will be deleted. Sure?'), [
      { text: L('rehne do', 'cancel'), style: 'cancel' },
      { text: L('haan, reset', 'yes, reset'), style: 'destructive', onPress: () => resetAll() },
    ]);
  }

  // One labelled row showing a saved amount.
  function Row({ emoji, label, value }: { emoji: string; label: string; value: string }) {
    const n = parseInt(value, 10) || 0;
    return (
      <View style={styles.row}>
        <Text style={styles.rowEmoji}>{emoji}</Text>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{n > 0 ? fmtINR(n) : '—'}</Text>
      </View>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Settings 🎀</Text>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>{L('YOUR SETUP', 'YOUR SETUP')}</Text>
          <Row emoji="💰" label={L('Monthly income', 'Monthly income')} value={income} />
          <Row emoji="🎯" label={L('Monthly budget', 'Monthly budget')} value={budget} />
          <Row emoji="🛍️" label={L('Splurge fund', 'Splurge fund')} value={splurgeFund} />
        </View>

        {/* late-night shopping shield toggle */}
        <View style={styles.shieldRow}>
          <Text style={styles.shieldEmoji}>🌙</Text>
          <View style={styles.flex1}>
            <Text style={styles.shieldTitle}>{L('Late-night shield', 'Late-night shield')}</Text>
            <Text style={styles.shieldSub}>{L('11pm–4am pe kharcha add karne se pehle ek "so jao babe" reminder', 'a "go to sleep babe" reminder before adding a spend between 11pm–4am')}</Text>
          </View>
          <Switch value={nightShield} onValueChange={setNightShield} trackColor={{ false: colors.border, true: colors.periwinkle }} thumbColor={colors.cardBg} />
        </View>

        {/* bill reminders toggle */}
        <View style={styles.billRow}>
          <Text style={styles.shieldEmoji}>🔔</Text>
          <View style={styles.flex1}>
            <Text style={styles.shieldTitle}>{L('Bill reminders', 'Bill reminders')}</Text>
            <Text style={styles.shieldSub}>{L("recurring bill ke due din subah ek reminder ('rent due hai aaj 🔔')", "a morning reminder on each recurring bill's due day ('rent is due today 🔔')")}</Text>
          </View>
          <Switch value={billReminders} onValueChange={toggleBills} trackColor={{ false: colors.border, true: colors.butter }} thumbColor={colors.cardBg} />
        </View>

        {/* csv import */}
        <Pressable style={styles.importBtn} onPress={() => setShowImport(true)}>
          <Text style={styles.importEmoji}>📂</Text>
          <View style={styles.flex1}>
            <Text style={styles.importTitle}>{L('Import bank statement', 'Import bank statement')}</Text>
            <Text style={styles.importSub}>{L('HDFC / ICICI / SBI / Paytm CSV — auto-detect categories', 'HDFC / ICICI / SBI / Paytm CSV — auto-detect categories')}</Text>
          </View>
          <Text style={styles.importArrow}>›</Text>
        </Pressable>

        {/* cloud backup — optional Google sign-in + sync */}
        <CloudBackup />

        {/* AI coach — optional real AI via your own free Gemini key */}
        <AICoachSettings />

        {/* theme picker */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>{L('THEME 🎨', 'THEME 🎨')}</Text>
          <View style={styles.themeWrap}>
            {palettes.map((p) => {
              const active = p.id === themeId;
              return (
                <Pressable key={p.id} onPress={() => setTheme(p.id)} style={[styles.themeChip, active && styles.themeChipActive]}>
                  <Text style={styles.themeEmoji}>{p.emoji}</Text>
                  <Text style={[styles.themeName, active && styles.themeNameActive]}>{p.name}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* festival / shaadi season mode */}
        <Pressable style={styles.eventBtn} onPress={() => setShowEvents(true)}>
          <Text style={styles.goalsEmoji}>🎉</Text>
          <View style={styles.flex1}>
            <Text style={styles.goalsTitle}>{L('Season Mode', 'Season Mode')}</Text>
            <Text style={styles.goalsSub}>{L('Diwali / shaadi / trip ka alag budget — kharche alag se track karo ✨', 'Diwali / wedding / trip — a separate budget, tracked on its own ✨')}</Text>
          </View>
          <Text style={styles.goalsArrow}>›</Text>
        </Pressable>

        {/* challenges */}
        <Pressable style={styles.challengeBtn} onPress={() => setShowChallenges(true)}>
          <Text style={styles.goalsEmoji}>🏆</Text>
          <View style={styles.flex1}>
            <Text style={styles.goalsTitle}>{L('Challenges', 'Challenges')}</Text>
            <Text style={styles.goalsSub}>{L('no-Zomato week, ₹500 week — chhota challenge lo, trophy kamao 💪', 'no-Zomato week, ₹500 week — take a small challenge, earn a trophy 💪')}</Text>
          </View>
          <Text style={styles.goalsArrow}>›</Text>
        </Pressable>

        {/* manifest board — wishlist with save-up math */}
        <Pressable style={styles.wishBtn} onPress={() => setShowWishlist(true)}>
          <Text style={styles.goalsEmoji}>🌟</Text>
          <View style={styles.flex1}>
            <Text style={styles.goalsTitle}>{L('Manifest Board', 'Manifest Board')}</Text>
            <Text style={styles.goalsSub}>{L('jo chahiye usse impulse-buy mat karo — save karke manifest karo 💖', "don't impulse-buy what you want — save up and manifest it 💖")}</Text>
          </View>
          <Text style={styles.goalsArrow}>›</Text>
        </Pressable>

        {/* language picker */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>{L('BHASHA 🗣️', 'LANGUAGE 🗣️')}</Text>
          <View style={styles.themeWrap}>
            <Pressable onPress={() => setLang('hinglish')} style={[styles.themeChip, lang === 'hinglish' && styles.themeChipActive]}>
              <Text style={styles.themeEmoji}>🇮🇳</Text>
              <Text style={[styles.themeName, lang === 'hinglish' && styles.themeNameActive]}>Hinglish</Text>
            </Pressable>
            <Pressable onPress={() => setLang('english')} style={[styles.themeChip, lang === 'english' && styles.themeChipActive]}>
              <Text style={styles.themeEmoji}>🔤</Text>
              <Text style={[styles.themeName, lang === 'english' && styles.themeNameActive]}>English</Text>
            </Pressable>
          </View>
        </View>

        {/* sapna jar — savings goals */}
        <Pressable style={styles.goalsBtn} onPress={() => setShowGoals(true)}>
          <Text style={styles.goalsEmoji}>🫙</Text>
          <View style={styles.flex1}>
            <Text style={styles.goalsTitle}>{L('Sapna Jar', 'Dream Jar')}</Text>
            <Text style={styles.goalsSub}>{L('savings goals — paise side karo, jar bharta dekho ✨', 'savings goals — set money aside, watch the jar fill ✨')}</Text>
          </View>
          <Text style={styles.goalsArrow}>›</Text>
        </Pressable>

        {/* category budgets */}
        <CategoryBudgets />

        {/* reset built-in categories — only shown once you've changed some */}
        {Object.keys(catOverrides).length > 0 ? (
          <Pressable style={styles.resetCatsBtn} onPress={confirmResetCats}>
            <Text style={styles.resetCatsText}>{L('↺ categories default pe reset karo', '↺ reset categories to default')}</Text>
          </Pressable>
        ) : null}

        {/* accountability bestie */}
        <BestieMode />

        {/* period / cycle tracking — opens its own full-screen space */}
        <Pressable style={styles.cycleBtn} onPress={() => setShowCycle(true)}>
          <Text style={styles.goalsEmoji}>🌸</Text>
          <View style={styles.flex1}>
            <Text style={styles.goalsTitle}>{L('Cycle Tracking', 'Cycle Tracking')}</Text>
            <Text style={styles.goalsSub}>{L('period log karo, phase + agla period dekho, aur PMS week ka kharcha samjho 🩸', 'log your period, see your phase + next period, and your PMS-week spending 🩸')}</Text>
          </View>
          <Text style={styles.goalsArrow}>›</Text>
        </Pressable>

        {/* future-me letters */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>{L('FUTURE-ME LETTERS 💌', 'FUTURE-ME LETTERS 💌')}</Text>
          <Text style={styles.letterHint}>{L('future tum ko ek note likho — jail ke time yeh dikhega taaki yaad rahe kyun bachat kar rahi ho', 'write a note to future you — it shows during impulse jail so you remember why you\'re saving')}</Text>
          <TextInput
            style={styles.letterInput}
            value={draft}
            onChangeText={setDraft}
            placeholder={L('dear future me, please mat khareedna woh...', "dear future me, please don't buy that...")}
            placeholderTextColor={colors.textMuted}
            multiline
          />
          <Pressable style={[styles.letterBtn, !draft.trim() && styles.letterBtnDisabled]} onPress={saveLetter} disabled={!draft.trim()}>
            <Text style={styles.letterBtnText}>{L('save letter ✦', 'save letter ✦')}</Text>
          </Pressable>

          {letters.map((l) => (
            <View key={l.id} style={styles.letterItem}>
              <Text style={styles.letterText}>💌 {l.text}</Text>
              <Pressable onPress={() => deleteLetter(l.id)} hitSlop={10}>
                <Text style={styles.letterDel}>✕</Text>
              </Pressable>
            </View>
          ))}
        </View>

        <Pressable style={styles.resetBtn} onPress={confirmReset}>
          <Text style={styles.resetText}>{L('reset app data (testing)', 'reset app data (testing)')}</Text>
        </Pressable>
        <Text style={styles.note}>{L('(yeh button onboarding dobara test karne ke liye hai)', '(this button is for re-testing onboarding)')}</Text>
      </ScrollView>
      <CSVImportModal visible={showImport} onClose={() => setShowImport(false)} />
      <GoalsModal visible={showGoals} onClose={() => setShowGoals(false)} />
      <CycleModal visible={showCycle} onClose={() => setShowCycle(false)} />
      <WishlistModal visible={showWishlist} onClose={() => setShowWishlist(false)} />
      <ChallengesModal visible={showChallenges} onClose={() => setShowChallenges(false)} />
      <EventsModal visible={showEvents} onClose={() => setShowEvents(false)} />
    </Screen>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  content: { padding: spacing.lg },
  flex1: { flex: 1 },
  heading: { fontSize: typography.heading.fontSize, fontWeight: '800', color: colors.text, marginBottom: spacing.lg },
  shieldRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.lilac, borderRadius: radius.cards, padding: spacing.md, marginBottom: spacing.md },
  shieldEmoji: { fontSize: 22, marginRight: spacing.md },
  shieldTitle: { fontSize: typography.body.fontSize, fontWeight: '700', color: colors.text },
  shieldSub: { fontSize: typography.small.fontSize, color: colors.text, opacity: 0.7, marginTop: 1, marginRight: spacing.sm },
  billRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.butter, borderRadius: radius.cards, padding: spacing.md, marginBottom: spacing.md },
  themeWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  themeChip: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.cream, borderRadius: radius.chips, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderWidth: 1.5, borderColor: colors.border },
  themeChipActive: { backgroundColor: colors.lavender, borderColor: colors.rose },
  themeEmoji: { fontSize: 15 },
  themeName: { fontSize: typography.small.fontSize, color: colors.textLight, fontWeight: '600' },
  themeNameActive: { color: colors.onAccent, fontWeight: '700' },
  goalsBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.sage, borderRadius: radius.cards, padding: spacing.md, marginBottom: spacing.md },
  cycleBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.blush, borderRadius: radius.cards, padding: spacing.md, marginBottom: spacing.md },
  wishBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.babyBlue, borderRadius: radius.cards, padding: spacing.md, marginBottom: spacing.md },
  challengeBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.periwinkle, borderRadius: radius.cards, padding: spacing.md, marginBottom: spacing.md },
  eventBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.coral, borderRadius: radius.cards, padding: spacing.md, marginBottom: spacing.md },
  goalsEmoji: { fontSize: 22, marginRight: spacing.md },
  goalsTitle: { fontSize: typography.body.fontSize, fontWeight: '700', color: colors.text },
  goalsSub: { fontSize: typography.small.fontSize, color: colors.text, opacity: 0.7, marginTop: 1, marginRight: spacing.sm },
  goalsArrow: { fontSize: 22, color: colors.text, opacity: 0.5 },
  importBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.powderBlue, borderRadius: radius.cards, padding: spacing.md, marginBottom: spacing.md },
  importEmoji: { fontSize: 22, marginRight: spacing.md },
  importTitle: { fontSize: typography.body.fontSize, fontWeight: '700', color: colors.text },
  importSub: { fontSize: typography.small.fontSize, color: colors.text, opacity: 0.7, marginTop: 1 },
  importArrow: { fontSize: 22, color: colors.text, opacity: 0.5 },
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: radius.cards,
    padding: spacing.lg,
    shadowColor: colors.cardShadow,
    shadowOpacity: 1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardLabel: { fontSize: typography.tiny.fontSize, color: colors.textMuted, letterSpacing: 2, marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  rowEmoji: { fontSize: 20, marginRight: spacing.md },
  rowLabel: { flex: 1, fontSize: typography.body.fontSize, color: colors.text },
  rowValue: { fontSize: typography.body.fontSize, fontWeight: '700', color: colors.text },
  letterHint: { fontSize: typography.small.fontSize, color: colors.textLight, lineHeight: 18, marginBottom: spacing.md },
  letterInput: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.inputs, padding: spacing.md, fontSize: typography.body.fontSize, color: colors.text, minHeight: 70, textAlignVertical: 'top' },
  letterBtn: { backgroundColor: colors.lilac, paddingVertical: spacing.sm, borderRadius: radius.buttons, alignItems: 'center', marginTop: spacing.sm },
  letterBtnDisabled: { backgroundColor: colors.textMuted, opacity: 0.5 },
  letterBtnText: { color: colors.onAccent, fontSize: typography.small.fontSize, fontWeight: '700' },
  letterItem: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.cream, borderRadius: radius.inputs, padding: spacing.md, marginTop: spacing.sm },
  letterText: { flex: 1, fontSize: typography.small.fontSize, color: colors.text, fontStyle: 'italic', lineHeight: 19 },
  letterDel: { fontSize: 14, color: colors.textMuted, marginLeft: spacing.sm },

  resetBtn: {
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.buttons,
    borderWidth: 1.5,
    borderColor: colors.coral,
    alignItems: 'center',
  },
  resetText: { color: colors.dangerDeep, fontSize: typography.body.fontSize, fontWeight: '700' },
  resetCatsBtn: { paddingVertical: spacing.sm, alignItems: 'center', marginBottom: spacing.md },
  resetCatsText: { color: colors.textLight, fontSize: typography.small.fontSize, fontWeight: '600' },
  note: { fontSize: typography.small.fontSize, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm },
});

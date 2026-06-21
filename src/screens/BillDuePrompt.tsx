// BillDuePrompt.tsx — when a recurring bill's due date has arrived (today or in the past) and it
// hasn't been logged yet, this pops up asking whether it was paid. "Yes" logs it dated to the due
// day; "no" just marks it handled. Shown on Home; asks one pending bill at a time. Feature 10+.
import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import { useAppContext } from '../hooks/useAppContext';
import { spacing, radius, typography, ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useLang } from '../hooks/useLang';
import { L } from '../i18n';
import { fmtINR, getToday } from '../utils';
import { pendingBills } from '../utils/recurring';
import { findCat } from '../constants/categories';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "2026-06-05" → "5 Jun"
function prettyDate(isoStr: string): string {
  const [, mm, dd] = isoStr.split('-');
  return `${Number(dd)} ${MONTHS[Number(mm) - 1]}`;
}

export default function BillDuePrompt() {
  const { recurring, customCats, resolveRecurring } = useAppContext();
  const colors = useTheme();
  const styles = makeStyles(colors);
  useLang(); // subscribe so text re-renders when language toggles
  const [dismissed, setDismissed] = useState(false); // "baad mein" hides until next app open

  const pending = useMemo(() => pendingBills(recurring, new Date()), [recurring]);
  const current = pending[0]; // ask one at a time; resolving reveals the next

  if (!current) return null; // nothing due → render nothing

  const { bill, occ } = current;
  const cat = findCat(bill.catId, customCats);
  const emoji = cat.name.split(' ')[0];
  const isToday = occ === getToday();

  return (
    <Modal visible={!dismissed} transparent animationType="fade" onRequestClose={() => setDismissed(true)}>
      <Pressable style={styles.overlay} onPress={() => setDismissed(true)} />
      <View style={styles.centerWrap} pointerEvents="box-none">
        <View style={styles.sheet}>
          <View style={[styles.icon, { backgroundColor: cat.bg }]}>
            <Text style={styles.iconEmoji}>{emoji}</Text>
          </View>

          <Text style={styles.title}>
            {isToday
              ? L(`${bill.name} aaj due hai 🔔`, `${bill.name} is due today 🔔`)
              : L(`${bill.name} ${prettyDate(occ)} ko due tha`, `${bill.name} was due on ${prettyDate(occ)}`)}
          </Text>
          <Text style={styles.amount}>{fmtINR(bill.amount)}</Text>
          <Text style={styles.question}>
            {isToday
              ? L('yeh pay kiya? abhi log kar du?', 'paid this? want me to log it?')
              : L('kya tumne us din yeh pay kiya tha?', 'did you pay this on that day?')}
          </Text>

          {/* yes → log dated to the due day */}
          <Pressable style={styles.yesBtn} onPress={() => resolveRecurring(bill.id, occ, true)}>
            <Text style={styles.yesText}>
              {isToday ? L('haan, log karo 🌸', 'yes, log it 🌸') : L(`haan — ${prettyDate(occ)} pe log karo 🌸`, `yes — log on ${prettyDate(occ)} 🌸`)}
            </Text>
          </Pressable>

          {/* no → just mark handled, don't log */}
          <Pressable style={styles.noBtn} onPress={() => resolveRecurring(bill.id, occ, false)}>
            <Text style={styles.noText}>{L('nahi kiya', "didn't pay")}</Text>
          </Pressable>

          {/* later → hide for now */}
          <Pressable style={styles.laterBtn} onPress={() => setDismissed(true)}>
            <Text style={styles.laterText}>{L('baad mein', 'later')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#00000066' },
  centerWrap: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  sheet: { backgroundColor: colors.cardBg, borderRadius: radius.modals, padding: spacing.lg, alignItems: 'center' },
  icon: { width: 56, height: 56, borderRadius: 999, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  iconEmoji: { fontSize: 28 },
  title: { fontSize: typography.title.fontSize, fontWeight: '700', color: colors.text, textAlign: 'center' },
  amount: { fontSize: typography.display.fontSize, fontWeight: '800', color: colors.text, marginVertical: spacing.sm },
  question: { fontSize: typography.body.fontSize, color: colors.textLight, textAlign: 'center', marginBottom: spacing.lg },
  yesBtn: { backgroundColor: colors.rose, paddingVertical: spacing.md, borderRadius: radius.buttons, alignItems: 'center', alignSelf: 'stretch' },
  yesText: { color: colors.onAccent, fontSize: typography.body.fontSize, fontWeight: '700' },
  noBtn: { paddingVertical: spacing.md, borderRadius: radius.buttons, alignItems: 'center', alignSelf: 'stretch', marginTop: spacing.sm, backgroundColor: colors.cream },
  noText: { color: colors.text, fontSize: typography.body.fontSize, fontWeight: '600' },
  laterBtn: { paddingVertical: spacing.sm, alignItems: 'center', marginTop: spacing.xs },
  laterText: { color: colors.textMuted, fontSize: typography.small.fontSize, fontWeight: '600' },
});

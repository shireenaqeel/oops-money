// QuickAddBar.tsx — a one-line "smart" expense entry on Home. Type something like "chai 40" or
// "swiggy 350" and it understands the amount + guesses the category (reusing parseSpokenExpense),
// shows a preview, and logs on confirm. On-device, no LLM — just a friendly parser.
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Keyboard } from 'react-native';
import { useAppContext } from '../hooks/useAppContext';
import { spacing, radius, typography, ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useLang } from '../hooks/useLang';
import { L } from '../i18n';
import { getToday, parseSpokenExpense } from '../utils';
import { findCat } from '../constants/categories';

// Strip the amount words out of the raw text so the note is just the item/merchant.
function cleanNote(text: string): string {
  return text
    .replace(/₹|rs\.?|rupees?|rupaye|rupay/gi, ' ')
    .replace(/\b\d+(?:[.,]\d+)?k?\b/gi, ' ') // 40, 1,500, 2k
    .replace(/\b(ek|do|teen|char|chaar|paanch|panch|chhe|che|saat|aath|nau|das|sau|hundred|hazaar|hazar|thousand|lakh|lac|one|two|three|four|five|six|seven|eight|nine|ten)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export default function QuickAddBar() {
  const { addExpense, customCats } = useAppContext();
  const colors = useTheme();
  const styles = makeStyles(colors);
  useLang();
  const [text, setText] = useState('');
  const [justLogged, setJustLogged] = useState<string | null>(null);

  const parsed = parseSpokenExpense(text, customCats);
  const catId = parsed.catId ?? 'other';
  const cat = findCat(catId, customCats);
  const note = cleanNote(text);
  const valid = parsed.amount > 0;

  // Log the previewed expense and reset.
  const log = async () => {
    if (!valid) return;
    Keyboard.dismiss();
    await addExpense({ amount: parsed.amount, catId, note, date: getToday(), color: cat.color });
    setJustLogged(`${cat.name.split(' ')[0]} ${note || cat.name.replace(/^\S+\s/, '')}`.trim());
    setText('');
    setTimeout(() => setJustLogged(null), 3500);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.inputRow}>
        <Text style={styles.spark}>✨</Text>
        <TextInput
          style={styles.input}
          placeholder={L('likho jaise "chai 40" ya "swiggy 350"…', 'type like "chai 40" or "swiggy 350"…')}
          placeholderTextColor={colors.textMuted}
          value={text}
          onChangeText={(t) => {
            setText(t);
            if (justLogged) setJustLogged(null);
          }}
          onSubmitEditing={log}
          returnKeyType="done"
        />
        <Pressable style={[styles.logBtn, !valid && styles.logBtnOff]} onPress={log} disabled={!valid} hitSlop={6}>
          <Text style={styles.logBtnText}>{L('log', 'log')}</Text>
        </Pressable>
      </View>

      {/* live preview of what will be logged */}
      {valid ? (
        <Text style={styles.preview}>
          {L('samjha: ', 'got it: ')}
          <Text style={styles.previewStrong}>₹{parsed.amount.toLocaleString('en-IN')}</Text>
          {' · '}
          {cat.name}
          {note ? ` · ${note}` : ''}
          {parsed.catId ? '' : L('  (category baad me badal lena)', '  (tweak the category later)')}
        </Text>
      ) : justLogged ? (
        <Text style={styles.logged}>{L(`logged babe 🌸  ${justLogged}`, `logged babe 🌸  ${justLogged}`)}</Text>
      ) : text.trim().length > 0 ? (
        <Text style={styles.hint}>{L('amount samajh nahi aaya — jaise "chai 40" likho', 'couldn’t find an amount — try like "chai 40"')}</Text>
      ) : null}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrap: { backgroundColor: colors.cardBg, borderRadius: radius.cards, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
    inputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    spark: { fontSize: 18 },
    input: { flex: 1, fontSize: typography.body.fontSize, color: colors.text, paddingVertical: spacing.sm },
    logBtn: { backgroundColor: colors.rose, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.buttons },
    logBtnOff: { backgroundColor: colors.textMuted, opacity: 0.5 },
    logBtnText: { color: colors.onAccent, fontSize: typography.small.fontSize, fontWeight: '700' },
    preview: { fontSize: typography.small.fontSize, color: colors.textLight, marginTop: spacing.sm, marginLeft: 30, lineHeight: 18 },
    previewStrong: { color: colors.text, fontWeight: '700' },
    logged: { fontSize: typography.small.fontSize, color: colors.sage, fontWeight: '700', marginTop: spacing.sm, marginLeft: 30 },
    hint: { fontSize: typography.small.fontSize, color: colors.textMuted, marginTop: spacing.sm, marginLeft: 30 },
  });

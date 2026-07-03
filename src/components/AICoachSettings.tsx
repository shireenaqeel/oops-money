// AICoachSettings.tsx — Settings card to turn on the optional REAL AI coach with your OWN free
// Google Gemini key. Paste key → test → save. No key = the chat stays fully offline/private.
// Honest privacy note: with the coach ON, a short summary of your money is sent to Google's API.
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Linking, ActivityIndicator, Platform } from 'react-native';
import { useAppContext } from '../hooks/useAppContext';
import { spacing, radius, typography, ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useLang } from '../hooks/useLang';
import { L } from '../i18n';
import { testGeminiKey } from '../utils/gemini';

const KEY_URL = 'https://aistudio.google.com/app/apikey';

export default function AICoachSettings() {
  const { geminiKey, setGeminiKey } = useAppContext();
  const colors = useTheme();
  const styles = makeStyles(colors);
  useLang();
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState<'idle' | 'checking' | 'ok' | 'bad'>('idle');
  const [editing, setEditing] = useState(false);

  const hasKey = geminiKey.trim().length > 0;
  const masked = hasKey ? `••••••••${geminiKey.trim().slice(-4)}` : '';

  // Test the pasted key against Gemini, and save it only if it works.
  const saveKey = async () => {
    const k = draft.trim();
    if (!k) return;
    setStatus('checking');
    const res = await testGeminiKey(k);
    if (res.ok) {
      await setGeminiKey(k);
      setStatus('ok');
      setDraft('');
      setEditing(false);
    } else {
      setStatus('bad');
    }
  };

  // Turn the coach off (forget the key).
  const removeKey = async () => {
    await setGeminiKey('');
    setStatus('idle');
    setDraft('');
    setEditing(false);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>{L('AI COACH 🤖', 'AI COACH 🤖')}</Text>

      {hasKey && !editing ? (
        <>
          <View style={styles.onRow}>
            <Text style={styles.onText}>{L('AI coach ON ✨', 'AI coach ON ✨')}</Text>
            <Text style={styles.maskText}>{masked}</Text>
          </View>
          <Text style={styles.sub}>{L('ab "Paisa se pucho" chat real AI se jawaab dega — Insights ke Paisa AI card se kholo 💬', 'your "Ask Paisa" chat now replies with real AI — open it from the Paisa AI card in Insights 💬')}</Text>
          <View style={styles.btnRow}>
            <Pressable style={styles.ghostBtn} onPress={() => { setEditing(true); setStatus('idle'); }}>
              <Text style={styles.ghostText}>{L('key badlo', 'change key')}</Text>
            </Pressable>
            <Pressable style={styles.removeBtn} onPress={removeKey}>
              <Text style={styles.removeText}>{L('coach off karo', 'turn off')}</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <>
          <Text style={styles.sub}>
            {L('apni FREE Google Gemini key daalo → chat ek sach-much AI money coach ban jayega. Bina key ke chat offline hi chalega.', 'add your FREE Google Gemini key → the chat becomes a real AI money coach. Without a key it stays fully offline.')}
          </Text>

          <Pressable style={styles.getKey} onPress={() => Linking.openURL(KEY_URL)}>
            <Text style={styles.getKeyText}>{L('🔗 free key yahan se lo (Google AI Studio)', '🔗 get a free key here (Google AI Studio)')}</Text>
          </Pressable>

          <TextInput
            style={styles.input}
            placeholder={L('yahan Gemini key paste karo', 'paste your Gemini key here')}
            placeholderTextColor={colors.textMuted}
            value={draft}
            onChangeText={(t) => { setDraft(t); setStatus('idle'); }}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
          />

          {status === 'bad' ? <Text style={styles.badText}>{L('ye key kaam nahi kar rahi 🙈 dobara check karo', "that key didn't work 🙈 double-check it")}</Text> : null}

          <Pressable style={[styles.saveBtn, (!draft.trim() || status === 'checking') && { opacity: 0.5 }]} onPress={saveKey} disabled={!draft.trim() || status === 'checking'}>
            {status === 'checking' ? <ActivityIndicator size="small" color={colors.onAccent} /> : <Text style={styles.saveText}>{L('check karke save karo', 'check & save')}</Text>}
          </Pressable>

          {hasKey ? (
            <Pressable style={styles.cancelBtn} onPress={() => setEditing(false)}>
              <Text style={styles.cancelText}>{L('rehne do', 'cancel')}</Text>
            </Pressable>
          ) : null}

          <Text style={styles.privacy}>
            {L('🔒 note: coach ON hone pe tumhare paise ka chhota summary Google ke Gemini API ko bheja jaata hai (jawaab ke liye). Offline chat (bina key) kuch bahar nahi bhejta.', "🔒 note: with the coach ON, a short summary of your money is sent to Google's Gemini API (to answer). The offline chat (no key) sends nothing out.")}
          </Text>
        </>
      )}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: { backgroundColor: colors.cardBg, borderRadius: radius.cards, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
    cardLabel: { fontSize: typography.tiny.fontSize, color: colors.textMuted, letterSpacing: 2, marginBottom: spacing.sm },
    sub: { fontSize: typography.small.fontSize, color: colors.textLight, lineHeight: 18, marginBottom: spacing.md },
    onRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
    onText: { fontSize: typography.body.fontSize, color: colors.sage, fontWeight: '800' },
    maskText: { fontSize: typography.small.fontSize, color: colors.textMuted, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
    getKey: { marginBottom: spacing.md },
    getKeyText: { fontSize: typography.small.fontSize, color: colors.skyBlue, fontWeight: '700' },
    input: { backgroundColor: colors.cream, borderRadius: radius.inputs, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: typography.small.fontSize, color: colors.text, marginBottom: spacing.sm },
    badText: { fontSize: typography.small.fontSize, color: colors.dangerDeep, marginBottom: spacing.sm },
    saveBtn: { backgroundColor: colors.rose, paddingVertical: spacing.md, borderRadius: radius.buttons, alignItems: 'center' },
    saveText: { color: colors.onAccent, fontSize: typography.small.fontSize, fontWeight: '700' },
    cancelBtn: { alignItems: 'center', paddingVertical: spacing.sm, marginTop: spacing.xs },
    cancelText: { color: colors.textLight, fontSize: typography.small.fontSize, fontWeight: '600' },
    btnRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
    ghostBtn: { flex: 1, backgroundColor: colors.cream, paddingVertical: spacing.sm, borderRadius: radius.buttons, alignItems: 'center' },
    ghostText: { color: colors.text, fontSize: typography.small.fontSize, fontWeight: '700' },
    removeBtn: { flex: 1, backgroundColor: colors.blush, paddingVertical: spacing.sm, borderRadius: radius.buttons, alignItems: 'center' },
    removeText: { color: colors.text, fontSize: typography.small.fontSize, fontWeight: '700' },
    privacy: { fontSize: typography.tiny.fontSize, color: colors.textMuted, lineHeight: 15, marginTop: spacing.md },
  });

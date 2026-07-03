// PaisaChat.tsx — the "Paisa se pucho 💬" chat. Two brains, one UI:
//  • No Gemini key  → instant OFFLINE answers from utils/paisaChat (rule-based, private).
//  • Gemini key set → a REAL conversational AI coach via utils/gemini (uses your data + this chat).
// If the AI call fails (bad key / quota / no internet) it gracefully falls back to the offline answer.
import React, { useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Modal, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useAppContext } from '../hooks/useAppContext';
import { spacing, radius, typography, ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useLang } from '../hooks/useLang';
import { L } from '../i18n';
import { answerPaisa, chatSuggestions } from '../utils/paisaChat';
import { askGeminiCoach, CoachTurn } from '../utils/gemini';

interface Msg {
  role: 'user' | 'ai';
  text: string;
}

export default function PaisaChat({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { expenses, incomes, budget, customCats, geminiKey } = useAppContext();
  const colors = useTheme();
  const styles = makeStyles(colors);
  useLang();
  const scrollRef = useRef<ScrollView>(null);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const useAI = geminiKey.trim().length > 0;
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: 'ai',
      text: useAI
        ? L('hey babe 🌸 main tumhari Paisa coach — apne kharche, saving, budget kuch bhi pucho, main samjhaungi 💬', "hey babe 🌸 I'm Paisa, your money coach — ask me anything about your spending, saving or budget 💬")
        : L('hey babe 🌸 apne paise ke baare mein kuch bhi pucho — sab tumhare phone pe, private 🤍', 'hey babe 🌸 ask me anything about your money — all on your phone, private 🤍'),
    },
  ]);

  const scrollEnd = () => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);

  // Answer one question — via Gemini if a key is set, else the offline rule-based brain.
  const send = async (q: string) => {
    const question = q.trim();
    if (!question || pending) return;
    const priorTurns: CoachTurn[] = msgs.slice(1).map((m) => ({ role: m.role === 'user' ? 'user' : 'model', text: m.text })); // skip the greeting
    setMsgs((m) => [...m, { role: 'user', text: question }]);
    setInput('');
    scrollEnd();

    if (!useAI) {
      const reply = answerPaisa(question, { expenses, incomes, budget, customCats });
      setMsgs((m) => [...m, { role: 'ai', text: reply }]);
      scrollEnd();
      return;
    }

    setPending(true);
    const res = await askGeminiCoach(geminiKey.trim(), priorTurns, question, { expenses, incomes, budget, customCats });
    let reply: string;
    if (res.ok) {
      reply = res.text;
    } else {
      // graceful fallback: offline answer + a short note about why AI didn't reply
      const offline = answerPaisa(question, { expenses, incomes, budget, customCats });
      const note =
        res.text === 'invalid-key'
          ? L('(AI key galat lag rahi hai — Settings mein check karo)', '(that AI key looks invalid — check it in Settings)')
          : res.text === 'rate-limit'
          ? L('(AI abhi busy hai, free limit — thodi der baad try karo)', '(AI is busy right now, free limit — try again in a bit)')
          : res.text === 'network'
          ? L('(internet nahi mila)', "(couldn't reach the internet)")
          : L('(AI abhi jawaab nahi de payi)', "(AI couldn't answer just now)");
      reply = `${note}\n${offline}`;
    }
    setMsgs((m) => [...m, { role: 'ai', text: reply }]);
    setPending(false);
    scrollEnd();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetWrap}>
        <View style={styles.sheet}>
          <View style={styles.grabber} />
          <View style={styles.headerRow}>
            <Text style={styles.title}>{L('Paisa se pucho 💬', 'Ask Paisa 💬')}</Text>
            <Text style={[styles.badge, useAI && { backgroundColor: colors.lavender, color: colors.onAccent }]}>{useAI ? L('AI ✨', 'AI ✨') : L('offline', 'offline')}</Text>
          </View>

          <ScrollView ref={scrollRef} style={styles.thread} contentContainerStyle={styles.threadContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {msgs.map((m, i) => (
              <View key={i} style={[styles.bubble, m.role === 'user' ? styles.userBubble : styles.aiBubble]}>
                <Text style={[styles.bubbleText, m.role === 'user' && styles.userText]}>{m.text}</Text>
              </View>
            ))}
            {pending ? (
              <View style={[styles.bubble, styles.aiBubble, styles.typing]}>
                <ActivityIndicator size="small" color={colors.textLight} />
                <Text style={styles.typingText}>{L('Paisa soch rahi hai…', 'Paisa is thinking…')}</Text>
              </View>
            ) : null}
          </ScrollView>

          {/* suggestion chips */}
          <View style={styles.chipsRow}>
            {chatSuggestions().map((s) => (
              <Pressable key={s} style={styles.chip} onPress={() => send(s)}>
                <Text style={styles.chipText}>{s}</Text>
              </Pressable>
            ))}
          </View>

          {/* input */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder={L('pucho…', 'ask…')}
              placeholderTextColor={colors.textMuted}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={() => send(input)}
              returnKeyType="send"
              editable={!pending}
            />
            <Pressable style={[styles.sendBtn, pending && { opacity: 0.5 }]} onPress={() => send(input)} disabled={pending} hitSlop={6}>
              <Text style={styles.sendText}>➤</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#00000055' },
    sheetWrap: { flex: 1, justifyContent: 'flex-end' },
    sheet: { height: '80%', backgroundColor: colors.cardBg, borderTopLeftRadius: radius.modals, borderTopRightRadius: radius.modals, padding: spacing.lg },
    grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 999, backgroundColor: colors.border, marginBottom: spacing.md },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
    title: { fontSize: typography.title.fontSize, fontWeight: '700', color: colors.text },
    badge: { fontSize: typography.tiny.fontSize, color: colors.textLight, backgroundColor: colors.cream, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.chips, overflow: 'hidden', fontWeight: '700' },
    thread: { flex: 1 },
    threadContent: { paddingVertical: spacing.sm, gap: spacing.sm },
    bubble: { maxWidth: '85%', borderRadius: radius.inputs, paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
    aiBubble: { alignSelf: 'flex-start', backgroundColor: colors.cream },
    userBubble: { alignSelf: 'flex-end', backgroundColor: colors.rose },
    bubbleText: { fontSize: typography.small.fontSize, color: colors.text, lineHeight: 20 },
    userText: { color: colors.onAccent, fontWeight: '600' },
    typing: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    typingText: { fontSize: typography.small.fontSize, color: colors.textLight, fontStyle: 'italic' },
    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm },
    chip: { backgroundColor: colors.lavender, borderRadius: radius.chips, paddingVertical: 6, paddingHorizontal: spacing.md },
    chipText: { fontSize: typography.tiny.fontSize, color: colors.onAccent, fontWeight: '600' },
    inputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md },
    input: { flex: 1, fontSize: typography.body.fontSize, color: colors.text, backgroundColor: colors.cream, borderRadius: radius.inputs, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
    sendBtn: { width: 42, height: 42, borderRadius: 999, backgroundColor: colors.rose, alignItems: 'center', justifyContent: 'center' },
    sendText: { color: colors.onAccent, fontSize: 18, fontWeight: '800' },
  });

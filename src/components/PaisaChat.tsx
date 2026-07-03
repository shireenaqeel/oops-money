// PaisaChat.tsx — the offline "Paisa se pucho 💬" chat. Ask questions about your money in plain
// Hinglish/English; answers come from utils/paisaChat (rule-based, on-device — no LLM, no internet).
import React, { useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Modal, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useAppContext } from '../hooks/useAppContext';
import { spacing, radius, typography, ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useLang } from '../hooks/useLang';
import { L } from '../i18n';
import { answerPaisa, chatSuggestions } from '../utils/paisaChat';

interface Msg {
  role: 'user' | 'ai';
  text: string;
}

export default function PaisaChat({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { expenses, incomes, budget, customCats } = useAppContext();
  const colors = useTheme();
  const styles = makeStyles(colors);
  useLang();
  const scrollRef = useRef<ScrollView>(null);
  const [input, setInput] = useState('');
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: 'ai', text: L('hey babe 🌸 apne paise ke baare mein kuch bhi pucho — sab tumhare phone pe, private 🤍', 'hey babe 🌸 ask me anything about your money — all on your phone, private 🤍') },
  ]);

  // Answer a question and append both bubbles.
  const send = (q: string) => {
    const question = q.trim();
    if (!question) return;
    const reply = answerPaisa(question, { expenses, incomes, budget, customCats });
    setMsgs((m) => [...m, { role: 'user', text: question }, { role: 'ai', text: reply }]);
    setInput('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetWrap}>
        <View style={styles.sheet}>
          <View style={styles.grabber} />
          <View style={styles.headerRow}>
            <Text style={styles.title}>{L('Paisa se pucho 💬', 'Ask Paisa 💬')}</Text>
            <Text style={styles.badge}>{L('offline', 'offline')}</Text>
          </View>

          <ScrollView ref={scrollRef} style={styles.thread} contentContainerStyle={styles.threadContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {msgs.map((m, i) => (
              <View key={i} style={[styles.bubble, m.role === 'user' ? styles.userBubble : styles.aiBubble]}>
                <Text style={[styles.bubbleText, m.role === 'user' && styles.userText]}>{m.text}</Text>
              </View>
            ))}
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
            />
            <Pressable style={styles.sendBtn} onPress={() => send(input)} hitSlop={6}>
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
    badge: { fontSize: typography.tiny.fontSize, color: colors.textLight, backgroundColor: colors.cream, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.chips, overflow: 'hidden' },
    thread: { flex: 1 },
    threadContent: { paddingVertical: spacing.sm, gap: spacing.sm },
    bubble: { maxWidth: '85%', borderRadius: radius.inputs, paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
    aiBubble: { alignSelf: 'flex-start', backgroundColor: colors.cream },
    userBubble: { alignSelf: 'flex-end', backgroundColor: colors.rose },
    bubbleText: { fontSize: typography.small.fontSize, color: colors.text, lineHeight: 20 },
    userText: { color: colors.onAccent, fontWeight: '600' },
    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm },
    chip: { backgroundColor: colors.lavender, borderRadius: radius.chips, paddingVertical: 6, paddingHorizontal: spacing.md },
    chipText: { fontSize: typography.tiny.fontSize, color: colors.onAccent, fontWeight: '600' },
    inputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md },
    input: { flex: 1, fontSize: typography.body.fontSize, color: colors.text, backgroundColor: colors.cream, borderRadius: radius.inputs, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
    sendBtn: { width: 42, height: 42, borderRadius: 999, backgroundColor: colors.rose, alignItems: 'center', justifyContent: 'center' },
    sendText: { color: colors.onAccent, fontSize: 18, fontWeight: '800' },
  });

// AddCategoryModal.tsx — small sheet to create a custom category: pick an emoji + type a name (Feature 5).
// Used inside the Add Expense modal. On create it returns the new category so the caller can select it.
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Modal, ScrollView, Alert } from 'react-native';
import { useAppContext } from '../hooks/useAppContext';
import { Category } from '../types';
import { spacing, radius, typography, ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useLang } from '../hooks/useLang';
import { L } from '../i18n';

// A small handful of cute starter emojis (no extra library needed). Kept short on purpose —
// for anything else, the type-your-own emoji box lets you enter any emoji from the keyboard.
// Avoids emojis already used by built-in categories so there are no duplicates.
const EMOJIS = [
  '🎨', '🎸', '🎧', '📷', '🍷', '🍕', '🍩', '🧁',
  '🧋', '🛍️', '💍', '🕶️', '🚲', '💻', '🐶', '🐱',
  '🦋', '🌿', '🌈', '🎁', '🦄', '🔮', '👑', '💖',
];

export default function AddCategoryModal({
  visible,
  onClose,
  onCreated,
  editCat,
  onSaved,
  onDeleted,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: (cat: Category) => void;
  editCat?: Category | null; // when set, the sheet edits this category instead of creating one
  onSaved?: (cat: Category) => void; // called after an edit is saved
  onDeleted?: (id: string) => void; // called after the category is deleted
}) {
  const { addCustomCat, updateCustomCat, deleteCustomCat } = useAppContext();
  const colors = useTheme();
  const styles = makeStyles(colors);
  useLang(); // subscribe so text re-renders when language toggles
  const isEditing = !!editCat;
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [name, setName] = useState('');

  // Reset fields each time the sheet opens — prefill from editCat when editing.
  useEffect(() => {
    if (!visible) return;
    if (editCat) {
      const sp = editCat.name.indexOf(' '); // stored as "emoji name"
      setEmoji(sp > 0 ? editCat.name.slice(0, sp) : EMOJIS[0]);
      setName(sp > 0 ? editCat.name.slice(sp + 1) : editCat.name);
    } else {
      setEmoji(EMOJIS[0]);
      setName('');
    }
  }, [visible, editCat]);

  const canSave = name.trim().length > 0;

  // Save: update the existing category when editing, otherwise create a new one.
  async function onSave() {
    if (!canSave) return;
    const finalEmoji = emoji.trim() || '🏷️'; // fall back if the emoji box was cleared
    if (editCat) {
      await updateCustomCat(editCat.id, name.trim(), finalEmoji);
      onSaved?.({ ...editCat, name: `${finalEmoji} ${name.trim()}` });
    } else {
      const cat = await addCustomCat(name.trim(), finalEmoji);
      onCreated(cat);
    }
    onClose();
  }

  // Confirm, then delete the category being edited.
  function onDelete() {
    if (!editCat) return;
    Alert.alert(
      L('category delete karein? 🗑️', 'delete this category? 🗑️'),
      L('purani entries rahengi, bas yeh category list se hat jayegi.', 'past entries stay; this category just leaves the list.'),
      [
        { text: L('rehne do', 'cancel'), style: 'cancel' },
        {
          text: L('delete', 'delete'),
          style: 'destructive',
          onPress: async () => {
            await deleteCustomCat(editCat.id);
            onDeleted?.(editCat.id);
            onClose();
          },
        },
      ]
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={styles.centerWrap} pointerEvents="box-none">
        <View style={styles.sheet}>
          <Text style={styles.title}>
            {isEditing ? L('category edit karo ✏️', 'edit category ✏️') : L('apni category banao 🌷', 'make your own category 🌷')}
          </Text>

          {/* preview */}
          <View style={styles.preview}>
            <Text style={styles.previewEmoji}>{emoji}</Text>
            <Text style={styles.previewName}>{name.trim() || L('category name...', 'category name...')}</Text>
          </View>

          {/* name input */}
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={L('naam likho (Art, Plants, etc.)', 'type a name (Art, Plants, etc.)')}
            placeholderTextColor={colors.textMuted}
            autoFocus
          />

          {/* type your own emoji from the keyboard (syncs with the grid below) */}
          <Text style={styles.label}>{L('emoji chuno (ya keyboard se apna daalo)', 'pick an emoji (or type your own)')}</Text>
          <View style={styles.customEmojiRow}>
            <TextInput
              style={styles.customEmojiInput}
              value={emoji}
              onChangeText={(t) => setEmoji(t.trim())}
              placeholder="🙂"
              placeholderTextColor={colors.textMuted}
              maxLength={8}
              textAlign="center"
            />
            <Text style={styles.customHint}>{L('apne keyboard 😀 se koi bhi emoji type karo', 'type any emoji from your 😀 keyboard')}</Text>
          </View>

          {/* emoji grid */}
          <ScrollView style={styles.emojiScroll} contentContainerStyle={styles.emojiGrid} showsVerticalScrollIndicator={false}>
            {EMOJIS.map((e) => (
              <Pressable key={e} onPress={() => setEmoji(e)} style={[styles.emojiCell, emoji === e && styles.emojiCellActive]}>
                <Text style={styles.emojiText}>{e}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Pressable style={[styles.btn, !canSave && styles.btnDisabled]} onPress={onSave} disabled={!canSave}>
            <Text style={styles.btnText}>{isEditing ? L('save ✦', 'save ✦') : L('add ✦', 'add ✦')}</Text>
          </Pressable>

          {/* delete (edit mode only) */}
          {isEditing ? (
            <Pressable style={styles.deleteBtn} onPress={onDelete}>
              <Text style={styles.deleteText}>{L('🗑️ ye category delete karo', '🗑️ delete this category')}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#00000066' },
  centerWrap: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  sheet: { backgroundColor: colors.cardBg, borderRadius: radius.modals, padding: spacing.lg },
  title: { fontSize: typography.title.fontSize, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  preview: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.cream, borderRadius: radius.inputs, padding: spacing.md, marginBottom: spacing.md },
  previewEmoji: { fontSize: 24 },
  previewName: { fontSize: typography.body.fontSize, color: colors.text, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.inputs, padding: spacing.md, fontSize: typography.body.fontSize, color: colors.text },
  label: { fontSize: typography.small.fontSize, color: colors.textLight, marginTop: spacing.md, marginBottom: spacing.sm },
  customEmojiRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  customEmojiInput: { width: 56, height: 56, borderWidth: 1, borderColor: colors.border, borderRadius: radius.inputs, fontSize: 26, color: colors.text, padding: 0 },
  customHint: { flex: 1, fontSize: typography.tiny.fontSize, color: colors.textMuted },
  emojiScroll: { maxHeight: 180 },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  emojiCell: { width: 44, height: 44, borderRadius: radius.small, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream },
  emojiCellActive: { backgroundColor: colors.lavender },
  emojiText: { fontSize: 22 },
  btn: { backgroundColor: colors.rose, paddingVertical: spacing.md, borderRadius: radius.buttons, alignItems: 'center', marginTop: spacing.lg },
  btnDisabled: { backgroundColor: colors.textMuted, opacity: 0.5 },
  btnText: { color: colors.onAccent, fontSize: typography.body.fontSize, fontWeight: '700' },
  deleteBtn: { alignItems: 'center', paddingVertical: spacing.md, marginTop: spacing.xs },
  deleteText: { color: colors.dangerDeep, fontSize: typography.small.fontSize, fontWeight: '600' },
});

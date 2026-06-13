// AddCategoryModal.tsx — small sheet to create a custom category: pick an emoji + type a name (Feature 5).
// Used inside the Add Expense modal. On create it returns the new category so the caller can select it.
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Modal, ScrollView } from 'react-native';
import { useAppContext } from '../hooks/useAppContext';
import { Category } from '../types';
import { spacing, radius, typography, ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

// Curated emoji palette to pick from (no extra library needed).
const EMOJIS = ['🎨', '🧶', '🎸', '🎮', '🍿', '🌿', '🪴', '🐶', '🐱', '☕', '🍷', '🎂', '🎁', '✈️', '🏖️', '💅', '👗', '📚', '✏️', '🧘', '🚲', '🛍️', '🎧', '📷', '🪙', '🍩', '🌸', '✨', '💖', '🔮'];

export default function AddCategoryModal({
  visible,
  onClose,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: (cat: Category) => void;
}) {
  const { addCustomCat } = useAppContext();
  const colors = useTheme();
  const styles = makeStyles(colors);
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [name, setName] = useState('');

  // Reset fields each time the sheet opens.
  useEffect(() => {
    if (visible) {
      setEmoji(EMOJIS[0]);
      setName('');
    }
  }, [visible]);

  const canSave = name.trim().length > 0;

  // Create the category, hand it back to the caller, and close.
  async function onCreate() {
    if (!canSave) return;
    const cat = await addCustomCat(name.trim(), emoji);
    onCreated(cat);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={styles.centerWrap} pointerEvents="box-none">
        <View style={styles.sheet}>
          <Text style={styles.title}>apni category banao 🌷</Text>

          {/* preview */}
          <View style={styles.preview}>
            <Text style={styles.previewEmoji}>{emoji}</Text>
            <Text style={styles.previewName}>{name.trim() || 'category name...'}</Text>
          </View>

          {/* name input */}
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="naam likho (Art, Plants, etc.)"
            placeholderTextColor={colors.textMuted}
            autoFocus
          />

          {/* emoji grid */}
          <Text style={styles.label}>emoji chuno</Text>
          <ScrollView style={styles.emojiScroll} contentContainerStyle={styles.emojiGrid} showsVerticalScrollIndicator={false}>
            {EMOJIS.map((e) => (
              <Pressable key={e} onPress={() => setEmoji(e)} style={[styles.emojiCell, emoji === e && styles.emojiCellActive]}>
                <Text style={styles.emojiText}>{e}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Pressable style={[styles.btn, !canSave && styles.btnDisabled]} onPress={onCreate} disabled={!canSave}>
            <Text style={styles.btnText}>add ✦</Text>
          </Pressable>
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
  emojiScroll: { maxHeight: 180 },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  emojiCell: { width: 44, height: 44, borderRadius: radius.small, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream },
  emojiCellActive: { backgroundColor: colors.lavender },
  emojiText: { fontSize: 22 },
  btn: { backgroundColor: colors.rose, paddingVertical: spacing.md, borderRadius: radius.buttons, alignItems: 'center', marginTop: spacing.lg },
  btnDisabled: { backgroundColor: colors.textMuted, opacity: 0.5 },
  btnText: { color: colors.onAccent, fontSize: typography.body.fontSize, fontWeight: '700' },
});

// WishlistModal.tsx — "Manifest Board" (V3). Instead of impulse-buying, add the thing you want here;
// the app does the save-up math: "save ₹X/day and it's yours in Y days 💖". Opened from Settings, fully local.
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Modal, ScrollView } from 'react-native';
import { useAppContext } from '../hooks/useAppContext';
import { spacing, radius, typography, ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { fmtINR, fmtDateLabel } from '../utils';

// Keep only digits from a typed amount.
const digits = (t: string) => t.replace(/[^0-9]/g, '');

// ISO yyyy-mm-dd for "today + n days", so we can reuse fmtDateLabel for a friendly date.
function isoInDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export default function WishlistModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { wishlist, addWish, updateWishPerDay, deleteWish } = useAppContext();
  const colors = useTheme();
  const styles = makeStyles(colors);
  const [emoji, setEmoji] = useState('🌟');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [perDay, setPerDay] = useState('');

  // Create a wish from the form, then reset it.
  function create() {
    const p = parseInt(price, 10) || 0;
    const d = parseInt(perDay, 10) || 50;
    if (!name.trim() || p <= 0) return;
    addWish(name.trim(), emoji.trim() || '🌟', p, d);
    setName('');
    setPrice('');
    setPerDay('');
    setEmoji('🌟');
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={styles.sheetWrap}>
        <ScrollView style={styles.sheet} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.grabber} />
          <Text style={styles.title}>Manifest Board 🌟</Text>
          <Text style={styles.sub}>jo chahiye usse abhi mat khareedo — yahan daalo, save karke manifest karo ✨</Text>

          {/* new wish form */}
          <View style={styles.form}>
            <View style={styles.formTop}>
              <TextInput style={styles.emojiInput} value={emoji} onChangeText={setEmoji} maxLength={2} />
              <TextInput
                style={styles.nameInput}
                value={name}
                onChangeText={setName}
                placeholder="kya chahiye? (jaise: Zara dress)"
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <View style={styles.formBottom}>
              <View style={styles.inBox}>
                <Text style={styles.rupee}>₹</Text>
                <TextInput
                  style={styles.inInput}
                  value={price}
                  onChangeText={(t) => setPrice(digits(t))}
                  placeholder="price"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                />
              </View>
              <View style={styles.inBox}>
                <Text style={styles.rupee}>₹</Text>
                <TextInput
                  style={styles.inInput}
                  value={perDay}
                  onChangeText={(t) => setPerDay(digits(t))}
                  placeholder="roz (50)"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                />
              </View>
              <Pressable style={[styles.addBtn, (!name.trim() || !price) && styles.disabled]} onPress={create} disabled={!name.trim() || !price}>
                <Text style={styles.addText}>+</Text>
              </Pressable>
            </View>
          </View>

          {/* wishlist */}
          {wishlist.length === 0 ? (
            <Text style={styles.empty}>abhi koi wish nahi babe — kuch manifest karo ✨</Text>
          ) : (
            wishlist.map((w) => {
              const days = Math.ceil(w.price / Math.max(w.perDay, 1));
              return (
                <View key={w.id} style={styles.wishCard}>
                  <View style={styles.wishHead}>
                    <Text style={styles.wishEmoji}>{w.emoji}</Text>
                    <View style={styles.flex1}>
                      <Text style={styles.wishName}>{w.name}</Text>
                      <Text style={styles.wishPrice}>{fmtINR(w.price)}</Text>
                    </View>
                    <Pressable onPress={() => deleteWish(w.id)} hitSlop={10}>
                      <Text style={styles.del}>✕</Text>
                    </Pressable>
                  </View>

                  <Text style={styles.mathLine}>
                    roz <Text style={styles.bold}>{fmtINR(w.perDay)}</Text> bachao → <Text style={styles.bold}>{days} din</Text> mein tera 💖
                  </Text>
                  <Text style={styles.dateLine}>milega around {fmtDateLabel(isoInDays(days))}</Text>

                  {/* adjust daily save */}
                  <View style={styles.stepRow}>
                    <Text style={styles.stepLabel}>roz kitna bachegi?</Text>
                    <Pressable style={styles.stepBtn} onPress={() => updateWishPerDay(w.id, Math.max(1, w.perDay - 10))} hitSlop={6}>
                      <Text style={styles.stepBtnText}>−</Text>
                    </Pressable>
                    <Text style={styles.stepVal}>{fmtINR(w.perDay)}</Text>
                    <Pressable style={styles.stepBtn} onPress={() => updateWishPerDay(w.id, w.perDay + 10)} hitSlop={6}>
                      <Text style={styles.stepBtnText}>+</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })
          )}

          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>done ✦</Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#00000055' },
    sheetWrap: { flex: 1, justifyContent: 'flex-end' },
    sheet: { maxHeight: '90%', backgroundColor: colors.cardBg, borderTopLeftRadius: radius.modals, borderTopRightRadius: radius.modals },
    content: { padding: spacing.lg, paddingBottom: spacing.xl },
    grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 999, backgroundColor: colors.border, marginBottom: spacing.md },
    flex1: { flex: 1 },
    title: { fontSize: typography.title.fontSize, fontWeight: '700', color: colors.text },
    sub: { fontSize: typography.small.fontSize, color: colors.textLight, marginTop: 2, marginBottom: spacing.lg },

    form: { backgroundColor: colors.skyBlue, borderRadius: radius.inputs, padding: spacing.md, marginBottom: spacing.lg },
    formTop: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
    emojiInput: { width: 46, textAlign: 'center', backgroundColor: colors.cardBg, borderRadius: radius.small, fontSize: 20, paddingVertical: spacing.sm },
    nameInput: { flex: 1, backgroundColor: colors.cardBg, borderRadius: radius.small, paddingHorizontal: spacing.md, fontSize: typography.body.fontSize, color: colors.text },
    formBottom: { flexDirection: 'row', gap: spacing.sm },
    inBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardBg, borderRadius: radius.small, paddingHorizontal: spacing.md },
    rupee: { fontSize: 16, color: colors.rose, fontWeight: '700', marginRight: spacing.xs },
    inInput: { flex: 1, paddingVertical: spacing.sm, fontSize: typography.body.fontSize, color: colors.text },
    addBtn: { backgroundColor: colors.rose, width: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.small },
    addText: { color: colors.onAccent, fontWeight: '800', fontSize: 22 },
    disabled: { opacity: 0.4 },

    empty: { fontSize: typography.body.fontSize, color: colors.textLight, fontStyle: 'italic', textAlign: 'center', paddingVertical: spacing.lg },

    wishCard: { backgroundColor: colors.cream, borderRadius: radius.inputs, padding: spacing.md, marginBottom: spacing.md },
    wishHead: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
    wishEmoji: { fontSize: 26, marginRight: spacing.sm },
    wishName: { fontSize: typography.body.fontSize, fontWeight: '700', color: colors.text },
    wishPrice: { fontSize: typography.small.fontSize, color: colors.textLight, marginTop: 1 },
    del: { fontSize: 16, color: colors.textMuted, paddingHorizontal: spacing.xs },

    mathLine: { fontSize: typography.small.fontSize, color: colors.text, lineHeight: 20 },
    bold: { fontWeight: '800', color: colors.text },
    dateLine: { fontSize: typography.tiny.fontSize, color: colors.textLight, marginTop: 2 },

    stepRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md },
    stepLabel: { flex: 1, fontSize: typography.small.fontSize, color: colors.textLight },
    stepBtn: { width: 30, height: 30, borderRadius: 999, backgroundColor: colors.cardBg, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
    stepBtnText: { fontSize: 18, fontWeight: '700', color: colors.text },
    stepVal: { minWidth: 64, textAlign: 'center', fontSize: typography.small.fontSize, fontWeight: '700', color: colors.text },

    closeBtn: { backgroundColor: colors.lavender, paddingVertical: spacing.md, borderRadius: radius.buttons, alignItems: 'center', marginTop: spacing.sm },
    closeText: { color: colors.onAccent, fontSize: typography.body.fontSize, fontWeight: '700' },
  });

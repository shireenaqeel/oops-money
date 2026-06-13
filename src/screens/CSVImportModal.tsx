// CSVImportModal.tsx — pick a bank statement CSV, preview auto-detected categories, import in bulk. Feature 17.
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, ScrollView, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useAppContext } from '../hooks/useAppContext';
import { spacing, radius, typography, ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { fmtINR } from '../utils';
import { findCat } from '../constants/categories';
import { parseBankCSV, ParsedExpense } from '../utils/csv';

export default function CSVImportModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { bulkAddExpenses, customCats } = useAppContext();
  const colors = useTheme();
  const styles = makeStyles(colors);
  const [parsed, setParsed] = useState<ParsedExpense[]>([]);
  const [step, setStep] = useState<'pick' | 'preview'>('pick');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Reset whenever the sheet opens.
  useEffect(() => {
    if (visible) {
      setParsed([]);
      setStep('pick');
      setBusy(false);
      setError('');
    }
  }, [visible]);

  // Let the user pick a CSV, read it, parse it, and move to the preview.
  async function pickFile() {
    try {
      setError('');
      const res = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (res.canceled) return;
      const uri = res.assets?.[0]?.uri;
      if (!uri) return;
      setBusy(true);
      const content = await FileSystem.readAsStringAsync(uri);
      const items = parseBankCSV(content);
      setBusy(false);
      if (items.length === 0) {
        setError('koi transaction nahi mili — kya yeh sahi CSV hai?');
        return;
      }
      setParsed(items);
      setStep('preview');
    } catch (e) {
      setBusy(false);
      setError('file padhne mein dikkat — dobara try karo');
    }
  }

  // Import all parsed transactions.
  function confirm() {
    bulkAddExpenses(parsed);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={styles.wrap}>
        <View style={styles.sheet}>
          <View style={styles.grabber} />

          {step === 'pick' ? (
            <>
              <Text style={styles.title}>bank statement import 📂</Text>
              <View style={styles.infoBox}>
                <Text style={styles.infoLine}>✦ HDFC: NetBanking → Download Statement (CSV)</Text>
                <Text style={styles.infoLine}>✦ ICICI: iMobile → Statements → Export CSV</Text>
                <Text style={styles.infoLine}>✦ Paytm: Passbook → Download Statement</Text>
                <Text style={styles.infoLine}>✦ SBI YONO: Statements → Export as CSV</Text>
              </View>
              {busy ? (
                <ActivityIndicator color={colors.rose} style={{ marginVertical: spacing.md }} />
              ) : (
                <Pressable style={styles.btn} onPress={pickFile}>
                  <Text style={styles.btnText}>choose CSV file ✦</Text>
                </Pressable>
              )}
              {error ? <Text style={styles.error}>{error}</Text> : null}
            </>
          ) : (
            <>
              <Text style={styles.title}>found {parsed.length} transactions ✨</Text>
              <Text style={styles.sub}>categories auto-detect ho gayi — import karein?</Text>
              <ScrollView style={styles.previewList} showsVerticalScrollIndicator={false}>
                {parsed.slice(0, 12).map((e, i) => {
                  const cat = findCat(e.catId, customCats);
                  return (
                    <View key={i} style={styles.previewItem}>
                      <Text style={styles.previewNote} numberOfLines={1}>
                        {cat.name.split(' ')[0]} {e.note}
                      </Text>
                      <Text style={styles.previewAmt}>{fmtINR(e.amount)}</Text>
                    </View>
                  );
                })}
                {parsed.length > 12 ? <Text style={styles.more}>...and {parsed.length - 12} more</Text> : null}
              </ScrollView>
              <View style={styles.btnRow}>
                <Pressable style={styles.btnCancel} onPress={() => setStep('pick')}>
                  <Text style={styles.btnCancelText}>back</Text>
                </Pressable>
                <Pressable style={styles.btnConfirm} onPress={confirm}>
                  <Text style={styles.btnText}>import all ✦</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#00000055' },
  wrap: { flex: 1, justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.cardBg, borderTopLeftRadius: radius.modals, borderTopRightRadius: radius.modals, padding: spacing.lg, paddingBottom: spacing.xl },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 999, backgroundColor: colors.border, marginBottom: spacing.md },
  title: { fontSize: typography.title.fontSize, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  sub: { fontSize: typography.small.fontSize, color: colors.textLight, marginBottom: spacing.md },

  infoBox: { backgroundColor: colors.powderBlue, borderRadius: radius.inputs, padding: spacing.md, marginBottom: spacing.md },
  infoLine: { fontSize: typography.small.fontSize, color: colors.text, lineHeight: 22 },

  btn: { backgroundColor: colors.rose, paddingVertical: spacing.md, borderRadius: radius.buttons, alignItems: 'center' },
  btnText: { color: colors.onAccent, fontSize: typography.body.fontSize, fontWeight: '700' },
  error: { fontSize: typography.small.fontSize, color: colors.dangerDeep, marginTop: spacing.md, textAlign: 'center' },

  previewList: { maxHeight: 240, marginBottom: spacing.md },
  previewItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.cream, borderRadius: radius.small, padding: spacing.sm, marginBottom: spacing.xs },
  previewNote: { flex: 1, fontSize: typography.small.fontSize, color: colors.text, marginRight: spacing.sm },
  previewAmt: { fontSize: typography.small.fontSize, fontWeight: '700', color: colors.text },
  more: { fontSize: typography.small.fontSize, color: colors.textMuted, textAlign: 'center', fontStyle: 'italic', paddingVertical: spacing.xs },

  btnRow: { flexDirection: 'row', gap: spacing.sm },
  btnCancel: { flex: 1, backgroundColor: colors.cream, paddingVertical: spacing.md, borderRadius: radius.buttons, alignItems: 'center' },
  btnCancelText: { color: colors.textLight, fontSize: typography.body.fontSize, fontWeight: '700' },
  btnConfirm: { flex: 2, backgroundColor: colors.mint, paddingVertical: spacing.md, borderRadius: radius.buttons, alignItems: 'center' },
});

// CloudBackup.tsx — the optional "sign in with Google to back up" card in Settings.
// Hidden entirely until real Supabase keys are configured, so the app never shows a dead button.
import React from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useLang } from '../hooks/useLang';
import { L } from '../i18n';
import { spacing, radius, typography, ThemeColors } from '../constants/theme';

export default function CloudBackup() {
  const { configured, session, email, busy, status, signInWithGoogle, signOut, backupNow, restoreNow } = useAuth();
  const colors = useTheme();
  const styles = makeStyles(colors);
  useLang(); // subscribe so text re-renders when language toggles

  if (!configured) return null; // setup not done yet — stay invisible

  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>{L('CLOUD BACKUP ☁️', 'CLOUD BACKUP ☁️')}</Text>

      {!session ? (
        <>
          <Text style={styles.hint}>
            {L('Google se sign in karo taaki tumhara data cloud pe backup ho jaaye — naya phone ya app reinstall pe sab wapas mil jayega. (optional hai, app aise bhi chalega 💾)', 'Sign in with Google so your data backs up to the cloud — on a new phone or reinstall you get it all back. (optional, the app works without it too 💾)')}
          </Text>
          <Pressable style={[styles.primaryBtn, busy && styles.btnDisabled]} onPress={signInWithGoogle} disabled={busy}>
            {busy ? <ActivityIndicator color={colors.onAccent} /> : <Text style={styles.primaryText}>Sign in with Google ☁️</Text>}
          </Pressable>
        </>
      ) : (
        <>
          <View style={styles.signedRow}>
            <Text style={styles.signedEmoji}>✅</Text>
            <View style={styles.flex1}>
              <Text style={styles.signedTitle}>{L('signed in', 'signed in')}</Text>
              <Text style={styles.signedEmail}>{email}</Text>
            </View>
          </View>

          <Text style={styles.autoNote}>{L('auto-backup on ☁️ — har change apne aap cloud pe save hota hai', 'auto-backup on ☁️ — every change saves to the cloud automatically')}</Text>

          <View style={styles.btnRow}>
            <Pressable style={[styles.halfBtn, busy && styles.btnDisabled]} onPress={backupNow} disabled={busy}>
              <Text style={styles.halfText}>Back up ⬆️</Text>
            </Pressable>
            <Pressable style={[styles.halfBtn, styles.halfBtnAlt, busy && styles.btnDisabled]} onPress={restoreNow} disabled={busy}>
              <Text style={[styles.halfText, styles.halfTextAlt]}>Restore ⬇️</Text>
            </Pressable>
          </View>

          <Pressable onPress={signOut} disabled={busy} hitSlop={8}>
            <Text style={styles.signOut}>{L('sign out', 'sign out')}</Text>
          </Pressable>
        </>
      )}

      {!!status && <Text style={styles.status}>{status}</Text>}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  flex1: { flex: 1 },
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: radius.cards,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: colors.cardShadow,
    shadowOpacity: 1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardLabel: { fontSize: typography.tiny.fontSize, color: colors.textMuted, letterSpacing: 2, marginBottom: spacing.md },
  hint: { fontSize: typography.small.fontSize, color: colors.textLight, lineHeight: 18, marginBottom: spacing.md },
  primaryBtn: { backgroundColor: colors.skyBlue, paddingVertical: spacing.md, borderRadius: radius.buttons, alignItems: 'center' },
  primaryText: { color: colors.onAccent, fontSize: typography.body.fontSize, fontWeight: '700' },
  btnDisabled: { opacity: 0.5 },
  signedRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  signedEmoji: { fontSize: 22, marginRight: spacing.md },
  signedTitle: { fontSize: typography.body.fontSize, fontWeight: '700', color: colors.text },
  signedEmail: { fontSize: typography.small.fontSize, color: colors.textLight, marginTop: 1 },
  autoNote: { fontSize: typography.small.fontSize, color: colors.textLight, marginBottom: spacing.md },
  btnRow: { flexDirection: 'row', gap: spacing.sm },
  halfBtn: { flex: 1, backgroundColor: colors.skyBlue, paddingVertical: spacing.sm, borderRadius: radius.buttons, alignItems: 'center' },
  halfBtnAlt: { backgroundColor: colors.powderBlue },
  halfText: { color: colors.onAccent, fontSize: typography.small.fontSize, fontWeight: '700' },
  halfTextAlt: { color: colors.text },
  signOut: { textAlign: 'center', fontSize: typography.small.fontSize, color: colors.dangerDeep, marginTop: spacing.md, fontWeight: '600' },
  status: { fontSize: typography.small.fontSize, color: colors.textLight, textAlign: 'center', marginTop: spacing.md, lineHeight: 17 },
});

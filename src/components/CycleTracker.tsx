// CycleTracker.tsx — period/cycle logging UI (V2), lives on the Cycle screen.
// Log a period start, set your cycle length, see the next predicted date. Supportive, never clinical.
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAppContext } from '../hooks/useAppContext';
import { spacing, radius, typography, ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useLang } from '../hooks/useLang';
import { L } from '../i18n';
import { fmtDateLabel, getToday } from '../utils';
import { getCycleInfo, Phase } from '../utils/cycle';

// A gentle, non-judgmental line for the current phase (Hinglish).
const PHASE_MSG: Record<Phase, string> = {
  period: 'period chal raha hai 🌸 — rest, chai aur self-care. budget ki tension abhi mat lo',
  pms: 'PMS week, babe 💕 cravings aur impulse buys high ho sakte hain — khud pe gentle raho',
  normal: 'cycle ke beech mein ho — all good ✨',
  unknown: 'pehla period log karo, phir yahan tumhara cycle + prediction dikhega 🌸',
};
// English version of the phase lines.
const PHASE_MSG_EN: Record<Phase, string> = {
  period: 'period time 🌸 — rest, chai and self-care. don\'t stress about budget right now',
  pms: 'PMS week, babe 💕 cravings and impulse buys may run high — be gentle with yourself',
  normal: "you're mid-cycle — all good ✨",
  unknown: 'log your first period, then your cycle + prediction show here 🌸',
};
// Local yyyy-mm-dd for a picked Date.
function isoOf(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export default function CycleTracker() {
  const { periodStarts, cycleLength, logPeriodStart, removePeriodStart, setCycleLength } = useAppContext();
  const colors = useTheme();
  const styles = makeStyles(colors);
  useLang(); // subscribe so text re-renders when language toggles
  // phase banner background, themed
  const PHASE_BG: Record<Phase, string> = { period: colors.blush, pms: colors.coral, normal: colors.sage, unknown: colors.periwinkle };
  const [showPicker, setShowPicker] = useState(false);
  const info = getCycleInfo(periodStarts, cycleLength, getToday());

  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>{L('CYCLE TRACKING 🌸', 'CYCLE TRACKING 🌸')}</Text>
      <Text style={styles.hint}>{L('period log karo — neeche dikhega ki PMS week mein kharcha badhta hai ya nahi. (sab kuch tumhare phone pe, private)', 'log your period — below shows whether PMS-week spending rises or not. (all on your phone, private)')}</Text>

      {/* current phase banner */}
      <View style={[styles.phase, { backgroundColor: PHASE_BG[info.phase] }]}>
        <Text style={styles.phaseText}>{L(PHASE_MSG[info.phase], PHASE_MSG_EN[info.phase])}</Text>
        {info.dayOfCycle && info.dayOfCycle > 0 ? <Text style={styles.phaseDay}>{L(`cycle day ${info.dayOfCycle}`, `cycle day ${info.dayOfCycle}`)}</Text> : null}
      </View>

      {/* next predicted */}
      {info.nextPredicted ? (
        <Text style={styles.predict}>
          {L('🔮 agla period:', '🔮 next period:')} <Text style={styles.predictStrong}>{fmtDateLabel(info.nextPredicted)}</Text>
          {info.daysToNext != null && info.daysToNext >= 0 ? L(` (${info.daysToNext} din mein)`, ` (in ${info.daysToNext} days)`) : ''}
        </Text>
      ) : null}

      {/* log buttons */}
      <View style={styles.btnRow}>
        <Pressable style={styles.logBtn} onPress={() => logPeriodStart(getToday())}>
          <Text style={styles.logBtnText}>{L('period shuru hua aaj 🌸', 'period started today 🌸')}</Text>
        </Pressable>
        <Pressable style={styles.dayBtn} onPress={() => setShowPicker(true)}>
          <Text style={styles.dayBtnText}>{L('📅 koi aur din', '📅 another day')}</Text>
        </Pressable>
      </View>
      {showPicker ? (
        <DateTimePicker
          value={new Date()}
          mode="date"
          maximumDate={new Date()}
          onChange={(event, selected) => {
            setShowPicker(false);
            if (event.type === 'set' && selected) logPeriodStart(isoOf(selected));
          }}
        />
      ) : null}

      {/* cycle length stepper */}
      <View style={styles.lenRow}>
        <Text style={styles.lenLabel}>cycle length</Text>
        <View style={styles.stepper}>
          <Pressable style={styles.stepBtn} onPress={() => setCycleLength(cycleLength - 1)} hitSlop={8}>
            <Text style={styles.stepText}>−</Text>
          </Pressable>
          <Text style={styles.lenVal}>{L(`${cycleLength} din`, `${cycleLength} days`)}</Text>
          <Pressable style={styles.stepBtn} onPress={() => setCycleLength(cycleLength + 1)} hitSlop={8}>
            <Text style={styles.stepText}>+</Text>
          </Pressable>
        </View>
      </View>

      {/* logged dates */}
      {periodStarts.length > 0 ? (
        <View style={styles.list}>
          {[...periodStarts].sort((a, b) => (a < b ? 1 : -1)).map((d) => (
            <View key={d} style={styles.listItem}>
              <Text style={styles.listText}>🩸 {fmtDateLabel(d)}</Text>
              <Pressable onPress={() => removePeriodStart(d)} hitSlop={10}>
                <Text style={styles.listDel}>✕</Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
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
  cardLabel: { fontSize: typography.tiny.fontSize, color: colors.textMuted, letterSpacing: 2, marginBottom: spacing.sm },
  hint: { fontSize: typography.small.fontSize, color: colors.textLight, lineHeight: 18, marginBottom: spacing.md },

  phase: { borderRadius: radius.inputs, padding: spacing.md, marginBottom: spacing.md },
  phaseText: { fontSize: typography.small.fontSize, color: colors.text, fontWeight: '600', lineHeight: 19 },
  phaseDay: { fontSize: typography.tiny.fontSize, color: colors.text, opacity: 0.7, marginTop: spacing.xs },

  predict: { fontSize: typography.small.fontSize, color: colors.text, marginBottom: spacing.md },
  predictStrong: { fontWeight: '700' },

  btnRow: { flexDirection: 'row', gap: spacing.sm },
  logBtn: { flex: 1, backgroundColor: colors.rose, paddingVertical: spacing.sm, borderRadius: radius.buttons, alignItems: 'center' },
  logBtnText: { color: colors.onAccent, fontSize: typography.small.fontSize, fontWeight: '700' },
  dayBtn: { backgroundColor: colors.cream, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.buttons, alignItems: 'center', justifyContent: 'center' },
  dayBtnText: { color: colors.textLight, fontSize: typography.small.fontSize, fontWeight: '600' },

  lenRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md },
  lenLabel: { fontSize: typography.small.fontSize, color: colors.textLight },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stepBtn: { width: 30, height: 30, borderRadius: 999, backgroundColor: colors.lavender, alignItems: 'center', justifyContent: 'center' },
  stepText: { color: colors.onAccent, fontSize: 18, fontWeight: '800' },
  lenVal: { fontSize: typography.body.fontSize, fontWeight: '700', color: colors.text, minWidth: 56, textAlign: 'center' },

  list: { marginTop: spacing.md },
  listItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.cream, borderRadius: radius.inputs, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, marginTop: spacing.xs },
  listText: { fontSize: typography.small.fontSize, color: colors.text },
  listDel: { fontSize: 14, color: colors.textMuted },
});

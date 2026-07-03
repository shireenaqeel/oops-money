// DayLogSheet.tsx — the "log this day" bottom sheet, opened by tapping a day in the calendar.
// Mark a period start/end, and log flow, symptoms and mood for that date (Clue-style daily log).
// Flow/symptoms/mood are kept as a local draft and saved on "done"; period start/end apply instantly.
import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, ScrollView } from 'react-native';
import { useAppContext } from '../hooks/useAppContext';
import { spacing, radius, typography, ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useLang } from '../hooks/useLang';
import { L } from '../i18n';
import { fmtDateLabel } from '../utils';
import { FlowLevel } from '../types';
import { FLOW_LEVELS, CYCLE_SYMPTOMS, CYCLE_MOODS } from '../constants/cycleLog';

export default function DayLogSheet({ dateIso, onClose }: { dateIso: string | null; onClose: () => void }) {
  const { periodStarts, periodEnds, cycleDayLogs, logCycleDay, logPeriodStart, removePeriodStart, setPeriodEnd } = useAppContext();
  const colors = useTheme();
  const styles = makeStyles(colors);
  useLang();

  // Local draft of this day's flow/symptoms/mood.
  const [flow, setFlow] = useState<FlowLevel | undefined>(undefined);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [mood, setMood] = useState<string | undefined>(undefined);

  // Load the existing log whenever a new day is opened.
  useEffect(() => {
    if (!dateIso) return;
    const log = cycleDayLogs[dateIso];
    setFlow(log?.flow);
    setSymptoms(log?.symptoms ?? []);
    setMood(log?.mood);
  }, [dateIso]);

  if (!dateIso) return null;

  const isStart = periodStarts.includes(dateIso);
  // The most recent period start on or before this day (the period this day might belong to).
  const owningStart = [...periodStarts].sort((a, b) => (a < b ? 1 : -1)).find((s) => s <= dateIso) ?? null;
  const isEnd = owningStart != null && periodEnds[owningStart] === dateIso;

  // Toggle one symptom in the multi-select.
  const toggleSymptom = (id: string) => setSymptoms((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));

  // Save the draft and close.
  const done = () => {
    logCycleDay(dateIso, { flow, symptoms, mood });
    onClose();
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={done} />
      <View style={styles.sheetWrap}>
        <ScrollView style={styles.sheet} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.grabber} />
          <Text style={styles.title}>{fmtDateLabel(dateIso)}</Text>

          {/* period start / end quick actions */}
          <Text style={styles.sectionLabel}>{L('PERIOD 🩸', 'PERIOD 🩸')}</Text>
          <View style={styles.rowWrap}>
            <Pressable
              style={[styles.bigChip, isStart && { backgroundColor: colors.rose, borderColor: colors.rose }]}
              onPress={() => (isStart ? removePeriodStart(dateIso) : logPeriodStart(dateIso))}
            >
              <Text style={[styles.bigChipText, isStart && { color: colors.onAccent }]}>{L('🌸 period shuru hua', '🌸 period started')}</Text>
            </Pressable>
            <Pressable
              style={[styles.bigChip, isEnd && { backgroundColor: colors.lavender, borderColor: colors.lavender }, !owningStart && styles.chipDisabled]}
              onPress={() => {
                if (!owningStart) return;
                setPeriodEnd(owningStart, isEnd ? null : dateIso);
              }}
            >
              <Text style={[styles.bigChipText, isEnd && { color: colors.onAccent }]}>{L('✅ period khatam hua', '✅ period ended')}</Text>
            </Pressable>
          </View>
          {!owningStart ? <Text style={styles.hint}>{L('pehle period ka pehla din mark karo 🌸', 'mark the first day of a period first 🌸')}</Text> : null}

          {/* flow */}
          <Text style={styles.sectionLabel}>{L('FLOW 💧', 'FLOW 💧')}</Text>
          <View style={styles.rowWrap}>
            {FLOW_LEVELS.map((f) => {
              const on = flow === f.id;
              return (
                <Pressable key={f.id} style={[styles.chip, on && { backgroundColor: colors.rose, borderColor: colors.rose }]} onPress={() => setFlow(on ? undefined : f.id)}>
                  <Text style={[styles.chipText, on && { color: colors.onAccent }]}>{f.emoji} {L(f.label[0], f.label[1])}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* symptoms */}
          <Text style={styles.sectionLabel}>{L('SYMPTOMS 🌡️', 'SYMPTOMS 🌡️')}</Text>
          <View style={styles.rowWrap}>
            {CYCLE_SYMPTOMS.map((s) => {
              const on = symptoms.includes(s.id);
              return (
                <Pressable key={s.id} style={[styles.chip, on && { backgroundColor: colors.coral, borderColor: colors.coral }]} onPress={() => toggleSymptom(s.id)}>
                  <Text style={[styles.chipText, on && { color: colors.onAccent }]}>{s.emoji} {L(s.label[0], s.label[1])}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* mood */}
          <Text style={styles.sectionLabel}>{L('MOOD 🎭', 'MOOD 🎭')}</Text>
          <View style={styles.rowWrap}>
            {CYCLE_MOODS.map((m) => {
              const on = mood === m.id;
              return (
                <Pressable key={m.id} style={[styles.chip, on && { backgroundColor: colors.lavender, borderColor: colors.lavender }]} onPress={() => setMood(on ? undefined : m.id)}>
                  <Text style={[styles.chipText, on && { color: colors.onAccent }]}>{m.emoji} {L(m.label[0], m.label[1])}</Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable style={styles.doneBtn} onPress={done}>
            <Text style={styles.doneText}>{L('save 🌸', 'save 🌸')}</Text>
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
    sheet: { maxHeight: '88%', backgroundColor: colors.cardBg, borderTopLeftRadius: radius.modals, borderTopRightRadius: radius.modals },
    content: { padding: spacing.lg, paddingBottom: spacing.xl },
    grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 999, backgroundColor: colors.border, marginBottom: spacing.md },
    title: { fontSize: typography.title.fontSize, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
    sectionLabel: { fontSize: typography.tiny.fontSize, color: colors.textMuted, letterSpacing: 2, marginTop: spacing.md, marginBottom: spacing.sm },
    rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    bigChip: { flex: 1, minWidth: 140, alignItems: 'center', paddingVertical: spacing.md, borderRadius: radius.inputs, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.cream },
    bigChipText: { fontSize: typography.small.fontSize, color: colors.text, fontWeight: '700' },
    chipDisabled: { opacity: 0.45 },
    chip: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.chips, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.cream },
    chipText: { fontSize: typography.small.fontSize, color: colors.text },
    hint: { fontSize: typography.tiny.fontSize, color: colors.textLight, marginTop: spacing.xs },
    doneBtn: { backgroundColor: colors.rose, paddingVertical: spacing.md, borderRadius: radius.buttons, alignItems: 'center', marginTop: spacing.lg },
    doneText: { color: colors.onAccent, fontSize: typography.body.fontSize, fontWeight: '700' },
  });

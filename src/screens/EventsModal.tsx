// EventsModal.tsx — Festival / Shaadi Season Mode (V3). Make a temporary event budget
// (Diwali, a friend's wedding, a trip); tag spends to it in the add sheet; track it separately here.
// Opened from Settings, fully local.
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Modal, ScrollView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAppContext } from '../hooks/useAppContext';
import { spacing, radius, typography, ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useLang } from '../hooks/useLang';
import { L } from '../i18n';
import { fmtINR, fmtDateLabel, getToday } from '../utils';

// Keep only digits from a typed amount.
const digits = (t: string) => t.replace(/[^0-9]/g, '');

// ISO yyyy-mm-dd for a Date.
function isoOf(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

// "today + n days" as ISO (default event length).
function isoInDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return isoOf(d);
}

export default function EventsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { events, expenses, addEvent, deleteEvent } = useAppContext();
  const colors = useTheme();
  const styles = makeStyles(colors);
  useLang(); // subscribe so text re-renders when language toggles
  const [emoji, setEmoji] = useState('🎉');
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [start, setStart] = useState(getToday());
  const [end, setEnd] = useState(isoInDays(14));
  const [picking, setPicking] = useState<null | 'start' | 'end'>(null);

  // Create an event from the form, then reset it.
  function create() {
    const b = parseInt(budget, 10) || 0;
    if (!name.trim() || b <= 0) return;
    // Make sure end isn't before start.
    const safeEnd = end < start ? start : end;
    addEvent(name.trim(), emoji.trim() || '🎉', b, start, safeEnd);
    setName('');
    setBudget('');
    setEmoji('🎉');
    setStart(getToday());
    setEnd(isoInDays(14));
  }

  // Total tagged to a given event.
  const spentOf = (id: string) => expenses.filter((e) => e.eventId === id).reduce((s, e) => s + Number(e.amount), 0);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={styles.sheetWrap}>
        <ScrollView style={styles.sheet} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.grabber} />
          <Text style={styles.title}>{L('Season Mode 🎉', 'Season Mode 🎉')}</Text>
          <Text style={styles.sub}>{L('Diwali, shaadi, trip — uska alag budget banao, kharche tag karo, alag se track karo ✨', 'Diwali, wedding, trip — make a separate budget, tag spends, track it on its own ✨')}</Text>

          {/* new event form */}
          <View style={styles.form}>
            <View style={styles.formTop}>
              <TextInput style={styles.emojiInput} value={emoji} onChangeText={setEmoji} maxLength={2} />
              <TextInput
                style={styles.nameInput}
                value={name}
                onChangeText={setName}
                placeholder={L('event (jaise: Diya ki shaadi)', "event (e.g. Diya's wedding)")}
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <View style={styles.budgetRow}>
              <Text style={styles.rupee}>₹</Text>
              <TextInput
                style={styles.budgetInput}
                value={budget}
                onChangeText={(t) => setBudget(digits(t))}
                placeholder={L('event budget', 'event budget')}
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
              />
            </View>
            <View style={styles.dateRow}>
              <Pressable style={styles.datePill} onPress={() => setPicking('start')}>
                <Text style={styles.datePillLabel}>{L('se', 'from')}</Text>
                <Text style={styles.datePillVal}>{fmtDateLabel(start)}</Text>
              </Pressable>
              <Pressable style={styles.datePill} onPress={() => setPicking('end')}>
                <Text style={styles.datePillLabel}>{L('tak', 'to')}</Text>
                <Text style={styles.datePillVal}>{fmtDateLabel(end)}</Text>
              </Pressable>
              <Pressable style={[styles.addBtn, (!name.trim() || !budget) && styles.disabled]} onPress={create} disabled={!name.trim() || !budget}>
                <Text style={styles.addText}>+</Text>
              </Pressable>
            </View>
          </View>

          {picking ? (
            <DateTimePicker
              value={new Date((picking === 'start' ? start : end) + 'T00:00:00')}
              mode="date"
              onChange={(event, selected) => {
                const which = picking;
                setPicking(null);
                if (event.type === 'set' && selected) {
                  if (which === 'start') setStart(isoOf(selected));
                  else setEnd(isoOf(selected));
                }
              }}
            />
          ) : null}

          {/* events list */}
          {events.length === 0 ? (
            <Text style={styles.empty}>{L('abhi koi event nahi babe — Diwali ya shaadi ka budget banao 🎉', 'no events yet babe — make a Diwali or wedding budget 🎉')}</Text>
          ) : (
            events.map((ev) => {
              const spent = spentOf(ev.id);
              const pct = ev.budget > 0 ? Math.min(Math.round((spent / ev.budget) * 100), 100) : 0;
              const over = spent > ev.budget;
              const left = ev.budget - spent;
              return (
                <View key={ev.id} style={styles.eventCard}>
                  <View style={styles.eventHead}>
                    <Text style={styles.eventEmoji}>{ev.emoji}</Text>
                    <View style={styles.flex1}>
                      <Text style={styles.eventName}>{ev.name}</Text>
                      <Text style={styles.eventDates}>
                        {fmtDateLabel(ev.startDate)} – {fmtDateLabel(ev.endDate)}
                      </Text>
                    </View>
                    <Pressable onPress={() => deleteEvent(ev.id)} hitSlop={10}>
                      <Text style={styles.del}>✕</Text>
                    </Pressable>
                  </View>

                  <Text style={styles.eventAmt}>
                    {fmtINR(spent)} <Text style={styles.eventOf}>/ {fmtINR(ev.budget)}</Text> · {pct}%
                  </Text>
                  <View style={styles.track}>
                    <View style={[styles.fill, { width: `${pct}%`, backgroundColor: over ? colors.budgetOver : colors.peach }]} />
                  </View>
                  {over ? (
                    <Text style={styles.overText}>{L(`oops, event budget se ${fmtINR(Math.abs(left))} zyada 💀`, `oops, ${fmtINR(Math.abs(left))} over the event budget 💀`)}</Text>
                  ) : (
                    <Text style={styles.leftText}>{L(`${fmtINR(left)} bacha hai is event ke liye 🎀`, `${fmtINR(left)} left for this event 🎀`)}</Text>
                  )}
                </View>
              );
            })
          )}

          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>{L('done ✦', 'done ✦')}</Text>
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

    form: { backgroundColor: colors.peach, borderRadius: radius.inputs, padding: spacing.md, marginBottom: spacing.lg },
    formTop: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
    emojiInput: { width: 46, textAlign: 'center', backgroundColor: colors.cardBg, borderRadius: radius.small, fontSize: 20, paddingVertical: spacing.sm },
    nameInput: { flex: 1, backgroundColor: colors.cardBg, borderRadius: radius.small, paddingHorizontal: spacing.md, fontSize: typography.body.fontSize, color: colors.text },
    budgetRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardBg, borderRadius: radius.small, paddingHorizontal: spacing.md, marginBottom: spacing.sm },
    rupee: { fontSize: 16, color: colors.rose, fontWeight: '700', marginRight: spacing.xs },
    budgetInput: { flex: 1, paddingVertical: spacing.sm, fontSize: typography.body.fontSize, color: colors.text },
    dateRow: { flexDirection: 'row', gap: spacing.sm },
    datePill: { flex: 1, backgroundColor: colors.cardBg, borderRadius: radius.small, paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
    datePillLabel: { fontSize: typography.tiny.fontSize, color: colors.textMuted },
    datePillVal: { fontSize: typography.small.fontSize, color: colors.text, fontWeight: '700', marginTop: 1 },
    addBtn: { backgroundColor: colors.rose, width: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.small },
    addText: { color: colors.onAccent, fontWeight: '800', fontSize: 22 },
    disabled: { opacity: 0.4 },

    empty: { fontSize: typography.body.fontSize, color: colors.textLight, fontStyle: 'italic', textAlign: 'center', paddingVertical: spacing.lg },

    eventCard: { backgroundColor: colors.cream, borderRadius: radius.inputs, padding: spacing.md, marginBottom: spacing.md },
    eventHead: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
    eventEmoji: { fontSize: 26, marginRight: spacing.sm },
    eventName: { fontSize: typography.body.fontSize, fontWeight: '700', color: colors.text },
    eventDates: { fontSize: typography.tiny.fontSize, color: colors.textLight, marginTop: 1 },
    del: { fontSize: 16, color: colors.textMuted, paddingHorizontal: spacing.xs },
    eventAmt: { fontSize: typography.small.fontSize, color: colors.text, marginBottom: spacing.sm },
    eventOf: { color: colors.textLight },
    track: { height: 10, backgroundColor: colors.cardBg, borderRadius: radius.chips, overflow: 'hidden' },
    fill: { height: '100%', borderRadius: radius.chips },
    overText: { fontSize: typography.small.fontSize, color: colors.dangerDeep, fontWeight: '700', marginTop: spacing.sm },
    leftText: { fontSize: typography.small.fontSize, color: colors.textLight, marginTop: spacing.sm },

    closeBtn: { backgroundColor: colors.lavender, paddingVertical: spacing.md, borderRadius: radius.buttons, alignItems: 'center', marginTop: spacing.sm },
    closeText: { color: colors.onAccent, fontSize: typography.body.fontSize, fontWeight: '700' },
  });

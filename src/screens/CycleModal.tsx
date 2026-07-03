// CycleModal.tsx — the dedicated period/cycle space (V2), opened from Settings.
// Everything cycle lives here: log a period, see your current phase + cycle day, next-period
// countdown, predicted ovulation / fertile window, history, and the "cycle vs money" insight.
// Supportive, never clinical. Fully on-device + private.
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, ScrollView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAppContext } from '../hooks/useAppContext';
import { spacing, radius, typography, ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useLang } from '../hooks/useLang';
import { L } from '../i18n';
import { fmtINR, fmtDateLabel, getToday } from '../utils';
import { getCycleInfo, getCycleSpendInsight, getCycleStats, effectiveCycleLength, effectivePeriodLength, nextPeriods, Phase } from '../utils/cycle';
import CycleRing from '../components/CycleRing';
import CycleCalendar from '../components/CycleCalendar';
import DayLogSheet from '../components/DayLogSheet';

// A short label for each phase (shown big on the hero card).
const PHASE_TITLE: Record<Phase, [string, string]> = {
  period: ['Period 🩸', 'Period 🩸'],
  fertile: ['Fertile window 🥚', 'Fertile window 🥚'],
  pms: ['PMS week 💕', 'PMS week 💕'],
  normal: ['Cycle ke beech ✨', 'Mid-cycle ✨'],
  unknown: ['Shuru karein? 🌸', "Let's start? 🌸"],
};
// A gentle, non-judgmental line for the current phase (Hinglish / English).
const PHASE_MSG: Record<Phase, [string, string]> = {
  period: ['rest, chai aur self-care 🌸 budget ki tension abhi mat lo', "rest, chai and self-care 🌸 don't stress about budget right now"],
  fertile: ['energy high ho sakti hai — par impulse buys pe thoda dhyaan 🥚', 'energy may run high — just keep an eye on impulse buys 🥚'],
  pms: ['cravings aur impulse buys high ho sakte hain — khud pe gentle raho 💕', 'cravings and impulse buys may run high — be gentle with yourself 💕'],
  normal: ['sab smooth chal raha hai babe ✨', "everything's smooth babe ✨"],
  unknown: ['neeche apna pehla period log karo — phir phase aur prediction yahan dikhega', 'log your first period below — then your phase and prediction show here'],
};

// Local yyyy-mm-dd for a picked Date.
function isoOf(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export default function CycleModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { expenses, periodStarts, periodEnds, cycleDayLogs, cycleLength, logPeriodStart, removePeriodStart, setCycleLength } = useAppContext();
  const colors = useTheme();
  const styles = makeStyles(colors);
  useLang(); // subscribe so text re-renders when language toggles
  const [showPicker, setShowPicker] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null); // day tapped in the calendar

  const today = getToday();
  // Learn the user's own averages from history; fall back to the manual number.
  const stats = getCycleStats(periodStarts, periodEnds);
  const effLen = effectiveCycleLength(stats, cycleLength);
  const effPeriod = effectivePeriodLength(stats);
  const info = getCycleInfo(periodStarts, effLen, today, effPeriod);
  const cycleSpend = getCycleSpendInsight(expenses, periodStarts, effLen, today);
  const upcoming = nextPeriods(periodStarts, effLen, 3);

  // hero card colour per phase
  const PHASE_BG: Record<Phase, string> = { period: colors.blush, fertile: colors.babyBlue, pms: colors.coral, normal: colors.sage, unknown: colors.periwinkle };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={styles.sheetWrap}>
        <ScrollView style={styles.sheet} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.grabber} />
          <Text style={styles.title}>{L('Cycle 🌸', 'Cycle 🌸')}</Text>
          <Text style={styles.sub}>{L('period log karo, phase + agla period dekho, aur jaano PMS week mein kharcha badhta hai ya nahi. sab tumhare phone pe, private 🤍', 'log your period, see your phase + next period, and learn if PMS week bumps your spending. all on your phone, private 🤍')}</Text>

          {/* cycle ring + current-phase banner */}
          <View style={styles.ringCard}>
            <CycleRing dayOfCycle={info.dayOfCycle} cycleLength={effLen} phase={info.phase} daysToNext={info.daysToNext} periodLen={effPeriod} />

            {/* legend */}
            <View style={styles.legend}>
              <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: colors.rose }]} /><Text style={styles.legendText}>{L('period', 'period')}</Text></View>
              <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: colors.babyBlue }]} /><Text style={styles.legendText}>{L('fertile', 'fertile')}</Text></View>
              <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: colors.coral }]} /><Text style={styles.legendText}>PMS</Text></View>
            </View>

            {/* current-phase line */}
            <View style={[styles.phaseBanner, { backgroundColor: PHASE_BG[info.phase] }]}>
              <Text style={styles.phaseTitle}>{L(PHASE_TITLE[info.phase][0], PHASE_TITLE[info.phase][1])}</Text>
              <Text style={styles.phaseMsg}>{L(PHASE_MSG[info.phase][0], PHASE_MSG[info.phase][1])}</Text>
            </View>
          </View>

          {/* prediction strip: next period / ovulation / fertile window */}
          {info.nextPredicted ? (
            <View style={styles.predRow}>
              <View style={styles.predCell}>
                <Text style={styles.predEmoji}>🩸</Text>
                <Text style={styles.predLabel}>{L('agla period', 'next period')}</Text>
                <Text style={styles.predVal}>{fmtDateLabel(info.nextPredicted)}</Text>
              </View>
              <View style={styles.predCell}>
                <Text style={styles.predEmoji}>🥚</Text>
                <Text style={styles.predLabel}>{L('ovulation', 'ovulation')}</Text>
                <Text style={styles.predVal}>{info.ovulation ? fmtDateLabel(info.ovulation) : '—'}</Text>
              </View>
              <View style={styles.predCell}>
                <Text style={styles.predEmoji}>💕</Text>
                <Text style={styles.predLabel}>{L('fertile', 'fertile')}</Text>
                <Text style={styles.predVal}>{info.fertileStart && info.fertileEnd ? `${fmtDateLabel(info.fertileStart)}–${fmtDateLabel(info.fertileEnd)}` : '—'}</Text>
              </View>
            </View>
          ) : null}

          {/* month calendar — tap any day to log it */}
          <Text style={styles.calHint}>{L('kisi bhi din pe tap karke flow/symptoms/mood log karo 🌸', 'tap any day to log flow / symptoms / mood 🌸')}</Text>
          <CycleCalendar
            periodStarts={periodStarts}
            periodEnds={periodEnds}
            cycleDayLogs={cycleDayLogs}
            effLen={effLen}
            effPeriod={effPeriod}
            todayIso={today}
            onSelectDay={setSelectedDay}
          />

          {/* your cycle stats — learned from history */}
          {stats.avgCycle || stats.avgPeriod ? (
            <View style={styles.statsCard}>
              <Text style={styles.sectionLabel}>{L('TUMHARA CYCLE 📊', 'YOUR CYCLE 📊')}</Text>
              <View style={styles.statRow}>
                <View style={styles.statCell}>
                  <Text style={styles.statVal}>{stats.avgCycle ? L(`${stats.avgCycle} din`, `${stats.avgCycle} days`) : '—'}</Text>
                  <Text style={styles.statLabel}>{L('avg cycle', 'avg cycle')}</Text>
                </View>
                <View style={styles.statCell}>
                  <Text style={styles.statVal}>{stats.avgPeriod ? L(`${stats.avgPeriod} din`, `${stats.avgPeriod} days`) : '—'}</Text>
                  <Text style={styles.statLabel}>{L('avg period', 'avg period')}</Text>
                </View>
                <View style={styles.statCell}>
                  <Text style={styles.statVal}>{stats.regular == null ? '—' : stats.regular ? L('regular ✨', 'regular ✨') : L('thoda irregular', 'irregular')}</Text>
                  <Text style={styles.statLabel}>{L('rhythm', 'rhythm')}</Text>
                </View>
              </View>
              {stats.regular === false && stats.shortest && stats.longest ? (
                <Text style={styles.statsNote}>{L(`tumhare cycle ${stats.shortest}–${stats.longest} din ke beech ghumte hain — prediction thodi aage-peeche ho sakti hai, normal hai 🤍`, `your cycles range ${stats.shortest}–${stats.longest} days — predictions may shift a little, totally normal 🤍`)}</Text>
              ) : null}
              {upcoming.length > 0 ? (
                <Text style={styles.statsNote}>{L('agle periods: ', 'next periods: ')}{upcoming.map((d) => fmtDateLabel(d)).join(' • ')}</Text>
              ) : null}
            </View>
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
          <View style={styles.lenCard}>
            <View style={{ flex: 1, paddingRight: spacing.md }}>
              <Text style={styles.lenLabel}>{L('cycle length', 'cycle length')}</Text>
              <Text style={styles.lenHint}>
                {stats.avgCycle
                  ? L(`app ne tumhare periods se ${stats.avgCycle} din seekha — ye manual backup hai`, `app learned ${stats.avgCycle} days from your periods — this is a manual backup`)
                  : L('do periods ke beech ke din (default 28)', 'days between two periods (default 28)')}
              </Text>
            </View>
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

          {/* logged history */}
          {periodStarts.length > 0 ? (
            <View style={styles.histCard}>
              <Text style={styles.sectionLabel}>{L('LOGGED PERIODS 🩸', 'LOGGED PERIODS 🩸')}</Text>
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

          {/* cycle vs money */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>CYCLE vs MONEY ✦</Text>
            {!cycleSpend.hasData ? (
              <Text style={styles.muted}>{L('thoda period + kharcha log karo — phir yahan dikhega ki PMS week mein zyada spend hota hai ya nahi 🌸', 'log a little period + spending — then see whether PMS week spends more or not 🌸')}</Text>
            ) : (
              <>
                <Text style={styles.headline}>{buildCycleLine(cycleSpend.higherPct, info.phase)}</Text>
                <View style={styles.breakRow}>
                  <View style={styles.breakTop}>
                    <Text style={styles.breakName}>{L('🩸 PMS week (daily avg)', '🩸 PMS week (daily avg)')}</Text>
                    <Text style={styles.breakAmt}>{fmtINR(cycleSpend.pmsDailyAvg)}</Text>
                  </View>
                  <View style={styles.breakTrack}>
                    <View style={[styles.breakFill, { width: `${cyclePct(cycleSpend.pmsDailyAvg, cycleSpend.otherDailyAvg)}%`, backgroundColor: colors.coral }]} />
                  </View>
                </View>
                <View style={styles.breakRow}>
                  <View style={styles.breakTop}>
                    <Text style={styles.breakName}>{L('🌙 baaki din (daily avg)', '🌙 other days (daily avg)')}</Text>
                    <Text style={styles.breakAmt}>{fmtINR(cycleSpend.otherDailyAvg)}</Text>
                  </View>
                  <View style={styles.breakTrack}>
                    <View style={[styles.breakFill, { width: `${cyclePct(cycleSpend.otherDailyAvg, cycleSpend.pmsDailyAvg)}%`, backgroundColor: colors.sage }]} />
                  </View>
                </View>
              </>
            )}
          </View>

          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>{L('done ✦', 'done ✦')}</Text>
          </Pressable>
        </ScrollView>
      </View>

      {/* per-day log sheet, opened from the calendar */}
      {selectedDay ? <DayLogSheet dateIso={selectedDay} onClose={() => setSelectedDay(null)} /> : null}
    </Modal>
  );
}

// Bar width (0–100) for one daily-avg value relative to the larger of the two.
function cyclePct(value: number, other: number): number {
  const max = Math.max(value, other, 1);
  return Math.round((value / max) * 100);
}

// A supportive one-liner about PMS-week spending. `higherPct` = how much higher PMS daily spend is.
function buildCycleLine(higherPct: number | null, phase: Phase): string {
  const phasePrefix = phase === 'pms' ? L('PMS week chal raha hai abhi — ', 'PMS week right now — ') : phase === 'period' ? L('period time — ', 'period time — ') : '';
  if (higherPct == null) return `${phasePrefix}${L('thoda aur data aane do, pattern banta jayega 🌸', 'give it a bit more data, the pattern will build 🌸')}`;
  if (higherPct >= 15) return `${phasePrefix}${L(`PMS week mein daily kharcha ~${higherPct}% zyada hota hai — cravings real hain babe 💕 thoda heads-up rakho`, `daily spending is ~${higherPct}% higher in PMS week — cravings are real babe 💕 stay a little aware`)}`;
  if (higherPct <= -15) return `${phasePrefix}${L('PMS week mein actually kam kharcha — proud of you 💅', 'you actually spend less in PMS week — proud of you 💅')}`;
  return `${phasePrefix}${L('PMS aur baaki dino mein kharcha lagbhag barabar — balanced queen ✨', 'PMS and other days spend about the same — balanced queen ✨')}`;
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#00000055' },
  sheetWrap: { flex: 1, justifyContent: 'flex-end' },
  sheet: { maxHeight: '92%', backgroundColor: colors.cardBg, borderTopLeftRadius: radius.modals, borderTopRightRadius: radius.modals },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 999, backgroundColor: colors.border, marginBottom: spacing.md },
  title: { fontSize: typography.title.fontSize, fontWeight: '700', color: colors.text },
  sub: { fontSize: typography.small.fontSize, color: colors.textLight, marginTop: 2, marginBottom: spacing.lg, lineHeight: 19 },

  // ring card
  ringCard: { backgroundColor: colors.cardBg, borderRadius: radius.cards, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: spacing.md, marginTop: spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  dot: { width: 9, height: 9, borderRadius: 999 },
  legendText: { fontSize: typography.tiny.fontSize, color: colors.textLight },
  phaseBanner: { alignSelf: 'stretch', borderRadius: radius.inputs, padding: spacing.md, marginTop: spacing.md },
  phaseTitle: { fontSize: typography.body.fontSize, fontWeight: '800', color: colors.text },
  phaseMsg: { fontSize: typography.small.fontSize, color: colors.text, fontWeight: '600', lineHeight: 19, marginTop: 2 },

  // prediction strip
  predRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  predCell: { flex: 1, backgroundColor: colors.cream, borderRadius: radius.inputs, paddingVertical: spacing.md, paddingHorizontal: spacing.sm, alignItems: 'center' },
  predEmoji: { fontSize: 18 },
  predLabel: { fontSize: typography.tiny.fontSize, color: colors.textLight, marginTop: spacing.xs },
  predVal: { fontSize: typography.small.fontSize, color: colors.text, fontWeight: '700', marginTop: 2, textAlign: 'center' },

  // calendar + stats
  calHint: { fontSize: typography.tiny.fontSize, color: colors.textLight, textAlign: 'center', marginBottom: spacing.sm },
  statsCard: { backgroundColor: colors.cardBg, borderRadius: radius.cards, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  statRow: { flexDirection: 'row', gap: spacing.sm },
  statCell: { flex: 1, backgroundColor: colors.cream, borderRadius: radius.inputs, paddingVertical: spacing.md, paddingHorizontal: spacing.xs, alignItems: 'center' },
  statVal: { fontSize: typography.body.fontSize, fontWeight: '800', color: colors.text, textAlign: 'center' },
  statLabel: { fontSize: typography.tiny.fontSize, color: colors.textLight, marginTop: 2 },
  statsNote: { fontSize: typography.small.fontSize, color: colors.textLight, lineHeight: 18, marginTop: spacing.md },

  // log buttons
  btnRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  logBtn: { flex: 1, backgroundColor: colors.rose, paddingVertical: spacing.md, borderRadius: radius.buttons, alignItems: 'center' },
  logBtnText: { color: colors.onAccent, fontSize: typography.small.fontSize, fontWeight: '700' },
  dayBtn: { backgroundColor: colors.cream, paddingVertical: spacing.md, paddingHorizontal: spacing.md, borderRadius: radius.buttons, alignItems: 'center', justifyContent: 'center' },
  dayBtnText: { color: colors.textLight, fontSize: typography.small.fontSize, fontWeight: '600' },

  // cycle length
  lenCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.cream, borderRadius: radius.inputs, padding: spacing.md, marginBottom: spacing.md },
  lenLabel: { fontSize: typography.body.fontSize, color: colors.text, fontWeight: '600' },
  lenHint: { fontSize: typography.tiny.fontSize, color: colors.textLight, marginTop: 2 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stepBtn: { width: 32, height: 32, borderRadius: 999, backgroundColor: colors.lavender, alignItems: 'center', justifyContent: 'center' },
  stepText: { color: colors.onAccent, fontSize: 18, fontWeight: '800' },
  lenVal: { fontSize: typography.body.fontSize, fontWeight: '700', color: colors.text, minWidth: 56, textAlign: 'center' },

  // history
  histCard: { backgroundColor: colors.cardBg, borderRadius: radius.cards, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  listItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.cream, borderRadius: radius.inputs, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, marginTop: spacing.xs },
  listText: { fontSize: typography.small.fontSize, color: colors.text },
  listDel: { fontSize: 14, color: colors.textMuted },

  // cycle vs money
  card: { backgroundColor: colors.cardBg, borderRadius: radius.cards, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  sectionLabel: { fontSize: typography.tiny.fontSize, color: colors.textMuted, letterSpacing: 2, marginBottom: spacing.md },
  muted: { fontSize: typography.small.fontSize, color: colors.textLight, lineHeight: 18 },
  headline: { fontSize: typography.small.fontSize, color: colors.text, fontStyle: 'italic', lineHeight: 20, marginBottom: spacing.md },
  breakRow: { marginBottom: spacing.md },
  breakTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  breakName: { fontSize: typography.small.fontSize, color: colors.text },
  breakAmt: { fontSize: typography.small.fontSize, color: colors.text, fontWeight: '700' },
  breakTrack: { height: 7, backgroundColor: colors.cream, borderRadius: radius.chips, overflow: 'hidden' },
  breakFill: { height: '100%', borderRadius: radius.chips },

  closeBtn: { backgroundColor: colors.lavender, paddingVertical: spacing.md, borderRadius: radius.buttons, alignItems: 'center', marginTop: spacing.sm },
  closeText: { color: colors.onAccent, fontSize: typography.body.fontSize, fontWeight: '700' },
});

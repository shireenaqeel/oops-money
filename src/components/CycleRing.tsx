// CycleRing.tsx — a Flo-style circular cycle ring drawn with react-native-svg.
// Each day of the cycle is one little arc, coloured by its phase (period / fertile / PMS / normal).
// "Today" gets a marker dot, and the centre shows a big countdown to the next period.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { spacing, typography, ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useLang } from '../hooks/useLang';
import { L } from '../i18n';
import { Phase, phaseForCycleDay } from '../utils/cycle';

// Point on a circle, with 0° at the top and angles going clockwise.
function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const a = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

export default function CycleRing({
  dayOfCycle,
  cycleLength,
  phase,
  daysToNext,
  size = 230,
}: {
  dayOfCycle: number | null;
  cycleLength: number;
  phase: Phase;
  daysToNext: number | null;
  size?: number;
}) {
  const colors = useTheme();
  const styles = makeStyles(colors);
  useLang(); // re-render on language toggle

  const len = cycleLength > 0 ? cycleLength : 28;
  const thickness = 16;
  const cx = size / 2;
  const cy = size / 2;
  const R = (size - thickness) / 2 - 4; // ring centre-line radius
  const seg = 360 / len; // degrees per cycle day
  const gap = Math.min(seg * 0.18, 2.2); // small breathing gap between day arcs

  // Ring colour for each phase.
  const phaseColor: Record<Phase, string> = {
    period: colors.rose,
    fertile: colors.babyBlue,
    pms: colors.coral,
    normal: colors.periwinkle,
    unknown: colors.border,
  };

  // Today's position on the ring (1-based). null/out-of-range → no marker.
  const todayDay = dayOfCycle && dayOfCycle >= 1 && dayOfCycle <= len ? dayOfCycle : null;
  const [mx, my] = todayDay ? polar(cx, cy, R, (todayDay - 0.5) * seg) : [0, 0];

  // Build one arc Path per day.
  const arcs = [];
  for (let i = 0; i < len; i++) {
    const startDeg = i * seg + gap / 2;
    const endDeg = (i + 1) * seg - gap / 2;
    const [x1, y1] = polar(cx, cy, R, startDeg);
    const [x2, y2] = polar(cx, cy, R, endDeg);
    const large = endDeg - startDeg > 180 ? 1 : 0;
    const dayPhase: Phase = phase === 'unknown' ? 'unknown' : phaseForCycleDay(i + 1, len);
    arcs.push(
      <Path
        key={i}
        d={`M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2}`}
        stroke={phaseColor[dayPhase]}
        strokeWidth={thickness}
        strokeLinecap="round"
        fill="none"
      />
    );
  }

  // Centre text: big countdown + a label, or a prompt if nothing logged yet.
  const big = phase === 'unknown' ? '🌸' : daysToNext == null ? '—' : daysToNext < 0 ? `${-daysToNext}` : daysToNext === 0 ? L('aaj', 'today') : `${daysToNext}`;
  const label =
    phase === 'unknown'
      ? L('pehla period\nlog karo', 'log your\nfirst period')
      : daysToNext != null && daysToNext < 0
      ? L('din late 🩸', 'days late 🩸')
      : daysToNext === 0
      ? L('period aaj 🩸', 'period today 🩸')
      : L('din mein period 🩸', 'days to period 🩸');

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {arcs}
        {todayDay ? (
          <>
            <Circle cx={mx} cy={my} r={thickness / 2 + 3} fill={colors.cardBg} />
            <Circle cx={mx} cy={my} r={thickness / 2 - 1} fill={phaseColor[phase]} stroke={colors.cardBg} strokeWidth={2} />
          </>
        ) : null}
      </Svg>
      <View style={styles.center} pointerEvents="none">
        <Text style={styles.big}>{big}</Text>
        <Text style={styles.label}>{label}</Text>
        {todayDay ? <Text style={styles.dayChip}>{L(`cycle day ${todayDay}`, `cycle day ${todayDay}`)}</Text> : null}
      </View>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrap: { alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
    center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
    big: { fontSize: 46, fontWeight: '800', color: colors.text, lineHeight: 50 },
    label: { fontSize: typography.small.fontSize, color: colors.textLight, textAlign: 'center', marginTop: 2 },
    dayChip: { fontSize: typography.tiny.fontSize, color: colors.textMuted, letterSpacing: 1, marginTop: spacing.sm },
  });

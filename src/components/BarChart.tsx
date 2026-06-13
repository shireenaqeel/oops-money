// BarChart.tsx — a small reusable bar chart drawn with react-native-svg. Labels render as text below the bars.
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { spacing, typography, ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

export interface BarDatum {
  label: string;
  value: number;
}

export default function BarChart({ data, color, height = 80 }: { data: BarDatum[]; color: string; height?: number }) {
  const [width, setWidth] = useState(0); // measured once the row lays out
  const colors = useTheme();
  const styles = makeStyles(colors);
  const max = Math.max(...data.map((d) => d.value), 1);
  const n = data.length;
  const gap = 6;
  const barW = width > 0 ? (width - gap * (n - 1)) / n : 0;

  return (
    <View>
      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 ? (
          <Svg width={width} height={height}>
            {data.map((d, i) => {
              const barH = Math.max((d.value / max) * height, d.value > 0 ? 4 : 2);
              const x = i * (barW + gap);
              const y = height - barH;
              return <Rect key={i} x={x} y={y} width={barW} height={barH} rx={4} fill={d.value > 0 ? color : colors.cream} />;
            })}
          </Svg>
        ) : null}
      </View>
      <View style={styles.labels}>
        {data.map((d, i) => (
          <Text key={i} style={styles.label} numberOfLines={1}>
            {d.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  labels: { flexDirection: 'row', marginTop: spacing.xs },
  label: { flex: 1, textAlign: 'center', fontSize: typography.tiny.fontSize, color: colors.textMuted },
});

// BestieBenchmark.tsx — Anonymous Bestie Benchmark card for Insights (V3).
// Compares YOUR category-group spending mix to the anonymous average of all Oops Money users.
// Needs Supabase + sign-in. Privacy: only group-percentages are shared, and only aggregates come back.
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useAppContext } from '../hooks/useAppContext';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { spacing, radius, typography, ThemeColors } from '../constants/theme';
import { getGroupPercents, buildBenchmarkLines, BenchmarkLine } from '../utils/benchmark';
import { pushBenchmark, fetchBenchmarkAverages } from '../lib/benchmark';

export default function BestieBenchmark() {
  const { expenses, customCats } = useAppContext();
  const { configured, session } = useAuth();
  const colors = useTheme();
  const styles = makeStyles(colors);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sample, setSample] = useState(0);
  const [lines, setLines] = useState<BenchmarkLine[]>([]);

  // When signed in, share our anonymous breakdown then pull the community averages.
  useEffect(() => {
    if (!configured || !session) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const mine = getGroupPercents(expenses, customCats);
        if (Object.keys(mine).length > 0) await pushBenchmark(session.user.id, mine);
        const res = await fetchBenchmarkAverages();
        if (cancelled) return;
        setSample(res.sample);
        setLines(buildBenchmarkLines(mine, res.averages));
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'kuch gadbad');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // re-run if the user signs in or their spend mix meaningfully changes
  }, [configured, session, expenses.length]);

  // Hide entirely until cloud sync is set up.
  if (!configured) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.label}>BESTIE BENCHMARK 📊</Text>

      {!session ? (
        <Text style={styles.muted}>Settings 🎀 mein sign in karo — phir dekho ki tu baaki besties se zyada/kam kahan kharchti hai (sab anonymous 🤫)</Text>
      ) : loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.rose} />
          <Text style={styles.muted}>besties se compare kar rahe hain...</Text>
        </View>
      ) : error ? (
        <Text style={styles.muted}>benchmark abhi ready nahi 🙈 (cloud pe SQL setup karna baaki ho sakta hai)</Text>
      ) : lines.length === 0 ? (
        <Text style={styles.muted}>thoda aur kharcha log karo — phir comparison dikhega 🌸</Text>
      ) : (
        <>
          <Text style={styles.headline}>{sample > 1 ? `${sample} besties se compare kiya 👯‍♀️` : 'tu pehli bestie hai! jaise jaise log aayenge, comparison better hoga 💕'}</Text>
          {lines.slice(0, 4).map((l) => (
            <View key={l.group} style={styles.row}>
              <Text style={styles.rowText}>{l.text}</Text>
              <Text style={styles.rowNums}>
                tu {l.mine}% · avg {l.avg}%
              </Text>
            </View>
          ))}
          <Text style={styles.footnote}>sab anonymous hai — sirf category-percentage compare hota hai, koi amount ya naam nahi 🤫</Text>
        </>
      )}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.cardBg,
      borderRadius: radius.cards,
      padding: spacing.lg,
      marginTop: spacing.md,
      shadowColor: colors.cardShadow,
      shadowOpacity: 1,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 2 },
      elevation: 1,
    },
    label: { fontSize: typography.tiny.fontSize, color: colors.textMuted, letterSpacing: 2, marginBottom: spacing.md },
    muted: { fontSize: typography.small.fontSize, color: colors.textLight, lineHeight: 19 },
    loadingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    headline: { fontSize: typography.small.fontSize, color: colors.text, fontStyle: 'italic', marginBottom: spacing.md },
    row: { marginBottom: spacing.sm },
    rowText: { fontSize: typography.small.fontSize, color: colors.text, lineHeight: 19 },
    rowNums: { fontSize: typography.tiny.fontSize, color: colors.textLight, marginTop: 1 },
    footnote: { fontSize: typography.tiny.fontSize, color: colors.textMuted, marginTop: spacing.sm, lineHeight: 16 },
  });

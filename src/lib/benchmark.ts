// benchmark.ts (lib) — the network side of the Anonymous Bestie Benchmark (V3).
// Each signed-in user keeps ONE row of anonymous group-percentages in `benchmark_stats`.
// Individual rows are NOT readable by anyone (no SELECT policy); the community averages come
// from a SECURITY DEFINER function `benchmark_averages()` that only ever returns aggregates.
import { supabase } from './supabase';

export interface BenchmarkAverages {
  sample: number; // how many users are in the pool
  averages: Record<string, number>; // average % per group across everyone
}

// Upsert this user's anonymous group-percentages (creates the row first time, overwrites after).
// We never request the row back (no .select()), so no read policy is needed.
export async function pushBenchmark(userId: string, groups: Record<string, number>): Promise<void> {
  const { error } = await supabase
    .from('benchmark_stats')
    .upsert({ user_id: userId, groups, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  if (error) throw error;
}

// Fetch the community averages (aggregated server-side; no individual data is exposed).
export async function fetchBenchmarkAverages(): Promise<BenchmarkAverages> {
  const { data, error } = await supabase.rpc('benchmark_averages');
  if (error) throw error;
  const d = (data ?? {}) as { sample?: number; averages?: Record<string, number> };
  return { sample: Number(d.sample) || 0, averages: d.averages ?? {} };
}

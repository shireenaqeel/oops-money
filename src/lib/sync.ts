// sync.ts — the actual cloud upload/download for the optional backup feature.
// Model (deliberately simple): one row per user in the `app_state` table holding the
// WHOLE app state as a single JSON blob. Push = upsert that blob. Pull = read it back.
// Local AsyncStorage stays the source of truth; this just mirrors it to the cloud.
import { supabase } from './supabase';
import { exportSnapshot, importSnapshot, Snapshot } from '../storage';

const TABLE = 'app_state';

// Upload the device's entire data as one snapshot (creates the row first time, overwrites after).
export async function pushSnapshot(userId: string): Promise<void> {
  const data = await exportSnapshot();
  const { error } = await supabase
    .from(TABLE)
    .upsert({ user_id: userId, data, updated_at: new Date().toISOString() });
  if (error) throw error;
}

// Download this user's snapshot. Returns null if they've never backed up before.
export async function pullSnapshot(userId: string): Promise<Snapshot | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('data')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return data.data as Snapshot;
}

// Download the cloud snapshot and write it into local storage. Returns true if data was
// restored, false if the cloud was empty (nothing to restore).
export async function restoreFromCloud(userId: string): Promise<boolean> {
  const snap = await pullSnapshot(userId);
  if (!snap) return false;
  await importSnapshot(snap);
  return true;
}

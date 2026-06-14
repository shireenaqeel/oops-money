// useAuth.tsx — the optional cloud sign-in + backup brain (V2 cloud sync).
// Sign-in is OPTIONAL: the app is fully usable signed-out. This just adds a "back up to the
// cloud / restore on a new phone" layer on top of the local-first AsyncStorage data.
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import type { Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { pushSnapshot, pullSnapshot, restoreFromCloud } from '../lib/sync';
import { useAppContext } from './useAppContext';

// Lets the browser hand control back to the app after the Google login finishes.
WebBrowser.maybeCompleteAuthSession();

interface AuthState {
  configured: boolean; // false until real Supabase keys exist (hides the UI gracefully)
  session: Session | null; // null = signed out
  email: string | null; // signed-in user's email, for the UI
  busy: boolean; // true while signing in / syncing (disables buttons)
  status: string; // short Hinglish message shown under the buttons
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  backupNow: () => Promise<void>; // upload local data to the cloud
  restoreNow: () => Promise<void>; // download cloud data onto this phone
}

const AuthContext = createContext<AuthState | null>(null);

// Pull "#access_token=...&refresh_token=..." values out of the redirect URL (implicit flow).
function getFragmentParams(url: string): Record<string, string> {
  const hash = url.includes('#') ? url.split('#')[1] : '';
  const out: Record<string, string> = {};
  for (const pair of hash.split('&')) {
    const [k, v] = pair.split('=');
    if (k) out[decodeURIComponent(k)] = decodeURIComponent(v || '');
  }
  return out;
}

// Wraps the app (inside <AppProvider>, since restoring data calls reload()).
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { reload } = useAppContext();
  const [session, setSession] = useState<Session | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  // Restore any saved session on launch + keep state in sync with sign-in/out events.
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  // Open Google login in the browser, set the session, and do a safe first backup.
  const signInWithGoogle = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setStatus('cloud sync abhi setup nahi hua 🙈');
      return;
    }
    setBusy(true);
    setStatus('Google khul raha hai...');
    try {
      const redirectTo = makeRedirectUri({ scheme: 'oopsmoney', path: 'auth-callback' });
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error) throw error;
      if (!data?.url) throw new Error('No sign-in URL');

      const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (res.type !== 'success') {
        setStatus('sign-in cancel ho gaya');
        return;
      }
      const params = getFragmentParams(res.url);
      if (!params.access_token || !params.refresh_token) throw new Error('No tokens returned');

      const { data: sd, error: se } = await supabase.auth.setSession({
        access_token: params.access_token,
        refresh_token: params.refresh_token,
      });
      if (se) throw se;
      const userId = sd.session?.user.id;
      if (!userId) throw new Error('No user');

      // Safe first sync: if the cloud is empty, back up local data; if it already has a
      // backup, leave it alone (the user can choose Restore) so nothing gets clobbered.
      const existing = await pullSnapshot(userId);
      if (!existing) {
        await pushSnapshot(userId);
        setStatus('signed in — pehla backup ho gaya ☁️✓');
      } else {
        setStatus('signed in! cloud pe purana backup hai — restore ya backup choose karo');
      }
    } catch (e) {
      setStatus(`sign-in fail 😭 (${e instanceof Error ? e.message : 'error'})`);
    } finally {
      setBusy(false);
    }
  }, []);

  // Sign out (local data stays untouched on the phone).
  const signOut = useCallback(async () => {
    setBusy(true);
    try {
      await supabase.auth.signOut();
      setStatus('signed out — data abhi bhi phone pe safe hai 💾');
    } finally {
      setBusy(false);
    }
  }, []);

  // Upload current local data to the cloud (overwrites the cloud copy).
  const backupNow = useCallback(async () => {
    if (!session) return;
    setBusy(true);
    setStatus('backup ho raha hai...');
    try {
      await pushSnapshot(session.user.id);
      setStatus(`backup done ☁️✓ (${new Date().toLocaleTimeString()})`);
    } catch (e) {
      setStatus(`backup fail 😭 (${e instanceof Error ? e.message : 'error'})`);
    } finally {
      setBusy(false);
    }
  }, [session]);

  // Download cloud data onto this phone (overwrites local) and refresh the UI.
  const restoreNow = useCallback(async () => {
    if (!session) return;
    setBusy(true);
    setStatus('restore ho raha hai...');
    try {
      const restored = await restoreFromCloud(session.user.id);
      if (restored) {
        await reload();
        setStatus('restore done ⬇️✓ — tumhara data wapas aa gaya');
      } else {
        setStatus('cloud pe abhi koi backup nahi hai');
      }
    } catch (e) {
      setStatus(`restore fail 😭 (${e instanceof Error ? e.message : 'error'})`);
    } finally {
      setBusy(false);
    }
  }, [session, reload]);

  const value: AuthState = {
    configured: isSupabaseConfigured,
    session,
    email: session?.user.email ?? null,
    busy,
    status,
    signInWithGoogle,
    signOut,
    backupNow,
    restoreNow,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Read auth state anywhere. Throws if used outside <AuthProvider>.
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

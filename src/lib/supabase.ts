// supabase.ts — the single Supabase client for the app (V2 cloud sync).
// Uses AsyncStorage to persist the auth session so you stay logged in across launches.
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabaseConfig';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // we handle the OAuth redirect manually in React Native
    flowType: 'implicit', // tokens come back in the redirect URL — simplest reliable flow on mobile
  },
});

// True once real Supabase values are pasted into supabaseConfig.ts — lets the UI hide
// the sync option until setup is done, so the app never crashes on placeholder values.
export const isSupabaseConfigured = SUPABASE_URL.startsWith('https://') && !SUPABASE_URL.includes('YOUR-PROJECT') && SUPABASE_ANON_KEY.length > 20 && !SUPABASE_ANON_KEY.includes('YOUR-ANON');

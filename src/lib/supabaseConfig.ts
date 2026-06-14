// supabaseConfig.ts — PASTE YOUR SUPABASE PROJECT VALUES HERE.
// Find them in your Supabase dashboard → Project Settings → API.
// The anon / public key is SAFE to keep in the app as long as Row-Level Security (RLS) is ON
// (our setup turns RLS on, so each user can only ever read/write their own rows).

export const SUPABASE_URL = 'https://fnhgeqvixhzxegnyhgvp.supabase.co'; // Shireen's Oops Money project
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuaGdlcXZpeGh6eGVnbnloZ3ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0NDk4OTQsImV4cCI6MjA5NzAyNTg5NH0.KDRsBYCcif1yHBlsPwJ-1ZnLaoLNCRO4VyyVH9C4dNg'; // anon/public key — client-safe with RLS on

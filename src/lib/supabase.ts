import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Dynamically route local Supabase traffic automatically when accessed from a mobile device
if (
  import.meta.env.DEV &&
  supabaseUrl?.includes('127.0.0.1') &&
  typeof window !== 'undefined' &&
  window.location.hostname !== 'localhost' &&
  window.location.hostname !== '127.0.0.1'
) {
  // Replace the 127.0.0.1 component with the actual LAN IP of the hosting machine
  supabaseUrl = supabaseUrl.replace('127.0.0.1', window.location.hostname);
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase URL or Anon Key is missing. Check your .env file or environment variables.'
  );
}

// Guard: only instantiate the real client when valid credentials exist.
// In test environments without env vars, a null client is exported instead.
// This prevents `supabaseUrl is required` from crashing test suites at import time.
export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

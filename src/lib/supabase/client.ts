import {createClient, type SupabaseClient} from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

let client: SupabaseClient | null = null;

// Deferred so an empty-env static build (env is injected at deploy) does not
// throw at import time. The error only fires when a call actually needs it.
export function getSupabase(): SupabaseClient {
  if (client) return client;
  if (!url || !anonKey) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }
  client = createClient(url, anonKey, {
    auth: {persistSession: true, autoRefreshToken: true, detectSessionInUrl: false},
  });
  return client;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey);
}

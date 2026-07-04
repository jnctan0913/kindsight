import {getSupabase} from './client';

let inflight: Promise<string> | null = null;

// Idempotent anonymous bootstrap. Signs in only when no session exists,
// persists via the client's default localStorage, returns the anon uid.
// Concurrent callers share one sign-in via the inflight promise.
export async function ensureSession(): Promise<string> {
  if (inflight) return inflight;
  inflight = (async () => {
    const supabase = getSupabase();
    const {data: sessionData} = await supabase.auth.getSession();
    const existing = sessionData.session?.user?.id;
    if (existing) return existing;

    const {data, error} = await supabase.auth.signInAnonymously();
    if (error) throw normalizeAuthError(error);
    const uid = data.user?.id;
    if (!uid) throw new Error('Anonymous sign-in returned no user');
    return uid;
  })();
  try {
    return await inflight;
  } catch (e) {
    inflight = null;
    throw e;
  }
}

export async function getUid(): Promise<string | null> {
  const supabase = getSupabase();
  const {data} = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}

function normalizeAuthError(error: {message: string}): Error {
  return new Error(error.message || 'Authentication failed');
}

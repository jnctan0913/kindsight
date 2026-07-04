import type {Session, User} from '@supabase/supabase-js';

import {getSupabase, isSupabaseConfigured} from './client';

const MOCK_HOST_KEY = 'kindsight.hostSession';

export type HostSession = {
  userId: string;
  email: string;
};

export const HOST_PASSWORD_MIN_LENGTH = 6;

function readMockSession(): HostSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(MOCK_HOST_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as HostSession;
  } catch {
    return null;
  }
}

function writeMockSession(session: HostSession | null) {
  if (typeof window === 'undefined') return;
  try {
    if (session) window.localStorage.setItem(MOCK_HOST_KEY, JSON.stringify(session));
    else window.localStorage.removeItem(MOCK_HOST_KEY);
  } catch {
    /* private mode */
  }
}

function sessionFromUser(user: User): HostSession {
  return {
    userId: user.id,
    email: user.email ?? '',
  };
}

export async function getHostSession(): Promise<HostSession | null> {
  if (!isSupabaseConfigured()) return readMockSession();

  const supabase = getSupabase();
  const {data} = await supabase.auth.getSession();
  const user = data.session?.user;
  if (!user?.email) return null;
  return sessionFromUser(user);
}

function normalizeEmail(email: string): string {
  const normalized = email.trim().toLowerCase();
  if (!normalized) throw new Error('Email is required');
  return normalized;
}

function validatePassword(password: string): void {
  if (password.length < HOST_PASSWORD_MIN_LENGTH) {
    throw new Error(`Password must be at least ${HOST_PASSWORD_MIN_LENGTH} characters`);
  }
}

export async function signInHostWithPassword(
  email: string,
  password: string,
): Promise<HostSession> {
  const normalized = normalizeEmail(email);
  validatePassword(password);

  if (!isSupabaseConfigured()) {
    const session = {userId: `mock-${normalized}`, email: normalized};
    writeMockSession(session);
    return session;
  }

  const supabase = getSupabase();
  const {data, error} = await supabase.auth.signInWithPassword({
    email: normalized,
    password,
  });
  if (error) throw new Error(error.message);
  const user = data.user ?? data.session?.user;
  if (!user?.email) throw new Error('Sign-in failed');
  return sessionFromUser(user);
}

export async function signUpHostWithPassword(
  email: string,
  password: string,
): Promise<HostSession> {
  const normalized = normalizeEmail(email);
  validatePassword(password);

  if (!isSupabaseConfigured()) {
    const session = {userId: `mock-${normalized}`, email: normalized};
    writeMockSession(session);
    return session;
  }

  const supabase = getSupabase();
  const {data, error} = await supabase.auth.signUp({
    email: normalized,
    password,
  });
  if (error) throw new Error(error.message);
  const user = data.session?.user;
  if (!user?.email) {
    throw new Error(
      'Account created, but email confirmations are still enabled in Supabase. Disable confirmations for password-only host sign-up.',
    );
  }
  return sessionFromUser(user);
}

export async function signOutHost(): Promise<void> {
  if (!isSupabaseConfigured()) {
    writeMockSession(null);
    return;
  }
  const supabase = getSupabase();
  await supabase.auth.signOut();
}

export function onHostAuthChange(
  callback: (session: HostSession | null) => void,
): () => void {
  if (!isSupabaseConfigured()) {
    callback(readMockSession());
    return () => {};
  }

  const supabase = getSupabase();
  const {data: sub} = supabase.auth.onAuthStateChange((_event, session: Session | null) => {
    const user = session?.user;
    if (user?.email) callback(sessionFromUser(user));
    else callback(null);
  });
  return () => sub.subscription.unsubscribe();
}

export function isHostAuthMockMode(): boolean {
  return !isSupabaseConfigured();
}

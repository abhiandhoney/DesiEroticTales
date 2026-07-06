import { supabase } from './supabase';
import { getAuthRedirectUrl } from './site';

export const AUTH_RETURN_KEY = 'desierotictales_auth_return';
export const AUTH_CALLBACK_PATH = '/auth/callback';
const PKCE_HANDLED_KEY = 'desierotictales_pkce_handled';

export function isAuthCallbackRoute(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.pathname === AUTH_CALLBACK_PATH;
}

export function storeAuthReturnPath(path?: string): void {
  if (typeof window === 'undefined') return;
  const next =
    path ??
    `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (next.startsWith(AUTH_CALLBACK_PATH)) return;
  sessionStorage.setItem(AUTH_RETURN_KEY, next);
}

export function consumeAuthReturnPath(): string {
  if (typeof window === 'undefined') return '/';
  const stored = sessionStorage.getItem(AUTH_RETURN_KEY);
  sessionStorage.removeItem(AUTH_RETURN_KEY);
  if (stored && stored.startsWith('/') && !stored.startsWith('//')) return stored;
  return '/';
}

export function getOAuthCallbackUrl(): string {
  return getAuthRedirectUrl(AUTH_CALLBACK_PATH);
}

export function parseAuthErrorFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const query = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  return (
    query.get('error_description') ??
    query.get('error') ??
    hash.get('error_description') ??
    hash.get('error')
  );
}

export function clearAuthParamsFromUrl(): void {
  if (typeof window === 'undefined') return;
  window.history.replaceState({}, document.title, AUTH_CALLBACK_PATH);
}

/** Run once on /auth/callback before the app mounts — avoids PKCE verifier races. */
export async function completeOAuthCallback(): Promise<{ error?: string }> {
  if (!isAuthCallbackRoute()) return {};

  const urlError = parseAuthErrorFromUrl();
  if (urlError) return { error: urlError };

  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  if (!code) {
    const { data: { session } } = await supabase.auth.getSession();
    return session ? {} : { error: 'Sign-in could not be completed. Please try again.' };
  }

  const { data: { session: existing } } = await supabase.auth.getSession();
  if (existing) {
    clearAuthParamsFromUrl();
    return {};
  }

  if (sessionStorage.getItem(PKCE_HANDLED_KEY) === code) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      clearAuthParamsFromUrl();
      return {};
    }
  }

  sessionStorage.setItem(PKCE_HANDLED_KEY, code);

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      clearAuthParamsFromUrl();
      return {};
    }
    sessionStorage.removeItem(PKCE_HANDLED_KEY);
    return { error: error.message };
  }

  clearAuthParamsFromUrl();
  return {};
}
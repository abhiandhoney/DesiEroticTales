import { getAuthRedirectUrl } from './site';

export const AUTH_RETURN_KEY = 'desierotictales_auth_return';
export const AUTH_CALLBACK_PATH = '/auth/callback';

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
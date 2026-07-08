export const COOKIE_CONSENT_KEY = 'det_cookie_consent';

export type CookieConsentChoice = 'accepted' | 'essential';

export function getCookieConsent(): CookieConsentChoice | null {
  if (typeof window === 'undefined') return null;
  const value = localStorage.getItem(COOKIE_CONSENT_KEY);
  return value === 'accepted' || value === 'essential' ? value : null;
}

export function hasAnalyticsConsent(): boolean {
  return getCookieConsent() === 'accepted';
}
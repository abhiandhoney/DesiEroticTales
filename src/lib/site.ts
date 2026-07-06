/** Current site origin — works on localhost, workers.dev, or any custom domain. */
export function getSiteOrigin(): string {
  if (typeof window === 'undefined') return '';
  return window.location.origin;
}

/** Hostname for display (no protocol/port on standard 80/443). */
export function getSiteHostname(): string {
  if (typeof window === 'undefined') return 'DesiEroticTales';
  return window.location.hostname || 'DesiEroticTales';
}

/** OAuth return URL — always the current deployment origin. */
export function getAuthRedirectUrl(path = '/'): string {
  const origin = getSiteOrigin();
  if (!origin) return path;
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
}
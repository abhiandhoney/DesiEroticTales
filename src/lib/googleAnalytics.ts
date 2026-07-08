import { hasAnalyticsConsent } from './cookieConsent';

export const GA_MEASUREMENT_ID = 'G-8WRXRT37LZ';

let initStarted = false;

function gtagScriptPresent(): boolean {
  return Boolean(document.querySelector('script[src*="googletagmanager.com/gtag/js"]'));
}

/** Load gtag once after the visitor accepts analytics cookies. */
export function loadGoogleAnalytics(): void {
  if (initStarted || typeof window === 'undefined' || !hasAnalyticsConsent()) return;
  initStarted = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // gtag.js expects the raw arguments object, not a rest array.
    window.dataLayer.push(arguments);
  };

  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, { send_page_view: false });

  if (gtagScriptPresent()) return;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);
}

export function trackPageView(pagePath: string): void {
  if (!hasAnalyticsConsent() || typeof window.gtag !== 'function') return;
  window.gtag('event', 'page_view', { page_path: pagePath });
}
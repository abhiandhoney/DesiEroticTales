import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { COOKIE_CONSENT_KEY } from '../lib/cookieConsent';
import { loadGoogleAnalytics, trackPageView } from '../lib/googleAnalytics';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(COOKIE_CONSENT_KEY)) {
      setVisible(true);
    }
  }, []);

  function accept() {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    loadGoogleAnalytics();
    trackPageView(`${window.location.pathname}${window.location.search}${window.location.hash}`);
    setVisible(false);
  }

  function decline() {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'essential');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="cookie-consent" role="dialog" aria-labelledby="cookie-consent-title">
      <div className="cookie-consent-inner">
        <p id="cookie-consent-title" className="cookie-consent-title">Cookies &amp; privacy</p>
        <p className="cookie-consent-text">
          We use cookies to keep you signed in, remember your preferences, and improve the site.
          You can accept all cookies or continue with essential cookies only. See our{' '}
          <Link to="/cookie-policy">Cookie Policy</Link> and{' '}
          <Link to="/privacy-policy">Privacy Policy</Link>.
        </p>
        <div className="cookie-consent-actions">
          <button type="button" className="btn btn-primary btn-sm" onClick={accept}>
            Accept
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={decline}>
            Essential only
          </button>
        </div>
      </div>
    </div>
  );
}
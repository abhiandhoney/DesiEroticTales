import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const CONSENT_KEY = 'det_cookie_consent';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(CONSENT_KEY)) {
      setVisible(true);
    }
  }, []);

  function accept() {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    setVisible(false);
  }

  function decline() {
    localStorage.setItem(CONSENT_KEY, 'essential');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="cookie-consent" role="dialog" aria-labelledby="cookie-consent-title">
      <div className="cookie-consent-inner">
        <p id="cookie-consent-title" className="cookie-consent-title">Cookies &amp; privacy</p>
        <p className="cookie-consent-text">
          We use essential cookies for sign-in and age verification. Optional analytics and ads may
          use additional cookies. See our{' '}
          <Link to="/cookie-policy">cookie policy</Link> and{' '}
          <Link to="/privacy-policy">privacy policy</Link>.
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
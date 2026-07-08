import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { loadGoogleAnalytics, trackPageView } from '../lib/googleAnalytics';

/** Consent-gated GA4 loader with SPA page_view tracking (single init). */
export default function GoogleAnalytics() {
  const location = useLocation();

  useEffect(() => {
    loadGoogleAnalytics();
  }, []);

  useEffect(() => {
    trackPageView(`${location.pathname}${location.search}${location.hash}`);
  }, [location]);

  return null;
}
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  clearAuthParamsFromUrl,
  consumeAuthReturnPath,
  parseAuthErrorFromUrl,
} from '../lib/auth';
import { supabase } from '../lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function finishAuth() {
      const urlError = parseAuthErrorFromUrl();
      if (urlError) {
        if (!cancelled) setError(urlError);
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          if (!cancelled) setError(exchangeError.message);
          return;
        }
        clearAuthParamsFromUrl();
      } else {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          if (!cancelled) setError(sessionError.message);
          return;
        }
        if (!session) {
          if (!cancelled) setError('Sign-in could not be completed. Please try again.');
          return;
        }
      }

      if (!cancelled) {
        navigate(consumeAuthReturnPath(), { replace: true });
      }
    }

    finishAuth();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (error) {
    return (
      <div className="page error-page">
        <h2>Sign-in failed</h2>
        <p className="page-subtitle">{error}</p>
        <Link to="/" className="btn btn-primary">
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="page-loading">
      <div className="spinner" />
      <p>Completing sign-in...</p>
    </div>
  );
}
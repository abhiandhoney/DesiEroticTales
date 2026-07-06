import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { consumeAuthReturnPath } from '../lib/auth';
import { supabase } from '../lib/supabase';

const AUTH_ERROR_KEY = 'desierotictales_auth_error';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState(() => sessionStorage.getItem(AUTH_ERROR_KEY) ?? '');

  useEffect(() => {
    if (error) {
      sessionStorage.removeItem(AUTH_ERROR_KEY);
      return;
    }

    let cancelled = false;
    const timeout = window.setTimeout(() => {
      if (!cancelled) setError('Sign-in timed out. Please try again.');
    }, 15000);

    supabase.auth.getSession().then(({ data: { session }, error: sessionError }) => {
      if (cancelled) return;
      window.clearTimeout(timeout);

      if (sessionError) {
        setError(sessionError.message);
        return;
      }
      if (!session) {
        setError('Sign-in could not be completed. Please try again.');
        return;
      }
      navigate(consumeAuthReturnPath(), { replace: true });
    }).catch(() => {
      if (!cancelled) {
        window.clearTimeout(timeout);
        setError('Something went wrong during sign-in. Please try again.');
      }
    });

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [navigate, error]);

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
    <div className="page-loading" aria-busy="true">
      <div className="spinner" />
      <p>Completing sign-in...</p>
    </div>
  );
}
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { completeOAuthCallback, consumeAuthReturnPath } from '../lib/auth';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    completeOAuthCallback().then(({ error: authError }) => {
      if (cancelled) return;
      if (authError) {
        setError(authError);
        return;
      }
      navigate(consumeAuthReturnPath(), { replace: true });
    });

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
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { completeOAuthCallback, consumeAuthReturnPath, isAuthCallbackRoute } from '../lib/auth';

interface Props {
  onDone: (returnPath: string) => void;
  onError: (message: string) => void;
}

export default function AuthCallback({ onDone, onError }: Props) {
  useEffect(() => {
    if (!isAuthCallbackRoute()) {
      onDone('/');
      return;
    }

    completeOAuthCallback().then(({ error }) => {
      if (error) {
        onError(error);
        return;
      }
      onDone(consumeAuthReturnPath());
    });
  }, [onDone, onError]);

  return (
    <div className="page-loading">
      <div className="spinner" />
      <p>Completing sign-in...</p>
    </div>
  );
}

export function AuthCallbackError({ message }: { message: string }) {
  return (
    <div className="page error-page">
      <h2>Sign-in failed</h2>
      <p className="page-subtitle">{message}</p>
      <Link to="/" className="btn btn-primary">
        Back to home
      </Link>
    </div>
  );
}
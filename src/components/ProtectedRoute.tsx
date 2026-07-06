import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { storeAuthReturnPath } from '../lib/auth';
import { useAuth, signInWithGoogle } from '../hooks/useAuth';

interface Props {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireWriter?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false, requireWriter = false }: Props) {
  const { user, loading, isAdmin, isWriter } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      storeAuthReturnPath(`${location.pathname}${location.search}`);
    }
  }, [loading, user, location.pathname, location.search]);

  if (loading) {
    return (
      <div className="page-loading" aria-busy="true">
        <div className="spinner" />
        <p>Loading account...</p>
      </div>
    );
  }

  if (!user) {
    const returnPath = `${location.pathname}${location.search}`;
    return (
      <div className="page auth-required-page">
        <h2>Sign in required</h2>
        <p className="page-subtitle">Sign in with Google to access this page.</p>
        <div className="auth-required-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => signInWithGoogle(returnPath)}
          >
            Sign in with Google
          </button>
          <Link to="/" className="btn btn-ghost">Back to home</Link>
        </div>
      </div>
    );
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="page auth-required-page">
        <h2>Access denied</h2>
        <p className="page-subtitle">You need admin privileges to view this page.</p>
        <Link to="/" className="btn btn-primary">Back to home</Link>
      </div>
    );
  }

  if (requireWriter && !isWriter) {
    return (
      <div className="page auth-required-page">
        <h2>Sign in required</h2>
        <p className="page-subtitle">Create an account to use this feature.</p>
        <Link to="/" className="btn btn-primary">Back to home</Link>
      </div>
    );
  }

  return <>{children}</>;
}
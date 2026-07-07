import { useEffect } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { storeAuthReturnPath } from '../lib/auth';
import { useAuth, signInWithGoogle } from '../hooks/useAuth';

interface Props {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireWriter?: boolean;
  requireOnboarding?: boolean;
}

export default function ProtectedRoute({
  children,
  requireAdmin = false,
  requireWriter = false,
  requireOnboarding = true,
}: Props) {
  const { user, profile, loading, isAdmin, isWriter } = useAuth();
  const location = useLocation();

  const isOnboardingRoute = location.pathname.startsWith('/onboarding');

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

  if (requireOnboarding && !isOnboardingRoute && profile && !profile.onboarding_complete) {
    return <Navigate to="/onboarding/username" replace />;
  }

  if (isOnboardingRoute && profile?.onboarding_complete) {
    return <Navigate to="/profile" replace />;
  }

  if (requireWriter && !isWriter) {
    return (
      <div className="page auth-required-page">
        <h2>Sign in required</h2>
        <p className="page-subtitle">Sign in to use this feature.</p>
        <Link to="/" className="btn btn-primary">Back to home</Link>
      </div>
    );
  }

  return <>{children}</>;
}
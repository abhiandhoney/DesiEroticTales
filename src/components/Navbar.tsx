import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth, signInWithGoogle } from '../hooks/useAuth';
import UserMenu from './UserMenu';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

export default function Navbar() {
  const { user, profile, loading, isAdmin, isWriter } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    setMenuOpen(false);
    setAuthError('');
  }, [location.pathname]);

  useBodyScrollLock(menuOpen);

  useEffect(() => {
    if (user) setSigningIn(false);
  }, [user]);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    if (path === '/stories') {
      return location.pathname === '/stories' || location.pathname.startsWith('/story/');
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const navLink = (path: string, label: string) => (
    <Link
      to={path}
      className={`nav-link ${isActive(path) ? 'active' : ''}`}
      onClick={() => setMenuOpen(false)}
    >
      {label}
    </Link>
  );

  async function handleSignIn() {
    setSigningIn(true);
    setAuthError('');
    try {
      await signInWithGoogle(`${location.pathname}${location.search}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign-in failed. Please try again.';
      setAuthError(message);
      setSigningIn(false);
    }
  }

  const displayUsername = profile?.username ?? user?.email?.split('@')[0] ?? 'user';

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand" onClick={() => setMenuOpen(false)}>
          <span className="brand-des">Desi</span>
          <span className="brand-erotic">Erotic</span>
          <span className="brand-tales">Tales</span>
        </Link>

        <button
          type="button"
          className="navbar-toggle"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          {menuOpen ? '\u00d7' : '\u2630'}
        </button>

        {menuOpen && (
          <button
            type="button"
            className="navbar-backdrop"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
        )}

        <div className={`navbar-menu ${menuOpen ? 'open' : ''}`}>
          <div className="navbar-links">
            {navLink('/', 'Home')}
            {navLink('/stories', 'Stories')}
            {navLink('/writers', 'Writers')}
            {isWriter && navLink('/submit', 'Submit')}
            {isAdmin && navLink('/admin', 'Admin')}
          </div>
          <div className="navbar-auth">
            {loading ? (
              <span className="auth-loading" aria-live="polite">Loading...</span>
            ) : user ? (
              <UserMenu
                username={displayUsername}
                profileUsername={profile?.username}
                avatarUrl={profile?.avatar_url}
                onNavigate={() => setMenuOpen(false)}
              />
            ) : (
              <div className="navbar-signin">
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={handleSignIn}
                  disabled={signingIn}
                >
                  {signingIn ? 'Redirecting...' : 'Sign in with Google'}
                </button>
                {authError && <p className="navbar-auth-error">{authError}</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
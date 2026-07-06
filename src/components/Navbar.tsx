import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth, signInWithGoogle, signOut } from '../hooks/useAuth';

export default function Navbar() {
  const { user, profile, loading, isAdmin, isWriter } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const navLink = (path: string, label: string) => (
    <Link
      to={path}
      className={`nav-link ${isActive(path) ? 'active' : ''}`}
      onClick={() => setMenuOpen(false)}
    >
      {label}
    </Link>
  );

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

        <div className={`navbar-menu ${menuOpen ? 'open' : ''}`}>
          <div className="navbar-links">
            {navLink('/', 'Home')}
            {navLink('/stories', 'Stories')}
            {isWriter && navLink('/submit', 'Submit')}
            {isAdmin && navLink('/admin', 'Admin')}
          </div>
          <div className="navbar-auth">
            {loading ? (
              <span className="auth-loading">...</span>
            ) : user ? (
              <div className="user-menu">
                <span className="user-name">{profile?.username ?? user.email?.split('@')[0]}</span>
                <button className="btn btn-sm btn-ghost" onClick={() => { signOut(); setMenuOpen(false); }}>
                  Sign out
                </button>
              </div>
            ) : (
              <button
                className="btn btn-sm btn-primary"
                onClick={() => signInWithGoogle(`${location.pathname}${location.search}`)}
              >
                Sign in with Google
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
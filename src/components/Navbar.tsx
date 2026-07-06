import { Link, useLocation } from 'react-router-dom';
import { useAuth, signInWithGoogle, signOut } from '../hooks/useAuth';

export default function Navbar() {
  const { user, profile, loading, isAdmin, isWriter } = useAuth();
  const location = useLocation();

  const navLink = (path: string, label: string) => (
    <Link
      to={path}
      className={`nav-link ${location.pathname === path ? 'active' : ''}`}
    >
      {label}
    </Link>
  );

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <span className="brand-des">Desi</span>
          <span className="brand-erotic">Erotic</span>
          <span className="brand-tales">Tales</span>
        </Link>

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
              <span className="user-name">
                {profile?.username ?? user.email?.split('@')[0]}
              </span>
              <button className="btn btn-sm btn-ghost" onClick={() => signOut()}>
                Sign out
              </button>
            </div>
          ) : (
            <button className="btn btn-sm btn-primary" onClick={() => signInWithGoogle()}>
              Sign in with Google
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
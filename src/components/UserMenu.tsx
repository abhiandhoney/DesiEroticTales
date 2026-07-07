import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { signOut } from '../hooks/useAuth';
import ProfileAvatar from './ProfileAvatar';

interface UserMenuProps {
  username: string;
  profileUsername?: string | null;
  avatarUrl?: string | null;
  onNavigate?: () => void;
}

export default function UserMenu({ username, profileUsername, avatarUrl, onNavigate }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function close() {
    setOpen(false);
    onNavigate?.();
  }

  async function handleSignOut() {
    try {
      await signOut();
      close();
    } catch {
      // Navbar can surface auth errors if needed
    }
  }

  return (
    <div className="user-menu-root" ref={rootRef}>
      <button
        type="button"
        className="user-menu-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
      >
        <ProfileAvatar name={username} avatarUrl={avatarUrl} size="sm" className="user-menu-avatar-img" />
        <span className="user-menu-label">@{username}</span>
        <span className="user-menu-chevron" aria-hidden="true">{open ? '\u25b4' : '\u25be'}</span>
      </button>

      {open && (
        <div className="user-menu-dropdown" role="menu">
          <div className="user-menu-dropdown-header">
            <ProfileAvatar name={username} avatarUrl={avatarUrl} size="sm" />
            <span className="user-menu-dropdown-name">@{username}</span>
          </div>
          <Link to="/profile" className="user-menu-item" role="menuitem" onClick={close}>
            My profile
          </Link>
          <Link to="/profile/edit" className="user-menu-item" role="menuitem" onClick={close}>
            Edit profile
          </Link>
          {profileUsername && (
            <Link to={`/writer/${profileUsername}`} className="user-menu-item" role="menuitem" onClick={close}>
              Public profile
            </Link>
          )}
          <hr className="user-menu-divider" />
          <button type="button" className="user-menu-item user-menu-item-danger" role="menuitem" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
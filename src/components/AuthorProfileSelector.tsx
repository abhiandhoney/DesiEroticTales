import { useEffect, useState } from 'react';
import { fetchAuthorProfiles } from '../lib/authorProfiles';
import ProfileAvatar from './ProfileAvatar';
import type { AuthorProfile } from '../types';

interface AuthorProfileSelectorProps {
  value: string | null;
  onChange: (profileId: string | null) => void;
  disabled?: boolean;
}

export default function AuthorProfileSelector({
  value,
  onChange,
  disabled = false,
}: AuthorProfileSelectorProps) {
  const [profiles, setProfiles] = useState<AuthorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAuthorProfiles()
      .then(setProfiles)
      .catch(() => setError('Could not load pen names.'))
      .finally(() => setLoading(false));
  }, []);

  const selected = profiles.find((p) => p.id === value) ?? null;

  return (
    <div className="form-group author-profile-selector">
      <label htmlFor="author-profile">Post as pen name</label>
      <p className="form-hint">
        Choose a pen name for this story. Readers see the pen name, not your admin account.
      </p>
      {error && <div className="form-error">{error}</div>}
      {loading ? (
        <p className="form-hint">Loading pen names…</p>
      ) : (
        <>
          <select
            id="author-profile"
            className="select"
            value={value ?? ''}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value || null)}
          >
            <option value="">My account (default)</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (@{p.slug})
              </option>
            ))}
          </select>
          {selected && (
            <div className="author-profile-preview">
              <ProfileAvatar name={selected.name} avatarUrl={selected.avatar_url} size="sm" />
              <div>
                <strong>{selected.name}</strong>
                <span className="author-profile-preview-slug">@{selected.slug}</span>
                {selected.bio && <p className="author-profile-preview-bio">{selected.bio}</p>}
              </div>
            </div>
          )}
          {profiles.length === 0 && (
            <p className="form-hint">
              No pen names yet.{' '}
              <a href="/admin/pen-names">Create one in Admin → Pen names</a>.
            </p>
          )}
        </>
      )}
    </div>
  );
}
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ProfileAvatar from '../components/ProfileAvatar';
import { useAuth } from '../hooks/useAuth';
import { useConfirm } from '../hooks/useConfirm';
import { useToast } from '../hooks/useToast';
import {
  createAuthorProfile,
  deleteAuthorProfile,
  fetchAuthorProfileStoryCounts,
  fetchAuthorProfiles,
  isAuthorProfileSlugAvailable,
  uniqueAuthorProfileSlug,
  updateAuthorProfile,
  uploadAuthorProfileAvatar,
} from '../lib/authorProfiles';
import { slugify } from '../lib/slug';
import { getWriterPath } from '../lib/slug';
import type { AuthorProfile } from '../types';
import { BIO_MAX_LENGTH } from '../types';
import { usePageMeta } from '../hooks/usePageMeta';

export default function AdminPenNames() {
  const { user } = useAuth();
  const { confirm } = useConfirm();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<AuthorProfile[]>([]);
  const [storyCounts, setStoryCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AuthorProfile | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [slugManual, setSlugManual] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  usePageMeta({
    title: 'Pen names — Admin',
    description: 'Manage author pen names for story attribution.',
    path: '/admin/pen-names',
    noIndex: true,
  });

  async function load() {
    setLoading(true);
    try {
      const [list, counts] = await Promise.all([
        fetchAuthorProfiles(),
        fetchAuthorProfileStoryCounts(),
      ]);
      setProfiles(list);
      setStoryCounts(counts);
    } catch {
      setError('Could not load pen names.');
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    setCreating(true);
    setName('');
    setSlug('');
    setBio('');
    setAvatarUrl(null);
    setSlugManual(false);
    setError('');
  }

  function openEdit(profile: AuthorProfile) {
    setCreating(false);
    setEditing(profile);
    setName(profile.name);
    setSlug(profile.slug);
    setBio(profile.bio ?? '');
    setAvatarUrl(profile.avatar_url);
    setSlugManual(true);
    setError('');
  }

  function closeForm() {
    setCreating(false);
    setEditing(null);
    setError('');
  }

  async function handleNameChange(next: string) {
    setName(next);
    if (!slugManual && creating) {
      setSlug(slugify(next));
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters.');
      return;
    }
    const finalSlug = slugify(slug) || (await uniqueAuthorProfileSlug(name));
    if (finalSlug.length < 3) {
      setError('Slug must be at least 3 characters.');
      return;
    }
    const available = await isAuthorProfileSlugAvailable(finalSlug, editing?.id);
    if (!available) {
      setError('This slug is already taken by a writer or pen name.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      if (editing) {
        await updateAuthorProfile(editing.id, {
          name: name.trim(),
          slug: finalSlug,
          bio: bio.trim() || null,
          avatarUrl,
        });
        toast('Pen name updated.', 'success');
      } else {
        await createAuthorProfile(user.id, {
          name: name.trim(),
          slug: finalSlug,
          bio: bio.trim() || null,
          avatarUrl,
        });
        toast('Pen name created.', 'success');
      }
      closeForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.');
    }
    setSaving(false);
  }

  async function handleDelete(profile: AuthorProfile) {
    const count = storyCounts[profile.id] ?? 0;
    const ok = await confirm({
      title: 'Delete pen name?',
      message: count
        ? `"${profile.name}" has ${count} linked stories. Deleting clears the pen name from those stories (they fall back to your account).`
        : `Delete "${profile.name}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Keep',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await deleteAuthorProfile(profile);
      toast('Pen name deleted.', 'success');
      if (editing?.id === profile.id) closeForm();
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Delete failed.', 'error');
    }
  }

  async function handleAvatar(file: File) {
    if (!user) return;
    try {
      const url = await uploadAuthorProfileAvatar(user.id, file);
      setAvatarUrl(url);
    } catch {
      setError('Avatar upload failed.');
    }
  }

  const formOpen = creating || !!editing;

  return (
    <div className="page admin-page admin-pen-names-page">
      <header className="page-header">
        <h1>Pen names</h1>
        <p className="page-subtitle">
          Create author aliases for posting stories under different identities.{' '}
          <Link to="/admin" className="inline-link">Back to moderation</Link>
        </p>
      </header>

      <div className="admin-toolbar">
        <button type="button" className="btn btn-primary btn-sm" onClick={openCreate}>
          New pen name
        </button>
      </div>

      {formOpen && (
        <form className="pen-name-form submit-form" onSubmit={handleSave}>
          <h2 className="section-title">{editing ? 'Edit pen name' : 'New pen name'}</h2>
          {error && <div className="form-error">{error}</div>}

          <div className="pen-name-form-avatar">
            <ProfileAvatar name={name || 'Author'} avatarUrl={avatarUrl} size="lg" />
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="file-input-hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (f) void handleAvatar(f);
              }}
            />
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => avatarInputRef.current?.click()}
            >
              {avatarUrl ? 'Change avatar' : 'Upload avatar'}
            </button>
            {avatarUrl && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAvatarUrl(null)}>
                Remove avatar
              </button>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="pen-name">Display name</label>
            <input
              id="pen-name"
              className="input"
              value={name}
              onChange={(e) => void handleNameChange(e.target.value)}
              placeholder="e.g. Priya Sharma"
              maxLength={80}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="pen-slug">URL slug</label>
            <input
              id="pen-slug"
              className="input"
              value={slug}
              onChange={(e) => {
                setSlugManual(true);
                setSlug(e.target.value);
              }}
              placeholder="priya-sharma"
              maxLength={40}
            />
            <span className="form-hint">Profile URL: /writer/{slugify(slug) || '…'}</span>
          </div>

          <div className="form-group">
            <label htmlFor="pen-bio">Bio <span className="label-optional">(optional)</span></label>
            <textarea
              id="pen-bio"
              className="textarea textarea-compact"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={BIO_MAX_LENGTH}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={closeForm} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create pen name'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="page-loading page-loading-inline" aria-busy="true">
          <div className="spinner" />
        </div>
      ) : profiles.length === 0 ? (
        <p className="empty-state">No pen names yet. Create one to post under an alias.</p>
      ) : (
        <div className="pen-name-list">
          {profiles.map((p) => (
            <article key={p.id} className="pen-name-card">
              <ProfileAvatar name={p.name} avatarUrl={p.avatar_url} size="md" />
              <div className="pen-name-card-body">
                <h3 className="pen-name-card-title">{p.name}</h3>
                <p className="pen-name-card-slug">
                  <Link to={getWriterPath(p.slug)}>@{p.slug}</Link>
                </p>
                {p.bio && <p className="pen-name-card-bio">{p.bio}</p>}
                <p className="pen-name-card-meta">
                  {storyCounts[p.id] ?? 0} stories
                </p>
              </div>
              <div className="pen-name-card-actions">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}>
                  Edit
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm btn-danger-outline"
                  onClick={() => void handleDelete(p)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
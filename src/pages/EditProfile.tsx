import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { checkUsernameAvailable, updateProfile } from '../lib/profile';
import { processAndUploadAvatar, removeAvatar } from '../lib/avatar';
import {
  validateUsername,
  canChangeUsername,
  daysUntilUsernameChange,
  normalizeUsername,
} from '../lib/username';
import { BIO_MAX_LENGTH } from '../types';
import PageHeader from '../components/PageHeader';
import ProfileAvatar from '../components/ProfileAvatar';
import { accountDisplayLabel } from '../lib/privacy';

export default function EditProfile() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [username, setUsername] = useState(profile?.username ?? '');
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? '');
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const displayLabel = displayName || username || accountDisplayLabel(user?.email, profile?.username) || 'Writer';
  const usernameChanged = normalizeUsername(username) !== (profile?.username ?? '');
  const usernameLocked =
    usernameChanged &&
    !canChangeUsername(profile?.username_changed_at, {
      userEmail: user?.email,
      targetUsername: username,
    });

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    e.target.value = '';

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }

    setAvatarBusy(true);
    setError('');

    try {
      const oldUrl = avatarUrl || profile?.avatar_url;
      const newUrl = await processAndUploadAvatar(user.id, file);
      const { error: updateError } = await updateProfile(user.id, { avatar_url: newUrl });

      if (updateError) {
        setError(updateError.message);
        setAvatarBusy(false);
        return;
      }

      if (oldUrl && oldUrl !== newUrl) {
        removeAvatar(oldUrl).catch(() => {});
      }

      setAvatarUrl(newUrl);
      await refreshProfile();
      setSuccess('Avatar updated.');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Avatar upload failed.');
    }

    setAvatarBusy(false);
  }

  async function handleRemoveAvatar() {
    if (!user || !avatarUrl) return;
    setAvatarBusy(true);
    setError('');

    const oldUrl = avatarUrl;
    const { error: updateError } = await updateProfile(user.id, { avatar_url: null });

    if (updateError) {
      setError(updateError.message);
      setAvatarBusy(false);
      return;
    }

    setAvatarUrl('');
    removeAvatar(oldUrl).catch(() => {});
    await refreshProfile();
    setAvatarBusy(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (usernameChanged) {
      if (usernameLocked) {
        setError(`Username can be changed again in ${daysUntilUsernameChange(profile?.username_changed_at)} days.`);
        return;
      }
      const validation = validateUsername(username, user?.email);
      if (validation) {
        setError(validation);
        return;
      }
      const available = await checkUsernameAvailable(username, user?.id, user?.email);
      if (!available) {
        setError('This username is already taken.');
        return;
      }
    }

    if (bio.length > BIO_MAX_LENGTH) {
      setError(`Bio must be ${BIO_MAX_LENGTH} characters or fewer.`);
      return;
    }

    setSubmitting(true);

    const updates: Parameters<typeof updateProfile>[1] = {
      display_name: displayName.trim() || null,
      bio: bio.trim() || null,
    };

    if (usernameChanged) {
      updates.username = username;
      updates.username_changed_at = new Date().toISOString();
    }

    const { error: updateError } = await updateProfile(user!.id, updates);

    if (updateError) {
      setError(updateError.message);
      setSubmitting(false);
      return;
    }

    await refreshProfile();
    setSuccess('Profile updated.');
    setSubmitting(false);
    setTimeout(() => navigate('/profile'), 1200);
  }

  return (
    <div className="page edit-profile-page">
      <PageHeader title="Edit Profile" subtitle="Update your public writer identity" />

      <form className="submit-form" onSubmit={handleSubmit}>
        {error && <div className="form-error">{error}</div>}
        {success && <div className="admin-feedback">{success}</div>}

        <div className="form-group avatar-upload-group">
          <label>Profile photo</label>
          <div className="avatar-upload-row">
            <ProfileAvatar name={displayLabel} avatarUrl={avatarUrl} size="lg" />
            <div className="avatar-upload-actions">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => fileRef.current?.click()}
                disabled={avatarBusy}
              >
                {avatarBusy ? 'Uploading...' : avatarUrl ? 'Change photo' : 'Upload photo'}
              </button>
              {avatarUrl && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={handleRemoveAvatar}
                  disabled={avatarBusy}
                >
                  Remove
                </button>
              )}
              <p className="form-hint">Square image, WebP preferred. Max 512px.</p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleAvatarChange}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="edit-username">Username</label>
          <div className="username-input-wrap">
            <span className="username-prefix">@</span>
            <input
              id="edit-username"
              type="text"
              className="input username-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={usernameLocked}
              maxLength={24}
            />
          </div>
          {usernameLocked && (
            <p className="form-hint">
              Username change available in {daysUntilUsernameChange(profile?.username_changed_at)} days.
            </p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="edit-display">Display name</label>
          <input
            id="edit-display"
            type="text"
            className="input"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={80}
          />
        </div>

        <div className="form-group">
          <label htmlFor="edit-bio">Bio</label>
          <textarea
            id="edit-bio"
            className="textarea textarea-compact"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            maxLength={BIO_MAX_LENGTH}
            placeholder="A short intro for your public profile..."
          />
          <span className="char-count">{bio.length}/{BIO_MAX_LENGTH}</span>
        </div>

        <div className="form-actions">
          <Link to="/profile" className="btn btn-ghost">Cancel</Link>
          <button type="submit" className="btn btn-primary" disabled={submitting || avatarBusy}>
            {submitting ? 'Saving...' : 'Save profile'}
          </button>
        </div>
      </form>

      {profile?.username && (
        <p className="form-hint" style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Link to={`/writer/${profile.username}`}>View your public profile</Link>
        </p>
      )}
    </div>
  );
}
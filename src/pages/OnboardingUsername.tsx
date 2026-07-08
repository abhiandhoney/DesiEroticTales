import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { checkUsernameAvailable, updateProfile } from '../lib/profile';
import { validateUsername } from '../lib/username';
import PageHeader from '../components/PageHeader';
import { usePageMeta } from '../hooks/usePageMeta';

export default function OnboardingUsername() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  usePageMeta({
    title: 'Choose Username | DesiEroticTales',
    description: 'Set your writer username.',
    path: '/onboarding/username',
    noIndex: true,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validation = validateUsername(username, user?.email);
    if (validation) {
      setError(validation);
      return;
    }

    setSubmitting(true);
    setError('');

    const available = await checkUsernameAvailable(username, user?.id, user?.email);
    if (!available) {
      setError('This username is already taken. Try another.');
      setSubmitting(false);
      return;
    }

    const { error: updateError } = await updateProfile(user!.id, {
      username,
      display_name: displayName.trim() || null,
      onboarding_complete: true,
      username_changed_at: new Date().toISOString(),
    });

    if (updateError) {
      setError(updateError.message);
      setSubmitting(false);
      return;
    }

    await refreshProfile();
    navigate('/profile', { replace: true });
  }

  async function handleUsernameBlur() {
    if (!username.trim()) return;
    const validation = validateUsername(username, user?.email);
    if (validation) return;
    setChecking(true);
    const available = await checkUsernameAvailable(username, user?.id, user?.email);
    if (!available) setError('This username is already taken.');
    else if (error === 'This username is already taken.' || error === 'This username is already taken. Try another.') setError('');
    setChecking(false);
  }

  useEffect(() => {
    if (profile?.onboarding_complete) {
      navigate('/profile', { replace: true });
    }
  }, [profile?.onboarding_complete, navigate]);

  if (profile?.onboarding_complete) {
    return null;
  }

  return (
    <div className="page onboarding-page">
      <PageHeader
        title="Choose your username"
        subtitle="Pick a unique @handle — like GitHub. This is how readers will find you."
      />
      <form className="submit-form onboarding-form" onSubmit={handleSubmit}>
        {error && <div className="form-error">{error}</div>}

        <div className="form-group">
          <label htmlFor="onboard-username">Username</label>
          <div className="username-input-wrap">
            <span className="username-prefix">@</span>
            <input
              id="onboard-username"
              type="text"
              className="input username-input"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(''); }}
              onBlur={handleUsernameBlur}
              placeholder="your_handle"
              required
              autoComplete="username"
              maxLength={24}
            />
          </div>
          <p className="form-hint">
            3–24 characters · letters, numbers, underscores
            {checking && ' · Checking availability...'}
          </p>
        </div>

        <div className="form-group">
          <label htmlFor="onboard-display">Display name <span className="label-optional">(optional)</span></label>
          <input
            id="onboard-display"
            type="text"
            className="input"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="How you want to appear"
            maxLength={80}
          />
        </div>

        <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
          {submitting ? 'Saving...' : 'Continue'}
        </button>
      </form>
    </div>
  );
}
import { useState } from 'react';
import { Link } from 'react-router-dom';
import StoryForm from '../components/StoryForm';
import { useAuth } from '../hooks/useAuth';

export default function Submit() {
  const { user } = useAuth();
  const [success, setSuccess] = useState(false);

  function handleCreateSuccess() {
    setSuccess(true);
  }

  if (success) {
    return (
      <div className="page submit-page">
        <div className="success-message">
          <h2>Story submitted!</h2>
          <p>Your tale is pending review. Track it anytime from your profile.</p>
          <div className="auth-required-actions success-action">
            <Link to="/profile" className="btn btn-primary">Go to profile</Link>
            <Link to="/stories" className="btn btn-ghost">Browse stories</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page submit-page">
      <header className="page-header">
        <h1>Submit a Story</h1>
        <p className="page-subtitle">
          Share your tale |{' '}
          <span className="telugu-text" lang="te" title="Share your story">
            మీ కథను పంచుకోండి
          </span>{' '}
          | Pending admin approval ·{' '}
          <Link to="/profile">View my submissions</Link>
        </p>
      </header>

      <StoryForm mode="create" userId={user!.id} onSuccess={handleCreateSuccess} />
    </div>
  );
}
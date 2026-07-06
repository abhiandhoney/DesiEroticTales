import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import StoryForm from '../components/StoryForm';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import type { Story } from '../types';

export default function EditStory() {
  const { id } = useParams<{ id: string }>();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && id && user) fetchStory(id);
  }, [id, user, authLoading, isAdmin]);

  async function fetchStory(storyId: string) {
    setLoading(true);
    setError('');
    const { data, error: fetchError } = await supabase
      .from('stories')
      .select('*')
      .eq('id', storyId)
      .single();

    if (fetchError || !data) {
      setError('Story not found.');
      setLoading(false);
      return;
    }

    if (!isAdmin) {
      if (data.user_id !== user!.id) {
        setError('You can only edit your own stories.');
        setLoading(false);
        return;
      }
      if (data.status !== 'pending') {
        setError('You can only edit stories that are pending review.');
        setLoading(false);
        return;
      }
    }

    setStory(data);
    setLoading(false);
  }

  function handleSuccess() {
    setSuccess(true);
    setTimeout(() => navigate(isAdmin ? '/admin' : '/profile'), 2500);
  }

  if (authLoading || loading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="page submit-page">
        <div className="success-message">
          <h2>Story updated!</h2>
          <p>Your changes have been saved.</p>
        </div>
      </div>
    );
  }

  if (error || !story || !user) {
    return (
      <div className="page error-page">
        <h2>{error || 'Unable to load story'}</h2>
        <Link to={isAdmin ? '/admin' : '/submit'} className="btn btn-primary">
          Go back
        </Link>
      </div>
    );
  }

  return (
    <div className="page submit-page">
      <header className="page-header">
        <h1>Edit Story</h1>
        <p className="page-subtitle">
          Update your tale
          {isAdmin && (
            <>
              {' '}
              | <span className={`status-badge status-${story.status}`}>{story.status}</span>
            </>
          )}
        </p>
      </header>
      <StoryForm
        mode="edit"
        story={story}
        userId={user.id}
        isAdmin={isAdmin}
        onSuccess={handleSuccess}
        onCancel={() => navigate(isAdmin ? '/admin' : '/submit')}
      />
    </div>
  );
}
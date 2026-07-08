import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import StoryForm from '../components/StoryForm';
import DeleteStoryButton from '../components/DeleteStoryButton';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import type { Story } from '../types';
import { getStoryPath } from '../lib/slug';
import { usePageMeta } from '../hooks/usePageMeta';

export default function EditStory() {
  const { id } = useParams<{ id: string }>();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  usePageMeta({
    title: 'Edit Story | DesiEroticTales',
    description: 'Edit your submitted tale.',
    path: id ? `/edit/${id}` : '/edit',
    noIndex: true,
  });

  useEffect(() => {
    if (authLoading || !id || !user) return;

    let cancelled = false;

    async function fetchStory(storyId: string) {
      setLoading(true);
      setError('');
      const { data, error: fetchError } = await supabase
        .from('stories')
        .select('*')
        .eq('id', storyId)
        .single();

      if (cancelled) return;

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
        if (data.status !== 'pending' && data.status !== 'rejected' && data.status !== 'draft') {
          setError('You can only edit stories that are drafts, pending, or rejected.');
          setLoading(false);
          return;
        }
      }

      setStory(data);
      setLoading(false);
    }

    void fetchStory(id);
    return () => { cancelled = true; };
  }, [id, user, authLoading, isAdmin]);

  function handleSuccess(result: { status: string }) {
    if (result.status !== 'draft') setSuccess(true);
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
          <div className="auth-required-actions success-action">
            <Link to={isAdmin ? '/admin' : '/profile'} className="btn btn-primary">
              {isAdmin ? 'Back to Admin' : 'Back to Profile'}
            </Link>
            {story?.status === 'approved' && (
              <Link to={getStoryPath(story!)} className="btn btn-ghost">
                View live
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (error || !story || !user) {
    return (
      <div className="page error-page">
        <h2>{error || 'Unable to load story'}</h2>
        <Link to={isAdmin ? '/admin' : '/profile'} className="btn btn-primary">
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
        <div className="page-header-actions">
          <DeleteStoryButton
            storyId={story.id}
            storyTitle={story.title}
            onDeleted={() => navigate(isAdmin ? '/admin' : '/profile')}
            className="btn btn-ghost btn-sm"
            label="Delete story"
          />
        </div>
      </header>
      <StoryForm
        mode="edit"
        story={story}
        userId={user.id}
        isAdmin={isAdmin}
        onSuccess={handleSuccess}
        onCancel={() => navigate(isAdmin ? '/admin' : '/profile')}
      />
    </div>
  );
}
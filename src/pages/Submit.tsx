import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import StoryForm from '../components/StoryForm';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { getStoryTeaser } from '../lib/storyTeaser';
import type { Story } from '../types';

export default function Submit() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);
  const [myStories, setMyStories] = useState<Story[]>([]);
  const [loadingStories, setLoadingStories] = useState(true);
  const [storiesError, setStoriesError] = useState('');

  useEffect(() => {
    if (user) fetchMyStories();
  }, [user]);

  async function fetchMyStories() {
    if (!user) return;
    setLoadingStories(true);
    setStoriesError('');
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) {
      setStoriesError('Could not load your submissions.');
    } else {
      setMyStories(data ?? []);
    }
    setLoadingStories(false);
  }

  function handleCreateSuccess() {
    setSuccess(true);
    setTimeout(() => navigate('/submit'), 2500);
  }

  if (success) {
    return (
      <div className="page submit-page">
        <div className="success-message">
          <h2>Story submitted!</h2>
          <p>Your tale is pending review. We'll notify you once it's live.</p>
          <Link to="/submit" className="btn btn-ghost success-action">
            Back to submissions
          </Link>
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
          | Pending admin approval
        </p>
      </header>

      <section className="my-submissions">
        <h2 className="section-title">My Submissions</h2>
        {loadingStories ? (
          <div className="page-loading page-loading-inline" aria-busy="true">
            <div className="spinner" />
          </div>
        ) : storiesError ? (
          <div className="empty-state-inline">
            <p>{storiesError}</p>
            <button type="button" className="btn btn-ghost btn-sm" onClick={fetchMyStories}>
              Retry
            </button>
          </div>
        ) : myStories.length === 0 ? (
          <p className="empty-state-inline">You haven't submitted any stories yet.</p>
        ) : (
          <div className="my-submissions-list">
            {myStories.map((story) => (
              <article key={story.id} className="my-submission-card">
                <div className="my-submission-header">
                  <h3 className="my-submission-title">{story.title}</h3>
                  <span className={`status-badge status-${story.status}`}>{story.status}</span>
                </div>
                <p className="my-submission-meta">
                  {story.category} &middot;{' '}
                  {new Date(story.created_at).toLocaleDateString()}
                </p>
                <p className="my-submission-preview">{getStoryTeaser(story, 120)}</p>
                {story.status === 'pending' && (
                  <Link to={`/edit/${story.id}`} className="btn btn-primary btn-sm">
                    Edit
                  </Link>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <StoryForm
        mode="create"
        userId={user!.id}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
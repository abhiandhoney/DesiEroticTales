import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { getStoryTeaser } from '../lib/storyTeaser';
import { getStoryMediaUrls } from '../lib/storyMedia';
import type { Story } from '../types';

export default function Profile() {
  const { user, profile, loading: authLoading } = useAuth();
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

  if (authLoading) {
    return (
      <div className="page-loading" aria-busy="true">
        <div className="spinner" />
      </div>
    );
  }

  const displayName = profile?.username ?? user?.email?.split('@')[0] ?? 'Writer';
  const pendingCount = myStories.filter((s) => s.status === 'pending').length;
  const approvedCount = myStories.filter((s) => s.status === 'approved').length;

  return (
    <div className="page profile-page">
      <header className="page-header">
        <h1>My Profile</h1>
        <p className="page-subtitle">Manage your stories and submissions</p>
      </header>

      <section className="profile-card">
        <div className="profile-avatar" aria-hidden="true">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <div className="profile-info">
          <h2 className="profile-name">{displayName}</h2>
          <p className="profile-email">{user?.email}</p>
          <p className="profile-role">{profile?.role === 'admin' ? 'Admin & Writer' : 'Writer'}</p>
        </div>
        <div className="profile-stats">
          <div className="profile-stat">
            <span className="profile-stat-value">{myStories.length}</span>
            <span className="profile-stat-label">Submitted</span>
          </div>
          <div className="profile-stat">
            <span className="profile-stat-value">{approvedCount}</span>
            <span className="profile-stat-label">Live</span>
          </div>
          <div className="profile-stat">
            <span className="profile-stat-value">{pendingCount}</span>
            <span className="profile-stat-label">Pending</span>
          </div>
        </div>
        <Link to="/submit" className="btn btn-primary">
          Submit new story
        </Link>
      </section>

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
          <div className="empty-state">
            <p>You haven't submitted any stories yet.</p>
            <Link to="/submit" className="btn btn-primary empty-state-action">
              Write your first tale
            </Link>
          </div>
        ) : (
          <div className="my-submissions-list">
            {myStories.map((story) => (
              <article key={story.id} className="my-submission-card">
                {story.image_url && (
                  <div className="my-submission-thumb">
                    <img src={story.image_url} alt="" loading="lazy" />
                  </div>
                )}
                <div className="my-submission-body">
                  <div className="my-submission-header">
                    <h3 className="my-submission-title">{story.title}</h3>
                    <span className={`status-badge status-${story.status}`}>{story.status}</span>
                  </div>
                  <p className="my-submission-meta">
                    {story.category} &middot;{' '}
                    {new Date(story.created_at).toLocaleDateString()}
                    {getStoryMediaUrls(story).length > 0 && (
                      <> &middot; {getStoryMediaUrls(story).length} photos</>
                    )}
                  </p>
                  <p className="my-submission-preview">{getStoryTeaser(story, 120)}</p>
                  <div className="my-submission-actions">
                    {story.status === 'approved' && (
                      <Link to={`/story/${story.id}`} className="btn btn-ghost btn-sm">
                        View live
                      </Link>
                    )}
                    {story.status === 'pending' && (
                      <Link to={`/edit/${story.id}`} className="btn btn-primary btn-sm">
                        Edit
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
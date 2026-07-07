import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { fetchFollowing, type FollowedWriter } from '../lib/profile';
import { getStoryTeaser } from '../lib/storyTeaser';
import { getStoryMediaUrls } from '../lib/storyMedia';
import type { Story, StoryStatus } from '../types';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import ProfileAvatar from '../components/ProfileAvatar';
import { accountDisplayLabel, displayUserEmail } from '../lib/privacy';
import { getStoryPath } from '../lib/slug';

type Tab = 'all' | StoryStatus;

export default function Profile() {
  const { user, profile, loading: authLoading } = useAuth();
  const [myStories, setMyStories] = useState<Story[]>([]);
  const [following, setFollowing] = useState<FollowedWriter[]>([]);
  const [loadingStories, setLoadingStories] = useState(true);
  const [loadingFollowing, setLoadingFollowing] = useState(true);
  const [storiesError, setStoriesError] = useState('');
  const [tab, setTab] = useState<Tab>('all');

  useEffect(() => {
    if (user) {
      fetchMyStories();
      fetchFollowingList();
    }
  }, [user]);

  async function fetchFollowingList() {
    if (!user) return;
    setLoadingFollowing(true);
    const list = await fetchFollowing(user.id);
    setFollowing(list);
    setLoadingFollowing(false);
  }

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

  const filtered = useMemo(() => {
    if (tab === 'all') return myStories;
    return myStories.filter((s) => s.status === tab);
  }, [myStories, tab]);

  if (authLoading) {
    return (
      <div className="page-loading" aria-busy="true">
        <div className="spinner" />
      </div>
    );
  }

  const displayName = accountDisplayLabel(user?.email, profile?.username, profile?.display_name) || 'Writer';
  const pendingCount = myStories.filter((s) => s.status === 'pending').length;
  const approvedCount = myStories.filter((s) => s.status === 'approved').length;
  const rejectedCount = myStories.filter((s) => s.status === 'rejected').length;

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: myStories.length },
    { id: 'approved', label: 'Live', count: approvedCount },
    { id: 'pending', label: 'Pending', count: pendingCount },
    { id: 'rejected', label: 'Rejected', count: rejectedCount },
  ];

  return (
    <div className="page profile-page">
      <PageHeader title="My Profile" subtitle="Manage your stories and submissions" />

      <section className="profile-card">
        <ProfileAvatar
          name={displayName}
          avatarUrl={profile?.avatar_url}
          size="lg"
          className="profile-avatar-img"
        />
        <div className="profile-info">
          <h2 className="profile-name">{displayName}</h2>
          {profile?.username && <p className="profile-handle">@{profile.username}</p>}
          <p className="profile-email">{displayUserEmail(user?.email)}</p>
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
        <div className="profile-card-actions">
          <Link to="/submit" className="btn btn-primary">Submit new story</Link>
          <Link to="/profile/edit" className="btn btn-ghost">Edit profile</Link>
          {profile?.username && (
            <Link to={`/writer/${profile.username}`} className="btn btn-ghost">Public profile</Link>
          )}
        </div>
      </section>

      <section className="following-section">
        <h2 className="section-title">Following</h2>
        {loadingFollowing ? (
          <div className="page-loading page-loading-inline" aria-busy="true">
            <div className="spinner" />
          </div>
        ) : following.length === 0 ? (
          <EmptyState
            message="You're not following any writers yet."
            action={<Link to="/writers" className="btn btn-ghost">Discover writers</Link>}
          />
        ) : (
          <ul className="following-list">
            {following.map((w) => (
              <li key={w.user_id} className="following-item">
                <Link to={`/writer/${w.username}`} className="following-link">
                  <ProfileAvatar
                    name={w.display_name ?? w.username}
                    avatarUrl={w.avatar_url}
                    size="sm"
                  />
                  <span className="following-name">{w.display_name ?? w.username}</span>
                  <span className="following-handle">@{w.username}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="my-submissions">
        <h2 className="section-title">My Submissions</h2>

        {myStories.length > 0 && (
          <div className="profile-tabs" role="tablist" aria-label="Filter submissions">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                className={`tab-btn ${tab === t.id ? 'active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                {t.label} ({t.count})
              </button>
            ))}
          </div>
        )}

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
          <EmptyState
            message="You haven't submitted any stories yet."
            action={<Link to="/submit" className="btn btn-primary">Write your first tale</Link>}
          />
        ) : filtered.length === 0 ? (
          <EmptyState message={`No ${tab} submissions.`} />
        ) : (
          <div className="my-submissions-list">
            {filtered.map((story) => (
              <article key={story.id} className="my-submission-card">
                {story.image_url && (
                  <div className="my-submission-thumb">
                    <img src={story.image_url} alt="" loading="lazy" />
                  </div>
                )}
                <div className="my-submission-body">
                  <div className="my-submission-header">
                    <h3 className="my-submission-title">{story.title}</h3>
                    <span
                      className={`status-badge status-${story.status}`}
                      aria-label={`Status: ${story.status}`}
                    >
                      {story.status}
                    </span>
                  </div>
                  <p className="my-submission-meta">
                    {story.category} &middot;{' '}
                    Submitted {new Date(story.created_at).toLocaleDateString()}
                    {story.updated_at && story.updated_at !== story.created_at && (
                      <> &middot; Updated {new Date(story.updated_at).toLocaleDateString()}</>
                    )}
                    {getStoryMediaUrls(story).length > 0 && (
                      <> &middot; {getStoryMediaUrls(story).length} photos</>
                    )}
                  </p>
                  <p className="my-submission-preview">{getStoryTeaser(story, 120)}</p>
                  <div className="my-submission-actions">
                    {story.status === 'approved' && (
                      <Link to={getStoryPath(story)} className="btn btn-ghost btn-sm">
                        View live
                      </Link>
                    )}
                    {story.status === 'pending' && (
                      <Link to={`/edit/${story.id}`} className="btn btn-primary btn-sm">
                        Edit
                      </Link>
                    )}
                    {story.status === 'rejected' && (
                      <Link to={`/edit/${story.id}`} className="btn btn-primary btn-sm">
                        Edit &amp; resubmit
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
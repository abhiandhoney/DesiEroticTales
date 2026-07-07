import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Profile, Story } from '../types';
import StoryCard from '../components/StoryCard';
import EmptyState from '../components/EmptyState';
import ProfileAvatar from '../components/ProfileAvatar';
import { useFollow } from '../hooks/useFollow';
import { useAuth, signInWithGoogle } from '../hooks/useAuth';

export default function WriterProfile() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [totalLikes, setTotalLikes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [signingIn, setSigningIn] = useState(false);

  const follow = useFollow({ writerId: profile?.id ?? '' });

  useEffect(() => {
    if (!username) return;
    loadWriter(username);
  }, [username]);

  async function loadWriter(handle: string) {
    setLoading(true);
    setError('');

    const { data: prof, error: profErr } = await supabase
      .from('profiles')
      .select('*')
      .ilike('username', handle)
      .eq('onboarding_complete', true)
      .maybeSingle();

    if (profErr || !prof) {
      setError('Writer not found.');
      setLoading(false);
      return;
    }

    setProfile(prof as Profile);

    const { data: storyData } = await supabase
      .from('stories')
      .select('*')
      .eq('user_id', prof.id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    const list = (storyData ?? []) as Story[];
    setStories(list);
    setTotalLikes(list.reduce((sum, s) => sum + (s.like_count ?? 0), 0));
    setLoading(false);
  }

  async function handleFollowClick() {
    if (!user) {
      setSigningIn(true);
      try {
        await signInWithGoogle(`/writer/${username}`);
      } catch {
        setSigningIn(false);
      }
      return;
    }
    await follow.toggle();
  }

  if (loading) {
    return (
      <div className="page-loading" aria-busy="true">
        <div className="spinner" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="page error-page">
        <h2>{error || 'Writer not found'}</h2>
        <Link to="/writers" className="btn btn-primary">Browse writers</Link>
      </div>
    );
  }

  const displayName = profile.display_name ?? profile.username ?? 'Writer';

  return (
    <div className="page writer-profile-page">
      <section className="writer-profile-header">
        <ProfileAvatar
          name={displayName}
          avatarUrl={profile.avatar_url}
          size="lg"
          className="writer-profile-avatar-img"
        />
        <div className="writer-profile-info">
          <h1 className="writer-profile-name">{displayName}</h1>
          <p className="writer-profile-handle">@{profile.username}</p>
          {profile.bio && <p className="writer-profile-bio">{profile.bio}</p>}
          <div className="writer-profile-stats">
            <span><strong>{stories.length}</strong> stories</span>
            <span><strong>{totalLikes.toLocaleString()}</strong> likes</span>
            <span><strong>{follow.followerCount.toLocaleString()}</strong> followers</span>
            <span>Member since {new Date(profile.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
          </div>
          {!follow.isSelf && (
            <div className="writer-profile-actions">
              <button
                type="button"
                className={`btn btn-sm ${follow.isFollowing ? 'btn-ghost' : 'btn-primary'}`}
                onClick={handleFollowClick}
                disabled={follow.busy || signingIn || follow.loading}
              >
                {signingIn
                  ? 'Redirecting...'
                  : follow.isFollowing
                    ? 'Following'
                    : 'Follow'}
              </button>
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="section-title">Published stories</h2>
        {stories.length === 0 ? (
          <EmptyState message="No published stories yet." />
        ) : (
          <div className="stories-grid">
            {stories.map((s) => <StoryCard key={s.id} story={s} />)}
          </div>
        )}
      </section>
    </div>
  );
}
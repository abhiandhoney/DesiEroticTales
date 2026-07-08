import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { fetchAuthorProfileBySlug, fetchStoriesForAuthorProfile } from '../lib/authorProfiles';
import type { AuthorProfile, Profile, Story } from '../types';
import StoryCard from '../components/StoryCard';
import EmptyState from '../components/EmptyState';
import ProfileAvatar from '../components/ProfileAvatar';
import { useFollow } from '../hooks/useFollow';
import { useAuth, signInWithGoogle } from '../hooks/useAuth';
import { usePageMeta } from '../hooks/usePageMeta';
import { buildPersonJsonLd, buildWebSiteJsonLd } from '../lib/seo';
import { getWriterPath } from '../lib/slug';
import { writerPageMeta } from '../lib/seoMeta';
import { authorProfileToDisplay } from '../lib/authorProfiles';

type WriterView =
  | { kind: 'user'; profile: Profile }
  | { kind: 'penName'; profile: AuthorProfile };

export default function WriterProfile() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const [writer, setWriter] = useState<WriterView | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [totalLikes, setTotalLikes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [signingIn, setSigningIn] = useState(false);

  const isPenName = writer?.kind === 'penName';
  const userProfile = writer?.kind === 'user' ? writer.profile : null;
  const penProfile = writer?.kind === 'penName' ? writer.profile : null;

  const follow = useFollow({ writerId: userProfile?.id ?? '' });

  const displayName = penProfile?.name ?? userProfile?.display_name ?? userProfile?.username ?? 'Writer';
  const handle = penProfile?.slug ?? userProfile?.username ?? '';
  const avatarUrl = penProfile?.avatar_url ?? userProfile?.avatar_url ?? null;
  const bio = penProfile?.bio ?? userProfile?.bio ?? null;
  const memberSince = penProfile?.created_at ?? userProfile?.created_at;

  const writerSeo = handle
    ? writerPageMeta(handle, displayName, bio)
    : null;

  usePageMeta({
    title: writerSeo?.title ?? 'Writer',
    description: writerSeo?.description,
    keywords: writerSeo?.keywords,
    path: handle ? getWriterPath(handle) : undefined,
    type: 'profile',
    jsonLd: handle
      ? [buildWebSiteJsonLd(window.location.origin), buildPersonJsonLd(handle, displayName)]
      : undefined,
  });

  useEffect(() => {
    if (!username) return;
    loadWriter(username);
  }, [username]);

  async function loadWriter(handle: string) {
    setLoading(true);
    setError('');

    const penName = await fetchAuthorProfileBySlug(handle);
    if (penName) {
      setWriter({ kind: 'penName', profile: penName });
      const list = await fetchStoriesForAuthorProfile(penName.id);
      setStories(list);
      setTotalLikes(list.reduce((sum, s) => sum + (s.like_count ?? 0), 0));
      setLoading(false);
      return;
    }

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

    setWriter({ kind: 'user', profile: prof as Profile });

    const { data: storyData } = await supabase
      .from('stories')
      .select('*')
      .eq('user_id', prof.id)
      .is('author_profile_id', null)
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

  if (error || !writer) {
    return (
      <div className="page error-page">
        <h2>{error || 'Writer not found'}</h2>
        <Link to="/writers" className="btn btn-primary">Browse writers</Link>
      </div>
    );
  }

  const authorDisplay = penProfile
    ? authorProfileToDisplay(penProfile)
    : userProfile?.username
      ? {
          slug: userProfile.username,
          displayName: userProfile.display_name ?? userProfile.username,
          avatarUrl: userProfile.avatar_url,
          isPenName: false,
        }
      : null;

  return (
    <div className="page writer-profile-page">
      <section className="writer-profile-header">
        <ProfileAvatar
          name={displayName}
          avatarUrl={avatarUrl}
          size="lg"
          className="writer-profile-avatar-img"
        />
        <div className="writer-profile-info">
          <h1 className="writer-profile-name">{displayName}</h1>
          <p className="writer-profile-handle">@{handle}</p>
          {bio && <p className="writer-profile-bio">{bio}</p>}
          <div className="writer-profile-stats">
            <span><strong>{stories.length}</strong> stories</span>
            <span><strong>{totalLikes.toLocaleString()}</strong> likes</span>
            {!isPenName && (
              <span><strong>{follow.followerCount.toLocaleString()}</strong> followers</span>
            )}
            {memberSince && (
              <span>
                Member since{' '}
                {new Date(memberSince).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
              </span>
            )}
          </div>
          {!isPenName && !follow.isSelf && (
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
            {stories.map((s) => (
              <StoryCard
                key={s.id}
                story={s}
                authorDisplay={authorDisplay ?? undefined}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
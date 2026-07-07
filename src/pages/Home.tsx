import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Story } from '../types';
import StoryCard from '../components/StoryCard';
import StoryFilters from '../components/StoryFilters';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../hooks/useAuth';
import { getStoryTeaser } from '../lib/storyTeaser';
import { fetchEditorsChoice, fetchStoryOfTheMonth, fetchStoryOfTheWeek } from '../lib/rankings';
import SafeImage from '../components/SafeImage';
import { getCardImageUrl } from '../lib/storyMedia';
import { fetchStoryAuthors, type AuthorMap } from '../lib/storyAuthors';
import { LikeStat } from '../components/LikeIcon';


const LATEST_LIMIT = 8;

export default function Home() {
  const { isWriter } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [storyOfWeek, setStoryOfWeek] = useState<Story | null>(null);
  const [storyOfMonth, setStoryOfMonth] = useState<Story | null>(null);
  const [editorsChoice, setEditorsChoice] = useState<Story[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('');
  const [authors, setAuthors] = useState<AuthorMap>({});

  useEffect(() => {
    fetchStories();
    if (!category) {
      fetchStoryOfTheWeek().then(setStoryOfWeek);
      fetchStoryOfTheMonth().then(setStoryOfMonth);
      fetchEditorsChoice(4).then(setEditorsChoice);
    }
  }, [category]);

  useEffect(() => {
    const ids = [...editorsChoice, ...stories].map((s) => s.user_id);
    if (ids.length) fetchStoryAuthors(ids).then((m) => setAuthors((prev) => ({ ...prev, ...m })));
  }, [editorsChoice, stories]);

  async function fetchStories() {
    setLoading(true);
    setError('');

    let countQuery = supabase
      .from('stories')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved');
    if (category) countQuery = countQuery.eq('category', category);

    let query = supabase.from('stories').select('*').eq('status', 'approved')
      .order('created_at', { ascending: false }).limit(LATEST_LIMIT);
    if (category) query = query.eq('category', category);

    const [{ count }, { data, error: fetchError }] = await Promise.all([countQuery, query]);

    if (fetchError) {
      setError('Could not load stories. Please try again.');
      setLoading(false);
      return;
    }

    const list = data ?? [];
    setStories(list);
    setTotalCount(count ?? list.length);
    if (list.length) {
      fetchStoryAuthors(list.map((s) => s.user_id)).then(setAuthors);
    }
    setLoading(false);
  }

  const featured = storyOfWeek;

  return (
    <div className="page home-page">
      <section className="hero">
        <div className="hero-glow" />
        <h1 className="hero-title">
          <span className="telugu-text" lang="te" title="Secret stories">రహస్య కథలు</span>
          <span className="hero-telugu-meaning">Secret Stories</span><br />
          Stories that whisper after dark
        </h1>
        <p className="hero-subtitle">
          Telugu & Desi tales of desire, tension, and slow-burn passion.<br />
          Read free. Return often. Let the night unfold.
        </p>
        <div className="hero-stats">
          <span>{totalCount > 0 ? `${totalCount}+` : 'New'} stories</span>
          <span> | </span>
          <Link to="/writers" className="hero-writers-link">Top writers</Link>
        </div>
        <div className="hero-actions">
          <Link to="/stories" className="btn btn-primary btn-lg">Browse stories</Link>
          {isWriter ? (
            <Link to="/submit" className="btn btn-ghost btn-lg">Submit a tale</Link>
          ) : (
            <Link to="/stories" className="btn btn-ghost btn-lg">Start reading</Link>
          )}
        </div>
      </section>

      {featured && !category && !loading && (
        <section className="featured-story">
          <h2 className="section-title">Story of the Week</h2>
          <Link to={`/story/${featured.id}`} className="featured-story-card">
            <div className="featured-story-image">
              {getCardImageUrl(featured) ? (
                <SafeImage src={getCardImageUrl(featured)!} alt={featured.title} loading="eager" />
              ) : (
                <div className="safe-image-fallback" />
              )}
            </div>
            <div className="featured-story-body">
              <span className="story-category">Most liked this week · {featured.category}</span>
              <h3 className="featured-story-title">{featured.title}</h3>
              <p className="featured-story-teaser">{getStoryTeaser(featured, 180)}</p>
              <span className="featured-story-cta">
                <LikeStat count={featured.like_count ?? 0} />
                <span className="featured-story-cta-sep"> · </span>
                Read now &rarr;
              </span>
            </div>
          </Link>
        </section>
      )}

      {storyOfMonth && storyOfMonth.id !== featured?.id && !category && !loading && (
        <section className="featured-story story-of-month">
          <h2 className="section-title">Story of the Month</h2>
          <Link to={`/story/${storyOfMonth.id}`} className="featured-story-card featured-story-card-alt">
            <div className="featured-story-image">
              {getCardImageUrl(storyOfMonth) ? (
                <SafeImage src={getCardImageUrl(storyOfMonth)!} alt={storyOfMonth.title} loading="lazy" />
              ) : (
                <div className="safe-image-fallback" />
              )}
            </div>
            <div className="featured-story-body">
              <span className="story-category">Most liked this month · {storyOfMonth.category}</span>
              <h3 className="featured-story-title">{storyOfMonth.title}</h3>
              <p className="featured-story-teaser">{getStoryTeaser(storyOfMonth, 180)}</p>
              <span className="featured-story-cta">
                <LikeStat count={storyOfMonth.like_count ?? 0} />
                <span className="featured-story-cta-sep"> · </span>
                Read now &rarr;
              </span>
            </div>
          </Link>
        </section>
      )}

      {editorsChoice.length > 0 && !category && (
        <section className="editors-choice-section home-section">
          <h2 className="section-title">Editor&apos;s Choice</h2>
          <div className="stories-grid stories-grid-compact">
            {editorsChoice.map((s) => (
              <StoryCard key={s.id} story={s} badge="Editor's Choice" authorUsername={authors[s.user_id]?.username} />
            ))}
          </div>
        </section>
      )}

      {!category && (
        <section className="home-cta-strip" aria-label="Get started">
          <div className="home-cta-strip-inner">
            <div className="home-cta-copy">
              <h2 className="home-cta-title">Ready for your next late-night read?</h2>
              <p className="home-cta-sub">Browse hundreds of Telugu &amp; Desi tales — or join our writers and share your own.</p>
            </div>
            <div className="home-cta-actions">
              <Link to="/stories" className="btn btn-primary">Browse stories</Link>
              <Link to="/writers" className="btn btn-ghost">Meet top writers</Link>
              {isWriter && <Link to="/submit" className="btn btn-ghost">Submit a tale</Link>}
            </div>
          </div>
        </section>
      )}

      <div className="ad-slot ad-slot-top" data-adsterra="top-banner">{/* ADSTERRA */}</div>

      <StoryFilters category={category} onCategoryChange={setCategory} />

      <section className="stories-grid-section">
        <h2 className="section-title">Latest Tales</h2>
        {error ? (
          <EmptyState
            message={error}
            action={<button type="button" className="btn btn-ghost" onClick={fetchStories}>Retry</button>}
          />
        ) : loading ? (
          <div className="stories-grid" aria-busy="true">
            {Array.from({ length: LATEST_LIMIT }).map((_, i) => (
              <div key={i} className="skeleton skeleton-card" />
            ))}
          </div>
        ) : stories.length === 0 ? (
          <EmptyState
            message={category ? 'No stories match your filter.' : 'No stories yet. Check back soon.'}
            action={category ? <button type="button" className="btn btn-ghost" onClick={() => setCategory('')}>Clear filter</button> : undefined}
          />
        ) : (
          <>
            <div className="stories-grid">{stories.map((s) => (
              <StoryCard key={s.id} story={s} authorUsername={authors[s.user_id]?.username} />
            ))}</div>
            {totalCount > LATEST_LIMIT && (
              <div className="section-cta">
                <Link to="/stories" className="btn btn-primary btn-lg">View all {totalCount} stories &rarr;</Link>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
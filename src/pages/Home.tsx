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
import { fetchStoryAuthorDisplays } from '../lib/storyAuthors';
import type { StoryAuthorDisplay } from '../types';
import { LikeStat } from '../components/LikeIcon';
import { getStoryPath } from '../lib/slug';
import AdSlot from '../components/AdSlot';
import { applyCategoryFilter } from '../lib/categoryQuery';
import { normalizeCategory, type StoryCategory } from '../lib/categories';
import { STORY_LIST_COLUMNS } from '../lib/storyListColumns';

import { usePageMeta } from '../hooks/usePageMeta';
import { HOME_META } from '../lib/seoMeta';
import { buildWebSiteJsonLd, buildOrganizationJsonLd, buildItemListJsonLd } from '../lib/seo';


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
  const [authors, setAuthors] = useState<Record<string, StoryAuthorDisplay>>({});
  const featured = storyOfWeek;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');

      let countQuery = supabase
        .from('stories')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved');
      if (category) {
        const cat = normalizeCategory(category) as StoryCategory;
        countQuery = applyCategoryFilter(countQuery, cat);
      }

      let query = supabase.from('stories').select(STORY_LIST_COLUMNS).eq('status', 'approved')
        .order('created_at', { ascending: false }).limit(LATEST_LIMIT);
      if (category) {
        const cat = normalizeCategory(category) as StoryCategory;
        query = applyCategoryFilter(query, cat);
      }

      const [{ count }, { data, error: fetchError }] = await Promise.all([countQuery, query]);

      if (cancelled) return;

      if (fetchError) {
        setError('Could not load stories. Please try again.');
        setLoading(false);
        return;
      }

      const list = (data ?? []) as Story[];
      setStories(list);
      setTotalCount(count ?? list.length);
      if (list.length) fetchStoryAuthorDisplays(list).then((m) => { if (!cancelled) setAuthors(m); });
      setLoading(false);
    }

    void load();

    if (!category) {
      fetchStoryOfTheWeek().then((s) => { if (!cancelled) setStoryOfWeek(s); });
      fetchStoryOfTheMonth().then((s) => { if (!cancelled) setStoryOfMonth(s); });
      fetchEditorsChoice(4).then((s) => { if (!cancelled) setEditorsChoice(s); });
    }

    return () => { cancelled = true; };
  }, [category]);

  useEffect(() => {
    const all = [
      ...editorsChoice,
      ...stories,
      ...(featured ? [featured] : []),
      ...(storyOfMonth ? [storyOfMonth] : []),
    ];
    if (all.length) {
      fetchStoryAuthorDisplays(all).then((m) => setAuthors((prev) => ({ ...prev, ...m })));
    }
  }, [editorsChoice, stories, featured, storyOfMonth]);

  const origin = window.location.origin;
  const featuredList = featured
    ? [{ name: featured.title, path: getStoryPath(featured) }]
    : [];
  const editorsList = editorsChoice.map((s) => ({ name: s.title, path: getStoryPath(s) }));

  usePageMeta({
    title: HOME_META.title,
    description: HOME_META.description,
    keywords: HOME_META.keywords,
    path: HOME_META.path,
    jsonLd: [
      buildOrganizationJsonLd(origin),
      buildWebSiteJsonLd(origin),
      ...(featuredList.length
        ? [buildItemListJsonLd('Story of the Week', featuredList)]
        : []),
      ...(editorsList.length
        ? [buildItemListJsonLd("Editor's Choice", editorsList)]
        : []),
    ],
  });

  return (
    <div className="page home-page">
      <section className="hero">
        <div className="hero-glow" />
        <h1 className="hero-title">
          Telugu Sex Stories &amp; Slow-Burn Desi Erotica
        </h1>
        <p className="hero-subtitle hero-subtitle-poetic">
          <span className="telugu-text" lang="te" title="Stories">కథలు</span>
          {' '}— Telugu &amp; Desi erotic fiction
        </p>
        <p className="hero-subtitle">
          Kamakathalu and boothu kathalu across 20+ categories — aunty, akka chelli, office, college, and more.<br />
          Curated stories from community writers. Updated regularly.
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
          <Link to={getStoryPath(featured)} className="featured-story-card">
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
              {authors[featured.id] && (
                <p className="featured-story-author">
                  By {authors[featured.id].displayName}
                </p>
              )}
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
          <Link to={getStoryPath(storyOfMonth)} className="featured-story-card featured-story-card-alt">
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
              {authors[storyOfMonth.id] && (
                <p className="featured-story-author">
                  By {authors[storyOfMonth.id].displayName}
                </p>
              )}
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
              <StoryCard key={s.id} story={s} badge="Editor's Choice" authorDisplay={authors[s.id]} />
            ))}
          </div>
        </section>
      )}

      {!category && (
        <section className="home-cta-strip" aria-label="Get started">
          <div className="home-cta-strip-inner">
            <div className="home-cta-copy">
              <h2 className="home-cta-title">Explore the story library</h2>
              <p className="home-cta-sub">Browse by category or writer — or submit your own tale for review.</p>
            </div>
            <div className="home-cta-actions">
              <Link to="/stories" className="btn btn-primary">Browse stories</Link>
              <Link to="/writers" className="btn btn-ghost">Meet top writers</Link>
              {isWriter && <Link to="/submit" className="btn btn-ghost">Submit a tale</Link>}
            </div>
          </div>
        </section>
      )}

      <AdSlot slot="top-banner" className="ad-slot-top" />

      <StoryFilters category={category} onCategoryChange={setCategory} />

      <section className="stories-grid-section">
        <h2 className="section-title">Latest Tales</h2>
        {error ? (
          <EmptyState
            message={error}
            action={<button type="button" className="btn btn-ghost" onClick={() => window.location.reload()}>Retry</button>}
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
              <StoryCard key={s.id} story={s} authorDisplay={authors[s.id]} />
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
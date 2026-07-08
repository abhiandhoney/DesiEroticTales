import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Story } from '../types';
import StoryCard from '../components/StoryCard';
import EmptyState from '../components/EmptyState';
import { fetchStoryAuthorDisplays } from '../lib/storyAuthors';
import type { StoryAuthorDisplay } from '../types';
import { usePageMeta } from '../hooks/usePageMeta';
import { buildCollectionJsonLd, buildWebSiteJsonLd, buildCategoryFaqJsonLd } from '../lib/seo';
import { getCategoryPath, slugToCategory } from '../lib/slug';
import { categoryPageMeta } from '../lib/seoMeta';
import CategoryIntro from '../components/CategoryIntro';
import StoryFilters from '../components/StoryFilters';
import { keywordsForCategory, phraseForCategory } from '../lib/seoKeywords';
import { STORY_CATEGORIES, type StoryCategory } from '../types';
import AdSlot from '../components/AdSlot';
import { STORY_LIST_COLUMNS } from '../lib/storyListColumns';

const PAGE_SIZE = 24;

export default function CategoryArchive() {
  const navigate = useNavigate();
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const category = categorySlug ? slugToCategory(categorySlug) : null;
  const [stories, setStories] = useState<Story[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [authors, setAuthors] = useState<Record<string, StoryAuthorDisplay>>({});

  const meta = category ? categoryPageMeta(category, totalCount) : null;
  const path = categorySlug ? getCategoryPath(category ?? categorySlug) : '/stories';

  usePageMeta({
    title: meta?.title ?? 'Category',
    description: meta?.description ?? 'Story category archive.',
    keywords: category ? keywordsForCategory(category) : undefined,
    path,
    type: 'website',
    jsonLd: category && meta
      ? [
          buildWebSiteJsonLd(window.location.origin),
          buildCollectionJsonLd(meta.title, meta.description, path),
          buildCategoryFaqJsonLd(category, totalCount),
        ]
      : undefined,
  });

  useEffect(() => {
    if (!category) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      const [{ count }, { data, error }] = await Promise.all([
        supabase
          .from('stories')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'approved')
          .eq('category', category),
        supabase
          .from('stories')
          .select(STORY_LIST_COLUMNS)
          .eq('status', 'approved')
          .eq('category', category)
          .order('created_at', { ascending: false })
          .limit(PAGE_SIZE),
      ]);

      if (cancelled) return;

      if (error) {
        setError('Could not load stories for this category.');
        setStories([]);
        setLoading(false);
        return;
      }
      setError('');

      const list = (data ?? []) as Story[];
      setStories(list);
      setTotalCount(count ?? 0);
      if (list.length) fetchStoryAuthorDisplays(list).then(setAuthors);
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [category]);

  if (!category) {
    return (
      <div className="page error-page">
        <h2>Category not found</h2>
        <Link to="/stories" className="btn btn-primary">Browse all stories</Link>
      </div>
    );
  }

  return (
    <div className="page category-archive-page">
      <header className="page-header">
        <p className="story-back-link">
          <Link to="/stories">&larr; All stories</Link>
        </p>
        <h1>{phraseForCategory(category)}</h1>
        <CategoryIntro category={category} storyCount={totalCount} />
        <h2 className="visually-hidden">Stories in {category}</h2>
      </header>

      <StoryFilters
        category={category}
        onCategoryChange={(next) => {
          if (!next) navigate('/stories');
          else if ((STORY_CATEGORIES as readonly string[]).includes(next)) {
            navigate(getCategoryPath(next as StoryCategory));
          }
        }}
      />
      <AdSlot slot="stories-list" />

      {loading ? (
        <div className="stories-grid" aria-busy="true">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton skeleton-card" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          message={error}
          action={<button type="button" className="btn btn-ghost" onClick={() => window.location.reload()}>Retry</button>}
        />
      ) : stories.length === 0 ? (
        <EmptyState message="No stories in this category yet." action={<Link to="/stories" className="btn btn-ghost">Browse all</Link>} />
      ) : (
        <div className="stories-grid">
          {stories.map((s) => (
            <StoryCard key={s.id} story={s} authorDisplay={authors[s.id]} />
          ))}
        </div>
      )}
    </div>
  );
}
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getCategoryPath } from '../lib/slug';
import type { Story } from '../types';
import StoryCard from './StoryCard';
import { fetchStoryAuthorDisplays } from '../lib/storyAuthors';
import type { StoryAuthorDisplay } from '../types';
import { STORY_LIST_COLUMNS } from '../lib/storyListColumns';

const PAGE_SIZE = 4;

interface RelatedStoriesSectionProps {
  storyId: string;
  category: string;
}

export default function RelatedStoriesSection({ storyId, category }: RelatedStoriesSectionProps) {
  const [popular, setPopular] = useState<Story[]>([]);
  const [recent, setRecent] = useState<Story[]>([]);
  const [authors, setAuthors] = useState<Record<string, StoryAuthorDisplay>>({});
  const [popularPage, setPopularPage] = useState(0);
  const [recentPage, setRecentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setPopularPage(0);
    setRecentPage(0);

    Promise.all([
      supabase
        .from('stories')
        .select(STORY_LIST_COLUMNS)
        .eq('status', 'approved')
        .eq('category', category)
        .neq('id', storyId)
        .order('like_count', { ascending: false })
        .limit(24),
      supabase
        .from('stories')
        .select(STORY_LIST_COLUMNS)
        .eq('status', 'approved')
        .eq('category', category)
        .neq('id', storyId)
        .order('created_at', { ascending: false })
        .limit(24),
    ]).then(([popRes, recRes]) => {
      if (popRes.error || recRes.error) {
        setError('Could not load related stories.');
        setLoading(false);
        return;
      }
      const pop = (popRes.data ?? []) as Story[];
      const rec = (recRes.data ?? []) as Story[];
      setPopular(pop);
      setRecent(rec);
      setError('');
      const all = [...pop, ...rec];
      if (all.length) fetchStoryAuthorDisplays(all).then(setAuthors);
      setLoading(false);
    });
  }, [storyId, category]);

  if (loading) {
    return (
      <div className="related-stories-loading page-loading-inline" aria-busy="true">
        <div className="spinner" />
      </div>
    );
  }

  if (error) return null;
  if (popular.length === 0 && recent.length === 0) return null;

  return (
    <div className="related-stories-wrap">
      {popular.length > 0 && (
        <PaginatedStoryBlock
          title={`Popular in ${category}`}
          stories={popular}
          page={popularPage}
          onPageChange={setPopularPage}
          authors={authors}
        />
      )}
      {recent.length > 0 && (
        <PaginatedStoryBlock
          title={`More ${category} tales`}
          stories={recent}
          page={recentPage}
          onPageChange={setRecentPage}
          authors={authors}
        />
      )}
      <p className="related-stories-category-link">
        <Link to={getCategoryPath(category)}>View all {category} Telugu sex stories &rarr;</Link>
      </p>
    </div>
  );
}

function PaginatedStoryBlock({
  title,
  stories,
  page,
  onPageChange,
  authors,
}: {
  title: string;
  stories: Story[];
  page: number;
  onPageChange: (p: number) => void;
  authors: Record<string, StoryAuthorDisplay>;
}) {
  const totalPages = Math.ceil(stories.length / PAGE_SIZE);
  const slice = stories.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <section className="related-stories">
      <div className="related-stories-header">
        <h2 className="section-title">{title}</h2>
        {totalPages > 1 && (
          <div className="pagination-controls" role="navigation" aria-label={`${title} pages`}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={page === 0}
              onClick={() => onPageChange(page - 1)}
              aria-label="Previous page"
            >
              &#8249; Prev
            </button>
            <span className="pagination-label">
              {page + 1} / {totalPages}
            </span>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={page >= totalPages - 1}
              onClick={() => onPageChange(page + 1)}
              aria-label="Next page"
            >
              Next &#8250;
            </button>
          </div>
        )}
      </div>
      <div className="stories-grid stories-grid-compact">
        {slice.map((s) => (
          <StoryCard key={s.id} story={s} authorDisplay={authors[s.id]} />
        ))}
      </div>
    </section>
  );
}
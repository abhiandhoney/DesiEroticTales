import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getCategoryPath } from '../lib/slug';
import type { Story } from '../types';
import StoryCard from './StoryCard';
import { fetchStoryAuthors, type AuthorMap } from '../lib/storyAuthors';

const PAGE_SIZE = 4;

interface RelatedStoriesSectionProps {
  storyId: string;
  category: string;
}

export default function RelatedStoriesSection({ storyId, category }: RelatedStoriesSectionProps) {
  const [popular, setPopular] = useState<Story[]>([]);
  const [recent, setRecent] = useState<Story[]>([]);
  const [authors, setAuthors] = useState<AuthorMap>({});
  const [popularPage, setPopularPage] = useState(0);
  const [recentPage, setRecentPage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setPopularPage(0);
    setRecentPage(0);

    Promise.all([
      supabase
        .from('stories')
        .select('*')
        .eq('status', 'approved')
        .eq('category', category)
        .neq('id', storyId)
        .order('like_count', { ascending: false })
        .limit(24),
      supabase
        .from('stories')
        .select('*')
        .eq('status', 'approved')
        .eq('category', category)
        .neq('id', storyId)
        .order('created_at', { ascending: false })
        .limit(24),
    ]).then(([popRes, recRes]) => {
      const pop = (popRes.data ?? []) as Story[];
      const rec = (recRes.data ?? []) as Story[];
      setPopular(pop);
      setRecent(rec);
      const ids = [...pop, ...rec].map((s) => s.user_id);
      if (ids.length) fetchStoryAuthors(ids).then(setAuthors);
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
  authors: AuthorMap;
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
          <StoryCard key={s.id} story={s} authorUsername={authors[s.user_id]?.username} />
        ))}
      </div>
    </section>
  );
}
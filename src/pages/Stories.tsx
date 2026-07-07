import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Story } from '../types';
import StoryCard from '../components/StoryCard';
import StoryFilters from '../components/StoryFilters';
import ResultsMeta from '../components/ResultsMeta';
import EmptyState from '../components/EmptyState';
import { fetchStoryAuthors, type AuthorMap } from '../lib/storyAuthors';

export default function Stories() {
  const [stories, setStories] = useState<Story[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState<'newest' | 'popular' | 'top_rated' | 'trending'>('newest');
  const [page, setPage] = useState(0);
  const [authors, setAuthors] = useState<AuthorMap>({});
  const PAGE_SIZE = 24;

  useEffect(() => {
    setPage(0);
    fetchStories(true);
  }, [category, sort, search]);

  useEffect(() => {
    if (page > 0) fetchStories(false);
  }, [page]);

  async function fetchStories(reset = false) {
    if (reset) {
      setLoading(true);
      setStories([]);
    } else {
      setLoadingMore(true);
    }
    setError('');

    let countQuery = supabase
      .from('stories')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved');

    let query = supabase.from('stories').select('*').eq('status', 'approved');

    if (category) {
      countQuery = countQuery.eq('category', category);
      query = query.eq('category', category);
    }
    if (search.trim()) {
      const q = `%${search}%`;
      const orFilter = `title.ilike.${q},teaser.ilike.${q},category.ilike.${q}`;
      countQuery = countQuery.or(orFilter);
      query = query.or(orFilter);
    }

    if (sort === 'popular') {
      query = query.order('views', { ascending: false });
    } else if (sort === 'top_rated') {
      query = query.order('like_count', { ascending: false });
    } else if (sort === 'trending') {
      const since = new Date();
      since.setDate(since.getDate() - 30);
      query = query.gte('created_at', since.toISOString()).order('like_count', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const currentPage = reset ? 0 : page;
    query = query.range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);

    const [{ count }, { data, error: fetchError }] = await Promise.all([countQuery, query]);

    if (fetchError) {
      setError('Could not load stories. Please try again.');
      setLoading(false);
      setLoadingMore(false);
      return;
    }

    const list = data ?? [];
    setStories((prev) => {
      const next = reset ? list : [...prev, ...list];
      if (next.length) fetchStoryAuthors(next.map((s) => s.user_id)).then(setAuthors);
      return next;
    });
    if (reset) setTotalCount(count ?? 0);
    setLoading(false);
    setLoadingMore(false);
  }

  const hasMore = stories.length < totalCount;

  return (
    <div className="page stories-page">
      <header className="page-header">
        <h1>All Stories</h1>
        <p className="page-subtitle">
          Browse every approved tale | <span className="telugu-text" lang="te" title="All stories">అన్ని కథలు</span>
        </p>
      </header>

      <StoryFilters
        search={search}
        onSearchChange={setSearch}
        category={category}
        onCategoryChange={setCategory}
        searchPlaceholder="Search by title or teaser..."
        sort={sort}
        onSortChange={setSort}
      />

      <div className="ad-slot ad-slot-inline" data-adsterra="stories-list">{/* ADSTERRA */}</div>

      {error ? (
        <EmptyState
          message={error}
          action={
            <button type="button" className="btn btn-ghost" onClick={() => fetchStories(true)}>
              Retry
            </button>
          }
        />
      ) : loading ? (
        <div className="stories-grid" aria-busy="true">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <div key={i} className="skeleton skeleton-card" />
          ))}
        </div>
      ) : stories.length === 0 ? (
        <EmptyState
          message="No stories match your search or filter."
          action={
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => { setSearch(''); setCategory(''); setSort('newest'); setPage(0); }}
            >
              Clear filters
            </button>
          }
        />
      ) : (
        <>
          <ResultsMeta showing={stories.length} total={totalCount} />
          <div className="stories-grid">{stories.map((s) => (
            <StoryCard key={s.id} story={s} authorUsername={authors[s.user_id]?.username} />
          ))}</div>
          {hasMore && (
            <div className="section-cta">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setPage((p) => p + 1)}
                disabled={loadingMore}
              >
                {loadingMore ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
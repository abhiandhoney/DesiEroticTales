import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Story } from '../types';
import StoryCard from '../components/StoryCard';
import StoryFilters from '../components/StoryFilters';

export default function Home() {
  const [stories, setStories] = useState<Story[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    fetchStories();
  }, [category]);

  async function fetchStories() {
    setLoading(true);
    setError('');

    let countQuery = supabase
      .from('stories')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved');
    if (category) countQuery = countQuery.eq('category', category);

    let query = supabase.from('stories').select('*').eq('status', 'approved')
      .order('created_at', { ascending: false }).limit(24);
    if (category) query = query.eq('category', category);

    const [{ count }, { data, error: fetchError }] = await Promise.all([countQuery, query]);

    if (fetchError) {
      setError('Could not load stories. Please try again.');
      setLoading(false);
      return;
    }

    setStories(data ?? []);
    setTotalCount(count ?? data?.length ?? 0);
    setLoading(false);
  }

  const filtered = stories.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      (s.teaser?.toLowerCase().includes(q) ?? false) ||
      s.content.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q)
    );
  });

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
          <span>Fresh tales added regularly</span>
        </div>
      </section>

      <div className="ad-slot ad-slot-top" data-adsterra="top-banner">{/* ADSTERRA */}</div>

      <StoryFilters
        search={search}
        onSearchChange={setSearch}
        category={category}
        onCategoryChange={setCategory}
        searchPlaceholder="Search latest stories..."
      />

      <section className="stories-grid-section">
        <h2 className="section-title">Latest Tales</h2>
        {error ? (
          <div className="empty-state">
            <p>{error}</p>
            <button type="button" className="btn btn-ghost empty-state-action" onClick={fetchStories}>
              Retry
            </button>
          </div>
        ) : loading ? (
          <div className="page-loading" aria-busy="true"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            {search.trim() || category ? (
              <>
                <p>No stories match your search or filter.</p>
                <button
                  type="button"
                  className="btn btn-ghost empty-state-action"
                  onClick={() => { setSearch(''); setCategory(''); }}
                >
                  Clear filters
                </button>
              </>
            ) : (
              <p>No stories yet. Check back soon — new tales are brewing.</p>
            )}
          </div>
        ) : (
          <>
            {search.trim() && (
              <p className="search-hint">
                Showing matches from the latest {stories.length} stories.{' '}
                <Link to="/stories">Browse all stories</Link> for the full library.
              </p>
            )}
            <div className="stories-grid">{filtered.map((s) => <StoryCard key={s.id} story={s} />)}</div>
          </>
        )}
      </section>
    </div>
  );
}
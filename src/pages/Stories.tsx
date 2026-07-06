import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Story } from '../types';
import StoryCard from '../components/StoryCard';
import StoryFilters from '../components/StoryFilters';

export default function Stories() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState<'newest' | 'popular'>('newest');

  useEffect(() => { fetchStories(); }, [category, sort]);

  async function fetchStories() {
    setLoading(true);
    let query = supabase.from('stories').select('*').eq('status', 'approved');
    if (category) query = query.eq('category', category);
    query = sort === 'popular'
      ? query.order('views', { ascending: false })
      : query.order('created_at', { ascending: false });
    const { data } = await query;
    if (data) setStories(data);
    setLoading(false);
  }

  const filtered = stories.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      (s.teaser?.toLowerCase().includes(q) ?? false) ||
      s.content.toLowerCase().includes(q)
    );
  });

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

      {loading ? (
        <div className="page-loading"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <p>No stories match your search or filter.</p>
          <button
            type="button"
            className="btn btn-ghost empty-state-action"
            onClick={() => { setSearch(''); setCategory(''); setSort('newest'); }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="stories-grid">{filtered.map((s) => <StoryCard key={s.id} story={s} />)}</div>
      )}
    </div>
  );
}
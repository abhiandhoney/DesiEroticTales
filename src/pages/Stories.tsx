import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Story } from '../types';
import { STORY_CATEGORIES } from '../types';
import StoryCard from '../components/StoryCard';

export default function Stories() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState<'newest' | 'popular'>('newest');

  useEffect(() => {
    fetchStories();
  }, [category, sort]);

  async function fetchStories() {
    setLoading(true);
    let query = supabase
      .from('stories')
      .select('*')
      .eq('status', 'approved');

    if (category) query = query.eq('category', category);

    query = sort === 'popular'
      ? query.order('views', { ascending: false })
      : query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (!error && data) setStories(data);
    setLoading(false);
  }

  const filtered = stories.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      s.content.toLowerCase().includes(q)
    );
  });

  return (
    <div className="page stories-page">
      <header className="page-header">
        <h1>All Stories</h1>
        <p className="page-subtitle">Browse every approved tale · అన్ని కథలు</p>
      </header>

      <div className="filters-section">
        <input
          type="search"
          placeholder="Search by title or content…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input"
        />
        <div className="filter-row">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="select"
          >
            <option value="">All categories</option>
            {STORY_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as 'newest' | 'popular')}
            className="select"
          >
            <option value="newest">Newest first</option>
            <option value="popular">Most read</option>
          </select>
        </div>
        <div className="category-filters">
          {STORY_CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`filter-chip ${category === cat ? 'active' : ''}`}
              onClick={() => setCategory(category === cat ? '' : cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ADSTERRA: Sidebar / inline ad placement */}
      <div className="ad-slot ad-slot-inline" data-adsterra="stories-list">
        {/* Insert Adsterra ad unit here */}
      </div>

      {loading ? (
        <div className="page-loading"><div className="spinner" /></div>
      ) : (
        <div className="stories-grid">
          {filtered.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <p className="empty-state">No stories match your search.</p>
      )}
    </div>
  );
}
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Story } from '../types';
import StoryCard from '../components/StoryCard';
import StoryFilters from '../components/StoryFilters';

export default function Home() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => { fetchStories(); }, [category]);

  async function fetchStories() {
    setLoading(true);
    let query = supabase.from('stories').select('*').eq('status', 'approved')
      .order('created_at', { ascending: false }).limit(24);
    if (category) query = query.eq('category', category);
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
          <span>{stories.length}+ stories</span><span> | </span><span>Updated daily</span>
        </div>
      </section>

      <div className="ad-slot ad-slot-top" data-adsterra="top-banner">{/* ADSTERRA */}</div>

      <StoryFilters
        search={search}
        onSearchChange={setSearch}
        category={category}
        onCategoryChange={setCategory}
        searchPlaceholder="Search stories..."
      />

      <section className="stories-grid-section">
        <h2 className="section-title">Latest Tales</h2>
        {loading ? (
          <div className="page-loading"><div className="spinner" /></div>
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
              <p>No stories yet. Check back soon - new tales are brewing.</p>
            )}
          </div>
        ) : (
          <div className="stories-grid">{filtered.map((s) => <StoryCard key={s.id} story={s} />)}</div>
        )}
      </section>
    </div>
  );
}
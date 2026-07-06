import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Story } from '../types';
import { STORY_CATEGORIES } from '../types';
import StoryCard from '../components/StoryCard';

export default function Home() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    fetchStories();
  }, [category]);

  async function fetchStories() {
    setLoading(true);
    let query = supabase
      .from('stories')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(24);

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (!error && data) setStories(data);
    setLoading(false);
  }

  const filtered = stories.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      s.content.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="page home-page">
      <section className="hero">
        <div className="hero-glow" />
        <h1 className="hero-title">
          <span className="telugu-text">రహస్య కథలు</span>
          <br />
          Stories that whisper after dark
        </h1>
        <p className="hero-subtitle">
          Telugu & Desi tales of desire, tension, and slow-burn passion.
          <br />
          Read free. Return often. Let the night unfold.
        </p>
        <div className="hero-stats">
          <span>{stories.length}+ stories</span>
          <span>·</span>
          <span>Updated daily</span>
        </div>
      </section>

      {/* ADSTERRA: Top banner ad placement */}
      <div className="ad-slot ad-slot-top" data-adsterra="top-banner">
        {/* Insert Adsterra script / ad unit here */}
      </div>

      <section className="filters-section">
        <div className="search-bar">
          <input
            type="search"
            placeholder="Search stories…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input"
          />
        </div>
        <div className="category-filters">
          <button
            className={`filter-chip ${category === '' ? 'active' : ''}`}
            onClick={() => setCategory('')}
          >
            All
          </button>
          {STORY_CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`filter-chip ${category === cat ? 'active' : ''}`}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      <section className="stories-grid-section">
        <h2 className="section-title">Latest Tales</h2>
        {loading ? (
          <div className="page-loading">
            <div className="spinner" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="empty-state">
            No stories found. Check back soon — new tales are brewing.
          </p>
        ) : (
          <div className="stories-grid">
            {filtered.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
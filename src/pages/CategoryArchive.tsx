import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Story } from '../types';
import StoryCard from '../components/StoryCard';
import EmptyState from '../components/EmptyState';
import { fetchStoryAuthors, type AuthorMap } from '../lib/storyAuthors';
import { usePageMeta } from '../hooks/usePageMeta';
import { buildCollectionJsonLd, buildWebSiteJsonLd } from '../lib/seo';
import { getCategoryPath, slugToCategory } from '../lib/slug';
import { categoryPageMeta } from '../lib/seoMeta';
import CategoryNav from '../components/CategoryNav';
import { keywordsForCategory } from '../lib/seoKeywords';
import AdSlot from '../components/AdSlot';

const PAGE_SIZE = 24;

export default function CategoryArchive() {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const category = categorySlug ? slugToCategory(categorySlug) : null;
  const [stories, setStories] = useState<Story[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [authors, setAuthors] = useState<AuthorMap>({});

  const meta = category ? categoryPageMeta(category) : null;
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
          .select('id, title, teaser, content, category, status, user_id, image_url, card_image_url, gallery_urls, views, like_count, dislike_count, is_editors_choice, editors_choice_at, slug, tags, created_at, updated_at')
          .eq('status', 'approved')
          .eq('category', category)
          .order('created_at', { ascending: false })
          .limit(PAGE_SIZE),
      ]);

      if (cancelled) return;

      if (error) {
        setStories([]);
        setLoading(false);
        return;
      }

      const list = (data ?? []) as Story[];
      setStories(list);
      setTotalCount(count ?? 0);
      if (list.length) fetchStoryAuthors(list.map((s) => s.user_id)).then(setAuthors);
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
        <h1>{meta?.title ?? category}</h1>
        <p className="page-subtitle">
          {totalCount.toLocaleString()} free Telugu sex {totalCount === 1 ? 'story' : 'stories'} in {category}
        </p>
      </header>

      <CategoryNav title="More categories" activeCategory={category} />
      <AdSlot slot="stories-list" />

      {loading ? (
        <div className="stories-grid" aria-busy="true">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton skeleton-card" />
          ))}
        </div>
      ) : stories.length === 0 ? (
        <EmptyState message="No stories in this category yet." action={<Link to="/stories" className="btn btn-ghost">Browse all</Link>} />
      ) : (
        <div className="stories-grid">
          {stories.map((s) => (
            <StoryCard key={s.id} story={s} authorUsername={authors[s.user_id]?.username} />
          ))}
        </div>
      )}
    </div>
  );
}
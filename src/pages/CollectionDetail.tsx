import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { fetchCollectionBySlug } from '../lib/collections';
import type { CollectionWithStories } from '../lib/collections';
import { getStoryPath } from '../lib/slug';
import { getStoryTeaser } from '../lib/storyTeaser';
import { usePageMeta } from '../hooks/usePageMeta';
import EmptyState from '../components/EmptyState';
import NotFound from './NotFound';

export default function CollectionDetail() {
  const { username, collectionSlug } = useParams<{ username: string; collectionSlug: string }>();
  const [collection, setCollection] = useState<CollectionWithStories | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!username || !collectionSlug) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .maybeSingle();

      if (cancelled) return;
      if (!profile?.id) {
        setMissing(true);
        setLoading(false);
        return;
      }

      const result = await fetchCollectionBySlug(collectionSlug!, profile.id);
      if (cancelled) return;
      if (!result || result.stories.length === 0) {
        setMissing(true);
      } else {
        setCollection(result);
      }
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [username, collectionSlug]);

  usePageMeta({
    title: collection ? `${collection.title} — Story Collection` : 'Collection',
    description: collection?.description ?? 'Multi-part story collection on DesiEroticTales.',
    path: username && collectionSlug ? `/writer/${username}/collection/${collectionSlug}` : '/stories',
    noIndex: !collection,
  });

  if (loading) {
    return (
      <div className="page-loading" aria-busy="true">
        <div className="spinner" />
      </div>
    );
  }

  if (missing || !collection || !username) return <NotFound />;

  return (
    <div className="page collection-page">
      <header className="page-header">
        <p className="story-back-link">
          <Link to={`/writer/${username}`}>&larr; @{username}</Link>
        </p>
        <h1>{collection.title}</h1>
        {collection.description && <p className="page-subtitle">{collection.description}</p>}
        <p className="page-subtitle">{collection.stories.length} parts</p>
      </header>

      {collection.stories.length === 0 ? (
        <EmptyState message="No published parts in this collection yet." />
      ) : (
        <ol className="collection-story-list">
          {collection.stories.map((story) => (
            <li key={story.id} className="collection-story-item">
              <Link to={getStoryPath(story)} className="collection-story-link">
                <span className="collection-story-part">Part {story.part_number}</span>
                <span className="collection-story-title">{story.title}</span>
                <span className="collection-story-teaser">{getStoryTeaser(story, 140)}</span>
              </Link>
            </li>
          ))}
        </ol>
      )}

      <p className="legal-back">
        <Link to="/stories">Browse all stories &rarr;</Link>
      </p>
    </div>
  );
}
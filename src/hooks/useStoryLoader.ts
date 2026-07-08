import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { resolveStoryAuthorDisplay } from '../lib/storyAuthors';
import { categoryToSlug, getStoryCanonicalPath, isUuid, slugToCategory } from '../lib/slug';
import type { Story, StoryAuthorDisplay } from '../types';
import { getViewerHash } from '../lib/viewerHash';

interface UseStoryLoaderOptions {
  /** Legacy `/story/:id` param (uuid or slug). */
  legacyId?: string;
  categorySlug?: string;
  storySlug?: string;
}

export function useStoryLoader({ legacyId, categorySlug, storySlug }: UseStoryLoaderOptions) {
  const navigate = useNavigate();
  const [story, setStory] = useState<Story | null>(null);
  const [author, setAuthor] = useState<StoryAuthorDisplay | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const viewsCounted = useRef(false);

  useEffect(() => {
    let cancelled = false;
    viewsCounted.current = false;

    async function load() {
      setLoading(true);
      setError('');

      let query = supabase.from('stories').select('*').eq('status', 'approved');

      if (storySlug && categorySlug) {
        query = query.eq('slug', storySlug);
      } else if (legacyId) {
        query = isUuid(legacyId) ? query.eq('id', legacyId) : query.eq('slug', legacyId);
      } else {
        setError('Story not found.');
        setLoading(false);
        return;
      }

      const { data, error: err } = await query.maybeSingle();

      if (cancelled) return;

      if (err || !data) {
        setError('Story not found or not yet approved.');
        setLoading(false);
        return;
      }

      const loaded = data as Story;

      if (storySlug && categorySlug) {
        const expected = categoryToSlug(loaded.category);
        const catMatch = expected === categorySlug || slugToCategory(categorySlug) === loaded.category;
        if (!catMatch) {
          setError('Story not found.');
          setLoading(false);
          return;
        }
      }

      setStory(loaded);
      setLoading(false);

      if (legacyId && loaded.slug && (isUuid(legacyId) || legacyId !== loaded.slug)) {
        navigate(getStoryCanonicalPath(loaded), { replace: true });
        return;
      }

      const display = await resolveStoryAuthorDisplay(loaded);
      if (!cancelled && display) {
        setAuthor(display);
      }

      if (!viewsCounted.current) {
        viewsCounted.current = true;
        await supabase.rpc('increment_story_views', {
          story_id: loaded.id,
          viewer_hash: getViewerHash(),
        });
      }
    }

    load();
    return () => { cancelled = true; };
  }, [legacyId, categorySlug, storySlug, navigate]);

  return { story, author, loading, error, storyId: story?.id ?? '' };
}
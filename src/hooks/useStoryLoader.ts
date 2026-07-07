import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { categoryToSlug, getStoryCanonicalPath, isUuid, slugToCategory } from '../lib/slug';
import type { Profile, Story } from '../types';

interface UseStoryLoaderOptions {
  /** Legacy `/story/:id` param (uuid or slug). */
  legacyId?: string;
  categorySlug?: string;
  storySlug?: string;
}

export function useStoryLoader({ legacyId, categorySlug, storySlug }: UseStoryLoaderOptions) {
  const navigate = useNavigate();
  const [story, setStory] = useState<Story | null>(null);
  const [author, setAuthor] = useState<Pick<Profile, 'username' | 'display_name' | 'bio'> | null>(null);
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

      const { data: prof } = await supabase
        .from('profiles')
        .select('username, display_name, bio')
        .eq('id', loaded.user_id)
        .maybeSingle();

      if (!cancelled && prof?.username) {
        setAuthor(prof as Pick<Profile, 'username' | 'display_name' | 'bio'>);
      }

      if (!viewsCounted.current) {
        viewsCounted.current = true;
        await supabase.rpc('increment_story_views', { story_id: loaded.id });
      }
    }

    load();
    return () => { cancelled = true; };
  }, [legacyId, categorySlug, storySlug, navigate]);

  return { story, author, loading, error, storyId: story?.id ?? '' };
}
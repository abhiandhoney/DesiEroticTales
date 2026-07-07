import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { StoryReaction } from '../types';

interface UseStoryReactionOptions {
  storyId: string;
  authorId: string;
  initialLikes: number;
  initialDislikes: number;
}

export function useStoryReaction({
  storyId,
  authorId,
  initialLikes,
  initialDislikes,
}: UseStoryReactionOptions) {
  const [likes, setLikes] = useState(initialLikes);
  const [dislikes, setDislikes] = useState(initialDislikes);
  const [userReaction, setUserReaction] = useState<StoryReaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    setLikes(initialLikes);
    setDislikes(initialDislikes);
  }, [initialLikes, initialDislikes]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;
      setUserId(user?.id ?? null);

      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('story_reactions')
        .select('reaction')
        .eq('story_id', storyId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!cancelled) {
        setUserReaction((data?.reaction as StoryReaction) ?? null);
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [storyId]);

  const isOwnStory = userId === authorId;

  const toggle = useCallback(async (reaction: StoryReaction) => {
    if (!userId || isOwnStory || busy) return false;

    setBusy(true);
    const prev = userReaction;

    if (prev === reaction) {
      setUserReaction(null);
      if (reaction === 'like') setLikes((n) => Math.max(0, n - 1));
      else setDislikes((n) => Math.max(0, n - 1));

      const { error } = await supabase
        .from('story_reactions')
        .delete()
        .eq('story_id', storyId)
        .eq('user_id', userId);

      if (error) {
        setUserReaction(prev);
        setLikes(initialLikes);
        setDislikes(initialDislikes);
        setBusy(false);
        return false;
      }
    } else {
      setUserReaction(reaction);
      if (prev === 'like') setLikes((n) => Math.max(0, n - 1));
      if (prev === 'dislike') setDislikes((n) => Math.max(0, n - 1));
      if (reaction === 'like') setLikes((n) => n + 1);
      else setDislikes((n) => n + 1);

      const { error } = await supabase
        .from('story_reactions')
        .upsert({ story_id: storyId, user_id: userId, reaction }, { onConflict: 'story_id,user_id' });

      if (error) {
        setUserReaction(prev);
        setLikes(initialLikes);
        setDislikes(initialDislikes);
        setBusy(false);
        return false;
      }
    }

    setBusy(false);
    return true;
  }, [userId, isOwnStory, busy, userReaction, storyId, initialLikes, initialDislikes]);

  return { likes, dislikes, userReaction, loading, busy, userId, isOwnStory, toggle };
}
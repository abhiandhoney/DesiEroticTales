import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface UseFollowOptions {
  writerId: string;
}

export function useFollow({ writerId }: UseFollowOptions) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [{ data: { user } }, { count }] = await Promise.all([
        supabase.auth.getUser(),
        supabase
          .from('writer_follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', writerId),
      ]);

      if (cancelled) return;
      setUserId(user?.id ?? null);
      setFollowerCount(count ?? 0);

      if (!user) {
        setIsFollowing(false);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('writer_follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', writerId)
        .maybeSingle();

      if (!cancelled) {
        setIsFollowing(!!data);
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [writerId]);

  const isSelf = userId === writerId;

  const toggle = useCallback(async () => {
    if (!userId || isSelf || busy) return false;

    setBusy(true);
    const wasFollowing = isFollowing;

    if (wasFollowing) {
      setIsFollowing(false);
      setFollowerCount((n) => Math.max(0, n - 1));

      const { error } = await supabase
        .from('writer_follows')
        .delete()
        .eq('follower_id', userId)
        .eq('following_id', writerId);

      if (error) {
        setIsFollowing(true);
        setFollowerCount((n) => n + 1);
        setBusy(false);
        return false;
      }
    } else {
      setIsFollowing(true);
      setFollowerCount((n) => n + 1);

      const { error } = await supabase
        .from('writer_follows')
        .insert({ follower_id: userId, following_id: writerId });

      if (error) {
        setIsFollowing(false);
        setFollowerCount((n) => Math.max(0, n - 1));
        setBusy(false);
        return false;
      }
    }

    setBusy(false);
    return true;
  }, [userId, isSelf, busy, isFollowing, writerId]);

  return { isFollowing, followerCount, loading, busy, userId, isSelf, toggle };
}
import { supabase } from './supabase';
import { normalizeUsername, validateUsername } from './username';

export async function checkUsernameAvailable(
  username: string,
  userId?: string,
  userEmail?: string | null,
): Promise<boolean> {
  if (validateUsername(username, userEmail)) return false;
  const { data, error } = await supabase.rpc('is_username_available', {
    check_name: normalizeUsername(username),
    for_user_id: userId ?? null,
  });
  if (error) {
    const { data: row } = await supabase
      .from('profiles')
      .select('id')
      .ilike('username', normalizeUsername(username))
      .maybeSingle();
    if (!row) return true;
    return userId ? row.id === userId : false;
  }
  return Boolean(data);
}

export interface ProfileUpdateInput {
  username?: string;
  display_name?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  onboarding_complete?: boolean;
  username_changed_at?: string;
}

export interface FollowedWriter {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  followed_at: string;
}

export async function fetchFollowing(userId: string): Promise<FollowedWriter[]> {
  const { data: follows, error } = await supabase
    .from('writer_follows')
    .select('following_id, created_at')
    .eq('follower_id', userId)
    .order('created_at', { ascending: false });

  if (error || !follows?.length) return [];

  const ids = follows.map((f) => f.following_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .in('id', ids)
    .not('username', 'is', null);

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, p]),
  );

  return follows
    .map((row) => {
      const p = profileMap.get(row.following_id);
      if (!p?.username) return null;
      return {
        user_id: p.id,
        username: p.username,
        display_name: p.display_name,
        avatar_url: p.avatar_url,
        followed_at: row.created_at,
      };
    })
    .filter((w): w is FollowedWriter => w !== null);
}

export async function updateProfile(userId: string, updates: ProfileUpdateInput) {
  const payload = { ...updates };
  if (payload.username) payload.username = normalizeUsername(payload.username);
  return supabase.from('profiles').update(payload).eq('id', userId).select().single();
}
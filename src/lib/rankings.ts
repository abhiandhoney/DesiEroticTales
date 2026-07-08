import { supabase } from './supabase';
import { STORY_LIST_COLUMNS } from './storyListColumns';
import type { Story } from '../types';

const LIST = STORY_LIST_COLUMNS;

export async function fetchStoryOfTheMonth(): Promise<Story | null> {
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const { data } = await supabase
    .from('stories')
    .select(LIST)
    .eq('status', 'approved')
    .gte('created_at', since.toISOString())
    .order('like_count', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data as Story | null;
}

export async function fetchStoryOfTheWeek(): Promise<Story | null> {
  const since = new Date();
  since.setDate(since.getDate() - 7);
  const { data } = await supabase
    .from('stories')
    .select(LIST)
    .eq('status', 'approved')
    .gte('created_at', since.toISOString())
    .order('like_count', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data as Story | null;
}

export async function fetchEditorsChoice(limit = 6): Promise<Story[]> {
  const { data } = await supabase
    .from('stories')
    .select(LIST)
    .eq('status', 'approved')
    .eq('is_editors_choice', true)
    .order('editors_choice_at', { ascending: false })
    .limit(limit);
  return (data ?? []) as Story[];
}

export interface LeaderboardEntry {
  /** Unique row id (profile id or author_profile id as string). */
  id: string;
  kind: 'writer' | 'pen_name';
  user_id: string;
  author_profile_id: string | null;
  /** URL slug for /writer/{slug} */
  slug: string;
  /** @deprecated Use slug */
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  story_count: number;
  total_likes: number;
  member_since: string;
  is_pen_name: boolean;
}

function normalizeLeaderboardRow(row: Record<string, unknown>): LeaderboardEntry | null {
  const slug = (row.slug as string) ?? (row.username as string);
  if (!slug) return null;

  const isPenName = Boolean(row.is_pen_name);
  const id = (row.id as string) ?? (isPenName ? (row.author_profile_id as string) : (row.user_id as string));
  if (!id) return null;

  return {
    id,
    kind: isPenName ? 'pen_name' : 'writer',
    user_id: row.user_id as string,
    author_profile_id: (row.author_profile_id as string | null) ?? null,
    slug,
    username: (row.username as string | null) ?? slug,
    display_name: row.display_name as string | null,
    avatar_url: row.avatar_url as string | null,
    story_count: Number(row.story_count ?? 0),
    total_likes: Number(row.total_likes ?? 0),
    member_since: row.member_since as string,
    is_pen_name: isPenName,
  };
}

/** Client-side pen-name stats when migration 017 is not yet applied. */
async function fetchPenNameLeaderboardFallback(): Promise<LeaderboardEntry[]> {
  const { data: profiles, error: profErr } = await supabase
    .from('author_profiles')
    .select('*');
  if (profErr || !profiles?.length) return [];

  const { data: stories, error: storyErr } = await supabase
    .from('stories')
    .select('author_profile_id, like_count')
    .eq('status', 'approved')
    .not('author_profile_id', 'is', null);
  if (storyErr) return [];

  const stats: Record<string, { count: number; likes: number }> = {};
  for (const s of stories ?? []) {
    const pid = s.author_profile_id as string;
    if (!stats[pid]) stats[pid] = { count: 0, likes: 0 };
    stats[pid].count += 1;
    stats[pid].likes += s.like_count ?? 0;
  }

  return profiles
    .filter((p) => stats[p.id]?.count > 0)
    .map((p) => ({
      id: p.id,
      kind: 'pen_name' as const,
      user_id: p.created_by,
      author_profile_id: p.id,
      slug: p.slug,
      username: p.slug,
      display_name: p.name,
      avatar_url: p.avatar_url,
      story_count: stats[p.id].count,
      total_likes: stats[p.id].likes,
      member_since: p.created_at,
      is_pen_name: true,
    }));
}

/** Re-score real writers excluding pen-name attributed stories (pre-017 view). */
async function fetchWriterLeaderboardLegacy(limit: number): Promise<LeaderboardEntry[]> {
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, created_at')
    .not('username', 'is', null)
    .eq('onboarding_complete', true);

  const { data: stories } = await supabase
    .from('stories')
    .select('user_id, like_count, author_profile_id')
    .eq('status', 'approved');

  const stats: Record<string, { count: number; likes: number }> = {};
  for (const s of stories ?? []) {
    if (s.author_profile_id) continue;
    const uid = s.user_id as string;
    if (!stats[uid]) stats[uid] = { count: 0, likes: 0 };
    stats[uid].count += 1;
    stats[uid].likes += s.like_count ?? 0;
  }

  const writers = (profiles ?? [])
    .map((p) => ({
      id: p.id,
      kind: 'writer' as const,
      user_id: p.id,
      author_profile_id: null,
      slug: p.username!,
      username: p.username,
      display_name: p.display_name,
      avatar_url: p.avatar_url,
      story_count: stats[p.id]?.count ?? 0,
      total_likes: stats[p.id]?.likes ?? 0,
      member_since: p.created_at,
      is_pen_name: false,
    }))
    .filter((w) => w.story_count > 0 || w.total_likes > 0);

  const penNames = await fetchPenNameLeaderboardFallback();
  return [...writers, ...penNames]
    .sort((a, b) => b.total_likes - a.total_likes || b.story_count - a.story_count)
    .slice(0, limit);
}

export async function fetchWriterLeaderboard(limit = 20): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from('writer_leaderboard')
    .select('*')
    .order('total_likes', { ascending: false })
    .limit(limit * 2);

  if (error || !data?.length) {
    return fetchWriterLeaderboardLegacy(limit);
  }

  const first = data[0] as Record<string, unknown>;
  if (!('kind' in first) && !('is_pen_name' in first)) {
    return fetchWriterLeaderboardLegacy(limit);
  }

  const entries = data
    .map((row) => normalizeLeaderboardRow(row as Record<string, unknown>))
    .filter((e): e is LeaderboardEntry => !!e)
    .sort((a, b) => b.total_likes - a.total_likes || b.story_count - a.story_count)
    .slice(0, limit);

  return entries;
}
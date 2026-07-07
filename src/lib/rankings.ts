import { supabase } from './supabase';
import type { Story } from '../types';

export async function fetchStoryOfTheMonth(): Promise<Story | null> {
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const { data } = await supabase
    .from('stories')
    .select('*')
    .eq('status', 'approved')
    .gte('created_at', since.toISOString())
    .order('like_count', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function fetchStoryOfTheWeek(): Promise<Story | null> {
  const since = new Date();
  since.setDate(since.getDate() - 7);
  const { data } = await supabase
    .from('stories')
    .select('*')
    .eq('status', 'approved')
    .gte('created_at', since.toISOString())
    .order('like_count', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function fetchEditorsChoice(limit = 6): Promise<Story[]> {
  const { data } = await supabase
    .from('stories')
    .select('*')
    .eq('status', 'approved')
    .eq('is_editors_choice', true)
    .order('editors_choice_at', { ascending: false })
    .limit(limit);
  return data ?? [];
}

export interface LeaderboardEntry {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  story_count: number;
  total_likes: number;
  member_since: string;
}

export async function fetchWriterLeaderboard(limit = 20): Promise<LeaderboardEntry[]> {
  const { data } = await supabase
    .from('writer_leaderboard')
    .select('*')
    .order('total_likes', { ascending: false })
    .limit(limit);
  return (data ?? []) as LeaderboardEntry[];
}
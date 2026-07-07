import { supabase } from './supabase';

export type AuthorMap = Record<string, { username: string; display_name: string | null }>;

export async function fetchStoryAuthors(userIds: string[]): Promise<AuthorMap> {
  const unique = [...new Set(userIds)].filter(Boolean);
  if (unique.length === 0) return {};

  const { data } = await supabase
    .from('profiles')
    .select('id, username, display_name')
    .in('id', unique)
    .not('username', 'is', null);

  const map: AuthorMap = {};
  for (const row of data ?? []) {
    if (row.username) {
      map[row.id] = { username: row.username, display_name: row.display_name };
    }
  }
  return map;
}
import { supabase } from './supabase';
import { authorProfileToDisplay, fetchAuthorProfileById } from './authorProfiles';
import type { Story, StoryAuthorDisplay } from '../types';

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

/** Resolve public author display per story (pen name takes precedence over real writer). */
export async function fetchStoryAuthorDisplays(
  stories: Pick<Story, 'id' | 'user_id' | 'author_profile_id'>[],
): Promise<Record<string, StoryAuthorDisplay>> {
  const result: Record<string, StoryAuthorDisplay> = {};
  if (stories.length === 0) return result;

  const profileIds = [...new Set(stories.map((s) => s.author_profile_id).filter(Boolean))] as string[];
  const penNameMap: Record<string, StoryAuthorDisplay> = {};

  if (profileIds.length) {
    const { data: profiles } = await supabase
      .from('author_profiles')
      .select('*')
      .in('id', profileIds);
    for (const p of profiles ?? []) {
      penNameMap[p.id] = authorProfileToDisplay(p);
    }
  }

  const needsWriter = stories.filter((s) => !s.author_profile_id || !penNameMap[s.author_profile_id]);
  const writerIds = [...new Set(needsWriter.map((s) => s.user_id))];
  const writerMap = await fetchStoryAuthors(writerIds);

  const writerAvatarMap: Record<string, string | null> = {};
  if (writerIds.length) {
    const { data: profs } = await supabase
      .from('profiles')
      .select('id, avatar_url')
      .in('id', writerIds);
    for (const p of profs ?? []) {
      writerAvatarMap[p.id] = p.avatar_url;
    }
  }

  for (const story of stories) {
    if (story.author_profile_id && penNameMap[story.author_profile_id]) {
      result[story.id] = penNameMap[story.author_profile_id];
      continue;
    }
    const w = writerMap[story.user_id];
    if (w?.username) {
      result[story.id] = {
        slug: w.username,
        displayName: w.display_name ?? w.username,
        avatarUrl: writerAvatarMap[story.user_id] ?? null,
        isPenName: false,
      };
    }
  }

  return result;
}

export async function resolveStoryAuthorDisplay(
  story: Pick<Story, 'user_id' | 'author_profile_id'>,
): Promise<StoryAuthorDisplay | null> {
  if (story.author_profile_id) {
    const profile = await fetchAuthorProfileById(story.author_profile_id);
    if (profile) return authorProfileToDisplay(profile);
  }

  const { data: prof } = await supabase
    .from('profiles')
    .select('username, display_name, avatar_url, bio')
    .eq('id', story.user_id)
    .maybeSingle();

  if (!prof?.username) return null;

  return {
    slug: prof.username,
    displayName: prof.display_name ?? prof.username,
    avatarUrl: prof.avatar_url,
    bio: prof.bio,
    isPenName: false,
  };
}
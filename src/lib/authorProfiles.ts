import { supabase } from './supabase';
import { slugify } from './slug';
import { processAndUploadAvatar, removeAvatar } from './avatar';
import type { AuthorProfile, Story, StoryAuthorDisplay } from '../types';

export async function fetchAuthorProfiles(): Promise<AuthorProfile[]> {
  const { data, error } = await supabase
    .from('author_profiles')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchAuthorProfileBySlug(slug: string): Promise<AuthorProfile | null> {
  const { data, error } = await supabase
    .from('author_profiles')
    .select('*')
    .ilike('slug', slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchAuthorProfileById(id: string): Promise<AuthorProfile | null> {
  const { data, error } = await supabase
    .from('author_profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchStoriesForAuthorProfile(profileId: string): Promise<Story[]> {
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .eq('author_profile_id', profileId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Story[];
}

export async function fetchAuthorProfileStoryCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('stories')
    .select('author_profile_id')
    .eq('status', 'approved')
    .not('author_profile_id', 'is', null);
  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const id = row.author_profile_id as string;
    counts[id] = (counts[id] ?? 0) + 1;
  }
  return counts;
}

async function slugTaken(slug: string, excludeId?: string): Promise<boolean> {
  const normalized = slug.toLowerCase();

  let profileQuery = supabase
    .from('author_profiles')
    .select('id')
    .ilike('slug', normalized);
  if (excludeId) profileQuery = profileQuery.neq('id', excludeId);
  const { data: existingProfile } = await profileQuery.maybeSingle();
  if (existingProfile) return true;

  const { data: existingUser } = await supabase
    .from('profiles')
    .select('id')
    .ilike('username', normalized)
    .maybeSingle();
  return !!existingUser;
}

export async function uniqueAuthorProfileSlug(name: string, excludeId?: string): Promise<string> {
  const base = slugify(name) || 'author';
  let slug = base;
  let n = 2;
  while (await slugTaken(slug, excludeId)) {
    slug = `${base}-${n}`;
    n += 1;
  }
  return slug;
}

export async function isAuthorProfileSlugAvailable(
  slug: string,
  excludeId?: string,
): Promise<boolean> {
  const s = slugify(slug);
  if (s.length < 3) return false;
  return !(await slugTaken(s, excludeId));
}

export interface AuthorProfileInput {
  name: string;
  slug: string;
  bio?: string | null;
  avatarUrl?: string | null;
}

export async function createAuthorProfile(
  adminUserId: string,
  input: AuthorProfileInput,
): Promise<AuthorProfile> {
  const slug = slugify(input.slug) || (await uniqueAuthorProfileSlug(input.name));
  if (!(await isAuthorProfileSlugAvailable(slug))) {
    throw new Error('This slug is already taken by a writer or pen name.');
  }

  const { data, error } = await supabase
    .from('author_profiles')
    .insert({
      created_by: adminUserId,
      name: input.name.trim(),
      slug,
      bio: input.bio?.trim() || null,
      avatar_url: input.avatarUrl ?? null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updateAuthorProfile(
  id: string,
  input: Partial<AuthorProfileInput>,
): Promise<AuthorProfile> {
  const updates: Record<string, unknown> = {};
  if (input.name !== undefined) updates.name = input.name.trim();
  if (input.bio !== undefined) updates.bio = input.bio?.trim() || null;
  if (input.avatarUrl !== undefined) updates.avatar_url = input.avatarUrl;

  if (input.slug !== undefined) {
    const slug = slugify(input.slug);
    if (slug.length < 3) throw new Error('Slug must be at least 3 characters.');
    if (!(await isAuthorProfileSlugAvailable(slug, id))) {
      throw new Error('This slug is already taken by a writer or pen name.');
    }
    updates.slug = slug;
  }

  const { data, error } = await supabase
    .from('author_profiles')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteAuthorProfile(profile: AuthorProfile): Promise<void> {
  const { error } = await supabase.from('author_profiles').delete().eq('id', profile.id);
  if (error) throw error;
  if (profile.avatar_url) {
    try {
      await removeAvatar(profile.avatar_url);
    } catch {
      // Best-effort avatar cleanup.
    }
  }
}

export async function uploadAuthorProfileAvatar(
  adminUserId: string,
  file: File,
): Promise<string> {
  return processAndUploadAvatar(adminUserId, file);
}

export function authorProfileToDisplay(profile: AuthorProfile): StoryAuthorDisplay {
  return {
    slug: profile.slug,
    displayName: profile.name,
    avatarUrl: profile.avatar_url,
    bio: profile.bio,
    isPenName: true,
  };
}
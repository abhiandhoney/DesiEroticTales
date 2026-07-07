import { supabase } from './supabase';
import { slugify } from './slug';
import type { Collection, Story } from '../types';

export interface CollectionWithStories extends Collection {
  stories: (Story & { part_number: number })[];
}

export interface StoryCollectionLink {
  collection: Collection;
  part_number: number;
  siblings: { story: Story; part_number: number }[];
}

export async function fetchWriterCollections(userId: string): Promise<Collection[]> {
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

async function uniqueCollectionSlug(userId: string, title: string): Promise<string> {
  const base = slugify(title) || 'collection';
  let slug = base;
  let n = 2;
  while (true) {
    const { data } = await supabase
      .from('collections')
      .select('id')
      .eq('user_id', userId)
      .eq('slug', slug)
      .maybeSingle();
    if (!data) return slug;
    slug = `${base}-${n}`;
    n += 1;
  }
}

export async function createCollection(
  userId: string,
  title: string,
  description?: string | null,
): Promise<Collection> {
  const slug = await uniqueCollectionSlug(userId, title);
  const { data, error } = await supabase
    .from('collections')
    .insert({
      user_id: userId,
      title: title.trim(),
      slug,
      description: description?.trim() || null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function linkStoryToCollection(
  storyId: string,
  collectionId: string,
  partNumber: number,
): Promise<void> {
  const { error: delErr } = await supabase
    .from('collection_stories')
    .delete()
    .eq('story_id', storyId);
  if (delErr) throw delErr;

  const { error } = await supabase.from('collection_stories').insert({
    collection_id: collectionId,
    story_id: storyId,
    part_number: partNumber,
  });
  if (error) throw error;
}

export async function unlinkStoryFromCollection(storyId: string): Promise<void> {
  const { error } = await supabase
    .from('collection_stories')
    .delete()
    .eq('story_id', storyId);
  if (error) throw error;
}

export async function fetchStoryCollectionLink(storyId: string): Promise<StoryCollectionLink | null> {
  const { data: link, error } = await supabase
    .from('collection_stories')
    .select('collection_id, part_number, collections(*)')
    .eq('story_id', storyId)
    .maybeSingle();
  if (error || !link?.collections) return null;

  const collection = link.collections as unknown as Collection;
  const { data: parts, error: partsErr } = await supabase
    .from('collection_stories')
    .select('part_number, stories(*)')
    .eq('collection_id', collection.id)
    .order('part_number', { ascending: true });
  if (partsErr) throw partsErr;

  const siblings = (parts ?? [])
    .map((row) => ({
      story: row.stories as unknown as Story,
      part_number: row.part_number as number,
    }))
    .filter((p) => p.story?.status === 'approved' || p.story?.id === storyId);

  return {
    collection,
    part_number: link.part_number as number,
    siblings,
  };
}

export async function fetchCollectionBySlug(
  slug: string,
  writerUserId?: string,
): Promise<CollectionWithStories | null> {
  let query = supabase.from('collections').select('*').eq('slug', slug);
  if (writerUserId) query = query.eq('user_id', writerUserId);

  const { data: collection, error } = await query.maybeSingle();
  if (error || !collection) return null;

  const { data: rows, error: rowsErr } = await supabase
    .from('collection_stories')
    .select('part_number, stories(*)')
    .eq('collection_id', collection.id)
    .order('part_number', { ascending: true });
  if (rowsErr) throw rowsErr;

  const stories = (rows ?? [])
    .map((r) => ({ ...(r.stories as unknown as Story), part_number: r.part_number as number }))
    .filter((s) => s.status === 'approved' || s.user_id === writerUserId);

  return { ...collection, stories };
}

export function getCollectionPath(collection: Pick<Collection, 'slug' | 'user_id'>, username?: string): string {
  if (username) return `/writer/${username}/collection/${collection.slug}`;
  return `/collection/${collection.slug}`;
}

export type CollectionFormValue =
  | { mode: 'none' }
  | { mode: 'existing'; collectionId: string; partNumber: number }
  | { mode: 'new'; title: string; partNumber: number };

export async function applyCollectionLink(
  storyId: string,
  userId: string,
  value: CollectionFormValue,
): Promise<void> {
  if (value.mode === 'none') {
    await unlinkStoryFromCollection(storyId);
    return;
  }
  if (value.mode === 'new') {
    const col = await createCollection(userId, value.title);
    await linkStoryToCollection(storyId, col.id, value.partNumber);
    return;
  }
  await linkStoryToCollection(storyId, value.collectionId, value.partNumber);
}

export async function loadCollectionFormValue(storyId: string): Promise<CollectionFormValue> {
  const { data } = await supabase
    .from('collection_stories')
    .select('collection_id, part_number')
    .eq('story_id', storyId)
    .maybeSingle();
  if (!data) return { mode: 'none' };
  return {
    mode: 'existing',
    collectionId: data.collection_id,
    partNumber: data.part_number,
  };
}
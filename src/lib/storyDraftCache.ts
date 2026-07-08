import type { JSONContent } from '@tiptap/core';
import type { CollectionFormValue } from './collections';
import type { StoryCategory } from '../types';

export const CACHE_VERSION = 2 as const;
const KEY_PREFIX = 'desi-tales:draft:';

export interface StoryDraftSnapshot {
  title: string;
  teaser: string;
  category: StoryCategory;
  tagsInput: string;
  contentDoc: JSONContent;
  contentHtml: string;
  authorProfileId: string | null;
  coverPersistedFullUrl: string | null;
  coverPersistedCardUrl: string | null;
  collectionValue: CollectionFormValue;
}

export interface StoryDraftCacheEntry {
  version: typeof CACHE_VERSION;
  userId: string;
  storyId: string | null;
  updatedAt: number;
  remoteUpdatedAt: number | null;
  snapshot: StoryDraftSnapshot;
}

function newStoryKey(userId: string): string {
  return `${KEY_PREFIX}new:${userId}`;
}

function storyKey(storyId: string): string {
  return `${KEY_PREFIX}${storyId}`;
}

export function draftCacheKey(userId: string, storyId?: string | null): string {
  return storyId ? storyKey(storyId) : newStoryKey(userId);
}

export function snapshotFingerprint(snapshot: StoryDraftSnapshot): string {
  return JSON.stringify({
    title: snapshot.title.trim(),
    teaser: snapshot.teaser.trim(),
    category: snapshot.category,
    tagsInput: snapshot.tagsInput.trim(),
    contentDoc: snapshot.contentDoc,
    contentHtml: snapshot.contentHtml,
    authorProfileId: snapshot.authorProfileId,
    coverPersistedFullUrl: snapshot.coverPersistedFullUrl,
    coverPersistedCardUrl: snapshot.coverPersistedCardUrl,
    collectionValue: snapshot.collectionValue,
  });
}

export function readStoryDraftCache(
  userId: string,
  storyId?: string | null,
): StoryDraftCacheEntry | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(draftCacheKey(userId, storyId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoryDraftCacheEntry;
    if (parsed.version !== CACHE_VERSION || parsed.userId !== userId) return null;
    if (storyId && parsed.storyId && parsed.storyId !== storyId) return null;
    if (!parsed.snapshot.collectionValue) {
      parsed.snapshot.collectionValue = { mode: 'none' };
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeStoryDraftCache(entry: StoryDraftCacheEntry): void {
  if (typeof window === 'undefined') return;
  try {
    const key = draftCacheKey(entry.userId, entry.storyId);
    localStorage.setItem(key, JSON.stringify(entry));
    if (!entry.storyId) return;
    const legacyKey = newStoryKey(entry.userId);
    if (localStorage.getItem(legacyKey)) {
      localStorage.removeItem(legacyKey);
    }
  } catch {
    // Quota exceeded or private mode — ignore.
  }
}

export function clearStoryDraftCache(userId: string, storyId?: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(draftCacheKey(userId, storyId));
    if (storyId) {
      localStorage.removeItem(newStoryKey(userId));
      localStorage.removeItem(storyKey(storyId));
    }
  } catch {
    // ignore
  }
}

/** Remove cached draft after publish or delete (no userId required). */
export function clearStoryDraftCacheByStoryId(storyId: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(storyKey(storyId));
  } catch {
    // ignore
  }
}

export function migrateStoryDraftCache(userId: string, storyId: string): void {
  const legacy = readStoryDraftCache(userId, null);
  if (!legacy) return;
  writeStoryDraftCache({ ...legacy, storyId });
  clearStoryDraftCache(userId, null);
}
import type { Story } from '../types';
import {
  CATEGORY_SLUG_MAP,
  LEGACY_CATEGORY_SLUGS,
  STORY_CATEGORIES,
  normalizeCategory,
  type StoryCategory,
} from './categories';

/** Paths that must not be interpreted as category/story slugs. */
export const RESERVED_PATHS = new Set([
  'stories',
  'writers',
  'writer',
  'submit',
  'profile',
  'admin',
  'edit',
  'onboarding',
  'auth',
  'story',
  'category',
  'privacy-policy',
  'about',
  'contact',
  'report-content',
  'cookie-policy',
  'feed.xml',
  'llms.txt',
  'assets',
  'favicon.svg',
  'icons.svg',
  'brand',
  'site.webmanifest',
  'robots.txt',
  'sitemap.xml',
]);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export function slugify(text: string): string {
  const s = text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return s || 'story';
}

export { CATEGORY_SLUG_MAP };

const SLUG_TO_CATEGORY = Object.fromEntries(
  Object.entries(CATEGORY_SLUG_MAP).map(([cat, slug]) => [slug, cat]),
) as Record<string, StoryCategory>;

export function categoryToSlug(category: string): string {
  const norm = normalizeCategory(category);
  if (norm in CATEGORY_SLUG_MAP) {
    return CATEGORY_SLUG_MAP[norm];
  }
  return slugify(category);
}

export function slugToCategory(slug: string): StoryCategory | null {
  return SLUG_TO_CATEGORY[slug] ?? LEGACY_CATEGORY_SLUGS[slug] ?? null;
}

export function getStoryCanonicalPath(story: Pick<Story, 'category' | 'slug'>): string {
  const cat = categoryToSlug(story.category);
  const storySlug = story.slug ?? 'story';
  return `/${cat}/${storySlug}`;
}

export function getStoryLegacyPath(story: Pick<Story, 'id'>): string {
  return `/story/${story.id}`;
}

/** Prefer SEO slug URL when available. */
export function getStoryPath(story: Pick<Story, 'id' | 'category' | 'slug'>): string {
  if (story.slug) return getStoryCanonicalPath(story);
  return getStoryLegacyPath(story);
}

export function getCategoryPath(category: StoryCategory | string): string {
  return `/category/${categoryToSlug(category)}`;
}

export function getWriterPath(username: string): string {
  return `/writer/${username}`;
}

export function parseTagsInput(raw: string): string[] {
  return raw
    .split(',')
    .map((t) => t.trim().toLowerCase().replace(/\s+/g, '-'))
    .filter((t) => t.length >= 2 && t.length <= 40)
    .slice(0, 8);
}

export function formatTags(tags: string[] | null | undefined): string {
  return (tags ?? []).join(', ');
}

export { STORY_CATEGORIES };
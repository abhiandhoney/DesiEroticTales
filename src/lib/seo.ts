import { getSiteOrigin } from './site';
import { getStoryCanonicalPath, getCategoryPath, getWriterPath } from './slug';
import type { Story } from '../types';

export const SITE_NAME = 'DesiEroticTales';
export const DEFAULT_DESCRIPTION =
  'DesiEroticTales - Telugu and Desi erotic stories. Slow-burn tales of desire, free to read.';

export function absoluteUrl(path: string): string {
  const origin = typeof window !== 'undefined' ? getSiteOrigin() : (import.meta.env.VITE_SITE_URL ?? '');
  if (!origin) return path;
  return `${origin.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
}

export function buildWebSiteJsonLd(siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: siteUrl,
    description: DEFAULT_DESCRIPTION,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteUrl}/stories?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

export function buildArticleJsonLd(
  story: Story,
  opts: { authorName?: string; description: string; image?: string | null },
) {
  const url = absoluteUrl(getStoryCanonicalPath(story));
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: story.title,
    description: opts.description,
    datePublished: story.created_at,
    dateModified: story.updated_at ?? story.created_at,
    author: opts.authorName
      ? { '@type': 'Person', name: opts.authorName }
      : undefined,
    image: opts.image ?? undefined,
    url,
    mainEntityOfPage: url,
    articleSection: story.category,
    keywords: (story.tags ?? []).join(', ') || undefined,
  };
}

export function buildBreadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function buildPersonJsonLd(username: string, displayName?: string | null) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: displayName ?? username,
    url: absoluteUrl(getWriterPath(username)),
    alternateName: `@${username}`,
  };
}

export function buildCollectionJsonLd(title: string, description: string, path: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    description,
    url: absoluteUrl(path),
  };
}

export function storyBreadcrumbs(story: Story, authorUsername?: string) {
  const items = [
    { name: 'Home', path: '/' },
    { name: story.category, path: getCategoryPath(story.category) },
    { name: story.title, path: getStoryCanonicalPath(story) },
  ];
  if (authorUsername) {
    items.splice(2, 0, { name: `@${authorUsername}`, path: getWriterPath(authorUsername) });
  }
  return items;
}
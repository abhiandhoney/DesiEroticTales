import { getSiteOrigin } from './site';
import { getStoryCanonicalPath, getCategoryPath, getWriterPath } from './slug';
import { phraseForCategory } from './seoKeywords';
import type { Story } from '../types';

import { HOME_META } from './seoMeta';

export const SITE_NAME = 'DesiEroticTales';
export const DEFAULT_DESCRIPTION = HOME_META.description;
export const DEFAULT_KEYWORDS = HOME_META.keywords;

export function absoluteUrl(path: string): string {
  const origin = typeof window !== 'undefined' ? getSiteOrigin() : (import.meta.env.VITE_SITE_URL ?? '');
  if (!origin) return path;
  return `${origin.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
}

export function storyWordCount(content: string): number {
  const trimmed = content.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

export function buildOrganizationJsonLd(siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: siteUrl,
    description: DEFAULT_DESCRIPTION,
    knowsAbout: [
      'Telugu sex stories',
      'kamakathalu',
      'slow-burn erotica',
      'akka chelli stories',
      'aunty stories',
      'desi erotic fiction',
      'telugu kama kathalu',
    ],
  };
}

export function buildWebSiteJsonLd(siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: siteUrl,
    description: DEFAULT_DESCRIPTION,
    publisher: { '@type': 'Organization', name: SITE_NAME },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteUrl}/stories?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

export function buildArticleJsonLd(
  story: Story,
  opts: { authorName?: string; authorUrl?: string; description: string; image?: string | null },
) {
  const url = absoluteUrl(getStoryCanonicalPath(story));
  const words = storyWordCount(story.content);
  const readMins = Math.max(1, Math.ceil(words / 200));

  return {
    '@context': 'https://schema.org',
    '@type': ['Article', 'CreativeWork'],
    headline: story.title,
    abstract: opts.description,
    description: opts.description,
    datePublished: story.created_at,
    dateModified: story.updated_at ?? story.created_at,
    author: opts.authorName
      ? {
          '@type': 'Person',
          name: opts.authorName,
          url: opts.authorUrl ? absoluteUrl(opts.authorUrl) : undefined,
        }
      : undefined,
    image: opts.image ?? undefined,
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    articleSection: story.category,
    genre: ['Telugu erotica', 'slow-burn', story.category],
    about: (story.tags ?? []).map((tag) => ({
      '@type': 'Thing',
      name: tag,
    })),
    keywords: (story.tags ?? []).join(', ') || story.category,
    wordCount: words,
    timeRequired: `PT${readMins}M`,
    inLanguage: ['te', 'en'],
    creativeWorkStatus: 'Published',
    isAccessibleForFree: true,
    publisher: { '@type': 'Organization', name: SITE_NAME, url: absoluteUrl('/') },
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['.story-summary-heading', '.story-summary-text'],
    },
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

export function buildPersonJsonLd(username: string, displayName?: string | null, bio?: string | null) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: displayName ?? username,
    url: absoluteUrl(getWriterPath(username)),
    alternateName: `@${username}`,
    description: bio ?? undefined,
  };
}

export function buildCollectionJsonLd(title: string, description: string, path: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    description,
    url: absoluteUrl(path),
    isPartOf: { '@type': 'WebSite', name: SITE_NAME },
  };
}

export function buildWebPageJsonLd(title: string, description: string, path: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description,
    url: absoluteUrl(path),
    isPartOf: { '@type': 'WebSite', name: SITE_NAME },
  };
}

export function buildCategoryFaqJsonLd(category: string, count: number) {
  const phrase = phraseForCategory(category);
  const path = getCategoryPath(category);
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `Where can I read free ${phrase.toLowerCase()}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `DesiEroticTales has ${count}+ free ${phrase.toLowerCase()}. Browse at ${absoluteUrl(path)}.`,
        },
      },
      {
        '@type': 'Question',
        name: `What kind of stories are in ${category}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `The ${category} category on DesiEroticTales features slow-burn, emotional Telugu erotic fiction with AI-generated images.`,
        },
      },
    ],
  };
}

export function buildItemListJsonLd(name: string, items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      url: absoluteUrl(item.path),
    })),
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
import { getStoryTeaser } from './storyTeaser';
import { phraseForCategory, keywordsForCategory, PRIMARY_KEYWORDS } from './seoKeywords';
import type { Story } from '../types';

export const SITE_BRAND = 'DesiEroticTales';

export const HOME_META = {
  title: 'Telugu Sex Stories & Kamakathalu — Free Desi Tales',
  description:
    'Read free Telugu sex stories, kamakathalu, boothu kathalu, and desi erotic tales. '
    + 'Aunty, akka chelli, office, college & more. New stories added daily on DesiEroticTales.',
  keywords: PRIMARY_KEYWORDS.join(', '),
  path: '/',
};

export const STORIES_META = {
  title: 'All Telugu Sex Stories — Browse by Category',
  description:
    'Browse hundreds of Telugu sex stories and desi kama kathalu. Filter by aunty, office, '
    + 'friend, college, pinni, and more. Sort by newest, popular, or top rated.',
  keywords: 'telugu sex stories, kamakathalu, desi sex stories, boothu kathalu, all categories',
  path: '/stories',
};

export const WRITERS_META = {
  title: 'Top Telugu Story Writers — Rachayitalu Leaderboard',
  description:
    'Meet the top Telugu sex story writers on DesiEroticTales. Ranked by reader appreciations. '
    + 'Follow your favourite rachayitalu and discover their best kathalu.',
  keywords: 'telugu story writers, rachayitalu, kamakathalu writers, desi erotica authors',
  path: '/writers',
};

export const SUBMIT_META = {
  title: 'Submit Your Telugu Sex Story',
  description: 'Writers: submit your Telugu or Desi erotic tale for review on DesiEroticTales.',
  path: '/submit',
  noIndex: true,
};

export const ADMIN_META = {
  title: 'Admin — Story Moderation',
  description: 'Admin moderation dashboard.',
  path: '/admin',
  noIndex: true,
};

export const PROFILE_META = {
  title: 'My Writer Profile',
  description: 'Your DesiEroticTales writer dashboard.',
  path: '/profile',
  noIndex: true,
};

export function categoryPageMeta(category: string) {
  const phrase = phraseForCategory(category);
  return {
    title: `${phrase} — Read Free Online`,
    description:
      `Read the best ${phrase.toLowerCase()} on DesiEroticTales. `
      + `Free Telugu kama kathalu updated regularly. Browse ${category} tales now.`,
    keywords: keywordsForCategory(category),
  };
}

export function storyPageMeta(story: Story) {
  const teaser = getStoryTeaser(story, 150);
  const phrase = phraseForCategory(story.category);
  const tagLine = story.tags?.length ? ` Tags: ${story.tags.join(', ')}.` : '';
  return {
    title: `${story.title} — ${phrase}`,
    description: `${teaser} Free ${phrase.toLowerCase()} on DesiEroticTales.${tagLine}`.slice(0, 160),
    keywords: [
      story.title,
      phraseForCategory(story.category),
      ...(story.tags ?? []),
      'telugu sex stories',
      'kamakathalu',
    ].join(', '),
  };
}

export function writerPageMeta(username: string, displayName?: string | null, bio?: string | null) {
  const name = displayName ?? username;
  return {
    title: `${name} (@${username}) — Telugu Story Writer`,
    description:
      bio?.slice(0, 155)
      || `Read Telugu sex stories by @${username} on DesiEroticTales. Follow this writer for new kamakathalu.`,
    keywords: `${username}, telugu story writer, rachayitalu, kamakathalu, desi sex stories`,
  };
}
import { getStoryTeaser } from './storyTeaser';
import { phraseForCategory, keywordsForCategory, PRIMARY_KEYWORDS, LLM_INTENT_PHRASES, categoryDescription } from './seoKeywords';
import { estimateReadTime, formatReadTime } from './readTime';
import type { Story } from '../types';

export const SITE_BRAND = 'DesiEroticTales';

export const HOME_META = {
  title: 'DesiEroticTales — Slow-Burn Telugu Sex Stories & Kamakathalu',
  description:
    'Browse Telugu sex stories, kamakathalu, and desi erotic fiction across 20+ categories. '
    + 'Community-written tales — aunty, akka chelli, office, college, and more.',
  keywords: [...PRIMARY_KEYWORDS, ...LLM_INTENT_PHRASES].join(', '),
  path: '/',
};

export const STORIES_META = {
  title: 'All Telugu Sex Stories — Browse by Category',
  description:
    'Browse hundreds of slow-burn Telugu sex stories and desi kama kathalu. Filter by aunty, office, '
    + 'friend, college, pinni, and more. Sort by newest, popular, or top rated.',
  keywords: 'telugu sex stories, kamakathalu, desi sex stories, boothu kathalu, slow burn telugu erotica',
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

export const ABOUT_META = {
  title: 'About DesiEroticTales — Telugu Slow-Burn Erotica',
  description:
    'About DesiEroticTales — Telugu and Desi erotic fiction, story categories, '
    + 'writer submissions, and citation guidelines.',
  keywords: [...PRIMARY_KEYWORDS, ...LLM_INTENT_PHRASES].join(', '),
  path: '/about',
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

export function categoryPageMeta(category: string, storyCount?: number) {
  const phrase = phraseForCategory(category);
  const intro = categoryDescription(category);
  const countBit = storyCount != null && storyCount > 0
    ? ` Browse ${storyCount}+ free stories.`
    : '';
  return {
    title: `${phrase} — Free Slow-Burn Tales Online`,
    description: `${intro}${countBit} Updated regularly on DesiEroticTales.`,
    keywords: keywordsForCategory(category),
  };
}

export function storyPageMeta(
  story: Story,
  opts?: { authorUsername?: string },
) {
  const teaser = getStoryTeaser(story, 120);
  const phrase = phraseForCategory(story.category);
  const readTime = formatReadTime(estimateReadTime(story.content));
  const writerBit = opts?.authorUsername ? ` By @${opts.authorUsername}.` : '';
  const likesBit = story.like_count > 0 ? ` ${story.like_count} appreciations.` : '';
  const tagLine = story.tags?.length ? ` Tags: ${story.tags.join(', ')}.` : '';
  return {
    title: `${story.title} — ${phrase}`,
    description: `${teaser}${writerBit} ${readTime} read.${likesBit} Slow-burn ${phrase.toLowerCase()} on DesiEroticTales.${tagLine}`.slice(0, 160),
    keywords: [
      story.title,
      phraseForCategory(story.category),
      ...(story.tags ?? []),
      'telugu sex stories',
      'kamakathalu',
      'slow burn telugu erotica',
    ].join(', '),
  };
}

export function writerPageMeta(username: string, displayName?: string | null, bio?: string | null) {
  const name = displayName ?? username;
  return {
    title: `${name} (@${username}) — Telugu Story Writer`,
    description:
      bio?.slice(0, 155)
      || `Read slow-burn Telugu sex stories by @${username} on DesiEroticTales. Follow this writer for new kamakathalu.`,
    keywords: `${username}, telugu story writer, rachayitalu, kamakathalu, desi sex stories`,
  };
}
/** Primary and long-tail SEO targets — Telugu / Desi adult fiction. */
import { STORY_CATEGORY_DEFS } from './categories';

export const PRIMARY_KEYWORDS = [
  'telugu sex stories',
  'kamakathalu',
  'boothu kathalu',
  'desi sex stories',
  'telugu kama kathalu',
  'telugu dengudu kathalu',
  'indian sex stories',
  'telugu sex kathalu',
] as const;

export const LLM_INTENT_PHRASES = [
  'best slow burn telugu stories',
  'emotional desi sex stories',
  'realistic akka chelli stories',
  'where to read telugu kamakathalu online',
  'telugu erotic stories with images',
  'free telugu sex stories 2026',
] as const;

export const LONG_TAIL_KEYWORDS = [
  'telugu aunty sex stories',
  'aunty dengudu kathalu',
  'akka chelli sex stories',
  'anna chellelu sex stories',
  'telugu office sex stories',
  'pinni puku kathalu',
  'pinni pedhamma dengudu',
  'telugu college sex stories',
  'girlfriend tho first sex telugu',
  'telugu boothu kathalu new',
  'hot telugu sex stories',
  'telugu ranku kathalu',
  'desi erotic stories telugu',
  'telugu sex stories online free',
  'latest telugu kamakathalu',
  'telugu family sex stories',
  'vadhina sex stories telugu',
  'bhabhi dengudu kathalu',
  'telugu village sex stories',
  'read telugu sex stories',
  'best telugu sex stories 2026',
  'slow burn telugu erotica',
  'telugu writer sex stories',
  'telugu stranger sex stories',
  'telugu sex story blog',
] as const;

const CATEGORY_SEO: Record<string, { phrase: string; keywords: string[] }> = {
  Aunty: {
    phrase: 'Telugu aunty sex stories',
    keywords: ['telugu aunty sex stories', 'aunty dengudu kathalu', 'pakkinti aunty'],
  },
  'Akka-Chelli': {
    phrase: 'Akka chelli sex stories',
    keywords: ['akka chelli sex stories', 'anna chellelu kathalu', 'telugu sibling stories'],
  },
  'Pinni-Peddamma': {
    phrase: 'Pinni pedhamma sex stories',
    keywords: ['pinni puku kathalu', 'pinni pedhamma dengudu', 'telugu pinni stories'],
  },
  Office: {
    phrase: 'Office sex stories Telugu',
    keywords: ['telugu office sex stories', 'boss dengudu kathalu', 'panimanishi stories'],
  },
  College: {
    phrase: 'College sex stories Telugu',
    keywords: ['telugu college sex stories', 'hostel ranku kathalu', 'campus sex stories'],
  },
  Village: {
    phrase: 'Village sex stories Telugu',
    keywords: ['telugu village sex stories', 'pakkinti kathalu', 'desi home stories'],
  },
  Bhabhi: {
    phrase: 'Bhabhi sex stories Telugu',
    keywords: ['bhabhi dengudu kathalu', 'vadhina sex stories', 'telugu bhabhi stories'],
  },
  Stranger: {
    phrase: 'Stranger sex stories Telugu',
    keywords: ['telugu stranger sex stories', 'public place kathalu', 'fantasy telugu erotica'],
  },
  'First-Time': {
    phrase: 'First time sex stories Telugu',
    keywords: ['first time telugu sex stories', 'friend pellam kathalu', 'girlfriend tho sex'],
  },
  Other: {
    phrase: 'Telugu sex stories',
    keywords: ['telugu sex kathalu', 'kamakathalu', 'boothu kathalu'],
  },
};

/** Category → SEO phrase, description, and keywords */
export const CATEGORY_KEYWORDS: Record<string, { phrase: string; description: string; keywords: string[] }> =
  Object.fromEntries(
    STORY_CATEGORY_DEFS.map((def) => [
      def.id,
      {
        phrase: CATEGORY_SEO[def.id]?.phrase ?? `${def.label}`,
        description: def.description,
        keywords: CATEGORY_SEO[def.id]?.keywords ?? [def.label.toLowerCase()],
      },
    ]),
  );

export const POPULAR_CATEGORIES = STORY_CATEGORY_DEFS.slice(0, 6).map((def) => ({
  category: def.id,
  description: def.description,
}));

export function keywordsForCategory(category: string): string {
  const entry = CATEGORY_KEYWORDS[category];
  if (entry) return entry.keywords.join(', ');
  return PRIMARY_KEYWORDS.join(', ');
}

export function phraseForCategory(category: string): string {
  return CATEGORY_KEYWORDS[category]?.phrase ?? `${category} Telugu sex stories`;
}

export function categoryDescription(category: string): string {
  return CATEGORY_KEYWORDS[category]?.description
    ?? `Free ${phraseForCategory(category).toLowerCase()} on DesiEroticTales.`;
}
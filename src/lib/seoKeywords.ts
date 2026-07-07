/** Primary and long-tail SEO targets — Telugu / Desi adult fiction. */
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

/** Conversational phrases people ask AI tools. */
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
  'telugu panimanishi sex stories',
  'pakkinti aunty sex story',
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
  'maradhalu dengudu kathalu',
  'telugu milf sex stories',
  'gumpu dengudu kathalu',
  'telugu fantasy sex stories',
  'read telugu sex stories',
  'best telugu sex stories 2026',
  'telugu sex stories with photos',
  'slow burn telugu erotica',
  'telugu writer sex stories',
  'amma koduku sex stories',
  'telugu neighbor sex stories',
  'yavannam sex stories',
  'telugu sex story blog',
] as const;

/** Category → SEO phrase, description, and keywords */
export const CATEGORY_KEYWORDS: Record<string, { phrase: string; description: string; keywords: string[] }> = {
  Aunty: {
    phrase: 'Telugu aunty sex stories',
    description: 'Mature aunty and pakkinti slow-burn tales in Telugu — emotional, realistic desi erotica.',
    keywords: ['telugu aunty sex stories', 'aunty dengudu kathalu', 'pakkinti aunty'],
  },
  'Akka-Chelli': {
    phrase: 'Akka chelli sex stories',
    description: 'Realistic akka chelli and anna chellelu slow-burn fiction — emotional sibling tales in Telugu.',
    keywords: ['akka chelli sex stories', 'anna chellelu kathalu', 'telugu incest stories'],
  },
  'Amma-Koduku': {
    phrase: 'Amma koduku sex stories',
    description: 'Telugu family slow-burn stories in the amma koduku category.',
    keywords: ['amma koduku sex stories', 'telugu family ranku'],
  },
  Friend: {
    phrase: 'Friend sex stories Telugu',
    description: 'Friend pellam and girlfriend slow-burn Telugu tales — first-time and emotional romance.',
    keywords: ['telugu friend sex stories', 'girlfriend tho sex', 'friend pellam kathalu'],
  },
  Office: {
    phrase: 'Office sex stories Telugu',
    description: 'Workplace slow-burn Telugu erotica — boss, colleague, and panimanishi tension.',
    keywords: ['telugu office sex stories', 'panimanishi dengudu'],
  },
  Fantasy: {
    phrase: 'Telugu fantasy sex stories',
    description: 'Imaginative slow-burn Telugu erotica — fantasy scenarios with emotional depth.',
    keywords: ['telugu fantasy sex stories', 'hot telugu erotica'],
  },
  Neighbor: {
    phrase: 'Neighbor sex stories Telugu',
    description: 'Pakkinti neighbor slow-burn tales — realistic Telugu desi fiction.',
    keywords: ['pakkinti sex stories', 'telugu neighbor kathalu'],
  },
  Cousin: {
    phrase: 'Cousin sex stories Telugu',
    description: 'Maradhalu and cousin slow-burn Telugu kathalu with emotional buildup.',
    keywords: ['telugu cousin sex stories', 'maradhalu kathalu'],
  },
  College: {
    phrase: 'College sex stories Telugu',
    description: 'Campus slow-burn Telugu stories — college romance and first experiences.',
    keywords: ['telugu college sex stories', 'campus ranku kathalu'],
  },
  MILF: {
    phrase: 'Telugu MILF sex stories',
    description: 'Mature MILF slow-burn Telugu tales — confident, emotional desi erotica.',
    keywords: ['telugu milf stories', 'mature aunty kathalu'],
  },
  'Pakkinti Valu': {
    phrase: 'Pakkinti sex stories',
    description: 'Next-door slow-burn Telugu stories — pakkinti vala dengudu kathalu.',
    keywords: ['pakkinti vala dengudu', 'neighbor telugu stories'],
  },
  Panimanishi: {
    phrase: 'Panimanishi sex stories',
    description: 'Maid and panimanishi slow-burn Telugu erotica — domestic tension and desire.',
    keywords: ['telugu panimanishi sex stories', 'maid dengudu kathalu'],
  },
  'Pinni-Pedhamma': {
    phrase: 'Pinni pedhamma sex stories',
    description: 'Pinni and pedhamma slow-burn Telugu kathalu — family-adjacent emotional tales.',
    keywords: ['pinni puku kathalu', 'pinni pedhamma dengudu'],
  },
  Maradhalu: {
    phrase: 'Maradhalu sex stories',
    description: 'Maradhalu cousin slow-burn Telugu stories — realistic emotional buildup.',
    keywords: ['maradhalu dengudu', 'cousin telugu kathalu'],
  },
  Vadhina: {
    phrase: 'Vadhina sex stories Telugu',
    description: 'Vadhina slow-burn Telugu erotica — sister-in-law tales with tension and emotion.',
    keywords: ['vadhina dengudu kathalu', 'telugu vadhina stories'],
  },
  Gumpu: {
    phrase: 'Gumpu dengudu kathalu',
    description: 'Group slow-burn Telugu stories — gumpu dengudu with narrative depth.',
    keywords: ['gumpu dengudu', 'telugu group sex stories'],
  },
  Yavannam: {
    phrase: 'Yavannam sex stories',
    description: 'Yavannam romance slow-burn Telugu tales — emotional desi fiction.',
    keywords: ['yavannam kathalu', 'telugu romance sex stories'],
  },
  Audio: {
    phrase: 'Audio Telugu sex stories',
    description: 'Audio-format Telugu erotic stories and boothu kathalu.',
    keywords: ['audio telugu sex stories', 'telugu boothu audio'],
  },
  Photos: {
    phrase: 'Telugu sex stories with photos',
    description: 'Telugu erotic stories with illustrated covers and photo galleries.',
    keywords: ['telugu sex photos', 'telugu sex stories with images'],
  },
  Other: {
    phrase: 'Telugu sex stories',
    description: 'General Telugu kamakathalu and boothu kathalu — slow-burn desi erotica.',
    keywords: ['telugu sex kathalu', 'kamakathalu', 'boothu kathalu'],
  },
};

/** Featured categories for homepage AI overview block. */
export const POPULAR_CATEGORIES = [
  { category: 'Aunty', description: CATEGORY_KEYWORDS.Aunty.description },
  { category: 'Akka-Chelli', description: CATEGORY_KEYWORDS['Akka-Chelli'].description },
  { category: 'Office', description: CATEGORY_KEYWORDS.Office.description },
  { category: 'College', description: CATEGORY_KEYWORDS.College.description },
  { category: 'Pinni-Pedhamma', description: CATEGORY_KEYWORDS['Pinni-Pedhamma'].description },
  { category: 'Friend', description: CATEGORY_KEYWORDS.Friend.description },
] as const;

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
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

/** Category → SEO phrase for titles and descriptions */
export const CATEGORY_KEYWORDS: Record<string, { phrase: string; keywords: string[] }> = {
  Aunty: {
    phrase: 'Telugu aunty sex stories',
    keywords: ['telugu aunty sex stories', 'aunty dengudu kathalu', 'pakkinti aunty'],
  },
  'Akka-Chelli': {
    phrase: 'Akka chelli sex stories',
    keywords: ['akka chelli sex stories', 'anna chellelu kathalu', 'telugu incest stories'],
  },
  'Amma-Koduku': {
    phrase: 'Amma koduku sex stories',
    keywords: ['amma koduku sex stories', 'telugu family ranku'],
  },
  Friend: {
    phrase: 'Friend sex stories Telugu',
    keywords: ['telugu friend sex stories', 'girlfriend tho sex', 'friend pellam kathalu'],
  },
  Office: {
    phrase: 'Office sex stories Telugu',
    keywords: ['telugu office sex stories', 'panimanishi dengudu'],
  },
  Fantasy: {
    phrase: 'Telugu fantasy sex stories',
    keywords: ['telugu fantasy sex stories', 'hot telugu erotica'],
  },
  Neighbor: {
    phrase: 'Neighbor sex stories Telugu',
    keywords: ['pakkinti sex stories', 'telugu neighbor kathalu'],
  },
  Cousin: {
    phrase: 'Cousin sex stories Telugu',
    keywords: ['telugu cousin sex stories', 'maradhalu kathalu'],
  },
  College: {
    phrase: 'College sex stories Telugu',
    keywords: ['telugu college sex stories', 'campus ranku kathalu'],
  },
  MILF: {
    phrase: 'Telugu MILF sex stories',
    keywords: ['telugu milf stories', 'mature aunty kathalu'],
  },
  'Pakkinti Valu': {
    phrase: 'Pakkinti sex stories',
    keywords: ['pakkinti vala dengudu', 'neighbor telugu stories'],
  },
  Panimanishi: {
    phrase: 'Panimanishi sex stories',
    keywords: ['telugu panimanishi sex stories', 'maid dengudu kathalu'],
  },
  'Pinni-Pedhamma': {
    phrase: 'Pinni pedhamma sex stories',
    keywords: ['pinni puku kathalu', 'pinni pedhamma dengudu'],
  },
  Maradhalu: {
    phrase: 'Maradhalu sex stories',
    keywords: ['maradhalu dengudu', 'cousin telugu kathalu'],
  },
  Vadhina: {
    phrase: 'Vadhina sex stories Telugu',
    keywords: ['vadhina dengudu kathalu', 'telugu vadhina stories'],
  },
  Gumpu: {
    phrase: 'Gumpu dengudu kathalu',
    keywords: ['gumpu dengudu', 'telugu group sex stories'],
  },
  Yavannam: {
    phrase: 'Yavannam sex stories',
    keywords: ['yavannam kathalu', 'telugu romance sex stories'],
  },
  Audio: {
    phrase: 'Audio Telugu sex stories',
    keywords: ['audio telugu sex stories', 'telugu boothu audio'],
  },
  Photos: {
    phrase: 'Telugu sex stories with photos',
    keywords: ['telugu sex photos', 'telugu sex stories with images'],
  },
  Other: {
    phrase: 'Telugu sex stories',
    keywords: ['telugu sex kathalu', 'kamakathalu', 'boothu kathalu'],
  },
};

export function keywordsForCategory(category: string): string {
  const entry = CATEGORY_KEYWORDS[category];
  if (entry) return entry.keywords.join(', ');
  return PRIMARY_KEYWORDS.join(', ');
}

export function phraseForCategory(category: string): string {
  return CATEGORY_KEYWORDS[category]?.phrase ?? `${category} Telugu sex stories`;
}
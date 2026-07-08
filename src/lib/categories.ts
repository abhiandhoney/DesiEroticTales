/**
 * Canonical story categories — single source of truth for labels, slugs, and SEO.
 */
export const STORY_CATEGORY_DEFS = [
  {
    id: 'Aunty',
    label: 'Aunty Stories',
    slug: 'aunty-stories',
    description: 'Mature aunty and pakkinti slow-burn tales in Telugu — emotional, realistic desi erotica.',
  },
  {
    id: 'Akka-Chelli',
    label: 'Akka-Chelli Stories',
    slug: 'akka-chelli-stories',
    description: 'Akka chelli and anna chellelu slow-burn fiction — emotional sibling tales in Telugu.',
  },
  {
    id: 'Pinni-Peddamma',
    label: 'Pinni / Peddamma Stories',
    slug: 'pinni-peddamma-stories',
    description: 'Pinni and pedhamma slow-burn Telugu kathalu — family-adjacent emotional tales.',
  },
  {
    id: 'Office',
    label: 'Office',
    slug: 'office-stories',
    description: 'Workplace slow-burn Telugu erotica — boss, colleague, and panimanishi tension.',
  },
  {
    id: 'College',
    label: 'College',
    slug: 'college-stories',
    description: 'Campus and hostel slow-burn Telugu stories — college romance and first experiences.',
  },
  {
    id: 'Village',
    label: 'Village / Home Stories',
    slug: 'village-stories',
    description: 'Village and home slow-burn Telugu tales — pakkinti, cousin, and desi family drama.',
  },
  {
    id: 'Bhabhi',
    label: 'Bhabhi Stories',
    slug: 'bhabhi-stories',
    description: 'Bhabhi and vadhina slow-burn Telugu erotica — sister-in-law tales with tension and emotion.',
  },
  {
    id: 'Stranger',
    label: 'Stranger',
    slug: 'stranger-stories',
    description: 'Stranger and public-place slow-burn Telugu tales — fantasy scenarios with emotional depth.',
  },
  {
    id: 'First-Time',
    label: 'First Time Stories',
    slug: 'first-time-stories',
    description: 'First-time and slow-burn romance Telugu kathalu — friend, lover, and new experiences.',
  },
  {
    id: 'Other',
    label: 'Other Stories',
    slug: 'other-stories',
    description: 'General Telugu kamakathalu and boothu kathalu — slow-burn desi erotica.',
  },
] as const;

export type StoryCategory = (typeof STORY_CATEGORY_DEFS)[number]['id'];

export const STORY_CATEGORIES: readonly StoryCategory[] = STORY_CATEGORY_DEFS.map((c) => c.id);

export const CATEGORY_SLUG_MAP: Record<StoryCategory, string> = Object.fromEntries(
  STORY_CATEGORY_DEFS.map((c) => [c.id, c.slug]),
) as Record<StoryCategory, string>;

/** Legacy slugs from older builds → canonical category id. */
export const LEGACY_CATEGORY_SLUGS: Record<string, StoryCategory> = {
  'aunty-sex-stories': 'Aunty',
  'anna-chellelu': 'Akka-Chelli',
  'akka-chelli-stories': 'Akka-Chelli',
  'amma-koduku': 'Village',
  'friend-pellam': 'First-Time',
  'office-sex': 'Office',
  fantasy: 'Stranger',
  'pakkinti-valu': 'Village',
  cousin: 'Village',
  college: 'College',
  milf: 'Aunty',
  panimanishi: 'Office',
  'pinni-pedhamma-dengudu': 'Pinni-Peddamma',
  'pinni-peddamma-stories': 'Pinni-Peddamma',
  maradhalu: 'Village',
  vadhina: 'Bhabhi',
  'gumpu-dengudu': 'Stranger',
  yavannam: 'First-Time',
  'audio-telugu-sex-stories': 'Other',
  'telugu-sex-photos': 'Other',
  'telugu-sex-stories': 'Other',
  'other-stories': 'Other',
};

/** Map legacy DB category values to the new canonical set. */
export const LEGACY_CATEGORY_IDS: Record<string, StoryCategory> = {
  Aunty: 'Aunty',
  'Akka-Chelli': 'Akka-Chelli',
  'Pinni-Pedhamma': 'Pinni-Peddamma',
  'Pinni-Peddamma': 'Pinni-Peddamma',
  Office: 'Office',
  Panimanishi: 'Office',
  College: 'College',
  'Amma-Koduku': 'Village',
  Neighbor: 'Village',
  'Pakkinti Valu': 'Village',
  Cousin: 'Village',
  Maradhalu: 'Village',
  Village: 'Village',
  Vadhina: 'Bhabhi',
  Bhabhi: 'Bhabhi',
  MILF: 'Aunty',
  Friend: 'First-Time',
  Yavannam: 'First-Time',
  'First-Time': 'First-Time',
  Fantasy: 'Stranger',
  Gumpu: 'Stranger',
  Stranger: 'Stranger',
  Audio: 'Other',
  Photos: 'Other',
  Other: 'Other',
};

export function normalizeCategory(value: string | null | undefined): StoryCategory {
  if (!value) return 'Other';
  const mapped = LEGACY_CATEGORY_IDS[value];
  if (mapped) return mapped;
  if ((STORY_CATEGORIES as readonly string[]).includes(value)) return value as StoryCategory;
  return 'Other';
}

export function categoryLabel(category: string): string {
  const def = STORY_CATEGORY_DEFS.find((c) => c.id === normalizeCategory(category));
  return def?.label ?? category;
}

export function storyCategories(story: {
  category: string;
  categories?: string[] | null;
}): StoryCategory[] {
  const raw = story.categories?.length
    ? story.categories
    : [story.category];
  const seen = new Set<StoryCategory>();
  const out: StoryCategory[] = [];
  for (const item of raw) {
    const norm = normalizeCategory(item);
    if (!seen.has(norm)) {
      seen.add(norm);
      out.push(norm);
    }
  }
  return out.length ? out : ['Other'];
}

export function primaryCategory(story: {
  category: string;
  categories?: string[] | null;
}): StoryCategory {
  return storyCategories(story)[0];
}
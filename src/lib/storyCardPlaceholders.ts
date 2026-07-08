const PLACEHOLDERS = [
  '/assets/card-placeholders/placeholder-1.webp',
  '/assets/card-placeholders/placeholder-2.webp',
  '/assets/card-placeholders/placeholder-3.webp',
  '/assets/card-placeholders/placeholder-4.webp',
] as const;

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** Stable placeholder per story — same card always gets the same image. */
export function getStoryCardPlaceholder(storyId: string): string {
  const index = hashString(storyId) % PLACEHOLDERS.length;
  return PLACEHOLDERS[index];
}

export function hasStoryCover(story: {
  image_url?: string | null;
  card_image_url?: string | null;
}): boolean {
  return Boolean(story.card_image_url?.trim() || story.image_url?.trim());
}
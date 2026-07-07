import type { Story } from '../types';

/** Cropped 16:9 image for story cards, home featured, and listings. */
export function getCardImageUrl(story: Story): string | null {
  return story.card_image_url ?? story.image_url;
}

/** Optional hero cover (separate from inline editor images). */
export function getStoryCoverUrl(story: Story): string | null {
  return story.image_url;
}

/** Legacy gallery carousel — pre–rich-editor stories only. */
export function getLegacyGalleryUrls(story: Story): string[] {
  if (story.content_html) return [];
  const gallery = Array.isArray(story.gallery_urls) ? story.gallery_urls : [];
  const urls: string[] = [];
  for (const url of gallery) {
    if (url && url !== story.image_url && url !== story.card_image_url && !urls.includes(url)) {
      urls.push(url);
    }
  }
  return urls;
}

/** @deprecated Use getStoryCoverUrl + inline HTML images */
export function getStoryMediaUrls(story: Story): string[] {
  const urls: string[] = [];
  if (story.image_url) urls.push(story.image_url);
  urls.push(...getLegacyGalleryUrls(story));
  return urls;
}
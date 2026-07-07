import type { Story } from '../types';

/** Cropped 16:9 image for story cards, home featured, and listings. */
export function getCardImageUrl(story: Story): string | null {
  return story.card_image_url ?? story.image_url;
}

/** Full-resolution media for story reading view (never the card crop). */
export function getStoryMediaUrls(story: Story): string[] {
  const gallery = Array.isArray(story.gallery_urls) ? story.gallery_urls : [];
  const urls: string[] = [];
  if (story.image_url) urls.push(story.image_url);
  for (const url of gallery) {
    if (url && url !== story.card_image_url && !urls.includes(url)) urls.push(url);
  }
  return urls;
}
import type { Story } from '../types';

/** All displayable media URLs: cover first, then gallery (deduped). */
export function getStoryMediaUrls(story: Story): string[] {
  const gallery = Array.isArray(story.gallery_urls) ? story.gallery_urls : [];
  const urls: string[] = [];
  if (story.image_url) urls.push(story.image_url);
  for (const url of gallery) {
    if (url && !urls.includes(url)) urls.push(url);
  }
  return urls;
}
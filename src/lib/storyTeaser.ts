import type { Story } from '../types';
import { storyPlainText } from './richText';

/** Display text for story cards — uses teaser if set, otherwise truncates content. */
export function getStoryTeaser(story: Story, maxLen = 200): string {
  const teaser = story.teaser?.trim();
  if (teaser) return teaser.length > maxLen ? teaser.slice(0, maxLen) + '...' : teaser;

  const plain = storyPlainText(story).replace(/\s+/g, ' ').trim();
  return plain.length > maxLen ? plain.slice(0, maxLen) + '...' : plain;
}
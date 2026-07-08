import { supabase } from './supabase';
import { deleteStoryImages } from './storyImages';
import { clearStoryDraftCacheByStoryId } from './storyDraftCache';
import type { Story } from '../types';

const IMG_SRC_RE = /<img[^>]+src=["']([^"']+)["']/gi;

function isStoryImageUrl(url: string): boolean {
  return (
    url.includes('/story-images/')
    || url.includes('/story-images-draft/')
    || url.startsWith('det-draft://')
  );
}

export function extractImageUrlsFromHtml(html: string | null | undefined): string[] {
  if (!html) return [];
  const urls: string[] = [];
  let match: RegExpExecArray | null;
  IMG_SRC_RE.lastIndex = 0;
  while ((match = IMG_SRC_RE.exec(html)) !== null) {
    const src = match[1];
    if (src && isStoryImageUrl(src) && !urls.includes(src)) urls.push(src);
  }
  return urls;
}

export function extractImageUrlsFromContentJson(
  contentJson: Story['content_json'],
): string[] {
  if (!contentJson || typeof contentJson !== 'object') return [];
  const urls: string[] = [];

  function walk(node: unknown): void {
    if (!node || typeof node !== 'object') return;
    const n = node as { type?: string; attrs?: { src?: string }; content?: unknown[] };
    if (n.type === 'image' && n.attrs?.src && isStoryImageUrl(n.attrs.src)) {
      if (!urls.includes(n.attrs.src)) urls.push(n.attrs.src);
    }
    if (Array.isArray(n.content)) n.content.forEach(walk);
  }

  walk(contentJson);
  return urls;
}

export function collectStoryImageUrls(story: Pick<
  Story,
  'image_url' | 'card_image_url' | 'gallery_urls' | 'content_html' | 'content_json'
>): string[] {
  const urls: string[] = [];
  const add = (url: string | null | undefined) => {
    if (url && isStoryImageUrl(url) && !urls.includes(url)) urls.push(url);
  };

  add(story.image_url);
  add(story.card_image_url);
  if (Array.isArray(story.gallery_urls)) story.gallery_urls.forEach(add);
  extractImageUrlsFromHtml(story.content_html).forEach(add);
  extractImageUrlsFromContentJson(story.content_json).forEach(add);

  return urls;
}

export async function deleteStoryById(storyId: string): Promise<void> {
  const { data: story, error: fetchError } = await supabase
    .from('stories')
    .select('id, image_url, card_image_url, gallery_urls, content_html, content_json')
    .eq('id', storyId)
    .single();

  if (fetchError) throw fetchError;
  if (!story) throw new Error('Story not found.');

  const imageUrls = collectStoryImageUrls(story);

  const { error: deleteError } = await supabase.from('stories').delete().eq('id', storyId);
  if (deleteError) throw deleteError;

  clearStoryDraftCacheByStoryId(storyId);

  if (imageUrls.length) {
    try {
      await deleteStoryImages(imageUrls);
    } catch {
      // Row removed; storage cleanup is best-effort.
    }
  }
}
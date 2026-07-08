import type { JSONContent } from '@tiptap/core';
import { promoteImageToPublic, isDraftImageUrl } from './storyImages';

async function promoteIfNeeded(userId: string, url: string | null): Promise<string | null> {
  if (!url || !isDraftImageUrl(url)) return url;
  return promoteImageToPublic(userId, url);
}

function walkJsonPromote(
  node: JSONContent,
  replace: (url: string) => string,
): JSONContent {
  const next = { ...node };
  if (next.type === 'image' && next.attrs?.src) {
    next.attrs = { ...next.attrs, src: replace(String(next.attrs.src)) };
  }
  if (next.content?.length) {
    next.content = next.content.map((child) => walkJsonPromote(child, replace));
  }
  return next;
}

export async function promoteStoryMediaForPublish(
  userId: string,
  fields: {
    image_url: string | null;
    card_image_url: string | null;
    content_html: string | null;
    content_json: JSONContent | null;
  },
): Promise<{
  image_url: string | null;
  card_image_url: string | null;
  content_html: string | null;
  content_json: JSONContent | null;
}> {
  const urlMap = new Map<string, string>();

  async function mapUrl(url: string): Promise<string> {
    if (!isDraftImageUrl(url)) return url;
    const cached = urlMap.get(url);
    if (cached) return cached;
    const promoted = await promoteImageToPublic(userId, url);
    urlMap.set(url, promoted);
    return promoted;
  }

  const image_url = await promoteIfNeeded(userId, fields.image_url);
  const card_image_url = await promoteIfNeeded(userId, fields.card_image_url);

  let content_html = fields.content_html;
  if (content_html) {
    const refs = [...content_html.matchAll(/det-draft:\/\/[^"'\s>]+/g)].map((m) => m[0]);
    for (const ref of refs) {
      const promoted = await mapUrl(ref);
      content_html = content_html.split(ref).join(promoted);
    }
  }

  let content_json = fields.content_json;
  if (content_json) {
    const refs: string[] = [];
    const collect = (node: JSONContent) => {
      if (node.type === 'image' && node.attrs?.src) refs.push(String(node.attrs.src));
      node.content?.forEach(collect);
    };
    collect(content_json);
    for (const ref of refs) {
      if (isDraftImageUrl(ref)) await mapUrl(ref);
    }
    content_json = walkJsonPromote(content_json, (url) => urlMap.get(url) ?? url);
  }

  return { image_url, card_image_url, content_html, content_json };
}
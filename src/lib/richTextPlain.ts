import type { JSONContent } from '@tiptap/core';
import type { Story } from '../types';

export function emptyRichDoc(): JSONContent {
  return { type: 'doc', content: [{ type: 'paragraph' }] };
}

function nodePlainText(node: JSONContent): string {
  if (node.type === 'text') return node.text ?? '';
  if (!node.content?.length) return '';
  const inner = node.content.map(nodePlainText).join('');
  if (node.type === 'paragraph' || node.type === 'heading') return `${inner}\n\n`;
  return inner;
}

export function jsonToPlainText(json: JSONContent): string {
  return nodePlainText(json).replace(/\n{3,}/g, '\n\n').trim();
}

export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function storyPlainText(story: Pick<Story, 'content' | 'content_json' | 'content_html'>): string {
  if (story.content_json) {
    const plain = jsonToPlainText(story.content_json as JSONContent).trim();
    if (plain) return plain;
  }
  if (story.content_html) {
    return stripHtml(story.content_html);
  }
  return story.content ?? '';
}

export function isDocEmpty(json: JSONContent | null | undefined): boolean {
  if (!json) return true;
  return jsonToPlainText(json).trim().length === 0;
}

export function minPlainLength(json: JSONContent): number {
  return jsonToPlainText(json).trim().length;
}
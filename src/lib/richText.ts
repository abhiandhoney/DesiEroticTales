import type { Extensions, JSONContent } from '@tiptap/core';
import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import type { Story } from '../types';

export const richTextExtensions: Extensions = [
  StarterKit.configure({
    heading: { levels: [2] },
  }),
  Image.configure({
    inline: false,
    allowBase64: false,
  }),
  Link.configure({
    openOnClick: false,
    HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
  }),
];

export function emptyRichDoc(): JSONContent {
  return { type: 'doc', content: [{ type: 'paragraph' }] };
}

export function docFromLegacyPlainText(text: string): JSONContent {
  const blocks = text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  if (blocks.length === 0) return emptyRichDoc();
  return {
    type: 'doc',
    content: blocks.map((block) => {
      if (block.startsWith('## ')) {
        return {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: block.slice(3).trim() }],
        };
      }
      return {
        type: 'paragraph',
        content: [{ type: 'text', text: block }],
      };
    }),
  };
}

export function parseStoryDoc(story: Pick<Story, 'content' | 'content_json'>): JSONContent {
  if (story.content_json && typeof story.content_json === 'object') {
    return story.content_json as JSONContent;
  }
  return docFromLegacyPlainText(story.content ?? '');
}

export function jsonToHtml(json: JSONContent): string {
  return generateHTML(json, richTextExtensions);
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

export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isDocEmpty(json: JSONContent | null | undefined): boolean {
  if (!json) return true;
  const text = jsonToPlainText(json).trim();
  return text.length === 0;
}

export function minPlainLength(json: JSONContent): number {
  return jsonToPlainText(json).trim().length;
}
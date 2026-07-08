import type { Extensions, JSONContent } from '@tiptap/core';
import { Extension } from '@tiptap/core';
import { generateHTML } from '@tiptap/html';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import type { Story } from '../types';
import { emptyRichDoc } from './richTextPlain';
import { isDraftImageUrl, resolveStoryImageUrl } from './storyImages';

const resolveDraftImagesKey = new PluginKey('resolveDraftImages');

function resolveDraftImagesPlugin(): Plugin {
  return new Plugin({
    key: resolveDraftImagesKey,
    view(editorView) {
      const pending = new WeakSet<HTMLImageElement>();

      const resolveImages = () => {
        editorView.dom.querySelectorAll<HTMLImageElement>('img').forEach((img) => {
          const src = img.getAttribute('src');
          if (!src || !isDraftImageUrl(src) || pending.has(img)) return;
          pending.add(img);
          void resolveStoryImageUrl(src).then((url) => {
            pending.delete(img);
            if (url && img.isConnected) img.setAttribute('src', url);
          });
        });
      };

      resolveImages();
      return {
        update(view, prevState) {
          if (!prevState.doc.eq(view.state.doc)) resolveImages();
        },
      };
    },
  });
}

const DraftImageResolver = Extension.create({
  name: 'draftImageResolver',
  addProseMirrorPlugins() {
    return [resolveDraftImagesPlugin()];
  },
});

export function isSafeStoryLink(url: string): boolean {
  return /^https?:\/\//i.test(url.trim());
}

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
    validate: (href) => isSafeStoryLink(href),
  }),
  DraftImageResolver,
];

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
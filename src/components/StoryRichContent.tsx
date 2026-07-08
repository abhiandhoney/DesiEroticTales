import { useEffect, useMemo, useRef } from 'react';
import type { Story } from '../types';
import StoryContent from './StoryContent';
import { storyPlainText } from '../lib/richTextPlain';
import { sanitizeStoryHtml } from '../lib/sanitizeHtml';
import { isDraftImageUrl, resolveStoryImageUrl } from '../lib/storyImages';

interface StoryRichContentProps {
  story: Story;
  className?: string;
}

export default function StoryRichContent({ story, className }: StoryRichContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const html = useMemo(
    () => (story.content_html?.trim() ? sanitizeStoryHtml(story.content_html) : null),
    [story.content_html],
  );

  useEffect(() => {
    const root = containerRef.current;
    if (!root || !html) return;

    const pending = new WeakSet<HTMLImageElement>();
    root.querySelectorAll<HTMLImageElement>('img').forEach((img) => {
      const src = img.getAttribute('src');
      if (!src || !isDraftImageUrl(src) || pending.has(img)) return;
      pending.add(img);
      void resolveStoryImageUrl(src).then((url) => {
        pending.delete(img);
        if (url && img.isConnected) img.setAttribute('src', url);
      });
    });
  }, [html]);

  if (html) {
    return (
      <div
        ref={containerRef}
        className={`story-rich-content ${className ?? ''}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return <StoryContent content={storyPlainText(story)} className={className} />;
}
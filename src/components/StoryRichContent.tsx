import type { Story } from '../types';
import StoryContent from './StoryContent';
import { storyPlainText } from '../lib/richText';

interface StoryRichContentProps {
  story: Story;
  className?: string;
}

export default function StoryRichContent({ story, className }: StoryRichContentProps) {
  if (story.content_html?.trim()) {
    return (
      <div
        className={`story-rich-content ${className ?? ''}`}
        dangerouslySetInnerHTML={{ __html: story.content_html }}
      />
    );
  }

  return <StoryContent content={storyPlainText(story)} className={className} />;
}
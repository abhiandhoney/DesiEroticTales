import { parseStoryBlocks } from '../lib/storyContent';

interface StoryContentProps {
  content: string;
  className?: string;
}

export default function StoryContent({ content, className }: StoryContentProps) {
  const blocks = parseStoryBlocks(content);

  return (
    <div className={className}>
      {blocks.map((block, i) =>
        block.type === 'heading' ? (
          <h2 key={i} className="story-section-title">{block.text}</h2>
        ) : (
          <p key={i} className="story-paragraph">{block.text}</p>
        ),
      )}
    </div>
  );
}
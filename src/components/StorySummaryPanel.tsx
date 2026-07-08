import type { Story } from '../types';
import { getStoryTeaser } from '../lib/storyTeaser';

interface StorySummaryPanelProps {
  story: Story;
  readTime: string;
  author?: { slug: string; displayName: string };
}

export default function StorySummaryPanel({ story, readTime, author }: StorySummaryPanelProps) {
  const summary = getStoryTeaser(story, 280);
  const highlights = [
    `Category: ${story.category}`,
    `Style: Slow-burn, emotional Telugu erotica`,
    `Read time: ${readTime}`,
    story.tags?.length ? `Tags: ${story.tags.map((t) => `#${t}`).join(', ')}` : null,
    author ? `Writer: ${author.displayName}` : null,
    story.like_count > 0 ? `${story.like_count.toLocaleString()} reader appreciations` : null,
    story.views > 0 ? `${story.views.toLocaleString()} reads` : null,
  ].filter(Boolean) as string[];

  return (
    <aside className="story-summary-panel" aria-label="Story summary">
      <h2 className="story-summary-heading">Quick Summary</h2>
      <p className="story-summary-text">{summary}</p>
      <h3 className="story-highlights-heading">Key Highlights</h3>
      <ul className="story-highlights-list">
        {highlights.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </aside>
  );
}
import { Link } from 'react-router-dom';
import type { Story } from '../types';

interface StoryCardProps {
  story: Story;
}

function getTeaser(content: string, maxLen = 120): string {
  const plain = content.replace(/\s+/g, ' ').trim();
  return plain.length > maxLen ? plain.slice(0, maxLen) + '…' : plain;
}

export default function StoryCard({ story }: StoryCardProps) {
  return (
    <Link to={`/story/${story.id}`} className="story-card">
      {story.image_url && (
        <div className="story-card-image">
          <img src={story.image_url} alt={story.title} loading="lazy" />
        </div>
      )}
      <div className="story-card-body">
        <span className="story-category">{story.category}</span>
        <h3 className="story-title">{story.title}</h3>
        <p className="story-teaser">{getTeaser(story.content)}</p>
        <div className="story-meta">
          <span className="story-views">{story.views.toLocaleString()} reads</span>
        </div>
      </div>
    </Link>
  );
}
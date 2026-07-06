import { Link } from 'react-router-dom';
import type { Story } from '../types';
import { getStoryTeaser } from '../lib/storyTeaser';

export default function StoryCard({ story }: { story: Story }) {
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
        <p className="story-teaser">{getStoryTeaser(story)}</p>
        <div className="story-meta">
          <span className="story-views">{story.views.toLocaleString()} reads</span>
        </div>
      </div>
    </Link>
  );
}
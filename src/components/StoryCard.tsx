import { Link } from 'react-router-dom';
import type { Story } from '../types';
import { getStoryTeaser } from '../lib/storyTeaser';
import { getStoryMediaUrls } from '../lib/storyMedia';
import SafeImage from './SafeImage';

interface StoryCardProps {
  story: Story;
  badge?: string;
}

export default function StoryCard({ story, badge }: StoryCardProps) {
  const photoCount = getStoryMediaUrls(story).length;
  const likes = story.like_count ?? 0;

  return (
    <Link to={`/story/${story.id}`} className="story-card">
      <div className="story-card-image">
        {story.image_url ? (
          <SafeImage src={story.image_url} alt={story.title} loading="lazy" />
        ) : (
          <div className="safe-image-fallback" />
        )}
        {badge && <span className="story-card-badge">{badge}</span>}
        {story.is_editors_choice && !badge && (
          <span className="story-card-badge">Editor&apos;s Choice</span>
        )}
      </div>
      <div className="story-card-body">
        <span className="story-category">{story.category}</span>
        <h3 className="story-title">{story.title}</h3>
        <p className="story-teaser">{getStoryTeaser(story)}</p>
        <div className="story-meta">
          <span className="story-views">{story.views.toLocaleString()} reads</span>
          {likes > 0 && (
            <>
              <span> · </span>
              <span>👍 {likes.toLocaleString()}</span>
            </>
          )}
          {photoCount > 1 && (
            <>
              <span> · </span>
              <span>{photoCount} photos</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
import { Link } from 'react-router-dom';
import type { Story } from '../types';
import { getStoryTeaser } from '../lib/storyTeaser';
import { getCardImageUrl, getStoryMediaUrls } from '../lib/storyMedia';
import { estimateReadTime, formatReadTime } from '../lib/readTime';
import { storyPlainText } from '../lib/richText';
import SafeImage from './SafeImage';
import { LikeStat } from './LikeIcon';
import { getStoryPath } from '../lib/slug';

interface StoryCardProps {
  story: Story;
  badge?: string;
  authorUsername?: string | null;
}

export default function StoryCard({ story, badge, authorUsername }: StoryCardProps) {
  const cardImage = getCardImageUrl(story);
  const photoCount = getStoryMediaUrls(story).length;
  const likes = story.like_count ?? 0;
  const readMins = estimateReadTime(storyPlainText(story));

  return (
    <Link to={getStoryPath(story)} className="story-card">
      <div className="story-card-image">
        {cardImage ? (
          <SafeImage src={cardImage} alt={story.title} loading="lazy" />
        ) : (
          <div className="safe-image-fallback" />
        )}
        <span className="story-card-category-badge">{story.category}</span>
        {badge && <span className="story-card-badge">{badge}</span>}
        {story.is_editors_choice && !badge && (
          <span className="story-card-badge">Editor&apos;s Choice</span>
        )}
      </div>
      <div className="story-card-body">
        <h3 className="story-title">{story.title}</h3>
        <p className="story-teaser">{getStoryTeaser(story, 140)}</p>
        <div className="story-meta">
          {authorUsername && (
            <>
              <span className="story-card-author">@{authorUsername}</span>
              <span className="story-meta-sep"> · </span>
            </>
          )}
          <span>{formatReadTime(readMins)}</span>
          <span className="story-meta-sep"> · </span>
          <span>{new Date(story.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
          {story.views > 0 && (
            <>
              <span className="story-meta-sep"> · </span>
              <span>{story.views.toLocaleString()} reads</span>
            </>
          )}
          {likes > 0 && (
            <>
              <span className="story-meta-sep"> · </span>
              <LikeStat count={likes} />
            </>
          )}
          {photoCount > 1 && (
            <>
              <span className="story-meta-sep"> · </span>
              <span>{photoCount} photos</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
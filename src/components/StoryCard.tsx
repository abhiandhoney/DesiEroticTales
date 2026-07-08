import { Link, useNavigate } from 'react-router-dom';
import type { Story, StoryAuthorDisplay } from '../types';
import { getStoryTeaser } from '../lib/storyTeaser';
import { getCardImageUrl, getStoryMediaUrls } from '../lib/storyMedia';
import { estimateReadTime, formatReadTime } from '../lib/readTime';
import { storyPlainText } from '../lib/richTextPlain';
import SafeImage from './SafeImage';
import ProfileAvatar from './ProfileAvatar';
import { LikeStat } from './LikeIcon';
import { categoryLabel, primaryCategory } from '../lib/categories';
import { getCategoryPath, getStoryPath, getWriterPath } from '../lib/slug';
import { getStoryCardPlaceholder } from '../lib/storyCardPlaceholders';

interface StoryCardProps {
  story: Story;
  badge?: string;
  /** @deprecated Use authorDisplay */
  authorUsername?: string | null;
  authorDisplay?: StoryAuthorDisplay | null;
}

export default function StoryCard({
  story,
  badge,
  authorUsername,
  authorDisplay,
}: StoryCardProps) {
  const navigate = useNavigate();
  const cardImage = getCardImageUrl(story) ?? getStoryCardPlaceholder(story.id);
  const mainCategory = primaryCategory(story);
  const photoCount = getStoryMediaUrls(story).length;
  const likes = story.like_count ?? 0;
  const readMins = estimateReadTime(storyPlainText(story));

  const author = authorDisplay ?? (authorUsername
    ? { slug: authorUsername, displayName: authorUsername, avatarUrl: null, isPenName: false }
    : null);

  return (
    <Link to={getStoryPath(story)} className="story-card">
      <div className="story-card-image">
        <SafeImage src={cardImage} alt={story.title} loading="lazy" className="story-card-cover" />
        <span
          role="link"
          tabIndex={0}
          className="story-card-category-badge"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            navigate(getCategoryPath(mainCategory));
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              navigate(getCategoryPath(mainCategory));
            }
          }}
        >
          {categoryLabel(mainCategory)}
        </span>
        {badge && <span className="story-card-badge">{badge}</span>}
        {story.is_editors_choice && !badge && (
          <span className="story-card-badge">Editor&apos;s Choice</span>
        )}
      </div>
      <div className="story-card-body">
        <h3 className="story-title">{story.title}</h3>
        <p className="story-teaser">{getStoryTeaser(story, 140)}</p>
        {author && (
          <div className="story-card-author-row">
            <ProfileAvatar
              name={author.displayName}
              avatarUrl={author.avatarUrl}
              size="sm"
              className="story-card-author-avatar"
            />
            <span
              role="link"
              tabIndex={0}
              className="story-card-author-link"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate(getWriterPath(author.slug));
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate(getWriterPath(author.slug));
                }
              }}
            >
              {author.displayName}
            </span>
          </div>
        )}
        <div className="story-meta">
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
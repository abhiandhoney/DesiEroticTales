import { Link, useParams } from 'react-router-dom';
import ReadingProgress from '../components/ReadingProgress';
import StoryMediaGallery from '../components/StoryMediaGallery';
import { useStoryReaction } from '../hooks/useStoryReaction';
import StoryActionBar from '../components/StoryActionBar';
import RelatedStoriesSection from '../components/RelatedStoriesSection';
import { usePageMeta } from '../hooks/usePageMeta';
import { useReadingPrefs } from '../hooks/useReadingPrefs';
import { getStoryTeaser } from '../lib/storyTeaser';
import { getCardImageUrl } from '../lib/storyMedia';
import { estimateReadTime, formatReadTime } from '../lib/readTime';
import { useStoryLoader } from '../hooks/useStoryLoader';
import { getCategoryPath, getStoryCanonicalPath, getWriterPath, RESERVED_PATHS } from '../lib/slug';
import { absoluteUrl, buildArticleJsonLd, buildBreadcrumbJsonLd, storyBreadcrumbs } from '../lib/seo';
import AdSlot from '../components/AdSlot';
import DisqusComments from '../components/DisqusComments';
import NotFound from './NotFound';

interface StoryDetailInnerProps {
  legacyId?: string;
  categorySlug?: string;
  storySlug?: string;
}

function StoryDetailInner({ legacyId, categorySlug, storySlug }: StoryDetailInnerProps) {
  const { story, author, loading, error, storyId } = useStoryLoader({
    legacyId,
    categorySlug,
    storySlug,
  });
  const { contentClass } = useReadingPrefs();
  const reaction = useStoryReaction({
    storyId,
    authorId: story?.user_id ?? '',
    initialLikes: story?.like_count ?? 0,
    initialDislikes: 0,
  });

  const canonicalPath = story?.slug ? getStoryCanonicalPath(story) : undefined;
  const teaser = story ? getStoryTeaser(story, 160) : undefined;

  usePageMeta({
    title: story?.title ?? 'Story',
    description: teaser,
    image: story ? getCardImageUrl(story) : undefined,
    path: canonicalPath,
    canonical: canonicalPath ? absoluteUrl(canonicalPath) : undefined,
    type: 'article',
    jsonLd: story
      ? [
          buildArticleJsonLd(story, {
            authorName: author?.username ? `@${author.username}` : undefined,
            description: teaser ?? '',
            image: getCardImageUrl(story),
          }),
          buildBreadcrumbJsonLd(storyBreadcrumbs(story, author?.username ?? undefined)),
        ]
      : undefined,
  });

  if (loading) {
    return (
      <div className="page-loading" aria-busy="true">
        <div className="spinner" />
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="page error-page">
        <h2>{error || 'Story not found'}</h2>
        <Link to="/stories" className="btn btn-primary">Back to stories</Link>
      </div>
    );
  }

  return (
    <article className="page story-detail-page">
      <ReadingProgress />
      <nav className="story-breadcrumbs" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden="true"> / </span>
        <Link to={getCategoryPath(story.category)}>{story.category}</Link>
        <span aria-hidden="true"> / </span>
        <span>{story.title}</span>
      </nav>
      <Link to="/stories" className="story-back-link">&larr; Back to all stories</Link>
      <header className="story-header">
        <Link to={getCategoryPath(story.category)} className="story-category story-category-link">
          {story.category}
        </Link>
        {story.is_editors_choice && (
          <span className="story-badge-editors">Editor&apos;s Choice</span>
        )}
        <h1 className="story-detail-title">{story.title}</h1>
        {author?.username && (
          <p className="story-author-line">
            By{' '}
            <Link to={getWriterPath(author.username)} className="story-author-link">
              @{author.username}
            </Link>
            {author.display_name && author.display_name !== author.username && (
              <span className="story-author-display"> ({author.display_name})</span>
            )}
          </p>
        )}
        <div className="story-detail-meta">
          <span>{formatReadTime(estimateReadTime(story.content))}</span>
          <span> | </span>
          <span>{story.views.toLocaleString()} reads</span>
          <span> | </span>
          <span>{new Date(story.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
        {story.tags && story.tags.length > 0 && (
          <div className="story-tags">
            {story.tags.map((tag) => (
              <span key={tag} className="story-tag">#{tag}</span>
            ))}
          </div>
        )}
        <StoryActionBar
          placement="header"
          likes={reaction.likes}
          userReaction={reaction.userReaction}
          userId={reaction.userId}
          isOwnStory={reaction.isOwnStory}
          busy={reaction.busy}
          loading={reaction.loading}
          onToggle={reaction.toggle}
          shareTitle={story.title}
          shareText={getStoryTeaser(story, 120)}
        />
      </header>
      <StoryMediaGallery story={story} />
      <AdSlot slot="story-top" className="ad-slot-story-top" />
      <div className={`story-content ${contentClass}`}>
        {story.content.split(/\n\n+/).filter(Boolean).map((para, i) => (
          <p key={i} className="story-paragraph">{para}</p>
        ))}
      </div>
      <footer className="story-end-footer">
        <p className="story-end-prompt">Enjoyed this tale?</p>
        <StoryActionBar
          placement="footer"
          likes={reaction.likes}
          userReaction={reaction.userReaction}
          userId={reaction.userId}
          isOwnStory={reaction.isOwnStory}
          busy={reaction.busy}
          loading={reaction.loading}
          onToggle={reaction.toggle}
          shareTitle={story.title}
          shareText={getStoryTeaser(story, 120)}
        />
      </footer>
      <AdSlot slot="story-bottom" className="ad-slot-story-bottom" />
      <DisqusComments story={story} />
      <RelatedStoriesSection storyId={story.id} category={story.category} />
    </article>
  );
}

/** Legacy `/story/:id` — redirects to canonical slug when available. */
export function StoryDetailLegacy() {
  const { id } = useParams<{ id: string }>();
  return <StoryDetailInner legacyId={id} />;
}

/** Kamakathalu-style `/:categorySlug/:storySlug`. */
export function StoryDetailSlug() {
  const { categorySlug, storySlug } = useParams<{ categorySlug: string; storySlug: string }>();
  if (!categorySlug || !storySlug || RESERVED_PATHS.has(categorySlug)) {
    return <NotFound />;
  }
  return <StoryDetailInner categorySlug={categorySlug} storySlug={storySlug} />;
}

export default StoryDetailLegacy;
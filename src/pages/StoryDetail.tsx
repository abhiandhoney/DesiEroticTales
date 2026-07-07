import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Profile, Story } from '../types';
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

export default function StoryDetail() {
  const { id } = useParams<{ id: string }>();
  const [story, setStory] = useState<Story | null>(null);
  const [author, setAuthor] = useState<Pick<Profile, 'username' | 'display_name'> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const viewsCounted = useRef(false);
  const { contentClass } = useReadingPrefs();
  const reaction = useStoryReaction({
    storyId: id ?? '',
    authorId: story?.user_id ?? '',
    initialLikes: story?.like_count ?? 0,
    initialDislikes: 0,
  });

  usePageMeta({
    title: story?.title ?? 'Story',
    description: story ? getStoryTeaser(story, 160) : undefined,
    image: story ? getCardImageUrl(story) : undefined,
    path: story ? `/story/${story.id}` : id ? `/story/${id}` : undefined,
  });

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    viewsCounted.current = false;

    async function load() {
      setLoading(true);
      setError('');
      const { data, error: err } = await supabase
        .from('stories')
        .select('*')
        .eq('id', id)
        .eq('status', 'approved')
        .single();

      if (cancelled) return;

      if (err || !data) {
        setError('Story not found or not yet approved.');
        setLoading(false);
        return;
      }

      setStory(data as Story);
      setLoading(false);
      fetchAuthor(data.user_id);

      if (!viewsCounted.current) {
        viewsCounted.current = true;
        await supabase.rpc('increment_story_views', { story_id: id });
      }
    }

    load();
    return () => { cancelled = true; };
  }, [id]);

  async function fetchAuthor(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('username, display_name')
      .eq('id', userId)
      .maybeSingle();
    if (data?.username) setAuthor(data as Pick<Profile, 'username' | 'display_name'>);
  }

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
      <Link to="/stories" className="story-back-link">&larr; Back to all stories</Link>
      <header className="story-header">
        <span className="story-category">{story.category}</span>
        {story.is_editors_choice && (
          <span className="story-badge-editors">Editor&apos;s Choice</span>
        )}
        <h1 className="story-detail-title">{story.title}</h1>
        {author?.username && (
          <p className="story-author-line">
            By{' '}
            <Link to={`/writer/${author.username}`} className="story-author-link">
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
      <div className="ad-slot ad-slot-story-top" data-adsterra="story-top">{/* ADSTERRA */}</div>
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
      <div className="ad-slot ad-slot-story-bottom" data-adsterra="story-bottom">{/* ADSTERRA */}</div>
      <RelatedStoriesSection storyId={story.id} category={story.category} />
    </article>
  );
}
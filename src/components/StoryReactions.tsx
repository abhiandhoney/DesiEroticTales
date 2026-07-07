import { signInWithGoogle } from '../hooks/useAuth';
import { useStoryReaction } from '../hooks/useStoryReaction';

interface StoryReactionsProps {
  storyId: string;
  authorId: string;
  likeCount: number;
}

/** Likes only — dislikes deferred to protect writers (see WRITER-SOCIAL-FEATURES-TODO). */
export default function StoryReactions({
  storyId,
  authorId,
  likeCount,
}: StoryReactionsProps) {
  const { likes, userReaction, userId, isOwnStory, busy, toggle } = useStoryReaction({
    storyId,
    authorId,
    initialLikes: likeCount ?? 0,
    initialDislikes: 0,
  });

  if (isOwnStory) {
    return (
      <div className="story-reactions story-reactions-readonly">
        <span className="reaction-stat" title="Likes on your story">👍 {likes}</span>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="story-reactions">
        <span className="reaction-stat">👍 {likes}</span>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => signInWithGoogle(window.location.pathname)}
        >
          Sign in to like
        </button>
      </div>
    );
  }

  return (
    <div className="story-reactions">
      <button
        type="button"
        className={`reaction-btn ${userReaction === 'like' ? 'active-like' : ''}`}
        onClick={() => toggle('like')}
        disabled={busy}
        aria-pressed={userReaction === 'like'}
        aria-label={`Like story (${likes} likes)`}
      >
        👍 <span>{likes}</span>
      </button>
    </div>
  );
}
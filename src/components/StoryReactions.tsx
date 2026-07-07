import { signInWithGoogle } from '../hooks/useAuth';
import { useStoryReaction } from '../hooks/useStoryReaction';
import type { StoryReaction } from '../types';

interface StoryReactionsProps {
  storyId: string;
  authorId: string;
  likeCount: number;
}

interface StoryReactionsBarProps {
  likes: number;
  userReaction: StoryReaction | null;
  userId: string | null;
  isOwnStory: boolean;
  busy: boolean;
  onToggle: (reaction: StoryReaction) => Promise<boolean>;
}

/** Presentational bar — use when parent owns `useStoryReaction`. */
export function StoryReactionsBar({
  likes,
  userReaction,
  userId,
  isOwnStory,
  busy,
  onToggle,
}: StoryReactionsBarProps) {
  if (isOwnStory) {
    return (
      <div className="story-reactions story-reactions-readonly">
        <span className="reaction-stat" title="Likes on your story">👍 {likes.toLocaleString()}</span>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="story-reactions">
        <span className="reaction-stat">👍 {likes.toLocaleString()}</span>
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
        onClick={() => onToggle('like')}
        disabled={busy}
        aria-pressed={userReaction === 'like'}
        aria-label={`Like story (${likes} likes)`}
      >
        👍 <span>{likes.toLocaleString()}</span>
      </button>
    </div>
  );
}

/** Likes only — dislikes deferred to protect writers. */
export default function StoryReactions({
  storyId,
  authorId,
  likeCount,
}: StoryReactionsProps) {
  const state = useStoryReaction({
    storyId,
    authorId,
    initialLikes: likeCount ?? 0,
    initialDislikes: 0,
  });

  return (
    <StoryReactionsBar
      likes={state.likes}
      userReaction={state.userReaction}
      userId={state.userId}
      isOwnStory={state.isOwnStory}
      busy={state.busy}
      onToggle={state.toggle}
    />
  );
}
import { signInWithGoogle } from '../hooks/useAuth';
import { useStoryReaction } from '../hooks/useStoryReaction';
import type { StoryReaction } from '../types';
import { LikeIcon, LikeStat } from './LikeIcon';

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
  const isLiked = userReaction === 'like';

  if (isOwnStory) {
    return (
      <div className="story-reactions story-reactions-readonly">
        <LikeStat count={likes} title="Likes on your story" active={likes > 0} />
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="story-reactions">
        <LikeStat count={likes} />
        <button
          type="button"
          className="like-btn like-btn--signin"
          onClick={() => signInWithGoogle(window.location.pathname)}
        >
          Sign in to appreciate
        </button>
      </div>
    );
  }

  return (
    <div className="story-reactions">
      <button
        type="button"
        className={`like-btn ${isLiked ? 'like-btn--active' : ''}`}
        onClick={() => onToggle('like')}
        disabled={busy}
        aria-pressed={isLiked}
        aria-label={isLiked ? `Remove appreciation (${likes} likes)` : `Appreciate this story (${likes} likes)`}
      >
        <LikeIcon filled={isLiked} />
        <span className="like-btn__label">{isLiked ? 'Appreciated' : 'Appreciate'}</span>
        <span className="like-btn__count">{likes.toLocaleString()}</span>
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
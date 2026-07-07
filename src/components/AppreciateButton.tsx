import { signInWithGoogle } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import type { StoryReaction } from '../types';
import { LikeIcon } from './LikeIcon';

export type AppreciateVariant = 'compact' | 'full';

interface AppreciateButtonProps {
  likes: number;
  userReaction: StoryReaction | null;
  userId: string | null;
  isOwnStory: boolean;
  busy: boolean;
  loading?: boolean;
  variant?: AppreciateVariant;
  onToggle: (reaction: StoryReaction) => Promise<boolean>;
}

export default function AppreciateButton({
  likes,
  userReaction,
  userId,
  isOwnStory,
  busy,
  loading = false,
  variant = 'full',
  onToggle,
}: AppreciateButtonProps) {
  const { toast } = useToast();
  const isLiked = userReaction === 'like';
  const countLabel = likes === 1 ? '1 appreciation' : `${likes.toLocaleString()} appreciations`;

  async function handleToggle() {
    const ok = await onToggle('like');
    if (!ok) toast('Could not save your appreciation. Try again.', 'error');
  }

  if (loading) {
    return (
      <div className="action-btn action-btn--appreciate action-btn--skeleton" aria-busy="true" aria-label="Loading appreciation">
        <span className="action-btn__shimmer" />
      </div>
    );
  }

  if (isOwnStory) {
    return (
      <div
        className="action-btn action-btn--appreciate action-btn--readonly"
        title="Readers can appreciate your story — you cannot appreciate your own"
      >
        <LikeIcon filled={likes > 0} className="action-btn__icon" />
        <span className="action-btn__text">
          <span className="action-btn__label">{countLabel}</span>
          <span className="action-btn__hint">on your story</span>
        </span>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="action-group action-group--guest">
        <div className="action-btn action-btn--appreciate action-btn--readonly action-btn--stat">
          <LikeIcon filled={likes > 0} className="action-btn__icon" />
          <span className="action-btn__count">{likes.toLocaleString()}</span>
        </div>
        <button
          type="button"
          className="action-btn action-btn--appreciate action-btn--signin"
          onClick={() => signInWithGoogle(window.location.pathname)}
        >
          <LikeIcon className="action-btn__icon" />
          <span className="action-btn__label">Sign in to appreciate</span>
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      className={`action-btn action-btn--appreciate ${isLiked ? 'action-btn--active' : ''} ${variant === 'compact' ? 'action-btn--compact' : ''}`}
      onClick={handleToggle}
      disabled={busy}
      aria-pressed={isLiked}
      aria-label={isLiked ? `Remove appreciation (${likes} total)` : `Appreciate this story (${likes} total)`}
    >
      <LikeIcon filled={isLiked} className="action-btn__icon" />
      <span className="action-btn__label">{isLiked ? 'Appreciated' : 'Appreciate'}</span>
      <span className="action-btn__count" aria-hidden="true">{likes.toLocaleString()}</span>
    </button>
  );
}
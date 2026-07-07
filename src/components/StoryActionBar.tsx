import AppreciateButton from './AppreciateButton';
import ShareButton from './ShareButton';
import type { StoryReaction } from '../types';

interface StoryActionBarProps {
  likes: number;
  userReaction: StoryReaction | null;
  userId: string | null;
  isOwnStory: boolean;
  busy: boolean;
  loading?: boolean;
  onToggle: (reaction: StoryReaction) => Promise<boolean>;
  shareTitle: string;
  shareText?: string;
  /** `header` = inline under title; `footer` = full-width stack on mobile */
  placement?: 'header' | 'footer';
}

export default function StoryActionBar({
  likes,
  userReaction,
  userId,
  isOwnStory,
  busy,
  loading,
  onToggle,
  shareTitle,
  shareText,
  placement = 'header',
}: StoryActionBarProps) {
  return (
    <div className={`story-action-bar story-action-bar--${placement}`}>
      <AppreciateButton
        likes={likes}
        userReaction={userReaction}
        userId={userId}
        isOwnStory={isOwnStory}
        busy={busy}
        loading={loading}
        onToggle={onToggle}
      />
      <ShareButton title={shareTitle} text={shareText} />
    </div>
  );
}
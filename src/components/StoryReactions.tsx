import { useStoryReaction } from '../hooks/useStoryReaction';
import type { StoryReaction } from '../types';
import AppreciateButton from './AppreciateButton';

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
  loading?: boolean;
  onToggle: (reaction: StoryReaction) => Promise<boolean>;
}

/** Presentational appreciate control — use when parent owns `useStoryReaction`. */
export function StoryReactionsBar({
  likes,
  userReaction,
  userId,
  isOwnStory,
  busy,
  loading,
  onToggle,
}: StoryReactionsBarProps) {
  return (
    <AppreciateButton
      likes={likes}
      userReaction={userReaction}
      userId={userId}
      isOwnStory={isOwnStory}
      busy={busy}
      loading={loading}
      onToggle={onToggle}
    />
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
      loading={state.loading}
      onToggle={state.toggle}
    />
  );
}
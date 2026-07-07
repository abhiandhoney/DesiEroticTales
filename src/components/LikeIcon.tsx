interface LikeIconProps {
  filled?: boolean;
  className?: string;
}

/** Heart icon for likes — no emoji. */
export function LikeIcon({ filled = false, className = '' }: LikeIconProps) {
  return (
    <svg
      className={`like-icon ${filled ? 'like-icon--filled' : ''} ${className}`.trim()}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface LikeStatProps {
  count: number;
  title?: string;
  /** Highlight when the viewer has liked (or story has engagement). */
  active?: boolean;
}

/** Read-only like count with icon — cards, meta, author view. */
export function LikeStat({ count, title, active }: LikeStatProps) {
  return (
    <span className="like-stat" title={title}>
      <LikeIcon filled={active ?? count > 0} />
      <span className="like-stat__count">{count.toLocaleString()}</span>
    </span>
  );
}
import { useToast } from '../hooks/useToast';

interface ShareButtonProps {
  title: string;
  text?: string;
  url?: string;
}

function ShareIcon() {
  return (
    <svg className="action-btn__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function ShareButton({ title, text, url }: ShareButtonProps) {
  const { toast } = useToast();

  async function handleShare() {
    const shareUrl = url ?? window.location.href;
    const shareText = text ?? title;

    if (navigator.share) {
      try {
        await navigator.share({ title, text: shareText, url: shareUrl });
        return;
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast('Link copied to clipboard.', 'success');
    } catch {
      toast('Could not copy link.', 'error');
    }
  }

  return (
    <button
      type="button"
      className="action-btn action-btn--share"
      onClick={handleShare}
      aria-label={`Share ${title}`}
    >
      <ShareIcon />
      <span className="action-btn__label">Share</span>
    </button>
  );
}
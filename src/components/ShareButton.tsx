import { useToast } from '../hooks/useToast';

interface ShareButtonProps {
  title: string;
  text?: string;
  url?: string;
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
    <button type="button" className="btn btn-ghost btn-sm share-btn" onClick={handleShare}>
      Share
    </button>
  );
}
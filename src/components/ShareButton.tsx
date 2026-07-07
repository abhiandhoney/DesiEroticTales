import { useState } from 'react';

interface ShareButtonProps {
  title: string;
  text?: string;
  url?: string;
}

export default function ShareButton({ title, text, url }: ShareButtonProps) {
  const [feedback, setFeedback] = useState('');

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
      setFeedback('Link copied!');
      setTimeout(() => setFeedback(''), 2000);
    } catch {
      setFeedback('Could not copy link');
      setTimeout(() => setFeedback(''), 2000);
    }
  }

  return (
    <div className="share-button-wrap">
      <button type="button" className="btn btn-ghost btn-sm share-btn" onClick={handleShare}>
        Share
      </button>
      {feedback && <span className="share-feedback" role="status">{feedback}</span>}
    </div>
  );
}
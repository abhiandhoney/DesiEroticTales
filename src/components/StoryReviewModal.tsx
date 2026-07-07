import { useEffect } from 'react';
import type { Story, StoryStatus } from '../types';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { useFocusTrap } from '../hooks/useFocusTrap';
import StoryMediaGallery from './StoryMediaGallery';

interface StoryReviewModalProps {
  story: Story;
  onClose: () => void;
  onUpdateStatus: (id: string, status: StoryStatus) => void;
  actionLoading: boolean;
}

export default function StoryReviewModal({
  story,
  onClose,
  onUpdateStatus,
  actionLoading,
}: StoryReviewModalProps) {
  const paragraphs = story.content.split(/\n\n+/).filter(Boolean);

  useBodyScrollLock(true);
  const trapRef = useFocusTrap(true);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        ref={trapRef}
        className="modal-panel story-review-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="review-title"
        aria-modal="true"
      >
        <div className="modal-header">
          <div>
            <span className="story-category">{story.category}</span>
            <h2 id="review-title" className="modal-title">{story.title}</h2>
            <p className="modal-meta">
              Submitted {new Date(story.created_at).toLocaleString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        {story.teaser && (
          <div className="review-teaser-block">
            <span className="review-label">Teaser</span>
            <p>{story.teaser}</p>
          </div>
        )}

        <StoryMediaGallery story={story} />

        <div className="review-content">
          <span className="review-label">Full story</span>
          {paragraphs.map((para, i) => (
            <p key={i} className="story-paragraph">{para}</p>
          ))}
        </div>

        <div className="modal-footer">
          <p className="review-hint">Read the full story before approving or rejecting.</p>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Close</button>
            {story.status === 'pending' && (
              <>
                <button
                  type="button"
                  className="btn btn-danger"
                  disabled={actionLoading}
                  onClick={() => onUpdateStatus(story.id, 'rejected')}
                >
                  Reject
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  disabled={actionLoading}
                  onClick={() => onUpdateStatus(story.id, 'approved')}
                >
                  Approve
                </button>
              </>
            )}
            {story.status === 'approved' && (
              <button
                type="button"
                className="btn btn-danger"
                disabled={actionLoading}
                onClick={() => onUpdateStatus(story.id, 'rejected')}
              >
                Unpublish
              </button>
            )}
            {story.status === 'rejected' && (
              <button
                type="button"
                className="btn btn-success"
                disabled={actionLoading}
                onClick={() => onUpdateStatus(story.id, 'approved')}
              >
                Approve
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
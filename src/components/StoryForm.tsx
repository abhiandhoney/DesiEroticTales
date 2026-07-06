import { useState } from 'react';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
import { supabase } from '../lib/supabase';
import { deleteStoryImage, uploadStoryImage } from '../lib/storyImages';
import {
  STORY_CATEGORIES,
  TEASER_MAX_LENGTH,
  type Story,
  type StoryCategory,
  type StoryStatus,
} from '../types';

interface StoryFormProps {
  mode: 'create' | 'edit';
  story?: Story;
  userId: string;
  isAdmin?: boolean;
  onSuccess: () => void;
  onCancel?: () => void;
}

export default function StoryForm({
  mode,
  story,
  userId,
  isAdmin = false,
  onSuccess,
  onCancel,
}: StoryFormProps) {
  const [title, setTitle] = useState(story?.title ?? '');
  const [teaser, setTeaser] = useState(story?.teaser ?? '');
  const [category, setCategory] = useState<StoryCategory>(
    (story?.category as StoryCategory) ?? STORY_CATEGORIES[0],
  );
  const [content, setContent] = useState(story?.content ?? '');
  const [status, setStatus] = useState<StoryStatus>(story?.status ?? 'pending');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(story?.image_url ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim().length < 5) {
      setError('Title must be at least 5 characters.');
      return;
    }
    if (teaser.trim().length > TEASER_MAX_LENGTH) {
      setError(`Teaser must be ${TEASER_MAX_LENGTH} characters or fewer.`);
      return;
    }
    if (content.trim().length < 200) {
      setError('Story must be at least 200 characters.');
      return;
    }

    if (imageFile) {
      if (!ALLOWED_IMAGE_TYPES.includes(imageFile.type)) {
        setError('Cover image must be JPEG, PNG, or WebP.');
        return;
      }
      if (imageFile.size > MAX_IMAGE_BYTES) {
        setError('Cover image must be 5 MB or smaller.');
        return;
      }
    }

    setSubmitting(true);
    setError('');

    const originalImageUrl = story?.image_url ?? null;
    let uploadedUrl: string | null = null;

    try {
      let imageUrl = currentImageUrl;

      if (imageFile) {
        uploadedUrl = await uploadStoryImage(userId, imageFile);
        imageUrl = uploadedUrl;
      } else if (originalImageUrl && !currentImageUrl) {
        imageUrl = null;
      }

      if (mode === 'create') {
        const { error: insertError } = await supabase.from('stories').insert({
          title: title.trim(),
          teaser: teaser.trim() || null,
          content: content.trim(),
          category,
          status: 'pending',
          user_id: userId,
          image_url: imageUrl,
        });
        if (insertError) throw insertError;
      } else if (story) {
        const updates: Record<string, unknown> = {
          title: title.trim(),
          teaser: teaser.trim() || null,
          content: content.trim(),
          category,
          image_url: imageUrl,
        };
        if (isAdmin) updates.status = status;

        const { error: updateError } = await supabase
          .from('stories')
          .update(updates)
          .eq('id', story.id);
        if (updateError) throw updateError;
      }

      if (uploadedUrl && originalImageUrl) {
        try {
          await deleteStoryImage(originalImageUrl);
        } catch {
          // Best-effort cleanup after successful save.
        }
      } else if (!imageFile && originalImageUrl && !currentImageUrl) {
        try {
          await deleteStoryImage(originalImageUrl);
        } catch {
          // Best-effort cleanup after successful save.
        }
      }

      onSuccess();
    } catch (err) {
      if (uploadedUrl) {
        try {
          await deleteStoryImage(uploadedUrl);
        } catch {
          // Orphan upload cleanup.
        }
      }
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : err instanceof Error
            ? err.message
            : mode === 'create'
              ? 'Submission failed.'
              : 'Update failed.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  const submitLabel =
    mode === 'create'
      ? submitting
        ? 'Submitting...'
        : 'Submit for Review'
      : submitting
        ? 'Saving...'
        : 'Save Changes';

  return (
    <form className="submit-form" onSubmit={handleSubmit}>
      {error && <div className="form-error">{error}</div>}

      <div className="form-group">
        <label htmlFor="title">Title</label>
        <input
          id="title"
          type="text"
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="A title that teases..."
          required
          maxLength={200}
        />
      </div>

      <div className="form-group">
        <label htmlFor="teaser">
          Teaser <span className="label-optional">(recommended)</span>
        </label>
        <textarea
          id="teaser"
          className="textarea textarea-compact"
          value={teaser}
          onChange={(e) => setTeaser(e.target.value)}
          placeholder="A short hook that draws readers in... (150-200 chars ideal)"
          rows={3}
          maxLength={TEASER_MAX_LENGTH}
        />
        <span className="char-count">
          {teaser.length}/{TEASER_MAX_LENGTH} characters
        </span>
      </div>

      <div className="form-group">
        <label htmlFor="category">Category</label>
        <select
          id="category"
          className="select"
          value={category}
          onChange={(e) => setCategory(e.target.value as StoryCategory)}
        >
          {STORY_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {isAdmin && mode === 'edit' && (
        <div className="form-group">
          <label htmlFor="status">Status</label>
          <select
            id="status"
            className="select"
            value={status}
            onChange={(e) => setStatus(e.target.value as StoryStatus)}
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      )}

      <div className="form-group">
        <label htmlFor="content">Story</label>
        <textarea
          id="content"
          className="textarea"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Let the tension build slowly..."
          rows={20}
          required
        />
        <span className="char-count">{content.length} characters (min 200)</span>
      </div>

      <div className="form-group">
        <label htmlFor="image">Cover image (optional)</label>
        {currentImageUrl && !imageFile && (
          <div className="current-image-preview">
            <img src={currentImageUrl} alt="Current cover" />
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setCurrentImageUrl(null)}
            >
              Remove image
            </button>
          </div>
        )}
        <input
          id="image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
          className="file-input"
        />
        <p className="form-hint">
          {mode === 'edit' && currentImageUrl
            ? 'Upload a new image to replace the current cover.'
            : 'Upload a tasteful cover, or leave blank for AI-generated art (coming soon).'}
        </p>
      </div>

      <div className="form-actions">
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
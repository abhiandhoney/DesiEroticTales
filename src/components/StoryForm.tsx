import { useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { convertFileToWebP } from '../lib/imageProcessing';
import { deleteStoryImages, uploadStoryImageBlob, uploadStoryImageBlobs } from '../lib/storyImages';
import StoryMediaUploader, { type MediaUploadState } from './StoryMediaUploader';
import {
  STORY_CATEGORIES,
  TEASER_MAX_LENGTH,
  type Story,
  type StoryCategory,
  type StoryStatus,
} from '../types';

const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

interface StoryFormProps {
  mode: 'create' | 'edit';
  story?: Story;
  userId: string;
  isAdmin?: boolean;
  onSuccess: () => void;
  onCancel?: () => void;
}

const emptyMediaState = (): MediaUploadState => ({
  coverBlob: null,
  coverDisplayUrl: null,
  persistedCoverUrl: null,
  persistedGalleryUrls: [],
  pendingGalleryFiles: [],
  removedUrls: [],
});

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
  const [mediaState, setMediaState] = useState<MediaUploadState>(emptyMediaState());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const initialGallery = useMemo(
    () => (story?.gallery_urls ?? []).filter((u) => u && u !== story?.image_url),
    [story],
  );

  async function uploadAllMedia(): Promise<{ coverUrl: string | null; galleryUrls: string[] }> {
    let coverUrl = mediaState.persistedCoverUrl;

    if (mediaState.coverBlob) {
      coverUrl = await uploadStoryImageBlob(userId, mediaState.coverBlob, 'cover');
    }

    const keptGallery = mediaState.persistedGalleryUrls.filter(
      (u) => !mediaState.removedUrls.includes(u) && u !== coverUrl,
    );

    for (const file of mediaState.pendingGalleryFiles) {
      if (file.size > MAX_IMAGE_BYTES) {
        throw new Error(`"${file.name}" exceeds 12 MB.`);
      }
    }

    const galleryBlobs = await Promise.all(
      mediaState.pendingGalleryFiles.map((file) => convertFileToWebP(file)),
    );
    const uploaded = galleryBlobs.length
      ? await uploadStoryImageBlobs(userId, galleryBlobs, 'gallery')
      : [];

    return {
      coverUrl,
      galleryUrls: [...keptGallery, ...uploaded],
    };
  }

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

    setSubmitting(true);
    setError('');

    const originalCover = story?.image_url ?? null;
    const originalGallery = [
      ...(story?.gallery_urls ?? []),
      ...(originalCover ? [originalCover] : []),
    ].filter((u, i, arr) => u && arr.indexOf(u) === i);

    let uploadedCover: string | null = null;
    let uploadedGallery: string[] = [];

    try {
      const { coverUrl, galleryUrls } = await uploadAllMedia();
      uploadedCover = coverUrl;
      uploadedGallery = galleryUrls;

      if (mode === 'create') {
        const { error: insertError } = await supabase.from('stories').insert({
          title: title.trim(),
          teaser: teaser.trim() || null,
          content: content.trim(),
          category,
          status: 'pending',
          user_id: userId,
          image_url: coverUrl,
          gallery_urls: galleryUrls,
        });
        if (insertError) throw insertError;
      } else if (story) {
        const updates: Record<string, unknown> = {
          title: title.trim(),
          teaser: teaser.trim() || null,
          content: content.trim(),
          category,
          image_url: coverUrl,
          gallery_urls: galleryUrls,
        };
        if (isAdmin) updates.status = status;

        const { error: updateError } = await supabase
          .from('stories')
          .update(updates)
          .eq('id', story.id);
        if (updateError) throw updateError;
      }

      const toDelete = [
        ...mediaState.removedUrls,
        ...(uploadedCover && originalCover && uploadedCover !== originalCover ? [originalCover] : []),
      ].filter((u, i, arr) => u && arr.indexOf(u) === i);

      const replacedGallery = originalGallery.filter(
        (u) => !galleryUrls.includes(u) && !toDelete.includes(u),
      );
      toDelete.push(...replacedGallery);

      if (toDelete.length) {
        try {
          await deleteStoryImages(toDelete);
        } catch {
          // Best-effort storage cleanup.
        }
      }

      onSuccess();
    } catch (err) {
      const orphans = [uploadedCover, ...uploadedGallery].filter(Boolean) as string[];
      if (orphans.length) {
        try {
          await deleteStoryImages(orphans);
        } catch {
          // Orphan cleanup.
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
          placeholder="A short hook that draws readers in..."
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
        <label>Photos</label>
        <StoryMediaUploader
          key={story?.id ?? 'new'}
          initialCoverUrl={story?.image_url ?? null}
          initialGalleryUrls={initialGallery}
          onChange={setMediaState}
          disabled={submitting}
        />
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
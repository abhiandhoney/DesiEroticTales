import { useEffect, useMemo, useState } from 'react';
import { useConfirm } from '../hooks/useConfirm';
import { useToast } from '../hooks/useToast';
import { supabase } from '../lib/supabase';
import { convertFileToWebP } from '../lib/imageProcessing';
import { deleteStoryImages, uploadStoryImageBlob, uploadStoryImageBlobs } from '../lib/storyImages';
import StoryMediaUploader, { type MediaUploadState } from './StoryMediaUploader';
import { formatTags, parseTagsInput } from '../lib/slug';
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
  coverFullBlob: null,
  coverCardBlob: null,
  coverCardDisplayUrl: null,
  persistedFullCoverUrl: null,
  persistedCardCoverUrl: null,
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
  const [tagsInput, setTagsInput] = useState(formatTags(story?.tags));
  const [status, setStatus] = useState<StoryStatus>(story?.status ?? 'pending');
  const [mediaState, setMediaState] = useState<MediaUploadState>(emptyMediaState());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { confirm } = useConfirm();
  const { toast } = useToast();

  const initialGallery = useMemo(
    () => (story?.gallery_urls ?? []).filter((u) => u && u !== story?.image_url),
    [story],
  );

  const draftKey = mode === 'create' ? 'story-draft-new' : `story-draft-${story?.id}`;

  useEffect(() => {
    const saved = sessionStorage.getItem(draftKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!title && parsed.title) setTitle(parsed.title);
        if (!teaser && parsed.teaser) setTeaser(parsed.teaser);
        if (!content && parsed.content) setContent(parsed.content);
        if (parsed.category) setCategory(parsed.category);
      } catch {
        // Ignore parsing errors
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (title || teaser || content) {
      sessionStorage.setItem(draftKey, JSON.stringify({ title, teaser, content, category }));
    }
  }, [title, teaser, content, category, draftKey]);

  async function uploadAllMedia(): Promise<{
    fullCoverUrl: string | null;
    cardCoverUrl: string | null;
    galleryUrls: string[];
  }> {
    let fullCoverUrl = mediaState.persistedFullCoverUrl;
    let cardCoverUrl = mediaState.persistedCardCoverUrl;

    if (mediaState.coverFullBlob) {
      fullCoverUrl = await uploadStoryImageBlob(userId, mediaState.coverFullBlob, 'cover-full');
    }
    if (mediaState.coverCardBlob) {
      cardCoverUrl = await uploadStoryImageBlob(userId, mediaState.coverCardBlob, 'cover-card');
    } else if (fullCoverUrl && !cardCoverUrl) {
      cardCoverUrl = fullCoverUrl;
    }

    const keptGallery = mediaState.persistedGalleryUrls.filter(
      (u) => !mediaState.removedUrls.includes(u) && u !== fullCoverUrl && u !== cardCoverUrl,
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
      fullCoverUrl,
      cardCoverUrl: cardCoverUrl ?? fullCoverUrl,
      galleryUrls: [...keptGallery, ...uploaded],
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (mode === 'edit') {
      const ok = await confirm({
        title: 'Save changes?',
        message: 'Your edits will be saved to this story.',
        confirmLabel: 'Save changes',
        cancelLabel: 'Keep editing',
      });
      if (!ok) return;
    }

    if (title.trim().length < 5) {
      setError('Title must be at least 5 characters.');
      return;
    }
    if (teaser.trim().length < 40) {
      setError('Teaser (quick summary) must be at least 40 characters — helps readers and AI discover your story.');
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

    const originalFull = story?.image_url ?? null;
    const originalCard = story?.card_image_url ?? null;
    const originalGallery = [
      ...(story?.gallery_urls ?? []),
      ...(originalFull ? [originalFull] : []),
      ...(originalCard ? [originalCard] : []),
    ].filter((u, i, arr) => u && arr.indexOf(u) === i);

    let uploadedFull: string | null = null;
    let uploadedCard: string | null = null;
    let uploadedGallery: string[] = [];

    try {
      const { fullCoverUrl, cardCoverUrl, galleryUrls } = await uploadAllMedia();
      uploadedFull = fullCoverUrl;
      uploadedCard = cardCoverUrl;
      uploadedGallery = galleryUrls;

      if (mode === 'create') {
        const { error: insertError } = await supabase.from('stories').insert({
          title: title.trim(),
          teaser: teaser.trim() || null,
          content: content.trim(),
          category,
          tags: parseTagsInput(tagsInput),
          status: 'pending',
          user_id: userId,
          image_url: fullCoverUrl,
          card_image_url: cardCoverUrl,
          gallery_urls: galleryUrls,
        });
        if (insertError) throw insertError;
      } else if (story) {
        const updates: Record<string, unknown> = {
          title: title.trim(),
          teaser: teaser.trim() || null,
          content: content.trim(),
          category,
          tags: parseTagsInput(tagsInput),
          image_url: fullCoverUrl,
          card_image_url: cardCoverUrl,
          gallery_urls: galleryUrls,
        };
        if (isAdmin) {
          updates.status = status;
        } else if (story.status === 'rejected') {
          updates.status = 'pending';
        }

        const { error: updateError } = await supabase
          .from('stories')
          .update(updates)
          .eq('id', story.id);
        if (updateError) throw updateError;
      }

      const toDelete = [
        ...mediaState.removedUrls,
        ...(uploadedFull && originalFull && uploadedFull !== originalFull ? [originalFull] : []),
        ...(uploadedCard && originalCard && uploadedCard !== originalCard ? [originalCard] : []),
      ].filter((u, i, arr) => u && arr.indexOf(u) === i);

      const replacedGallery = originalGallery.filter(
        (u) => !galleryUrls.includes(u) && !toDelete.includes(u)
          && u !== fullCoverUrl && u !== cardCoverUrl,
      );
      toDelete.push(...replacedGallery);

      if (toDelete.length) {
        try {
          await deleteStoryImages(toDelete);
        } catch {
          // Best-effort storage cleanup.
        }
      }

      sessionStorage.removeItem(draftKey);
      toast(mode === 'create' ? 'Story submitted for review.' : 'Story updated.', 'success');
      onSuccess();
    } catch (err) {
      const orphans = [uploadedFull, uploadedCard, ...uploadedGallery].filter(Boolean) as string[];
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

  const isResubmit = mode === 'edit' && story?.status === 'rejected' && !isAdmin;
  const submitLabel =
    mode === 'create'
      ? submitting
        ? 'Submitting...'
        : 'Submit for Review'
      : submitting
        ? 'Saving...'
        : isResubmit
          ? 'Resubmit for Review'
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
          Quick summary (teaser) <span className="label-required">*</span>
        </label>
        <textarea
          id="teaser"
          className="textarea textarea-compact"
          value={teaser}
          onChange={(e) => setTeaser(e.target.value)}
          placeholder="2–3 sentences: what is this story about? (Shown at the top for readers and search/AI tools)"
          rows={3}
          required
          minLength={40}
          maxLength={TEASER_MAX_LENGTH}
        />
        <span className="char-count">
          {teaser.length}/{TEASER_MAX_LENGTH} characters
        </span>
      </div>

      <div className="form-group">
        <label htmlFor="tags">
          Tags <span className="label-optional">(comma-separated, max 8)</span>
        </label>
        <input
          id="tags"
          type="text"
          className="input"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="telugu-sex-stories, aunty, ranku-kathalu"
        />
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
          placeholder="Let the tension build slowly... Use ## Scene name on its own line for section breaks (optional)."
          rows={20}
          required
        />
        <span className="form-hint">Tip: start a paragraph with ## to add a section heading (e.g. ## The first touch).</span>
        <span className="char-count">{content.length} characters (min 200)</span>
      </div>

      <div className="form-group">
        <label>Photos</label>
        <StoryMediaUploader
          key={story?.id ?? 'new'}
          initialCoverUrl={story?.image_url ?? null}
          initialCardUrl={story?.card_image_url ?? story?.image_url ?? null}
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
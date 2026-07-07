import { useEffect, useState } from 'react';
import type { JSONContent } from '@tiptap/core';
import { useConfirm } from '../hooks/useConfirm';
import { useToast } from '../hooks/useToast';
import { supabase } from '../lib/supabase';
import { deleteStoryImages, uploadStoryImageBlob } from '../lib/storyImages';
import StoryCoverUploader, { type CoverUploadState } from './StoryCoverUploader';
import RichTextEditor from './RichTextEditor';
import CollectionSelector from './CollectionSelector';
import { formatTags, parseTagsInput } from '../lib/slug';
import {
  applyCollectionLink,
  loadCollectionFormValue,
  type CollectionFormValue,
} from '../lib/collections';
import {
  emptyRichDoc,
  jsonToHtml,
  jsonToPlainText,
  minPlainLength,
  parseStoryDoc,
} from '../lib/richText';
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

const emptyCoverState = (): CoverUploadState => ({
  coverFullBlob: null,
  coverCardBlob: null,
  coverCardDisplayUrl: null,
  persistedFullCoverUrl: null,
  persistedCardCoverUrl: null,
  removedCoverUrls: [],
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
  const [contentDoc, setContentDoc] = useState<JSONContent>(
    story ? parseStoryDoc(story) : emptyRichDoc(),
  );
  const [contentHtml, setContentHtml] = useState(story?.content_html ?? '');
  const [tagsInput, setTagsInput] = useState(formatTags(story?.tags));
  const [status, setStatus] = useState<StoryStatus>(story?.status ?? 'pending');
  const [coverState, setCoverState] = useState<CoverUploadState>(emptyCoverState());
  const [collectionValue, setCollectionValue] = useState<CollectionFormValue>({ mode: 'none' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { confirm } = useConfirm();
  const { toast } = useToast();

  useEffect(() => {
    if (story?.id) {
      loadCollectionFormValue(story.id).then(setCollectionValue).catch(() => {});
    }
  }, [story?.id]);

  async function uploadCover(): Promise<{ full: string | null; card: string | null }> {
    let full = coverState.persistedFullCoverUrl;
    let card = coverState.persistedCardCoverUrl;

    if (coverState.coverFullBlob) {
      full = await uploadStoryImageBlob(userId, coverState.coverFullBlob, 'cover-full');
    }
    if (coverState.coverCardBlob) {
      card = await uploadStoryImageBlob(userId, coverState.coverCardBlob, 'cover-card');
    } else if (full) {
      card = full;
    }
    return { full, card: card ?? full };
  }

  function buildPayload(
    targetStatus: StoryStatus,
    cover: { full: string | null; card: string | null },
  ) {
    const plain = jsonToPlainText(contentDoc).trim();
    const html = contentHtml || jsonToHtml(contentDoc);
    return {
      title: title.trim(),
      teaser: teaser.trim() || null,
      content: plain,
      content_json: contentDoc,
      content_html: html,
      category,
      tags: parseTagsInput(tagsInput),
      status: targetStatus,
      image_url: cover.full,
      card_image_url: cover.card,
      gallery_urls: [] as string[],
    };
  }

  function validateDraft(): string | null {
    if (title.trim().length < 3) return 'Title must be at least 3 characters to save a draft.';
    if (teaser.trim().length > TEASER_MAX_LENGTH) {
      return `Teaser must be ${TEASER_MAX_LENGTH} characters or fewer.`;
    }
    return null;
  }

  function validateSubmit(): string | null {
    if (title.trim().length < 5) return 'Title must be at least 5 characters.';
    if (teaser.trim().length < 40) {
      return 'Teaser (quick summary) must be at least 40 characters before submitting for review.';
    }
    if (teaser.trim().length > TEASER_MAX_LENGTH) {
      return `Teaser must be ${TEASER_MAX_LENGTH} characters or fewer.`;
    }
    if (minPlainLength(contentDoc) < 200) {
      return 'Story must be at least 200 characters.';
    }
    if (collectionValue.mode === 'new' && !collectionValue.title.trim()) {
      return 'Enter a title for the new collection.';
    }
    return null;
  }

  async function persist(targetStatus: StoryStatus) {
    const originalFull = story?.image_url ?? null;
    const originalCard = story?.card_image_url ?? null;
    let uploadedFull: string | null = null;
    let uploadedCard: string | null = null;

    try {
      const cover = await uploadCover();
      uploadedFull = cover.full;
      uploadedCard = cover.card;
      const payload = buildPayload(targetStatus, cover);

      let storyId = story?.id;

      if (mode === 'create') {
        const { data, error: insertError } = await supabase
          .from('stories')
          .insert({ ...payload, user_id: userId })
          .select('id')
          .single();
        if (insertError) throw insertError;
        storyId = data.id;
      } else if (story) {
        const updates: Record<string, unknown> = { ...payload };
        if (isAdmin) updates.status = targetStatus;
        else if (story.status === 'rejected' && targetStatus === 'pending') {
          updates.status = 'pending';
        } else if (story.status === 'draft' && targetStatus === 'pending') {
          updates.status = 'pending';
        } else if (story.status === 'draft' && targetStatus === 'draft') {
          updates.status = 'draft';
        }

        const { error: updateError } = await supabase
          .from('stories')
          .update(updates)
          .eq('id', story.id);
        if (updateError) throw updateError;
        storyId = story.id;
      }

      if (storyId) {
        await applyCollectionLink(storyId, userId, collectionValue);
      }

      const toDelete = [
        ...coverState.removedCoverUrls,
        ...(uploadedFull && originalFull && uploadedFull !== originalFull ? [originalFull] : []),
        ...(uploadedCard && originalCard && uploadedCard !== originalCard ? [originalCard] : []),
      ].filter((u, i, arr) => u && arr.indexOf(u) === i);

      if (toDelete.length) {
        try {
          await deleteStoryImages(toDelete);
        } catch {
          // Best-effort cleanup.
        }
      }

      const msg =
        targetStatus === 'draft'
          ? 'Draft saved.'
          : mode === 'create'
            ? 'Story submitted for review.'
            : 'Story updated.';
      toast(msg, 'success');
      onSuccess();
    } catch (err) {
      const orphans = [uploadedFull, uploadedCard].filter(Boolean) as string[];
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
            : 'Save failed.';
      setError(message);
    }
  }

  async function handleSaveDraft() {
    const v = validateDraft();
    if (v) {
      setError(v);
      return;
    }
    setSubmitting(true);
    setError('');
    await persist('draft');
    setSubmitting(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const v = validateSubmit();
    if (v) {
      setError(v);
      return;
    }

    if (mode === 'edit') {
      const ok = await confirm({
        title: story?.status === 'draft' ? 'Submit for review?' : 'Save changes?',
        message:
          story?.status === 'draft'
            ? 'Your story will be sent for admin review.'
            : 'Your edits will be saved to this story.',
        confirmLabel: story?.status === 'draft' ? 'Submit for review' : 'Save changes',
        cancelLabel: 'Keep editing',
      });
      if (!ok) return;
    }

    setSubmitting(true);
    setError('');
    const targetStatus: StoryStatus =
      story?.status === 'draft' || mode === 'create' ? 'pending' : status;
    await persist(isAdmin && mode === 'edit' ? status : targetStatus);
    setSubmitting(false);
  }

  const isDraft = story?.status === 'draft' || (!story && mode === 'create');
  const submitLabel =
    submitting
      ? 'Saving...'
      : story?.status === 'draft'
        ? 'Submit for Review'
        : mode === 'create'
          ? 'Submit for Review'
          : isAdmin && mode === 'edit'
            ? 'Save Changes'
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
          maxLength={200}
        />
      </div>

      <div className="form-group">
        <label htmlFor="teaser">
          Quick summary (teaser)
          {isDraft ? (
            <span className="label-optional"> (optional for drafts)</span>
          ) : (
            <span className="label-required"> *</span>
          )}
        </label>
        <textarea
          id="teaser"
          className="textarea textarea-compact"
          value={teaser}
          onChange={(e) => setTeaser(e.target.value)}
          placeholder="2–3 sentences summarising what this story is about"
          rows={3}
          maxLength={TEASER_MAX_LENGTH}
        />
        <span className="char-count">{teaser.length}/{TEASER_MAX_LENGTH} characters</span>
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
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <CollectionSelector
        userId={userId}
        value={collectionValue}
        onChange={setCollectionValue}
        disabled={submitting}
      />

      {isAdmin && mode === 'edit' && story?.status !== 'draft' && (
        <div className="form-group">
          <label htmlFor="status">Status</label>
          <select
            id="status"
            className="select"
            value={status}
            onChange={(e) => setStatus(e.target.value as StoryStatus)}
          >
            <option value="draft">Draft</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      )}

      <div className="form-group">
        <label>Story cover photo <span className="label-optional">(optional)</span></label>
        <StoryCoverUploader
          key={story?.id ?? 'new'}
          initialCoverUrl={story?.image_url ?? null}
          initialCardUrl={story?.card_image_url ?? story?.image_url ?? null}
          onChange={setCoverState}
          disabled={submitting}
        />
      </div>

      <div className="form-group">
        <label>Story body</label>
        <RichTextEditor
          value={contentDoc}
          onChange={(json, html) => {
            setContentDoc(json);
            setContentHtml(html);
          }}
          userId={userId}
          disabled={submitting}
          placeholder="Write your story. Use H2 for scene breaks. Insert images inline where they belong."
        />
        <span className="char-count">{minPlainLength(contentDoc)} characters (min 200 to submit)</span>
      </div>

      <div className="form-actions form-actions--split">
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
        )}
        <div className="form-actions-primary">
          <button
            type="button"
            className="btn btn-ghost btn-lg"
            disabled={submitting}
            onClick={handleSaveDraft}
          >
            {submitting ? 'Saving...' : 'Save as Draft'}
          </button>
          <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
            {submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}
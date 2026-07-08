import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { JSONContent } from '@tiptap/core';
import { useConfirm } from '../hooks/useConfirm';
import { useStoryAutosave } from '../hooks/useStoryAutosave';
import { useToast } from '../hooks/useToast';
import { clearStoryDraftCache } from '../lib/storyDraftCache';
import { supabase } from '../lib/supabase';
import { deleteStoryImages, uploadStoryImageBlob, type ImageVisibility } from '../lib/storyImages';
import { promoteStoryMediaForPublish } from '../lib/promoteStoryImages';
import StoryCoverUploader, { type CoverUploadState } from './StoryCoverUploader';
import RichTextEditor from './RichTextEditor';
import CollectionSelector from './CollectionSelector';
import AuthorProfileSelector from './AuthorProfileSelector';
import { formatTags, parseTagsInput } from '../lib/slug';
import {
  applyCollectionLink,
  loadCollectionFormValue,
  type CollectionFormValue,
} from '../lib/collections';
import { emptyRichDoc, jsonToPlainText, minPlainLength } from '../lib/richTextPlain';
import { jsonToHtml, parseStoryDoc } from '../lib/richTextEditor';
import { sanitizeStoryHtml } from '../lib/sanitizeHtml';
import {
  STORY_CATEGORIES,
  TEASER_MAX_LENGTH,
  type Story,
  type StoryCategory,
  type StoryStatus,
} from '../types';

export interface StoryFormSuccess {
  status: StoryStatus;
  storyId: string;
}

interface StoryFormProps {
  mode: 'create' | 'edit';
  story?: Story;
  userId: string;
  isAdmin?: boolean;
  onSuccess?: (result: StoryFormSuccess) => void;
  onCancel?: () => void;
}

const emptyCoverState = (): CoverUploadState => ({
  coverFullBlob: null,
  coverCardBlob: null,
  coverCardDisplayUrl: null,
  coverFullDisplayUrl: null,
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
  const [authorProfileId, setAuthorProfileId] = useState<string | null>(
    story?.author_profile_id ?? null,
  );
  const [savedStoryId, setSavedStoryId] = useState<string | undefined>(story?.id);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const persistLock = useRef(false);

  function resolveAutosaveStatus(): StoryStatus {
    if (mode === 'create' || !story) return 'draft';
    if (story.status === 'pending' || story.status === 'rejected') return story.status;
    return 'draft';
  }

  function resolveSubmitStatus(): StoryStatus {
    if (story?.status === 'draft' || (mode === 'create' && !story)) return 'pending';
    if (!isAdmin && story?.status === 'rejected') return 'pending';
    if (isAdmin && mode === 'edit') return status;
    return status;
  }
  const { confirm } = useConfirm();
  const { toast } = useToast();

  const autosaveSnapshot = useMemo(
    () => ({
      title,
      teaser,
      category,
      tagsInput,
      contentDoc,
      contentHtml,
      authorProfileId,
      coverPersistedFullUrl: coverState.persistedFullCoverUrl,
      coverPersistedCardUrl: coverState.persistedCardCoverUrl,
      collectionValue,
    }),
    [
      title,
      teaser,
      category,
      tagsInput,
      contentDoc,
      contentHtml,
      authorProfileId,
      coverState.persistedFullCoverUrl,
      coverState.persistedCardCoverUrl,
      collectionValue,
    ],
  );

  const restoreFromCache = useCallback((snapshot: typeof autosaveSnapshot) => {
    setTitle(snapshot.title);
    setTeaser(snapshot.teaser);
    setCategory(snapshot.category);
    setTagsInput(snapshot.tagsInput);
    setContentDoc(snapshot.contentDoc);
    setContentHtml(snapshot.contentHtml);
    setAuthorProfileId(snapshot.authorProfileId);
    setCollectionValue(snapshot.collectionValue ?? { mode: 'none' });
    setCoverState((prev) => ({
      ...prev,
      coverFullBlob: null,
      coverCardBlob: null,
      coverCardDisplayUrl: snapshot.coverPersistedCardUrl,
      coverFullDisplayUrl: snapshot.coverPersistedFullUrl,
      persistedFullCoverUrl: snapshot.coverPersistedFullUrl,
      persistedCardCoverUrl: snapshot.coverPersistedCardUrl,
    }));
  }, []);

  function buildSanitizedHtml(): string {
    const raw = contentHtml || jsonToHtml(contentDoc);
    return sanitizeStoryHtml(raw);
  }

  const syncDraftToSupabase = useCallback(async (existingId?: string) => {
    const plain = jsonToPlainText(contentDoc).trim();
    const html = buildSanitizedHtml();
    const cover = await uploadCover('draft');

    const payload = {
      title: title.trim(),
      teaser: teaser.trim() || null,
      content: plain,
      content_json: contentDoc,
      content_html: html,
      category,
      tags: parseTagsInput(tagsInput),
      status: resolveAutosaveStatus(),
      image_url: cover.full,
      card_image_url: cover.card,
      ...(isAdmin ? { author_profile_id: authorProfileId } : {}),
    };

    let storyId = existingId ?? savedStoryId ?? story?.id;

    if (!storyId) {
      const { data, error: insertError } = await supabase
        .from('stories')
        .insert({ ...payload, user_id: userId, status: 'draft' })
        .select('id')
        .single();
      if (insertError) throw insertError;
      storyId = data.id;
      setSavedStoryId(data.id);
    } else {
      const { error: updateError } = await supabase
        .from('stories')
        .update(payload)
        .eq('id', storyId);
      if (updateError) throw updateError;
    }

    if (storyId) {
      await applyCollectionLink(storyId, userId, collectionValue);
    }

    if (cover.full || cover.card) {
      setCoverState((prev) => ({
        ...prev,
        coverFullBlob: null,
        coverCardBlob: null,
        persistedFullCoverUrl: cover.full,
        persistedCardCoverUrl: cover.card,
        coverFullDisplayUrl: cover.full,
        coverCardDisplayUrl: cover.card ?? cover.full,
      }));
    }

    if (!storyId) throw new Error('Draft sync failed.');
    return storyId;
  }, [
    contentDoc,
    contentHtml,
    title,
    teaser,
    category,
    tagsInput,
    isAdmin,
    authorProfileId,
    savedStoryId,
    story?.id,
    userId,
    collectionValue,
    coverState,
  ]);

  const autosaveEnabled = story?.status !== 'approved';

  const {
    status: autosaveStatus,
    statusMessage: autosaveMessage,
    cancelPendingSync,
    markRemoteSaved,
    isAutosaveEligible,
  } = useStoryAutosave({
    userId,
    storyId: savedStoryId ?? story?.id,
    storyUpdatedAt: story?.updated_at,
    storyStatus: story?.status,
    mode,
    snapshot: autosaveSnapshot,
    enabled: autosaveEnabled,
    canSyncRemote: validateDraft,
    onRestore: restoreFromCache,
    onStoryId: setSavedStoryId,
    syncToSupabase: syncDraftToSupabase,
  });

  useEffect(() => {
    setSavedStoryId(story?.id);
    setAuthorProfileId(story?.author_profile_id ?? null);
  }, [story?.id, story?.author_profile_id]);

  useEffect(() => {
    if (story?.id) {
      loadCollectionFormValue(story.id).then(setCollectionValue).catch(() => {});
    }
  }, [story?.id]);

  async function uploadCover(
    visibility: ImageVisibility = story?.status === 'approved' ? 'published' : 'draft',
  ): Promise<{ full: string | null; card: string | null }> {
    let full = coverState.persistedFullCoverUrl;
    let card = coverState.persistedCardCoverUrl;

    if (coverState.coverFullBlob) {
      full = await uploadStoryImageBlob(userId, coverState.coverFullBlob, 'cover-full', visibility);
    }
    if (coverState.coverCardBlob) {
      card = await uploadStoryImageBlob(userId, coverState.coverCardBlob, 'cover-card', visibility);
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
    const html = buildSanitizedHtml();
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
      gallery_urls: story?.gallery_urls ?? [],
      ...(isAdmin ? { author_profile_id: authorProfileId } : {}),
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

  const persist = useCallback(async (targetStatus: StoryStatus) => {
    if (persistLock.current) {
      if (targetStatus !== 'draft') {
        setError('A save is already in progress. Please wait a moment and try again.');
      }
      return;
    }
    persistLock.current = true;
    setSubmitting(true);
    setError('');

    const originalFull = story?.image_url ?? null;
    const originalCard = story?.card_image_url ?? null;
    let uploadedFull: string | null = null;
    let uploadedCard: string | null = null;

    try {
      const publishMedia = targetStatus === 'pending' || targetStatus === 'approved';
      const cover = await uploadCover(publishMedia ? 'published' : 'draft');
      uploadedFull = cover.full;
      uploadedCard = cover.card;
      let payload = buildPayload(targetStatus, cover);

      if (publishMedia) {
        const promoted = await promoteStoryMediaForPublish(userId, {
          image_url: payload.image_url,
          card_image_url: payload.card_image_url,
          content_html: payload.content_html,
          content_json: payload.content_json as JSONContent,
        });
        payload = {
          ...payload,
          image_url: promoted.image_url,
          card_image_url: promoted.card_image_url,
          content_html: promoted.content_html ?? payload.content_html,
          content_json: promoted.content_json ?? payload.content_json,
        };
        uploadedFull = promoted.image_url;
        uploadedCard = promoted.card_image_url;
      }

      let storyId = savedStoryId ?? story?.id;

      if (!storyId) {
        const { data, error: insertError } = await supabase
          .from('stories')
          .insert({ ...payload, user_id: userId })
          .select('id')
          .single();
        if (insertError) throw insertError;
        storyId = data.id;
        setSavedStoryId(data.id);
      } else {
        const { error: updateError } = await supabase
          .from('stories')
          .update(payload)
          .eq('id', storyId);
        if (updateError) throw updateError;
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

      if (targetStatus === 'draft') {
        markRemoteSaved();
        toast('Draft saved.', 'success');
      } else {
        if (storyId) {
          clearStoryDraftCache(userId, storyId);
          markRemoteSaved();
        }
        const msg =
          targetStatus === 'pending'
            ? 'Story submitted for review.'
            : 'Story updated.';
        toast(msg, 'success');
        if (storyId) onSuccess?.({ status: targetStatus, storyId });
      }
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
    } finally {
      persistLock.current = false;
      setSubmitting(false);
    }
  }, [
    savedStoryId,
    story,
    userId,
    mode,
    isAdmin,
    status,
    title,
    teaser,
    category,
    contentDoc,
    contentHtml,
    tagsInput,
    coverState,
    collectionValue,
    authorProfileId,
    onSuccess,
    toast,
    markRemoteSaved,
  ]);

  function handleSaveDraft() {
    const v = validateDraft();
    if (v) {
      setError(v);
      return;
    }
    if (persistLock.current || submitting) return;
    cancelPendingSync();
    void persist('draft');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const v = validateSubmit();
    if (v) {
      setError(v);
      return;
    }

    const submittingDraft =
      story?.status === 'draft' || (mode === 'create' && !story);

    if (mode === 'edit') {
      const ok = await confirm({
        title: submittingDraft ? 'Submit for review?' : 'Save changes?',
        message:
          submittingDraft
            ? 'Your story will be sent for admin review.'
            : 'Your edits will be saved to this story.',
        confirmLabel: submittingDraft ? 'Submit for review' : 'Save changes',
        cancelLabel: 'Keep editing',
      });
      if (!ok) return;
    }

    cancelPendingSync();
    setError('');
    await persist(resolveSubmitStatus());
  }

  const isDraft = story?.status === 'draft' || (mode === 'create' && !story);
  const isDraftSubmit = story?.status === 'draft' || (mode === 'create' && !story);
  const submitLabel =
    submitting
      ? 'Saving...'
      : isDraftSubmit
        ? 'Submit for Review'
        : isAdmin && mode === 'edit'
          ? 'Save Changes'
          : 'Save Changes';

  return (
    <form className="submit-form" onSubmit={handleSubmit}>
      {isAutosaveEligible && autosaveMessage && (
        <p
          className={`autosave-status autosave-status--${autosaveStatus}`}
          role="status"
          aria-live="polite"
        >
          {autosaveMessage}
        </p>
      )}
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

      {isAdmin && (
        <AuthorProfileSelector
          value={authorProfileId}
          onChange={setAuthorProfileId}
          disabled={submitting}
        />
      )}

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
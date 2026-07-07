import { useEffect, useRef, useState } from 'react';
import { convertFileToWebP } from '../lib/imageProcessing';
import ImageCropModal from './ImageCropModal';

export const MAX_STORY_IMAGES = 8;

export interface MediaUploadState {
  coverFullBlob: Blob | null;
  coverCardBlob: Blob | null;
  coverCardDisplayUrl: string | null;
  persistedFullCoverUrl: string | null;
  persistedCardCoverUrl: string | null;
  persistedGalleryUrls: string[];
  pendingGalleryFiles: File[];
  removedUrls: string[];
}

interface StoryMediaUploaderProps {
  initialCoverUrl: string | null;
  initialCardUrl?: string | null;
  initialGalleryUrls: string[];
  onChange: (state: MediaUploadState) => void;
  disabled?: boolean;
}

function makeId() {
  return `media-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

interface LocalDraft {
  id: string;
  file: File;
  previewUrl: string;
  isCover: boolean;
  fullBlob: Blob | null;
  cardBlob: Blob | null;
  cardPreviewUrl: string | null;
}

type CropTarget =
  | { kind: 'draft'; draft: LocalDraft }
  | { kind: 'persisted-full'; url: string };

export default function StoryMediaUploader({
  initialCoverUrl,
  initialCardUrl = null,
  initialGalleryUrls,
  onChange,
  disabled = false,
}: StoryMediaUploaderProps) {
  const [persistedFull, setPersistedFull] = useState<string | null>(initialCoverUrl);
  const [persistedCard, setPersistedCard] = useState<string | null>(initialCardUrl ?? initialCoverUrl);
  const [persistedGallery, setPersistedGallery] = useState<string[]>(initialGalleryUrls);
  const [removedUrls, setRemovedUrls] = useState<string[]>([]);
  const [drafts, setDrafts] = useState<LocalDraft[]>([]);
  const [coverFullBlob, setCoverFullBlob] = useState<Blob | null>(null);
  const [coverCardBlob, setCoverCardBlob] = useState<Blob | null>(null);
  const [coverCardPreviewUrl, setCoverCardPreviewUrl] = useState<string | null>(null);
  const [cropTarget, setCropTarget] = useState<CropTarget | null>(null);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPersistedFull(initialCoverUrl);
    setPersistedCard(initialCardUrl ?? initialCoverUrl);
    setPersistedGallery(initialGalleryUrls);
    setRemovedUrls([]);
    setDrafts([]);
    setCoverFullBlob(null);
    setCoverCardBlob(null);
    setCoverCardPreviewUrl(null);
  }, [initialCoverUrl, initialCardUrl, initialGalleryUrls]);

  function buildState(
    fullUrl: string | null,
    cardUrl: string | null,
    gallery: string[],
    removed: string[],
    localDrafts: LocalDraft[],
    fullBlob: Blob | null,
    cardBlob: Blob | null,
    cardPreview: string | null,
  ): MediaUploadState {
    const coverDraft = localDrafts.find((d) => d.isCover);
    return {
      coverFullBlob: fullBlob ?? coverDraft?.fullBlob ?? null,
      coverCardBlob: cardBlob ?? coverDraft?.cardBlob ?? null,
      coverCardDisplayUrl: cardPreview ?? coverDraft?.cardPreviewUrl ?? cardUrl ?? fullUrl,
      persistedFullCoverUrl: fullBlob || coverDraft ? null : fullUrl,
      persistedCardCoverUrl: cardBlob || coverDraft ? null : cardUrl,
      persistedGalleryUrls: gallery,
      pendingGalleryFiles: localDrafts.filter((d) => !d.isCover).map((d) => d.file),
      removedUrls: removed,
    };
  }

  function emit(
    fullUrl = persistedFull,
    cardUrl = persistedCard,
    gallery = persistedGallery,
    removed = removedUrls,
    localDrafts = drafts,
    fullBlob = coverFullBlob,
    cardBlob = coverCardBlob,
    cardPreview = coverCardPreviewUrl,
  ) {
    onChange(buildState(fullUrl, cardUrl, gallery, removed, localDrafts, fullBlob, cardBlob, cardPreview));
  }

  const totalCount =
    drafts.length +
    (persistedFull ? 1 : 0) +
    persistedGallery.filter((u) => u !== persistedFull).length;

  function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setError('');
    const remaining = MAX_STORY_IMAGES - totalCount;
    if (remaining <= 0) {
      setError(`Maximum ${MAX_STORY_IMAGES} images per story.`);
      return;
    }

    const needsCover = !persistedFull && !coverFullBlob && !drafts.some((d) => d.isCover);
    const picked = Array.from(files).slice(0, remaining);
    const newDrafts: LocalDraft[] = picked.map((file, i) => ({
      id: makeId(),
      file,
      previewUrl: URL.createObjectURL(file),
      isCover: needsCover && i === 0,
      fullBlob: null,
      cardBlob: null,
      cardPreviewUrl: null,
    }));

    const next = [...drafts, ...newDrafts];
    setDrafts(next);

    const coverDraft = newDrafts.find((d) => d.isCover) ?? newDrafts[0];
    if (coverDraft && !coverDraft.cardBlob) {
      setCropTarget({ kind: 'draft', draft: coverDraft });
    }
    emit(persistedFull, persistedCard, persistedGallery, removedUrls, next, coverFullBlob, coverCardBlob, coverCardPreviewUrl);
  }

  function setPersistedAsCover(url: string) {
    if (url === persistedFull && !coverFullBlob) return;
    const oldFull = persistedFull;
    let newGallery = persistedGallery.filter((u) => u !== url);
    if (oldFull && oldFull !== url) {
      newGallery = [oldFull, ...newGallery.filter((u) => u !== oldFull)];
    }
    const clearedDrafts = drafts.map((d) => ({ ...d, isCover: false }));
    setPersistedFull(url);
    setPersistedCard(url);
    setCoverFullBlob(null);
    setCoverCardBlob(null);
    setCoverCardPreviewUrl(null);
    setDrafts(clearedDrafts);
    emit(url, url, newGallery, removedUrls, clearedDrafts, null, null, null);
  }

  function setAsCover(id: string) {
    const target = drafts.find((d) => d.id === id);
    if (!target) return;
    if (!target.cardBlob) {
      setCropTarget({ kind: 'draft', draft: target });
      const next = drafts.map((d) => ({ ...d, isCover: d.id === id }));
      setDrafts(next);
      setPersistedFull(null);
      setPersistedCard(null);
      setCoverFullBlob(null);
      setCoverCardBlob(null);
      setCoverCardPreviewUrl(null);
      emit(null, null, persistedGallery, removedUrls, next, null, null, null);
      return;
    }
    const next = drafts.map((d) => ({ ...d, isCover: d.id === id }));
    setDrafts(next);
    setCoverFullBlob(target.fullBlob);
    setCoverCardBlob(target.cardBlob);
    setCoverCardPreviewUrl(target.cardPreviewUrl);
    setPersistedFull(null);
    setPersistedCard(null);
    emit(null, null, persistedGallery, removedUrls, next, target.fullBlob, target.cardBlob, target.cardPreviewUrl);
  }

  function removeDraft(id: string) {
    const removed = drafts.find((d) => d.id === id);
    if (removed) {
      URL.revokeObjectURL(removed.previewUrl);
      if (removed.cardPreviewUrl) URL.revokeObjectURL(removed.cardPreviewUrl);
    }
    const next = drafts.filter((d) => d.id !== id);
    setDrafts(next);
    const coverDraft = next.find((d) => d.isCover);
    setCoverFullBlob(coverDraft?.fullBlob ?? null);
    setCoverCardBlob(coverDraft?.cardBlob ?? null);
    setCoverCardPreviewUrl(coverDraft?.cardPreviewUrl ?? null);
    emit(persistedFull, persistedCard, persistedGallery, removedUrls, next, coverDraft?.fullBlob ?? null, coverDraft?.cardBlob ?? null, coverDraft?.cardPreviewUrl ?? null);
  }

  function removePersisted(url: string) {
    const removed = [...removedUrls, url];
    if (url === persistedCard && persistedCard !== persistedFull) removed.push(persistedCard);
    setRemovedUrls(removed);
    if (url === persistedFull) {
      setPersistedFull(null);
      setPersistedCard(null);
      emit(null, null, persistedGallery, removed, drafts, coverFullBlob, coverCardBlob, coverCardPreviewUrl);
    } else {
      const nextGallery = persistedGallery.filter((u) => u !== url);
      setPersistedGallery(nextGallery);
      emit(persistedFull, persistedCard, nextGallery, removed, drafts, coverFullBlob, coverCardBlob, coverCardPreviewUrl);
    }
  }

  async function handleCropApply(cardBlob: Blob, cardPreviewUrl: string) {
    if (!cropTarget) return;

    if (cropTarget.kind === 'persisted-full') {
      setPersistedCard(null);
      setCoverCardBlob(cardBlob);
      setCoverCardPreviewUrl(cardPreviewUrl);
      setCropTarget(null);
      emit(persistedFull, null, persistedGallery, removedUrls, drafts, coverFullBlob, cardBlob, cardPreviewUrl);
      return;
    }

    const fullBlob = await convertFileToWebP(cropTarget.draft.file);
    const next = drafts.map((d) =>
      d.id === cropTarget.draft.id
        ? { ...d, isCover: true, fullBlob, cardBlob, cardPreviewUrl }
        : { ...d, isCover: false },
    );
    setDrafts(next);
    setPersistedFull(null);
    setPersistedCard(null);
    setCoverFullBlob(fullBlob);
    setCoverCardBlob(cardBlob);
    setCoverCardPreviewUrl(cardPreviewUrl);
    setCropTarget(null);
    emit(null, null, persistedGallery, removedUrls, next, fullBlob, cardBlob, cardPreviewUrl);
  }

  function closeCropModal() {
    if (cropTarget?.kind === 'draft' && !cropTarget.draft.cardBlob) {
      removeDraft(cropTarget.draft.id);
    }
    setCropTarget(null);
  }

  type Thumb = {
    key: string;
    url: string;
    isCover: boolean;
    onRemove: () => void;
    onSelect?: () => void;
  };

  const hasDraftCover = drafts.some((d) => d.isCover);
  const thumbs: Thumb[] = [];

  if (persistedFull && !coverFullBlob) {
    thumbs.push({
      key: `p-cover-${persistedFull}`,
      url: persistedCard ?? persistedFull,
      isCover: !hasDraftCover,
      onRemove: () => removePersisted(persistedFull),
      onSelect: () => setPersistedAsCover(persistedFull),
    });
  }
  for (const url of persistedGallery) {
    if (url === persistedFull) continue;
    thumbs.push({
      key: `p-${url}`,
      url,
      isCover: false,
      onRemove: () => removePersisted(url),
      onSelect: () => setPersistedAsCover(url),
    });
  }
  for (const d of drafts) {
    thumbs.push({
      key: d.id,
      url: d.cardPreviewUrl ?? d.previewUrl,
      isCover: d.isCover,
      onRemove: () => removeDraft(d.id),
      onSelect: () => setAsCover(d.id),
    });
  }

  const cardPreview = coverCardPreviewUrl ?? persistedCard ?? persistedFull;
  const fullPreview = drafts.find((d) => d.isCover)?.previewUrl ?? persistedFull;
  const canRecrop = !disabled && !!(fullPreview || coverFullBlob || drafts.some((d) => d.isCover && d.fullBlob));

  function openRecrop() {
    const draftCover = drafts.find((d) => d.isCover);
    if (draftCover) {
      setCropTarget({ kind: 'draft', draft: draftCover });
    } else if (persistedFull) {
      setCropTarget({ kind: 'persisted-full', url: persistedFull });
    }
  }

  return (
    <div className="story-media-uploader">
      {error && <div className="form-error">{error}</div>}

      {thumbs.length > 0 && (
        <div className="media-gallery-preview">
          <p className="form-hint media-preview-label">Card preview (16:9 — used on home &amp; story cards)</p>
          <div className="media-main-stage">
            {cardPreview ? (
              <img src={cardPreview} alt="Card crop preview" className="media-main-image" />
            ) : (
              <div className="media-main-placeholder">Crop your cover for story cards</div>
            )}
          </div>
          {canRecrop && (
            <button type="button" className="btn btn-ghost btn-sm media-recrop-btn" onClick={openRecrop}>
              Adjust card crop
            </button>
          )}
          <div className="media-thumb-strip" role="tablist" aria-label="Story images">
            {thumbs.map((item) => (
              <div key={item.key} className={`media-thumb-wrap ${item.isCover ? 'is-cover' : ''}`}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={item.isCover}
                  className={`media-thumb ${item.isCover ? 'active' : ''}`}
                  onClick={item.onSelect}
                  disabled={disabled}
                  title={item.isCover ? 'Cover image' : 'Set as cover'}
                >
                  <img src={item.url} alt="" />
                  {item.isCover && <span className="media-thumb-badge">Cover</span>}
                </button>
                <button
                  type="button"
                  className="media-thumb-remove"
                  onClick={item.onRemove}
                  disabled={disabled}
                  aria-label="Remove image"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="file-input-hidden"
        disabled={disabled || totalCount >= MAX_STORY_IMAGES}
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = '';
        }}
      />
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        disabled={disabled || totalCount >= MAX_STORY_IMAGES}
        onClick={() => inputRef.current?.click()}
      >
        Add photos ({totalCount}/{MAX_STORY_IMAGES})
      </button>
      <p className="form-hint">
        Full image saved for reading view · 16:9 crop for cards only
      </p>

      {cropTarget && (
        <ImageCropModal
          file={cropTarget.kind === 'draft' ? cropTarget.draft.file : undefined}
          imageUrl={cropTarget.kind === 'persisted-full' ? cropTarget.url : undefined}
          onApply={handleCropApply}
          onClose={closeCropModal}
        />
      )}
    </div>
  );
}
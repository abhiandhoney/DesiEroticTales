import { useEffect, useRef, useState } from 'react';
import ImageCropModal from './ImageCropModal';

export const MAX_STORY_IMAGES = 8;

export interface MediaUploadState {
  coverBlob: Blob | null;
  coverDisplayUrl: string | null;
  persistedCoverUrl: string | null;
  persistedGalleryUrls: string[];
  pendingGalleryFiles: File[];
  removedUrls: string[];
}

interface StoryMediaUploaderProps {
  initialCoverUrl: string | null;
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
  croppedBlob: Blob | null;
  croppedPreviewUrl: string | null;
}

type CropTarget =
  | { kind: 'draft'; draft: LocalDraft }
  | { kind: 'persisted'; url: string };

export default function StoryMediaUploader({
  initialCoverUrl,
  initialGalleryUrls,
  onChange,
  disabled = false,
}: StoryMediaUploaderProps) {
  const [persistedCover, setPersistedCover] = useState<string | null>(initialCoverUrl);
  const [persistedGallery, setPersistedGallery] = useState<string[]>(initialGalleryUrls);
  const [removedUrls, setRemovedUrls] = useState<string[]>([]);
  const [drafts, setDrafts] = useState<LocalDraft[]>([]);
  const [coverBlob, setCoverBlob] = useState<Blob | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const [cropTarget, setCropTarget] = useState<CropTarget | null>(null);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPersistedCover(initialCoverUrl);
    setPersistedGallery(initialGalleryUrls);
    setRemovedUrls([]);
    setDrafts([]);
    setCoverBlob(null);
    setCoverPreviewUrl(null);
  }, [initialCoverUrl, initialGalleryUrls]);

  function buildState(
    cover: string | null,
    gallery: string[],
    removed: string[],
    localDrafts: LocalDraft[],
    blob: Blob | null,
    previewUrl: string | null,
  ): MediaUploadState {
    const coverDraft = localDrafts.find((d) => d.isCover);
    return {
      coverBlob: blob,
      coverDisplayUrl: previewUrl ?? coverDraft?.croppedPreviewUrl ?? cover,
      persistedCoverUrl: blob || coverDraft ? null : cover,
      persistedGalleryUrls: gallery,
      pendingGalleryFiles: localDrafts.filter((d) => !d.isCover).map((d) => d.file),
      removedUrls: removed,
    };
  }

  function emit(
    cover = persistedCover,
    gallery = persistedGallery,
    removed = removedUrls,
    localDrafts = drafts,
    blob = coverBlob,
    previewUrl = coverPreviewUrl,
  ) {
    onChange(buildState(cover, gallery, removed, localDrafts, blob, previewUrl));
  }

  const totalCount =
    drafts.length +
    (persistedCover ? 1 : 0) +
    persistedGallery.filter((u) => u !== persistedCover).length;

  function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setError('');
    const remaining = MAX_STORY_IMAGES - totalCount;
    if (remaining <= 0) {
      setError(`Maximum ${MAX_STORY_IMAGES} images per story.`);
      return;
    }

    const needsCover = !persistedCover && !coverBlob && !drafts.some((d) => d.isCover);
    const picked = Array.from(files).slice(0, remaining);
    const newDrafts: LocalDraft[] = picked.map((file, i) => ({
      id: makeId(),
      file,
      previewUrl: URL.createObjectURL(file),
      isCover: needsCover && i === 0,
      croppedBlob: null,
      croppedPreviewUrl: null,
    }));

    const next = [...drafts, ...newDrafts];
    setDrafts(next);

    const coverDraft = newDrafts.find((d) => d.isCover) ?? newDrafts[0];
    if (coverDraft && !coverDraft.croppedBlob) {
      setCropTarget({ kind: 'draft', draft: coverDraft });
    }
    emit(persistedCover, persistedGallery, removedUrls, next, coverBlob, coverPreviewUrl);
  }

  function setPersistedAsCover(url: string) {
    if (url === persistedCover && !coverBlob) return;
    const oldCover = persistedCover;
    let newGallery = persistedGallery.filter((u) => u !== url);
    if (oldCover && oldCover !== url) {
      newGallery = [oldCover, ...newGallery.filter((u) => u !== oldCover)];
    }
    const clearedDrafts = drafts.map((d) => ({ ...d, isCover: false }));
    setPersistedCover(url);
    setPersistedGallery(newGallery);
    setCoverBlob(null);
    setCoverPreviewUrl(null);
    setDrafts(clearedDrafts);
    emit(url, newGallery, removedUrls, clearedDrafts, null, null);
  }

  function setAsCover(id: string) {
    const target = drafts.find((d) => d.id === id);
    if (!target) return;
    if (!target.croppedBlob) {
      setCropTarget({ kind: 'draft', draft: target });
      const next = drafts.map((d) => ({ ...d, isCover: d.id === id }));
      setDrafts(next);
      setPersistedCover(null);
      setCoverBlob(null);
      setCoverPreviewUrl(null);
      emit(null, persistedGallery, removedUrls, next, null, null);
      return;
    }
    const next = drafts.map((d) => ({ ...d, isCover: d.id === id }));
    setDrafts(next);
    setCoverBlob(target.croppedBlob);
    setCoverPreviewUrl(target.croppedPreviewUrl);
    setPersistedCover(null);
    emit(null, persistedGallery, removedUrls, next, target.croppedBlob, target.croppedPreviewUrl);
  }

  function removeDraft(id: string) {
    const removed = drafts.find((d) => d.id === id);
    if (removed) {
      URL.revokeObjectURL(removed.previewUrl);
      if (removed.croppedPreviewUrl) URL.revokeObjectURL(removed.croppedPreviewUrl);
    }
    const next = drafts.filter((d) => d.id !== id);
    setDrafts(next);
    const coverDraft = next.find((d) => d.isCover);
    const blob = coverDraft?.croppedBlob ?? null;
    const preview = coverDraft?.croppedPreviewUrl ?? null;
    setCoverBlob(blob);
    setCoverPreviewUrl(preview);
    emit(persistedCover, persistedGallery, removedUrls, next, blob, preview);
  }

  function removePersisted(url: string) {
    const removed = [...removedUrls, url];
    setRemovedUrls(removed);
    if (url === persistedCover) {
      setPersistedCover(null);
      emit(null, persistedGallery, removed, drafts, coverBlob, coverPreviewUrl);
    } else {
      const nextGallery = persistedGallery.filter((u) => u !== url);
      setPersistedGallery(nextGallery);
      emit(persistedCover, nextGallery, removed, drafts, coverBlob, coverPreviewUrl);
    }
  }

  function handleCropApply(blob: Blob, previewUrl: string) {
    if (!cropTarget) return;

    if (cropTarget.kind === 'persisted') {
      const oldUrl = cropTarget.url;
      const removed = oldUrl ? [...removedUrls, oldUrl] : removedUrls;
      setRemovedUrls(removed);
      setPersistedCover(null);
      setCoverBlob(blob);
      setCoverPreviewUrl(previewUrl);
      setCropTarget(null);
      const clearedDrafts = drafts.map((d) => ({ ...d, isCover: false }));
      setDrafts(clearedDrafts);
      emit(null, persistedGallery, removed, clearedDrafts, blob, previewUrl);
      return;
    }

    const next = drafts.map((d) =>
      d.id === cropTarget.draft.id
        ? { ...d, isCover: true, croppedBlob: blob, croppedPreviewUrl: previewUrl }
        : { ...d, isCover: false },
    );
    setDrafts(next);
    setPersistedCover(null);
    setCoverBlob(blob);
    setCoverPreviewUrl(previewUrl);
    setCropTarget(null);
    emit(null, persistedGallery, removedUrls, next, blob, previewUrl);
  }

  function closeCropModal() {
    if (cropTarget?.kind === 'draft' && !cropTarget.draft.croppedBlob) {
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

  if (persistedCover && !coverBlob) {
    thumbs.push({
      key: `p-cover-${persistedCover}`,
      url: persistedCover,
      isCover: !hasDraftCover,
      onRemove: () => removePersisted(persistedCover),
      onSelect: () => setPersistedAsCover(persistedCover),
    });
  }
  for (const url of persistedGallery) {
    if (url === persistedCover) continue;
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
      url: d.croppedPreviewUrl ?? d.previewUrl,
      isCover: d.isCover,
      onRemove: () => removeDraft(d.id),
      onSelect: () => setAsCover(d.id),
    });
  }

  const coverThumb = thumbs.find((t) => t.isCover) ?? thumbs[0];
  const activeCoverUrl = coverPreviewUrl ?? coverThumb?.url ?? null;
  const canRecrop = !disabled && (persistedCover || coverBlob || drafts.some((d) => d.isCover && d.croppedBlob));

  function openRecrop() {
    if (coverBlob && coverPreviewUrl) {
      setCropTarget({ kind: 'persisted', url: coverPreviewUrl });
    } else if (persistedCover) {
      setCropTarget({ kind: 'persisted', url: persistedCover });
    } else {
      const draftCover = drafts.find((d) => d.isCover);
      if (draftCover) setCropTarget({ kind: 'draft', draft: draftCover });
    }
  }

  return (
    <div className="story-media-uploader">
      {error && <div className="form-error">{error}</div>}

      {thumbs.length > 0 && (
        <div className="media-gallery-preview">
          <div className="media-main-stage">
            {activeCoverUrl ? (
              <img src={activeCoverUrl} alt="Cover preview" className="media-main-image" />
            ) : (
              <div className="media-main-placeholder">Select a cover image</div>
            )}
          </div>
          {canRecrop && (
            <button type="button" className="btn btn-ghost btn-sm media-recrop-btn" onClick={openRecrop}>
              Adjust cover crop
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
        Any image format accepted · saved as WebP · crop cover for story cards (16:9)
      </p>

      {cropTarget && (
        <ImageCropModal
          file={cropTarget.kind === 'draft' ? cropTarget.draft.file : undefined}
          imageUrl={cropTarget.kind === 'persisted' ? cropTarget.url : undefined}
          onApply={handleCropApply}
          onClose={closeCropModal}
        />
      )}
    </div>
  );
}
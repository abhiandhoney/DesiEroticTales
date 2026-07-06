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
  const [cropTarget, setCropTarget] = useState<LocalDraft | null>(null);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPersistedCover(initialCoverUrl);
    setPersistedGallery(initialGalleryUrls);
    setRemovedUrls([]);
    setDrafts([]);
    setCoverBlob(null);
  }, [initialCoverUrl, initialGalleryUrls]);

  function buildState(
    cover: string | null,
    gallery: string[],
    removed: string[],
    localDrafts: LocalDraft[],
    blob: Blob | null,
  ): MediaUploadState {
    const coverDraft = localDrafts.find((d) => d.isCover);
    return {
      coverBlob: blob,
      coverDisplayUrl: coverDraft?.croppedPreviewUrl ?? cover,
      persistedCoverUrl: coverDraft ? null : cover,
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
  ) {
    onChange(buildState(cover, gallery, removed, localDrafts, blob));
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

    const needsCover = !persistedCover && !drafts.some((d) => d.isCover);
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
      setCropTarget(coverDraft);
    }
    emit(persistedCover, persistedGallery, removedUrls, next, coverBlob);
  }

  function setAsCover(id: string) {
    const target = drafts.find((d) => d.id === id);
    if (!target) return;
    if (!target.croppedBlob) {
      setCropTarget(target);
      const next = drafts.map((d) => ({ ...d, isCover: d.id === id }));
      setDrafts(next);
      setPersistedCover(null);
      emit(null, persistedGallery, removedUrls, next, null);
      return;
    }
    const next = drafts.map((d) => ({ ...d, isCover: d.id === id }));
    setDrafts(next);
    setCoverBlob(target.croppedBlob);
    emit(null, persistedGallery, removedUrls, next, target.croppedBlob);
  }

  function removeDraft(id: string) {
    const removed = drafts.find((d) => d.id === id);
    if (removed) {
      URL.revokeObjectURL(removed.previewUrl);
      if (removed.croppedPreviewUrl) URL.revokeObjectURL(removed.croppedPreviewUrl);
    }
    const next = drafts.filter((d) => d.id !== id);
    setDrafts(next);
    const blob = next.find((d) => d.isCover)?.croppedBlob ?? null;
    setCoverBlob(blob);
    emit(persistedCover, persistedGallery, removedUrls, next, blob);
  }

  function removePersisted(url: string) {
    const removed = [...removedUrls, url];
    setRemovedUrls(removed);
    if (url === persistedCover) {
      setPersistedCover(null);
      emit(null, persistedGallery, removed, drafts, coverBlob);
    } else {
      const nextGallery = persistedGallery.filter((u) => u !== url);
      setPersistedGallery(nextGallery);
      emit(persistedCover, nextGallery, removed, drafts, coverBlob);
    }
  }

  function handleCropApply(blob: Blob, previewUrl: string) {
    if (!cropTarget) return;
    const next = drafts.map((d) =>
      d.id === cropTarget.id
        ? { ...d, isCover: true, croppedBlob: blob, croppedPreviewUrl: previewUrl }
        : { ...d, isCover: false },
    );
    setDrafts(next);
    setPersistedCover(null);
    setCoverBlob(blob);
    setCropTarget(null);
    emit(null, persistedGallery, removedUrls, next, blob);
  }

  type Thumb = {
    key: string;
    url: string;
    isCover: boolean;
    onRemove: () => void;
    onSelect?: () => void;
  };

  const thumbs: Thumb[] = [];
  if (persistedCover) {
    thumbs.push({
      key: `p-cover-${persistedCover}`,
      url: persistedCover,
      isCover: !drafts.some((d) => d.isCover),
      onRemove: () => removePersisted(persistedCover),
    });
  }
  for (const url of persistedGallery) {
    if (url === persistedCover) continue;
    thumbs.push({
      key: `p-${url}`,
      url,
      isCover: false,
      onRemove: () => removePersisted(url),
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

  return (
    <div className="story-media-uploader">
      {error && <div className="form-error">{error}</div>}

      {thumbs.length > 0 && (
        <div className="media-gallery-preview">
          <div className="media-main-stage">
            {coverThumb ? (
              <img src={coverThumb.url} alt="Cover preview" className="media-main-image" />
            ) : (
              <div className="media-main-placeholder">Select a cover image</div>
            )}
          </div>
          <div className="media-thumb-strip" role="listbox" aria-label="Story images">
            {thumbs.map((item) => (
              <div key={item.key} className={`media-thumb-wrap ${item.isCover ? 'is-cover' : ''}`}>
                <button
                  type="button"
                  className="media-thumb"
                  onClick={item.onSelect}
                  disabled={disabled || !item.onSelect}
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
          file={cropTarget.file}
          onApply={handleCropApply}
          onClose={() => setCropTarget(null)}
        />
      )}
    </div>
  );
}
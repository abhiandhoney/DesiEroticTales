import { useEffect, useRef, useState } from 'react';
import type { CoverCropResult } from './ImageCropModal';
import ImageCropModal from './ImageCropModal';
import ResolvedImage from './ResolvedImage';
import { isDraftImageUrl, resolveStoryImageUrl } from '../lib/storyImages';

export interface CoverUploadState {
  coverFullBlob: Blob | null;
  coverCardBlob: Blob | null;
  coverCardDisplayUrl: string | null;
  coverFullDisplayUrl: string | null;
  persistedFullCoverUrl: string | null;
  persistedCardCoverUrl: string | null;
  removedCoverUrls: string[];
}

interface StoryCoverUploaderProps {
  initialCoverUrl: string | null;
  initialCardUrl?: string | null;
  onChange: (state: CoverUploadState) => void;
  disabled?: boolean;
}

function useResolvedUrl(src: string | null): string | null {
  const [resolved, setResolved] = useState<string | null>(src);
  useEffect(() => {
    let cancelled = false;
    if (!src) {
      setResolved(null);
      return;
    }
    if (!isDraftImageUrl(src)) {
      setResolved(src);
      return;
    }
    resolveStoryImageUrl(src).then((url) => {
      if (!cancelled) setResolved(url);
    });
    return () => { cancelled = true; };
  }, [src]);
  return resolved;
}

export default function StoryCoverUploader({
  initialCoverUrl,
  initialCardUrl = null,
  onChange,
  disabled = false,
}: StoryCoverUploaderProps) {
  const [persistedFull, setPersistedFull] = useState<string | null>(initialCoverUrl);
  const [persistedCard, setPersistedCard] = useState<string | null>(initialCardUrl ?? initialCoverUrl);
  const [fullBlob, setFullBlob] = useState<Blob | null>(null);
  const [cardBlob, setCardBlob] = useState<Blob | null>(null);
  const [cardPreviewUrl, setCardPreviewUrl] = useState<string | null>(null);
  const [fullPreviewUrl, setFullPreviewUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [removedUrls, setRemovedUrls] = useState<string[]>([]);
  const [cropOpen, setCropOpen] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const resolvedPersistedFull = useResolvedUrl(persistedFull);
  const resolvedPersistedCard = useResolvedUrl(persistedCard);

  useEffect(() => {
    setPersistedFull(initialCoverUrl);
    setPersistedCard(initialCardUrl ?? initialCoverUrl);
    setFullBlob(null);
    setCardBlob(null);
    setCardPreviewUrl(null);
    setFullPreviewUrl(null);
    setPreviewUrl(null);
    setPendingFile(null);
    setRemovedUrls([]);
  }, [initialCoverUrl, initialCardUrl]);

  function emit(
    fullUrl = persistedFull,
    cardUrl = persistedCard,
    fBlob = fullBlob,
    cBlob = cardBlob,
    cPreview = cardPreviewUrl,
    fPreview = fullPreviewUrl,
    removed = removedUrls,
  ) {
    onChange({
      coverFullBlob: fBlob,
      coverCardBlob: cBlob,
      coverCardDisplayUrl: cPreview ?? cardUrl ?? fullUrl,
      coverFullDisplayUrl: fPreview ?? (fBlob ? null : fullUrl),
      persistedFullCoverUrl: fBlob ? null : fullUrl,
      persistedCardCoverUrl: cBlob ? null : cardUrl,
      removedCoverUrls: removed,
    });
  }

  function handleFile(file: File) {
    setError('');
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setPendingFile(file);
    setPersistedFull(null);
    setPersistedCard(null);
    setFullBlob(null);
    setCardBlob(null);
    setCardPreviewUrl(null);
    setFullPreviewUrl(null);
    setCropOpen(true);
    emit(null, null, null, null, null, null, removedUrls);
  }

  function removeCover() {
    const toRemove = [...removedUrls];
    if (persistedFull) toRemove.push(persistedFull);
    if (persistedCard && persistedCard !== persistedFull) toRemove.push(persistedCard);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (cardPreviewUrl) URL.revokeObjectURL(cardPreviewUrl);
    if (fullPreviewUrl) URL.revokeObjectURL(fullPreviewUrl);
    setPersistedFull(null);
    setPersistedCard(null);
    setFullBlob(null);
    setCardBlob(null);
    setCardPreviewUrl(null);
    setFullPreviewUrl(null);
    setPreviewUrl(null);
    setPendingFile(null);
    setRemovedUrls(toRemove);
    emit(null, null, null, null, null, null, toRemove);
  }

  function handleCropApply({ cardBlob: card, cardPreviewUrl: cardUrl, fullBlob: full }: CoverCropResult) {
    const fullUrl = URL.createObjectURL(full);
    setFullBlob(full);
    setCardBlob(card);
    setCardPreviewUrl(cardUrl);
    setFullPreviewUrl(fullUrl);
    setCropOpen(false);
    emit(null, null, full, card, cardUrl, fullUrl, removedUrls);
  }

  const heroDisplay = fullPreviewUrl ?? (fullBlob ? null : resolvedPersistedFull) ?? previewUrl;
  const cardDisplay = cardPreviewUrl ?? (cardBlob ? null : resolvedPersistedCard) ?? resolvedPersistedFull ?? previewUrl;
  const hasCover = !!(persistedFull || fullBlob || previewUrl);
  const cropImageUrl = pendingFile ? undefined : (resolvedPersistedFull ?? undefined);

  return (
    <div className="story-cover-uploader">
      {error && <div className="form-error">{error}</div>}

      {hasCover ? (
        <div className="story-cover-preview">
          <p className="form-hint">Story cover — shown at the top of your story page</p>
          <div className="media-main-stage media-main-stage-hero">
            {heroDisplay ? (
              <img src={heroDisplay} alt="Full cover preview" className="media-main-image" />
            ) : persistedFull && !fullBlob ? (
              <ResolvedImage src={persistedFull} alt="Full cover preview" className="media-main-image" />
            ) : (
              <div className="media-main-placeholder">Cover preview</div>
            )}
          </div>

          <div className="story-cover-card-preview">
            <p className="form-hint">Card preview (16:9)</p>
            <div className="crop-card-mock crop-card-mock--inline">
              {cardDisplay ? (
                <img src={cardDisplay} alt="" className="crop-card-mock-image" />
              ) : persistedCard && !cardBlob ? (
                <ResolvedImage src={persistedCard} alt="" className="crop-card-mock-image" />
              ) : (
                <div className="crop-card-mock-placeholder">Card preview</div>
              )}
              <span className="crop-card-mock-badge">Category</span>
            </div>
          </div>

          <div className="story-cover-actions">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={disabled}
              onClick={() => setCropOpen(true)}
            >
              Adjust crop
            </button>
            <button type="button" className="btn btn-ghost btn-sm" disabled={disabled} onClick={removeCover}>
              Remove cover
            </button>
          </div>
        </div>
      ) : (
        <p className="form-hint">Optional cover image for cards and the story header. Inline images go inside the story editor.</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="file-input-hidden"
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) handleFile(file);
        }}
      />
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        {hasCover ? 'Replace cover photo' : 'Upload cover photo'}
      </button>

      {cropOpen && (pendingFile || persistedFull) && (
        <ImageCropModal
          file={pendingFile ?? undefined}
          imageUrl={cropImageUrl}
          onApply={handleCropApply}
          onClose={() => {
            if (pendingFile && !fullBlob) removeCover();
            setCropOpen(false);
          }}
        />
      )}
    </div>
  );
}
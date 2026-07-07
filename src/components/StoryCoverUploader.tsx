import { useEffect, useRef, useState } from 'react';
import { convertFileToWebP } from '../lib/imageProcessing';
import ImageCropModal from './ImageCropModal';

export interface CoverUploadState {
  coverFullBlob: Blob | null;
  coverCardBlob: Blob | null;
  coverCardDisplayUrl: string | null;
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [removedUrls, setRemovedUrls] = useState<string[]>([]);
  const [cropOpen, setCropOpen] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPersistedFull(initialCoverUrl);
    setPersistedCard(initialCardUrl ?? initialCoverUrl);
    setFullBlob(null);
    setCardBlob(null);
    setCardPreviewUrl(null);
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
    removed = removedUrls,
  ) {
    onChange({
      coverFullBlob: fBlob,
      coverCardBlob: cBlob,
      coverCardDisplayUrl: cPreview ?? cardUrl ?? fullUrl,
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
    setCropOpen(true);
    emit(null, null, null, null, null, removedUrls);
  }

  function removeCover() {
    const toRemove = [...removedUrls];
    if (persistedFull) toRemove.push(persistedFull);
    if (persistedCard && persistedCard !== persistedFull) toRemove.push(persistedCard);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPersistedFull(null);
    setPersistedCard(null);
    setFullBlob(null);
    setCardBlob(null);
    setCardPreviewUrl(null);
    setPreviewUrl(null);
    setPendingFile(null);
    setRemovedUrls(toRemove);
    emit(null, null, null, null, null, toRemove);
  }

  async function handleCropApply(card: Blob, cardUrl: string) {
    if (pendingFile) {
      const full = await convertFileToWebP(pendingFile);
      setFullBlob(full);
      setCardBlob(card);
      setCardPreviewUrl(cardUrl);
      setCropOpen(false);
      emit(null, null, full, card, cardUrl, removedUrls);
      return;
    }
    if (persistedFull) {
      setCardBlob(card);
      setCardPreviewUrl(cardUrl);
      setCropOpen(false);
      emit(persistedFull, null, null, card, cardUrl, removedUrls);
    }
  }

  const cardDisplay = cardPreviewUrl ?? persistedCard ?? persistedFull ?? previewUrl;
  const hasCover = !!(persistedFull || fullBlob || previewUrl);

  return (
    <div className="story-cover-uploader">
      {error && <div className="form-error">{error}</div>}

      {hasCover ? (
        <div className="story-cover-preview">
          <p className="form-hint">Story cover (optional) — shown at the top of your story page</p>
          <div className="media-main-stage">
            {cardDisplay ? (
              <img src={cardDisplay} alt="Story cover preview" className="media-main-image" />
            ) : (
              <div className="media-main-placeholder">Cover preview</div>
            )}
          </div>
          <div className="story-cover-actions">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={disabled}
              onClick={() => setCropOpen(true)}
            >
              Adjust card crop
            </button>
            <button type="button" className="btn btn-ghost btn-sm" disabled={disabled} onClick={removeCover}>
              Remove cover
            </button>
          </div>
          <p className="form-hint">16:9 crop is used on story cards and listings.</p>
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
          imageUrl={!pendingFile ? persistedFull ?? undefined : undefined}
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
import { useCallback, useEffect, useRef, useState } from 'react';
import ReactCrop, {
  centerCrop,
  convertToPixelCrop,
  makeAspectCrop,
  type Crop,
  type PixelCrop,
} from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import {
  CARD_COVER_HEIGHT,
  CARD_COVER_WIDTH,
  COVER_ASPECT,
  exportCroppedWebP,
  FULL_COVER_HEIGHT,
  FULL_COVER_WIDTH,
} from '../lib/imageProcessing';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { useFocusTrap } from '../hooks/useFocusTrap';

export interface CoverCropResult {
  cardBlob: Blob;
  cardPreviewUrl: string;
  fullBlob: Blob;
}

interface ImageCropModalProps {
  file?: File;
  imageUrl?: string;
  onApply: (result: CoverCropResult) => void;
  onClose: () => void;
}

function centerAspectCrop(width: number, height: number): Crop {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 92 }, COVER_ASPECT, width, height),
    width,
    height,
  );
}

export default function ImageCropModal({ file, imageUrl, onApply, onClose }: ImageCropModalProps) {
  const [previewUrl, setPreviewUrl] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [scale, setScale] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [cardPreviewUrl, setCardPreviewUrl] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let objectUrl = '';
    const url = file ? ((objectUrl = URL.createObjectURL(file)), objectUrl) : (imageUrl ?? '');
    setPreviewUrl(url);
    setCrop(undefined);
    setCompletedCrop(undefined);
    setScale(1);
    setCardPreviewUrl(null);
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [file, imageUrl]);

  useBodyScrollLock(true);
  const trapRef = useFocusTrap(true);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const next = centerAspectCrop(width, height);
    setCrop(next);
    setCompletedCrop(convertToPixelCrop(next, width, height));
  }, []);

  useEffect(() => {
    if (!completedCrop || !imgRef.current || completedCrop.width < 1 || completedCrop.height < 1) {
      return;
    }
    if (previewTimer.current) clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(async () => {
      try {
        const blob = await exportCroppedWebP(
          imgRef.current!,
          completedCrop,
          320,
          180,
          scale,
        );
        setCardPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(blob);
        });
      } catch {
        // Preview is best-effort.
      }
    }, 120);
    return () => {
      if (previewTimer.current) clearTimeout(previewTimer.current);
    };
  }, [completedCrop, scale]);

  useEffect(() => {
    return () => {
      if (cardPreviewUrl) URL.revokeObjectURL(cardPreviewUrl);
    };
  }, [cardPreviewUrl]);

  async function handleApply() {
    const img = imgRef.current;
    if (!img || !completedCrop || completedCrop.width < 1 || completedCrop.height < 1) return;
    setSaving(true);
    setError('');
    try {
      const [cardBlob, fullBlob] = await Promise.all([
        exportCroppedWebP(img, completedCrop, CARD_COVER_WIDTH, CARD_COVER_HEIGHT, scale),
        exportCroppedWebP(img, completedCrop, FULL_COVER_WIDTH, FULL_COVER_HEIGHT, scale),
      ]);
      const croppedPreview = URL.createObjectURL(cardBlob);
      onApply({ cardBlob, cardPreviewUrl: croppedPreview, fullBlob });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not crop image');
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        ref={trapRef}
        className="modal-panel crop-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="crop-title"
        aria-modal="true"
      >
        <div className="modal-header">
          <div>
            <h2 id="crop-title" className="modal-title">Position cover photo</h2>
            <p className="modal-meta">Drag to reposition · pinch or slider to zoom · 16:9 card crop</p>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        {error && <div className="form-error crop-error">{error}</div>}

        <div className="crop-workspace">
          <div className="crop-editor">
            {previewUrl ? (
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={COVER_ASPECT}
                locked
                className="crop-react-root"
              >
                <img
                  ref={imgRef}
                  className="crop-react-image"
                  src={previewUrl}
                  alt="Crop source"
                  style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}
                  onLoad={onImageLoad}
                  draggable={false}
                />
              </ReactCrop>
            ) : (
              <div className="crop-loading"><div className="spinner" /></div>
            )}
          </div>

          <aside className="crop-card-preview" aria-label="Story card preview">
            <p className="crop-preview-label">Card preview</p>
            <div className="crop-card-mock">
              {cardPreviewUrl ? (
                <img src={cardPreviewUrl} alt="" className="crop-card-mock-image" />
              ) : (
                <div className="crop-card-mock-placeholder">Preview</div>
              )}
              <span className="crop-card-mock-badge">Category</span>
            </div>
            <p className="form-hint">How your cover appears in story listings.</p>
          </aside>
        </div>

        <div className="crop-controls">
          <label htmlFor="crop-zoom">Zoom</label>
          <input
            id="crop-zoom"
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={scale}
            onChange={(e) => setScale(Number(e.target.value))}
          />
        </div>

        <div className="modal-footer">
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleApply}
              disabled={!completedCrop || saving}
            >
              {saving ? 'Processing...' : 'Use cover'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
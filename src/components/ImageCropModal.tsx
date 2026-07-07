import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  defaultCropTransform,
  loadImageFromFile,
  loadImageFromUrl,
  renderCoverWebP,
  type CropTransform,
} from '../lib/imageProcessing';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface ImageCropModalProps {
  file?: File;
  imageUrl?: string;
  onApply: (webpBlob: Blob, previewUrl: string) => void;
  onClose: () => void;
}

export default function ImageCropModal({ file, imageUrl, onApply, onClose }: ImageCropModalProps) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [transform, setTransform] = useState<CropTransform>(defaultCropTransform());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    let url = imageUrl || '';
    let objectUrl = '';

    if (file) {
      objectUrl = URL.createObjectURL(file);
      url = objectUrl;
    }

    if (url) {
      setPreviewUrl(url);
      const loader = file ? loadImageFromFile(file) : loadImageFromUrl(url);
      loader
        .then(setImg)
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load image'));
    }

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

  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    function onWheel(e: WheelEvent) {
      e.preventDefault();
      setTransform((t) => ({
        ...t,
        scale: Math.min(3, Math.max(1, t.scale + (e.deltaY > 0 ? -0.08 : 0.08))),
      }));
    }

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [previewUrl]);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    dragRef.current = {
      x: e.clientX,
      y: e.clientY,
      ox: transform.offsetX,
      oy: transform.offsetY,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [transform.offsetX, transform.offsetY]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const drag = dragRef.current;
    if (!drag) return;
    setTransform((t) => ({
      ...t,
      offsetX: drag.ox + (e.clientX - drag.x),
      offsetY: drag.oy + (e.clientY - drag.y),
    }));
  }, []);

  const onPointerEnd = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    dragRef.current = null;
  }, []);

  async function handleApply() {
    if (!img) return;
    setSaving(true);
    setError('');
    try {
      const blob = await renderCoverWebP(img, transform);
      const croppedPreview = URL.createObjectURL(blob);
      onApply(blob, croppedPreview);
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
            <h2 id="crop-title" className="modal-title">Adjust cover</h2>
            <p className="modal-meta">Drag to reposition · scroll or slider to zoom</p>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        {error && <div className="form-error crop-error">{error}</div>}

        <div
          ref={viewportRef}
          className="crop-viewport"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
        >
          {previewUrl ? (
            <img
              className="crop-image"
              src={previewUrl}
              alt="Crop preview"
              draggable={false}
              style={{
                transform: `translate(calc(-50% + ${transform.offsetX}px), calc(-50% + ${transform.offsetY}px)) scale(${transform.scale})`,
              }}
            />
          ) : (
            <div className="crop-loading"><div className="spinner" /></div>
          )}
          <div className="crop-frame" aria-hidden="true" />
        </div>

        <div className="crop-controls">
          <label htmlFor="crop-zoom">Zoom</label>
          <input
            id="crop-zoom"
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={transform.scale}
            onChange={(e) => setTransform((t) => ({ ...t, scale: Number(e.target.value) }))}
          />
        </div>

        <div className="modal-footer">
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={handleApply} disabled={!img || saving}>
              {saving ? 'Processing...' : 'Use as cover'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  defaultCropTransform,
  loadImageFromFile,
  renderCoverWebP,
  type CropTransform,
} from '../lib/imageProcessing';

interface ImageCropModalProps {
  file: File;
  onApply: (webpBlob: Blob, previewUrl: string) => void;
  onClose: () => void;
}

export default function ImageCropModal({ file, onApply, onClose }: ImageCropModalProps) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [transform, setTransform] = useState<CropTransform>(defaultCropTransform());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    loadImageFromFile(file)
      .then(setImg)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load image'));
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragRef.current = { x: e.clientX, y: e.clientY, ox: transform.offsetX, oy: transform.offsetY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [transform.offsetX, transform.offsetY]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    setTransform((t) => ({
      ...t,
      offsetX: dragRef.current!.ox + (e.clientX - dragRef.current!.x),
      offsetY: dragRef.current!.oy + (e.clientY - dragRef.current!.y),
    }));
  }, []);

  const onPointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setTransform((t) => ({
      ...t,
      scale: Math.min(3, Math.max(1, t.scale + (e.deltaY > 0 ? -0.08 : 0.08))),
    }));
  }, []);

  async function handleApply() {
    if (!img) return;
    setSaving(true);
    setError('');
    try {
      const blob = await renderCoverWebP(img, transform);
      const previewUrl = URL.createObjectURL(blob);
      onApply(blob, previewUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not crop image');
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
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
          className="crop-viewport"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={onWheel}
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
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import ImageCropModal from '../../src/components/ImageCropModal';

declare global {
  interface Window {
    __cropTest?: {
      applied: boolean;
      closed: boolean;
    };
  }
}

async function createTestImageFile(): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#8b2942');
  gradient.addColorStop(1, '#1a1a2e');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#f5d78e';
  ctx.font = 'bold 48px sans-serif';
  ctx.fillText('Crop test', 280, 310);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Failed to create test image'))), 'image/png');
  });

  return new File([blob], 'crop-test.png', { type: 'image/png' });
}

async function mount() {
  window.__cropTest = { applied: false, closed: false };
  const file = await createTestImageFile();
  const root = createRoot(document.getElementById('root')!);

  root.render(
    <StrictMode>
      <ImageCropModal
        file={file}
        onApply={() => {
          window.__cropTest!.applied = true;
        }}
        onClose={() => {
          window.__cropTest!.closed = true;
        }}
      />
    </StrictMode>,
  );
}

mount().catch((err) => {
  document.body.innerHTML = `<pre data-testid="mount-error">${String(err)}</pre>`;
});
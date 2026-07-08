import { cropToCanvas, type PixelCrop } from 'react-image-crop';

export const CARD_COVER_WIDTH = 1280;
export const CARD_COVER_HEIGHT = 720;
export const FULL_COVER_WIDTH = 1920;
export const FULL_COVER_HEIGHT = 1080;
/** @deprecated Use CARD_COVER_WIDTH */
export const COVER_WIDTH = CARD_COVER_WIDTH;
/** @deprecated Use CARD_COVER_HEIGHT */
export const COVER_HEIGHT = CARD_COVER_HEIGHT;
export const COVER_ASPECT = 16 / 9;
export const GALLERY_MAX_DIMENSION = 1920;
export const WEBP_QUALITY = 0.86;

export interface CropTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export async function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.decoding = 'async';
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Could not load image: ${file.name}`));
    };
    img.src = url;
  });
  URL.revokeObjectURL(url);
  return img;
}

export async function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.decoding = 'async';
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Could not load image from URL'));
    img.src = url;
  });
  return img;
}

function drawToCanvas(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  ctx.fillStyle = '#0f0f0f';
  ctx.fillRect(0, 0, width, height);
  draw(ctx, width, height);
  return canvas;
}

export function canvasToWebP(canvas: HTMLCanvasElement, quality = WEBP_QUALITY): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('WebP conversion failed'))),
      'image/webp',
      quality,
    );
  });
}

/** Resize any decodable image format to WebP for gallery storage. */
export async function convertFileToWebP(
  file: File,
  maxDimension = GALLERY_MAX_DIMENSION,
): Promise<Blob> {
  const img = await loadImageFromFile(file);
  const scale = Math.min(1, maxDimension / Math.max(img.naturalWidth, img.naturalHeight, 1));
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = drawToCanvas(width, height, (ctx, w, h) => {
    ctx.drawImage(img, 0, 0, w, h);
  });
  return canvasToWebP(canvas);
}

/** Export a react-image-crop selection as WebP at the target resolution. */
export async function exportCroppedWebP(
  image: HTMLImageElement,
  crop: PixelCrop,
  outputWidth: number,
  outputHeight: number,
  scale = 1,
): Promise<Blob> {
  const cropCanvas = document.createElement('canvas');
  await cropToCanvas(image, cropCanvas, crop, scale, 0);
  const outCanvas = drawToCanvas(outputWidth, outputHeight, (ctx, w, h) => {
    ctx.drawImage(cropCanvas, 0, 0, w, h);
  });
  return canvasToWebP(outCanvas);
}

/** Apply drag/zoom crop (legacy) and export 16:9 cover WebP. */
export async function renderCoverWebP(
  img: HTMLImageElement,
  transform: CropTransform,
): Promise<Blob> {
  const canvas = drawToCanvas(CARD_COVER_WIDTH, CARD_COVER_HEIGHT, (ctx, w, h) => {
    const baseScale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const scale = baseScale * transform.scale;
    const drawW = img.naturalWidth * scale;
    const drawH = img.naturalHeight * scale;
    const x = (w - drawW) / 2 + transform.offsetX;
    const y = (h - drawH) / 2 + transform.offsetY;
    ctx.drawImage(img, x, y, drawW, drawH);
  });
  return canvasToWebP(canvas);
}

export function defaultCropTransform(): CropTransform {
  return { scale: 1, offsetX: 0, offsetY: 0 };
}
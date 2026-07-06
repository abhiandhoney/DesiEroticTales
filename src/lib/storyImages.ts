import { supabase } from './supabase';

const BUCKET = 'story-images';

export function getStoragePathFromUrl(imageUrl: string): string | null {
  const marker = `/${BUCKET}/`;
  const idx = imageUrl.indexOf(marker);
  if (idx === -1) return null;
  return imageUrl.slice(idx + marker.length);
}

export async function uploadStoryImageBlob(
  userId: string,
  blob: Blob,
  suffix = 'img',
): Promise<string> {
  const filePath = `${userId}/${Date.now()}-${suffix}.webp`;
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, blob, { contentType: 'image/webp', upsert: false });
  if (uploadError) throw uploadError;
  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  return urlData.publicUrl;
}

export async function uploadStoryImageBlobs(
  userId: string,
  blobs: Blob[],
  label = 'gallery',
): Promise<string[]> {
  const urls: string[] = [];
  for (let i = 0; i < blobs.length; i++) {
    urls.push(await uploadStoryImageBlob(userId, blobs[i], `${label}-${i}`));
  }
  return urls;
}

export async function deleteStoryImage(imageUrl: string): Promise<void> {
  const path = getStoragePathFromUrl(imageUrl);
  if (!path) return;
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw error;
}

export async function deleteStoryImages(imageUrls: string[]): Promise<void> {
  const paths = imageUrls.map(getStoragePathFromUrl).filter((p): p is string => !!p);
  if (paths.length === 0) return;
  await supabase.storage.from(BUCKET).remove(paths);
}
import { supabase } from './supabase';

export const PUBLIC_BUCKET = 'story-images';
export const DRAFT_BUCKET = 'story-images-draft';
const DRAFT_REF_PREFIX = 'det-draft://';

export type ImageVisibility = 'draft' | 'published';

export function draftImageRef(bucket: string, path: string): string {
  return `${DRAFT_REF_PREFIX}${bucket}/${path}`;
}

export function parseImageRef(url: string): { bucket: string; path: string } | null {
  if (url.startsWith(DRAFT_REF_PREFIX)) {
    const rest = url.slice(DRAFT_REF_PREFIX.length);
    const slash = rest.indexOf('/');
    if (slash === -1) return null;
    return { bucket: rest.slice(0, slash), path: rest.slice(slash + 1) };
  }
  for (const bucket of [PUBLIC_BUCKET, DRAFT_BUCKET]) {
    const marker = `/${bucket}/`;
    const idx = url.indexOf(marker);
    if (idx !== -1) {
      return { bucket, path: url.slice(idx + marker.length).split('?')[0] };
    }
  }
  return null;
}

export function getStoragePathFromUrl(imageUrl: string): string | null {
  const loc = parseImageRef(imageUrl);
  return loc ? loc.path : null;
}

export function isDraftImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  if (url.startsWith(DRAFT_REF_PREFIX)) return true;
  const loc = parseImageRef(url);
  return loc?.bucket === DRAFT_BUCKET || loc?.path.startsWith('drafts/') === true;
}

function buildFilePath(userId: string, suffix: string, draft: boolean): { bucket: string; path: string } {
  const fileName = `${Date.now()}-${suffix}.webp`;
  if (draft) {
    return { bucket: DRAFT_BUCKET, path: `${userId}/${fileName}` };
  }
  return { bucket: PUBLIC_BUCKET, path: `${userId}/${fileName}` };
}

export async function uploadStoryImageBlob(
  userId: string,
  blob: Blob,
  suffix = 'img',
  visibility: ImageVisibility = 'draft',
): Promise<string> {
  const draft = visibility === 'draft';
  const { bucket, path } = buildFilePath(userId, suffix, draft);
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, blob, { contentType: 'image/webp', upsert: false });
  if (uploadError) throw uploadError;

  if (draft) {
    return draftImageRef(bucket, path);
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
  return urlData.publicUrl;
}

/** Resolve draft refs and private paths to a displayable signed URL. */
export async function resolveStoryImageUrl(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  const loc = parseImageRef(url);
  if (!loc) return url;

  if (loc.bucket === PUBLIC_BUCKET && !loc.path.startsWith('drafts/')) {
    return url.startsWith('http') ? url : supabase.storage.from(loc.bucket).getPublicUrl(loc.path).data.publicUrl;
  }

  const { data, error } = await supabase.storage
    .from(loc.bucket)
    .createSignedUrl(loc.path, 3600);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

export async function uploadStoryImageBlobs(
  userId: string,
  blobs: Blob[],
  label = 'gallery',
  visibility: ImageVisibility = 'draft',
): Promise<string[]> {
  const urls: string[] = [];
  for (let i = 0; i < blobs.length; i++) {
    urls.push(await uploadStoryImageBlob(userId, blobs[i], `${label}-${i}`, visibility));
  }
  return urls;
}

export async function deleteStoryImage(imageUrl: string): Promise<void> {
  const loc = parseImageRef(imageUrl);
  if (!loc) return;
  const { error } = await supabase.storage.from(loc.bucket).remove([loc.path]);
  if (error) throw error;
}

export async function deleteStoryImages(imageUrls: string[]): Promise<void> {
  const byBucket: Record<string, string[]> = {};
  for (const url of imageUrls) {
    const loc = parseImageRef(url);
    if (!loc) continue;
    byBucket[loc.bucket] ??= [];
    byBucket[loc.bucket].push(loc.path);
  }
  await Promise.all(
    Object.entries(byBucket).map(([bucket, paths]) =>
      supabase.storage.from(bucket).remove(paths),
    ),
  );
}

/** Copy a draft image into the public bucket; returns stable public URL. */
export async function promoteImageToPublic(userId: string, imageUrl: string): Promise<string> {
  const loc = parseImageRef(imageUrl);
  if (!loc) return imageUrl;
  if (loc.bucket === PUBLIC_BUCKET && !loc.path.startsWith('drafts/')) {
    return imageUrl.startsWith('http')
      ? imageUrl
      : supabase.storage.from(loc.bucket).getPublicUrl(loc.path).data.publicUrl;
  }

  const { data: blob, error: downloadError } = await supabase.storage
    .from(loc.bucket)
    .download(loc.path);
  if (downloadError || !blob) throw downloadError ?? new Error('Could not read draft image.');

  const suffix = loc.path.split('/').pop()?.replace(/\.\w+$/, '') ?? 'img';
  return uploadStoryImageBlob(userId, blob, `pub-${suffix}`, 'published');
}
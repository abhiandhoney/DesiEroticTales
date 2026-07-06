import { supabase } from './supabase';

const BUCKET = 'story-images';

export function getStoragePathFromUrl(imageUrl: string): string | null {
  const marker = `/${BUCKET}/`;
  const idx = imageUrl.indexOf(marker);
  if (idx === -1) return null;
  return imageUrl.slice(idx + marker.length);
}

export async function uploadStoryImage(userId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const filePath = `${userId}/${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(filePath, file);
  if (uploadError) throw uploadError;
  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  return urlData.publicUrl;
}

export async function deleteStoryImage(imageUrl: string): Promise<void> {
  const path = getStoragePathFromUrl(imageUrl);
  if (!path) return;
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw error;
}
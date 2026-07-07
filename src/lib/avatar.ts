import { convertFileToWebP } from './imageProcessing';
import { deleteStoryImage, uploadStoryImageBlob } from './storyImages';

const AVATAR_MAX_DIMENSION = 512;

export async function uploadAvatarBlob(userId: string, blob: Blob): Promise<string> {
  return uploadStoryImageBlob(userId, blob, 'avatar');
}

export async function processAndUploadAvatar(userId: string, file: File): Promise<string> {
  const blob = await convertFileToWebP(file, AVATAR_MAX_DIMENSION);
  return uploadAvatarBlob(userId, blob);
}

export async function removeAvatar(avatarUrl: string): Promise<void> {
  await deleteStoryImage(avatarUrl);
}
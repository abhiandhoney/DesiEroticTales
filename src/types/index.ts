export type UserRole = 'writer' | 'admin';

export type StoryStatus = 'pending' | 'approved' | 'rejected';

export interface Profile {
  id: string;
  username: string | null;
  role: UserRole;
  created_at: string;
}

export interface Story {
  id: string;
  title: string;
  content: string;
  category: string;
  status: StoryStatus;
  user_id: string;
  image_url: string | null;
  views: number;
  created_at: string;
}

export const STORY_CATEGORIES = [
  'Aunty',
  'Akka-Chelli',
  'Friend',
  'Office',
  'Fantasy',
  'Neighbor',
  'Cousin',
  'College',
  'MILF',
  'Other',
] as const;

export type StoryCategory = (typeof STORY_CATEGORIES)[number];
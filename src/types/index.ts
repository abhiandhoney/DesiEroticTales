export type UserRole = 'writer' | 'admin';
export type StoryStatus = 'draft' | 'pending' | 'approved' | 'rejected';
export type StoryReaction = 'like' | 'dislike';

export interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  role: UserRole;
  onboarding_complete: boolean;
  username_changed_at: string | null;
  created_at: string;
}

export const TEASER_MAX_LENGTH = 250;
export const BIO_MAX_LENGTH = 500;

export interface Story {
  id: string;
  title: string;
  teaser: string | null;
  content: string;
  content_json: Record<string, unknown> | null;
  content_html: string | null;
  category: string;
  status: StoryStatus;
  user_id: string;
  image_url: string | null;
  card_image_url: string | null;
  gallery_urls: string[] | null;
  views: number;
  like_count: number;
  dislike_count: number;
  is_editors_choice: boolean;
  editors_choice_at: string | null;
  slug: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string | null;
}

export const STORY_CATEGORIES = [
  'Aunty',
  'Akka-Chelli',
  'Amma-Koduku',
  'Friend',
  'Office',
  'Fantasy',
  'Neighbor',
  'Cousin',
  'College',
  'MILF',
  'Pakkinti Valu',
  'Panimanishi',
  'Pinni-Pedhamma',
  'Maradhalu',
  'Vadhina',
  'Gumpu',
  'Yavannam',
  'Audio',
  'Photos',
  'Other',
] as const;

export type StoryCategory = (typeof STORY_CATEGORIES)[number];

export interface Collection {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  description: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface CollectionStory {
  collection_id: string;
  story_id: string;
  part_number: number;
}
-- Add teaser column to stories table
-- Run in Supabase SQL Editor if migration 001 was already applied

ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS teaser TEXT;

COMMENT ON COLUMN public.stories.teaser IS 'Short description for listings (max 250 chars, optional)';
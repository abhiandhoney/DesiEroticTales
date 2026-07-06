-- Add gallery support for multiple story images (cover + gallery)
ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS gallery_urls JSONB NOT NULL DEFAULT '[]'::jsonb;
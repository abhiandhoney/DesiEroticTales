-- Separate card crop (16:9) from full cover image for story reading

ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS card_image_url TEXT;

COMMENT ON COLUMN public.stories.image_url IS 'Full cover image for story reading view';
COMMENT ON COLUMN public.stories.card_image_url IS 'Cropped 16:9 cover for story cards and home featured';

UPDATE public.stories
SET card_image_url = image_url
WHERE card_image_url IS NULL AND image_url IS NOT NULL;
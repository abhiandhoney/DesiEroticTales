-- Private draft image bucket + session-deduped view counting.

-- 1. Private bucket for draft / unpublished uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'story-images-draft',
  'story-images-draft',
  false,
  5242880,
  ARRAY['image/webp', 'image/jpeg', 'image/png']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/webp', 'image/jpeg', 'image/png']::text[];

-- Draft bucket: owner folder only
CREATE POLICY "Draft bucket owner insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'story-images-draft'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Draft bucket owner select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'story-images-draft'
    AND auth.role() = 'authenticated'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_admin_user()
    )
  );

CREATE POLICY "Draft bucket owner update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'story-images-draft'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Draft bucket owner delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'story-images-draft'
    AND auth.role() = 'authenticated'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_admin_user()
    )
  );

-- Published bucket: restrict public SELECT to non-draft paths (owner/admin can read drafts/ prefix)
DROP POLICY IF EXISTS "Public can view story images" ON storage.objects;

CREATE POLICY "Public can view published story images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'story-images'
    AND (storage.foldername(name))[1] IS DISTINCT FROM 'drafts'
  );

CREATE POLICY "Owners can view own draft folder in public bucket"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'story-images'
    AND (storage.foldername(name))[1] = 'drafts'
    AND (storage.foldername(name))[2] = auth.uid()::text
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Admins can view all story images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'story-images'
    AND public.is_admin_user()
  );

-- Legacy upload policy: allow drafts/ prefix
DROP POLICY IF EXISTS "Users can upload to own folder" ON storage.objects;
CREATE POLICY "Users can upload to own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'story-images'
    AND auth.role() = 'authenticated'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR (
        (storage.foldername(name))[1] = 'drafts'
        AND (storage.foldername(name))[2] = auth.uid()::text
      )
    )
  );

-- 2. View deduplication (one counted view per story per viewer per day)
CREATE TABLE IF NOT EXISTS public.story_view_events (
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  viewer_hash TEXT NOT NULL,
  viewed_on DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (story_id, viewer_hash, viewed_on)
);

CREATE INDEX IF NOT EXISTS idx_story_view_events_story_day
  ON public.story_view_events (story_id, viewed_on);

ALTER TABLE public.story_view_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No direct client access to view events"
  ON public.story_view_events FOR ALL
  USING (false);

CREATE OR REPLACE FUNCTION public.increment_story_views(
  story_id UUID,
  viewer_hash TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rows_affected INTEGER;
BEGIN
  IF viewer_hash IS NULL OR length(trim(viewer_hash)) < 8 OR length(viewer_hash) > 128 THEN
    RETURN;
  END IF;

  INSERT INTO public.story_view_events (story_id, viewer_hash, viewed_on)
  VALUES (story_id, trim(viewer_hash), CURRENT_DATE)
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS rows_affected = ROW_COUNT;

  IF rows_affected > 0 THEN
    UPDATE public.stories
    SET views = views + 1
    WHERE id = story_id AND status = 'approved';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_story_views(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_story_views(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_story_views(UUID, TEXT) TO anon;
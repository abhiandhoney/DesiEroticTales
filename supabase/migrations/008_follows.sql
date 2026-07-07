-- Phase F: Follow writers

CREATE TABLE IF NOT EXISTS public.writer_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (follower_id, following_id),
  CHECK (follower_id <> following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.writer_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.writer_follows(following_id);

ALTER TABLE public.writer_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read follows"
  ON public.writer_follows FOR SELECT
  USING (true);

CREATE POLICY "Users can follow writers"
  ON public.writer_follows FOR INSERT
  WITH CHECK (
    auth.uid() = follower_id
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = following_id
        AND p.onboarding_complete = true
        AND p.username IS NOT NULL
    )
  );

CREATE POLICY "Users can unfollow"
  ON public.writer_follows FOR DELETE
  USING (auth.uid() = follower_id);
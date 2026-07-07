-- Phase C: Story likes / dislikes

ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS like_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dislike_count INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.story_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction TEXT NOT NULL CHECK (reaction IN ('like', 'dislike')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (story_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_reactions_story ON public.story_reactions(story_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user ON public.story_reactions(user_id);

ALTER TABLE public.story_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read reactions"
  ON public.story_reactions FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own reactions on others stories"
  ON public.story_reactions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.stories s
      WHERE s.id = story_id
        AND s.status = 'approved'
        AND s.user_id <> auth.uid()
    )
  );

CREATE POLICY "Users can update own reactions"
  ON public.story_reactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reactions"
  ON public.story_reactions FOR DELETE
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.sync_story_reaction_counts()
RETURNS TRIGGER AS $$
DECLARE
  target_story UUID;
BEGIN
  target_story := COALESCE(NEW.story_id, OLD.story_id);

  UPDATE public.stories SET
    like_count = (SELECT count(*)::int FROM public.story_reactions WHERE story_id = target_story AND reaction = 'like'),
    dislike_count = (SELECT count(*)::int FROM public.story_reactions WHERE story_id = target_story AND reaction = 'dislike')
  WHERE id = target_story;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS story_reactions_count_sync ON public.story_reactions;
CREATE TRIGGER story_reactions_count_sync
  AFTER INSERT OR UPDATE OR DELETE ON public.story_reactions
  FOR EACH ROW EXECUTE FUNCTION public.sync_story_reaction_counts();
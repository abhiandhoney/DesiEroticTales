-- Tighten writer edit permissions + track story updates

ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

UPDATE public.stories SET updated_at = created_at WHERE updated_at IS NULL;

CREATE OR REPLACE FUNCTION public.set_story_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS stories_set_updated_at ON public.stories;
CREATE TRIGGER stories_set_updated_at
  BEFORE UPDATE ON public.stories
  FOR EACH ROW EXECUTE FUNCTION public.set_story_updated_at();

-- Writers may edit own pending or rejected stories (resubmit sets status back to pending)
DROP POLICY IF EXISTS "Writers can update own pending stories" ON public.stories;

CREATE POLICY "Writers can update own pending or rejected stories"
  ON public.stories FOR UPDATE
  USING (auth.uid() = user_id AND status IN ('pending', 'rejected'))
  WITH CHECK (
    auth.uid() = user_id
    AND status IN ('pending', 'rejected')
  );


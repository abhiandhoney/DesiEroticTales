-- Query performance indexes and reaction privacy.

CREATE INDEX IF NOT EXISTS idx_stories_approved_created
  ON public.stories (created_at DESC)
  WHERE status = 'approved';

CREATE INDEX IF NOT EXISTS idx_stories_approved_likes
  ON public.stories (like_count DESC, created_at DESC)
  WHERE status = 'approved';

CREATE INDEX IF NOT EXISTS idx_stories_approved_editors_choice
  ON public.stories (editors_choice_at DESC)
  WHERE status = 'approved' AND is_editors_choice = true;

CREATE INDEX IF NOT EXISTS idx_stories_approved_category
  ON public.stories (category, created_at DESC)
  WHERE status = 'approved';

-- Restrict reaction row visibility to owner (aggregates remain on stories).
DROP POLICY IF EXISTS "Anyone can read reactions" ON public.story_reactions;
CREATE POLICY "Users can read own reactions"
  ON public.story_reactions FOR SELECT
  USING (auth.uid() = user_id);
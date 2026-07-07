-- Phase D: Rankings & editor's choice

ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS is_editors_choice BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS editors_choice_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_stories_like_count ON public.stories(like_count DESC);
CREATE INDEX IF NOT EXISTS idx_stories_editors_choice ON public.stories(is_editors_choice) WHERE is_editors_choice = true;

CREATE OR REPLACE VIEW public.writer_leaderboard AS
SELECT
  p.id AS user_id,
  p.username,
  p.display_name,
  p.avatar_url,
  COUNT(s.id) FILTER (WHERE s.status = 'approved') AS story_count,
  COALESCE(SUM(s.like_count) FILTER (WHERE s.status = 'approved'), 0)::bigint AS total_likes,
  p.created_at AS member_since
FROM public.profiles p
LEFT JOIN public.stories s ON s.user_id = p.id
WHERE p.username IS NOT NULL AND p.onboarding_complete = true
GROUP BY p.id, p.username, p.display_name, p.avatar_url, p.created_at;

GRANT SELECT ON public.writer_leaderboard TO anon, authenticated;
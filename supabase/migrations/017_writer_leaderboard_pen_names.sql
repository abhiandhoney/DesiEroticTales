-- Unified writer leaderboard: real writers + pen-name author profiles.
-- Real writers only count stories posted under their own account (not pen names).
-- Must DROP first: CREATE OR REPLACE cannot rename/reorder view columns (42P16).

DROP VIEW IF EXISTS public.writer_leaderboard;

CREATE VIEW public.writer_leaderboard AS
SELECT
  p.id::text AS id,
  'writer'::text AS kind,
  p.id AS user_id,
  NULL::uuid AS author_profile_id,
  p.username AS slug,
  p.username,
  p.display_name,
  p.avatar_url,
  COUNT(s.id) FILTER (WHERE s.status = 'approved' AND s.author_profile_id IS NULL)::bigint AS story_count,
  COALESCE(SUM(s.like_count) FILTER (WHERE s.status = 'approved' AND s.author_profile_id IS NULL), 0)::bigint AS total_likes,
  p.created_at AS member_since,
  false AS is_pen_name
FROM public.profiles p
LEFT JOIN public.stories s ON s.user_id = p.id
WHERE p.username IS NOT NULL AND p.onboarding_complete = true
GROUP BY p.id, p.username, p.display_name, p.avatar_url, p.created_at

UNION ALL

SELECT
  ap.id::text AS id,
  'pen_name'::text AS kind,
  ap.created_by AS user_id,
  ap.id AS author_profile_id,
  ap.slug AS slug,
  ap.slug AS username,
  ap.name AS display_name,
  ap.avatar_url,
  COUNT(s.id) FILTER (WHERE s.status = 'approved')::bigint AS story_count,
  COALESCE(SUM(s.like_count) FILTER (WHERE s.status = 'approved'), 0)::bigint AS total_likes,
  ap.created_at AS member_since,
  true AS is_pen_name
FROM public.author_profiles ap
LEFT JOIN public.stories s ON s.author_profile_id = ap.id
GROUP BY ap.id, ap.created_by, ap.slug, ap.name, ap.avatar_url, ap.created_at
HAVING COUNT(s.id) FILTER (WHERE s.status = 'approved') > 0;

GRANT SELECT ON public.writer_leaderboard TO anon, authenticated;
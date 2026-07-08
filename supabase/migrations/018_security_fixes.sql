-- Security hardening: protect story metrics, lock reaction targets, harden view RPC.

-- 1. Prevent non-admins from tampering with ranking/metric columns.
CREATE OR REPLACE FUNCTION public.protect_story_metrics()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF public.is_admin_user() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.like_count := 0;
    NEW.dislike_count := 0;
    NEW.views := 0;
    NEW.is_editors_choice := false;
    NEW.editors_choice_at := NULL;
  ELSE
    NEW.like_count := OLD.like_count;
    NEW.dislike_count := OLD.dislike_count;
    NEW.views := OLD.views;
    NEW.is_editors_choice := OLD.is_editors_choice;
    NEW.editors_choice_at := OLD.editors_choice_at;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS stories_protect_metrics ON public.stories;
CREATE TRIGGER stories_protect_metrics
  BEFORE INSERT OR UPDATE ON public.stories
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_story_metrics();

-- 2. Lock story_reactions target columns on UPDATE.
CREATE OR REPLACE FUNCTION public.lock_reaction_target()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.story_id := OLD.story_id;
  NEW.user_id := OLD.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS story_reactions_lock_target ON public.story_reactions;
CREATE TRIGGER story_reactions_lock_target
  BEFORE UPDATE ON public.story_reactions
  FOR EACH ROW
  EXECUTE FUNCTION public.lock_reaction_target();

DROP POLICY IF EXISTS "Users can update own reactions" ON public.story_reactions;
CREATE POLICY "Users can update own reactions"
  ON public.story_reactions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND story_id = story_id);

-- 3. Harden increment_story_views.
CREATE OR REPLACE FUNCTION public.increment_story_views(story_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.stories
  SET views = views + 1
  WHERE id = story_id AND status = 'approved';
END;
$$;

REVOKE ALL ON FUNCTION public.increment_story_views(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_story_views(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_story_views(UUID) TO anon;

-- 4. Restrict writer DELETE to non-approved stories.
DROP POLICY IF EXISTS "Writers can delete own stories" ON public.stories;
CREATE POLICY "Writers can delete own stories"
  ON public.stories FOR DELETE
  USING (
    auth.uid() = user_id
    AND status IN ('draft', 'pending', 'rejected')
  );

-- 5. Add search_path to key SECURITY DEFINER functions (idempotent replace).
CREATE OR REPLACE FUNCTION public.is_username_available(p_username TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE lower(username) = lower(trim(p_username))
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.prevent_profile_self_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND NOT public.is_admin_user() THEN
    NEW.role := OLD.role;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_story_reaction_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_story_id UUID;
BEGIN
  target_story_id := COALESCE(NEW.story_id, OLD.story_id);

  UPDATE public.stories
  SET
    like_count = (SELECT COUNT(*) FROM public.story_reactions WHERE story_id = target_story_id AND reaction = 'like'),
    dislike_count = (SELECT COUNT(*) FROM public.story_reactions WHERE story_id = target_story_id AND reaction = 'dislike')
  WHERE id = target_story_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;
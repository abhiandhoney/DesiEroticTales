-- Fix infinite recursion between collections <-> collection_stories RLS policies.
-- Use SECURITY DEFINER helpers so policy checks do not re-enter RLS on the other table.

CREATE OR REPLACE FUNCTION public.is_collection_owner(p_collection_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.collections c
    WHERE c.id = p_collection_id AND c.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.collection_has_approved_story(p_collection_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.collection_stories cs
    JOIN public.stories s ON s.id = cs.story_id
    WHERE cs.collection_id = p_collection_id AND s.status = 'approved'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  );
$$;

-- collections
DROP POLICY IF EXISTS "Anyone can read collections with approved stories" ON public.collections;

CREATE POLICY "Read own or public collections"
  ON public.collections FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.collection_has_approved_story(id)
    OR public.is_admin_user()
  );

-- collection_stories
DROP POLICY IF EXISTS "Read collection story links for visible collections" ON public.collection_stories;
DROP POLICY IF EXISTS "Writers link own stories to own collections" ON public.collection_stories;
DROP POLICY IF EXISTS "Writers update own collection story links" ON public.collection_stories;
DROP POLICY IF EXISTS "Writers delete own collection story links" ON public.collection_stories;

CREATE POLICY "Read collection story links"
  ON public.collection_stories FOR SELECT
  USING (
    public.is_collection_owner(collection_id)
    OR EXISTS (
      SELECT 1 FROM public.stories s
      WHERE s.id = collection_stories.story_id AND s.status = 'approved'
    )
    OR public.is_admin_user()
  );

CREATE POLICY "Writers link own stories to own collections"
  ON public.collection_stories FOR INSERT
  WITH CHECK (
    public.is_collection_owner(collection_id)
    AND EXISTS (
      SELECT 1 FROM public.stories s
      WHERE s.id = collection_stories.story_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Writers update own collection story links"
  ON public.collection_stories FOR UPDATE
  USING (public.is_collection_owner(collection_id))
  WITH CHECK (public.is_collection_owner(collection_id));

CREATE POLICY "Writers delete own collection story links"
  ON public.collection_stories FOR DELETE
  USING (public.is_collection_owner(collection_id));
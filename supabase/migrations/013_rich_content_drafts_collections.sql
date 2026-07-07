-- Rich content (TipTap JSON + HTML), drafts, and story collections/series

-- 1. Draft status + rich content columns
ALTER TABLE public.stories DROP CONSTRAINT IF EXISTS stories_status_check;
ALTER TABLE public.stories
  ADD CONSTRAINT stories_status_check
  CHECK (status IN ('draft', 'pending', 'approved', 'rejected'));

ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS content_json JSONB,
  ADD COLUMN IF NOT EXISTS content_html TEXT;

COMMENT ON COLUMN public.stories.content_json IS 'TipTap document JSON for editing';
COMMENT ON COLUMN public.stories.content_html IS 'Rendered HTML for display and SEO prerender';
COMMENT ON COLUMN public.stories.content IS 'Plain-text fallback and legacy stories';

-- 2. Collections (series / multi-part)
CREATE TABLE IF NOT EXISTS public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_collections_user_slug
  ON public.collections(user_id, slug);

CREATE INDEX IF NOT EXISTS idx_collections_user_id ON public.collections(user_id);

CREATE TABLE IF NOT EXISTS public.collection_stories (
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  part_number INTEGER NOT NULL CHECK (part_number > 0),
  PRIMARY KEY (story_id),
  UNIQUE (collection_id, part_number)
);

CREATE INDEX IF NOT EXISTS idx_collection_stories_collection
  ON public.collection_stories(collection_id, part_number);

-- updated_at trigger for collections
CREATE OR REPLACE FUNCTION public.set_collection_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS collections_set_updated_at ON public.collections;
CREATE TRIGGER collections_set_updated_at
  BEFORE UPDATE ON public.collections
  FOR EACH ROW EXECUTE FUNCTION public.set_collection_updated_at();

-- 3. RLS — stories: drafts
DROP POLICY IF EXISTS "Writers can insert own stories" ON public.stories;
CREATE POLICY "Writers can insert own stories"
  ON public.stories FOR INSERT
  WITH CHECK (auth.uid() = user_id AND status IN ('draft', 'pending'));

DROP POLICY IF EXISTS "Writers can update own pending or rejected stories" ON public.stories;
CREATE POLICY "Writers can update own draft pending or rejected stories"
  ON public.stories FOR UPDATE
  USING (auth.uid() = user_id AND status IN ('draft', 'pending', 'rejected'))
  WITH CHECK (auth.uid() = user_id AND status IN ('draft', 'pending', 'rejected'));

-- 4. RLS — collections
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read collections with approved stories"
  ON public.collections FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.collection_stories cs
      JOIN public.stories s ON s.id = cs.story_id
      WHERE cs.collection_id = collections.id AND s.status = 'approved'
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "Writers manage own collections"
  ON public.collections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Writers update own collections"
  ON public.collections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Writers delete own collections"
  ON public.collections FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Read collection story links for visible collections"
  ON public.collection_stories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.collections c
      WHERE c.id = collection_stories.collection_id
      AND (
        c.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.stories s
          WHERE s.id = collection_stories.story_id AND s.status = 'approved'
        )
        OR EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() AND p.role = 'admin'
        )
      )
    )
  );

CREATE POLICY "Writers link own stories to own collections"
  ON public.collection_stories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.collections c
      JOIN public.stories s ON s.id = collection_stories.story_id
      WHERE c.id = collection_stories.collection_id
        AND c.user_id = auth.uid()
        AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Writers update own collection story links"
  ON public.collection_stories FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.collections c
      WHERE c.id = collection_stories.collection_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Writers delete own collection story links"
  ON public.collection_stories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.collections c
      WHERE c.id = collection_stories.collection_id AND c.user_id = auth.uid()
    )
  );
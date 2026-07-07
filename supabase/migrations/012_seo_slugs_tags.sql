-- SEO: story slugs, tags, and slug generation

ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';

CREATE UNIQUE INDEX IF NOT EXISTS idx_stories_slug ON public.stories(slug) WHERE slug IS NOT NULL;

CREATE OR REPLACE FUNCTION public.slugify_story_title(t TEXT)
RETURNS TEXT AS $$
DECLARE
  s TEXT;
BEGIN
  s := lower(trim(coalesce(t, '')));
  s := regexp_replace(s, '[^a-z0-9]+', '-', 'g');
  s := trim(both '-' from s);
  IF s = '' THEN s := 'story'; END IF;
  RETURN left(s, 120);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.assign_story_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  candidate TEXT;
  n INT := 0;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.slug IS NOT NULL AND NEW.slug <> '' AND NEW.title = OLD.title THEN
    RETURN NEW;
  END IF;

  IF NEW.slug IS NOT NULL AND btrim(NEW.slug) <> '' THEN
    NEW.slug := left(regexp_replace(lower(btrim(NEW.slug)), '[^a-z0-9-]+', '-', 'g'), 120);
    NEW.slug := trim(both '-' from NEW.slug);
    RETURN NEW;
  END IF;

  base_slug := public.slugify_story_title(NEW.title);
  candidate := base_slug;

  WHILE EXISTS (
    SELECT 1 FROM public.stories s
    WHERE s.slug = candidate AND s.id IS DISTINCT FROM NEW.id
  ) LOOP
    n := n + 1;
    candidate := base_slug || '-' || n;
  END LOOP;

  NEW.slug := candidate;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS stories_assign_slug ON public.stories;
CREATE TRIGGER stories_assign_slug
  BEFORE INSERT OR UPDATE OF title, slug ON public.stories
  FOR EACH ROW EXECUTE FUNCTION public.assign_story_slug();

-- Backfill slugs for existing stories
UPDATE public.stories SET slug = NULL WHERE slug IS NULL OR btrim(slug) = '';
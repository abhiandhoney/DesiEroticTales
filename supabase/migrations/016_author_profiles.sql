-- Admin pen-name author profiles for story attribution

CREATE TABLE IF NOT EXISTS public.author_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(trim(name)) >= 2),
  slug TEXT NOT NULL CHECK (char_length(trim(slug)) >= 3),
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_author_profiles_slug_lower
  ON public.author_profiles (lower(slug));

CREATE INDEX IF NOT EXISTS idx_author_profiles_created_by
  ON public.author_profiles (created_by);

CREATE OR REPLACE FUNCTION public.set_author_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS author_profiles_set_updated_at ON public.author_profiles;
CREATE TRIGGER author_profiles_set_updated_at
  BEFORE UPDATE ON public.author_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_author_profile_updated_at();

ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS author_profile_id UUID REFERENCES public.author_profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_stories_author_profile_id
  ON public.stories (author_profile_id)
  WHERE author_profile_id IS NOT NULL;

-- Non-admins cannot assign or change pen names on stories
CREATE OR REPLACE FUNCTION public.protect_story_author_profile()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NOT public.is_admin_user() AND NEW.author_profile_id IS NOT NULL THEN
      NEW.author_profile_id := NULL;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NOT public.is_admin_user() THEN
      NEW.author_profile_id := OLD.author_profile_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS stories_protect_author_profile ON public.stories;
CREATE TRIGGER stories_protect_author_profile
  BEFORE INSERT OR UPDATE ON public.stories
  FOR EACH ROW EXECUTE FUNCTION public.protect_story_author_profile();

ALTER TABLE public.author_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read author profiles"
  ON public.author_profiles FOR SELECT
  USING (true);

CREATE POLICY "Admins insert author profiles"
  ON public.author_profiles FOR INSERT
  WITH CHECK (public.is_admin_user() AND auth.uid() = created_by);

CREATE POLICY "Admins update author profiles"
  ON public.author_profiles FOR UPDATE
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

CREATE POLICY "Admins delete author profiles"
  ON public.author_profiles FOR DELETE
  USING (public.is_admin_user());
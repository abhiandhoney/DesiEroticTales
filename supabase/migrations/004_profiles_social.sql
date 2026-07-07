-- Phase B: Profile social fields + username onboarding

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS username_changed_at TIMESTAMPTZ;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_bio_length;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_bio_length CHECK (bio IS NULL OR char_length(bio) <= 500);

-- Case-insensitive unique username (allow multiple NULLs)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_idx
  ON public.profiles (lower(username))
  WHERE username IS NOT NULL;

-- Existing users with a username: mark onboarding complete
UPDATE public.profiles
SET onboarding_complete = true
WHERE username IS NOT NULL AND trim(username) <> '';

-- New signups: no auto-username — user must pick on onboarding
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, role, onboarding_complete)
  VALUES (NEW.id, NULL, 'writer', false);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check username availability (case-insensitive)
CREATE OR REPLACE FUNCTION public.is_username_available(check_name TEXT, for_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
  IF check_name IS NULL OR length(trim(check_name)) < 3 THEN
    RETURN false;
  END IF;
  RETURN NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE lower(username) = lower(trim(check_name))
      AND (for_user_id IS NULL OR id <> for_user_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.is_username_available(TEXT, UUID) TO authenticated;
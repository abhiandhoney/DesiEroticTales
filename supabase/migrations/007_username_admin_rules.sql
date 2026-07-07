-- Block usernames containing "admin" except exact "admin" for the site owner email.
-- Keep in sync with VITE_ADMIN_EMAIL in .env / Cloudflare build vars.

CREATE OR REPLACE FUNCTION public.is_username_available(check_name TEXT, for_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
  normalized TEXT := lower(trim(check_name));
  user_email TEXT;
  -- Must match VITE_ADMIN_EMAIL (abhi.and.honey@gmail.com)
  admin_owner_email TEXT := 'abhi.and.honey@gmail.com';
BEGIN
  IF normalized IS NULL OR length(normalized) < 3 THEN
    RETURN false;
  END IF;

  IF normalized LIKE '%admin%' THEN
    IF normalized <> 'admin' THEN
      RETURN false;
    END IF;
    IF for_user_id IS NULL THEN
      RETURN false;
    END IF;
    SELECT lower(email) INTO user_email FROM auth.users WHERE id = for_user_id;
    IF user_email IS DISTINCT FROM admin_owner_email THEN
      RETURN false;
    END IF;
  END IF;

  RETURN NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE lower(username) = normalized
      AND (for_user_id IS NULL OR id <> for_user_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Prevent users from self-promoting to admin via profiles UPDATE

CREATE OR REPLACE FUNCTION public.prevent_profile_self_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.uid() = NEW.id AND NEW.role IS DISTINCT FROM OLD.role THEN
    NEW.role := OLD.role;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS profiles_prevent_self_role_escalation ON public.profiles;
CREATE TRIGGER profiles_prevent_self_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_self_role_escalation();

-- Storage: users may only upload into their own folder
DROP POLICY IF EXISTS "Authenticated users can upload story images" ON storage.objects;

CREATE POLICY "Users can upload to own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'story-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
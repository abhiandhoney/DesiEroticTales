-- Story deletion: writers delete own stories; admins delete any story.
-- Admin storage delete so moderators can remove orphaned images.

CREATE POLICY "Writers can delete own stories"
  ON public.stories FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any story"
  ON public.stories FOR DELETE
  USING (public.is_admin_user());

CREATE POLICY "Admins can delete story images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'story-images'
    AND public.is_admin_user()
  );

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own course files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own course files" ON storage.objects;

-- Recreate avatars policies with proper scoping
CREATE POLICY "Public can view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Course-files policies
CREATE POLICY "Users can view their own course files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'course-files' AND
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    public.get_current_user_role() IN ('teacher', 'admin')
  )
);

CREATE POLICY "Users can upload their own course files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'course-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

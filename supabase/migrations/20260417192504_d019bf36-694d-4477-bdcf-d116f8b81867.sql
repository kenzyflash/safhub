
-- 1. Fix lesson-materials storage: require enrollment
DROP POLICY IF EXISTS "Enrolled students can read lesson materials" ON storage.objects;
DROP POLICY IF EXISTS "Enrolled students can view lesson materials" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read lesson materials" ON storage.objects;

CREATE POLICY "Enrolled users can read lesson materials"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'lesson-materials' AND (
    public.get_current_user_role() IN ('admin', 'teacher')
    OR EXISTS (
      SELECT 1 FROM public.course_enrollments ce
      WHERE ce.user_id = auth.uid()
        AND ce.course_id::text = (storage.foldername(name))[1]
    )
  )
);

-- 2. Lock down user_roles: only admins can INSERT/UPDATE/DELETE
CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 3. Remove anon access to lessons (video_url leak)
DROP POLICY IF EXISTS "Anyone can view lesson metadata" ON public.lessons;

-- 4. Restrict course-files uploads
DROP POLICY IF EXISTS "Authenticated users can upload course files" ON storage.objects;

CREATE POLICY "Teachers can upload course files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'course-files'
  AND public.get_current_user_role() IN ('teacher', 'admin')
);

-- 5. Restrict public bucket listing - drop overly broad SELECT then re-add scoped
DROP POLICY IF EXISTS "Public bucket access" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view files" ON storage.objects;
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read" ON storage.objects;

-- Ensure scoped SELECT policies exist for public buckets (read individual objects)
DROP POLICY IF EXISTS "Public can read avatars" ON storage.objects;
CREATE POLICY "Public can read avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Public can read course thumbnails" ON storage.objects;
CREATE POLICY "Public can read course thumbnails"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-thumbnails');

DROP POLICY IF EXISTS "Enrolled users can read lesson videos" ON storage.objects;
CREATE POLICY "Enrolled users can read lesson videos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'lesson-videos' AND (
    public.get_current_user_role() IN ('admin', 'teacher')
    OR EXISTS (
      SELECT 1 FROM public.course_enrollments ce
      WHERE ce.user_id = auth.uid()
        AND ce.course_id::text = (storage.foldername(name))[1]
    )
  )
);

DROP POLICY IF EXISTS "Enrolled users can read course files" ON storage.objects;
CREATE POLICY "Enrolled users can read course files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'course-files' AND (
    public.get_current_user_role() IN ('admin', 'teacher')
    OR EXISTS (
      SELECT 1 FROM public.course_enrollments ce
      WHERE ce.user_id = auth.uid()
        AND ce.course_id::text = (storage.foldername(name))[1]
    )
  )
);

-- Make lesson-videos bucket private (was public, allowing direct URL access bypass)
UPDATE storage.buckets SET public = false WHERE id = 'lesson-videos';

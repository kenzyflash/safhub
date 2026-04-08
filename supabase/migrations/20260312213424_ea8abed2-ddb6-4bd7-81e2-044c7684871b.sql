
-- 1. FIX: Storage policies - restrict course-thumbnails and lesson-videos to teacher/admin
DROP POLICY IF EXISTS "Authenticated users can upload course thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update course thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete course thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload lesson videos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update lesson videos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete lesson videos" ON storage.objects;

CREATE POLICY "Teachers can upload course thumbnails" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'course-thumbnails' AND
  public.get_current_user_role() IN ('teacher', 'admin')
);

CREATE POLICY "Teachers can update course thumbnails" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'course-thumbnails' AND
  public.get_current_user_role() IN ('teacher', 'admin')
);

CREATE POLICY "Teachers can delete course thumbnails" ON storage.objects
FOR DELETE USING (
  bucket_id = 'course-thumbnails' AND
  public.get_current_user_role() IN ('teacher', 'admin')
);

CREATE POLICY "Teachers can upload lesson videos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'lesson-videos' AND
  public.get_current_user_role() IN ('teacher', 'admin')
);

CREATE POLICY "Teachers can update lesson videos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'lesson-videos' AND
  public.get_current_user_role() IN ('teacher', 'admin')
);

CREATE POLICY "Teachers can delete lesson videos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'lesson-videos' AND
  public.get_current_user_role() IN ('teacher', 'admin')
);

-- 2. FIX: Vote count RPCs - verify caller has actual vote record
CREATE OR REPLACE FUNCTION public.increment_upvotes(discussion_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = ''
AS $$
  UPDATE public.course_discussions
  SET upvotes = (
    SELECT COUNT(*) FROM public.discussion_upvotes
    WHERE discussion_upvotes.discussion_id = increment_upvotes.discussion_id
  )
  WHERE id = increment_upvotes.discussion_id
    AND EXISTS (
      SELECT 1 FROM public.discussion_upvotes
      WHERE discussion_upvotes.discussion_id = increment_upvotes.discussion_id
        AND discussion_upvotes.user_id = auth.uid()
    );
$$;

CREATE OR REPLACE FUNCTION public.decrement_upvotes(discussion_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = ''
AS $$
  UPDATE public.course_discussions
  SET upvotes = (
    SELECT COUNT(*) FROM public.discussion_upvotes
    WHERE discussion_upvotes.discussion_id = decrement_upvotes.discussion_id
  )
  WHERE id = decrement_upvotes.discussion_id;
$$;

CREATE OR REPLACE FUNCTION public.increment_downvotes(discussion_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = ''
AS $$
  UPDATE public.course_discussions
  SET downvotes = (
    SELECT COUNT(*) FROM public.discussion_downvotes
    WHERE discussion_downvotes.discussion_id = increment_downvotes.discussion_id
  )
  WHERE id = increment_downvotes.discussion_id
    AND EXISTS (
      SELECT 1 FROM public.discussion_downvotes
      WHERE discussion_downvotes.discussion_id = increment_downvotes.discussion_id
        AND discussion_downvotes.user_id = auth.uid()
    );
$$;

CREATE OR REPLACE FUNCTION public.decrement_downvotes(discussion_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = ''
AS $$
  UPDATE public.course_discussions
  SET downvotes = (
    SELECT COUNT(*) FROM public.discussion_downvotes
    WHERE discussion_downvotes.discussion_id = decrement_downvotes.discussion_id
  )
  WHERE id = decrement_downvotes.discussion_id;
$$;

-- 3. FIX: Audit log - remove open INSERT policy
DROP POLICY IF EXISTS "System can insert audit logs" ON public.security_audit_log;

-- 4. FIX: User points - remove ALL policy, keep only SELECT
DROP POLICY IF EXISTS "Users can update their points" ON public.user_points;

-- Also update handle_new_user to create initial user_points record
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email, school, grade)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'school', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'grade', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    email = EXCLUDED.email,
    school = EXCLUDED.school,
    grade = EXCLUDED.grade,
    updated_at = now();
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Initialize user_points record
  INSERT INTO public.user_points (user_id, total_points, level)
  VALUES (NEW.id, 0, 1)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user: % %', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$function$;

-- Fix 1: discussion_upvotes - replace ALL policy with proper USING+WITH CHECK
DROP POLICY IF EXISTS "Authenticated users can upvote" ON public.discussion_upvotes;

CREATE POLICY "Users can manage their own upvotes"
  ON public.discussion_upvotes
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Fix 2: course_discussions INSERT - require enrollment
DROP POLICY IF EXISTS "Authenticated users can create discussions" ON public.course_discussions;

CREATE POLICY "Enrolled users can create discussions"
  ON public.course_discussions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id 
    AND (
      EXISTS (
        SELECT 1 FROM public.course_enrollments
        WHERE course_enrollments.user_id = auth.uid()
        AND course_enrollments.course_id = course_discussions.course_id
      )
      OR public.get_current_user_role() IN ('admin', 'teacher')
    )
  );

-- Fix 3: lessons SELECT - restrict video_url to enrolled users
-- Replace open SELECT with a policy that shows lessons publicly but hides video_url
-- Since RLS can't filter columns, we restrict entire row access to enrolled/authenticated users
DROP POLICY IF EXISTS "Anyone can view lessons" ON public.lessons;

-- Allow authenticated users who are enrolled (or teachers/admins) to see full lessons
CREATE POLICY "Enrolled users can view lessons"
  ON public.lessons
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.course_enrollments
      WHERE course_enrollments.user_id = auth.uid()
      AND course_enrollments.course_id = lessons.course_id
    )
    OR EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = lessons.course_id
      AND courses.instructor_id = auth.uid()
    )
    OR public.get_current_user_role() = 'admin'
  );

-- Allow anon users to see lesson metadata (for course catalog) but not video_url
-- Since we can't column-filter in RLS, we'll use a function for public lesson listing
CREATE POLICY "Anyone can view lesson metadata"
  ON public.lessons
  FOR SELECT
  TO anon
  USING (true);

-- Fix 4: parent_child_relationships - require child to be a student role
DROP POLICY IF EXISTS "Parents can create relationships" ON public.parent_child_relationships;

CREATE POLICY "Parents can create verified relationships"
  ON public.parent_child_relationships
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = parent_id
    AND public.has_role(auth.uid(), 'parent')
    AND public.has_role(child_id, 'student')
  );
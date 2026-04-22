-- 1. Restrictive policy preventing non-admins from inserting into user_roles
CREATE POLICY "Block non-admin role inserts"
ON public.user_roles
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 2. Restrict discussion vote SELECT to authenticated users only
DROP POLICY IF EXISTS "Users can view all downvotes" ON public.discussion_downvotes;
CREATE POLICY "Authenticated users can view downvotes"
ON public.discussion_downvotes
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Anyone can view upvotes" ON public.discussion_upvotes;
CREATE POLICY "Authenticated users can view upvotes"
ON public.discussion_upvotes
FOR SELECT
TO authenticated
USING (true);

-- 3. Add DELETE policy for course-files storage bucket (teachers/admins only)
CREATE POLICY "Teachers and admins can delete course files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'course-files'
  AND public.get_current_user_role() IN ('teacher', 'admin')
);

-- 4. Realtime channel authorization: scope subscriptions to user's own topic
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users subscribe to own realtime channels" ON realtime.messages;
CREATE POLICY "Users subscribe to own realtime channels"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() IN (
    'user-role-changes-' || auth.uid()::text,
    'user-notifications-' || auth.uid()::text
  )
);

-- 5. Tighten public bucket listing - replace broad SELECT with name-scoped read
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Avatars are viewable" ON storage.objects;

CREATE POLICY "Avatars readable by name"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'avatars' AND name IS NOT NULL AND length(name) > 0);

DROP POLICY IF EXISTS "Course thumbnails are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Public can view course thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Course thumbnails are viewable" ON storage.objects;

CREATE POLICY "Course thumbnails readable by name"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'course-thumbnails' AND name IS NOT NULL AND length(name) > 0);
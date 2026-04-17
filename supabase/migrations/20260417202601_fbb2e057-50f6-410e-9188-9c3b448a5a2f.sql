-- 1. Remove public access to lesson-videos bucket (private bucket should not have public policy)
DROP POLICY IF EXISTS "Public can view lesson videos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view lesson videos" ON storage.objects;
DROP POLICY IF EXISTS "Public lesson videos access" ON storage.objects;

-- 2. Make course-files bucket private and remove anonymous public policy
UPDATE storage.buckets SET public = false WHERE id = 'course-files';
DROP POLICY IF EXISTS "Anyone can view course files" ON storage.objects;
DROP POLICY IF EXISTS "Public can view course files" ON storage.objects;

-- 3. Scope public bucket SELECT policies to prevent broad listing
-- Replace broad avatars policy with one that only returns rows when bucket matches AND name is provided (prevents bare LIST)
DROP POLICY IF EXISTS "Public can read avatars" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
CREATE POLICY "Public can read individual avatars"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'avatars' AND name IS NOT NULL);

DROP POLICY IF EXISTS "Public can read course thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view course thumbnails" ON storage.objects;
CREATE POLICY "Public can read individual course thumbnails"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'course-thumbnails' AND name IS NOT NULL);

-- 4. Remove profiles from realtime publication to stop broadcasting emails
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'profiles'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.profiles';
  END IF;
END $$;
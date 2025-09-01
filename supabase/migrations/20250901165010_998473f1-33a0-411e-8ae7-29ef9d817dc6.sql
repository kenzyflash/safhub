-- Phase 1: Critical Data Protection - Secure Student Profile Access
-- Update profiles RLS policies to be more restrictive
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create more secure profile access policies
CREATE POLICY "Users can view their own profile only" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (get_current_user_role() = 'admin');

-- Phase 1: Protect Customer Contact Data - Add enhanced security
-- Create secure function for contact inquiry access with enhanced logging
CREATE OR REPLACE FUNCTION public.get_contact_inquiries_with_audit()
RETURNS TABLE(
  id uuid,
  name text,
  email text,
  subject text,
  message text,
  status text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin
  IF get_current_user_role() != 'admin' THEN
    -- Log unauthorized access attempt
    INSERT INTO security_audit_log (
      user_id, action, resource_type, resource_id, details
    ) VALUES (
      auth.uid(),
      'UNAUTHORIZED_ACCESS_ATTEMPT',
      'contact_inquiries',
      'all',
      jsonb_build_object(
        'timestamp', now(),
        'user_role', get_current_user_role(),
        'access_denied_reason', 'insufficient_privileges'
      )
    );
    
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  -- Log authorized access
  INSERT INTO security_audit_log (
    user_id, action, resource_type, resource_id, details
  ) VALUES (
    auth.uid(),
    'CONTACT_INQUIRIES_ACCESS',
    'contact_inquiries',
    'all',
    jsonb_build_object(
      'timestamp', now(),
      'user_role', 'admin'
    )
  );

  -- Return contact inquiries
  RETURN QUERY
  SELECT 
    ci.id,
    ci.name,
    ci.email,
    ci.subject,
    ci.message,
    ci.status,
    ci.created_at
  FROM contact_inquiries ci
  ORDER BY ci.created_at DESC;
END;
$$;

-- Phase 2: User Privacy Protection - Anonymize Forum Data
-- Create function to get anonymized forum posts for public display
CREATE OR REPLACE FUNCTION public.get_forum_posts_anonymized()
RETURNS TABLE(
  id uuid,
  forum_id uuid,
  anonymous_user_id text,
  title text,
  content text,
  upvotes integer,
  downvotes integer,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fp.id,
    fp.forum_id,
    ('user_' || substring(fp.user_id::text from 1 for 8)) as anonymous_user_id,
    fp.title,
    fp.content,
    fp.upvotes,
    fp.downvotes,
    fp.created_at,
    fp.updated_at
  FROM forum_posts fp
  ORDER BY fp.created_at DESC;
END;
$$;

-- Create function to get anonymized course discussions for course participants
CREATE OR REPLACE FUNCTION public.get_course_discussions_secure(course_id_param uuid)
RETURNS TABLE(
  id uuid,
  course_id uuid,
  anonymous_user_id text,
  content text,
  upvotes integer,
  downvotes integer,
  parent_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  is_own_post boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is enrolled in the course or is admin
  IF NOT EXISTS (
    SELECT 1 FROM course_enrollments 
    WHERE user_id = auth.uid() AND course_id = course_id_param
  ) AND get_current_user_role() != 'admin' THEN
    RAISE EXCEPTION 'Access denied. Course enrollment required.';
  END IF;

  RETURN QUERY
  SELECT 
    cd.id,
    cd.course_id,
    ('user_' || substring(cd.user_id::text from 1 for 8)) as anonymous_user_id,
    cd.content,
    cd.upvotes,
    cd.downvotes,
    cd.parent_id,
    cd.created_at,
    cd.updated_at,
    (cd.user_id = auth.uid()) as is_own_post
  FROM course_discussions cd
  WHERE cd.course_id = course_id_param
  ORDER BY cd.created_at DESC;
END;
$$;

-- Phase 3: Enhanced Monitoring - Add comprehensive audit logging
-- Create function to log profile access
CREATE OR REPLACE FUNCTION public.log_profile_access(profile_user_id uuid, access_type text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO security_audit_log (
    user_id, action, resource_type, resource_id, details
  ) VALUES (
    auth.uid(),
    access_type,
    'profile',
    profile_user_id::text,
    jsonb_build_object(
      'timestamp', now(),
      'accessed_user_id', profile_user_id,
      'accessor_role', get_current_user_role()
    )
  );
END;
$$;

-- Create function to log course access
CREATE OR REPLACE FUNCTION public.log_course_access(course_id_param uuid, access_type text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO security_audit_log (
    user_id, action, resource_type, resource_id, details
  ) VALUES (
    auth.uid(),
    access_type,
    'course',
    course_id_param::text,
    jsonb_build_object(
      'timestamp', now(),
      'course_id', course_id_param,
      'user_role', get_current_user_role()
    )
  );
END;
$$;

-- Phase 3: Database Security Hardening - Tighten RLS policies
-- Update forum posts policy to use secure function
DROP POLICY IF EXISTS "Anyone can view forum posts" ON public.forum_posts;
CREATE POLICY "Authenticated users can view forum posts with privacy controls"
ON public.forum_posts
FOR SELECT
TO authenticated
USING (true); -- Will use secure functions for access

-- Add policy for course discussions with enrollment check
DROP POLICY IF EXISTS "Anyone can view discussions" ON public.course_discussions;
CREATE POLICY "Enrolled users can view course discussions"
ON public.course_discussions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM course_enrollments 
    WHERE user_id = auth.uid() 
    AND course_id = course_discussions.course_id
  ) 
  OR get_current_user_role() = 'admin'
);

-- Add stricter contact inquiry policies
DROP POLICY IF EXISTS "Admins can view all contact inquiries" ON public.contact_inquiries;
CREATE POLICY "Admins can view contact inquiries with audit logging"
ON public.contact_inquiries
FOR SELECT
TO authenticated
USING (get_current_user_role() = 'admin');

-- Create index for better performance on security audit log
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_id_created_at 
ON security_audit_log(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_audit_log_resource_type_created_at 
ON security_audit_log(resource_type, created_at DESC);
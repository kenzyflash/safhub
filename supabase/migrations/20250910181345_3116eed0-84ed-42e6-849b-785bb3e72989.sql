-- Fix Profile Security Issues
-- Replace overly permissive admin access with granular permissions

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile only" ON public.profiles;

-- Create secure function for admin profile access with logging
CREATE OR REPLACE FUNCTION public.get_profiles_for_admin_management()
RETURNS TABLE(id uuid, first_name text, last_name text, email text, school text, grade text, created_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if user is admin
  IF get_current_user_role() != 'admin' THEN
    -- Log unauthorized access attempt
    INSERT INTO security_audit_log (
      user_id, action, resource_type, resource_id, details
    ) VALUES (
      auth.uid(),
      'UNAUTHORIZED_PROFILE_ACCESS_ATTEMPT',
      'profiles',
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
    'ADMIN_PROFILE_ACCESS',
    'profiles',
    'all',
    jsonb_build_object(
      'timestamp', now(),
      'user_role', 'admin'
    )
  );

  -- Return profiles data
  RETURN QUERY
  SELECT 
    p.id,
    p.first_name,
    p.last_name,
    p.email,
    p.school,
    p.grade,
    p.created_at
  FROM profiles p
  ORDER BY p.created_at DESC;
END;
$$;

-- Create anonymized profile view for public contexts (forums, etc.)
CREATE OR REPLACE FUNCTION public.get_anonymized_profile(profile_id uuid)
RETURNS TABLE(display_name text, avatar_url text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (p.first_name || ' ' || LEFT(p.last_name, 1) || '.') as display_name,
    p.avatar_url
  FROM profiles p
  WHERE p.id = profile_id;
END;
$$;

-- Create new restrictive RLS policies
CREATE POLICY "Users can view their own profile only" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Create policy for specific admin functions only (no broad admin access)
CREATE POLICY "Admin can access profiles for user management only" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = id OR 
  (get_current_user_role() = 'admin' AND 
   current_setting('app.admin_context', true) = 'user_management')
);

-- Update get_all_users_with_roles function to use secure context
CREATE OR REPLACE FUNCTION public.get_all_users_with_roles()
RETURNS TABLE(id uuid, first_name text, last_name text, email text, school text, grade text, created_at timestamp with time zone, role text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Check if current user is admin
  IF public.get_current_user_role() != 'admin' THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;
  
  -- Set admin context for RLS policy
  PERFORM set_config('app.admin_context', 'user_management', true);
  
  -- Log the access
  INSERT INTO public.security_audit_log (
    user_id, action, resource_type, resource_id, details
  ) VALUES (
    auth.uid(),
    'ADMIN_USER_LIST_ACCESS',
    'profiles',
    'all',
    jsonb_build_object('timestamp', now())
  );
  
  RETURN QUERY
  SELECT 
    p.id,
    p.first_name,
    p.last_name,
    p.email,
    p.school,
    p.grade,
    p.created_at,
    COALESCE(ur.role::text, 'student') as role
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON p.id = ur.user_id
  ORDER BY p.created_at DESC;
  
  -- Clear admin context
  PERFORM set_config('app.admin_context', '', true);
END;
$$;
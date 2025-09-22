-- Enhanced security for profiles table with comprehensive audit logging

-- Drop existing policies that might be less secure
DROP POLICY IF EXISTS "Admin can access profiles for user management only" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile only" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Create more secure RLS policies with mandatory audit logging

-- Users can only view their own profile with audit logging
CREATE POLICY "Users can view own profile with audit" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  auth.uid() = id AND 
  (SELECT log_profile_access(id, 'PROFILE_VIEW_OWN') IS NOT NULL)
);

-- Users can only update their own profile with audit logging
CREATE POLICY "Users can update own profile with audit" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (
  auth.uid() = id AND 
  (SELECT log_profile_access(id, 'PROFILE_UPDATE_OWN') IS NOT NULL)
);

-- Users can only insert their own profile
CREATE POLICY "Users can insert own profile only" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = id);

-- Admins can view profiles only through secure functions (no direct SELECT)
-- This policy will never match for direct queries, forcing use of secure functions
CREATE POLICY "Block direct admin profile access" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  get_current_user_role() = 'admin' AND 
  current_setting('app.secure_admin_access', true) = 'profiles_authorized' AND
  (SELECT log_profile_access(id, 'ADMIN_PROFILE_VIEW') IS NOT NULL)
);

-- Admins can update profiles only through secure functions
CREATE POLICY "Admins can update through secure functions only" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (
  (auth.uid() = id) OR 
  (
    get_current_user_role() = 'admin' AND 
    current_setting('app.secure_admin_access', true) = 'profiles_update_authorized' AND
    (SELECT log_profile_access(id, 'ADMIN_PROFILE_UPDATE') IS NOT NULL)
  )
);

-- Create secure function for admin profile access with enhanced security
CREATE OR REPLACE FUNCTION public.get_profiles_for_admin_secure()
RETURNS TABLE(
  id uuid, 
  first_name text, 
  last_name text, 
  email text, 
  school text, 
  grade text, 
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_user_id uuid;
  access_timestamp timestamp with time zone;
BEGIN
  -- Get current user ID
  admin_user_id := auth.uid();
  access_timestamp := now();
  
  -- Strict admin role verification
  IF get_current_user_role() != 'admin' THEN
    -- Log unauthorized access attempt with detailed info
    INSERT INTO security_audit_log (
      user_id, action, resource_type, resource_id, details
    ) VALUES (
      admin_user_id,
      'UNAUTHORIZED_BULK_PROFILE_ACCESS_ATTEMPT',
      'profiles',
      'all',
      jsonb_build_object(
        'timestamp', access_timestamp,
        'user_role', get_current_user_role(),
        'access_denied_reason', 'insufficient_admin_privileges',
        'security_level', 'HIGH_RISK_ATTEMPT',
        'ip_address', current_setting('request.headers.x-forwarded-for', true)
      )
    );
    
    RAISE EXCEPTION 'SECURITY VIOLATION: Unauthorized access to student personal information. This incident has been logged.';
  END IF;

  -- Set secure admin access context
  PERFORM set_config('app.secure_admin_access', 'profiles_authorized', true);
  
  -- Log legitimate admin access with comprehensive details
  INSERT INTO security_audit_log (
    user_id, action, resource_type, resource_id, details
  ) VALUES (
    admin_user_id,
    'ADMIN_BULK_PROFILE_ACCESS_AUTHORIZED',
    'profiles',
    'all',
    jsonb_build_object(
      'timestamp', access_timestamp,
      'admin_user_id', admin_user_id,
      'access_type', 'secure_function',
      'security_context', 'profiles_management',
      'session_info', jsonb_build_object(
        'user_agent', current_setting('request.headers.user-agent', true),
        'ip_address', current_setting('request.headers.x-forwarded-for', true)
      )
    )
  );

  -- Return profiles data with audit trail
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
  
  -- Clear secure context after use
  PERFORM set_config('app.secure_admin_access', '', true);
  
  -- Log successful completion
  INSERT INTO security_audit_log (
    user_id, action, resource_type, resource_id, details
  ) VALUES (
    admin_user_id,
    'ADMIN_PROFILE_ACCESS_COMPLETED',
    'profiles',
    'all',
    jsonb_build_object(
      'timestamp', now(),
      'records_accessed', (SELECT COUNT(*) FROM profiles),
      'access_duration_ms', EXTRACT(EPOCH FROM (now() - access_timestamp)) * 1000
    )
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Clear context on error
    PERFORM set_config('app.secure_admin_access', '', true);
    
    -- Log the security error
    INSERT INTO security_audit_log (
      user_id, action, resource_type, resource_id, details
    ) VALUES (
      admin_user_id,
      'ADMIN_PROFILE_ACCESS_ERROR',
      'profiles',
      'all',
      jsonb_build_object(
        'timestamp', now(),
        'error_message', SQLERRM,
        'error_code', SQLSTATE,
        'security_context', 'error_during_access'
      )
    );
    
    -- Re-raise the exception
    RAISE;
END;
$$;

-- Create secure function for individual profile updates by admin
CREATE OR REPLACE FUNCTION public.admin_update_profile_secure(
  target_profile_id uuid,
  new_first_name text DEFAULT NULL,
  new_last_name text DEFAULT NULL,
  new_email text DEFAULT NULL,
  new_school text DEFAULT NULL,
  new_grade text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_user_id uuid;
  result json;
  old_profile_data json;
BEGIN
  admin_user_id := auth.uid();
  
  -- Strict admin verification
  IF get_current_user_role() != 'admin' THEN
    INSERT INTO security_audit_log (
      user_id, action, resource_type, resource_id, details
    ) VALUES (
      admin_user_id,
      'UNAUTHORIZED_PROFILE_UPDATE_ATTEMPT',
      'profiles',
      target_profile_id::text,
      jsonb_build_object(
        'timestamp', now(),
        'attempted_changes', jsonb_build_object(
          'first_name', new_first_name,
          'last_name', new_last_name,
          'email', new_email,
          'school', new_school,
          'grade', new_grade
        ),
        'security_violation', 'insufficient_privileges'
      )
    );
    
    RETURN json_build_object(
      'success', false,
      'error', 'Unauthorized: Admin access required for profile modifications'
    );
  END IF;

  -- Get current profile data for audit trail
  SELECT to_json(p) INTO old_profile_data
  FROM profiles p
  WHERE p.id = target_profile_id;
  
  IF old_profile_data IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Profile not found'
    );
  END IF;

  -- Set secure update context
  PERFORM set_config('app.secure_admin_access', 'profiles_update_authorized', true);
  
  -- Log the update attempt
  INSERT INTO security_audit_log (
    user_id, action, resource_type, resource_id, details
  ) VALUES (
    admin_user_id,
    'ADMIN_PROFILE_UPDATE_INITIATED',
    'profiles',
    target_profile_id::text,
    jsonb_build_object(
      'timestamp', now(),
      'old_data', old_profile_data,
      'proposed_changes', jsonb_build_object(
        'first_name', new_first_name,
        'last_name', new_last_name,
        'email', new_email,
        'school', new_school,
        'grade', new_grade
      )
    )
  );

  -- Perform the update
  UPDATE profiles 
  SET 
    first_name = COALESCE(new_first_name, first_name),
    last_name = COALESCE(new_last_name, last_name),
    email = COALESCE(new_email, email),
    school = COALESCE(new_school, school),
    grade = COALESCE(new_grade, grade),
    updated_at = now()
  WHERE id = target_profile_id;

  -- Clear secure context
  PERFORM set_config('app.secure_admin_access', '', true);
  
  -- Log successful update
  INSERT INTO security_audit_log (
    user_id, action, resource_type, resource_id, details
  ) VALUES (
    admin_user_id,
    'ADMIN_PROFILE_UPDATE_COMPLETED',
    'profiles',
    target_profile_id::text,
    jsonb_build_object(
      'timestamp', now(),
      'update_successful', true
    )
  );

  RETURN json_build_object(
    'success', true,
    'message', 'Profile updated successfully with full audit trail'
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Clear context on error
    PERFORM set_config('app.secure_admin_access', '', true);
    
    INSERT INTO security_audit_log (
      user_id, action, resource_type, resource_id, details
    ) VALUES (
      admin_user_id,
      'ADMIN_PROFILE_UPDATE_ERROR',
      'profiles',
      target_profile_id::text,
      jsonb_build_object(
        'timestamp', now(),
        'error', SQLERRM,
        'sqlstate', SQLSTATE
      )
    );
    
    RETURN json_build_object(
      'success', false,
      'error', 'Profile update failed: ' || SQLERRM
    );
END;
$$;

-- Replace the old get_profiles_for_admin_management function to use new secure version
DROP FUNCTION IF EXISTS public.get_profiles_for_admin_management();

-- Create alias for backward compatibility
CREATE OR REPLACE FUNCTION public.get_profiles_for_admin_management()
RETURNS TABLE(
  id uuid, 
  first_name text, 
  last_name text, 
  email text, 
  school text, 
  grade text, 
  created_at timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM public.get_profiles_for_admin_secure();
$$;
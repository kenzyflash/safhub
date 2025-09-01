-- Fix all database functions to have secure search_path
-- This addresses the "Function Search Path Mutable" security warnings

-- Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Update get_current_user_role function  
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  RETURN (
    SELECT role::text FROM public.user_roles 
    WHERE user_id = auth.uid() 
    LIMIT 1
  );
END;
$function$;

-- Update increment/decrement vote functions
CREATE OR REPLACE FUNCTION public.increment_upvotes(discussion_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $function$
  UPDATE public.course_discussions 
  SET upvotes = COALESCE(upvotes, 0) + 1 
  WHERE id = discussion_id;
$function$;

CREATE OR REPLACE FUNCTION public.increment_downvotes(discussion_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $function$
  UPDATE public.course_discussions 
  SET downvotes = COALESCE(downvotes, 0) + 1 
  WHERE id = discussion_id;
$function$;

CREATE OR REPLACE FUNCTION public.decrement_upvotes(discussion_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $function$
  UPDATE public.course_discussions 
  SET upvotes = GREATEST(COALESCE(upvotes, 0) - 1, 0) 
  WHERE id = discussion_id;
$function$;

CREATE OR REPLACE FUNCTION public.decrement_downvotes(discussion_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $function$
  UPDATE public.course_discussions 
  SET downvotes = GREATEST(COALESCE(downvotes, 0) - 1, 0) 
  WHERE id = discussion_id;
$function$;

-- Update has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

-- Update award_achievement function
CREATE OR REPLACE FUNCTION public.award_achievement(user_id_param uuid, achievement_name_param text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  achievement_record RECORD;
  existing_award RECORD;
BEGIN
  -- Get the achievement
  SELECT * INTO achievement_record FROM public.achievements WHERE name = achievement_name_param;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user already has this achievement
  SELECT * INTO existing_award FROM public.user_achievements 
  WHERE user_id = user_id_param AND achievement_id = achievement_record.id;
  
  IF FOUND THEN
    RETURN FALSE; -- Already has achievement
  END IF;
  
  -- Award the achievement
  INSERT INTO public.user_achievements (user_id, achievement_id) 
  VALUES (user_id_param, achievement_record.id);
  
  -- Update user points
  INSERT INTO public.user_points (user_id, total_points, level)
  VALUES (user_id_param, achievement_record.points, 1)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    total_points = user_points.total_points + achievement_record.points,
    level = CASE 
      WHEN (user_points.total_points + achievement_record.points) >= 500 THEN 5
      WHEN (user_points.total_points + achievement_record.points) >= 300 THEN 4
      WHEN (user_points.total_points + achievement_record.points) >= 150 THEN 3
      WHEN (user_points.total_points + achievement_record.points) >= 50 THEN 2
      ELSE 1
    END,
    updated_at = now();
  
  RETURN TRUE;
END;
$function$;

-- Update get_all_users_with_roles function
CREATE OR REPLACE FUNCTION public.get_all_users_with_roles()
RETURNS TABLE(id uuid, first_name text, last_name text, email text, school text, grade text, created_at timestamp with time zone, role text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Check if current user is admin
  IF public.get_current_user_role() != 'admin' THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;
  
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
END;
$function$;

-- Update increment_study_minutes function
CREATE OR REPLACE FUNCTION public.increment_study_minutes(p_user_id uuid, p_date date, p_minutes integer)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $function$
  INSERT INTO public.study_sessions (user_id, date, minutes_studied)
  VALUES (p_user_id, p_date, p_minutes)
  ON CONFLICT (user_id, date)
  DO UPDATE SET minutes_studied = COALESCE(study_sessions.minutes_studied, 0) + p_minutes;
$function$;

-- Update update_user_role function
CREATE OR REPLACE FUNCTION public.update_user_role(target_user_id uuid, new_role text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  current_user_role TEXT;
  target_current_role TEXT;
  result JSON;
BEGIN
  -- Check if current user is admin
  current_user_role := public.get_current_user_role();
  IF current_user_role != 'admin' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Access denied. Admin role required.'
    );
  END IF;

  -- Validate the new role
  IF new_role NOT IN ('student', 'teacher', 'admin') THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid role. Must be student, teacher, or admin.'
    );
  END IF;

  -- Prevent admins from removing their own admin privileges
  IF target_user_id = auth.uid() AND current_user_role = 'admin' AND new_role != 'admin' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Cannot remove your own admin privileges.'
    );
  END IF;

  -- Get current role for the target user
  SELECT role::text INTO target_current_role 
  FROM public.user_roles 
  WHERE user_id = target_user_id;

  -- If user already has this role, return success without changes
  IF target_current_role = new_role THEN
    RETURN json_build_object(
      'success', true,
      'message', 'User already has this role.'
    );
  END IF;

  -- Delete existing role(s) for the user
  DELETE FROM public.user_roles WHERE user_id = target_user_id;

  -- Insert the new role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, new_role::app_role);

  -- Create a notification for the user about their role change
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    target_user_id,
    'Role Updated',
    'Your account role has been updated to ' || new_role || '. You may need to refresh your session.',
    'general'
  );

  -- Log the role change (for audit purposes)
  RAISE LOG 'Role changed: User % role updated from % to % by admin %', 
    target_user_id, COALESCE(target_current_role, 'none'), new_role, auth.uid();

  RETURN json_build_object(
    'success', true,
    'message', 'Role updated successfully',
    'old_role', target_current_role,
    'new_role', new_role
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in update_user_role: % %', SQLERRM, SQLSTATE;
    RETURN json_build_object(
      'success', false,
      'error', 'Failed to update role: ' || SQLERRM
    );
END;
$function$;

-- Create an audit log table for security monitoring
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  details jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON public.security_audit_log
  FOR SELECT USING (public.get_current_user_role() = 'admin');

-- System can insert audit logs  
CREATE POLICY "System can insert audit logs" ON public.security_audit_log
  FOR INSERT WITH CHECK (true);

-- Enhanced RLS for contact inquiries - add audit logging
CREATE OR REPLACE FUNCTION public.log_contact_access(inquiry_id uuid, action text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.security_audit_log (
    user_id, action, resource_type, resource_id, details
  ) VALUES (
    auth.uid(), 
    action, 
    'contact_inquiry', 
    inquiry_id::text,
    jsonb_build_object('timestamp', now())
  );
END;
$function$;
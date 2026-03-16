-- Create a secure RPC for sending notifications to any user (teacher/admin only for bulk, self for own)
CREATE OR REPLACE FUNCTION public.send_notification(
  target_user_id uuid,
  notification_title text,
  notification_message text,
  notification_type text DEFAULT 'general'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Allow sending to self, or if caller is teacher/admin
  IF target_user_id != auth.uid() AND public.get_current_user_role() NOT IN ('teacher', 'admin') THEN
    RAISE EXCEPTION 'Only teachers and admins can send notifications to other users';
  END IF;

  INSERT INTO public.notifications (user_id, title, message, type, is_read)
  VALUES (target_user_id, notification_title, notification_message, notification_type, false);
END;
$function$;

-- Create bulk notification RPC for course releases (admin/teacher only)
CREATE OR REPLACE FUNCTION public.send_course_release_notifications(course_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Only teachers and admins can send bulk notifications
  IF public.get_current_user_role() NOT IN ('teacher', 'admin') THEN
    RAISE EXCEPTION 'Only teachers and admins can send course release notifications';
  END IF;

  INSERT INTO public.notifications (user_id, title, message, type, is_read)
  SELECT 
    ur.user_id,
    'New Course Available',
    'A new course "' || course_name || '" is now available for enrollment!',
    'course_release',
    false
  FROM public.user_roles ur
  WHERE ur.role = 'student';
END;
$function$;
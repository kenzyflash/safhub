CREATE OR REPLACE FUNCTION public.update_user_role(target_user_id uuid, new_role text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  current_user_role TEXT;
  target_current_role TEXT;
  result JSON;
BEGIN
  current_user_role := public.get_current_user_role();
  IF current_user_role != 'admin' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Access denied. Admin role required.'
    );
  END IF;

  IF new_role NOT IN ('student', 'teacher', 'admin') THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid role. Must be student, teacher, or admin.'
    );
  END IF;

  IF target_user_id = auth.uid() AND current_user_role = 'admin' AND new_role != 'admin' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Cannot remove your own admin privileges.'
    );
  END IF;

  SELECT role::text INTO target_current_role 
  FROM public.user_roles 
  WHERE user_id = target_user_id;

  IF target_current_role = new_role THEN
    RETURN json_build_object(
      'success', true,
      'message', 'User already has this role.'
    );
  END IF;

  DELETE FROM public.user_roles WHERE user_id = target_user_id;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, new_role::public.app_role);

  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    target_user_id,
    'Role Updated',
    'Your account role has been updated to ' || new_role || '. You may need to refresh your session.',
    'general'
  );

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
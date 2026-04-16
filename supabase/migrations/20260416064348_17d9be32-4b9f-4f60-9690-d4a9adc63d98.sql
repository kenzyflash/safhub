
CREATE OR REPLACE FUNCTION public.get_course_discussions_secure(course_id_param uuid)
 RETURNS TABLE(id uuid, course_id uuid, anonymous_user_id text, content text, upvotes integer, downvotes integer, parent_id uuid, created_at timestamp with time zone, updated_at timestamp with time zone, is_own_post boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if user is enrolled in the course or is admin
  IF NOT EXISTS (
    SELECT 1 FROM course_enrollments ce
    WHERE ce.user_id = auth.uid() AND ce.course_id = course_id_param
  ) AND COALESCE(get_current_user_role(), '') != 'admin' THEN
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
$function$;

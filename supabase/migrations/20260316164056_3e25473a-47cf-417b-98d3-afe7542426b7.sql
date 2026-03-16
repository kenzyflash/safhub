-- Fix 1: Set search_path on get_profiles_for_admin_management
CREATE OR REPLACE FUNCTION public.get_profiles_for_admin_management()
 RETURNS TABLE(id uuid, first_name text, last_name text, email text, school text, grade text, created_at timestamp with time zone)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT * FROM public.get_profiles_for_admin_secure();
$function$;

-- Fix 2: Drop always-true INSERT policy on user_achievements
-- The award_achievement SECURITY DEFINER function bypasses RLS for inserts
DROP POLICY IF EXISTS "System can create achievements" ON public.user_achievements;

-- Fix 3: Drop always-true INSERT policy on notifications
-- SECURITY DEFINER functions (update_user_role, award_achievement) bypass RLS for inserts
DROP POLICY IF EXISTS "Allow insert notifications" ON public.notifications;

-- Add a restricted INSERT policy for notifications - only authenticated users can insert for themselves
CREATE POLICY "Authenticated users can insert own notifications"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
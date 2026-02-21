
-- FIX 1: Simplify profiles RLS so own-profile access doesn't depend on audit logging
-- The current policies gate access on log_profile_access() which could fail and block legitimate access.
-- Separate audit logging from access control: users always access their own profile, logging is best-effort.

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view own profile with audit" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile with audit" ON public.profiles;
DROP POLICY IF EXISTS "Block direct admin profile access" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update through secure functions only" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile only" ON public.profiles;

-- Recreate simple, fail-closed policies for own-profile access
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Admin access via secure functions only (SECURITY DEFINER functions bypass RLS)
-- No direct admin SELECT/UPDATE policy needed since admin functions use SECURITY DEFINER

-- FIX 2: Add rate limiting for contact_inquiries to prevent spam
-- Create a rate-limiting function that checks recent submissions by IP/fingerprint
CREATE OR REPLACE FUNCTION public.check_contact_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  recent_count INTEGER;
BEGIN
  -- Check how many submissions from this email in the last hour
  SELECT COUNT(*) INTO recent_count
  FROM contact_inquiries
  WHERE email = NEW.email
    AND created_at > now() - interval '1 hour';

  IF recent_count >= 3 THEN
    RAISE EXCEPTION 'Rate limit exceeded. Please try again later.';
  END IF;

  -- Also check total submissions in last hour (regardless of email) from any source
  SELECT COUNT(*) INTO recent_count
  FROM contact_inquiries
  WHERE created_at > now() - interval '1 hour';

  IF recent_count >= 50 THEN
    RAISE EXCEPTION 'Service temporarily unavailable. Please try again later.';
  END IF;

  RETURN NEW;
END;
$$;

-- Attach rate limit trigger
DROP TRIGGER IF EXISTS contact_rate_limit_trigger ON public.contact_inquiries;
CREATE TRIGGER contact_rate_limit_trigger
BEFORE INSERT ON public.contact_inquiries
FOR EACH ROW
EXECUTE FUNCTION public.check_contact_rate_limit();

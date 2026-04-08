-- Fix overly permissive contact_inquiries INSERT policy
DROP POLICY IF EXISTS "Anyone can submit contact inquiries" ON contact_inquiries;
CREATE POLICY "Anyone can submit contact inquiries" ON contact_inquiries FOR INSERT WITH CHECK (
  -- Rate limiting is handled by the trigger, but restrict to non-empty fields
  length(trim(name)) > 0 AND length(trim(email)) > 0 AND length(trim(subject)) > 0 AND length(trim(message)) > 0
);

-- Fix: notifications INSERT should also work via RPC (send_notification uses SECURITY DEFINER)
-- The current policy only allows auth.uid() = user_id which blocks RPC-created notifications
-- This is fine since send_notification bypasses RLS via SECURITY DEFINER
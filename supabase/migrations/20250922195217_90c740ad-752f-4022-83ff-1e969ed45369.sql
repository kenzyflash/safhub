-- Enhanced security for contact inquiries
-- Remove direct UPDATE access and create secure function for status updates

-- Create secure function for updating contact inquiry status with audit logging
CREATE OR REPLACE FUNCTION public.update_contact_inquiry_status(inquiry_id uuid, new_status text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_role TEXT;
  result JSON;
BEGIN
  -- Check if user is admin
  current_user_role := get_current_user_role();
  IF current_user_role != 'admin' THEN
    -- Log unauthorized access attempt
    INSERT INTO security_audit_log (
      user_id, action, resource_type, resource_id, details
    ) VALUES (
      auth.uid(),
      'UNAUTHORIZED_STATUS_UPDATE_ATTEMPT',
      'contact_inquiries',
      inquiry_id::text,
      jsonb_build_object(
        'timestamp', now(),
        'user_role', current_user_role,
        'attempted_status', new_status,
        'access_denied_reason', 'insufficient_privileges'
      )
    );
    
    RETURN json_build_object(
      'success', false,
      'error', 'Access denied. Admin role required.'
    );
  END IF;

  -- Validate status
  IF new_status NOT IN ('new', 'in-progress', 'resolved') THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid status. Must be new, in-progress, or resolved.'
    );
  END IF;

  -- Log the status update attempt
  INSERT INTO security_audit_log (
    user_id, action, resource_type, resource_id, details
  ) VALUES (
    auth.uid(),
    'CONTACT_INQUIRY_STATUS_UPDATE',
    'contact_inquiries',
    inquiry_id::text,
    jsonb_build_object(
      'timestamp', now(),
      'new_status', new_status,
      'admin_user', auth.uid()
    )
  );

  -- Update the contact inquiry status
  UPDATE contact_inquiries 
  SET status = new_status 
  WHERE id = inquiry_id;

  -- Check if update was successful
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Contact inquiry not found.'
    );
  END IF;

  RETURN json_build_object(
    'success', true,
    'message', 'Status updated successfully'
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Log the error
    INSERT INTO security_audit_log (
      user_id, action, resource_type, resource_id, details
    ) VALUES (
      auth.uid(),
      'CONTACT_INQUIRY_UPDATE_ERROR',
      'contact_inquiries',
      inquiry_id::text,
      jsonb_build_object(
        'timestamp', now(),
        'error', SQLERRM,
        'sqlstate', SQLSTATE
      )
    );
    
    RETURN json_build_object(
      'success', false,
      'error', 'Failed to update status: ' || SQLERRM
    );
END;
$$;

-- Remove direct UPDATE permission from contact_inquiries table
DROP POLICY IF EXISTS "Admins can update contact inquiries" ON public.contact_inquiries;

-- Ensure only the secure function can be used for updates by removing direct table access
-- The RLS policies will now only allow SELECT (via secure function) and INSERT (for contact form submissions)
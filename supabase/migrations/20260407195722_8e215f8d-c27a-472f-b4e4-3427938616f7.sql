-- Allow users to delete their own course enrollments (unenroll)
CREATE POLICY "Users can delete their own enrollments"
ON public.course_enrollments
FOR DELETE
USING (auth.uid() = user_id);
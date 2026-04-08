
-- Create lesson_materials table for teacher uploads (PDFs, PPTs, docs)
CREATE TABLE public.lesson_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size_bytes BIGINT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.lesson_materials ENABLE ROW LEVEL SECURITY;

-- Teachers can manage materials for their courses
CREATE POLICY "Teachers can manage lesson materials"
ON public.lesson_materials
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.courses
    WHERE courses.id = lesson_materials.course_id
    AND courses.instructor_id = auth.uid()
  )
);

-- Enrolled students can view materials
CREATE POLICY "Enrolled students can view lesson materials"
ON public.lesson_materials
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.course_enrollments
    WHERE course_enrollments.course_id = lesson_materials.course_id
    AND course_enrollments.user_id = auth.uid()
  )
  OR get_current_user_role() = 'admin'
);

-- Create storage bucket for lesson materials
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('lesson-materials', 'lesson-materials', false, 52428800)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: teachers can upload
CREATE POLICY "Teachers can upload lesson materials"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'lesson-materials'
  AND get_current_user_role() IN ('teacher', 'admin')
);

-- Storage RLS: teachers can manage their uploads
CREATE POLICY "Teachers can manage lesson material files"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'lesson-materials'
  AND get_current_user_role() IN ('teacher', 'admin')
);

-- Storage RLS: enrolled students can read
CREATE POLICY "Enrolled students can read lesson materials"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'lesson-materials'
);


Fix the course page loading deadlock first, then restore secure lesson-material downloads.

What I found
- The data is already there: the Biology course exists, the current student is enrolled in it, and it has 1 lesson plus 1 uploaded PDF.
- The page hangs because the route param is mismatched:

```text
App.tsx route        /course/:id
CoursePage.tsx       const { courseId } = useParams()
Actual result        courseId === undefined
Fetch guard          if (courseId && user && !loading) ...
Outcome              fetch never runs, courseLoading stays true forever
```

- There is also a second issue with lesson materials: the `lesson-materials` bucket is private, but the app currently stores/opens lesson files as if they were public URLs. That will block student access even after the course page starts loading correctly.

Plan
1. Fix the route param bug in `src/pages/CoursePage.tsx`
   - Read the router param as `id` to match `App.tsx`, e.g. `const { id } = useParams<{ id: string }>()`.
   - Normalize that to a validated `courseId` variable and use it everywhere in the page.
   - Add a defensive branch so a missing/invalid route id shows an error state instead of an infinite spinner.

2. Harden the course loading flow in `src/pages/CoursePage.tsx`
   - Only start the fetch and timeout logic when auth is ready and a valid `courseId` exists.
   - Make sure every failure path ends loading cleanly, so this screen can never stay stuck on “Loading course”.
   - Keep the retry flow, but give clearer messages for invalid link / course not found / fetch failure.

3. Fix lesson material access for the private bucket
   - In `src/components/dashboard/LessonMaterialUploader.tsx`, stop saving `getPublicUrl()` results for private files.
   - Save the uploaded storage path instead.
   - Replace direct `<a href={file_url}>` usage with signed-URL download logic.
   - In `src/components/course/LessonMaterials.tsx`, generate a short-lived signed URL before opening/downloading a file for students.

4. Preserve existing uploaded files without making a mess
   - Add backward-compatible logic that can read both:
     - new values stored as storage paths
     - old values stored as full `.../lesson-materials/...` URLs
   - Extract the internal storage path from legacy URLs so the already-uploaded Biology PDF still works without re-uploading anything.

5. Keep the fix secure
   - Do not make the bucket public.
   - Do not relax RLS on `lesson_materials`; the current policies are already appropriate.
   - Only generate downloads from the known `lesson-materials` bucket path instead of opening arbitrary DB URLs directly.

Files to update
- `src/pages/CoursePage.tsx`
- `src/components/course/LessonMaterials.tsx`
- `src/components/dashboard/LessonMaterialUploader.tsx`

Technical details
- I do not see a need for a broad `AuthContext` rewrite for this specific bug: current logs show the user and role are loading successfully.
- The main blocker is the undefined route param, not missing backend data.
- No database migration is required for the immediate fix if the app supports both legacy full URLs and new stored paths in code.

Expected result
- Opening `/course/a12fb56e-b80e-46df-8582-32ece4d59586` loads the course instead of hanging.
- The lesson list appears normally.
- The Materials tab lets the enrolled student open/download the existing PDF.
- Teachers can upload new materials and those files also open correctly through signed URLs.
- Invalid `/course/...` links show a proper error screen instead of spinning forever.

Verification
- Open a course from the student dashboard and confirm the loading screen clears.
- Confirm the course title, lesson outline, and tabs render.
- Open the Materials tab and verify the existing Biology PDF downloads as the enrolled student.
- Upload a new material as a teacher and verify that file also opens correctly.
- Test an invalid course URL and confirm it shows an error state, not an endless spinner.



## Plan: Multi-Course Enrollment & Unenroll ("Stop Learning")

### What exists today
- Users can already enroll in multiple courses — the DB has no limit and the Courses page handles enrollment per course. The student dashboard already lists all enrolled courses.
- There is no way to unenroll / stop learning a course. The `course_enrollments` table has no DELETE RLS policy, so unenroll requests would be blocked.

### What needs to change

**1. Add DELETE RLS policy for course_enrollments (migration)**
- Allow users to delete their own enrollments: `auth.uid() = user_id`.
- This is the database prerequisite for unenroll to work.

**2. Add "Stop Learning" / Unenroll button to the student dashboard**
- In `src/components/student/CourseProgress.tsx`, add a secondary "Stop Learning" button next to each course's "Continue Learning" button.
- On click, show a confirmation dialog (using AlertDialog) asking "Are you sure you want to unenroll from [course title]?"
- On confirm, delete the enrollment row from `course_enrollments` and remove related `lesson_progress` rows, then refresh the list.

**3. Add unenroll option on the CoursePage itself**
- In `src/pages/CoursePage.tsx`, add a "Stop Learning" button in the course header area.
- Same confirmation dialog pattern. On confirm, delete enrollment + lesson progress, then navigate back to `/courses`.

**4. Show enrollment status on the Courses page**
- In `src/pages/Courses.tsx`, fetch the user's existing enrollments on load.
- For already-enrolled courses, change the button from "Enroll Now" to "Continue Learning" (links to `/course/:id`) — this already partially works but can be made explicit.
- Ensure enrolling in additional courses works seamlessly (it already does at the DB level).

### Files to change
- **New migration**: `supabase/migrations/..._allow_unenroll.sql` — adds DELETE policy on `course_enrollments` and `lesson_progress`
- **`src/components/student/CourseProgress.tsx`** — add unenroll button with confirmation dialog
- **`src/pages/CoursePage.tsx`** — add unenroll button in course header
- **`src/pages/Courses.tsx`** — fetch enrollments to show correct button state per course

### Security
- DELETE policy scoped to `auth.uid() = user_id` — users can only remove their own enrollments.
- Lesson progress cleanup uses the same user-scoped delete (already has a DELETE policy).


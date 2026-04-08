# SafHub / EdHub — Features Discussed & Implemented

This document lists every feature discussed during our development sessions, along with its current status and the files involved.

---

## 1. Sample Courses Seeded into Database
**Status:** ✅ Implemented  
**Description:** Added multiple sample courses (Biology, Mathematics, English, etc.) to the `courses` table so the Courses page has content to display, filter, and enroll in.  
**Files:** Database migration (seed data)

---

## 2. Lesson Completion & Certificate Download
**Status:** ✅ Implemented  
**Description:** Students can mark lessons as complete, track progress per course, and download a PDF certificate (with selectable styles: Classic, Modern, Elegant) when 100% of lessons are completed.  
**Files:**
- `src/pages/CoursePage.tsx` — lesson completion UI, certificate download button
- `src/utils/generateCertificate.ts` — PDF generation logic

---

## 3. Lesson Materials Download for Students
**Status:** ✅ Implemented  
**Description:** Enrolled students can view and download PDFs/documents uploaded by teachers for each lesson via a "Materials" tab on the course page. Downloads use 5-minute signed URLs for security.  
**Files:**
- `src/components/course/LessonMaterials.tsx` — materials list & signed-URL download
- `src/pages/CoursePage.tsx` — "Materials" tab integration

---

## 4. Video URL Embedding for Teachers
**Status:** ✅ Implemented  
**Description:** Teachers can paste a YouTube, Vimeo, or direct video URL when creating/editing lessons. The URL is sanitised, validated against known patterns, and rendered as an embedded iframe (using `youtube-nocookie.com` for privacy) or native `<video>` element.  
**Files:**
- `src/components/enhanced/VideoUrlInput.tsx` — URL input with platform detection & validation badge
- `src/components/course/VideoPlayer.tsx` — `parseVideoUrl()` sanitiser, iframe sandbox, native player

---

## 5. Security Hardening & Misconfiguration Fixes
**Status:** ✅ Implemented  
**Description:** Multiple security improvements:
- RLS policies audited and tightened across all tables
- `update_user_role` DB function fixed (schema-qualified `public.app_role` cast to avoid `SET search_path TO ''` breakage)
- npm dependency vulnerabilities patched (vite, cross-spawn, etc.)
- iframe `sandbox` attribute and `referrerPolicy="no-referrer"` on embedded videos
- `youtube-nocookie.com` used instead of `youtube.com` for embedded videos  
**Files:**
- Multiple database migrations
- `src/components/course/VideoPlayer.tsx` — iframe security attributes
- `package.json` — dependency updates

---

## 6. Course Page Loading Fix (Route Param Mismatch)
**Status:** ✅ Implemented  
**Description:** The course page was stuck in an infinite loading state because `App.tsx` used `:id` but `CoursePage.tsx` read `useParams<{ courseId }>`. Fixed by aligning the param name and adding timeout/error/retry states.  
**Files:**
- `src/pages/CoursePage.tsx` — `useParams<{ id }>`, loading timeout, error screen with retry
- `src/hooks/useCourseData.ts` — data fetching logic

---

## 7. Admin Role Update Fix (`app_role` Enum Resolution)
**Status:** ✅ Implemented  
**Description:** The `update_user_role` function failed with "type app_role does not exist" because it used `SET search_path TO ''` but cast without schema qualification. Fixed by using `new_role::public.app_role`.  
**Files:**
- Database migration: `CREATE OR REPLACE FUNCTION public.update_user_role(...)` with schema-qualified cast

---

## 8. Multi-Course Enrollment
**Status:** ✅ Implemented  
**Description:** Students can enroll in multiple courses simultaneously. The Courses page dynamically toggles between "Enroll Now" and "Continue Learning" buttons based on the user's current enrollments.  
**Files:**
- `src/pages/Courses.tsx` — `enrolledCourseIds` state, dynamic button rendering
- `src/hooks/useCourseData.ts` — `enrollInCourse()` with duplicate-check

---

## 9. Unenroll / "Stop Learning" Feature
**Status:** ✅ Implemented  
**Description:** Students can unenroll from courses via a "Stop Learning" button (with confirmation dialog) on both the Student Dashboard and individual Course Page. Unenrolling deletes lesson progress and enrollment records.  
**Files:**
- Database migration: `DELETE` RLS policy on `course_enrollments` (`auth.uid() = user_id`)
- `src/components/student/CourseProgress.tsx` — unenroll button + AlertDialog
- `src/pages/CoursePage.tsx` — unenroll button + AlertDialog + redirect to `/courses`
- `src/pages/StudentDashboard.tsx` — `onUnenroll` callback to refresh list

---

## 10. Discussion Tab Auth Guard Fix
**Status:** ✅ Implemented  
**Description:** The course Discussion tab showed "Failed to load discussions" because `fetchDiscussions()` was called before the user session loaded, causing `auth.uid()` to be null. Fixed by adding an early return guard when `user` is null.  
**Files:**
- `src/components/course/CourseDiscussion.tsx` — `if (!user) { setLoading(false); return; }` guard

---

## 11. npm Security Vulnerability Fixes
**Status:** ✅ Implemented  
**Description:** Ran `npm audit` and updated vulnerable packages (vite, cross-spawn, etc.) to their minimum secure versions.  
**Files:**
- `package.json` — version bumps for vulnerable dependencies

---

*Last updated: 2026-04-08*

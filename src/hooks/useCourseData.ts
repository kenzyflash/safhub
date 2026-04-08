/**
 * useCourseData.ts
 * -----------------
 * Custom React hook that manages course and enrollment data for the
 * student experience. Provides:
 *  - All available courses (with instructor names resolved via anonymised profiles)
 *  - Current user's enrollment records
 *  - An enrollInCourse() function with duplicate-enrollment protection
 *
 * Used by: StudentDashboard, CourseEnrollment, and other student-facing components.
 * See docs/FEATURES-DISCUSSED.md #8 (Multi-Course Enrollment) for context.
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { createEnrollmentWelcomeNotification } from '@/utils/notificationService';

/** Shape of a course record from the database */
export interface Course {
  id: string;                 // Course UUID
  title: string;              // Course title
  description: string;        // Course description
  instructor_id: string;      // UUID of the instructor (references profiles)
  instructor_name: string;    // Display name of the instructor
  duration: string;           // Human-readable duration (e.g. "4 weeks")
  total_lessons: number;      // Total number of lessons in the course
  category: string;           // Course category (e.g. "science", "mathematics")
  level: string;              // Difficulty level (beginner, intermediate, advanced)
  rating: number;             // Average rating (0-5)
  student_count: number;      // Number of enrolled students
  price: string;              // Price label (e.g. "Free", "$9.99")
  image_url: string;          // URL to the course thumbnail image
  created_at: string;         // ISO timestamp of course creation
  updated_at: string;         // ISO timestamp of last update
}

/** Shape of a lesson record from the database */
export interface Lesson {
  id: string;                 // Lesson UUID
  course_id: string;          // Parent course UUID
  title: string;              // Lesson title
  description: string;        // Lesson description
  video_url: string;          // Video URL (YouTube, Vimeo, or direct link)
  duration_minutes: number;   // Expected lesson duration in minutes
  order_index: number;        // Sort order within the course
  created_at: string;         // ISO timestamp of lesson creation
}

/** Shape of an enrollment record from the database */
export interface CourseEnrollment {
  id: string;                 // Enrollment UUID
  user_id: string;            // UUID of the enrolled student
  course_id: string;          // UUID of the enrolled course
  enrolled_at: string;        // ISO timestamp of enrollment
  progress: number;           // Completion percentage (0-100)
}

export const useCourseData = () => {
  // Get the current authenticated user from the auth context
  const { user } = useAuth();

  // ─── State ─────────────────────────────────────────────────────────
  const [courses, setCourses] = useState<Course[]>([]);               // All available courses
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]); // User's enrollments
  const [loading, setLoading] = useState(true);                       // Loading indicator

  // Fetch data when the user becomes available (after auth session restores)
  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  /**
   * Fetch both courses and enrollments in parallel.
   * Wraps individual fetchers in Promise.all for efficiency.
   */
  const fetchData = async () => {
    setLoading(true);
    try {
      // Run both fetches concurrently — they're independent
      await Promise.all([fetchCourses(), fetchEnrollments()]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false); // Always clear loading state
    }
  };

  /**
   * Fetch all courses that have an instructor assigned.
   * Resolves instructor display names via the get_anonymized_profile RPC
   * to avoid direct access to the profiles table.
   */
  const fetchCourses = async () => {
    try {
      // Query all courses that have a non-null instructor_id
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .not('instructor_id', 'is', null) // Only courses with assigned instructors
        .order('created_at', { ascending: false }); // Newest first

      if (coursesError) throw coursesError;

      // Handle empty result
      if (!coursesData || coursesData.length === 0) {
        setCourses([]);
        return;
      }

      // Extract unique instructor IDs to batch-fetch their profiles
      const instructorIds = [...new Set(coursesData.map(course => course.instructor_id).filter(Boolean))];
      
      // If no valid instructor IDs, there are no displayable courses
      if (instructorIds.length === 0) {
        setCourses([]);
        return;
      }

      // Fetch anonymised profiles for each instructor in parallel
      // Uses the get_anonymized_profile RPC to avoid exposing raw profile data
      const instructorProfilePromises = instructorIds.map(async (instructorId) => {
        const { data, error } = await supabase
          .rpc('get_anonymized_profile', { profile_id: instructorId });
        
        if (error) {
          console.error('Error fetching profile for instructor:', instructorId, error);
          // Fallback display name if profile fetch fails
          return { id: instructorId, display_name: 'Unknown Instructor' };
        }
        
        return {
          id: instructorId,
          display_name: data?.[0]?.display_name || 'Unknown Instructor'
        };
      });

      // Wait for all profile fetches to complete
      const instructorProfiles = await Promise.all(instructorProfilePromises);

      // Build a lookup map: instructor ID → display name
      const profilesMap = new Map(
        instructorProfiles.map(profile => [
          profile.id, 
          profile.display_name
        ])
      );

      // Filter courses to only those with resolvable instructors,
      // and enhance each course with the resolved instructor name
      const validCourses = coursesData.filter(course => {
        // Keep courses that either have a valid instructor profile or already have instructor_name
        return course.instructor_name || profilesMap.has(course.instructor_id);
      }).map(course => ({
        ...course,
        // Prefer stored instructor_name, fall back to resolved profile name
        instructor_name: course.instructor_name || profilesMap.get(course.instructor_id) || 'Unknown Instructor'
      }));

      setCourses(validCourses);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setCourses([]); // Reset to empty on error
    }
  };

  /**
   * Fetch the current user's enrollment records.
   * Used to determine which courses the student is enrolled in
   * and their progress in each.
   */
  const fetchEnrollments = async () => {
    // Guard: require authenticated user
    if (!user) return;

    try {
      // Query all enrollments for the current user
      const { data, error } = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      setEnrollments(data || []);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      setEnrollments([]); // Reset to empty on error
    }
  };

  /**
   * Enroll the current user in a course.
   * 
   * Steps:
   * 1. Check if already enrolled (prevents duplicate enrollments)
   * 2. Insert enrollment record with 0% progress
   * 3. Send a welcome notification
   * 4. Refresh enrollments to update UI
   *
   * Throws on error so the caller can handle it (e.g. show a toast).
   */
  const enrollInCourse = async (courseId: string) => {
    // Guard: require authenticated user
    if (!user) return;

    try {
      // Step 1: Check for existing enrollment to prevent duplicates
      const { data: existingData, error: checkError } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .maybeSingle(); // Returns null instead of error if no match

      if (checkError) throw checkError;

      // If already enrolled, throw a user-friendly error
      if (existingData) {
        throw new Error('You are already enrolled in this course');
      }

      // Step 2: Insert the new enrollment record
      const { error } = await supabase
        .from('course_enrollments')
        .insert({
          user_id: user.id,
          course_id: courseId,
          progress: 0 // Start at 0% progress
        });

      if (error) {
        // Handle race condition: if another request enrolled first
        if (error.code === '23505') { // PostgreSQL unique constraint violation
          throw new Error('You are already enrolled in this course');
        }
        throw error;
      }
      
      // Step 3: Find the course name and send a welcome notification
      const course = courses.find(c => c.id === courseId);
      if (course) {
        await createEnrollmentWelcomeNotification(user.id, course.title);
      }
      
      // Step 4: Refresh enrollments so the UI updates immediately
      await fetchEnrollments();
    } catch (error) {
      console.error('Error enrolling in course:', error);
      throw error; // Re-throw for caller to handle
    }
  };

  // Return data and actions for consumers of this hook
  return {
    courses,                              // All available courses
    enrollments,                          // User's enrollment records
    loading,                              // Whether data is being fetched
    enrollInCourse,                       // Function to enroll in a course
    refetchCourses: fetchCourses,         // Manual refresh for courses
    refetchEnrollments: fetchEnrollments, // Manual refresh for enrollments
    refetchData: fetchData                // Manual refresh for everything
  };
};

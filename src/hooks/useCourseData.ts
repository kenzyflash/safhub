
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { createEnrollmentWelcomeNotification } from '@/utils/notificationService';

export interface Course {
  id: string;
  title: string;
  description: string;
  instructor_id: string;
  instructor_name: string;
  duration: string;
  total_lessons: number;
  category: string;
  level: string;
  rating: number;
  student_count: number;
  price: string;
  image_url: string;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  description: string;
  video_url: string;
  duration_minutes: number;
  order_index: number;
  created_at: string;
}

export interface CourseEnrollment {
  id: string;
  user_id: string;
  course_id: string;
  enrolled_at: string;
  progress: number;
}

export const useCourseData = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchCourses(), fetchEnrollments()]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      // First, get all courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .not('instructor_id', 'is', null)
        .order('created_at', { ascending: false });

      if (coursesError) throw coursesError;

      if (!coursesData || coursesData.length === 0) {
        setCourses([]);
        return;
      }

      // Get unique instructor IDs
      const instructorIds = [...new Set(coursesData.map(course => course.instructor_id).filter(Boolean))];
      
      if (instructorIds.length === 0) {
        setCourses([]);
        return;
      }

      // Fetch anonymized instructor profiles separately
      const instructorProfilePromises = instructorIds.map(async (instructorId) => {
        const { data, error } = await supabase
          .rpc('get_anonymized_profile', { profile_id: instructorId });
        
        if (error) {
          console.error('Error fetching profile for instructor:', instructorId, error);
          return { id: instructorId, display_name: 'Unknown Instructor' };
        }
        
        return {
          id: instructorId,
          display_name: data?.[0]?.display_name || 'Unknown Instructor'
        };
      });

      const instructorProfiles = await Promise.all(instructorProfilePromises);

      // Create a map of instructor profiles
      const profilesMap = new Map(
        instructorProfiles.map(profile => [
          profile.id, 
          profile.display_name
        ])
      );

      // Filter and enhance courses with instructor names
      const validCourses = coursesData.filter(course => {
        // Keep courses that either have a valid instructor profile or already have instructor_name
        return course.instructor_name || profilesMap.has(course.instructor_id);
      }).map(course => ({
        ...course,
        instructor_name: course.instructor_name || profilesMap.get(course.instructor_id) || 'Unknown Instructor'
      }));

      setCourses(validCourses);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setCourses([]);
    }
  };

  const fetchEnrollments = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      setEnrollments(data || []);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      setEnrollments([]);
    }
  };

  const enrollInCourse = async (courseId: string) => {
    if (!user) return;

    try {
      // Check if user is already enrolled using fresh data
      const { data: existingData, error: checkError } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingData) {
        throw new Error('You are already enrolled in this course');
      }

      const { error } = await supabase
        .from('course_enrollments')
        .insert({
          user_id: user.id,
          course_id: courseId,
          progress: 0
        });

      if (error) {
        // Check if it's a duplicate key error
        if (error.code === '23505') {
          throw new Error('You are already enrolled in this course');
        }
        throw error;
      }
      
      // Find the course name for the notification
      const course = courses.find(c => c.id === courseId);
      if (course) {
        // Create welcome notification
        await createEnrollmentWelcomeNotification(user.id, course.title);
      }
      
      // Refresh enrollments to ensure UI is updated
      await fetchEnrollments();
    } catch (error) {
      console.error('Error enrolling in course:', error);
      throw error;
    }
  };

  return {
    courses,
    enrollments,
    loading,
    enrollInCourse,
    refetchCourses: fetchCourses,
    refetchEnrollments: fetchEnrollments,
    refetchData: fetchData
  };
};

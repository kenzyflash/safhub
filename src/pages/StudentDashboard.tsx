/**
 * StudentDashboard.tsx
 * ----------------------
 * Main dashboard page for students. Displays:
 *  - Welcome message with gamification stats (level, points)
 *  - Summary statistics (enrolled courses, completed, average progress)
 *  - List of enrolled courses with progress bars and unenroll option
 *  - Weekly study goals tracker
 *  - Upcoming assignments placeholder
 *
 * Protected by the ProtectedRoute wrapper (requires "student" role).
 * See docs/FEATURES-DISCUSSED.md #8 and #9 for enrollment/unenroll context.
 */

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, CheckCircle, LayoutDashboard, ListChecks, BarChart3, Trophy, Star } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardStats from "@/components/dashboard/DashboardStats";
import CourseProgress from "@/components/student/CourseProgress";
import StudyGoals from "@/components/student/StudyGoals";
import { useGamification } from "@/hooks/useGamification";
import { useCourseData } from "@/hooks/useCourseData";

const StudentDashboard = () => {
  // ─── Hooks ─────────────────────────────────────────────────────────
  const { user } = useAuth();                                          // Current authenticated user
  const { t } = useLanguage();                                         // Translation function
  const { courses, loading: coursesLoading } = useCourseData();        // All available courses
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);   // User's enrolled courses with details
  const [loading, setLoading] = useState(true);                        // Loading state for enrolled courses
  const { userPoints, userLevel, awardAchievement } = useGamification(); // Gamification data and actions

  // Fetch enrolled courses when user or available courses change
  useEffect(() => {
    if (user) {
      fetchEnrolledCourses();
    }
  }, [user, courses]);

  /**
   * Fetch the current user's enrolled courses with full course details.
   * Uses a Supabase join to get course info alongside enrollment data.
   * This is called on mount and after unenrolling to refresh the list.
   */
  const fetchEnrolledCourses = async () => {
    try {
      setLoading(true);
      // Query enrollments with nested course data via foreign key relationship
      const { data, error } = await supabase
        .from('course_enrollments')
        .select(`
          course_id,
          progress,
          courses (
            id,
            title,
            description,
            image_url,
            instructor_name
          )
        `)
        .eq('user_id', user?.id); // Scope to current user

      if (error) {
        console.error("Error fetching enrolled courses:", error);
      }

      if (data) {
        // Flatten the nested structure: merge enrollment data with course data
        const enrolled = data.map(enrollment => ({
          ...enrollment,
          ...enrollment.courses, // Spread course fields onto the top level
        }));
        setEnrolledCourses(enrolled);
      }
    } catch (error) {
      console.error("Error fetching enrolled courses:", error);
    } finally {
      setLoading(false);
    }
  };

  // ─── Calculate dashboard statistics ────────────────────────────────
  const totalCourses = enrolledCourses.length;                           // Total enrolled courses
  const completedCourses = enrolledCourses.filter(course => course.progress === 100).length; // Fully completed
  const averageProgress = totalCourses > 0                               // Average progress across all courses
    ? enrolledCourses.reduce((sum, course) => sum + course.progress, 0) / totalCourses
    : 0;

  // Stats cards configuration for the DashboardStats component
  const stats = [
    { label: t('studentDashboard.enrolledCourses'), value: totalCourses.toString(), icon: BookOpen, color: "text-blue-600" },
    { label: t('studentDashboard.completedCourses'), value: completedCourses.toString(), icon: CheckCircle, color: "text-green-600" },
    { label: t('studentDashboard.averageProgress'), value: averageProgress.toFixed(1) + "%", icon: BarChart3, color: "text-purple-600" },
  ];

  // ─── Auto-award achievements based on activity ────────────────────
  useEffect(() => {
    if (user && enrolledCourses.length > 0) {
      // Award "First Login" achievement (idempotent — won't duplicate)
      awardAchievement('First Login');
      
      // Award "Course Completed" if any course is at 100% progress
      const completedCourses = enrolledCourses.filter(course => course.progress >= 100);
      if (completedCourses.length > 0) {
        awardAchievement('Course Completed');
      }
    }
  }, [user, enrolledCourses, awardAchievement]);

  // ─── Loading state ─────────────────────────────────────────────────
  if (loading || coursesLoading) {
    return (
      <ProtectedRoute requiredRole="student">
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50">
          <DashboardHeader title="EdHub - Student" />
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">{t('dashboard.loadingDashboard')}</div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // ─── Main render ───────────────────────────────────────────────────
  return (
    <ProtectedRoute requiredRole="student">
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50">
        {/* Dashboard header with navigation and profile */}
        <DashboardHeader title="EdHub - Student" />

        <div className="container mx-auto px-4 py-8">
          {/* Welcome section with gamification stats */}
          <div className="mb-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  {t('studentDashboard.welcomeStudent')}
                </h1>
                <p className="text-gray-600">{t('studentDashboard.continueJourney')}</p>
              </div>
              
              {/* Gamification progress card — shows level and points */}
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 min-w-[200px]">
                <div className="flex items-center gap-3 mb-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <span className="font-semibold">{t('studentDashboard.level')} {userLevel}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Trophy className="h-4 w-4" />
                  <span>{userPoints} {t('studentDashboard.points')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Summary statistics cards (enrolled, completed, average progress) */}
          <DashboardStats stats={stats} />

          {/* Main content grid: courses on the left, sidebar on the right */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left column: enrolled courses with progress and unenroll option */}
            <div className="lg:col-span-2 space-y-6">
              {/* Pass fetchEnrolledCourses as callback to refresh after unenroll */}
              <CourseProgress courses={enrolledCourses} onUnenroll={fetchEnrolledCourses} />
            </div>

            {/* Right column: study goals and upcoming assignments */}
            <div className="space-y-6">
              {/* Weekly study goals tracker */}
              <StudyGoals />

              {/* Upcoming assignments placeholder */}
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ListChecks className="h-5 w-5 text-blue-600" />
                    {t('studentDashboard.upcomingAssignments')}
                  </CardTitle>
                  <CardDescription>{t('studentDashboard.stayOnTop')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-4">
                    <LayoutDashboard className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm text-gray-500">{t('studentDashboard.noAssignments')}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default StudentDashboard;

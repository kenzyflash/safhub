
import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  CheckCircle, 
  LayoutDashboard, 
  ListChecks,
  BarChart3,
  Trophy,
  Star
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardStats from "@/components/dashboard/DashboardStats";
import CourseProgress from "@/components/student/CourseProgress";
import StudyGoals from "@/components/student/StudyGoals";
import { useGamification } from "@/hooks/useGamification";
import { useCourseData } from "@/hooks/useCourseData";

const StudentDashboard = () => {
  const { user } = useAuth();
  const { courses, loading: coursesLoading } = useCourseData();
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { userPoints, userLevel, awardAchievement } = useGamification();

  useEffect(() => {
    if (user) {
      fetchEnrolledCourses();
    }
  }, [user, courses]);

  const fetchEnrolledCourses = async () => {
    try {
      setLoading(true);
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
        .eq('user_id', user?.id);

      if (error) {
        console.error("Error fetching enrolled courses:", error);
      }

      if (data) {
        const enrolled = data.map(enrollment => ({
          ...enrollment,
          ...enrollment.courses,
        }));
        setEnrolledCourses(enrolled);
      }
    } catch (error) {
      console.error("Error fetching enrolled courses:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate dashboard stats
  const totalCourses = enrolledCourses.length;
  const completedCourses = enrolledCourses.filter(course => course.progress === 100).length;
  const averageProgress = totalCourses > 0
    ? enrolledCourses.reduce((sum, course) => sum + course.progress, 0) / totalCourses
    : 0;

  const stats = [
    { label: "Enrolled Courses", value: totalCourses.toString(), icon: BookOpen, color: "text-blue-600" },
    { label: "Completed Courses", value: completedCourses.toString(), icon: CheckCircle, color: "text-green-600" },
    { label: "Average Progress", value: averageProgress.toFixed(1) + "%", icon: BarChart3, color: "text-purple-600" },
  ];

  // Award achievements based on activities
  useEffect(() => {
    if (user && enrolledCourses.length > 0) {
      // Award first login achievement
      awardAchievement('First Login');
      
      // Award course completion achievements
      const completedCourses = enrolledCourses.filter(course => course.progress >= 100);
      if (completedCourses.length > 0) {
        awardAchievement('Course Completed');
      }
    }
  }, [user, enrolledCourses, awardAchievement]);

  if (loading || coursesLoading) {
    return (
      <ProtectedRoute requiredRole="student">
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
          <DashboardHeader title="EdHub - Student" />
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">Loading dashboard...</div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="student">
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
        <DashboardHeader title="EdHub - Student" />

        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  Welcome back, Student!
                </h1>
                <p className="text-gray-600">Continue your learning journey.</p>
              </div>
              
              {/* Gamification Progress */}
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 min-w-[200px]">
                <div className="flex items-center gap-3 mb-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <span className="font-semibold">Level {userLevel}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Trophy className="h-4 w-4" />
                  <span>{userPoints} points</span>
                </div>
              </div>
            </div>
          </div>

          <DashboardStats stats={stats} />

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <CourseProgress courses={enrolledCourses} />
            </div>

            <div className="space-y-6">
              <StudyGoals />

              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ListChecks className="h-5 w-5 text-blue-600" />
                    Upcoming Assignments
                  </CardTitle>
                  <CardDescription>Stay on top of your deadlines</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-4">
                    <LayoutDashboard className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm text-gray-500">No upcoming assignments</p>
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

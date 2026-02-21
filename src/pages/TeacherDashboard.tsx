import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Users, 
  Bell, 
  BarChart3,
  TrendingUp
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardStats from "@/components/dashboard/DashboardStats";
import EnhancedCourseManagement from "@/components/dashboard/EnhancedCourseManagement";
import SubmissionManagement from "@/components/dashboard/SubmissionManagement";
import { useCourseData } from "@/hooks/useCourseData";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface RecentActivity {
  action: string;
  course: string;
  time: string;
  type: 'discussion' | 'enrollment' | 'submission';
}

interface TeacherStats {
  totalStudents: number;
  averageRating: number;
  totalLessons: number;
}

const TeacherDashboard = () => {
  const { user, userRole } = useAuth();
  const { courses, loading: coursesLoading } = useCourseData();
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  const [teacherStats, setTeacherStats] = useState<TeacherStats>({
    totalStudents: 0,
    averageRating: 0,
    totalLessons: 0
  });
  const [statsLoading, setStatsLoading] = useState(false);

  // Filter courses to show only those created by the current user
  const userCourses = courses.filter(course => course.instructor_id === user?.id);

  // Set initial load flag when courses are loaded for the first time
  useEffect(() => {
    if (!coursesLoading && !hasInitiallyLoaded) {
      setHasInitiallyLoaded(true);
      if (user && userCourses.length > 0) {
        fetchRecentActivities();
        fetchTeacherStats();
      }
    }
  }, [coursesLoading, hasInitiallyLoaded, user, userCourses.length]);

  const fetchTeacherStats = async () => {
    if (!user || userCourses.length === 0) {
      setTeacherStats({
        totalStudents: 0,
        averageRating: 0,
        totalLessons: 0
      });
      return;
    }

    setStatsLoading(true);
    try {
      const courseIds = userCourses.map(course => course.id);

      // Fetch total students (enrollments)
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('course_enrollments')
        .select('id')
        .in('course_id', courseIds);

      if (enrollmentsError) {
        console.error('Error fetching enrollments:', enrollmentsError);
      }

      // Fetch total lessons
      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('id')
        .in('course_id', courseIds);

      if (lessonsError) {
        console.error('Error fetching lessons:', lessonsError);
      }

      // Calculate average rating from courses
      const coursesWithRatings = userCourses.filter(course => course.rating && course.rating > 0);
      const averageRating = coursesWithRatings.length > 0
        ? coursesWithRatings.reduce((sum, course) => sum + (course.rating || 0), 0) / coursesWithRatings.length
        : 0;

      setTeacherStats({
        totalStudents: enrollments?.length || 0,
        averageRating: averageRating,
        totalLessons: lessons?.length || 0
      });

    } catch (error) {
      console.error('Error fetching teacher stats:', error);
      setTeacherStats({
        totalStudents: 0,
        averageRating: 0,
        totalLessons: 0
      });
    } finally {
      setStatsLoading(false);
    }
  };

  // Create stats array with real data
  const statsArray = [
    { label: "My Courses", value: userCourses.length.toString(), icon: BookOpen, color: "text-blue-600" },
    { label: "Total Students", value: teacherStats.totalStudents.toString(), icon: Users, color: "text-green-600" },
    { label: "Avg. Rating", value: teacherStats.averageRating > 0 ? `${teacherStats.averageRating.toFixed(1)}/5` : "No ratings", icon: BarChart3, color: "text-purple-600" },
    { label: "Total Lessons", value: teacherStats.totalLessons.toString(), icon: TrendingUp, color: "text-orange-600" }
  ];

  // Fetch recent activities
  const fetchRecentActivities = async () => {
    if (!user || userCourses.length === 0) {
      setRecentActivities([]);
      return;
    }

    setActivitiesLoading(true);
    try {
      const courseIds = userCourses.map(course => course.id);
      const activities: RecentActivity[] = [];

      // Fetch recent discussions
      const { data: discussions, error: discussionsError } = await supabase
        .from('course_discussions')
        .select('content, created_at, course_id, user_id')
        .in('course_id', courseIds)
        .order('created_at', { ascending: false })
        .limit(10);

      if (discussionsError) {
        console.error('Error fetching discussions:', discussionsError);
      } else if (discussions) {
        for (const discussion of discussions) {
          const course = userCourses.find(c => c.id === discussion.course_id);
          if (course) {
            activities.push({
              action: "New discussion post",
              course: course.title,
              time: new Date(discussion.created_at).toLocaleString(),
              type: 'discussion'
            });
          }
        }
      }

      // Fetch recent enrollments
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('course_enrollments')
        .select('enrolled_at, course_id, user_id')
        .in('course_id', courseIds)
        .order('enrolled_at', { ascending: false })
        .limit(5);

      if (enrollmentsError) {
        console.error('Error fetching enrollments:', enrollmentsError);
      } else if (enrollments) {
        for (const enrollment of enrollments) {
          const course = userCourses.find(c => c.id === enrollment.course_id);
          if (course) {
            activities.push({
              action: "New student enrollment",
              course: course.title,
              time: new Date(enrollment.enrolled_at).toLocaleString(),
              type: 'enrollment'
            });
          }
        }
      }

      // Fetch recent assignment submissions
      const { data: assignments } = await supabase
        .from('assignments')
        .select('id, title, course_id')
        .in('course_id', courseIds);

      if (assignments && assignments.length > 0) {
        const assignmentIds = assignments.map(a => a.id);
        const { data: submissions, error: submissionsError } = await supabase
          .from('assignment_submissions')
          .select('submitted_at, assignment_id')
          .in('assignment_id', assignmentIds)
          .order('submitted_at', { ascending: false })
          .limit(5);

        if (submissionsError) {
          console.error('Error fetching submissions:', submissionsError);
        } else if (submissions) {
          for (const submission of submissions) {
            const assignment = assignments.find(a => a.id === submission.assignment_id);
            const course = userCourses.find(c => c.id === assignment?.course_id);
            if (course && assignment) {
              activities.push({
                action: `Assignment "${assignment.title}" submitted`,
                course: course.title,
                time: new Date(submission.submitted_at).toLocaleString(),
                type: 'submission'
              });
            }
          }
        }
      }

      // Sort all activities by time (most recent first) and limit to 8
      activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setRecentActivities(activities.slice(0, 8));

    } catch (error) {
      console.error('Error fetching recent activities:', error);
      setRecentActivities([]);
    } finally {
      setActivitiesLoading(false);
    }
  };

  // Get activity icon based on type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'discussion':
        return '💬';
      case 'enrollment':
        return '🎉';
      case 'submission':
        return '📝';
      default:
        return '📢';
    }
  };

  // Get activity color based on type
  const getActivityColor = (type: string) => {
    switch (type) {
      case 'discussion':
        return 'border-blue-200 bg-blue-50';
      case 'enrollment':
        return 'border-green-200 bg-green-50';
      case 'submission':
        return 'border-purple-200 bg-purple-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  // Only show loading on the very first load when we have no data at all
  if (coursesLoading && !hasInitiallyLoaded) {
    return (
      <ProtectedRoute requiredRole="teacher">
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
          <DashboardHeader title="EdHub - Teacher" />
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">Loading dashboard...</div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="teacher">
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
        <DashboardHeader title="EdHub - Teacher" />

        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome back, Teacher!</h1>
            <p className="text-gray-600">Manage your courses and connect with your students.</p>
          </div>

          <DashboardStats stats={statsArray} />

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <EnhancedCourseManagement />
              <SubmissionManagement />
            </div>

            <div className="space-y-6">
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-blue-600" />
                    Recent Activities
                  </CardTitle>
                  <CardDescription>
                    Latest activities across your courses
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {activitiesLoading ? (
                    <div className="text-center py-4 text-gray-500">
                      <p className="text-sm">Loading activities...</p>
                    </div>
                  ) : recentActivities.length > 0 ? (
                    recentActivities.map((activity, index) => (
                      <div 
                        key={index} 
                        className={`p-3 border rounded-lg ${getActivityColor(activity.type)}`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-lg">{getActivityIcon(activity.type)}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800 text-sm mb-1">{activity.action}</p>
                            <p className="text-xs text-gray-600 mb-2 truncate">{activity.course}</p>
                            <span className="text-xs text-gray-500">{activity.time}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : userCourses.length === 0 ? (
                    <div className="text-center py-6 text-gray-500">
                      <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-sm font-medium mb-1">No courses yet</p>
                      <p className="text-xs">Create your first course to see activities here</p>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-sm font-medium mb-1">No recent activities</p>
                      <p className="text-xs">Activities will appear as students interact with your courses</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default TeacherDashboard;

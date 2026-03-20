import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users, Bell, BarChart3, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardStats from "@/components/dashboard/DashboardStats";
import EnhancedCourseManagement from "@/components/dashboard/EnhancedCourseManagement";
import SubmissionManagement from "@/components/dashboard/SubmissionManagement";
import { useCourseData } from "@/hooks/useCourseData";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface RecentActivity { action: string; course: string; time: string; type: 'discussion' | 'enrollment' | 'submission'; }
interface TeacherStats { totalStudents: number; averageRating: number; totalLessons: number; }

const TeacherDashboard = () => {
  const { user, userRole } = useAuth();
  const { t } = useLanguage();
  const { courses, loading: coursesLoading } = useCourseData();
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  const [teacherStats, setTeacherStats] = useState<TeacherStats>({ totalStudents: 0, averageRating: 0, totalLessons: 0 });
  const [statsLoading, setStatsLoading] = useState(false);

  const userCourses = courses.filter(course => course.instructor_id === user?.id);

  useEffect(() => {
    if (!coursesLoading && !hasInitiallyLoaded) {
      setHasInitiallyLoaded(true);
      if (user && userCourses.length > 0) { fetchRecentActivities(); fetchTeacherStats(); }
    }
  }, [coursesLoading, hasInitiallyLoaded, user, userCourses.length]);

  const fetchTeacherStats = async () => {
    if (!user || userCourses.length === 0) { setTeacherStats({ totalStudents: 0, averageRating: 0, totalLessons: 0 }); return; }
    setStatsLoading(true);
    try {
      const courseIds = userCourses.map(course => course.id);
      const { data: enrollments } = await supabase.from('course_enrollments').select('id').in('course_id', courseIds);
      const { data: lessons } = await supabase.from('lessons').select('id').in('course_id', courseIds);
      const coursesWithRatings = userCourses.filter(course => course.rating && course.rating > 0);
      const averageRating = coursesWithRatings.length > 0 ? coursesWithRatings.reduce((sum, course) => sum + (course.rating || 0), 0) / coursesWithRatings.length : 0;
      setTeacherStats({ totalStudents: enrollments?.length || 0, averageRating, totalLessons: lessons?.length || 0 });
    } catch (error) { console.error('Error:', error); setTeacherStats({ totalStudents: 0, averageRating: 0, totalLessons: 0 }); } finally { setStatsLoading(false); }
  };

  const statsArray = [
    { label: t('teacherDashboard.myCourses'), value: userCourses.length.toString(), icon: BookOpen, color: "text-blue-600" },
    { label: t('teacherDashboard.totalStudents'), value: teacherStats.totalStudents.toString(), icon: Users, color: "text-green-600" },
    { label: t('teacherDashboard.avgRating'), value: teacherStats.averageRating > 0 ? `${teacherStats.averageRating.toFixed(1)}/5` : t('teacherDashboard.noRatings'), icon: BarChart3, color: "text-purple-600" },
    { label: t('teacherDashboard.totalLessons'), value: teacherStats.totalLessons.toString(), icon: TrendingUp, color: "text-orange-600" }
  ];

  const fetchRecentActivities = async () => {
    if (!user || userCourses.length === 0) { setRecentActivities([]); return; }
    setActivitiesLoading(true);
    try {
      const courseIds = userCourses.map(course => course.id);
      const activities: RecentActivity[] = [];
      const { data: discussions } = await supabase.from('course_discussions').select('content, created_at, course_id, user_id').in('course_id', courseIds).order('created_at', { ascending: false }).limit(10);
      if (discussions) { for (const d of discussions) { const course = userCourses.find(c => c.id === d.course_id); if (course) activities.push({ action: "New discussion post", course: course.title, time: new Date(d.created_at).toLocaleString(), type: 'discussion' }); } }
      const { data: enrollments } = await supabase.from('course_enrollments').select('enrolled_at, course_id, user_id').in('course_id', courseIds).order('enrolled_at', { ascending: false }).limit(5);
      if (enrollments) { for (const e of enrollments) { const course = userCourses.find(c => c.id === e.course_id); if (course) activities.push({ action: "New student enrollment", course: course.title, time: new Date(e.enrolled_at).toLocaleString(), type: 'enrollment' }); } }
      const { data: assignments } = await supabase.from('assignments').select('id, title, course_id').in('course_id', courseIds);
      if (assignments && assignments.length > 0) {
        const { data: submissions } = await supabase.from('assignment_submissions').select('submitted_at, assignment_id').in('assignment_id', assignments.map(a => a.id)).order('submitted_at', { ascending: false }).limit(5);
        if (submissions) { for (const s of submissions) { const assignment = assignments.find(a => a.id === s.assignment_id); const course = userCourses.find(c => c.id === assignment?.course_id); if (course && assignment) activities.push({ action: `Assignment "${assignment.title}" submitted`, course: course.title, time: new Date(s.submitted_at).toLocaleString(), type: 'submission' }); } }
      }
      activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setRecentActivities(activities.slice(0, 8));
    } catch (error) { console.error('Error:', error); setRecentActivities([]); } finally { setActivitiesLoading(false); }
  };

  const getActivityIcon = (type: string) => { switch (type) { case 'discussion': return '💬'; case 'enrollment': return '🎉'; case 'submission': return '📝'; default: return '📢'; } };
  const getActivityColor = (type: string) => { switch (type) { case 'discussion': return 'border-blue-200 bg-blue-50'; case 'enrollment': return 'border-green-200 bg-green-50'; case 'submission': return 'border-purple-200 bg-purple-50'; default: return 'border-gray-200 bg-gray-50'; } };

  if (coursesLoading && !hasInitiallyLoaded) {
    return (<ProtectedRoute requiredRole="teacher"><div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50"><DashboardHeader title="EdHub - Teacher" /><div className="container mx-auto px-4 py-8"><div className="text-center">{t('dashboard.loadingDashboard')}</div></div></div></ProtectedRoute>);
  }

  return (
    <ProtectedRoute requiredRole="teacher">
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50">
        <DashboardHeader title="EdHub - Teacher" />
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('teacherDashboard.welcomeTeacher')}</h1>
            <p className="text-gray-600">{t('teacherDashboard.manageConnect')}</p>
          </div>
          <DashboardStats stats={statsArray} />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6"><EnhancedCourseManagement /><SubmissionManagement /></div>
            <div className="space-y-6">
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5 text-blue-600" />{t('teacherDashboard.recentActivities')}</CardTitle>
                  <CardDescription>{t('teacherDashboard.latestActivities')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {activitiesLoading ? (<div className="text-center py-4 text-gray-500"><p className="text-sm">{t('teacherDashboard.loadingActivities')}</p></div>
                  ) : recentActivities.length > 0 ? (
                    recentActivities.map((activity, index) => (
                      <div key={index} className={`p-3 border rounded-lg ${getActivityColor(activity.type)}`}>
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
                    <div className="text-center py-6 text-gray-500"><Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" /><p className="text-sm font-medium mb-1">{t('teacherDashboard.noCourses')}</p><p className="text-xs">{t('teacherDashboard.createFirst')}</p></div>
                  ) : (
                    <div className="text-center py-6 text-gray-500"><Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" /><p className="text-sm font-medium mb-1">{t('teacherDashboard.noRecentActivities')}</p><p className="text-xs">{t('teacherDashboard.activitiesWillAppear')}</p></div>
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

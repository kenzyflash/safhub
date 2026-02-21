
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Users, BookOpen, Trophy, Clock, TrendingUp, Target, Star } from "lucide-react";

interface ChildProgress {
  childId: string;
  childName: string;
  totalCourses: number;
  completedCourses: number;
  totalPoints: number;
  level: number;
  achievements: number;
  studyTimeThisWeek: number;
  recentActivity: string;
}

const ParentDashboard = () => {
  const { user } = useAuth();
  const [children, setChildren] = useState<ChildProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchChildrenProgress();
    }
  }, [user]);

  const fetchChildrenProgress = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get parent-child relationships
      const { data: relationships, error: relationshipsError } = await supabase
        .from('parent_child_relationships')
        .select('child_id')
        .eq('parent_id', user.id);

      if (relationshipsError || !relationships) {
        console.log('No children found or error:', relationshipsError);
        setChildren([]);
        return;
      }

      const childrenProgress: ChildProgress[] = [];

      for (const relationship of relationships) {
        const childId = relationship.child_id;
        
        // Get child profile
        const { data: childProfile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', childId)
          .single();

        const childName = childProfile 
          ? `${childProfile.first_name} ${childProfile.last_name}` 
          : 'Unknown Child';

        // Get course enrollments
        const { data: enrollments } = await supabase
          .from('course_enrollments')
          .select('course_id, progress')
          .eq('user_id', childId);

        const totalCourses = enrollments?.length || 0;
        const completedCourses = enrollments?.filter(e => (e.progress || 0) >= 100).length || 0;

        // Get user points and achievements
        const { data: userPoints } = await supabase
          .from('user_points')
          .select('total_points, level')
          .eq('user_id', childId)
          .single();

        const { data: achievements } = await supabase
          .from('user_achievements')
          .select('id')
          .eq('user_id', childId);

        // Get study time for this week
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        const { data: studySessions } = await supabase
          .from('study_sessions')
          .select('minutes_studied')
          .eq('user_id', childId)
          .gte('date', startOfWeek.toISOString().split('T')[0]);

        const studyTimeThisWeek = studySessions?.reduce((total, session) => 
          total + (session.minutes_studied || 0), 0) || 0;

        childrenProgress.push({
          childId,
          childName,
          totalCourses,
          completedCourses,
          totalPoints: userPoints?.total_points || 0,
          level: userPoints?.level || 1,
          achievements: achievements?.length || 0,
          studyTimeThisWeek,
          recentActivity: 'Active this week'
        });
      }

      setChildren(childrenProgress);
    } catch (error) {
      console.error('Error fetching children progress:', error);
      setChildren([]);
    } finally {
      setLoading(false);
    }
  };

  const totalStudyTime = children.reduce((total, child) => total + child.studyTimeThisWeek, 0);
  const totalAchievements = children.reduce((total, child) => total + child.achievements, 0);
  const averageProgress = children.length > 0 
    ? children.reduce((total, child) => 
        total + (child.totalCourses > 0 ? (child.completedCourses / child.totalCourses) * 100 : 0), 0
      ) / children.length 
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
        <DashboardHeader title="EdHub - Parent Dashboard" />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
      <DashboardHeader title="EdHub - Parent Dashboard" />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Parent Dashboard</h1>
          <p className="text-gray-600">Monitor your children's learning progress and achievements</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Children</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{children.length}</div>
              <p className="text-xs text-muted-foreground">Active learners</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Study Time This Week</CardTitle>
              <Clock className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(totalStudyTime / 60)}h</div>
              <p className="text-xs text-muted-foreground">{totalStudyTime} minutes total</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Achievements</CardTitle>
              <Trophy className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAchievements}</div>
              <p className="text-xs text-muted-foreground">Earned by all children</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Progress</CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(averageProgress)}%</div>
              <p className="text-xs text-muted-foreground">Course completion rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Children Progress Cards */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Children's Progress</h2>
          
          {children.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {children.map((child) => (
                <Card key={child.childId} className="bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{child.childName}</CardTitle>
                      <Badge variant="secondary">Level {child.level}</Badge>
                    </div>
                    <CardDescription>Learning progress and achievements</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <BookOpen className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium">{child.completedCourses}/{child.totalCourses}</p>
                          <p className="text-xs text-muted-foreground">Courses completed</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Star className="h-4 w-4 text-yellow-600" />
                        <div>
                          <p className="text-sm font-medium">{child.totalPoints}</p>
                          <p className="text-xs text-muted-foreground">Points earned</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Trophy className="h-4 w-4 text-emerald-600" />
                        <div>
                          <p className="text-sm font-medium">{child.achievements}</p>
                          <p className="text-xs text-muted-foreground">Achievements</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-purple-600" />
                        <div>
                          <p className="text-sm font-medium">{Math.round(child.studyTimeThisWeek / 60)}h</p>
                          <p className="text-xs text-muted-foreground">This week</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Course Progress</span>
                        <span>{child.totalCourses > 0 ? Math.round((child.completedCourses / child.totalCourses) * 100) : 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-emerald-600 h-2 rounded-full" 
                          style={{ 
                            width: `${child.totalCourses > 0 ? (child.completedCourses / child.totalCourses) * 100 : 0}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="text-center py-12">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Children Found</h3>
                <p className="text-gray-500">
                  No child accounts are linked to your parent account yet.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;

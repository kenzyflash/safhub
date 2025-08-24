
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Target, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface WeeklyGoal {
  id: string;
  study_hours_goal: number;
  lessons_goal: number;
  assignments_goal: number;
  week_start_date: string;
}

const StudyGoals = () => {
  const { user } = useAuth();
  const [weeklyGoal, setWeeklyGoal] = useState<WeeklyGoal | null>(null);
  const [progress, setProgress] = useState({
    studyHours: 0,
    lessons: 0,
    assignments: 0
  });

  useEffect(() => {
    if (user) {
      fetchWeeklyGoal();
      fetchProgress();
    }
  }, [user]);

  const fetchWeeklyGoal = async () => {
    if (!user) return;

    try {
      const startOfWeek = getStartOfWeek();
      const { data, error } = await supabase
        .from('weekly_goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_start_date', startOfWeek)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching weekly goal:', error);
        return;
      }

      setWeeklyGoal(data);
    } catch (error) {
      console.error('Error fetching weekly goal:', error);
    }
  };

  const fetchProgress = async () => {
    if (!user) return;

    try {
      const startOfWeek = getStartOfWeek();
      const endOfWeek = getEndOfWeek();

      // Fetch study hours for this week
      const { data: studySessions } = await supabase
        .from('study_sessions')
        .select('minutes_studied')
        .eq('user_id', user.id)
        .gte('date', startOfWeek)
        .lte('date', endOfWeek);

      const totalMinutes = studySessions?.reduce((sum, session) => sum + (session.minutes_studied || 0), 0) || 0;
      const studyHours = Math.round(totalMinutes / 60);

      // Fetch lessons completed this week
      const { data: lessonProgress } = await supabase
        .from('lesson_progress')
        .select('id')
        .eq('user_id', user.id)
        .eq('completed', true)
        .gte('completed_at', startOfWeek + 'T00:00:00Z')
        .lte('completed_at', endOfWeek + 'T23:59:59Z');

      // Fetch assignments completed this week
      const { data: assignmentSubmissions } = await supabase
        .from('assignment_submissions')
        .select('id')
        .eq('user_id', user.id)
        .gte('submitted_at', startOfWeek + 'T00:00:00Z')
        .lte('submitted_at', endOfWeek + 'T23:59:59Z');

      setProgress({
        studyHours,
        lessons: lessonProgress?.length || 0,
        assignments: assignmentSubmissions?.length || 0
      });
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const getStartOfWeek = () => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    return start.toISOString().split('T')[0];
  };

  const getEndOfWeek = () => {
    const now = new Date();
    const end = new Date(now);
    end.setDate(now.getDate() + (6 - now.getDay()));
    return end.toISOString().split('T')[0];
  };

  const createDefaultGoal = async () => {
    if (!user) return;

    try {
      const startOfWeek = getStartOfWeek();
      const { data, error } = await supabase
        .from('weekly_goals')
        .insert({
          user_id: user.id,
          week_start_date: startOfWeek,
          study_hours_goal: 15,
          lessons_goal: 10,
          assignments_goal: 3
        })
        .select()
        .single();

      if (error) throw error;
      setWeeklyGoal(data);
    } catch (error) {
      console.error('Error creating weekly goal:', error);
    }
  };

  if (!weeklyGoal) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-green-600" />
            Weekly Goals
          </CardTitle>
          <CardDescription>Set your learning targets for this week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <Target className="h-10 w-10 mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-500 mb-3">No goals set for this week</p>
            <Button onClick={createDefaultGoal} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Set Weekly Goals
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-green-600" />
          Weekly Goals
        </CardTitle>
        <CardDescription>Your progress this week</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Study Hours</span>
            <span>{progress.studyHours}/{weeklyGoal.study_hours_goal}h</span>
          </div>
          <Progress 
            value={(progress.studyHours / weeklyGoal.study_hours_goal) * 100} 
            className="h-2" 
          />
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Lessons Completed</span>
            <span>{progress.lessons}/{weeklyGoal.lessons_goal}</span>
          </div>
          <Progress 
            value={(progress.lessons / weeklyGoal.lessons_goal) * 100} 
            className="h-2" 
          />
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Assignments</span>
            <span>{progress.assignments}/{weeklyGoal.assignments_goal}</span>
          </div>
          <Progress 
            value={(progress.assignments / weeklyGoal.assignments_goal) * 100} 
            className="h-2" 
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default StudyGoals;


import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Target, Plus, Pencil, Check, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface WeeklyGoal {
  id: string;
  study_hours_goal: number;
  lessons_goal: number;
  assignments_goal: number;
  week_start_date: string;
}

const StudyGoals = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [weeklyGoal, setWeeklyGoal] = useState<WeeklyGoal | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState({ study_hours_goal: 15, lessons_goal: 10, assignments_goal: 3 });
  const [progress, setProgress] = useState({ studyHours: 0, lessons: 0, assignments: 0 });

  useEffect(() => {
    if (user) {
      fetchWeeklyGoal();
      fetchProgress();
    }
  }, [user]);

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
      if (data) {
        setEditValues({
          study_hours_goal: data.study_hours_goal,
          lessons_goal: data.lessons_goal,
          assignments_goal: data.assignments_goal
        });
      }
    } catch (error) {
      console.error('Error fetching weekly goal:', error);
    }
  };

  const fetchProgress = async () => {
    if (!user) return;
    try {
      const startOfWeek = getStartOfWeek();
      const endOfWeek = getEndOfWeek();

      const { data: studySessions } = await supabase
        .from('study_sessions')
        .select('minutes_studied')
        .eq('user_id', user.id)
        .gte('date', startOfWeek)
        .lte('date', endOfWeek);

      const totalMinutes = studySessions?.reduce((sum, session) => sum + (session.minutes_studied || 0), 0) || 0;
      const studyHours = Math.round(totalMinutes / 60);

      const { data: lessonProgress } = await supabase
        .from('lesson_progress')
        .select('id')
        .eq('user_id', user.id)
        .eq('completed', true)
        .gte('completed_at', startOfWeek + 'T00:00:00Z')
        .lte('completed_at', endOfWeek + 'T23:59:59Z');

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

  const createDefaultGoal = async () => {
    if (!user) return;
    try {
      const startOfWeek = getStartOfWeek();
      const { data, error } = await supabase
        .from('weekly_goals')
        .insert({
          user_id: user.id,
          week_start_date: startOfWeek,
          study_hours_goal: editValues.study_hours_goal,
          lessons_goal: editValues.lessons_goal,
          assignments_goal: editValues.assignments_goal
        })
        .select()
        .single();

      if (error) throw error;
      setWeeklyGoal(data);
      toast({ title: t('studyGoals.goalsSet') || 'Goals set!', description: t('studyGoals.goalsSetDesc') || 'Your weekly goals have been saved.' });
    } catch (error) {
      console.error('Error creating weekly goal:', error);
      toast({ title: t('common.error'), description: 'Failed to set goals.', variant: 'destructive' });
    }
  };

  const updateGoal = async () => {
    if (!user || !weeklyGoal) return;
    try {
      const { data, error } = await supabase
        .from('weekly_goals')
        .update({
          study_hours_goal: editValues.study_hours_goal,
          lessons_goal: editValues.lessons_goal,
          assignments_goal: editValues.assignments_goal
        })
        .eq('id', weeklyGoal.id)
        .select()
        .single();

      if (error) throw error;
      setWeeklyGoal(data);
      setIsEditing(false);
      toast({ title: t('studyGoals.goalsUpdated') || 'Goals updated!', description: t('studyGoals.goalsUpdatedDesc') || 'Your weekly goals have been updated.' });
    } catch (error) {
      console.error('Error updating weekly goal:', error);
      toast({ title: t('common.error'), description: 'Failed to update goals.', variant: 'destructive' });
    }
  };

  const goalProgressPercent = (current: number, goal: number) => {
    if (goal <= 0) return 0;
    return Math.min((current / goal) * 100, 100);
  };

  if (!weeklyGoal) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-green-600" />
            {t('studyGoals.weeklyGoals') || 'Weekly Goals'}
          </CardTitle>
          <CardDescription>{t('studyGoals.setTargets') || 'Set your learning targets for this week'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <Label>{t('studyGoals.studyHours') || 'Study Hours'}</Label>
              <Input type="number" min={1} max={100} value={editValues.study_hours_goal} onChange={e => setEditValues(v => ({ ...v, study_hours_goal: parseInt(e.target.value) || 1 }))} />
            </div>
            <div>
              <Label>{t('studyGoals.lessonsCompleted') || 'Lessons to Complete'}</Label>
              <Input type="number" min={1} max={100} value={editValues.lessons_goal} onChange={e => setEditValues(v => ({ ...v, lessons_goal: parseInt(e.target.value) || 1 }))} />
            </div>
            <div>
              <Label>{t('studyGoals.assignments') || 'Assignments'}</Label>
              <Input type="number" min={1} max={50} value={editValues.assignments_goal} onChange={e => setEditValues(v => ({ ...v, assignments_goal: parseInt(e.target.value) || 1 }))} />
            </div>
          </div>
          <Button onClick={createDefaultGoal} className="w-full">
            <Plus className="h-4 w-4 mr-1" />
            {t('studyGoals.setGoals') || 'Set Weekly Goals'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-green-600" />
            {t('studyGoals.weeklyGoals') || 'Weekly Goals'}
          </CardTitle>
          {!isEditing ? (
            <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
              <Pencil className="h-4 w-4" />
            </Button>
          ) : (
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={updateGoal}>
                <Check className="h-4 w-4 text-green-600" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => { setIsEditing(false); setEditValues({ study_hours_goal: weeklyGoal.study_hours_goal, lessons_goal: weeklyGoal.lessons_goal, assignments_goal: weeklyGoal.assignments_goal }); }}>
                <X className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          )}
        </div>
        <CardDescription>{t('studyGoals.progressThisWeek') || 'Your progress this week'}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <div className="space-y-3">
            <div>
              <Label>{t('studyGoals.studyHours') || 'Study Hours'}</Label>
              <Input type="number" min={1} max={100} value={editValues.study_hours_goal} onChange={e => setEditValues(v => ({ ...v, study_hours_goal: parseInt(e.target.value) || 1 }))} />
            </div>
            <div>
              <Label>{t('studyGoals.lessonsCompleted') || 'Lessons to Complete'}</Label>
              <Input type="number" min={1} max={100} value={editValues.lessons_goal} onChange={e => setEditValues(v => ({ ...v, lessons_goal: parseInt(e.target.value) || 1 }))} />
            </div>
            <div>
              <Label>{t('studyGoals.assignments') || 'Assignments'}</Label>
              <Input type="number" min={1} max={50} value={editValues.assignments_goal} onChange={e => setEditValues(v => ({ ...v, assignments_goal: parseInt(e.target.value) || 1 }))} />
            </div>
          </div>
        ) : (
          <>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>{t('studyGoals.studyHours') || 'Study Hours'}</span>
                <span>{progress.studyHours}/{weeklyGoal.study_hours_goal}h</span>
              </div>
              <Progress value={goalProgressPercent(progress.studyHours, weeklyGoal.study_hours_goal)} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>{t('studyGoals.lessonsCompleted') || 'Lessons Completed'}</span>
                <span>{progress.lessons}/{weeklyGoal.lessons_goal}</span>
              </div>
              <Progress value={goalProgressPercent(progress.lessons, weeklyGoal.lessons_goal)} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>{t('studyGoals.assignments') || 'Assignments'}</span>
                <span>{progress.assignments}/{weeklyGoal.assignments_goal}</span>
              </div>
              <Progress value={goalProgressPercent(progress.assignments, weeklyGoal.assignments_goal)} className="h-2" />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default StudyGoals;

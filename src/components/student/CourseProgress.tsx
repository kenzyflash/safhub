
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { BookOpen, PlayCircle, StopCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Course {
  id: string;
  title: string;
  description: string;
  progress: number;
  instructor_name: string;
  image_url?: string;
}

interface CourseProgressProps {
  courses: Course[];
  onUnenroll?: () => void;
}

const CourseProgress = ({ courses, onUnenroll }: CourseProgressProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [unenrollCourse, setUnenrollCourse] = useState<Course | null>(null);
  const [unenrolling, setUnenrolling] = useState(false);

  const handleUnenroll = async () => {
    if (!user || !unenrollCourse) return;
    setUnenrolling(true);
    try {
      // Delete lesson progress first
      await supabase
        .from('lesson_progress')
        .delete()
        .eq('user_id', user.id)
        .eq('course_id', unenrollCourse.id);

      // Delete enrollment
      const { error } = await supabase
        .from('course_enrollments')
        .delete()
        .eq('user_id', user.id)
        .eq('course_id', unenrollCourse.id);

      if (error) throw error;

      toast({
        title: "Unenrolled",
        description: `You have been unenrolled from "${unenrollCourse.title}".`,
      });
      onUnenroll?.();
    } catch (error) {
      console.error('Unenroll error:', error);
      toast({
        title: "Error",
        description: "Failed to unenroll from the course.",
        variant: "destructive",
      });
    } finally {
      setUnenrolling(false);
      setUnenrollCourse(null);
    }
  };

  if (courses.length === 0) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            My Courses
          </CardTitle>
          <CardDescription>Your enrolled courses and progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 mb-4">You haven't enrolled in any courses yet.</p>
            <Button asChild>
              <Link to="/courses">Browse Courses</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            My Courses
          </CardTitle>
          <CardDescription>Continue your learning journey</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {courses.map((course) => (
              <div key={course.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 mb-1">{course.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{course.instructor_name}</p>
                    <div className="flex items-center gap-2 mb-2">
                      <Progress value={course.progress} className="flex-1 h-2" />
                      <span className="text-sm text-gray-500">{course.progress}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link to={`/course/${course.id}`} className="flex items-center gap-1">
                          <PlayCircle className="h-4 w-4" />
                          Continue Learning
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setUnenrollCourse(course)}
                      >
                        <StopCircle className="h-4 w-4 mr-1" />
                        Stop Learning
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!unenrollCourse} onOpenChange={(open) => !open && setUnenrollCourse(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unenroll from course?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unenroll from "{unenrollCourse?.title}"? Your lesson progress will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={unenrolling}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnenroll}
              disabled={unenrolling}
              className="bg-red-600 hover:bg-red-700"
            >
              {unenrolling ? "Unenrolling..." : "Yes, unenroll"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CourseProgress;

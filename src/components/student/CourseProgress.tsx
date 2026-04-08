/**
 * CourseProgress.tsx
 * -------------------
 * Displays the student's enrolled courses with progress bars on the
 * Student Dashboard. Each course card includes:
 *  - Course title, instructor, and progress percentage
 *  - "Continue Learning" link to the course page
 *  - "Stop Learning" button to unenroll (with confirmation dialog)
 *
 * See docs/FEATURES-DISCUSSED.md #8 (Multi-Course Enrollment) and
 * #9 (Unenroll / "Stop Learning" Feature) for context.
 */

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

/** Shape of a course object passed from the parent dashboard */
interface Course {
  id: string;               // Course UUID
  title: string;             // Course title for display
  description: string;       // Course description
  progress: number;          // Completion percentage (0-100)
  instructor_name: string;   // Name of the course instructor
  image_url?: string;        // Optional course thumbnail URL
}

/** Props accepted by the CourseProgress component */
interface CourseProgressProps {
  courses: Course[];          // List of enrolled courses to display
  onUnenroll?: () => void;    // Callback fired after successful unenrollment to refresh parent data
}

const CourseProgress = ({ courses, onUnenroll }: CourseProgressProps) => {
  // Get current user from auth context (needed for scoping delete operations)
  const { user } = useAuth();
  // Toast hook for showing success/error notifications
  const { toast } = useToast();
  // Track which course the unenroll dialog is open for (null = dialog closed)
  const [unenrollCourse, setUnenrollCourse] = useState<Course | null>(null);
  // Loading state for the unenroll operation (disables buttons during request)
  const [unenrolling, setUnenrolling] = useState(false);

  /**
   * Handle the unenroll confirmation action.
   * 1. Deletes all lesson_progress records for this user + course
   * 2. Deletes the course_enrollment record
   * 3. Shows a success/error toast
   * 4. Calls the parent's onUnenroll callback to refresh the course list
   *
   * Security: DELETE operations are scoped by RLS policy (auth.uid() = user_id)
   */
  const handleUnenroll = async () => {
    // Guard: require both user and a selected course
    if (!user || !unenrollCourse) return;
    setUnenrolling(true); // Show loading state on the confirm button

    try {
      // Step 1: Delete lesson progress first (to avoid orphaned records)
      await supabase
        .from('lesson_progress')
        .delete()
        .eq('user_id', user.id)
        .eq('course_id', unenrollCourse.id);

      // Step 2: Delete the enrollment record itself
      const { error } = await supabase
        .from('course_enrollments')
        .delete()
        .eq('user_id', user.id)
        .eq('course_id', unenrollCourse.id);

      // Throw if the enrollment deletion failed
      if (error) throw error;

      // Show success notification with the course title
      toast({
        title: "Unenrolled",
        description: `You have been unenrolled from "${unenrollCourse.title}".`,
      });

      // Notify parent to refresh the enrolled courses list
      onUnenroll?.();
    } catch (error) {
      console.error('Unenroll error:', error);
      // Show error notification if anything went wrong
      toast({
        title: "Error",
        description: "Failed to unenroll from the course.",
        variant: "destructive",
      });
    } finally {
      setUnenrolling(false);      // Reset loading state
      setUnenrollCourse(null);    // Close the confirmation dialog
    }
  };

  // ─── Empty state: no enrolled courses ──────────────────────────────
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
            {/* Link to the courses discovery page */}
            <Button asChild>
              <Link to="/courses">Browse Courses</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ─── Main render: list of enrolled courses with progress ───────────
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
            {/* Render each enrolled course as a card */}
            {courses.map((course) => (
              <div key={course.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  {/* Course icon placeholder */}
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    {/* Course title */}
                    <h3 className="font-semibold text-gray-800 mb-1">{course.title}</h3>
                    {/* Instructor name */}
                    <p className="text-sm text-gray-600 mb-2">{course.instructor_name}</p>
                    {/* Progress bar with percentage */}
                    <div className="flex items-center gap-2 mb-2">
                      <Progress value={course.progress} className="flex-1 h-2" />
                      <span className="text-sm text-gray-500">{course.progress}%</span>
                    </div>
                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      {/* Navigate to the course page to continue learning */}
                      <Button size="sm" variant="outline" asChild>
                        <Link to={`/course/${course.id}`} className="flex items-center gap-1">
                          <PlayCircle className="h-4 w-4" />
                          Continue Learning
                        </Link>
                      </Button>
                      {/* Open unenroll confirmation dialog */}
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

      {/* Unenroll Confirmation Dialog */}
      <AlertDialog open={!!unenrollCourse} onOpenChange={(open) => !open && setUnenrollCourse(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unenroll from course?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unenroll from "{unenrollCourse?.title}"? Your lesson progress will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {/* Cancel button — disabled during the unenroll request */}
            <AlertDialogCancel disabled={unenrolling}>Cancel</AlertDialogCancel>
            {/* Confirm button — styled red, shows loading text during request */}
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

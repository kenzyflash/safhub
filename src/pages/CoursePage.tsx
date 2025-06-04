
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, 
  CheckCircle, 
  Clock, 
  Users, 
  Star,
  ArrowLeft,
  Download,
  MessageSquare
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import ProfileDropdown from "@/components/ProfileDropdown";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import VideoPlayer from "@/components/course/VideoPlayer";
import CourseDiscussion from "@/components/course/CourseDiscussion";
import AssignmentSubmission from "@/components/course/AssignmentSubmission";

interface Course {
  id: string;
  title: string;
  description: string;
  instructor_name: string;
  duration: string;
  student_count: number;
  rating: number;
  image_url: string;
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  video_url: string;
  duration_minutes: number;
  order_index: number;
}

interface LessonProgress {
  lesson_id: string;
  completed: boolean;
  watch_time_minutes: number;
}

const CoursePage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user, userRole, loading } = useAuth();
  const { toast } = useToast();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState(0);
  const [lessonProgress, setLessonProgress] = useState<LessonProgress[]>([]);
  const [courseLoading, setCourseLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (courseId && user) {
      fetchCourseData();
      fetchLessonProgress();
    }
  }, [courseId, user]);

  const fetchCourseData = async () => {
    if (!courseId) return;

    try {
      // Fetch course details
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      // Fetch lessons
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

      if (lessonsError) throw lessonsError;
      setLessons(lessonsData || []);
    } catch (error) {
      console.error('Error fetching course data:', error);
      toast({
        title: "Error",
        description: "Failed to load course data",
        variant: "destructive"
      });
    } finally {
      setCourseLoading(false);
    }
  };

  const fetchLessonProgress = async () => {
    if (!user || !courseId) return;

    try {
      const { data, error } = await supabase
        .from('lesson_progress')
        .select('lesson_id, completed, watch_time_minutes')
        .eq('user_id', user.id)
        .eq('course_id', courseId);

      if (error) throw error;
      setLessonProgress(data || []);
    } catch (error) {
      console.error('Error fetching lesson progress:', error);
    }
  };

  const updateWatchTime = async (lessonId: string, minutes: number) => {
    if (!user || !courseId) return;

    try {
      await supabase
        .from('lesson_progress')
        .upsert({
          user_id: user.id,
          lesson_id: lessonId,
          course_id: courseId,
          watch_time_minutes: minutes
        });
    } catch (error) {
      console.error('Error updating watch time:', error);
    }
  };

  const markLessonComplete = async (lessonId: string) => {
    if (!user || !courseId) return;

    try {
      await supabase
        .from('lesson_progress')
        .upsert({
          user_id: user.id,
          lesson_id: lessonId,
          course_id: courseId,
          completed: true,
          completed_at: new Date().toISOString()
        });

      await fetchLessonProgress();
      
      // Log study session
      const currentLesson = lessons.find(l => l.id === lessonId);
      if (currentLesson) {
        const today = new Date().toISOString().split('T')[0];
        await supabase.rpc('increment_study_minutes', {
          p_user_id: user.id,
          p_date: today,
          p_minutes: currentLesson.duration_minutes
        });
      }

      toast({
        title: "Lesson completed!",
        description: "Great job! Keep up the good work.",
      });
    } catch (error) {
      console.error('Error marking lesson complete:', error);
      toast({
        title: "Error",
        description: "Failed to mark lesson as complete",
        variant: "destructive"
      });
    }
  };

  const isLessonCompleted = (lessonId: string) => {
    return lessonProgress.some(p => p.lesson_id === lessonId && p.completed);
  };

  const getCompletedLessonsCount = () => {
    return lessonProgress.filter(p => p.completed).length;
  };

  const getCourseProgress = () => {
    if (lessons.length === 0) return 0;
    return Math.round((getCompletedLessonsCount() / lessons.length) * 100);
  };

  const getDashboardUrl = () => {
    if (userRole === 'admin') return '/admin-dashboard';
    if (userRole === 'teacher') return '/teacher-dashboard';
    return '/student-dashboard';
  };

  if (loading || courseLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-16 w-16 text-emerald-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !course) {
    return null;
  }

  const currentLesson = lessons[selectedLesson];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate(getDashboardUrl())}>
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-emerald-600" />
              <h1 className="text-2xl font-bold text-gray-800">EthioLearn</h1>
            </div>
          </div>
          <ProfileDropdown />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Course Header */}
        <div className="mb-8">
          <div className="flex items-start gap-6">
            <img 
              src={course.image_url || "/placeholder.svg"}
              alt={course.title}
              className="w-32 h-32 rounded-lg object-cover"
            />
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{course.title}</h1>
              <p className="text-gray-600 mb-4">by {course.instructor_name}</p>
              <p className="text-gray-700 mb-4">{course.description}</p>
              
              <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {course.duration}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {course.student_count?.toLocaleString()} students
                </span>
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  {course.rating}
                </span>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Course Progress</span>
                  <span>{getCompletedLessonsCount()}/{lessons.length} lessons completed</span>
                </div>
                <Progress value={getCourseProgress()} className="h-2" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Video and Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="video" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="video">Video Lesson</TabsTrigger>
                <TabsTrigger value="discussion">Discussion</TabsTrigger>
                <TabsTrigger value="assignments">Assignments</TabsTrigger>
              </TabsList>

              <TabsContent value="video" className="space-y-6">
                {currentLesson && (
                  <Card className="bg-white/80 backdrop-blur-sm">
                    <CardContent className="p-0">
                      <VideoPlayer
                        videoUrl={currentLesson.video_url}
                        title={currentLesson.title}
                        duration={currentLesson.duration_minutes}
                        onWatchTimeUpdate={(minutes) => updateWatchTime(currentLesson.id, minutes)}
                        onComplete={() => markLessonComplete(currentLesson.id)}
                      />
                      
                      <div className="p-6">
                        <h2 className="text-xl font-semibold mb-2">{currentLesson.title}</h2>
                        <p className="text-gray-600 mb-4">{currentLesson.description}</p>
                        
                        <div className="flex items-center gap-4">
                          <Button 
                            onClick={() => markLessonComplete(currentLesson.id)}
                            disabled={isLessonCompleted(currentLesson.id)}
                            className={`${
                              isLessonCompleted(currentLesson.id) 
                                ? 'bg-green-600 hover:bg-green-700' 
                                : 'bg-emerald-600 hover:bg-emerald-700'
                            }`}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            {isLessonCompleted(currentLesson.id) ? 'Completed' : 'Mark as Complete'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="discussion">
                <CourseDiscussion courseId={courseId!} />
              </TabsContent>

              <TabsContent value="assignments">
                <AssignmentSubmission courseId={courseId!} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Course Outline */}
          <div>
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Course Lessons</CardTitle>
                <CardDescription>
                  {getCompletedLessonsCount()} of {lessons.length} lessons completed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {lessons.map((lesson, index) => (
                    <div
                      key={lesson.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedLesson === index
                          ? 'bg-emerald-50 border-emerald-200'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedLesson(index)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm text-gray-800 mb-1">
                            {lesson.title}
                          </h4>
                          <p className="text-xs text-gray-600">{lesson.duration_minutes} min</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {isLessonCompleted(lesson.id) && (
                            <CheckCircle className="h-4 w-4 text-emerald-600" />
                          )}
                          <Badge variant={selectedLesson === index ? "default" : "secondary"} className="text-xs">
                            {index + 1}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursePage;

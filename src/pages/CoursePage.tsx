
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
  MessageSquare,
  X,
  AlertCircle,
  RefreshCw,
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

const LOADING_TIMEOUT = 10000; // 10 seconds
const MAX_RETRY_ATTEMPTS = 3;

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
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Timeout for loading states
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (courseLoading) {
        console.log('Loading timeout reached');
        setError('Loading is taking longer than expected. Please try refreshing the page.');
        setCourseLoading(false);
      }
    }, LOADING_TIMEOUT);

    return () => clearTimeout(timeoutId);
  }, [courseLoading]);

  // Authentication redirect with timeout
  useEffect(() => {
    if (!loading && !user) {
      console.log('User not authenticated, redirecting to home');
      navigate("/");
      return;
    }
  }, [user, loading, navigate]);

  // Fetch course data with retry mechanism
  useEffect(() => {
    if (courseId && user && !loading) {
      console.log('Fetching course data for:', courseId);
      fetchCourseDataWithRetry();
    }
  }, [courseId, user, loading, retryCount]);

  const fetchCourseDataWithRetry = async () => {
    try {
      setCourseLoading(true);
      setError(null);
      
      await Promise.all([
        fetchCourseData(),
        fetchLessonProgress()
      ]);
    } catch (error) {
      console.error('Error in fetchCourseDataWithRetry:', error);
      if (retryCount < MAX_RETRY_ATTEMPTS) {
        console.log(`Retrying... attempt ${retryCount + 1}`);
        setRetryCount(prev => prev + 1);
      } else {
        setError('Failed to load course data. Please try refreshing the page.');
        setCourseLoading(false);
      }
    }
  };

  const fetchCourseData = async () => {
    if (!courseId) {
      throw new Error('Course ID is required');
    }

    try {
      console.log('Fetching course details...');
      // Fetch course details with timeout
      const coursePromise = supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .maybeSingle();

      const lessonsPromise = supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

      const [courseResult, lessonsResult] = await Promise.all([
        coursePromise,
        lessonsPromise
      ]);

      if (courseResult.error) {
        console.error('Course fetch error:', courseResult.error);
        throw courseResult.error;
      }

      if (lessonsResult.error) {
        console.error('Lessons fetch error:', lessonsResult.error);
        throw lessonsResult.error;
      }

      if (!courseResult.data) {
        throw new Error('Course not found');
      }

      console.log('Course data loaded successfully');
      setCourse(courseResult.data);
      setLessons(lessonsResult.data || []);
      setCourseLoading(false);
    } catch (error) {
      console.error('Error fetching course data:', error);
      throw error;
    }
  };

  const fetchLessonProgress = async () => {
    if (!user || !courseId) return;

    try {
      console.log('Fetching lesson progress...');
      const { data, error } = await supabase
        .from('lesson_progress')
        .select('lesson_id, completed, watch_time_minutes')
        .eq('user_id', user.id)
        .eq('course_id', courseId);

      if (error) {
        console.error('Lesson progress fetch error:', error);
        // Don't throw here, lesson progress is not critical
        return;
      }

      console.log('Lesson progress loaded');
      setLessonProgress(data || []);
    } catch (error) {
      console.error('Error fetching lesson progress:', error);
      // Don't throw here, lesson progress is not critical
    }
  };

  const updateWatchTime = async (lessonId: string, minutes: number) => {
    if (!user || !courseId) return;

    try {
      const { error } = await supabase
        .from('lesson_progress')
        .upsert({
          user_id: user.id,
          lesson_id: lessonId,
          course_id: courseId,
          watch_time_minutes: minutes
        }, {
          onConflict: 'user_id,lesson_id'
        });

      if (error) {
        console.error('Error updating watch time:', error);
      }
    } catch (error) {
      console.error('Error updating watch time:', error);
    }
  };

  const markLessonComplete = async (lessonId: string) => {
    if (!user || !courseId) return;

    const alreadyCompleted = isLessonCompleted(lessonId);
    if (alreadyCompleted) {
      return;
    }

    try {
      const { error } = await supabase
        .from('lesson_progress')
        .upsert({
          user_id: user.id,
          lesson_id: lessonId,
          course_id: courseId,
          completed: true,
          completed_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,lesson_id'
        });

      if (error) throw error;

      await fetchLessonProgress();
      
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

      if (selectedLesson < lessons.length - 1) {
        setSelectedLesson(selectedLesson + 1);
      }
    } catch (error) {
      console.error('Error marking lesson complete:', error);
      toast({
        title: "Error",
        description: "Failed to mark lesson as complete",
        variant: "destructive"
      });
    }
  };

  const removeLessonComplete = async (lessonId: string) => {
    if (!user || !courseId) return;

    try {
      console.log('Removing completion for lesson:', lessonId);
      
      const { error: updateError } = await supabase
        .from('lesson_progress')
        .update({
          completed: false,
          completed_at: null
        })
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .eq('course_id', courseId);

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      await fetchLessonProgress();

      toast({
        title: "Completion removed",
        description: "Lesson marked as incomplete.",
      });
    } catch (error) {
      console.error('Error removing lesson completion:', error);
      toast({
        title: "Error",
        description: "Failed to remove lesson completion",
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

  const handleRetry = () => {
    setRetryCount(0);
    setError(null);
    fetchCourseDataWithRetry();
  };

  // Show loading state with timeout
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-16 w-16 text-emerald-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show error state with retry option
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Unable to Load Course</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-2">
            <Button onClick={handleRetry} className="bg-emerald-600 hover:bg-emerald-700">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button variant="outline" onClick={() => navigate(getDashboardUrl())}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show course loading state
  if (courseLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-16 w-16 text-emerald-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading course content...</p>
          <p className="text-sm text-gray-500 mt-2">This should only take a moment</p>
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
              <h1 className="text-2xl font-bold text-gray-800">EdHub</h1>
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
                          {isLessonCompleted(currentLesson.id) ? (
                            <div className="flex gap-2">
                              <Button 
                                disabled
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Completed
                              </Button>
                              <Button 
                                variant="outline"
                                onClick={() => removeLessonComplete(currentLesson.id)}
                                className="border-red-200 text-red-600 hover:bg-red-50"
                              >
                                <X className="mr-2 h-4 w-4" />
                                Remove Completion
                              </Button>
                            </div>
                          ) : (
                            <Button 
                              onClick={() => markLessonComplete(currentLesson.id)}
                              className="bg-emerald-600 hover:bg-emerald-700"
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Mark as Complete
                            </Button>
                          )}
                          
                          <div className="flex gap-2">
                            {selectedLesson > 0 && (
                              <Button 
                                variant="outline"
                                onClick={() => setSelectedLesson(selectedLesson - 1)}
                              >
                                Previous Lesson
                              </Button>
                            )}
                            {selectedLesson < lessons.length - 1 && (
                              <Button 
                                variant="outline"
                                onClick={() => setSelectedLesson(selectedLesson + 1)}
                              >
                                Next Lesson
                              </Button>
                            )}
                          </div>
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

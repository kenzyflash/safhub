/**
 * Courses.tsx
 * ------------
 * Public course discovery page. Allows users to:
 *  - Browse all available courses
 *  - Search by title, instructor, or description
 *  - Filter by category and difficulty level
 *  - Enroll in courses (or continue learning if already enrolled)
 *
 * Enrollment status is fetched per-user to toggle between
 * "Enroll Now" and "Continue Learning" buttons.
 *
 * See docs/FEATURES-DISCUSSED.md #8 (Multi-Course Enrollment) for context.
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Search, Star, Clock, Users, Play, Filter } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link, useNavigate } from "react-router-dom";
import LoginModal from "@/components/auth/LoginModal";
import RegisterModal from "@/components/auth/RegisterModal";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

/** Shape of a course record fetched from the database */
interface CourseData {
  id: string;                    // Course UUID
  title: string;                 // Course title
  instructor_name: string;       // Instructor display name
  category: string | null;       // Course category for filtering
  level: string | null;          // Difficulty level for filtering
  duration: string | null;       // Human-readable duration string
  student_count: number | null;  // Number of enrolled students
  rating: number | null;         // Average rating (0-5)
  image_url: string | null;      // Thumbnail URL
  price: string | null;          // Price label
  description: string | null;    // Course description text
}

const Courses = () => {
  // ─── State ─────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");                             // Search input value
  const [selectedCategory, setSelectedCategory] = useState("all");              // Category filter
  const [selectedLevel, setSelectedLevel] = useState("all");                    // Level filter
  const [showLogin, setShowLogin] = useState(false);                            // Login modal visibility
  const [showRegister, setShowRegister] = useState(false);                      // Register modal visibility
  const [courses, setCourses] = useState<CourseData[]>([]);                     // All courses from DB
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(new Set()); // IDs of courses user is enrolled in
  const [loading, setLoading] = useState(true);                                 // Loading indicator

  // ─── Hooks ─────────────────────────────────────────────────────────
  const { user } = useAuth();            // Current authenticated user (or null)
  const { t } = useLanguage();           // Translation function for i18n
  const { toast } = useToast();          // Toast notifications
  const navigate = useNavigate();        // Programmatic navigation

  // Fetch courses on mount
  useEffect(() => {
    fetchCourses();
  }, []);

  // Fetch user's enrollments whenever the user changes (login/logout)
  useEffect(() => {
    if (user) fetchEnrollments();
  }, [user]);

  /**
   * Fetch all courses from the database, ordered by newest first.
   * Only selects columns needed for the course cards.
   */
  const fetchCourses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, instructor_name, category, level, duration, student_count, rating, image_url, price, description')
        .order('created_at', { ascending: false }); // Newest courses first

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch the current user's enrolled course IDs.
   * Stored as a Set for O(1) lookups when rendering the button state.
   */
  const fetchEnrollments = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('course_enrollments')
        .select('course_id')          // Only need the course ID
        .eq('user_id', user.id);      // Scoped to current user
      // Convert to a Set for fast membership checks
      setEnrolledCourseIds(new Set((data || []).map(e => e.course_id)));
    } catch (e) {
      console.error('Error fetching enrollments:', e);
    }
  };

  // ─── Filter options ────────────────────────────────────────────────
  // Category options with translation keys
  const categories = [
    { value: "all", labelKey: "courses.allCategories" },
    { value: "mathematics", labelKey: "courses.mathematics" },
    { value: "science", labelKey: "courses.science" },
    { value: "english", labelKey: "courses.english" },
    { value: "social-studies", labelKey: "courses.socialStudies" },
    { value: "amharic", labelKey: "courses.amharic" },
    { value: "geography", labelKey: "courses.geography" }
  ];

  // Level options with translation keys
  const levels = [
    { value: "all", labelKey: "courses.allLevels" },
    { value: "beginner", labelKey: "courses.beginner" },
    { value: "intermediate", labelKey: "courses.intermediate" },
    { value: "advanced", labelKey: "courses.advanced" }
  ];

  /**
   * Apply search term, category, and level filters to the courses list.
   * Search matches against title, instructor name, and description.
   */
  const filteredCourses = courses.filter(course => {
    // Text search: match against title, instructor, or description
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.instructor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (course.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    // Category filter: "all" matches everything
    const matchesCategory = selectedCategory === "all" || course.category === selectedCategory;
    // Level filter: "all" matches everything, case-insensitive comparison
    const matchesLevel = selectedLevel === "all" || (course.level || '').toLowerCase() === selectedLevel;
    return matchesSearch && matchesCategory && matchesLevel;
  });

  /** Switch from login modal to register modal */
  const handleSwitchToRegister = () => { setShowLogin(false); setShowRegister(true); };
  /** Switch from register modal to login modal */
  const handleSwitchToLogin = () => { setShowRegister(false); setShowLogin(true); };

  /**
   * Handle the "Enroll Now" button click for a specific course.
   * If user is not logged in, shows the register modal.
   * If already enrolled, navigates to the course page.
   * Otherwise, creates a new enrollment and navigates to the course.
   */
  const handleEnrollClick = async (courseId: string) => {
    // If not authenticated, prompt registration
    if (!user) {
      setShowRegister(true);
      return;
    }
    try {
      // Check if the user is already enrolled in this course
      const { data: existing } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .maybeSingle();

      // If already enrolled, just navigate to the course page
      if (existing) {
        navigate(`/course/${courseId}`);
        return;
      }

      // Create new enrollment with 0% initial progress
      const { error } = await supabase
        .from('course_enrollments')
        .insert({ user_id: user.id, course_id: courseId, progress: 0 });

      if (error) {
        // Handle race condition: duplicate key means already enrolled
        if (error.code === '23505') {
          navigate(`/course/${courseId}`);
          return;
        }
        throw error;
      }

      // Show success notification and navigate to the course
      toast({ title: t('courses.enrolled') || 'Enrolled!', description: t('courses.enrolledDesc') || 'You have been enrolled in the course.' });
      navigate(`/course/${courseId}`);
    } catch (error) {
      console.error('Enrollment error:', error);
      toast({ title: t('common.error'), description: 'Failed to enroll.', variant: 'destructive' });
    }
  };

  // ─── Render ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50">
      {/* Site header with navigation */}
      <Header />

      <section className="container mx-auto px-4 py-16">
        {/* Page title and subtitle */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">{t('courses.pageTitle')}</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">{t('courses.pageSubtitle')}</p>
        </div>

        {/* Search and filter bar */}
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 mb-12 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            {/* Search input with icon */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input placeholder={t('courses.searchPlaceholder')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            {/* Filter dropdowns */}
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">{t('courses.filterBy')}</span>
              </div>
              {/* Category filter dropdown */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map(cat => <SelectItem key={cat.value} value={cat.value}>{t(cat.labelKey)}</SelectItem>)}
                </SelectContent>
              </Select>
              {/* Level filter dropdown */}
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {levels.map(level => <SelectItem key={level.value} value={level.value}>{t(level.labelKey)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="mb-6">
          <p className="text-gray-600">
            {loading ? t('common.loading') + '...' : `${t('courses.showing')} ${filteredCourses.length} ${t('courses.courses')}`}
          </p>
        </div>

        {/* Course grid — loading state or course cards */}
        {loading ? (
          // Loading spinner
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-primary mx-auto mb-4 animate-pulse" />
            <p className="text-gray-500">{t('common.loading')}...</p>
          </div>
        ) : (
          // Course cards grid
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map((course) => (
              <Card key={course.id} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white/80 backdrop-blur-sm">
                {/* Course thumbnail with level and price badges */}
                <div className="relative">
                  <img src={course.image_url || "/placeholder.svg"} alt={course.title} className="w-full h-48 object-cover rounded-t-lg" />
                  {/* Difficulty level badge (top-left) */}
                  {course.level && <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground">{course.level}</Badge>}
                  {/* Price badge (top-right) */}
                  <Badge variant="secondary" className="absolute top-3 right-3">{course.price || 'Free'}</Badge>
                </div>
                <CardHeader>
                  <CardTitle className="text-xl text-gray-800 line-clamp-2">{course.title}</CardTitle>
                  <CardDescription className="text-gray-600">{t('common.by')} {course.instructor_name}</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Course description (clamped to 3 lines) */}
                  <p className="text-gray-600 mb-4 line-clamp-3">{course.description}</p>
                  {/* Course metadata: duration, students, rating */}
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    {course.duration && <div className="flex items-center"><Clock className="h-4 w-4 mr-1" />{course.duration}</div>}
                    <div className="flex items-center"><Users className="h-4 w-4 mr-1" />{(course.student_count || 0).toLocaleString()} {t('common.students')}</div>
                    {course.rating ? <div className="flex items-center"><Star className="h-4 w-4 mr-1 fill-yellow-400 text-yellow-400" />{course.rating}</div> : null}
                  </div>
                  {/* Action button: "Continue Learning" if enrolled, "Enroll Now" otherwise */}
                  {enrolledCourseIds.has(course.id) ? (
                    <Button asChild className="w-full" variant="secondary">
                      <Link to={`/course/${course.id}`}>
                        <Play className="mr-2 h-4 w-4" />{t('courses.continueLearning') || 'Continue Learning'}
                      </Link>
                    </Button>
                  ) : (
                    <Button onClick={() => handleEnrollClick(course.id)} className="w-full">
                      <Play className="mr-2 h-4 w-4" />{t('courses.enrollNow')}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty state: no courses match filters */}
        {!loading && filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">{t('courses.noCourses')}</h3>
            <p className="text-gray-500">{t('courses.noCoursesHint')}</p>
          </div>
        )}
      </section>

      {/* Auth modals — shown when unauthenticated user tries to enroll */}
      <LoginModal open={showLogin} onOpenChange={setShowLogin} onSwitchToRegister={handleSwitchToRegister} />
      <RegisterModal open={showRegister} onOpenChange={setShowRegister} onSwitchToLogin={handleSwitchToLogin} />

      {/* Site footer */}
      <Footer />
    </div>
  );
};

export default Courses;

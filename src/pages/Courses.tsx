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

interface CourseData {
  id: string;
  title: string;
  instructor_name: string;
  category: string | null;
  level: string | null;
  duration: string | null;
  student_count: number | null;
  rating: number | null;
  image_url: string | null;
  price: string | null;
  description: string | null;
}

const Courses = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, instructor_name, category, level, duration, student_count, rating, image_url, price, description')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: "all", labelKey: "courses.allCategories" },
    { value: "mathematics", labelKey: "courses.mathematics" },
    { value: "science", labelKey: "courses.science" },
    { value: "english", labelKey: "courses.english" },
    { value: "social-studies", labelKey: "courses.socialStudies" },
    { value: "amharic", labelKey: "courses.amharic" },
    { value: "geography", labelKey: "courses.geography" }
  ];

  const levels = [
    { value: "all", labelKey: "courses.allLevels" },
    { value: "beginner", labelKey: "courses.beginner" },
    { value: "intermediate", labelKey: "courses.intermediate" },
    { value: "advanced", labelKey: "courses.advanced" }
  ];

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.instructor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (course.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || course.category === selectedCategory;
    const matchesLevel = selectedLevel === "all" || (course.level || '').toLowerCase() === selectedLevel;
    return matchesSearch && matchesCategory && matchesLevel;
  });

  const handleSwitchToRegister = () => { setShowLogin(false); setShowRegister(true); };
  const handleSwitchToLogin = () => { setShowRegister(false); setShowLogin(true); };

  const handleEnrollClick = async (courseId: string) => {
    if (!user) {
      setShowRegister(true);
      return;
    }
    try {
      // Check if already enrolled
      const { data: existing } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .maybeSingle();

      if (existing) {
        navigate(`/course/${courseId}`);
        return;
      }

      const { error } = await supabase
        .from('course_enrollments')
        .insert({ user_id: user.id, course_id: courseId, progress: 0 });

      if (error) {
        if (error.code === '23505') {
          navigate(`/course/${courseId}`);
          return;
        }
        throw error;
      }

      toast({ title: t('courses.enrolled') || 'Enrolled!', description: t('courses.enrolledDesc') || 'You have been enrolled in the course.' });
      navigate(`/course/${courseId}`);
    } catch (error) {
      console.error('Enrollment error:', error);
      toast({ title: t('common.error'), description: 'Failed to enroll.', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50">
      <Header />

      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">{t('courses.pageTitle')}</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">{t('courses.pageSubtitle')}</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 mb-12 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input placeholder={t('courses.searchPlaceholder')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">{t('courses.filterBy')}</span>
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map(cat => <SelectItem key={cat.value} value={cat.value}>{t(cat.labelKey)}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {levels.map(level => <SelectItem key={level.value} value={level.value}>{t(level.labelKey)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-gray-600">
            {loading ? t('common.loading') + '...' : `${t('courses.showing')} ${filteredCourses.length} ${t('courses.courses')}`}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-primary mx-auto mb-4 animate-pulse" />
            <p className="text-gray-500">{t('common.loading')}...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map((course) => (
              <Card key={course.id} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white/80 backdrop-blur-sm">
                <div className="relative">
                  <img src={course.image_url || "/placeholder.svg"} alt={course.title} className="w-full h-48 object-cover rounded-t-lg" />
                  {course.level && <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground">{course.level}</Badge>}
                  <Badge variant="secondary" className="absolute top-3 right-3">{course.price || 'Free'}</Badge>
                </div>
                <CardHeader>
                  <CardTitle className="text-xl text-gray-800 line-clamp-2">{course.title}</CardTitle>
                  <CardDescription className="text-gray-600">{t('common.by')} {course.instructor_name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4 line-clamp-3">{course.description}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    {course.duration && <div className="flex items-center"><Clock className="h-4 w-4 mr-1" />{course.duration}</div>}
                    <div className="flex items-center"><Users className="h-4 w-4 mr-1" />{(course.student_count || 0).toLocaleString()} {t('common.students')}</div>
                    {course.rating ? <div className="flex items-center"><Star className="h-4 w-4 mr-1 fill-yellow-400 text-yellow-400" />{course.rating}</div> : null}
                  </div>
                  <Button onClick={() => handleEnrollClick(course.id)} className="w-full">
                    <Play className="mr-2 h-4 w-4" />{t('courses.enrollNow')}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">{t('courses.noCourses')}</h3>
            <p className="text-gray-500">{t('courses.noCoursesHint')}</p>
          </div>
        )}
      </section>

      <LoginModal open={showLogin} onOpenChange={setShowLogin} onSwitchToRegister={handleSwitchToRegister} />
      <RegisterModal open={showRegister} onOpenChange={setShowRegister} onSwitchToLogin={handleSwitchToLogin} />
      <Footer />
    </div>
  );
};

export default Courses;

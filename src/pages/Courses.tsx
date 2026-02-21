
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Search, Star, Clock, Users, Play, Filter } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import LoginModal from "@/components/auth/LoginModal";
import RegisterModal from "@/components/auth/RegisterModal";
import Footer from "@/components/Footer";

const Courses = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const { user } = useAuth();

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "mathematics", label: "Mathematics" },
    { value: "science", label: "Science" },
    { value: "english", label: "English" },
    { value: "social-studies", label: "Social Studies" },
    { value: "amharic", label: "Amharic" },
    { value: "geography", label: "Geography" }
  ];

  const levels = [
    { value: "all", label: "All Levels" },
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Advanced" }
  ];

  const allCourses = [
    {
      id: 1,
      title: "Mathematics Grade 12",
      instructor: "Dr. Meron Asefa",
      category: "mathematics",
      level: "Advanced",
      duration: "8 weeks",
      students: 1234,
      rating: 4.8,
      image: "/placeholder.svg",
      price: "Free",
      description: "Advanced mathematics course covering calculus, algebra, and geometry for Grade 12 Ethiopian curriculum."
    },
    {
      id: 2,
      title: "Ethiopian History and Culture",
      instructor: "Prof. Abebe Kebede",
      category: "social-studies",
      level: "Intermediate",
      duration: "6 weeks",
      students: 2156,
      rating: 4.9,
      image: "/placeholder.svg",
      price: "299 Birr",
      description: "Comprehensive study of Ethiopian history from ancient times to modern era, including cultural heritage."
    },
    {
      id: 3,
      title: "English Language Arts Grade 10",
      instructor: "Ms. Hanna Tadesse",
      category: "english",
      level: "Intermediate",
      duration: "10 weeks",
      students: 3421,
      rating: 4.7,
      image: "/placeholder.svg",
      price: "199 Birr",
      description: "Comprehensive English language course focusing on reading, writing, speaking, and grammar skills."
    },
    {
      id: 4,
      title: "Biology Fundamentals",
      instructor: "Dr. Dawit Alemayehu",
      category: "science",
      level: "Intermediate",
      duration: "5 weeks",
      students: 1876,
      rating: 4.8,
      image: "/placeholder.svg",
      price: "349 Birr",
      description: "Essential biology concepts including cell biology, genetics, evolution, and human anatomy."
    },
    {
      id: 5,
      title: "Chemistry Grade 11",
      instructor: "Prof. Sara Getachew",
      category: "science",
      level: "Advanced",
      duration: "8 weeks",
      students: 987,
      rating: 4.9,
      image: "/placeholder.svg",
      price: "499 Birr",
      description: "Advanced chemistry covering organic chemistry, chemical reactions, and laboratory techniques."
    },
    {
      id: 6,
      title: "Ethiopian Geography",
      instructor: "Mr. Tekle Wolde",
      category: "geography",
      level: "Intermediate",
      duration: "6 weeks",
      students: 1654,
      rating: 4.6,
      image: "/placeholder.svg",
      price: "399 Birr",
      description: "Study of Ethiopian geography including physical features, climate patterns, and regional development."
    },
    {
      id: 7,
      title: "Amharic Literature Grade 9",
      instructor: "Dr. Almaz Tesfaye",
      category: "amharic",
      level: "Intermediate",
      duration: "10 weeks",
      students: 1243,
      rating: 4.7,
      image: "/placeholder.svg",
      price: "549 Birr",
      description: "Explore classical and modern Amharic literature, poetry, and creative writing techniques."
    },
    {
      id: 8,
      title: "Physics Grade 11",
      instructor: "Prof. Yonas Bekele",
      category: "science",
      level: "Advanced",
      duration: "7 weeks",
      students: 876,
      rating: 4.5,
      image: "/placeholder.svg",
      price: "429 Birr",
      description: "Advanced physics concepts including mechanics, thermodynamics, and electromagnetic theory."
    },
    {
      id: 9,
      title: "Mathematics Grade 9",
      instructor: "Dr. Meseret Hailu",
      category: "mathematics",
      level: "Intermediate",
      duration: "6 weeks",
      students: 2654,
      rating: 4.6,
      image: "/placeholder.svg",
      price: "299 Birr",
      description: "Essential mathematics for Grade 9 including algebra, geometry, and basic statistics."
    },
    {
      id: 10,
      title: "Social Studies Grade 8",
      instructor: "Mr. Girma Tadesse",
      category: "social-studies",
      level: "Beginner",
      duration: "8 weeks",
      students: 1987,
      rating: 4.4,
      image: "/placeholder.svg",
      price: "249 Birr",
      description: "Introduction to Ethiopian society, government, economics, and civic responsibilities."
    },
    {
      id: 11,
      title: "English Grammar Fundamentals",
      instructor: "Ms. Rahel Mekonnen",
      category: "english",
      level: "Beginner",
      duration: "4 weeks",
      students: 3210,
      rating: 4.5,
      image: "/placeholder.svg",
      price: "149 Birr",
      description: "Master English grammar basics including tenses, sentence structure, and punctuation."
    },
    {
      id: 12,
      title: "Environmental Science",
      instructor: "Dr. Tsegaye Wolde",
      category: "science",
      level: "Beginner",
      duration: "5 weeks",
      students: 1456,
      rating: 4.3,
      image: "/placeholder.svg",
      price: "299 Birr",
      description: "Study of environmental systems, conservation, and sustainable development in Ethiopia."
    }
  ];

  const filteredCourses = allCourses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || course.category === selectedCategory;
    const matchesLevel = selectedLevel === "all" || course.level.toLowerCase() === selectedLevel;
    
    return matchesSearch && matchesCategory && matchesLevel;
  });

  const handleSwitchToRegister = () => {
    setShowLogin(false);
    setShowRegister(true);
  };

  const handleSwitchToLogin = () => {
    setShowRegister(false);
    setShowLogin(true);
  };

  const handleEnrollClick = () => {
    if (user) {
      window.location.href = "/student-dashboard";
    } else {
      setShowRegister(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-emerald-600" />
            <h1 className="text-2xl font-bold text-gray-800">EdHub</h1>
          </div>
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-gray-600 hover:text-emerald-600 transition-colors">Home</Link>
            <Link to="/courses" className="text-emerald-600 font-medium">Courses</Link>
            <Link to="/about" className="text-gray-600 hover:text-emerald-600 transition-colors">About</Link>
            <Link to="/contact" className="text-gray-600 hover:text-emerald-600 transition-colors">Contact</Link>
          </div>
          <Button asChild variant="outline">
            <Link to="/">Back to Home</Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Educational Courses
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover our comprehensive collection of educational courses designed for Ethiopian students following the national curriculum.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 mb-12 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search courses, instructors, or topics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filter by:</span>
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  {levels.map(level => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {filteredCourses.length} of {allCourses.length} courses
          </p>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCourses.map((course) => (
            <Card key={course.id} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white/80 backdrop-blur-sm">
              <div className="relative">
                <img 
                  src={course.image} 
                  alt={course.title}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
                <Badge className="absolute top-3 left-3 bg-emerald-600 text-white">
                  {course.level}
                </Badge>
                <Badge variant="secondary" className="absolute top-3 right-3">
                  {course.price}
                </Badge>
              </div>
              <CardHeader>
                <CardTitle className="text-xl text-gray-800 line-clamp-2">{course.title}</CardTitle>
                <CardDescription className="text-gray-600">
                  by {course.instructor}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4 line-clamp-3">{course.description}</p>
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {course.duration}
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {course.students.toLocaleString()} students
                  </div>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 mr-1 fill-yellow-400 text-yellow-400" />
                    {course.rating}
                  </div>
                </div>
                <Button onClick={handleEnrollClick} className="w-full bg-emerald-600 hover:bg-emerald-700">
                  <Play className="mr-2 h-4 w-4" />
                  Enroll Now
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* No results message */}
        {filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No courses found</h3>
            <p className="text-gray-500">Try adjusting your search terms or filters</p>
          </div>
        )}
      </section>

      <LoginModal 
        open={showLogin} 
        onOpenChange={setShowLogin}
        onSwitchToRegister={handleSwitchToRegister}
      />
      <RegisterModal 
        open={showRegister} 
        onOpenChange={setShowRegister}
        onSwitchToLogin={handleSwitchToLogin}
      />
      
      <Footer />
    </div>
  );
};

export default Courses;

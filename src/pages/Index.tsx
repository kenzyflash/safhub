import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, GraduationCap, Users, Award, Play, Star, CheckCircle, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import LoginModal from "@/components/auth/LoginModal";
import RegisterModal from "@/components/auth/RegisterModal";
import Footer from "@/components/Footer";
import Header from "@/components/Header";

const Index = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const { user, userRole, loading } = useAuth();
  const { t } = useLanguage();

  const handleSwitchToRegister = () => {
    setShowLogin(false);
    setShowRegister(true);
  };

  const handleSwitchToLogin = () => {
    setShowRegister(false);
    setShowLogin(true);
  };

  // Get the correct dashboard path based on user role
  const getDashboardPath = () => {
    switch (userRole) {
      case 'admin':
        return '/admin-dashboard';
      case 'teacher':
        return '/teacher-dashboard';
      case 'student':
      default:
        return '/student-dashboard';
    }
  };

  // Get the correct dashboard label based on user role
  const getDashboardLabel = () => {
    switch (userRole) {
      case 'admin':
        return t('dashboard.admin');
      case 'teacher':
        return t('dashboard.teacher');
      case 'student':
      default:
        return t('dashboard.student');
    }
  };

  const features = [
    {
      icon: BookOpen,
      title: "Comprehensive Curriculum",
      description: "Ethiopian curriculum-aligned courses covering all subjects from Grade 1 to 12, including Mathematics, Science, English, Amharic, and Social Studies."
    },
    {
      icon: GraduationCap,
      title: "Expert Ethiopian Educators",
      description: "Learn from qualified Ethiopian teachers and education experts who understand the local curriculum and learning needs."
    },
    {
      icon: Users,
      title: "Interactive Learning Community",
      description: "Connect with fellow Ethiopian students, participate in discussions, and collaborate on assignments in a supportive learning environment."
    },
    {
      icon: Award,
      title: "Certified Progress Tracking",
      description: "Earn certificates upon course completion and track your academic progress with detailed analytics and performance reports."
    }
  ];

  const stats = [
    { number: "10,000+", label: "Ethiopian Students" },
    { number: "500+", label: "Educational Courses" },
    { number: "100+", label: "Certified Teachers" },
    { number: "98%", label: "Success Rate" }
  ];

  const testimonials = [
    {
      name: "Meron Tadesse",
      grade: "Grade 12 Student",
      content: "SafHub helped me excel in my university entrance exams. The Mathematics and Science courses are excellent!",
      rating: 5
    },
    {
      name: "Dawit Alemayehu",
      grade: "Grade 10 Student", 
      content: "The English language courses improved my communication skills significantly. Highly recommended!",
      rating: 5
    },
    {
      name: "Hanna Bekele",
      grade: "Grade 9 Student",
      content: "I love the interactive lessons and the way teachers explain complex topics in simple terms.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-6">
            Master Ethiopian Education with
            <span className="text-emerald-600 block">SafHub Learning</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Comprehensive online learning platform designed for Ethiopian students. Access quality education aligned with the national curriculum, taught by expert educators.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setShowRegister(true)}>
              Start Learning Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/courses">Browse Courses</Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-emerald-600 mb-2">{stat.number}</div>
              <div className="text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Why Choose SafHub Section */}
      <section className="bg-white/80 backdrop-blur-sm py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Why Choose SafHub?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover what makes SafHub the leading educational platform for Ethiopian students
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-2 bg-white/80 backdrop-blur-sm">
                <CardHeader className="text-center">
                  <feature.icon className="h-12 w-12 text-emerald-600 mx-auto mb-4" />
                  <CardTitle className="text-xl text-gray-800">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 text-center">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">Featured Courses</h2>
          <p className="text-xl text-gray-600">Popular courses aligned with Ethiopian curriculum</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {[
            {
              title: "Mathematics Grade 12",
              instructor: "Dr. Meron Asefa",
              students: "2,400",
              rating: 4.9,
              image: "/placeholder.svg",
              level: "Advanced"
            },
            {
              title: "Ethiopian History",
              instructor: "Prof. Abebe Kebede",
              students: "1,800",
              rating: 4.8,
              image: "/placeholder.svg",
              level: "Intermediate"
            },
            {
              title: "English Language Skills",
              instructor: "Ms. Hanna Tadesse",
              students: "3,200",
              rating: 4.7,
              image: "/placeholder.svg",
              level: "All Levels"
            }
          ].map((course, index) => (
            <Card key={index} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white/80 backdrop-blur-sm">
              <div className="relative">
                <img src={course.image} alt={course.title} className="w-full h-48 object-cover rounded-t-lg" />
                <Badge className="absolute top-3 left-3 bg-emerald-600 text-white">{course.level}</Badge>
              </div>
              <CardHeader>
                <CardTitle className="text-xl text-gray-800">{course.title}</CardTitle>
                <CardDescription>by {course.instructor}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <span>{course.students} students</span>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                    {course.rating}
                  </div>
                </div>
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700" asChild>
                  <Link to="/courses">
                    <Play className="mr-2 h-4 w-4" />
                    Start Learning
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="text-center">
          <Button variant="outline" size="lg" asChild>
            <Link to="/courses">View All Courses</Link>
          </Button>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-white/80 backdrop-blur-sm py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">What Students Say</h2>
            <p className="text-xl text-gray-600">Real feedback from Ethiopian students using SafHub</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4">"{testimonial.content}"</p>
                  <div>
                    <p className="font-semibold text-gray-800">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.grade}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">Frequently Asked Questions</h2>
          <p className="text-xl text-gray-600">Answers to common questions about SafHub</p>
        </div>
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow">
            <h3 className="font-semibold text-lg text-emerald-700 mb-2">Is SafHub free to use?</h3>
            <p className="text-gray-700">SafHub offers free access to many courses and resources. Some advanced features or courses may require a subscription.</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow">
            <h3 className="font-semibold text-lg text-emerald-700 mb-2">Who are the instructors?</h3>
            <p className="text-gray-700">Our instructors are certified Ethiopian teachers and subject experts with years of classroom and online teaching experience.</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow">
            <h3 className="font-semibold text-lg text-emerald-700 mb-2">Can I access SafHub on my phone?</h3>
            <p className="text-gray-700">Yes! SafHub is fully responsive and works on smartphones, tablets, and computers.</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow">
            <h3 className="font-semibold text-lg text-emerald-700 mb-2">How do I track my progress?</h3>
            <p className="text-gray-700">You can track your learning progress and achievements from your dashboard after signing in.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-gradient-to-r from-emerald-600 to-blue-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">Ready to Start Your Learning Journey?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of Ethiopian students who are already achieving their academic goals with SafHub
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" onClick={() => setShowRegister(true)}>
              Create Free Account
            </Button>
            <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-emerald-600" asChild>
              <Link to="/courses">Explore Courses</Link>
            </Button>
          </div>
        </div>
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

export default Index;

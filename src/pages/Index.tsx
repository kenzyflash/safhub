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

  const features = [
    { icon: BookOpen, titleKey: "index.feature1Title", descKey: "index.feature1Desc" },
    { icon: GraduationCap, titleKey: "index.feature2Title", descKey: "index.feature2Desc" },
    { icon: Users, titleKey: "index.feature3Title", descKey: "index.feature3Desc" },
    { icon: Award, titleKey: "index.feature4Title", descKey: "index.feature4Desc" }
  ];

  const stats = [
    { numberKey: "index.stat1Number", labelKey: "index.stat1Label" },
    { numberKey: "index.stat2Number", labelKey: "index.stat2Label" },
    { numberKey: "index.stat3Number", labelKey: "index.stat3Label" },
    { numberKey: "index.stat4Number", labelKey: "index.stat4Label" }
  ];

  const testimonials = [
    { nameKey: "index.testimonial1Name", gradeKey: "index.testimonial1Grade", contentKey: "index.testimonial1Content", rating: 5 },
    { nameKey: "index.testimonial2Name", gradeKey: "index.testimonial2Grade", contentKey: "index.testimonial2Content", rating: 5 },
    { nameKey: "index.testimonial3Name", gradeKey: "index.testimonial3Grade", contentKey: "index.testimonial3Content", rating: 5 }
  ];

  const faqs = [
    { qKey: "index.faq1Q", aKey: "index.faq1A" },
    { qKey: "index.faq2Q", aKey: "index.faq2A" },
    { qKey: "index.faq3Q", aKey: "index.faq3A" },
    { qKey: "index.faq4Q", aKey: "index.faq4A" }
  ];

  const featuredCourses = [
    { titleKey: "index.course1Title", instructorKey: "index.course1Instructor", students: "2,400", rating: 4.9, levelKey: "index.course1Level" },
    { titleKey: "index.course2Title", instructorKey: "index.course2Instructor", students: "1,800", rating: 4.8, levelKey: "index.course2Level" },
    { titleKey: "index.course3Title", instructorKey: "index.course3Instructor", students: "3,200", rating: 4.7, levelKey: "index.course3Level" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
      <Header />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-6">
            {t('index.heroTitle1')}
            <span className="text-emerald-600 block">{t('index.heroTitle2')}</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            {t('index.heroSubtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setShowRegister(true)}>
              {t('index.startLearning')}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/courses">{t('index.browseCourses')}</Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-emerald-600 mb-2">{t(stat.numberKey)}</div>
              <div className="text-gray-600">{t(stat.labelKey)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Why Choose EdHub Section */}
      <section className="bg-white/80 backdrop-blur-sm py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">{t('index.whyChoose')}</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">{t('index.whyChooseSubtitle')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-2 bg-white/80 backdrop-blur-sm">
                <CardHeader className="text-center">
                  <feature.icon className="h-12 w-12 text-emerald-600 mx-auto mb-4" />
                  <CardTitle className="text-xl text-gray-800">{t(feature.titleKey)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 text-center">{t(feature.descKey)}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">{t('index.featuredCourses')}</h2>
          <p className="text-xl text-gray-600">{t('index.featuredCoursesSubtitle')}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {featuredCourses.map((course, index) => (
            <Card key={index} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white/80 backdrop-blur-sm">
              <div className="relative">
                <img src="/placeholder.svg" alt={t(course.titleKey)} className="w-full h-48 object-cover rounded-t-lg" />
                <Badge className="absolute top-3 left-3 bg-emerald-600 text-white">{t(course.levelKey)}</Badge>
              </div>
              <CardHeader>
                <CardTitle className="text-xl text-gray-800">{t(course.titleKey)}</CardTitle>
                <CardDescription>{t('common.by')} {t(course.instructorKey)}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <span>{course.students} {t('common.students')}</span>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                    {course.rating}
                  </div>
                </div>
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700" asChild>
                  <Link to="/courses">
                    <Play className="mr-2 h-4 w-4" />
                    {t('index.startLearningBtn')}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="text-center">
          <Button variant="outline" size="lg" asChild>
            <Link to="/courses">{t('index.viewAllCourses')}</Link>
          </Button>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-white/80 backdrop-blur-sm py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">{t('index.testimonialTitle')}</h2>
            <p className="text-xl text-gray-600">{t('index.testimonialSubtitle')}</p>
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
                  <p className="text-gray-600 mb-4">"{t(testimonial.contentKey)}"</p>
                  <div>
                    <p className="font-semibold text-gray-800">{t(testimonial.nameKey)}</p>
                    <p className="text-sm text-gray-500">{t(testimonial.gradeKey)}</p>
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
          <h2 className="text-4xl font-bold text-gray-800 mb-4">{t('index.faqTitle')}</h2>
          <p className="text-xl text-gray-600">{t('index.faqSubtitle')}</p>
        </div>
        <div className="max-w-3xl mx-auto space-y-6">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow">
              <h3 className="font-semibold text-lg text-emerald-700 mb-2">{t(faq.qKey)}</h3>
              <p className="text-gray-700">{t(faq.aKey)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-gradient-to-r from-emerald-600 to-blue-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">{t('index.ctaTitle')}</h2>
          <p className="text-xl mb-8 opacity-90">{t('index.ctaSubtitle')}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" onClick={() => setShowRegister(true)}>
              {t('index.createFreeAccount')}
            </Button>
            <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-emerald-600" asChild>
              <Link to="/courses">{t('index.exploreCourses')}</Link>
            </Button>
          </div>
        </div>
      </section>

      <LoginModal open={showLogin} onOpenChange={setShowLogin} onSwitchToRegister={handleSwitchToRegister} />
      <RegisterModal open={showRegister} onOpenChange={setShowRegister} onSwitchToLogin={handleSwitchToLogin} />
      <Footer />
    </div>
  );
};

export default Index;

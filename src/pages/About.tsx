
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users, Award, Heart, CheckCircle, Star } from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";

const About = () => {
  const { t } = useLanguage();

  const values = [
    { icon: BookOpen, titleKey: "about.value1Title", descKey: "about.value1Desc" },
    { icon: Users, titleKey: "about.value2Title", descKey: "about.value2Desc" },
    { icon: Award, titleKey: "about.value3Title", descKey: "about.value3Desc" },
    { icon: Heart, titleKey: "about.value4Title", descKey: "about.value4Desc" }
  ];

  const team = [
    { name: "Dr. Meron Asefa", role: "Head of Mathematics Department", education: "PhD in Mathematics, Addis Ababa University", experience: "15 years teaching experience", image: "/placeholder.svg" },
    { name: "Prof. Abebe Kebede", role: "Ethiopian History Specialist", education: "PhD in History, University of London", experience: "20 years in Ethiopian education", image: "/placeholder.svg" },
    { name: "Ms. Hanna Tadesse", role: "English Language Coordinator", education: "MA in English Literature, AAU", experience: "12 years language instruction", image: "/placeholder.svg" },
    { name: "Dr. Dawit Alemayehu", role: "Science Department Head", education: "PhD in Biology, Haramaya University", experience: "18 years science education", image: "/placeholder.svg" }
  ];

  const achievements = [
    { numberKey: "about.stat1Number", labelKey: "about.stat1Label", icon: Users },
    { numberKey: "about.stat2Number", labelKey: "about.stat2Label", icon: BookOpen },
    { numberKey: "about.stat3Number", labelKey: "about.stat3Label", icon: Star },
    { numberKey: "about.stat4Number", labelKey: "about.stat4Label", icon: Award }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-emerald-600" />
            <h1 className="text-2xl font-bold text-gray-800">EdHub</h1>
          </div>
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-gray-600 hover:text-emerald-600 transition-colors">{t('common.home')}</Link>
            <Link to="/courses" className="text-gray-600 hover:text-emerald-600 transition-colors">{t('common.courses')}</Link>
            <Link to="/about" className="text-emerald-600 font-medium">{t('common.about')}</Link>
            <Link to="/contact" className="text-gray-600 hover:text-emerald-600 transition-colors">{t('common.contact')}</Link>
          </div>
          <Button asChild variant="outline">
            <Link to="/">{t('common.backToHome')}</Link>
          </Button>
        </div>
      </header>

      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-6">{t('about.title')}</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">{t('about.subtitle')}</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
          {achievements.map((achievement, index) => (
            <div key={index} className="text-center">
              <achievement.icon className="h-12 w-12 text-emerald-600 mx-auto mb-4" />
              <div className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">{t(achievement.numberKey)}</div>
              <div className="text-gray-600">{t(achievement.labelKey)}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white/80 backdrop-blur-sm py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-800 mb-6">{t('about.missionTitle')}</h2>
              <p className="text-lg text-gray-600 mb-6">{t('about.missionText')}</p>
              <div className="space-y-3">
                {['missionPoint1', 'missionPoint2', 'missionPoint3', 'missionPoint4'].map((key) => (
                  <div key={key} className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-emerald-600 mr-3" />
                    <span className="text-gray-700">{t(`about.${key}`)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <img src="/placeholder.svg" alt="Students learning" className="rounded-lg shadow-lg w-full h-96 object-cover" />
              <div className="absolute inset-0 bg-emerald-600/10 rounded-lg"></div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">{t('about.valuesTitle')}</h2>
          <p className="text-xl text-gray-600">{t('about.valuesSubtitle')}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {values.map((value, index) => (
            <Card key={index} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-2 bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center">
                <value.icon className="h-12 w-12 text-emerald-600 mx-auto mb-4" />
                <CardTitle className="text-xl text-gray-800">{t(value.titleKey)}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-center">{t(value.descKey)}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-white/80 backdrop-blur-sm py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-gray-800 mb-8">{t('about.storyTitle')}</h2>
            <div className="space-y-6 text-lg text-gray-600">
              <p>{t('about.storyP1')}</p>
              <p>{t('about.storyP2')}</p>
              <p>{t('about.storyP3')}</p>
              <p>{t('about.storyP4')}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">{t('about.teamTitle')}</h2>
          <p className="text-xl text-gray-600">{t('about.teamSubtitle')}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {team.map((member, index) => (
            <Card key={index} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center">
                <img src={member.image} alt={member.name} className="w-24 h-24 rounded-full mx-auto mb-4 object-cover" />
                <CardTitle className="text-xl text-gray-800">{member.name}</CardTitle>
                <CardDescription className="text-emerald-600 font-medium">{member.role}</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="space-y-2 text-sm text-gray-600">
                  <p>{member.education}</p>
                  <Badge variant="secondary" className="w-full justify-center">{member.experience}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 py-20">
        <div className="bg-gradient-to-r from-emerald-600 to-blue-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">{t('about.ctaTitle')}</h2>
          <p className="text-xl mb-8 opacity-90">{t('about.ctaSubtitle')}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/courses">{t('about.exploreCourses')}</Link>
            </Button>
            <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-emerald-600" asChild>
              <Link to="/contact">{t('about.getInTouch')}</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;

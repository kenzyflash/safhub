
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users, Award, Target, Heart, Globe, CheckCircle, Star } from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";

const About = () => {
  const values = [
    {
      icon: BookOpen,
      title: "Educational Excellence",
      description: "We are committed to providing high-quality education that meets Ethiopian curriculum standards and prepares students for success."
    },
    {
      icon: Users,
      title: "Inclusive Learning",
      description: "Our platform welcomes all Ethiopian students regardless of background, ensuring equal access to quality education."
    },
    {
      icon: Award,
      title: "Academic Achievement",
      description: "We celebrate student success and provide pathways for academic excellence through comprehensive learning resources."
    },
    {
      icon: Heart,
      title: "Student-Centered Approach",
      description: "Every decision we make prioritizes student learning experience and academic growth."
    }
  ];

  const team = [
    {
      name: "Dr. Meron Asefa",
      role: "Head of Mathematics Department",
      education: "PhD in Mathematics, Addis Ababa University",
      experience: "15 years teaching experience",
      image: "/placeholder.svg"
    },
    {
      name: "Prof. Abebe Kebede",
      role: "Ethiopian History Specialist",
      education: "PhD in History, University of London",
      experience: "20 years in Ethiopian education",
      image: "/placeholder.svg"
    },
    {
      name: "Ms. Hanna Tadesse",
      role: "English Language Coordinator",
      education: "MA in English Literature, AAU",
      experience: "12 years language instruction",
      image: "/placeholder.svg"
    },
    {
      name: "Dr. Dawit Alemayehu",
      role: "Science Department Head",
      education: "PhD in Biology, Haramaya University",
      experience: "18 years science education",
      image: "/placeholder.svg"
    }
  ];

  const achievements = [
    { number: "50,000+", label: "Students Served", icon: Users },
    { number: "500+", label: "Courses Offered", icon: BookOpen },
    { number: "98%", label: "Student Satisfaction", icon: Star },
    { number: "15+", label: "Years of Excellence", icon: Award }
  ];

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
            <Link to="/courses" className="text-gray-600 hover:text-emerald-600 transition-colors">Courses</Link>
            <Link to="/about" className="text-emerald-600 font-medium">About</Link>
            <Link to="/contact" className="text-gray-600 hover:text-emerald-600 transition-colors">Contact</Link>
          </div>
          <Button asChild variant="outline">
            <Link to="/">Back to Home</Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-6">
            About EdHub
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Empowering Ethiopian students with world-class education that honors our heritage while preparing for the future
          </p>
        </div>

        {/* Achievement Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
          {achievements.map((achievement, index) => (
            <div key={index} className="text-center">
              <achievement.icon className="h-12 w-12 text-emerald-600 mx-auto mb-4" />
              <div className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">{achievement.number}</div>
              <div className="text-gray-600">{achievement.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="bg-white/80 backdrop-blur-sm py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-800 mb-6">Our Mission</h2>
              <p className="text-lg text-gray-600 mb-6">
                To provide accessible, high-quality education to all Ethiopian students, bridging the gap between traditional learning and modern educational technology. We strive to preserve Ethiopian educational values while embracing innovative teaching methods.
              </p>
              <div className="space-y-3">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-emerald-600 mr-3" />
                  <span className="text-gray-700">Curriculum-aligned content</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-emerald-600 mr-3" />
                  <span className="text-gray-700">Expert Ethiopian educators</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-emerald-600 mr-3" />
                  <span className="text-gray-700">Affordable education for all</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-emerald-600 mr-3" />
                  <span className="text-gray-700">Technology-enhanced learning</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <img 
                src="/placeholder.svg" 
                alt="Students learning" 
                className="rounded-lg shadow-lg w-full h-96 object-cover"
              />
              <div className="absolute inset-0 bg-emerald-600/10 rounded-lg"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">Our Core Values</h2>
          <p className="text-xl text-gray-600">The principles that guide everything we do</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {values.map((value, index) => (
            <Card key={index} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-2 bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center">
                <value.icon className="h-12 w-12 text-emerald-600 mx-auto mb-4" />
                <CardTitle className="text-xl text-gray-800">{value.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-center">
                  {value.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Our Story */}
      <section className="bg-white/80 backdrop-blur-sm py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-gray-800 mb-8">Our Story</h2>
            <div className="space-y-6 text-lg text-gray-600">
              <p>
                EdHub was founded in 2010 with a simple yet powerful vision: to make quality education accessible to every Ethiopian student, regardless of their geographical location or economic background.
              </p>
              <p>
                What started as a small initiative to help rural students access educational materials has grown into Ethiopia's leading online learning platform, serving thousands of students across all regions and grade levels.
              </p>
              <p>
                Our journey has been guided by the belief that education is the cornerstone of individual and national development. We've witnessed countless success stories of students who have overcome challenges through education, and this continues to inspire our mission.
              </p>
              <p>
                Today, EdHub stands as a testament to the power of combining traditional Ethiopian educational wisdom with modern technology, creating learning experiences that are both culturally relevant and globally competitive.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Team */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">Meet Our Expert Educators</h2>
          <p className="text-xl text-gray-600">Dedicated professionals committed to student success</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {team.map((member, index) => (
            <Card key={index} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center">
                <img 
                  src={member.image} 
                  alt={member.name}
                  className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                />
                <CardTitle className="text-xl text-gray-800">{member.name}</CardTitle>
                <CardDescription className="text-emerald-600 font-medium">{member.role}</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="space-y-2 text-sm text-gray-600">
                  <p>{member.education}</p>
                  <Badge variant="secondary" className="w-full justify-center">
                    {member.experience}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-gradient-to-r from-emerald-600 to-blue-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">Join the EdHub Community</h2>
          <p className="text-xl mb-8 opacity-90">
            Become part of Ethiopia's largest educational community and start your journey toward academic excellence
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/courses">Explore Courses</Link>
            </Button>
            <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-emerald-600" asChild>
              <Link to="/contact">Get in Touch</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;

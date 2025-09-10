import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Index from "./pages/Index";
import StudentDashboard from "./pages/StudentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Contact from "./pages/Contact";
import About from "./pages/About";
import Courses from "./pages/Courses";
import CoursePage from "./pages/CoursePage";
import NotFound from "./pages/NotFound";
import GamificationPage from "@/pages/GamificationPage";
import ForumPage from "@/pages/ForumPage";
import ForumDetailPage from "@/pages/ForumDetailPage";
import ForumPostDetailPage from "@/pages/ForumPostDetailPage";
import ParentDashboard from "@/pages/ParentDashboard";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <LanguageProvider>
          <AuthProvider>
            <BrowserRouter>
              <div className="min-h-screen bg-gray-50">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/courses" element={<Courses />} />
                  <Route path="/course/:id" element={<CoursePage />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/student-dashboard" element={<StudentDashboard />} />
                  <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
                  <Route path="/admin-dashboard" element={<AdminDashboard />} />
                  <Route path="/parent-dashboard" element={<ParentDashboard />} />
                  <Route path="/achievements" element={<GamificationPage />} />
          <Route path="/forum" element={<ForumPage />} />
          <Route path="/forum/:id" element={<ForumDetailPage />} />
          <Route path="/forum/:forumId/post/:postId" element={<ForumPostDetailPage />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
            </BrowserRouter>
          </AuthProvider>
        </LanguageProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

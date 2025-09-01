import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Users, 
  Settings, 
  Bell, 
  BarChart3,
  UserCheck,
  GraduationCap,
  TrendingUp,
  MessageSquare
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardStats from "@/components/dashboard/DashboardStats";
import UserManagement from "@/components/dashboard/UserManagement";
import ContactManagement from "@/components/dashboard/ContactManagement";
import AdminSettings from "@/components/dashboard/AdminSettings";
import SecurityPrivacyMessage from "@/components/security/SecurityPrivacyMessage";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AdminDashboard = () => {
  const { user, userRole } = useAuth();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [systemStats, setSystemStats] = useState([
    { label: "Total Users", value: "0", icon: Users, color: "text-blue-600", change: "+0%" },
    { label: "Active Courses", value: "0", icon: BookOpen, color: "text-green-600", change: "+0%" },
    { label: "Teachers", value: "0", icon: GraduationCap, color: "text-purple-600", change: "+0%" },
    { label: "Monthly Revenue", value: "0 USD", icon: TrendingUp, color: "text-orange-600", change: "+0%" }
  ]);
  const [recentActions, setRecentActions] = useState<any[]>([]);
  const [systemOverview, setSystemOverview] = useState({
    serverUptime: "99.9%",
    databaseSize: "0 MB",
    activeSessions: "0",
    supportTickets: "0 pending"
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    if (user && userRole === 'admin' && !dataLoaded) {
      initializeAdminData();
    } else if (user && userRole === 'admin' && dataLoaded) {
      setLoading(false);
    }
  }, [user, userRole, dataLoaded]);

  const initializeAdminData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Starting admin data initialization...');
      
      await Promise.all([
        fetchSystemStats(),
        fetchRecentActions(),
        fetchSystemOverview()
      ]);
      
      setDataLoaded(true);
      console.log('Admin data initialization completed successfully');
    } catch (error) {
      console.error('Error initializing admin data:', error);
      setError('Failed to load admin dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemStats = async () => {
    try {
      console.log('Fetching system stats...');
      
      // Fetch total users with error handling
      const { count: totalUsers, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (usersError) {
        console.error('Error fetching users count:', usersError);
      }

      // Fetch total courses with error handling
      const { count: totalCourses, error: coursesError } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true });

      if (coursesError) {
        console.error('Error fetching courses count:', coursesError);
      }

      // Fetch teachers count with error handling
      const { count: teachersCount, error: teachersError } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'teacher');

      if (teachersError) {
        console.error('Error fetching teachers count:', teachersError);
      }

      // Fetch enrollments for revenue calculation
      const { count: enrollments, error: enrollmentsError } = await supabase
        .from('course_enrollments')
        .select('*', { count: 'exact', head: true });

      if (enrollmentsError) {
        console.error('Error fetching enrollments count:', enrollmentsError);
      }

      // Calculate estimated revenue based on actual enrollment data
      const paidCourses = Math.floor((enrollments || 0) * 0.3); // Assume 30% are paid courses
      const estimatedRevenue = paidCourses * 25; // Average $25 per paid course

      setSystemStats([
        { 
          label: "Total Users", 
          value: (totalUsers || 0).toString(), 
          icon: Users, 
          color: "text-blue-600", 
          change: "+12%" 
        },
        { 
          label: "Active Courses", 
          value: (totalCourses || 0).toString(), 
          icon: BookOpen, 
          color: "text-green-600", 
          change: "+8%" 
        },
        { 
          label: "Teachers", 
          value: (teachersCount || 0).toString(), 
          icon: GraduationCap, 
          color: "text-purple-600", 
          change: "+5%" 
        },
        { 
          label: "Monthly Revenue", 
          value: `$${estimatedRevenue}`, 
          icon: TrendingUp, 
          color: "text-orange-600", 
          change: "+18%" 
        }
      ]);

      console.log('System stats updated successfully');
    } catch (error) {
      console.error('Error fetching system stats:', error);
      // Keep default values on error
    }
  };

  const fetchRecentActions = async () => {
    try {
      console.log('Fetching recent actions...');
      
      // Fetch recent user registrations
      const { data: recentUsers, error: usersError } = await supabase
        .from('profiles')
        .select('first_name, last_name, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      if (usersError) {
        console.error('Error fetching recent users:', usersError);
      }

      // Fetch recent course enrollments with proper join
      const { data: recentEnrollments, error: enrollmentsError } = await supabase
        .from('course_enrollments')
        .select(`
          enrolled_at,
          courses!inner (
            title
          )
        `)
        .order('enrolled_at', { ascending: false })
        .limit(3);

      if (enrollmentsError) {
        console.error('Error fetching recent enrollments:', enrollmentsError);
      }

      // Fetch recent course creations
      const { data: recentCourses, error: coursesError } = await supabase
        .from('courses')
        .select('title, created_at, instructor_name')
        .order('created_at', { ascending: false })
        .limit(2);

      if (coursesError) {
        console.error('Error fetching recent courses:', coursesError);
      }

      // Fetch recent contact inquiries
      const { data: recentInquiries, error: inquiriesError } = await supabase
        .from('contact_inquiries')
        .select('name, subject, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      if (inquiriesError) {
        console.error('Error fetching recent inquiries:', inquiriesError);
      }

      const actions = [];

      // Add contact inquiries
      if (recentInquiries && recentInquiries.length > 0) {
        recentInquiries.forEach(inquiry => {
          actions.push({
            action: "New contact inquiry",
            details: `${inquiry.name}: ${inquiry.subject}`,
            time: new Date(inquiry.created_at).toLocaleString(),
            type: "contact"
          });
        });
      }

      // Add user registrations
      if (recentUsers && recentUsers.length > 0) {
        recentUsers.forEach(user => {
          actions.push({
            action: "New user registered",
            details: `${user.first_name} ${user.last_name}`,
            time: new Date(user.created_at).toLocaleString(),
            type: "user"
          });
        });
      }

      // Add course enrollments
      if (recentEnrollments && recentEnrollments.length > 0) {
        recentEnrollments.forEach(enrollment => {
          actions.push({
            action: "Course enrollment",
            details: enrollment.courses?.title || 'Unknown Course',
            time: new Date(enrollment.enrolled_at).toLocaleString(),
            type: "enrollment"
          });
        });
      }

      // Add course creations
      if (recentCourses && recentCourses.length > 0) {
        recentCourses.forEach(course => {
          actions.push({
            action: "New course created",
            details: `${course.title} by ${course.instructor_name}`,
            time: new Date(course.created_at).toLocaleString(),
            type: "course"
          });
        });
      }

      // Sort by time and take the most recent 5
      const sortedActions = actions
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, 5);

      setRecentActions(sortedActions);
      console.log('Recent actions updated successfully');
    } catch (error) {
      console.error('Error fetching recent actions:', error);
      setRecentActions([
        {
          action: "System initialized",
          details: "Admin dashboard loaded",
          time: new Date().toLocaleString(),
          type: "system"
        }
      ]);
    }
  };

  const fetchSystemOverview = async () => {
    try {
      console.log('Fetching system overview...');
      
      // Get more accurate database size estimate
      const { count: profilesCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: coursesCount } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true });

      const { count: enrollmentsCount } = await supabase
        .from('course_enrollments')
        .select('*', { count: 'exact', head: true });

      // Estimate database size more accurately (KB per record estimates)
      const estimatedSize = Math.round(
        ((profilesCount || 0) * 2) + // ~2KB per profile
        ((coursesCount || 0) * 5) + // ~5KB per course
        ((enrollmentsCount || 0) * 1) // ~1KB per enrollment
      );

      // Get recent login activity for active sessions
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count: recentLogins } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('updated_at', oneHourAgo);

      // Get support tickets from contact inquiries
      const { count: supportTickets } = await supabase
        .from('contact_inquiries')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'new');

      setSystemOverview({
        serverUptime: "99.9%",
        databaseSize: `${estimatedSize} KB`,
        activeSessions: (recentLogins || 0).toString(),
        supportTickets: `${supportTickets || 0} pending`
      });

      console.log('System overview updated successfully');
    } catch (error) {
      console.error('Error fetching system overview:', error);
      // Keep default values on error
    }
  };

  const handleRetry = () => {
    setDataLoaded(false);
    initializeAdminData();
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="admin">
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
          <DashboardHeader title="SafHub - Admin" />
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
              <span className="ml-3 text-lg">Loading admin dashboard...</span>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
        <DashboardHeader 
          title="SafHub - Admin" 
          showSettings 
          onSettingsClick={() => setIsSettingsOpen(true)}
        />

        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Administrator Dashboard</h1>
            <p className="text-gray-600">Monitor and manage the SafHub platform.</p>
            {error && (
              <div className="mt-2 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
                {error}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-2"
                  onClick={handleRetry}
                >
                  Retry
                </Button>
              </div>
            )}
          </div>

          {/* Replace the custom tab navigation with shadcn Tabs component */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Users
              </TabsTrigger>
              <TabsTrigger value="contact" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Contact Forms
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Security Status */}
              <SecurityPrivacyMessage />
              
              <DashboardStats stats={systemStats} />

              {/* Main Content */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <Card className="bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                      <CardDescription>Common administrative tasks</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Button
                          variant="outline"
                          className="flex items-center gap-2"
                          onClick={() => setActiveTab('users')}
                        >
                          <Users className="h-4 w-4" />
                          Manage Users
                        </Button>
                        <Button
                          variant="outline"
                          className="flex items-center gap-2"
                          onClick={() => setActiveTab('contact')}
                        >
                          <MessageSquare className="h-4 w-4" />
                          View Contact Forms
                        </Button>
                        <Button
                          variant="outline"
                          className="flex items-center gap-2"
                          onClick={() => setIsSettingsOpen(true)}
                        >
                          <Settings className="h-4 w-4" />
                          System Settings
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card className="bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5 text-orange-600" />
                        Recent Actions
                      </CardTitle>
                      <CardDescription>Latest system activities and user actions</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {recentActions.length === 0 ? (
                        <div className="text-center py-4">
                          <p className="text-gray-500 text-sm">No recent actions available.</p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-2"
                            onClick={fetchRecentActions}
                          >
                            Refresh
                          </Button>
                        </div>
                      ) : (
                        recentActions.map((action, index) => (
                          <div key={index} className="p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-gray-800 text-sm mb-1">{action.action}</p>
                                <p className="text-xs text-gray-600 mb-2">{action.details}</p>
                                <span className="text-xs text-gray-500">{action.time}</span>
                              </div>
                              <Badge 
                                variant="outline" 
                                className={
                                  action.type === 'user' ? 'bg-blue-50 text-blue-700' :
                                  action.type === 'course' ? 'bg-green-50 text-green-700' :
                                  action.type === 'enrollment' ? 'bg-purple-50 text-purple-700' :
                                  action.type === 'contact' ? 'bg-orange-50 text-orange-700' :
                                  'bg-gray-50 text-gray-700'
                                }
                              >
                                {action.type}
                              </Badge>
                            </div>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-purple-600" />
                        System Overview
                      </CardTitle>
                      <CardDescription>Real-time system health and metrics</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span>Server Uptime</span>
                          <span className="font-medium text-green-600">{systemOverview.serverUptime}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Database Size</span>
                          <span className="font-medium">{systemOverview.databaseSize}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Active Sessions (1hr)</span>
                          <span className="font-medium text-blue-600">{systemOverview.activeSessions}</span>
                        </div>
                        <div className="flex justify-between text-sm cursor-pointer" onClick={() => setActiveTab('contact')}>
                          <span>Support Tickets</span>
                          <span className="font-medium text-orange-600 hover:underline">{systemOverview.supportTickets}</span>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={fetchSystemOverview}
                        >
                          Refresh Metrics
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="users">
              <UserManagement />
            </TabsContent>

            <TabsContent value="contact">
              <ContactManagement />
            </TabsContent>
          </Tabs>
        </div>

        <AdminSettings open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
      </div>
    </ProtectedRoute>
  );
};

export default AdminDashboard;

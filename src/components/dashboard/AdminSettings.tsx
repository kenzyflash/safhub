
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Settings, 
  Database, 
  Bell, 
  Shield, 
  Mail,
  Globe,
  Server,
  Users,
  BookOpen,
  Save,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SecurityAuditLog from '@/components/security/SecurityAuditLog';

interface AdminSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AdminSettings = ({ open, onOpenChange }: AdminSettingsProps) => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    siteName: 'EdHub',
    siteDescription: 'Educational platform for Ethiopian students',
    allowRegistration: true,
    emailNotifications: true,
    maintenanceMode: false,
    maxStudentsPerCourse: 100,
    autoApproveTeachers: false,
    backupFrequency: 'daily',
    systemEmail: 'admin@edhub.com',
    // Security settings
    sessionTimeout: 24,
    maxLoginAttempts: 5,
    requireEmailVerification: true,
    enableAuditLogging: true,
    secureHeaders: true
  });

  const validateInput = (input: string, type: 'email' | 'text' | 'number'): string | number => {
    if (!input || typeof input !== 'string') {
      throw new Error('Invalid input provided');
    }

    const sanitized = input.trim().slice(0, 255);

    switch (type) {
      case 'email':
        const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
        if (!emailRegex.test(sanitized)) {
          throw new Error('Invalid email format');
        }
        return sanitized;
      case 'number':
        const num = parseInt(sanitized);
        if (isNaN(num) || num < 0) {
          throw new Error('Invalid number');
        }
        return num;
      case 'text':
        if (/<script|javascript:|data:|vbscript:/i.test(sanitized)) {
          throw new Error('Invalid characters detected');
        }
        return sanitized;
      default:
        return sanitized;
    }
  };

  const handleSave = () => {
    try {
      // Validate inputs before saving
      validateInput(settings.siteName, 'text');
      validateInput(settings.siteDescription, 'text');
      validateInput(settings.systemEmail, 'email');
      validateInput(settings.maxStudentsPerCourse.toString(), 'number');
      validateInput(settings.sessionTimeout.toString(), 'number');
      validateInput(settings.maxLoginAttempts.toString(), 'number');

      // In a real app, this would save to database with proper validation
      toast({
        title: "Settings saved",
        description: "System settings have been updated successfully with enhanced security validation."
      });
    } catch (error: any) {
      toast({
        title: "Validation Error",
        description: error.message || "Invalid input detected. Please check your settings.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Enhanced System Settings
          </DialogTitle>
          <DialogDescription>
            Configure and manage system-wide settings for EdHub with enhanced security controls
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Site Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={settings.siteName}
                    onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                    placeholder="Enter site name"
                  />
                </div>
                <div>
                  <Label htmlFor="siteDescription">Site Description</Label>
                  <Textarea
                    id="siteDescription"
                    value={settings.siteDescription}
                    onChange={(e) => setSettings({...settings, siteDescription: e.target.value})}
                    placeholder="Enter site description"
                  />
                </div>
                <div>
                  <Label htmlFor="systemEmail">System Email</Label>
                  <Input
                    id="systemEmail"
                    type="email"
                    value={settings.systemEmail}
                    onChange={(e) => setSettings({...settings, systemEmail: e.target.value})}
                    placeholder="Enter system email"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="emailNotifications">Email Notifications</Label>
                  <Switch
                    id="emailNotifications"
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => setSettings({...settings, emailNotifications: checked})}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="allowRegistration">Allow Public Registration</Label>
                  <Switch
                    id="allowRegistration"
                    checked={settings.allowRegistration}
                    onCheckedChange={(checked) => setSettings({...settings, allowRegistration: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="autoApproveTeachers">Auto-approve Teacher Applications</Label>
                  <Switch
                    id="autoApproveTeachers"
                    checked={settings.autoApproveTeachers}
                    onCheckedChange={(checked) => setSettings({...settings, autoApproveTeachers: checked})}
                  />
                </div>
                <div>
                  <Label htmlFor="maxStudents">Max Students per Course</Label>
                  <Input
                    id="maxStudents"
                    type="number"
                    value={settings.maxStudentsPerCourse}
                    onChange={(e) => setSettings({...settings, maxStudentsPerCourse: parseInt(e.target.value) || 100})}
                    min="1"
                    max="1000"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-800">
                  <Shield className="h-5 w-5" />
                  Security Configuration
                </CardTitle>
                <CardDescription className="text-orange-700">
                  Critical security settings that affect system-wide access and protection
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="requireEmailVerification">Require Email Verification</Label>
                    <p className="text-xs text-gray-500">Users must verify their email before accessing the system</p>
                  </div>
                  <Switch
                    id="requireEmailVerification"
                    checked={settings.requireEmailVerification}
                    onCheckedChange={(checked) => setSettings({...settings, requireEmailVerification: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enableAuditLogging">Enable Security Audit Logging</Label>
                    <p className="text-xs text-gray-500">Log all security-related events and administrative actions</p>
                  </div>
                  <Switch
                    id="enableAuditLogging"
                    checked={settings.enableAuditLogging}
                    onCheckedChange={(checked) => setSettings({...settings, enableAuditLogging: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="secureHeaders">Enable Security Headers</Label>
                    <p className="text-xs text-gray-500">Add security headers to prevent XSS and other attacks</p>
                  </div>
                  <Switch
                    id="secureHeaders"
                    checked={settings.secureHeaders}
                    onCheckedChange={(checked) => setSettings({...settings, secureHeaders: checked})}
                  />
                </div>
                <div>
                  <Label htmlFor="sessionTimeout">Session Timeout (hours)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => setSettings({...settings, sessionTimeout: parseInt(e.target.value) || 24})}
                    min="1"
                    max="168"
                  />
                  <p className="text-xs text-gray-500 mt-1">Users will be automatically logged out after this period</p>
                </div>
                <div>
                  <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    value={settings.maxLoginAttempts}
                    onChange={(e) => setSettings({...settings, maxLoginAttempts: parseInt(e.target.value) || 5})}
                    min="3"
                    max="10"
                  />
                  <p className="text-xs text-gray-500 mt-1">Account will be temporarily locked after this many failed attempts</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="space-y-4">
            <SecurityAuditLog />
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  System Maintenance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                    <p className="text-xs text-gray-500">Temporarily disable access for system updates</p>
                  </div>
                  <Switch
                    id="maintenanceMode"
                    checked={settings.maintenanceMode}
                    onCheckedChange={(checked) => setSettings({...settings, maintenanceMode: checked})}
                  />
                </div>
                <div>
                  <Label htmlFor="backupFrequency">Backup Frequency</Label>
                  <select 
                    className="w-full p-2 border rounded"
                    value={settings.backupFrequency}
                    onChange={(e) => setSettings({...settings, backupFrequency: e.target.value})}
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database Actions
                </CardTitle>
                <CardDescription className="flex items-center gap-2 text-orange-600">
                  <AlertTriangle className="h-4 w-4" />
                  Use these actions with extreme caution
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full">
                  Export Database Backup
                </Button>
                <Button variant="outline" className="w-full">
                  Clear System Cache
                </Button>
                <Button variant="outline" className="w-full">
                  View Security Logs
                </Button>
                <Button variant="destructive" className="w-full">
                  Reset System (Danger)
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">
            <Save className="mr-2 h-4 w-4" />
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminSettings;

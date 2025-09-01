import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Eye, Lock } from 'lucide-react';

const SecurityPrivacyMessage = () => {
  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Shield className="h-5 w-5" />
          Privacy & Security Enhanced
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Alert className="border-green-200 bg-green-50">
          <Lock className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Your privacy is protected. User identities are now anonymized in public discussions and forums.
          </AlertDescription>
        </Alert>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          <div className="bg-white/80 p-3 rounded-lg border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-800 text-sm">Data Access</span>
            </div>
            <p className="text-xs text-blue-700">
              Only admins can access personal information with full audit logging
            </p>
          </div>
          
          <div className="bg-white/80 p-3 rounded-lg border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-800 text-sm">Anonymization</span>
            </div>
            <p className="text-xs text-blue-700">
              Forum posts show anonymized user IDs instead of real names
            </p>
          </div>
          
          <div className="bg-white/80 p-3 rounded-lg border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-800 text-sm">Audit Logs</span>
            </div>
            <p className="text-xs text-blue-700">
              All access to sensitive data is logged and monitored
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SecurityPrivacyMessage;
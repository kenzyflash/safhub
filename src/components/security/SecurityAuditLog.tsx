
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Search, AlertTriangle, RefreshCw, Clock, User, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

// Audit log entry interface matching Supabase types
interface AuditLogEntry {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details: any; // Json type from Supabase can be string, number, boolean, object, array, or null
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
}

const SecurityAuditLog = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { userRole } = useAuth();

  useEffect(() => {
    if (userRole === 'admin') {
      fetchAuditLogs();
    }
  }, [userRole]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (userRole !== 'admin') {
        throw new Error('Access denied. Admin role required.');
      }

      // Fetch from the real security_audit_log table
      const { data, error } = await supabase
        .from('security_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        throw error;
      }
      
      setAuditLogs((data || []).map(item => ({
        ...item,
        ip_address: item.ip_address as string | null,
        user_agent: item.user_agent as string | null,
        details: item.details || {}
      })));
      
    } catch (error: any) {
      console.error('Error in fetchAuditLogs:', error);
      
      let errorMessage = "Failed to load security audit logs.";
      if (error.message?.includes('Access denied')) {
        errorMessage = "Access denied. You may not have the required admin permissions.";
      } else if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        errorMessage = "Security audit log table not found. Database migration may be incomplete.";
      }
      
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('SUCCESS')) return 'bg-green-100 text-green-800';
    if (action.includes('ERROR') || action.includes('FAILED')) return 'bg-red-100 text-red-800';
    if (action.includes('UNAUTHORIZED') || action.includes('DENIED')) return 'bg-red-100 text-red-800';
    if (action.includes('ATTEMPT')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-blue-100 text-blue-800';
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = actionFilter === 'all' || log.action.includes(actionFilter.toUpperCase());
    return matchesSearch && matchesAction;
  });

  if (userRole !== 'admin') {
    return (
      <Card className="bg-white/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="text-center">
            <Shield className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600">You don't have permission to access security audit logs.</p>
            <p className="text-sm text-gray-500 mt-2">This section is restricted to administrators only.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p>Loading security audit logs...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Notice */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900">Security Audit Log Active</p>
              <p className="text-xs text-green-700">All security events are being logged and monitored. Showing most recent 100 entries.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">Notice</p>
                <p className="text-xs text-red-700">{error}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setError(null);
                  fetchAuditLogs();
                }}
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Audit Log Management */}
      <Card className="bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-red-600" />
            Security Audit Log
          </CardTitle>
          <CardDescription>
            Monitor and review all security-related activities - Showing {filteredLogs.length} entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by action, resource, or user ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by action type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="error">Errors</SelectItem>
                <SelectItem value="unauthorized">Unauthorized</SelectItem>
                <SelectItem value="role">Role Changes</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={fetchAuditLogs} 
              variant="outline" 
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Audit Log Table */}
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Database className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm font-medium mb-1">No audit logs found</p>
              <p className="text-xs">
                {error ? "Unable to load logs due to an error." : "No security events match your current filters."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(log.created_at).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {log.user_id?.slice(0, 8)}...
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getActionBadgeColor(log.action)}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{log.resource_type}</div>
                        {log.resource_id && (
                          <div className="text-xs text-gray-500 font-mono">
                            {log.resource_id.slice(0, 8)}...
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs max-w-xs truncate">
                        {JSON.stringify(log.details)}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {log.ip_address || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityAuditLog;

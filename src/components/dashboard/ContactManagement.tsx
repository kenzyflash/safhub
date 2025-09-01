
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, MessageSquare, Calendar, User, Filter, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
}

const ContactManagement = () => {
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [selectedInquiry, setSelectedInquiry] = useState<ContactInquiry | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      console.log('Fetching contact inquiries with security audit...');
      
      // Use the new secure function that includes audit logging
      const { data, error } = await supabase.rpc('get_contact_inquiries_with_audit');

      if (error) {
        console.error('Error fetching contact inquiries:', error);
        throw error;
      }

      console.log('Contact inquiries fetched with audit:', data);
      setInquiries(data || []);
    } catch (error) {
      console.error('Error fetching contact inquiries:', error);
      toast({
        title: "Error",
        description: "Failed to load contact inquiries. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (inquiryId: string, newStatus: string) => {
    try {
      setUpdating(inquiryId);
      console.log(`Updating inquiry ${inquiryId} status to ${newStatus}`);
      
      const { error } = await supabase
        .from('contact_inquiries')
        .update({ status: newStatus })
        .eq('id', inquiryId);

      if (error) {
        console.error('Error updating status:', error);
        throw error;
      }

      // Update local state
      setInquiries(prev => 
        prev.map(inquiry => 
          inquiry.id === inquiryId ? { ...inquiry, status: newStatus } : inquiry
        )
      );

      // Update selected inquiry if it's the one being updated
      if (selectedInquiry && selectedInquiry.id === inquiryId) {
        setSelectedInquiry(prev => prev ? { ...prev, status: newStatus } : null);
      }

      toast({
        title: "Status Updated",
        description: `Inquiry marked as ${newStatus}`,
      });

      console.log(`Successfully updated inquiry ${inquiryId} to ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update inquiry status. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUpdating(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredInquiries = inquiries.filter(inquiry => 
    statusFilter === 'all' || inquiry.status === statusFilter
  );

  const stats = {
    total: inquiries.length,
    new: inquiries.filter(i => i.status === 'new').length,
    inProgress: inquiries.filter(i => i.status === 'in-progress').length,
    resolved: inquiries.filter(i => i.status === 'resolved').length
  };

  const viewInquiry = (inquiry: ContactInquiry) => {
    console.log('Viewing inquiry:', inquiry.id);
    setSelectedInquiry(inquiry);
    setIsDialogOpen(true);
  };

  const openEmailClient = (email: string, subject: string) => {
    const mailtoUrl = `mailto:${email}?subject=Re: ${encodeURIComponent(subject)}`;
    window.open(mailtoUrl, '_blank');
  };

  if (loading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            <span className="ml-3">Loading contact inquiries...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            Contact Form Management
          </CardTitle>
          <CardDescription>
            Manage and respond to customer inquiries and support requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-blue-600">Total Inquiries</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
              <div className="text-2xl font-bold text-yellow-600">{stats.new}</div>
              <div className="text-sm text-yellow-600">New</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
              <div className="text-2xl font-bold text-orange-600">{stats.inProgress}</div>
              <div className="text-sm text-orange-600">In Progress</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
              <div className="text-sm text-green-600">Resolved</div>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="flex items-center gap-4 mb-4">
            <Filter className="h-4 w-4 text-gray-500" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Inquiries</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={fetchInquiries} disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>

          {/* Inquiries Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInquiries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="text-gray-500">
                        {statusFilter === 'all' 
                          ? 'No contact inquiries found.' 
                          : `No ${statusFilter} inquiries found.`
                        }
                      </div>
                      {inquiries.length === 0 && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2"
                          onClick={fetchInquiries}
                        >
                          Try Refresh
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInquiries.map((inquiry) => (
                    <TableRow key={inquiry.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="font-medium">{inquiry.name}</div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              {inquiry.email}
                              <button
                                onClick={() => openEmailClient(inquiry.email, inquiry.subject)}
                                className="text-blue-500 hover:text-blue-700"
                                title="Send email"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <div className="font-medium truncate">{inquiry.subject}</div>
                          <div className="text-sm text-gray-500 truncate">
                            {inquiry.message.length > 60 
                              ? inquiry.message.substring(0, 60) + '...' 
                              : inquiry.message
                            }
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(inquiry.status)} variant="outline">
                          {inquiry.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Calendar className="h-3 w-3" />
                          {new Date(inquiry.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewInquiry(inquiry)}
                          >
                            View
                          </Button>
                          {inquiry.status !== 'resolved' && (
                            <Select
                              value={inquiry.status}
                              onValueChange={(value) => updateStatus(inquiry.id, value)}
                              disabled={updating === inquiry.id}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="new">New</SelectItem>
                                <SelectItem value="in-progress">In Progress</SelectItem>
                                <SelectItem value="resolved">Resolved</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View Inquiry Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Contact Inquiry Details
            </DialogTitle>
            <DialogDescription>
              Full details of the customer inquiry
            </DialogDescription>
          </DialogHeader>
          {selectedInquiry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Name</label>
                  <p className="text-sm text-gray-900">{selectedInquiry.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-900">{selectedInquiry.email}</p>
                    <button
                      onClick={() => openEmailClient(selectedInquiry.email, selectedInquiry.subject)}
                      className="text-blue-500 hover:text-blue-700"
                      title="Send email"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Subject</label>
                <p className="text-sm text-gray-900">{selectedInquiry.subject}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Message</label>
                <div className="bg-gray-50 p-3 rounded-md border">
                  <p className="text-sm whitespace-pre-wrap text-gray-900">{selectedInquiry.message}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1">
                    <Badge className={getStatusColor(selectedInquiry.status)} variant="outline">
                      {selectedInquiry.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Received</label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedInquiry.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => updateStatus(selectedInquiry.id, 'in-progress')}
                  disabled={selectedInquiry.status === 'in-progress' || updating === selectedInquiry.id}
                >
                  Mark In Progress
                </Button>
                <Button
                  onClick={() => updateStatus(selectedInquiry.id, 'resolved')}
                  disabled={selectedInquiry.status === 'resolved' || updating === selectedInquiry.id}
                >
                  Mark Resolved
                </Button>
                <Button
                  variant="outline"
                  onClick={() => openEmailClient(selectedInquiry.email, selectedInquiry.subject)}
                  className="ml-auto"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Reply via Email
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContactManagement;

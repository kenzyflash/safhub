import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import ForumCard from "@/components/forum/ForumCard";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { MessageSquare, Plus, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Forum {
  id: string;
  title: string;
  description: string;
  category: string;
  created_at: string;
  created_by: string;
  is_active: boolean;
  post_count?: number;
}

const ForumPage = () => {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [forums, setForums] = useState<Forum[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newForum, setNewForum] = useState({
    title: '',
    description: '',
    category: 'general'
  });

  useEffect(() => {
    fetchForums();
  }, []);

  const fetchForums = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('forums')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setForums(data);
      } else {
        console.log('Error fetching forums:', error);
        setForums([]);
      }
    } catch (error) {
      console.error('Error fetching forums:', error);
      setForums([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateForum = async () => {
    if (!user || !newForum.title.trim()) return;

    try {
      const { error } = await supabase
        .from('forums')
        .insert({
          title: newForum.title,
          description: newForum.description,
          category: newForum.category,
          created_by: user.id
        });

      if (!error) {
        toast({
          title: "Success",
          description: "Forum created successfully!",
        });

        setIsCreateDialogOpen(false);
        setNewForum({ title: '', description: '', category: 'general' });
        fetchForums();
      } else {
        throw error;
      }
    } catch (error) {
      console.error('Error creating forum:', error);
      toast({
        title: "Error",
        description: "Failed to create forum. Please try again later.",
        variant: "destructive",
      });
    }
  };

  const filteredForums = forums.filter(forum => {
    const matchesSearch = forum.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         forum.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || forum.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['general', 'study-help', 'announcements', 'projects', 'discussions'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
        <DashboardHeader title="EdHub - Community Forums" />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading forums...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
      <DashboardHeader title="EdHub - Community Forums" />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Community Forums</h1>
              <p className="text-gray-600">Connect with fellow learners and share knowledge</p>
            </div>
            
            {(userRole === 'teacher' || userRole === 'admin') && (
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create Forum
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Forum</DialogTitle>
                    <DialogDescription>
                      Create a new discussion forum for the community
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Title</label>
                      <Input
                        value={newForum.title}
                        onChange={(e) => setNewForum({...newForum, title: e.target.value})}
                        placeholder="Enter forum title"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Description</label>
                      <Textarea
                        value={newForum.description}
                        onChange={(e) => setNewForum({...newForum, description: e.target.value})}
                        placeholder="Describe what this forum is about"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Category</label>
                      <Select value={newForum.category} onValueChange={(value) => setNewForum({...newForum, category: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateForum}>
                      Create Forum
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Search and Filter */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search forums..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredForums.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredForums.map((forum) => (
              <ForumCard
                key={forum.id}
                forum={forum}
                onClick={() => {
                  navigate(`/forum/${forum.id}`);
                }}
              />
            ))}
          </div>
        ) : (
          <Card className="text-center py-12 bg-white/80 backdrop-blur-sm">
            <CardContent>
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Forums Found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || selectedCategory !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Be the first to create a forum for the community!'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ForumPage;


import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import ForumPostCard from "@/components/forum/ForumPostCard";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { ArrowLeft, Plus, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Forum {
  id: string;
  title: string;
  description: string;
  category: string;
  created_at: string;
  created_by: string;
  is_active: boolean;
}

interface ForumPost {
  id: string;
  title: string;
  content: string;
  upvotes: number;
  downvotes: number;
  created_at: string;
  user_id: string;
  forum_id: string;
  author_name?: string;
  reply_count?: number;
}

const ForumDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  
  const [forum, setForum] = useState<Forum | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreatePostDialogOpen, setIsCreatePostDialogOpen] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    content: ''
  });

  useEffect(() => {
    if (id) {
      fetchForumData();
      fetchForumPosts();
    }
  }, [id]);

  const fetchForumData = async () => {
    try {
      const { data, error } = await supabase
        .from('forums')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error fetching forum:', error);
        toast({
          title: "Error",
          description: "Failed to load forum details",
          variant: "destructive",
        });
        return;
      }

      if (!data) {
        toast({
          title: "Forum not found",
          description: "The requested forum does not exist or has been deactivated",
          variant: "destructive",
        });
        navigate('/forum');
        return;
      }

      setForum(data);
    } catch (error) {
      console.error('Error fetching forum:', error);
      toast({
        title: "Error",
        description: "Failed to load forum details",
        variant: "destructive",
      });
    }
  };

  const fetchForumPosts = async () => {
    try {
      setLoading(true);
      
      // First, get the forum posts
      const { data: postsData, error: postsError } = await supabase
        .from('forum_posts')
        .select('*')
        .eq('forum_id', id)
        .order('created_at', { ascending: false });

      if (postsError) {
        console.error('Error fetching posts:', postsError);
        setPosts([]);
        return;
      }

      if (!postsData || postsData.length === 0) {
        setPosts([]);
        return;
      }

      // Get unique user IDs from posts
      const userIds = [...new Set(postsData.map(post => post.user_id))];
      
      // Fetch anonymized profiles for these users
      const profilePromises = userIds.map(async (userId) => {
        const { data, error } = await supabase
          .rpc('get_anonymized_profile', { profile_id: userId });
        
        if (error) {
          console.error('Error fetching profile for user:', userId, error);
          return { id: userId, display_name: 'Anonymous User', avatar_url: null };
        }
        
        return {
          id: userId,
          display_name: data?.[0]?.display_name || 'Anonymous User',
          avatar_url: data?.[0]?.avatar_url
        };
      });

      const profilesData = await Promise.all(profilePromises);

      // Create a map of user ID to profile
      const profilesMap = new Map(
        profilesData.map(profile => [profile.id, profile])
      );

      // Combine posts with anonymized profile data
      const postsWithAuthors = postsData.map(post => {
        const profile = profilesMap.get(post.user_id);
        return {
          ...post,
          author_name: profile?.display_name || 'Anonymous',
          reply_count: 0 // TODO: Add actual reply count when replies are implemented
        };
      });

      setPosts(postsWithAuthors);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!user || !newPost.title.trim() || !newPost.content.trim()) return;

    try {
      const { error } = await supabase
        .from('forum_posts')
        .insert({
          title: newPost.title,
          content: newPost.content,
          forum_id: id,
          user_id: user.id
        });

      if (!error) {
        toast({
          title: "Success",
          description: "Post created successfully!",
        });

        setIsCreatePostDialogOpen(false);
        setNewPost({ title: '', content: '' });
        fetchForumPosts();
      } else {
        throw error;
      }
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePostClick = (post: ForumPost) => {
    navigate(`/forum/${id}/post/${post.id}`);
  };

  if (loading && !forum) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
        <DashboardHeader title="SafHub - Forum" />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading forum...</div>
        </div>
      </div>
    );
  }

  if (!forum) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
        <DashboardHeader title="SafHub - Forum" />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Forum Not Found</h2>
            <p className="text-gray-600 mb-4">The requested forum does not exist or has been removed.</p>
            <Button onClick={() => navigate('/forum')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Forums
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
      <DashboardHeader title="SafHub - Forum" />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/forum')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Forums
          </Button>

          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">{forum.title}</h1>
                <p className="text-gray-600 mb-3">{forum.description}</p>
                <Badge variant="outline">
                  {forum.category.charAt(0).toUpperCase() + forum.category.slice(1).replace('-', ' ')}
                </Badge>
              </div>
              
              {user && (
                <Dialog open={isCreatePostDialogOpen} onOpenChange={setIsCreatePostDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      New Post
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Post</DialogTitle>
                      <DialogDescription>
                        Share your thoughts with the community
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Title</label>
                        <Input
                          value={newPost.title}
                          onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                          placeholder="Enter post title"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Content</label>
                        <Textarea
                          value={newPost.content}
                          onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                          placeholder="Write your post content"
                          rows={5}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                      <Button variant="outline" onClick={() => setIsCreatePostDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreatePost}>
                        Create Post
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>

        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Posts</h2>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading posts...</div>
        ) : posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post) => (
              <ForumPostCard
                key={post.id}
                post={post}
                onClick={() => handlePostClick(post)}
              />
            ))}
          </div>
        ) : (
          <Card className="text-center py-12 bg-white/80 backdrop-blur-sm">
            <CardContent>
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Posts Yet</h3>
              <p className="text-gray-500 mb-4">
                Be the first to start a discussion in this forum!
              </p>
              {user && (
                <Button onClick={() => setIsCreatePostDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Post
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ForumDetailPage;

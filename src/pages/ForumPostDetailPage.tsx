import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { ArrowLeft, ThumbsUp, ThumbsDown, MessageCircle, Clock, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
}

interface Forum {
  id: string;
  title: string;
  category: string;
}

interface Reply {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  author_name?: string;
}

const ForumPostDetailPage = () => {
  const { forumId, postId } = useParams<{ forumId: string; postId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [post, setPost] = useState<ForumPost | null>(null);
  const [forum, setForum] = useState<Forum | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [userVote, setUserVote] = useState<string | null>(null);
  const [newReply, setNewReply] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  useEffect(() => {
    if (postId && forumId) {
      fetchPostData();
      fetchForumData();
      fetchReplies();
      if (user) {
        fetchUserVote();
      }
    }
  }, [postId, forumId, user]);

  const fetchPostData = async () => {
    try {
      const { data: postData, error: postError } = await supabase
        .from('forum_posts')
        .select('*')
        .eq('id', postId)
        .single();

      if (postError || !postData) {
        toast({
          title: "Error",
          description: "Post not found",
          variant: "destructive",
        });
        navigate(`/forum/${forumId}`);
        return;
      }

      // Fetch author profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', postData.user_id)
        .single();

      setPost({
        ...postData,
        author_name: profileData 
          ? `${profileData.first_name} ${profileData.last_name}`.trim() || 'Anonymous'
          : 'Anonymous'
      });
    } catch (error) {
      console.error('Error fetching post:', error);
      toast({
        title: "Error",
        description: "Failed to load post",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchForumData = async () => {
    try {
      const { data } = await supabase
        .from('forums')
        .select('id, title, category')
        .eq('id', forumId)
        .single();
      
      if (data) {
        setForum(data);
      }
    } catch (error) {
      console.error('Error fetching forum:', error);
    }
  };

  const fetchReplies = async () => {
    try {
      const { data: repliesData } = await supabase
        .from('forum_post_replies')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (repliesData && repliesData.length > 0) {
        const userIds = [...new Set(repliesData.map(reply => reply.user_id))];
        
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', userIds);

        const profilesMap = new Map(
          profilesData?.map(profile => [profile.id, profile]) || []
        );

        const repliesWithAuthors = repliesData.map(reply => {
          const profile = profilesMap.get(reply.user_id);
          return {
            ...reply,
            author_name: profile 
              ? `${profile.first_name} ${profile.last_name}`.trim() || 'Anonymous'
              : 'Anonymous'
          };
        });

        setReplies(repliesWithAuthors);
      }
    } catch (error) {
      console.error('Error fetching replies:', error);
    }
  };

  const fetchUserVote = async () => {
    try {
      const { data } = await supabase.rpc('get_user_vote_on_post', {
        p_post_id: postId
      });
      setUserVote(data);
    } catch (error) {
      console.error('Error fetching user vote:', error);
    }
  };

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    if (!user || !post) return;

    try {
      const { data, error } = await supabase.rpc('vote_forum_post', {
        p_post_id: postId,
        p_vote_type: voteType
      });

      if (!error && data) {
        const voteData = data as { upvotes: number; downvotes: number };
        setPost(prev => prev ? { ...prev, upvotes: voteData.upvotes, downvotes: voteData.downvotes } : prev);
        setUserVote(current => current === voteType ? null : voteType);
      }
    } catch (error) {
      console.error('Error voting:', error);
      toast({
        title: "Error",
        description: "Failed to vote",
        variant: "destructive",
      });
    }
  };

  const handleReplySubmit = async () => {
    if (!user || !newReply.trim()) return;

    try {
      setSubmittingReply(true);
      
      const { error } = await supabase
        .from('forum_post_replies')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: newReply.trim()
        });

      if (!error) {
        setNewReply('');
        fetchReplies();
        toast({
          title: "Success",
          description: "Reply posted successfully!",
        });
      }
    } catch (error) {
      console.error('Error posting reply:', error);
      toast({
        title: "Error",
        description: "Failed to post reply",
        variant: "destructive",
      });
    } finally {
      setSubmittingReply(false);
    }
  };

  if (loading || !post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
        <DashboardHeader title="SafHub - Forum" />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading post...</div>
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
            onClick={() => navigate(`/forum/${forumId}`)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to {forum?.title || 'Forum'}
          </Button>

          {forum && (
            <div className="mb-4">
              <Badge variant="outline">
                {forum.category.charAt(0).toUpperCase() + forum.category.slice(1).replace('-', ' ')}
              </Badge>
            </div>
          )}
        </div>

        {/* Post Content */}
        <Card className="bg-white/90 backdrop-blur-sm mb-6">
          <CardHeader>
            <CardTitle className="text-2xl text-gray-800">{post.title}</CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>by {post.author_name}</span>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{new Date(post.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 text-gray-700 whitespace-pre-wrap">
              {post.content}
            </div>
            
            <div className="flex items-center gap-4">
              <Button
                variant={userVote === 'upvote' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleVote('upvote')}
                disabled={!user}
              >
                <ThumbsUp className="h-4 w-4 mr-1" />
                {post.upvotes}
              </Button>
              
              <Button
                variant={userVote === 'downvote' ? 'destructive' : 'outline'}
                size="sm"
                onClick={() => handleVote('downvote')}
                disabled={!user}
              >
                <ThumbsDown className="h-4 w-4 mr-1" />
                {post.downvotes}
              </Button>
              
              <div className="flex items-center gap-1 text-blue-600">
                <MessageCircle className="h-4 w-4" />
                <span className="text-sm">{replies.length} replies</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reply Form */}
        {user && (
          <Card className="bg-white/90 backdrop-blur-sm mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Add a Reply</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  value={newReply}
                  onChange={(e) => setNewReply(e.target.value)}
                  placeholder="Write your reply..."
                  rows={4}
                />
                <Button 
                  onClick={handleReplySubmit}
                  disabled={!newReply.trim() || submittingReply}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {submittingReply ? 'Posting...' : 'Post Reply'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Replies */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Replies ({replies.length})
          </h2>
          
          {replies.map((reply) => (
            <Card key={reply.id} className="bg-white/80 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="mb-3">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <span className="font-medium">{reply.author_name}</span>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(reply.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="text-gray-700 whitespace-pre-wrap">
                    {reply.content}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {replies.length === 0 && (
            <Card className="bg-white/80 backdrop-blur-sm text-center py-8">
              <CardContent>
                <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">No replies yet. Be the first to reply!</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForumPostDetailPage;
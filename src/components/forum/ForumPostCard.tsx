
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, MessageCircle, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ForumPost {
  id: string;
  title: string;
  content: string;
  upvotes: number;
  downvotes: number;
  created_at: string;
  reply_count?: number;
  author_name?: string;
}

interface ForumPostCardProps {
  post: ForumPost;
  onClick: () => void;
}

const ForumPostCard = ({ post, onClick }: ForumPostCardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userVote, setUserVote] = useState<string | null>(null);
  const [currentPost, setCurrentPost] = useState(post);

  useEffect(() => {
    setCurrentPost(post);
    if (user) {
      fetchUserVote();
    }
  }, [post, user]);

  const fetchUserVote = async () => {
    try {
      const { data } = await supabase.rpc('get_user_vote_on_post', {
        p_post_id: post.id
      });
      setUserVote(data);
    } catch (error) {
      console.error('Error fetching user vote:', error);
    }
  };

  const handleVote = async (e: React.MouseEvent, voteType: 'upvote' | 'downvote') => {
    e.stopPropagation();
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('vote_forum_post', {
        p_post_id: post.id,
        p_vote_type: voteType
      });

      if (!error && data) {
        const voteData = data as { upvotes: number; downvotes: number };
        setCurrentPost(prev => ({ ...prev, upvotes: voteData.upvotes, downvotes: voteData.downvotes }));
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
  return (
    <Card 
      className="cursor-pointer transition-all hover:shadow-md hover:border-blue-300 bg-white/90 backdrop-blur-sm"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-gray-800 mb-1">{post.title}</CardTitle>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>by {post.author_name || 'Anonymous'}</span>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{new Date(post.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-sm mb-4 line-clamp-3">
          {currentPost.content}
        </CardDescription>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant={userVote === 'upvote' ? 'default' : 'outline'}
              size="sm"
              onClick={(e) => handleVote(e, 'upvote')}
              disabled={!user}
            >
              <ThumbsUp className="h-4 w-4 mr-1" />
              {currentPost.upvotes || 0}
            </Button>
            <Button
              variant={userVote === 'downvote' ? 'destructive' : 'outline'}
              size="sm"
              onClick={(e) => handleVote(e, 'downvote')}
              disabled={!user}
            >
              <ThumbsDown className="h-4 w-4 mr-1" />
              {currentPost.downvotes || 0}
            </Button>
            <div className="flex items-center gap-1 text-blue-600">
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm">{currentPost.reply_count || 0} replies</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ForumPostCard;

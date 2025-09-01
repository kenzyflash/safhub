
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThumbsUp, ThumbsDown, MessageSquare, Send, Edit, Save, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Discussion {
  id: string;
  content: string;
  upvotes: number;
  downvotes: number;
  created_at: string;
  user_id: string;
  parent_id: string | null;
  profiles: {
    first_name: string;
    last_name: string;
  } | null;
  hasUpvoted?: boolean;
  hasDownvoted?: boolean;
  replies?: Discussion[];
}

interface CourseDiscussionProps {
  courseId: string;
}

const CourseDiscussion = ({ courseId }: CourseDiscussionProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [newDiscussion, setNewDiscussion] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  useEffect(() => {
    fetchDiscussions();
  }, [courseId, user]);

  const fetchDiscussions = async () => {
    try {
      // Use secure function to get anonymized discussions for enrolled users
      const { data: discussionsData, error: discussionsError } = await supabase
        .rpc('get_course_discussions_secure', { course_id_param: courseId });

      if (discussionsError) throw discussionsError;

      if (!discussionsData || discussionsData.length === 0) {
        setDiscussions([]);
        setLoading(false);
        return;
      }

      // Check which discussions the current user has upvoted/downvoted
      let upvotedIds: string[] = [];
      let downvotedIds: string[] = [];
      if (user) {
        const { data: upvotes } = await supabase
          .from('discussion_upvotes')
          .select('discussion_id')
          .eq('user_id', user.id);

        // Use any type to bypass TypeScript issues until types are regenerated
        const { data: downvotes } = await (supabase as any)
          .from('discussion_downvotes')
          .select('discussion_id')
          .eq('user_id', user.id);

        upvotedIds = upvotes?.map(u => u.discussion_id) || [];
        downvotedIds = downvotes?.map((d: any) => d.discussion_id) || [];
      }

      // Transform secure discussion data
      const discussionsWithProfiles = discussionsData.map((discussion: any) => ({
        ...discussion,
        user_id: discussion.is_own_post ? user?.id : 'anonymous',
        profiles: {
          first_name: discussion.is_own_post ? 'You' : 'Student',
          last_name: discussion.is_own_post ? '' : discussion.anonymous_user_id.replace('user_', '')
        },
        hasUpvoted: upvotedIds.includes(discussion.id),
        hasDownvoted: downvotedIds.includes(discussion.id)
      }));

      // Separate parent discussions and replies
      const parentDiscussions = discussionsWithProfiles.filter(d => !d.parent_id);
      const replies = discussionsWithProfiles.filter(d => d.parent_id);

      // Attach replies to their parent discussions
      const discussionsWithReplies = parentDiscussions.map(parent => ({
        ...parent,
        replies: replies.filter(reply => reply.parent_id === parent.id)
      }));

      setDiscussions(discussionsWithReplies);
    } catch (error) {
      console.error('Error fetching discussions:', error);
      toast({
        title: "Error",
        description: "Failed to load discussions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const submitDiscussion = async () => {
    if (!user || !newDiscussion.trim()) return;

    try {
      const { error } = await supabase
        .from('course_discussions')
        .insert({
          course_id: courseId,
          user_id: user.id,
          content: newDiscussion.trim()
        });

      if (error) throw error;

      setNewDiscussion('');
      await fetchDiscussions();
      
      toast({
        title: "Discussion posted",
        description: "Your discussion has been added successfully"
      });
    } catch (error) {
      console.error('Error submitting discussion:', error);
      toast({
        title: "Error",
        description: "Failed to post discussion",
        variant: "destructive"
      });
    }
  };

  const submitReply = async (parentId: string) => {
    if (!user || !replyContent.trim()) return;

    try {
      const { error } = await supabase
        .from('course_discussions')
        .insert({
          course_id: courseId,
          user_id: user.id,
          content: replyContent.trim(),
          parent_id: parentId
        });

      if (error) throw error;

      setReplyContent('');
      setReplyingTo(null);
      await fetchDiscussions();
      
      toast({
        title: "Reply posted",
        description: "Your reply has been added successfully"
      });
    } catch (error) {
      console.error('Error submitting reply:', error);
      toast({
        title: "Error",
        description: "Failed to post reply",
        variant: "destructive"
      });
    }
  };

  const updateDiscussion = async (discussionId: string) => {
    if (!user || !editContent.trim()) return;

    try {
      const { error } = await supabase
        .from('course_discussions')
        .update({ content: editContent.trim() })
        .eq('id', discussionId)
        .eq('user_id', user.id);

      if (error) throw error;

      setEditingId(null);
      setEditContent('');
      await fetchDiscussions();
      
      toast({
        title: "Discussion updated",
        description: "Your discussion has been updated successfully"
      });
    } catch (error) {
      console.error('Error updating discussion:', error);
      toast({
        title: "Error",
        description: "Failed to update discussion",
        variant: "destructive"
      });
    }
  };

  const toggleUpvote = async (discussionId: string, hasUpvoted: boolean) => {
    if (!user) return;

    try {
      if (hasUpvoted) {
        // Remove upvote
        const { error } = await supabase
          .from('discussion_upvotes')
          .delete()
          .eq('discussion_id', discussionId)
          .eq('user_id', user.id);

        if (error) throw error;

        // Update upvote count
        const { error: updateError } = await supabase.rpc('decrement_upvotes', {
          discussion_id: discussionId
        });

        if (updateError) throw updateError;
      } else {
        // Remove downvote if exists
        await (supabase as any)
          .from('discussion_downvotes')
          .delete()
          .eq('discussion_id', discussionId)
          .eq('user_id', user.id);

        // Add upvote
        const { error } = await supabase
          .from('discussion_upvotes')
          .insert({
            discussion_id: discussionId,
            user_id: user.id
          });

        if (error) throw error;

        // Update upvote count
        const { error: updateError } = await supabase.rpc('increment_upvotes', {
          discussion_id: discussionId
        });

        if (updateError) throw updateError;
      }

      await fetchDiscussions();
    } catch (error) {
      console.error('Error toggling upvote:', error);
      toast({
        title: "Error",
        description: "Failed to update upvote",
        variant: "destructive"
      });
    }
  };

  const toggleDownvote = async (discussionId: string, hasDownvoted: boolean) => {
    if (!user) return;

    try {
      if (hasDownvoted) {
        // Remove downvote
        const { error } = await (supabase as any)
          .from('discussion_downvotes')
          .delete()
          .eq('discussion_id', discussionId)
          .eq('user_id', user.id);

        if (error) throw error;

        // Update downvote count
        const { error: updateError } = await (supabase as any).rpc('decrement_downvotes', {
          discussion_id: discussionId
        });

        if (updateError) throw updateError;
      } else {
        // Remove upvote if exists
        await supabase
          .from('discussion_upvotes')
          .delete()
          .eq('discussion_id', discussionId)
          .eq('user_id', user.id);

        // Add downvote
        const { error } = await (supabase as any)
          .from('discussion_downvotes')
          .insert({
            discussion_id: discussionId,
            user_id: user.id
          });

        if (error) throw error;

        // Update downvote count
        const { error: updateError } = await (supabase as any).rpc('increment_downvotes', {
          discussion_id: discussionId
        });

        if (updateError) throw updateError;
      }

      await fetchDiscussions();
    } catch (error) {
      console.error('Error toggling downvote:', error);
      toast({
        title: "Error",
        description: "Failed to update downvote",
        variant: "destructive"
      });
    }
  };

  const startEdit = (discussion: Discussion) => {
    setEditingId(discussion.id);
    setEditContent(discussion.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const startReply = (discussionId: string) => {
    setReplyingTo(discussionId);
    setReplyContent('');
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setReplyContent('');
  };

  const renderDiscussion = (discussion: Discussion, isReply: boolean = false) => (
    <div key={discussion.id} className={`border rounded-lg p-4 space-y-3 ${isReply ? 'ml-8 bg-gray-50' : ''}`}>
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback>
            {discussion.profiles?.first_name?.[0] || 'U'}{discussion.profiles?.last_name?.[0] || ''}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">
              {discussion.profiles?.first_name || 'Unknown'} {discussion.profiles?.last_name || 'User'}
            </span>
            <span className="text-xs text-gray-500">
              {new Date(discussion.created_at).toLocaleDateString()}
            </span>
            {user?.id === discussion.user_id && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => startEdit(discussion)}
                className="text-xs h-6 px-2"
              >
                <Edit className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          {editingId === discussion.id ? (
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[80px]"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => updateDiscussion(discussion.id)}
                  disabled={!editContent.trim()}
                  className="h-8"
                >
                  <Save className="mr-1 h-3 w-3" />
                  Save
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cancelEdit}
                  className="h-8"
                >
                  <X className="mr-1 h-3 w-3" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-gray-700 text-sm">{discussion.content}</p>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toggleUpvote(discussion.id, discussion.hasUpvoted || false)}
          className={`text-xs ${discussion.hasUpvoted ? 'text-blue-600' : 'text-gray-500'}`}
          disabled={!user}
        >
          <ThumbsUp className={`mr-1 h-3 w-3 ${discussion.hasUpvoted ? 'fill-current' : ''}`} />
          {discussion.upvotes}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toggleDownvote(discussion.id, discussion.hasDownvoted || false)}
          className={`text-xs ${discussion.hasDownvoted ? 'text-red-600' : 'text-gray-500'}`}
          disabled={!user}
        >
          <ThumbsDown className={`mr-1 h-3 w-3 ${discussion.hasDownvoted ? 'fill-current' : ''}`} />
          {discussion.downvotes}
        </Button>

        {!isReply && user && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => startReply(discussion.id)}
            className="text-xs text-gray-500"
          >
            <MessageSquare className="mr-1 h-3 w-3" />
            Reply
          </Button>
        )}
      </div>

      {/* Reply Form */}
      {replyingTo === discussion.id && (
        <div className="ml-8 space-y-2">
          <Textarea
            placeholder="Write your reply..."
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            className="min-h-[80px]"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => submitReply(discussion.id)}
              disabled={!replyContent.trim()}
              className="h-8 bg-emerald-600 hover:bg-emerald-700"
            >
              <Send className="mr-1 h-3 w-3" />
              Reply
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={cancelReply}
              className="h-8"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Replies */}
      {discussion.replies && discussion.replies.length > 0 && (
        <div className="space-y-2">
          {discussion.replies.map(reply => renderDiscussion(reply, true))}
        </div>
      )}
    </div>
  );

  if (loading) {
    return <div>Loading discussions...</div>;
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-blue-600" />
          Course Discussion
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* New Discussion Form */}
        {user && (
          <div className="space-y-3">
            <Textarea
              placeholder="Share your thoughts about this course..."
              value={newDiscussion}
              onChange={(e) => setNewDiscussion(e.target.value)}
              className="min-h-[100px]"
            />
            <Button 
              onClick={submitDiscussion}
              disabled={!newDiscussion.trim()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Send className="mr-2 h-4 w-4" />
              Post Discussion
            </Button>
          </div>
        )}

        {/* Discussions List */}
        <div className="space-y-4">
          {discussions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No discussions yet. Be the first to start a conversation!
            </p>
          ) : (
            discussions.map(discussion => renderDiscussion(discussion))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CourseDiscussion;

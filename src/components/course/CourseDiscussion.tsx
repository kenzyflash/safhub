/**
 * CourseDiscussion.tsx
 * ---------------------
 * Course discussion board where enrolled students can post, reply,
 * edit their own posts, and upvote/downvote discussions.
 *
 * Security:
 *  - Uses the `get_course_discussions_secure` RPC which enforces
 *    enrollment checks and returns anonymised user IDs.
 *  - Auth guard: skips fetching when user session is not yet loaded
 *    (prevents "Access denied" error on initial mount).
 *
 * See docs/FEATURES-DISCUSSED.md #10 for the auth guard fix context.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThumbsUp, ThumbsDown, MessageSquare, Send, Edit, Save, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

/** Shape of a single discussion post (includes optional nested replies) */
interface Discussion {
  id: string;                         // Unique discussion ID
  content: string;                    // Post content text
  upvotes: number;                    // Total upvote count
  downvotes: number;                  // Total downvote count
  created_at: string;                 // ISO timestamp of creation
  user_id: string;                    // Owner user ID (or 'anonymous' for others' posts)
  parent_id: string | null;           // Parent discussion ID (null for top-level posts)
  profiles: {                         // Display name info
    first_name: string;
    last_name: string;
  } | null;
  hasUpvoted?: boolean;               // Whether current user has upvoted this post
  hasDownvoted?: boolean;             // Whether current user has downvoted this post
  replies?: Discussion[];             // Nested replies (only on top-level posts)
}

/** Props accepted by the CourseDiscussion component */
interface CourseDiscussionProps {
  courseId: string;                    // ID of the course whose discussions to show
}

const CourseDiscussion = ({ courseId }: CourseDiscussionProps) => {
  // Auth context — user may be null during session restoration
  const { user } = useAuth();
  // Toast notifications for success/error feedback
  const { toast } = useToast();

  // ─── State ─────────────────────────────────────────────────────────
  const [discussions, setDiscussions] = useState<Discussion[]>([]);   // Top-level discussions with nested replies
  const [newDiscussion, setNewDiscussion] = useState('');              // Content of the new discussion textarea
  const [loading, setLoading] = useState(true);                       // Loading indicator for initial fetch
  const [editingId, setEditingId] = useState<string | null>(null);    // ID of the discussion currently being edited
  const [editContent, setEditContent] = useState('');                  // Content in the edit textarea
  const [replyingTo, setReplyingTo] = useState<string | null>(null);  // ID of the discussion being replied to
  const [replyContent, setReplyContent] = useState('');                // Content in the reply textarea

  // Re-fetch discussions whenever the course or user changes
  useEffect(() => {
    fetchDiscussions();
  }, [courseId, user]);

  /**
   * Fetch all discussions for this course using the secure RPC.
   * 
   * Auth guard: Returns early if user is null to prevent calling the
   * RPC before the session is restored (which would trigger an
   * "Access denied" error from the DB function).
   */
  const fetchDiscussions = async () => {
    // Auth guard — wait for user session before making the RPC call
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      // Call the secure RPC that checks enrollment and returns anonymised data
      const { data: discussionsData, error: discussionsError } = await supabase
        .rpc('get_course_discussions_secure', { course_id_param: courseId });

      // Throw if the RPC returned an error
      if (discussionsError) throw discussionsError;

      // Handle empty discussions gracefully
      if (!discussionsData || discussionsData.length === 0) {
        setDiscussions([]);
        setLoading(false);
        return;
      }

      // ─── Fetch user's vote history ─────────────────────────────────
      let upvotedIds: string[] = [];
      let downvotedIds: string[] = [];
      if (user) {
        // Get all discussion IDs this user has upvoted
        const { data: upvotes } = await supabase
          .from('discussion_upvotes')
          .select('discussion_id')
          .eq('user_id', user.id);

        // Get all discussion IDs this user has downvoted
        // Uses `as any` to bypass TypeScript until types are regenerated
        const { data: downvotes } = await (supabase as any)
          .from('discussion_downvotes')
          .select('discussion_id')
          .eq('user_id', user.id);

        // Map to arrays of IDs for quick lookup
        upvotedIds = upvotes?.map(u => u.discussion_id) || [];
        downvotedIds = downvotes?.map((d: any) => d.discussion_id) || [];
      }

      // ─── Transform secure data into display format ─────────────────
      const discussionsWithProfiles = discussionsData.map((discussion: any) => ({
        ...discussion,
        // Set user_id to current user's ID for own posts, 'anonymous' for others
        user_id: discussion.is_own_post ? user?.id : 'anonymous',
        // Build display name: "You" for own posts, "Student [hash]" for others
        profiles: {
          first_name: discussion.is_own_post ? 'You' : 'Student',
          last_name: discussion.is_own_post ? '' : discussion.anonymous_user_id.replace('user_', '')
        },
        // Attach vote state for highlighting the buttons
        hasUpvoted: upvotedIds.includes(discussion.id),
        hasDownvoted: downvotedIds.includes(discussion.id)
      }));

      // ─── Organise into parent/reply hierarchy ──────────────────────
      // Top-level posts have no parent_id
      const parentDiscussions = discussionsWithProfiles.filter(d => !d.parent_id);
      // Replies have a parent_id pointing to a top-level post
      const replies = discussionsWithProfiles.filter(d => d.parent_id);

      // Attach replies to their parent discussions as a nested array
      const discussionsWithReplies = parentDiscussions.map(parent => ({
        ...parent,
        replies: replies.filter(reply => reply.parent_id === parent.id)
      }));

      // Update state with the organised discussions
      setDiscussions(discussionsWithReplies);
    } catch (error) {
      console.error('Error fetching discussions:', error);
      // Show error toast so the user knows something went wrong
      toast({
        title: "Error",
        description: "Failed to load discussions",
        variant: "destructive"
      });
    } finally {
      // Always clear loading state regardless of success/failure
      setLoading(false);
    }
  };

  /**
   * Submit a new top-level discussion post.
   * Inserts into course_discussions and refreshes the list.
   */
  const submitDiscussion = async () => {
    // Guard: require authenticated user and non-empty content
    if (!user || !newDiscussion.trim()) return;

    try {
      // Insert the new discussion with the current user's ID
      const { error } = await supabase
        .from('course_discussions')
        .insert({
          course_id: courseId,
          user_id: user.id,
          content: newDiscussion.trim()
        });

      if (error) throw error;

      // Clear the input and refresh the discussions list
      setNewDiscussion('');
      await fetchDiscussions();
      
      // Show success notification
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

  /**
   * Submit a reply to an existing discussion.
   * @param parentId - The ID of the discussion being replied to
   */
  const submitReply = async (parentId: string) => {
    // Guard: require authenticated user and non-empty content
    if (!user || !replyContent.trim()) return;

    try {
      // Insert reply with parent_id linking to the original discussion
      const { error } = await supabase
        .from('course_discussions')
        .insert({
          course_id: courseId,
          user_id: user.id,
          content: replyContent.trim(),
          parent_id: parentId
        });

      if (error) throw error;

      // Clear reply state and refresh discussions
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

  /**
   * Update the content of an existing discussion (own posts only).
   * @param discussionId - The ID of the discussion to update
   */
  const updateDiscussion = async (discussionId: string) => {
    // Guard: require authenticated user and non-empty content
    if (!user || !editContent.trim()) return;

    try {
      // Update content — scoped to user's own posts via .eq('user_id', user.id)
      const { error } = await supabase
        .from('course_discussions')
        .update({ content: editContent.trim() })
        .eq('id', discussionId)
        .eq('user_id', user.id); // Ensures only the author can edit

      if (error) throw error;

      // Clear edit state and refresh discussions
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

  /**
   * Toggle the upvote on a discussion.
   * If already upvoted, removes the upvote. Otherwise, adds an upvote
   * and removes any existing downvote (mutual exclusion).
   */
  const toggleUpvote = async (discussionId: string, hasUpvoted: boolean) => {
    if (!user) return;

    try {
      if (hasUpvoted) {
        // ─── Remove existing upvote ──────────────────────────────────
        const { error } = await supabase
          .from('discussion_upvotes')
          .delete()
          .eq('discussion_id', discussionId)
          .eq('user_id', user.id);
        if (error) throw error;

        // Decrement the cached upvote count via RPC
        const { error: updateError } = await supabase.rpc('decrement_upvotes', {
          discussion_id: discussionId
        });
        if (updateError) throw updateError;
      } else {
        // ─── Add upvote (and remove any existing downvote) ───────────
        // Remove downvote if one exists (mutual exclusion)
        await (supabase as any)
          .from('discussion_downvotes')
          .delete()
          .eq('discussion_id', discussionId)
          .eq('user_id', user.id);

        // Insert the upvote record
        const { error } = await supabase
          .from('discussion_upvotes')
          .insert({
            discussion_id: discussionId,
            user_id: user.id
          });
        if (error) throw error;

        // Increment the cached upvote count via RPC
        const { error: updateError } = await supabase.rpc('increment_upvotes', {
          discussion_id: discussionId
        });
        if (updateError) throw updateError;
      }

      // Refresh to show updated vote counts and states
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

  /**
   * Toggle the downvote on a discussion.
   * If already downvoted, removes the downvote. Otherwise, adds a downvote
   * and removes any existing upvote (mutual exclusion).
   */
  const toggleDownvote = async (discussionId: string, hasDownvoted: boolean) => {
    if (!user) return;

    try {
      if (hasDownvoted) {
        // ─── Remove existing downvote ────────────────────────────────
        const { error } = await (supabase as any)
          .from('discussion_downvotes')
          .delete()
          .eq('discussion_id', discussionId)
          .eq('user_id', user.id);
        if (error) throw error;

        // Decrement the cached downvote count via RPC
        const { error: updateError } = await (supabase as any).rpc('decrement_downvotes', {
          discussion_id: discussionId
        });
        if (updateError) throw updateError;
      } else {
        // ─── Add downvote (and remove any existing upvote) ───────────
        // Remove upvote if one exists (mutual exclusion)
        await supabase
          .from('discussion_upvotes')
          .delete()
          .eq('discussion_id', discussionId)
          .eq('user_id', user.id);

        // Insert the downvote record
        const { error } = await (supabase as any)
          .from('discussion_downvotes')
          .insert({
            discussion_id: discussionId,
            user_id: user.id
          });
        if (error) throw error;

        // Increment the cached downvote count via RPC
        const { error: updateError } = await (supabase as any).rpc('increment_downvotes', {
          discussion_id: discussionId
        });
        if (updateError) throw updateError;
      }

      // Refresh to show updated vote counts and states
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

  /** Enter edit mode for a specific discussion */
  const startEdit = (discussion: Discussion) => {
    setEditingId(discussion.id);         // Track which post is being edited
    setEditContent(discussion.content);  // Pre-fill with existing content
  };

  /** Cancel editing and clear edit state */
  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  /** Enter reply mode for a specific discussion */
  const startReply = (discussionId: string) => {
    setReplyingTo(discussionId);  // Track which post is being replied to
    setReplyContent('');          // Start with empty reply
  };

  /** Cancel replying and clear reply state */
  const cancelReply = () => {
    setReplyingTo(null);
    setReplyContent('');
  };

  /**
   * Render a single discussion post (used for both top-level and replies).
   * @param discussion - The discussion data to render
   * @param isReply - Whether this is a nested reply (adds indentation and bg)
   */
  const renderDiscussion = (discussion: Discussion, isReply: boolean = false) => (
    <div key={discussion.id} className={`border rounded-lg p-4 space-y-3 ${isReply ? 'ml-8 bg-gray-50' : ''}`}>
      {/* Post header: avatar, name, date, edit button */}
      <div className="flex items-start gap-3">
        {/* User avatar with initials fallback */}
        <Avatar className="h-8 w-8">
          <AvatarFallback>
            {discussion.profiles?.first_name?.[0] || 'U'}{discussion.profiles?.last_name?.[0] || ''}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          {/* User name and post date */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">
              {discussion.profiles?.first_name || 'Unknown'} {discussion.profiles?.last_name || 'User'}
            </span>
            <span className="text-xs text-gray-500">
              {new Date(discussion.created_at).toLocaleDateString()}
            </span>
            {/* Edit button — only shown for the current user's own posts */}
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
          
          {/* Post content — switches between edit mode and display mode */}
          {editingId === discussion.id ? (
            // ─── Edit mode: textarea with save/cancel buttons ────────
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[80px]"
              />
              <div className="flex gap-2">
                {/* Save button — disabled when content is empty */}
                <Button
                  size="sm"
                  onClick={() => updateDiscussion(discussion.id)}
                  disabled={!editContent.trim()}
                  className="h-8"
                >
                  <Save className="mr-1 h-3 w-3" />
                  Save
                </Button>
                {/* Cancel button — exits edit mode without saving */}
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
            // ─── Display mode: show post content as text ─────────────
            <p className="text-gray-700 text-sm">{discussion.content}</p>
          )}
        </div>
      </div>
      
      {/* Vote buttons and reply button */}
      <div className="flex items-center gap-2">
        {/* Upvote button — highlighted blue when user has upvoted */}
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
        
        {/* Downvote button — highlighted red when user has downvoted */}
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

        {/* Reply button — only shown on top-level posts, not nested replies */}
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

      {/* Reply form — shown inline below the post being replied to */}
      {replyingTo === discussion.id && (
        <div className="ml-8 space-y-2">
          <Textarea
            placeholder="Write your reply..."
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            className="min-h-[80px]"
          />
          <div className="flex gap-2">
            {/* Submit reply button */}
            <Button
              size="sm"
              onClick={() => submitReply(discussion.id)}
              disabled={!replyContent.trim()}
              className="h-8 bg-emerald-600 hover:bg-emerald-700"
            >
              <Send className="mr-1 h-3 w-3" />
              Reply
            </Button>
            {/* Cancel reply button */}
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

      {/* Nested replies — rendered recursively with isReply=true */}
      {discussion.replies && discussion.replies.length > 0 && (
        <div className="space-y-2">
          {discussion.replies.map(reply => renderDiscussion(reply, true))}
        </div>
      )}
    </div>
  );

  // ─── Loading state ─────────────────────────────────────────────────
  if (loading) {
    return <div>Loading discussions...</div>;
  }

  // ─── Main render ───────────────────────────────────────────────────
  return (
    <Card className="bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-blue-600" />
          Course Discussion
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* New discussion form — only shown to authenticated users */}
        {user && (
          <div className="space-y-3">
            <Textarea
              placeholder="Share your thoughts about this course..."
              value={newDiscussion}
              onChange={(e) => setNewDiscussion(e.target.value)}
              className="min-h-[100px]"
            />
            {/* Submit button — disabled when textarea is empty */}
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

        {/* Discussions list — shows empty state or list of posts */}
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

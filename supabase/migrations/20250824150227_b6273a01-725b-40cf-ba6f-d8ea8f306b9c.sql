-- Fix search_path for security definer functions
CREATE OR REPLACE FUNCTION public.vote_forum_post(
  p_post_id UUID,
  p_vote_type TEXT
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_vote TEXT;
  vote_counts JSON;
BEGIN
  -- Check current vote
  SELECT vote_type INTO current_vote 
  FROM public.forum_post_votes 
  WHERE post_id = p_post_id AND user_id = auth.uid();
  
  -- If same vote type, remove vote
  IF current_vote = p_vote_type THEN
    DELETE FROM public.forum_post_votes 
    WHERE post_id = p_post_id AND user_id = auth.uid();
  ELSE
    -- Insert or update vote
    INSERT INTO public.forum_post_votes (post_id, user_id, vote_type)
    VALUES (p_post_id, auth.uid(), p_vote_type)
    ON CONFLICT (post_id, user_id)
    DO UPDATE SET vote_type = p_vote_type, created_at = now();
  END IF;
  
  -- Update post vote counts
  UPDATE public.forum_posts 
  SET 
    upvotes = (
      SELECT COUNT(*) FROM public.forum_post_votes 
      WHERE post_id = p_post_id AND vote_type = 'upvote'
    ),
    downvotes = (
      SELECT COUNT(*) FROM public.forum_post_votes 
      WHERE post_id = p_post_id AND vote_type = 'downvote'
    )
  WHERE id = p_post_id;
  
  -- Return updated counts
  SELECT json_build_object(
    'upvotes', upvotes,
    'downvotes', downvotes
  ) INTO vote_counts
  FROM public.forum_posts 
  WHERE id = p_post_id;
  
  RETURN vote_counts;
END;
$$;

-- Fix search_path for get_user_vote_on_post function
CREATE OR REPLACE FUNCTION public.get_user_vote_on_post(p_post_id UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT vote_type FROM public.forum_post_votes 
  WHERE post_id = p_post_id AND user_id = auth.uid();
$$;
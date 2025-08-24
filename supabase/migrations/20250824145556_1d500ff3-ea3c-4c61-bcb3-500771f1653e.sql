-- Create forum post votes table
CREATE TABLE public.forum_post_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Enable RLS
ALTER TABLE public.forum_post_votes ENABLE ROW LEVEL SECURITY;

-- Create policies for forum post votes
CREATE POLICY "Users can manage their own votes" 
ON public.forum_post_votes 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view votes" 
ON public.forum_post_votes 
FOR SELECT 
USING (true);

-- Create forum post replies table
CREATE TABLE public.forum_post_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.forum_post_replies ENABLE ROW LEVEL SECURITY;

-- Create policies for forum post replies
CREATE POLICY "Anyone can view forum post replies" 
ON public.forum_post_replies 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create replies" 
ON public.forum_post_replies 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their replies" 
ON public.forum_post_replies 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create RPC functions for voting
CREATE OR REPLACE FUNCTION public.vote_forum_post(
  p_post_id UUID,
  p_vote_type TEXT
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Create function to get user's vote on a post
CREATE OR REPLACE FUNCTION public.get_user_vote_on_post(p_post_id UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT vote_type FROM public.forum_post_votes 
  WHERE post_id = p_post_id AND user_id = auth.uid();
$$;

-- Create trigger to update forum_posts updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to forum_post_replies
CREATE TRIGGER update_forum_post_replies_updated_at
  BEFORE UPDATE ON public.forum_post_replies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
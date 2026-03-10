
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import ForumPostCard from "@/components/forum/ForumPostCard";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { ArrowLeft, Plus, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Forum { id: string; title: string; description: string; category: string; created_at: string; created_by: string; is_active: boolean; }
interface ForumPost { id: string; title: string; content: string; upvotes: number; downvotes: number; created_at: string; user_id: string; forum_id: string; author_name?: string; reply_count?: number; }

const ForumDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [forum, setForum] = useState<Forum | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreatePostDialogOpen, setIsCreatePostDialogOpen] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '' });

  useEffect(() => { if (id) { fetchForumData(); fetchForumPosts(); } }, [id]);

  const fetchForumData = async () => {
    try { const { data, error } = await supabase.from('forums').select('*').eq('id', id).eq('is_active', true).maybeSingle(); if (error) { toast({ title: t('common.error'), description: "Failed to load forum details", variant: "destructive" }); return; } if (!data) { toast({ title: t('forum.forumNotFound'), description: t('forum.forumNotFoundDesc'), variant: "destructive" }); navigate('/forum'); return; } setForum(data); } catch (error) { toast({ title: t('common.error'), description: "Failed to load forum details", variant: "destructive" }); }
  };

  const fetchForumPosts = async () => {
    try { setLoading(true); const { data: postsData, error } = await supabase.from('forum_posts').select('*').eq('forum_id', id).order('created_at', { ascending: false }); if (error || !postsData || postsData.length === 0) { setPosts([]); return; }
      const userIds = [...new Set(postsData.map(post => post.user_id))];
      const profilePromises = userIds.map(async (userId) => { const { data, error } = await supabase.rpc('get_anonymized_profile', { profile_id: userId }); if (error) return { id: userId, display_name: 'Anonymous User' }; return { id: userId, display_name: data?.[0]?.display_name || 'Anonymous User' }; });
      const profilesData = await Promise.all(profilePromises);
      const profilesMap = new Map(profilesData.map(profile => [profile.id, profile]));
      setPosts(postsData.map(post => ({ ...post, author_name: profilesMap.get(post.user_id)?.display_name || 'Anonymous', reply_count: 0 })));
    } catch (error) { setPosts([]); } finally { setLoading(false); }
  };

  const handleCreatePost = async () => {
    if (!user || !newPost.title.trim() || !newPost.content.trim()) return;
    try { const { error } = await supabase.from('forum_posts').insert({ title: newPost.title, content: newPost.content, forum_id: id, user_id: user.id }); if (!error) { toast({ title: t('common.success'), description: "Post created successfully!" }); setIsCreatePostDialogOpen(false); setNewPost({ title: '', content: '' }); fetchForumPosts(); } else throw error; } catch (error) { toast({ title: t('common.error'), description: "Failed to create post.", variant: "destructive" }); }
  };

  if (loading && !forum) { return (<div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50"><DashboardHeader title="EdHub - Forum" /><div className="container mx-auto px-4 py-8"><div className="text-center">{t('forum.loadingForums')}</div></div></div>); }
  if (!forum) { return (<div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50"><DashboardHeader title="EdHub - Forum" /><div className="container mx-auto px-4 py-8"><div className="text-center"><h2 className="text-2xl font-bold text-gray-800 mb-4">{t('forum.forumNotFound')}</h2><p className="text-gray-600 mb-4">{t('forum.forumNotFoundDesc')}</p><Button onClick={() => navigate('/forum')}><ArrowLeft className="h-4 w-4 mr-2" />{t('forum.backToForums')}</Button></div></div></div>); }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
      <DashboardHeader title="EdHub - Forum" />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/forum')} className="mb-4"><ArrowLeft className="h-4 w-4 mr-2" />{t('forum.backToForums')}</Button>
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div><h1 className="text-3xl font-bold text-gray-800 mb-2">{forum.title}</h1><p className="text-gray-600 mb-3">{forum.description}</p><Badge variant="outline">{forum.category.charAt(0).toUpperCase() + forum.category.slice(1).replace('-', ' ')}</Badge></div>
              {user && (
                <Dialog open={isCreatePostDialogOpen} onOpenChange={setIsCreatePostDialogOpen}>
                  <DialogTrigger asChild><Button className="flex items-center gap-2"><Plus className="h-4 w-4" />{t('forum.newPost')}</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>{t('forum.createNewPost')}</DialogTitle><DialogDescription>{t('forum.shareThoughts')}</DialogDescription></DialogHeader>
                    <div className="space-y-4"><div><label className="text-sm font-medium">{t('forum.postTitle')}</label><Input value={newPost.title} onChange={(e) => setNewPost({...newPost, title: e.target.value})} placeholder={t('forum.postTitlePlaceholder')} /></div><div><label className="text-sm font-medium">{t('forum.content')}</label><Textarea value={newPost.content} onChange={(e) => setNewPost({...newPost, content: e.target.value})} placeholder={t('forum.contentPlaceholder')} rows={5} /></div></div>
                    <div className="flex justify-end gap-2 mt-6"><Button variant="outline" onClick={() => setIsCreatePostDialogOpen(false)}>{t('common.cancel')}</Button><Button onClick={handleCreatePost}>{t('forum.createPost')}</Button></div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>
        <div className="mb-4"><h2 className="text-xl font-semibold text-gray-800 mb-4">{t('forum.posts')}</h2></div>
        {loading ? (<div className="text-center py-8">{t('forum.loadingPosts')}</div>
        ) : posts.length > 0 ? (<div className="space-y-4">{posts.map((post) => (<ForumPostCard key={post.id} post={post} onClick={() => navigate(`/forum/${id}/post/${post.id}`)} />))}</div>
        ) : (<Card className="text-center py-12 bg-white/80 backdrop-blur-sm"><CardContent><MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" /><h3 className="text-lg font-semibold text-gray-600 mb-2">{t('forum.noPostsYet')}</h3><p className="text-gray-500 mb-4">{t('forum.beFirstPost')}</p>{user && (<Button onClick={() => setIsCreatePostDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />{t('forum.createFirstPost')}</Button>)}</CardContent></Card>)}
      </div>
    </div>
  );
};

export default ForumDetailPage;


import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Trophy, Plus, Star, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface Achievement {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  points: number | null;
  category: string | null;
  created_at: string;
}

const AchievementManagement = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    icon: 'trophy',
    points: 10,
    category: 'milestone'
  });

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      setAchievements(data || []);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAchievement = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Error', description: 'Achievement name is required.', variant: 'destructive' });
      return;
    }

    try {
      const { error } = await supabase
        .from('achievements')
        .insert({
          name: form.name.trim(),
          description: form.description.trim() || null,
          icon: form.icon,
          points: form.points,
          category: form.category
        });

      if (error) throw error;

      toast({ title: 'Achievement created', description: `"${form.name}" has been added.` });
      setForm({ name: '', description: '', icon: 'trophy', points: 10, category: 'milestone' });
      setIsDialogOpen(false);
      fetchAchievements();
    } catch (error) {
      console.error('Error creating achievement:', error);
      toast({ title: 'Error', description: 'Failed to create achievement.', variant: 'destructive' });
    }
  };

  const deleteAchievement = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const { error } = await supabase
        .from('achievements')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({ title: 'Achievement deleted', description: `"${name}" has been removed.` });
      fetchAchievements();
    } catch (error) {
      console.error('Error deleting achievement:', error);
      toast({ title: 'Error', description: 'Failed to delete achievement.', variant: 'destructive' });
    }
  };

  const getCategoryColor = (category: string | null) => {
    switch (category) {
      case 'milestone': return 'bg-blue-100 text-blue-800';
      case 'learning': return 'bg-green-100 text-green-800';
      case 'consistency': return 'bg-purple-100 text-purple-800';
      case 'community': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="text-center py-8">{t('common.loading')}...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-600" />
                Achievement Management
              </CardTitle>
              <CardDescription>Create and manage platform achievements ({achievements.length} total)</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Achievement
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Achievement</DialogTitle>
                  <DialogDescription>Define a new achievement that students can earn.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Name</Label>
                    <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g., First Login" />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What the student needs to do..." />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Category</Label>
                      <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="milestone">Milestone</SelectItem>
                          <SelectItem value="learning">Learning</SelectItem>
                          <SelectItem value="consistency">Consistency</SelectItem>
                          <SelectItem value="community">Community</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Points</Label>
                      <Input type="number" min={1} max={1000} value={form.points} onChange={e => setForm(f => ({ ...f, points: parseInt(e.target.value) || 1 }))} />
                    </div>
                  </div>
                  <div>
                    <Label>Icon</Label>
                    <Select value={form.icon} onValueChange={v => setForm(f => ({ ...f, icon: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="trophy">🏆 Trophy</SelectItem>
                        <SelectItem value="star">⭐ Star</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={createAchievement} className="w-full bg-emerald-600 hover:bg-emerald-700">
                    Create Achievement
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {achievements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No achievements created yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.map(achievement => (
                <div key={achievement.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {achievement.icon === 'star' ? <Star className="h-5 w-5 text-yellow-500" /> : <Trophy className="h-5 w-5 text-yellow-600" />}
                      <h3 className="font-semibold text-sm">{achievement.name}</h3>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700" onClick={() => deleteAchievement(achievement.id, achievement.name)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{achievement.description}</p>
                  <div className="flex items-center gap-2">
                    <Badge className={getCategoryColor(achievement.category)} variant="secondary">
                      {achievement.category}
                    </Badge>
                    <Badge variant="outline">{achievement.points} pts</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AchievementManagement;

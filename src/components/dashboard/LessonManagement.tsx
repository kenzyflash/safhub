
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Video, ArrowUp, ArrowDown, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import VideoUploader from '@/components/enhanced/VideoUploader';
import LessonMaterialUploader from '@/components/dashboard/LessonMaterialUploader';

interface Lesson {
  id: string;
  title: string;
  description: string;
  video_url: string;
  duration_minutes: number;
  order_index: number;
}

interface LessonManagementProps {
  courseId: string;
  courseName: string;
}

const LessonManagement = ({ courseId, courseName }: LessonManagementProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [newLesson, setNewLesson] = useState({
    title: '',
    description: '',
    video_url: '',
    duration_minutes: 0
  });

  useEffect(() => {
    fetchLessons();
  }, [courseId]);

  const fetchLessons = async () => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setLessons(data || []);
    } catch (error) {
      console.error('Error fetching lessons:', error);
      toast({
        title: "Error",
        description: "Failed to fetch lessons",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLesson = async () => {
    if (!newLesson.title || !user) {
      toast({
        title: "Error",
        description: "Please fill in the lesson title.",
        variant: "destructive"
      });
      return;
    }

    try {
      const maxOrderIndex = lessons.length > 0 ? Math.max(...lessons.map(l => l.order_index)) : 0;
      
      const { error } = await supabase
        .from('lessons')
        .insert({
          course_id: courseId,
          title: newLesson.title,
          description: newLesson.description || '',
          video_url: newLesson.video_url || '',
          duration_minutes: newLesson.duration_minutes || 0,
          order_index: maxOrderIndex + 1
        });

      if (error) throw error;

      await fetchLessons();
      setNewLesson({ title: '', description: '', video_url: '', duration_minutes: 0 });
      setIsCreateDialogOpen(false);
      
      toast({
        title: "Lesson created",
        description: "Your new lesson has been added successfully.",
      });
    } catch (error: any) {
      console.error('Error creating lesson:', error);
      toast({
        title: "Error",
        description: `Failed to create lesson: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const handleUpdateLesson = async () => {
    if (!editingLesson || !user) return;

    try {
      const { error } = await supabase
        .from('lessons')
        .update({
          title: editingLesson.title,
          description: editingLesson.description,
          video_url: editingLesson.video_url,
          duration_minutes: editingLesson.duration_minutes
        })
        .eq('id', editingLesson.id);

      if (error) throw error;

      await fetchLessons();
      setEditingLesson(null);
      setIsEditDialogOpen(false);
      
      toast({
        title: "Lesson updated",
        description: "Lesson details have been updated successfully.",
      });
    } catch (error: any) {
      console.error('Error updating lesson:', error);
      toast({
        title: "Error",
        description: `Failed to update lesson: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    try {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId);

      if (error) throw error;

      await fetchLessons();
      toast({
        title: "Lesson deleted",
        description: "The lesson has been removed.",
      });
    } catch (error: any) {
      console.error('Error deleting lesson:', error);
      toast({
        title: "Error",
        description: `Failed to delete lesson: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const handleReorderLesson = async (lessonId: string, direction: 'up' | 'down') => {
    const currentLesson = lessons.find(l => l.id === lessonId);
    if (!currentLesson) return;

    const newOrderIndex = direction === 'up' 
      ? currentLesson.order_index - 1 
      : currentLesson.order_index + 1;

    const swapLesson = lessons.find(l => l.order_index === newOrderIndex);
    if (!swapLesson) return;

    try {
      // Update both lessons in a transaction-like manner
      const { error: error1 } = await supabase
        .from('lessons')
        .update({ order_index: newOrderIndex })
        .eq('id', currentLesson.id);

      const { error: error2 } = await supabase
        .from('lessons')
        .update({ order_index: currentLesson.order_index })
        .eq('id', swapLesson.id);

      if (error1 || error2) throw error1 || error2;

      await fetchLessons();
      
      toast({
        title: "Lesson reordered",
        description: "Lesson order has been updated.",
      });
    } catch (error) {
      console.error('Error reordering lessons:', error);
      toast({
        title: "Error",
        description: "Failed to reorder lesson",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="text-center">Loading lessons...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              Lessons - {courseName}
            </CardTitle>
            <CardDescription>Manage course lessons and videos</CardDescription>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                Add Lesson
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Lesson</DialogTitle>
                <DialogDescription>
                  Add a new lesson to your course.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Lesson Title *</label>
                  <Input
                    value={newLesson.title}
                    onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                    placeholder="Enter lesson title"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={newLesson.description}
                    onChange={(e) => setNewLesson({ ...newLesson, description: e.target.value })}
                    placeholder="Enter lesson description"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Duration (minutes)</label>
                  <Input
                    type="number"
                    value={newLesson.duration_minutes}
                    onChange={(e) => setNewLesson({ ...newLesson, duration_minutes: parseInt(e.target.value) || 0 })}
                    placeholder="Duration in minutes"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Video Upload</label>
                  <VideoUploader
                    onUploadComplete={(url) => setNewLesson({ ...newLesson, video_url: url })}
                  />
                  {newLesson.video_url && (
                    <p className="text-sm text-green-600 mt-1">Video uploaded successfully</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCreateLesson} className="bg-blue-600 hover:bg-blue-700">
                    Create Lesson
                  </Button>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {lessons.map((lesson, index) => (
          <div key={lesson.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline">Lesson {lesson.order_index}</Badge>
                  <h3 className="font-semibold text-gray-800">{lesson.title}</h3>
                </div>
                <p className="text-sm text-gray-600 mb-2">{lesson.description}</p>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Video className="h-4 w-4" />
                    {lesson.duration_minutes} minutes
                  </span>
                  {lesson.video_url && (
                    <span className="text-green-600">Video uploaded</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReorderLesson(lesson.id, 'up')}
                  disabled={index === 0}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReorderLesson(lesson.id, 'down')}
                  disabled={index === lessons.length - 1}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-2">
                <Dialog open={isEditDialogOpen && editingLesson?.id === lesson.id} onOpenChange={setIsEditDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setEditingLesson(lesson)}
                    >
                      <Edit className="mr-1 h-4 w-4" />
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Edit Lesson</DialogTitle>
                      <DialogDescription>
                        Update lesson information.
                      </DialogDescription>
                    </DialogHeader>
                    {editingLesson && (
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Lesson Title</label>
                          <Input
                            value={editingLesson.title}
                            onChange={(e) => setEditingLesson({ ...editingLesson, title: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Description</label>
                          <Textarea
                            value={editingLesson.description}
                            onChange={(e) => setEditingLesson({ ...editingLesson, description: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Duration (minutes)</label>
                          <Input
                            type="number"
                            value={editingLesson.duration_minutes}
                            onChange={(e) => setEditingLesson({ ...editingLesson, duration_minutes: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Video Upload</label>
                          <VideoUploader
                            onUploadComplete={(url) => setEditingLesson({ ...editingLesson, video_url: url })}
                          />
                          {editingLesson.video_url && (
                            <p className="text-sm text-green-600 mt-1">Current video: {editingLesson.video_url}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={handleUpdateLesson} className="bg-blue-600 hover:bg-blue-700">
                            Update Lesson
                          </Button>
                          <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleDeleteLesson(lesson.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ))}

        {lessons.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">No lessons yet</h3>
            <p>Add your first lesson to get started!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LessonManagement;

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Upload, Trash2, Download, File } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface LessonMaterial {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size_bytes: number | null;
  created_at: string;
}

interface LessonMaterialUploaderProps {
  lessonId: string;
  courseId: string;
  readOnly?: boolean;
}

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/jpeg',
  'image/png',
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const getFileIcon = (type: string) => {
  if (type.includes('pdf')) return '📄';
  if (type.includes('powerpoint') || type.includes('presentation')) return '📊';
  if (type.includes('word') || type.includes('document')) return '📝';
  if (type.includes('image')) return '🖼️';
  return '📎';
};

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return 'Unknown size';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const LessonMaterialUploader = ({ lessonId, courseId, readOnly = false }: LessonMaterialUploaderProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [materials, setMaterials] = useState<LessonMaterial[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMaterials();
  }, [lessonId]);

  const fetchMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from('lesson_materials')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMaterials(data || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({ title: 'Invalid file type', description: 'Please upload PDF, PowerPoint, Word, or image files.', variant: 'destructive' });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({ title: 'File too large', description: 'Maximum file size is 50MB.', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${courseId}/${lessonId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('lesson-materials')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('lesson-materials')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from('lesson_materials')
        .insert({
          lesson_id: lessonId,
          course_id: courseId,
          uploaded_by: user.id,
          file_name: file.name,
          file_url: urlData.publicUrl,
          file_type: file.type,
          file_size_bytes: file.size,
        });

      if (dbError) throw dbError;

      toast({ title: 'Material uploaded', description: `"${file.name}" has been uploaded.` });
      fetchMaterials();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({ title: 'Upload failed', description: error.message || 'Failed to upload file.', variant: 'destructive' });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (material: LessonMaterial) => {
    if (!confirm(`Delete "${material.file_name}"?`)) return;

    try {
      const { error } = await supabase
        .from('lesson_materials')
        .delete()
        .eq('id', material.id);

      if (error) throw error;

      toast({ title: 'Material deleted', description: `"${material.file_name}" has been removed.` });
      fetchMaterials();
    } catch (error) {
      console.error('Delete error:', error);
      toast({ title: 'Delete failed', description: 'Failed to delete material.', variant: 'destructive' });
    }
  };

  if (loading) return <div className="text-sm text-muted-foreground">Loading materials...</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-1">
          <FileText className="h-4 w-4" />
          Lesson Materials ({materials.length})
        </h4>
        {!readOnly && (
          <label className="cursor-pointer">
            <input
              type="file"
              className="hidden"
              accept=".pdf,.ppt,.pptx,.doc,.docx,.txt,.jpg,.jpeg,.png"
              onChange={handleUpload}
              disabled={uploading}
            />
            <Button size="sm" variant="outline" disabled={uploading} asChild>
              <span>
                <Upload className="h-3 w-3 mr-1" />
                {uploading ? 'Uploading...' : 'Upload'}
              </span>
            </Button>
          </label>
        )}
      </div>

      {materials.length === 0 ? (
        <p className="text-xs text-muted-foreground">No materials uploaded yet.</p>
      ) : (
        <div className="space-y-2">
          {materials.map(material => (
            <div key={material.id} className="flex items-center justify-between p-2 border rounded-md text-sm">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span>{getFileIcon(material.file_type)}</span>
                <div className="min-w-0">
                  <p className="truncate font-medium text-xs">{material.file_name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(material.file_size_bytes)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" asChild>
                  <a href={material.file_url} target="_blank" rel="noopener noreferrer">
                    <Download className="h-3 w-3" />
                  </a>
                </Button>
                {!readOnly && (
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDelete(material)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LessonMaterialUploader;

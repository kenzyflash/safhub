
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, File } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface LessonMaterial {
  id: string;
  file_name: string;
  file_type: string;
  file_url: string;
  file_size_bytes: number | null;
}

interface LessonMaterialsProps {
  lessonId: string;
  courseId: string;
}

const fileTypeIcon = (type: string) => {
  if (type.includes('pdf')) return '📄';
  if (type.includes('presentation') || type.includes('ppt')) return '📊';
  if (type.includes('word') || type.includes('doc')) return '📝';
  return '📎';
};

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const LessonMaterials = ({ lessonId, courseId }: LessonMaterialsProps) => {
  const [materials, setMaterials] = useState<LessonMaterial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMaterials();
  }, [lessonId]);

  const fetchMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from('lesson_materials')
        .select('id, file_name, file_type, file_url, file_size_bytes')
        .eq('lesson_id', lessonId)
        .eq('course_id', courseId);

      if (error) throw error;
      setMaterials(data || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (material: LessonMaterial) => {
    window.open(material.file_url, '_blank', 'noopener,noreferrer');
  };

  if (loading || materials.length === 0) return null;

  return (
    <Card className="bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          Lesson Materials
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {materials.map((material) => (
          <div
            key={material.id}
            className="flex items-center justify-between p-2 rounded-md border hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="text-lg">{fileTypeIcon(material.file_type)}</span>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{material.file_name}</p>
                {material.file_size_bytes && (
                  <p className="text-xs text-muted-foreground">{formatFileSize(material.file_size_bytes)}</p>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDownload(material)}
              className="shrink-0"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default LessonMaterials;

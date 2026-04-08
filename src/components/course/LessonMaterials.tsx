/**
 * LessonMaterials.tsx
 * --------------------
 * Displays downloadable files (PDFs, presentations, docs) attached to
 * a specific lesson. Only shown to enrolled students on the Course Page
 * under the "Materials" tab.
 *
 * Security:
 *  - Downloads use short-lived signed URLs (5 min) generated server-side.
 *  - Files open in a new tab with noopener,noreferrer for safety.
 *
 * See docs/FEATURES-DISCUSSED.md #3 for feature context.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

/** Shape of a single lesson material record from the database */
interface LessonMaterial {
  id: string;                      // Unique material ID
  file_name: string;               // Original filename for display
  file_type: string;               // MIME type (e.g. "application/pdf")
  file_url: string;                // Storage path or legacy full URL
  file_size_bytes: number | null;  // File size for display (may be null for older records)
}

/** Props accepted by the LessonMaterials component */
interface LessonMaterialsProps {
  lessonId: string;  // ID of the currently selected lesson
  courseId: string;   // ID of the course (used to scope the query)
}

/**
 * Return an emoji icon based on the file's MIME type.
 * Helps users quickly identify file types in the list.
 */
const fileTypeIcon = (type: string) => {
  if (type.includes('pdf')) return '📄';                                    // PDF documents
  if (type.includes('presentation') || type.includes('ppt')) return '📊';  // PowerPoint/presentations
  if (type.includes('word') || type.includes('doc')) return '📝';          // Word documents
  return '📎';                                                              // Generic file
};

/**
 * Format a byte count into a human-readable string (B, KB, or MB).
 * Returns empty string if bytes is null (for records without size data).
 */
const formatFileSize = (bytes: number | null) => {
  if (!bytes) return '';                                       // No size info available
  if (bytes < 1024) return `${bytes} B`;                       // Less than 1 KB
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`; // Less than 1 MB
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;           // 1 MB and above
};

/**
 * Extract the storage path from a file_url value.
 * 
 * Handles two formats:
 *  1. Legacy full URLs: https://...supabase.co/storage/v1/object/public/lesson-materials/courseId/lessonId/file.ext
 *  2. New storage paths: courseId/lessonId/file.ext
 *
 * The storage path is needed by the Supabase storage SDK to generate signed URLs.
 */
const getStoragePath = (fileUrl: string): string => {
  // Look for the bucket name marker in legacy URLs
  const marker = '/lesson-materials/';
  const idx = fileUrl.indexOf(marker);
  if (idx !== -1) {
    // Return everything after the bucket name
    return fileUrl.substring(idx + marker.length);
  }
  // Already a plain storage path — return as-is
  return fileUrl;
};

const LessonMaterials = ({ lessonId, courseId }: LessonMaterialsProps) => {
  // State for the list of materials and loading indicator
  const [materials, setMaterials] = useState<LessonMaterial[]>([]);
  const [loading, setLoading] = useState(true);

  // Re-fetch materials whenever the selected lesson changes
  useEffect(() => {
    fetchMaterials();
  }, [lessonId]);

  /**
   * Fetch all materials for the current lesson and course from Supabase.
   * Only selects the columns needed for display and download.
   */
  const fetchMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from('lesson_materials')
        .select('id, file_name, file_type, file_url, file_size_bytes') // Select only needed columns
        .eq('lesson_id', lessonId)   // Filter by current lesson
        .eq('course_id', courseId);   // Scope to current course

      if (error) throw error;
      setMaterials(data || []);      // Store materials (empty array if none)
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoading(false);             // Always clear loading state
    }
  };

  /**
   * Handle file download by generating a short-lived signed URL.
   * The signed URL expires after 300 seconds (5 minutes) for security.
   * Opens the file in a new tab with noopener,noreferrer.
   */
  const handleDownload = async (material: LessonMaterial) => {
    try {
      // Convert file_url to a storage-relative path
      const storagePath = getStoragePath(material.file_url);

      // Generate a 5-minute signed URL via Supabase storage SDK
      const { data, error } = await supabase.storage
        .from('lesson-materials')
        .createSignedUrl(storagePath, 300); // 300 seconds = 5 minutes

      // Bail out if signed URL generation failed
      if (error || !data?.signedUrl) {
        console.error('Signed URL error:', error);
        return;
      }

      // Open the signed URL in a new tab (noopener,noreferrer for security)
      window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  // Don't render anything while loading or if there are no materials
  if (loading || materials.length === 0) return null;

  return (
    <Card className="bg-white/80 backdrop-blur-sm">
      {/* Card header with icon and title */}
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          Lesson Materials
        </CardTitle>
      </CardHeader>

      {/* List of downloadable materials */}
      <CardContent className="space-y-2">
        {materials.map((material) => (
          <div
            key={material.id}
            className="flex items-center justify-between p-2 rounded-md border hover:bg-muted/50 transition-colors"
          >
            {/* File info: icon, name, and size */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="text-lg">{fileTypeIcon(material.file_type)}</span>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{material.file_name}</p>
                {/* Show file size if available */}
                {material.file_size_bytes && (
                  <p className="text-xs text-muted-foreground">{formatFileSize(material.file_size_bytes)}</p>
                )}
              </div>
            </div>

            {/* Download button — triggers signed URL generation */}
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

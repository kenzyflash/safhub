
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link, CheckCircle, XCircle } from 'lucide-react';

interface VideoUrlInputProps {
  value: string;
  onChange: (url: string) => void;
}

const SUPPORTED_PATTERNS = [
  { label: 'YouTube', regex: /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)[\w-]{11}/ },
  { label: 'Vimeo', regex: /vimeo\.com\/\d+/ },
  { label: 'Direct URL', regex: /^https?:\/\/.+\.(mp4|webm|ogg)/ },
];

function detectPlatform(url: string): string | null {
  for (const p of SUPPORTED_PATTERNS) {
    if (p.regex.test(url)) return p.label;
  }
  if (/^https?:\/\/.+/i.test(url)) return 'Video URL';
  return null;
}

const VideoUrlInput = ({ value, onChange }: VideoUrlInputProps) => {
  const [inputValue, setInputValue] = useState(value || '');
  const platform = inputValue.trim() ? detectPlatform(inputValue.trim()) : null;

  const handleChange = (val: string) => {
    setInputValue(val);
    onChange(val.trim());
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Link className="h-4 w-4 text-muted-foreground" />
        <Input
          value={inputValue}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Paste YouTube, Vimeo, or video URL..."
          className="flex-1"
        />
      </div>
      {inputValue.trim() && (
        <div className="flex items-center gap-2">
          {platform ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-500" />
              <Badge variant="secondary" className="text-xs">{platform}</Badge>
              <span className="text-xs text-green-600">Valid video URL</span>
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-xs text-red-600">Unrecognized URL format</span>
            </>
          )}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Supports YouTube, Vimeo, and direct video links (.mp4, .webm)
      </p>
    </div>
  );
};

export default VideoUrlInput;

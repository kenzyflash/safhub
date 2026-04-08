/**
 * VideoUrlInput.tsx
 * -----------------
 * A controlled input component for teachers to paste a video URL when
 * creating or editing a lesson.
 *
 * Features (see docs/FEATURES-DISCUSSED.md #4):
 *  - Real-time platform detection (YouTube, Vimeo, direct .mp4/.webm/.ogg)
 *  - Visual feedback: green check + platform badge for valid URLs,
 *    red X for unrecognised formats
 *  - Trims whitespace before passing value up to the parent
 */

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Link, CheckCircle, XCircle } from 'lucide-react';

/** Props for the VideoUrlInput component */
interface VideoUrlInputProps {
  value: string;                   // Current URL value (controlled)
  onChange: (url: string) => void; // Callback when URL changes
}

/**
 * Regex patterns for each supported video platform.
 * Each entry has a human-readable label and a regex that matches
 * the platform's URL format.
 */
const SUPPORTED_PATTERNS = [
  { label: 'YouTube', regex: /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)[\w-]{11}/ },
  { label: 'Vimeo', regex: /vimeo\.com\/\d+/ },
  { label: 'Direct URL', regex: /^https?:\/\/.+\.(mp4|webm|ogg)/ },
];

/**
 * Detect which platform a URL belongs to.
 * Returns the platform label (e.g. "YouTube") or null if unrecognised.
 */
function detectPlatform(url: string): string | null {
  // Test against each known platform pattern
  for (const p of SUPPORTED_PATTERNS) {
    if (p.regex.test(url)) return p.label;
  }
  // If it's at least a valid http(s) URL, label it generically
  if (/^https?:\/\/.+/i.test(url)) return 'Video URL';
  // No match — return null to show error state
  return null;
}

const VideoUrlInput = ({ value, onChange }: VideoUrlInputProps) => {
  // Local input state — allows controlled typing before trimming on change
  const [inputValue, setInputValue] = useState(value || '');

  // Detect platform only when there's non-empty input
  const platform = inputValue.trim() ? detectPlatform(inputValue.trim()) : null;

  /** Update local state and notify parent with trimmed value */
  const handleChange = (val: string) => {
    setInputValue(val);       // Keep raw value for display (preserves cursor position)
    onChange(val.trim());      // Pass trimmed value to parent for storage
  };

  return (
    <div className="space-y-2">
      {/* URL input field with link icon */}
      <div className="flex items-center gap-2">
        <Link className="h-4 w-4 text-muted-foreground" />
        <Input
          value={inputValue}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Paste YouTube, Vimeo, or video URL..."
          className="flex-1"
        />
      </div>

      {/* Validation feedback — only shown when input is non-empty */}
      {inputValue.trim() && (
        <div className="flex items-center gap-2">
          {platform ? (
            <>
              {/* Valid URL — show green check, platform badge, and confirmation text */}
              <CheckCircle className="h-4 w-4 text-green-500" />
              <Badge variant="secondary" className="text-xs">{platform}</Badge>
              <span className="text-xs text-green-600">Valid video URL</span>
            </>
          ) : (
            <>
              {/* Invalid/unrecognised URL — show red X and error text */}
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-xs text-red-600">Unrecognized URL format</span>
            </>
          )}
        </div>
      )}

      {/* Help text listing supported platforms */}
      <p className="text-xs text-muted-foreground">
        Supports YouTube, Vimeo, and direct video links (.mp4, .webm)
      </p>
    </div>
  );
};

export default VideoUrlInput;

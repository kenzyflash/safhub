/**
 * VideoPlayer.tsx
 * ---------------
 * Renders a video lesson using either an embedded iframe (YouTube / Vimeo)
 * or a native HTML5 <video> element for direct URLs (.mp4, .webm, .ogg).
 *
 * Security:
 *  - YouTube embeds use youtube-nocookie.com (privacy-enhanced mode).
 *  - Iframes are sandboxed to limit capabilities.
 *  - referrerPolicy="no-referrer" prevents leaking page URL.
 *
 * Features implemented (see docs/FEATURES-DISCUSSED.md #4):
 *  - URL sanitisation via parseVideoUrl()
 *  - Watch-time tracking with auto-completion at 80% threshold
 *  - Native player controls (play/pause, seek, volume, mute)
 */

import { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

/** Props accepted by the VideoPlayer component */
interface VideoPlayerProps {
  videoUrl?: string;          // URL of the video (YouTube, Vimeo, or direct link)
  title: string;              // Lesson title shown as iframe accessible name
  duration: number;           // Expected lesson duration in minutes (used for completion calc)
  onWatchTimeUpdate: (minutes: number) => void; // Called every second with cumulative watch minutes
  onComplete: () => void;     // Called once when 80% of expected duration is watched
}

/**
 * Sanitize and parse a video URL into an embeddable format.
 *
 * Supports:
 *  - YouTube watch, embed, short, and shorts URLs
 *  - Vimeo URLs
 *  - Direct http(s) video files
 *
 * Returns null if the URL is empty or unrecognised.
 */
function parseVideoUrl(url?: string): { type: 'embed' | 'native'; src: string } | null {
  // Return null for empty or whitespace-only URLs
  if (!url || !url.trim()) return null;

  // Trim whitespace from both ends of the URL
  const trimmed = url.trim();

  // Array of regex patterns that match various YouTube URL formats
  // Each captures the 11-character video ID in group 1
  const ytPatterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([\w-]{11})/,   // Standard watch URL
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([\w-]{11})/,     // Embed URL
    /(?:https?:\/\/)?youtu\.be\/([\w-]{11})/,                         // Short URL
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([\w-]{11})/,    // Shorts URL
  ];

  // Test each YouTube pattern and return privacy-enhanced embed URL if matched
  for (const pattern of ytPatterns) {
    const match = trimmed.match(pattern);
    if (match?.[1]) {
      // Use youtube-nocookie.com for privacy (no tracking cookies)
      return { type: 'embed', src: `https://www.youtube-nocookie.com/embed/${match[1]}` };
    }
  }

  // Test for Vimeo URLs — captures the numeric video ID
  const vimeoMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/);
  if (vimeoMatch?.[1]) {
    return { type: 'embed', src: `https://player.vimeo.com/video/${vimeoMatch[1]}` };
  }

  // If it's a valid http(s) URL but not YouTube/Vimeo, treat as a native video source
  if (/^https?:\/\/.+/i.test(trimmed)) {
    return { type: 'native', src: trimmed };
  }

  // URL format not recognised — return null so the component shows "No video" fallback
  return null;
}

const VideoPlayer = ({ videoUrl, title, duration, onWatchTimeUpdate, onComplete }: VideoPlayerProps) => {
  // Playback state for native video player
  const [isPlaying, setIsPlaying] = useState(false);       // Whether the native video is currently playing
  const [isMuted, setIsMuted] = useState(false);            // Whether audio is muted
  const [currentTime, setCurrentTime] = useState(0);        // Current playback position in seconds
  const [videoDuration, setVideoDuration] = useState(0);    // Total duration of the native video in seconds
  const [volume, setVolume] = useState(1);                  // Volume level 0-1
  const [watchedTime, setWatchedTime] = useState(0);        // Cumulative seconds the user has watched
  const [hasCompletedOnce, setHasCompletedOnce] = useState(false); // Prevents firing onComplete multiple times
  const videoRef = useRef<HTMLVideoElement>(null);           // Ref to the native <video> element

  // Memoize the parsed URL so we only re-parse when videoUrl changes
  const parsed = useMemo(() => parseVideoUrl(videoUrl), [videoUrl]);

  /**
   * Watch-time tracker for EMBEDDED videos (YouTube / Vimeo).
   * Since we can't read the iframe's playback position, we simply
   * increment a counter every second as a rough estimate.
   * Fires onComplete when 80% of the expected duration is reached.
   */
  useEffect(() => {
    // Only run this tracker for embedded video types
    if (parsed?.type !== 'embed') return;

    const interval = setInterval(() => {
      // Increment watched time by 1 second
      const newWatchedTime = watchedTime + 1;
      setWatchedTime(newWatchedTime);
      // Report cumulative minutes to parent
      onWatchTimeUpdate(Math.floor(newWatchedTime / 60));

      // Calculate 80% completion threshold in seconds
      const completionThreshold = (duration * 60) * 0.8;
      // Auto-complete if threshold reached and not already completed
      if (newWatchedTime >= completionThreshold && !hasCompletedOnce) {
        setHasCompletedOnce(true);
        onComplete();
      }
    }, 1000);

    // Clean up interval on unmount or dependency change
    return () => clearInterval(interval);
  }, [parsed?.type, watchedTime, duration, onWatchTimeUpdate, onComplete, hasCompletedOnce]);

  /**
   * Watch-time tracker for NATIVE videos.
   * Only increments when the video is actually playing.
   */
  useEffect(() => {
    // Skip if this is an embedded video (handled above)
    if (parsed?.type === 'embed') return;

    const interval = setInterval(() => {
      // Only count time when the video is actively playing
      if (isPlaying && videoRef.current) {
        const newWatchedTime = watchedTime + 1;
        setWatchedTime(newWatchedTime);
        onWatchTimeUpdate(Math.floor(newWatchedTime / 60));

        // 80% completion threshold check
        const completionThreshold = (duration * 60) * 0.8;
        if (newWatchedTime >= completionThreshold && !hasCompletedOnce) {
          setHasCompletedOnce(true);
          onComplete();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [parsed?.type, isPlaying, watchedTime, duration, onWatchTimeUpdate, onComplete, hasCompletedOnce]);

  /** Toggle play/pause on the native video element */
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  /** Toggle mute on the native video element */
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  /** Sync React state with the video element's current time */
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  /** Store the video's total duration once metadata is loaded */
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
    }
  };

  /** Handle user seeking via the progress slider */
  const handleSeek = (value: number[]) => {
    if (videoRef.current && videoDuration > 0) {
      // Convert percentage (0-100) to seconds
      const newTime = (value[0] / 100) * videoDuration;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  /** Handle volume slider changes */
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0] / 100; // Convert 0-100 to 0-1
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      // Auto-mute when volume is zero, auto-unmute otherwise
      if (newVolume === 0) {
        setIsMuted(true);
        videoRef.current.muted = true;
      } else if (isMuted) {
        setIsMuted(false);
        videoRef.current.muted = false;
      }
    }
  };

  /** Format seconds into "M:SS" display string */
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // ─── Render: Embedded player (YouTube / Vimeo) ─────────────────────
  if (parsed?.type === 'embed') {
    return (
      <div className="relative bg-gray-900 rounded-lg overflow-hidden">
        {/* Sandboxed iframe for security — only allows scripts, same-origin, popups */}
        <iframe
          src={parsed.src}
          className="w-full aspect-video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={title}
          referrerPolicy="no-referrer"                          // Don't leak referrer to video host
          sandbox="allow-scripts allow-same-origin allow-presentation allow-popups" // Restrict iframe capabilities
        />
        {/* Watch-time overlay at bottom of iframe */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2">
          <div className="text-white text-sm text-right">
            Watch time: {Math.floor(watchedTime / 60)} min
          </div>
        </div>
      </div>
    );
  }

  // ─── Render: No video provided ─────────────────────────────────────
  if (!parsed) {
    return (
      <div className="relative bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center aspect-video">
        <div className="text-center text-gray-400">
          <Play className="h-16 w-16 mx-auto mb-2 opacity-30" />
          <p>No video available for this lesson</p>
        </div>
      </div>
    );
  }

  // ─── Render: Native HTML5 video player ─────────────────────────────
  // Calculate progress bar percentage for the seek slider
  const progressPercentage = videoDuration > 0 ? (currentTime / videoDuration) * 100 : 0;

  return (
    <div className="relative bg-gray-900 rounded-lg overflow-hidden">
      {/* Native video element */}
      <video
        ref={videoRef}
        src={parsed.src}
        className="w-full aspect-video"
        onTimeUpdate={handleTimeUpdate}        // Fires as playback progresses
        onLoadedMetadata={handleLoadedMetadata} // Fires when video metadata is available
        onEnded={() => setIsPlaying(false)}     // Reset play state when video ends
        onPlay={() => setIsPlaying(true)}       // Sync state if play triggered externally
        onPause={() => setIsPlaying(false)}     // Sync state if pause triggered externally
      />
      
      {/* Video Controls Overlay — appears at bottom */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
        {/* Seek bar (progress slider) */}
        <div className="mb-4">
          <Slider
            value={[progressPercentage]}
            onValueChange={handleSeek}
            max={100}
            step={0.1}
            className="w-full"
          />
        </div>
        
        {/* Control buttons row */}
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-4">
            {/* Play/Pause button */}
            <Button variant="ghost" size="sm" onClick={togglePlay} className="text-white hover:bg-white/20">
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
            
            {/* Volume controls */}
            <div className="flex items-center gap-2">
              {/* Mute/Unmute button */}
              <Button variant="ghost" size="sm" onClick={toggleMute} className="text-white hover:bg-white/20">
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
              {/* Volume slider */}
              <div className="w-20">
                <Slider
                  value={[isMuted ? 0 : volume * 100]}
                  onValueChange={handleVolumeChange}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
            
            {/* Time display: current / total */}
            <span className="text-sm">
              {formatTime(currentTime)} / {formatTime(videoDuration || duration * 60)}
            </span>
          </div>
          
          {/* Watch time display */}
          <div className="text-sm">
            Watch time: {Math.floor(watchedTime / 60)} min
          </div>
        </div>
      </div>
      
      {/* Large centre play button overlay — shown when video is paused */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <Button onClick={togglePlay} size="lg" className="bg-primary hover:bg-primary/90 rounded-full w-16 h-16">
            <Play className="h-8 w-8 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;

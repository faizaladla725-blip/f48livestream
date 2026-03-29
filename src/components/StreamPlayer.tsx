import { extractYoutubeVideoId } from '@/lib/youtubeUtils';
import { Tv } from 'lucide-react';

interface StreamPlayerProps {
  youtubeUrl: string;
  isLive: boolean;
}

export function StreamPlayer({ youtubeUrl, isLive }: StreamPlayerProps) {
  const videoId = extractYoutubeVideoId(youtubeUrl);

  if (!videoId) {
    return (
      <div className="aspect-video bg-stream rounded-lg flex flex-col items-center justify-center gap-3">
        <Tv className="w-12 h-12 text-muted-foreground" />
        <p className="text-foreground font-heading text-lg">Stream Offline</p>
        <p className="text-muted-foreground text-sm">Menunggu siaran dimulai...</p>
      </div>
    );
  }

  return (
    <div className="aspect-video bg-stream rounded-lg overflow-hidden relative">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Live Stream"
      />
      {isLive && (
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-live/90 px-2.5 py-1 rounded-md">
          <span className="w-2 h-2 rounded-full bg-primary-foreground live-pulse" />
          <span className="text-xs font-heading font-semibold text-primary-foreground">LIVE</span>
        </div>
      )}
    </div>
  );
}

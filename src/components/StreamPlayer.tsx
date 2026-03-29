import { useRef, useCallback } from 'react';
import { extractYoutubeVideoId } from '@/lib/youtubeUtils';
import { Tv, Maximize, PictureInPicture2 } from 'lucide-react';

interface StreamPlayerProps {
  youtubeUrl: string;
  isLive: boolean;
}

export function StreamPlayer({ youtubeUrl, isLive }: StreamPlayerProps) {
  const videoId = extractYoutubeVideoId(youtubeUrl);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      container.requestFullscreen();
    }
  }, []);

  const handlePip = useCallback(async () => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    try {
      if ('documentPictureInPicture' in window) {
        const pipWindow = await (window as any).documentPictureInPicture.requestWindow({
          width: 400,
          height: 225,
        });
        const pipIframe = pipWindow.document.createElement('iframe');
        pipIframe.src = iframe.src;
        pipIframe.style.width = '100%';
        pipIframe.style.height = '100%';
        pipIframe.style.border = 'none';
        pipIframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        pipWindow.document.body.style.margin = '0';
        pipWindow.document.body.style.overflow = 'hidden';
        pipWindow.document.body.appendChild(pipIframe);
      }
    } catch (e) {
      console.log('PiP not supported:', e);
    }
  }, []);

  if (!videoId) {
    return (
      <div className="aspect-video bg-card rounded-xl border border-border flex flex-col items-center justify-center gap-3">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
          <Tv className="w-8 h-8 text-muted-foreground" />
        </div>
        <div className="text-center">
          <p className="text-foreground font-heading font-semibold">Stream Offline</p>
          <p className="text-muted-foreground text-xs mt-0.5">Menunggu siaran dimulai...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="aspect-video bg-stream rounded-xl overflow-hidden relative group">
      <iframe
        ref={iframeRef}
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&showinfo=0&iv_load_policy=3&controls=0&fs=0&playsinline=1&cc_load_policy=0&disablekb=1`}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Live Stream"
      />
      {/* LIVE badge */}
      {isLive && (
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-live/90 px-2 py-0.5 rounded-md backdrop-blur-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground live-pulse" />
          <span className="text-[10px] font-heading font-bold text-primary-foreground leading-none">LIVE</span>
        </div>
      )}
      {/* Controls overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent pt-8 pb-2.5 px-3 flex items-end justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handlePip}
          className="bg-foreground/20 hover:bg-foreground/30 text-primary-foreground rounded-lg p-2 backdrop-blur-sm transition-colors"
          title="Picture in Picture"
        >
          <PictureInPicture2 className="w-4 h-4" />
        </button>
        <button
          onClick={handleFullscreen}
          className="bg-foreground/20 hover:bg-foreground/30 text-primary-foreground rounded-lg p-2 backdrop-blur-sm transition-colors"
          title="Fullscreen"
        >
          <Maximize className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

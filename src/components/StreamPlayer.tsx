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
      // Try to get the video element inside iframe (same-origin won't work for YT)
      // Fallback: use documentPictureInPicture API or requestPictureInPicture on iframe
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
      <div className={`aspect-video bg-stream rounded-lg flex flex-col items-center justify-center gap-3 ${hidden ? 'hidden' : ''}`}>
        <Tv className="w-12 h-12 text-muted-foreground" />
        <p className="text-foreground font-heading text-lg">Stream Offline</p>
        <p className="text-muted-foreground text-sm">Menunggu siaran dimulai...</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`aspect-video bg-stream rounded-lg overflow-hidden relative group ${hidden ? 'hidden' : ''}`}>
      <iframe
        ref={iframeRef}
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&showinfo=0&iv_load_policy=3&disablekb=0&fs=0&controls=1&playsinline=1`}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Live Stream"
      />
      {/* LIVE badge - smaller */}
      {isLive && (
        <div className="absolute top-2 left-2 flex items-center gap-1 bg-live/90 px-1.5 py-0.5 rounded">
          <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground live-pulse" />
          <span className="text-[10px] font-heading font-semibold text-primary-foreground leading-none">LIVE</span>
        </div>
      )}
      {/* Controls overlay */}
      <div className="absolute bottom-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handlePip}
          className="bg-background/70 hover:bg-background/90 text-foreground rounded p-1.5 backdrop-blur-sm transition-colors"
          title="Picture in Picture"
        >
          <PictureInPicture2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleFullscreen}
          className="bg-background/70 hover:bg-background/90 text-foreground rounded p-1.5 backdrop-blur-sm transition-colors"
          title="Fullscreen"
        >
          <Maximize className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

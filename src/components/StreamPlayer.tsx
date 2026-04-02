import { useRef, useCallback, useEffect, useState, useMemo } from 'react';
import { extractYoutubeVideoId } from '@/lib/youtubeUtils';
import { Tv, Maximize, Minimize, PictureInPicture2, Volume2, VolumeX, Settings } from 'lucide-react';
import Hls from 'hls.js';

interface StreamPlayerProps {
  youtubeUrl: string;
  m3u8Url?: string;
  streamType?: 'youtube' | 'm3u8';
  isLive: boolean;
}

const QUALITY_LABELS: Record<number, string> = {
  0: 'Auto',
  1: '1080p',
  2: '720p',
  3: '480p',
  4: '360p',
};

export function StreamPlayer({ youtubeUrl, m3u8Url, streamType = 'youtube', isLive }: StreamPlayerProps) {
  const videoId = streamType === 'youtube' ? extractYoutubeVideoId(youtubeUrl) : null;
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPip, setIsPip] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [hlsLevels, setHlsLevels] = useState<{ index: number; height: number }[]>([]);
  const [currentLevel, setCurrentLevel] = useState(-1); // -1 = auto
  const [showControls, setShowControls] = useState(false);
  const controlsTimeout = useRef<ReturnType<typeof setTimeout>>();

  const iframeSrc = useMemo(() => {
    if (!videoId) return '';
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&showinfo=0&iv_load_policy=3&controls=0&fs=0&playsinline=1&cc_load_policy=0&disablekb=1&origin=${window.location.origin}`;
  }, [videoId]);

  // HLS setup
  useEffect(() => {
    if (streamType !== 'm3u8' || !m3u8Url || !videoRef.current) return;
    const video = videoRef.current;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 10,
        liveDurationInfinity: true,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
      });
      hlsRef.current = hls;
      hls.loadSource(m3u8Url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, (_e, data) => {
        video.play().catch(() => {});
        const levels = data.levels.map((l, i) => ({ index: i, height: l.height }));
        setHlsLevels(levels);
      });
      hls.on(Hls.Events.LEVEL_SWITCHED, (_e, data) => {
        setCurrentLevel(data.level);
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            setTimeout(() => hls.startLoad(), 1000);
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = m3u8Url;
      video.addEventListener('loadedmetadata', () => video.play().catch(() => {}));
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      setHlsLevels([]);
    };
  }, [m3u8Url, streamType]);

  // Apply volume
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : volume / 100;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Track fullscreen state
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

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
    if (streamType === 'm3u8' && videoRef.current) {
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
          setIsPip(false);
        } else {
          await videoRef.current.requestPictureInPicture();
          setIsPip(true);
        }
      } catch (e) {
        console.log('PiP not supported:', e);
      }
      return;
    }
    if (videoId) {
      try {
        if ('documentPictureInPicture' in window) {
          const pipWindow = await (window as any).documentPictureInPicture.requestWindow({ width: 400, height: 225 });
          const pipIframe = pipWindow.document.createElement('iframe');
          pipIframe.src = iframeSrc;
          pipIframe.style.cssText = 'width:100%;height:100%;border:none;';
          pipIframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
          pipWindow.document.body.style.cssText = 'margin:0;overflow:hidden;background:#000;';
          pipWindow.document.body.appendChild(pipIframe);
          setIsPip(true);
          pipWindow.addEventListener('pagehide', () => setIsPip(false));
        }
      } catch (e) {
        console.log('PiP not supported:', e);
      }
    }
  }, [streamType, videoId, iframeSrc]);

  const handleQualityChange = useCallback((levelIndex: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelIndex; // -1 = auto
      setCurrentLevel(levelIndex);
    }
    setShowQualityMenu(false);
  }, []);

  const handleToggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  const handleInteraction = useCallback(() => {
    setShowControls(true);
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  const hasStream = streamType === 'youtube' ? !!videoId : !!m3u8Url;

  if (!isLive || !hasStream) {
    return (
      <div className="aspect-video bg-card/50 rounded-2xl border border-border/30 flex flex-col items-center justify-center gap-2">
        <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center">
          <Tv className="w-6 h-6 text-muted-foreground/50" />
        </div>
        <p className="text-muted-foreground text-xs font-heading">Stream Offline</p>
      </div>
    );
  }

  const isM3u8 = streamType === 'm3u8';
  const controlsVisible = showControls ? 'opacity-100' : 'opacity-0';

  return (
    <div
      ref={containerRef}
      className="aspect-video bg-stream rounded-2xl overflow-hidden relative"
      onMouseMove={handleInteraction}
      onTouchStart={handleInteraction}
      onClick={handleInteraction}
    >
      {streamType === 'youtube' && videoId ? (
        <iframe
          src={iframeSrc}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Live Stream"
        />
      ) : (
        <video
          ref={videoRef}
          className="w-full h-full object-contain bg-black"
          playsInline
          autoPlay
          muted={isMuted}
        />
      )}

      {/* Watermark */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
        <div className="watermark-scroll absolute whitespace-nowrap text-foreground/[0.04] text-sm font-heading tracking-[0.5em]" style={{ top: '25%' }}>
          {'f48 · '.repeat(20)}
        </div>
        <div className="watermark-scroll-reverse absolute whitespace-nowrap text-foreground/[0.04] text-sm font-heading tracking-[0.5em]" style={{ top: '55%' }}>
          {'f48 · '.repeat(20)}
        </div>
        <div className="watermark-scroll absolute whitespace-nowrap text-foreground/[0.04] text-sm font-heading tracking-[0.5em]" style={{ top: '80%' }}>
          {'f48 · '.repeat(20)}
        </div>
      </div>

      {/* LIVE badge */}
      {isLive && (
        <div className="absolute top-1.5 left-1.5 flex items-center gap-0.5 bg-live/90 px-1 py-0.5 rounded backdrop-blur-sm">
          <span className="w-1 h-1 rounded-full bg-primary-foreground live-pulse" />
          <span className="text-[7px] font-heading font-bold text-primary-foreground">LIVE</span>
        </div>
      )}

      {/* Controls overlay */}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent pt-8 pb-2 px-2 transition-opacity duration-300 ${controlsVisible}`}>
        {/* Volume slider (M3U8 only) */}
        {isM3u8 && showVolumeSlider && (
          <div className="absolute bottom-10 left-2 bg-card/90 backdrop-blur-md rounded-lg p-2 flex flex-col items-center gap-1"
            onMouseLeave={() => setShowVolumeSlider(false)}>
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(Number(e.target.value));
                if (Number(e.target.value) > 0) setIsMuted(false);
              }}
              className="w-20 h-1 accent-primary appearance-none bg-muted-foreground/30 rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
              style={{ writingMode: 'horizontal-tb' }}
            />
            <span className="text-[9px] text-muted-foreground">{isMuted ? 0 : volume}%</span>
          </div>
        )}

        {/* Quality menu (M3U8 only) */}
        {isM3u8 && showQualityMenu && hlsLevels.length > 0 && (
          <div className="absolute bottom-10 right-2 bg-card/90 backdrop-blur-md rounded-lg p-1 min-w-[80px]"
            onMouseLeave={() => setShowQualityMenu(false)}>
            <button
              onClick={() => handleQualityChange(-1)}
              className={`w-full text-left px-2 py-1 text-[10px] rounded hover:bg-secondary/50 transition-colors ${currentLevel === -1 ? 'text-primary font-bold' : 'text-foreground'}`}
            >
              Auto
            </button>
            {hlsLevels.map((level) => (
              <button
                key={level.index}
                onClick={() => handleQualityChange(level.index)}
                className={`w-full text-left px-2 py-1 text-[10px] rounded hover:bg-secondary/50 transition-colors ${currentLevel === level.index ? 'text-primary font-bold' : 'text-foreground'}`}
              >
                {level.height}p
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          {/* Left controls */}
          <div className="flex items-center gap-1">
            {isM3u8 && (
              <button
                onClick={handleToggleMute}
                onMouseEnter={() => setShowVolumeSlider(true)}
                className="bg-foreground/15 hover:bg-foreground/25 text-primary-foreground rounded-lg p-1.5 backdrop-blur-sm transition-colors"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-1">
            {isM3u8 && hlsLevels.length > 0 && (
              <button
                onClick={() => setShowQualityMenu(!showQualityMenu)}
                className="bg-foreground/15 hover:bg-foreground/25 text-primary-foreground rounded-lg p-1.5 backdrop-blur-sm transition-colors"
                title="Quality"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={handlePip}
              className="bg-foreground/15 hover:bg-foreground/25 text-primary-foreground rounded-lg p-1.5 backdrop-blur-sm transition-colors"
              title="Picture in Picture"
            >
              <PictureInPicture2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleFullscreen}
              className="bg-foreground/15 hover:bg-foreground/25 text-primary-foreground rounded-lg p-1.5 backdrop-blur-sm transition-colors"
              title="Fullscreen"
            >
              {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

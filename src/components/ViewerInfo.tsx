import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Eye, Radio, AlertTriangle } from 'lucide-react';

interface StreamInfo {
  serverName: string;
  isLive: boolean;
  maxViewers?: number;
}

interface ViewerInfoProps {
  stream: StreamInfo;
}

export function ViewerInfo({ stream }: ViewerInfoProps) {
  const [viewerCount, setViewerCount] = useState(0);

  useEffect(() => {
    const fetchCount = () => {
      supabase
        .from('viewers')
        .select('id', { count: 'exact', head: true })
        .eq('is_online', true)
        .then(({ count }) => setViewerCount(count || 0));
    };

    fetchCount();
    const interval = setInterval(fetchCount, 10000);
    return () => clearInterval(interval);
  }, []);

  const maxViewers = stream.maxViewers || 50;
  const isFull = viewerCount >= maxViewers;
  const fillPercent = Math.min((viewerCount / maxViewers) * 100, 100);

  return (
    <div className="bg-card/30 backdrop-blur-sm rounded-xl border border-border/20 px-3 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {stream.isLive ? (
            <div className="flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-primary live-pulse" />
              <span className="text-xs font-heading font-bold text-foreground">{stream.serverName}</span>
              <span className="text-[9px] text-primary font-semibold bg-primary/10 px-1.5 py-0.5 rounded-full">Live</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-muted-foreground/40" />
              <span className="text-xs font-heading font-semibold text-muted-foreground">{stream.serverName}</span>
              <span className="text-[9px] text-muted-foreground/60">Offline</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isFull && (
            <span className="flex items-center gap-0.5 text-[9px] text-destructive font-heading font-bold bg-destructive/10 px-2 py-0.5 rounded-full border border-destructive/20">
              <AlertTriangle className="w-2.5 h-2.5" />
              Full
            </span>
          )}
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Eye className="w-3 h-3" />
            <span className="text-[10px] font-heading font-semibold tabular-nums">{viewerCount}/{maxViewers}</span>
          </div>
        </div>
      </div>
      {/* Viewer fill bar */}
      <div className="mt-1.5 h-1 bg-muted/30 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${isFull ? 'bg-destructive' : 'bg-primary/60'}`}
          style={{ width: `${fillPercent}%` }}
        />
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Eye, Radio } from 'lucide-react';

interface StreamInfo {
  serverName: string;
  isLive: boolean;
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
    const interval = setInterval(fetchCount, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-between px-1">
      <div className="flex items-center gap-1.5">
        {stream.isLive ? (
          <Radio className="w-3 h-3 text-live live-pulse" />
        ) : (
          <span className="w-2 h-2 rounded-full bg-muted-foreground" />
        )}
        <span className="text-xs font-heading font-semibold text-foreground">{stream.serverName}</span>
        <span className="text-[10px] text-muted-foreground">
          {stream.isLive ? 'Live' : 'Offline'}
        </span>
      </div>
      <div className="flex items-center gap-1 text-muted-foreground">
        <Eye className="w-3 h-3" />
        <span className="text-[10px] font-medium">{viewerCount}</span>
      </div>
    </div>
  );
}

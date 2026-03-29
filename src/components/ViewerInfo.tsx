import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Eye } from 'lucide-react';

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
        .then(({ count }) => {
          setViewerCount(count || 0);
        });
    };

    fetchCount();
    const interval = setInterval(fetchCount, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${stream.isLive ? 'bg-live live-pulse' : 'bg-muted-foreground'}`} />
        <span className="text-sm font-heading font-semibold text-foreground">{stream.serverName}</span>
        <span className="text-xs text-muted-foreground">
          {stream.isLive ? '• Siaran Langsung' : '• Offline'}
        </span>
      </div>
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Eye className="w-3.5 h-3.5" />
        <span className="text-xs font-medium">{viewerCount}</span>
      </div>
    </div>
  );
}

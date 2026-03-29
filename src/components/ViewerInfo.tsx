import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from 'lucide-react';

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
    <div className="bg-card rounded-lg border border-border p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          <User className="w-5 h-5 text-muted-foreground" />
        </div>
        <div>
          <p className="font-heading font-semibold text-foreground">{stream.serverName}</p>
          <p className="text-xs text-muted-foreground">
            {stream.isLive ? 'Siaran Langsung' : 'Offline'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full">
        <span className={`w-2 h-2 rounded-full ${stream.isLive ? 'bg-live live-pulse' : 'bg-muted-foreground'}`} />
        <span className="text-sm font-heading font-semibold text-foreground">{viewerCount}</span>
        <span className="text-xs text-muted-foreground">penonton</span>
      </div>
    </div>
  );
}

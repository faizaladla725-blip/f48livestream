import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { StreamPlayer } from './StreamPlayer';
import { LiveChat } from './LiveChat';
import { ViewerInfo } from './ViewerInfo';
import { ServerTabs } from './ServerTabs';
import { LogOut, Settings, Tv } from 'lucide-react';

interface StreamSetting {
  id: string;
  server_name: string;
  youtube_url: string;
  is_live: boolean;
}

interface StreamPageProps {
  viewerId: string;
  username: string;
  onLogout: () => void;
  onAdminClick?: () => void;
  isAdmin?: boolean;
}

export function StreamPage({ viewerId, username, onLogout, onAdminClick }: StreamPageProps) {
  const [servers, setServers] = useState<StreamSetting[]>([]);
  const [activeServerId, setActiveServerId] = useState('');

  useEffect(() => {
    const fetchServers = async () => {
      const { data } = await supabase.from('stream_settings').select('*').order('server_name');
      if (data && data.length > 0) {
        setServers(data as StreamSetting[]);
        if (!activeServerId) setActiveServerId(data[0].id);
      }
    };

    fetchServers();

    // Subscribe to changes
    const channel = supabase
      .channel('stream_settings')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'stream_settings',
      }, () => {
        fetchServers();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const activeServer = servers.find(s => s.id === activeServerId);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Tv className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-heading font-bold text-foreground">FOUR48</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Hai, <span className="text-foreground font-medium">{username}</span></span>
            {onAdminClick && (
              <button onClick={onAdminClick} className="text-muted-foreground hover:text-foreground transition-colors">
                <Settings className="w-4 h-4" />
              </button>
            )}
            <button onClick={onLogout} className="text-muted-foreground hover:text-foreground transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Server tabs */}
        <div className="px-4 pb-2">
          <ServerTabs
            servers={servers}
            activeServer={activeServerId}
            onServerChange={setActiveServerId}
          />
        </div>

        {/* Stream */}
        <div className="px-4 space-y-3 pb-4">
          {activeServer ? (
            <>
              <StreamPlayer
                youtubeUrl={activeServer.youtube_url || ''}
                isLive={activeServer.is_live}
              />
              <ViewerInfo
                stream={{
                  serverName: activeServer.server_name,
                  isLive: activeServer.is_live,
                }}
              />
            </>
          ) : (
            <div className="aspect-video bg-stream rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          )}

          <LiveChat viewerId={viewerId} username={username} />
        </div>
      </div>
    </div>
  );
}

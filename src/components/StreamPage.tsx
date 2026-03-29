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

export function StreamPage({ viewerId, username, onLogout, onAdminClick, isAdmin }: StreamPageProps) {
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
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
              <Tv className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-base font-heading font-bold text-foreground tracking-tight">FOUR48</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-secondary/50 rounded-full px-3 py-1">
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-[9px] font-bold text-primary">{username[0]?.toUpperCase()}</span>
              </div>
              <span className="text-xs text-foreground font-medium">{username}</span>
            </div>
            {onAdminClick && (
              <button onClick={onAdminClick} className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                <Settings className="w-3.5 h-3.5" />
              </button>
            )}
            <button onClick={onLogout} className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Server tabs */}
        <div className="px-4 pt-3 pb-2">
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
            <div className="aspect-video bg-stream rounded-xl flex items-center justify-center">
              <div className="text-center">
                <Tv className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">Memuat...</p>
              </div>
            </div>
          )}

          <LiveChat viewerId={viewerId} username={username} isAdmin={isAdmin} />
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { StreamPlayer } from './StreamPlayer';
import { LiveChat } from './LiveChat';
import { ViewerInfo } from './ViewerInfo';
import { ServerTabs } from './ServerTabs';
import { ShowSchedule } from './ShowSchedule';
import { RealtimeClock } from './RealtimeClock';
import { MemberLineup } from './MemberLineup';
import { LogOut, Settings, Tv, Calendar } from 'lucide-react';
import { SpeedTest } from './SpeedTest';

interface StreamSetting {
  id: string;
  server_name: string;
  youtube_url: string;
  m3u8_url?: string;
  stream_type?: string;
  is_live: boolean;
  max_viewers?: number;
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
  const [showSchedule, setShowSchedule] = useState(false);

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
      .channel('stream_settings_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stream_settings' }, () => fetchServers())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const activeServer = servers.find(s => s.id === activeServerId);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/30">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg flex items-center justify-center border border-primary/15">
              <Tv className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="text-sm font-heading font-bold text-foreground">F48</span>
          </div>

          <RealtimeClock />

          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 bg-secondary/30 rounded-full px-2 py-1">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center border border-primary/20">
                <span className="text-[8px] font-bold text-primary">{username[0]?.toUpperCase()}</span>
              </div>
              <span className="text-[10px] text-foreground font-medium max-w-[60px] truncate">{username}</span>
            </div>
            <SpeedTest />
            <button
              onClick={() => setShowSchedule(!showSchedule)}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${showSchedule ? 'bg-primary/20 text-primary' : 'bg-secondary/30 text-muted-foreground hover:text-foreground'}`}
            >
              <Calendar className="w-3 h-3" />
            </button>
            {onAdminClick && (
              <button onClick={onAdminClick} className="w-7 h-7 rounded-lg bg-secondary/30 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                <Settings className="w-3 h-3" />
              </button>
            )}
            <button onClick={onLogout} className="w-7 h-7 rounded-lg bg-secondary/30 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
              <LogOut className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="px-3 pt-2 pb-4 space-y-2.5">
          <ServerTabs servers={servers} activeServer={activeServerId} onServerChange={setActiveServerId} />

          {activeServer ? (
            <>
              <StreamPlayer
                youtubeUrl={activeServer.youtube_url || ''}
                m3u8Url={activeServer.m3u8_url || ''}
                streamType={(activeServer.stream_type as 'youtube' | 'm3u8') || 'youtube'}
                isLive={activeServer.is_live}
              />
              <ViewerInfo stream={{ serverName: activeServer.server_name, isLive: activeServer.is_live, maxViewers: (activeServer as any).max_viewers || 50 }} />
              <MemberLineup />
            </>
          ) : (
            <div className="aspect-video bg-card/50 rounded-2xl flex items-center justify-center">
              <Tv className="w-6 h-6 text-muted-foreground/30" />
            </div>
          )}

          {showSchedule && <ShowSchedule />}

          <LiveChat viewerId={viewerId} username={username} isAdmin={isAdmin} />
        </div>
      </div>
    </div>
  );
}

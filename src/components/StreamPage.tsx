import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { StreamPlayer } from './StreamPlayer';
import { LiveChat } from './LiveChat';
import { ViewerInfo } from './ViewerInfo';
import { ServerTabs } from './ServerTabs';
import { ShowSchedule } from './ShowSchedule';
import { RealtimeClock } from './RealtimeClock';
import { MemberLineup } from './MemberLineup';
import { LogOut, Settings, Radio, Calendar, Zap } from 'lucide-react';
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
        if (!activeServerId) {
          // Auto-select first LIVE server, fallback to first server
          const liveServer = data.find((s: any) => s.is_live);
          setActiveServerId(liveServer ? liveServer.id : data[0].id);
        }
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
        {/* Header - Glassmorphism */}
        <div className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-border/20">
          <div className="flex items-center justify-between px-4 py-3">
            {/* Brand */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                <Radio className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <span className="text-sm font-heading font-bold text-foreground tracking-tight">F48</span>
                <span className="text-[9px] text-primary font-medium ml-1.5 bg-primary/10 px-1.5 py-0.5 rounded-full">LIVE</span>
              </div>
            </div>

            {/* Clock */}
            <RealtimeClock />

            {/* Actions */}
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-1.5 bg-card/60 backdrop-blur-sm rounded-full px-2.5 py-1.5 border border-border/20">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
                  <span className="text-[8px] font-bold text-primary-foreground">{username[0]?.toUpperCase()}</span>
                </div>
                <span className="text-[10px] text-foreground font-medium max-w-[50px] truncate">{username}</span>
              </div>
              <SpeedTest />
              <button
                onClick={() => setShowSchedule(!showSchedule)}
                className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${showSchedule ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-card/60 text-muted-foreground hover:text-foreground border border-border/20'}`}
              >
                <Calendar className="w-3 h-3" />
              </button>
              {onAdminClick && (
                <button onClick={onAdminClick} className="w-7 h-7 rounded-xl bg-card/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors border border-border/20">
                  <Settings className="w-3 h-3" />
                </button>
              )}
              <button onClick={onLogout} className="w-7 h-7 rounded-xl bg-card/60 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors border border-border/20">
                <LogOut className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="px-3 pt-3 pb-6 space-y-3">
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
            <div className="aspect-video bg-card/30 rounded-2xl flex flex-col items-center justify-center gap-3 border border-border/20">
              <div className="w-14 h-14 rounded-2xl bg-muted/30 flex items-center justify-center">
                <Radio className="w-7 h-7 text-muted-foreground/30" />
              </div>
              <p className="text-muted-foreground text-xs font-heading">No Server Available</p>
            </div>
          )}

          {showSchedule && <ShowSchedule />}

          <LiveChat viewerId={viewerId} username={username} isAdmin={isAdmin} />
        </div>
      </div>
    </div>
  );
}

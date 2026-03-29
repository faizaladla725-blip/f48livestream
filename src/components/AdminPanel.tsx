import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { LogOut, Users, Settings, Tv, Ban, ShieldCheck } from 'lucide-react';

interface StreamSetting {
  id: string;
  server_name: string;
  youtube_url: string;
  is_live: boolean;
}

interface Viewer {
  id: string;
  username: string;
  is_online: boolean;
  is_banned: boolean;
  last_seen: string;
}

export function AdminPanel() {
  const [servers, setServers] = useState<StreamSetting[]>([]);
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [tab, setTab] = useState<'settings' | 'viewers'>('settings');

  useEffect(() => {
    fetchServers();
    fetchViewers();
    const interval = setInterval(fetchViewers, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchServers = async () => {
    const { data } = await supabase.from('stream_settings').select('*').order('server_name');
    if (data) setServers(data as StreamSetting[]);
  };

  const fetchViewers = async () => {
    const { data } = await supabase.from('viewers').select('*').order('last_seen', { ascending: false });
    if (data) setViewers(data as Viewer[]);
  };

  const updateServer = async (id: string, updates: Partial<StreamSetting>) => {
    await supabase.from('stream_settings').update(updates).eq('id', id);
    fetchServers();
  };

  const toggleBan = async (viewerId: string, currentBanned: boolean) => {
    await supabase.from('viewers').update({ is_banned: !currentBanned }).eq('id', viewerId);
    fetchViewers();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const onlineCount = viewers.filter(v => v.is_online && !v.is_banned).length;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-lg mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-heading font-bold text-foreground flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" /> Admin Panel
          </h1>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant={tab === 'settings' ? 'default' : 'secondary'}
            onClick={() => setTab('settings')}
            className="flex-1 font-heading"
            size="sm"
          >
            <Tv className="w-4 h-4 mr-1" /> Stream
          </Button>
          <Button
            variant={tab === 'viewers' ? 'default' : 'secondary'}
            onClick={() => setTab('viewers')}
            className="flex-1 font-heading"
            size="sm"
          >
            <Users className="w-4 h-4 mr-1" /> Penonton ({onlineCount})
          </Button>
        </div>

        {tab === 'settings' && (
          <div className="space-y-3">
            {servers.map((server) => (
              <div key={server.id} className="bg-card rounded-lg border border-border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-semibold text-foreground">{server.server_name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {server.is_live ? 'LIVE' : 'OFF'}
                    </span>
                    <Switch
                      checked={server.is_live}
                      onCheckedChange={(checked) => updateServer(server.id, { is_live: checked })}
                    />
                  </div>
                </div>
                <Input
                  placeholder="YouTube URL..."
                  value={server.youtube_url || ''}
                  onChange={(e) => updateServer(server.id, { youtube_url: e.target.value })}
                  className="bg-muted border-border text-foreground text-sm"
                />
              </div>
            ))}
          </div>
        )}

        {tab === 'viewers' && (
          <div className="bg-card rounded-lg border border-border divide-y divide-border">
            {viewers.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-8">Belum ada penonton</p>
            )}
            {viewers.map((viewer) => (
              <div key={viewer.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${viewer.is_banned ? 'bg-destructive' : viewer.is_online ? 'bg-online' : 'bg-muted-foreground'}`} />
                  <span className={`text-sm font-medium ${viewer.is_banned ? 'text-destructive line-through' : 'text-foreground'}`}>
                    {viewer.username}
                  </span>
                  {viewer.is_banned && (
                    <span className="text-[10px] bg-destructive/20 text-destructive px-1.5 py-0.5 rounded font-heading">BANNED</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {viewer.is_online ? 'Online' : new Date(viewer.last_seen).toLocaleTimeString('id-ID')}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => toggleBan(viewer.id, viewer.is_banned)}
                    title={viewer.is_banned ? 'Unban' : 'Ban'}
                  >
                    {viewer.is_banned ? (
                      <ShieldCheck className="w-3.5 h-3.5 text-online" />
                    ) : (
                      <Ban className="w-3.5 h-3.5 text-destructive" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

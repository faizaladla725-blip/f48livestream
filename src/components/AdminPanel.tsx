import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { LogOut, Users, Settings, Tv, Ban, ShieldCheck, KeyRound, Trash2 } from 'lucide-react';

interface StreamSetting {
  id: string;
  server_name: string;
  youtube_url: string;
  is_live: boolean;
  access_code?: string;
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
  const [accessCode, setAccessCode] = useState('');

  useEffect(() => {
    fetchServers();
    fetchViewers();
    const interval = setInterval(fetchViewers, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchServers = async () => {
    const { data } = await supabase.from('stream_settings').select('*').order('server_name');
    if (data) {
      setServers(data as StreamSetting[]);
      if (data.length > 0 && (data[0] as any).access_code) {
        setAccessCode((data[0] as any).access_code);
      }
    }
  };

  const fetchViewers = async () => {
    const { data } = await supabase.from('viewers').select('*').order('last_seen', { ascending: false });
    if (data) setViewers(data as Viewer[]);
  };

  const updateServer = async (id: string, updates: Partial<StreamSetting>) => {
    await supabase.from('stream_settings').update(updates).eq('id', id);
    fetchServers();
  };

  const updateAccessCode = async () => {
    // Update access code on all servers
    for (const server of servers) {
      await supabase.from('stream_settings').update({ access_code: accessCode } as any).eq('id', server.id);
    }
  };

  const toggleBan = async (viewerId: string, currentBanned: boolean) => {
    await supabase.from('viewers').update({ is_banned: !currentBanned }).eq('id', viewerId);
    fetchViewers();
  };

  const clearYoutubeUrl = async (id: string) => {
    await supabase.from('stream_settings').update({ youtube_url: '', is_live: false }).eq('id', id);
    fetchServers();
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
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
              <Settings className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="text-base font-heading font-bold text-foreground">Admin Panel</h1>
              <p className="text-[10px] text-muted-foreground">FOUR48 Management</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-lg">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant={tab === 'settings' ? 'default' : 'secondary'}
            onClick={() => setTab('settings')}
            className="flex-1 font-heading rounded-xl h-10"
            size="sm"
          >
            <Tv className="w-4 h-4 mr-1.5" /> Stream
          </Button>
          <Button
            variant={tab === 'viewers' ? 'default' : 'secondary'}
            onClick={() => setTab('viewers')}
            className="flex-1 font-heading rounded-xl h-10"
            size="sm"
          >
            <Users className="w-4 h-4 mr-1.5" /> Penonton ({onlineCount})
          </Button>
        </div>

        {tab === 'settings' && (
          <div className="space-y-3">
            {/* Access Code */}
            <div className="bg-card rounded-xl border border-border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-primary" />
                <h3 className="font-heading font-semibold text-foreground text-sm">Kode Akses</h3>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Kosongkan jika tidak perlu kode..."
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  className="bg-muted border-0 text-foreground text-sm rounded-lg"
                />
                <Button size="sm" onClick={updateAccessCode} className="rounded-lg shrink-0">
                  Simpan
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">Penonton harus memasukkan kode ini untuk bisa nonton</p>
            </div>

            {/* Server settings */}
            {servers.map((server) => (
              <div key={server.id} className="bg-card rounded-xl border border-border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-semibold text-foreground text-sm">{server.server_name}</h3>
                  <div className="flex items-center gap-2.5">
                    <span className={`text-[10px] font-heading font-semibold px-2 py-0.5 rounded ${server.is_live ? 'bg-live/20 text-live' : 'bg-muted text-muted-foreground'}`}>
                      {server.is_live ? 'LIVE' : 'OFF'}
                    </span>
                    <Switch
                      checked={server.is_live}
                      onCheckedChange={(checked) => updateServer(server.id, { is_live: checked })}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="YouTube URL..."
                    value={server.youtube_url || ''}
                    onChange={(e) => updateServer(server.id, { youtube_url: e.target.value })}
                    className="bg-muted border-0 text-foreground text-sm rounded-lg"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"
                    onClick={() => clearYoutubeUrl(server.id)}
                    title="Hapus URL"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'viewers' && (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            {viewers.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-8">Belum ada penonton</p>
            )}
            {viewers.map((viewer, i) => (
              <div key={viewer.id} className={`flex items-center justify-between px-4 py-3 ${i > 0 ? 'border-t border-border' : ''}`}>
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">{viewer.username[0]?.toUpperCase()}</span>
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card ${viewer.is_banned ? 'bg-destructive' : viewer.is_online ? 'bg-online' : 'bg-muted-foreground'}`} />
                  </div>
                  <div>
                    <span className={`text-sm font-medium ${viewer.is_banned ? 'text-destructive line-through' : 'text-foreground'}`}>
                      {viewer.username}
                    </span>
                    {viewer.is_banned && (
                      <span className="ml-1.5 text-[9px] bg-destructive/20 text-destructive px-1.5 py-0.5 rounded font-heading">BANNED</span>
                    )}
                    <p className="text-[10px] text-muted-foreground">
                      {viewer.is_online ? 'Online sekarang' : new Date(viewer.last_seen).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  onClick={() => toggleBan(viewer.id, viewer.is_banned)}
                  title={viewer.is_banned ? 'Unban' : 'Ban'}
                >
                  {viewer.is_banned ? (
                    <ShieldCheck className="w-4 h-4 text-online" />
                  ) : (
                    <Ban className="w-4 h-4 text-destructive" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

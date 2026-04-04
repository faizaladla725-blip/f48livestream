import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { LogOut, Users, Settings, Tv, Ban, ShieldCheck, KeyRound, Trash2, Calendar, Eye, Radio, Server, UserCircle, Timer, TimerOff } from 'lucide-react';
import { AdminShowManager } from './AdminShowManager';
import { AdminLineupManager } from './AdminLineupManager';
import { toast } from 'sonner';

interface StreamSetting {
  id: string;
  server_name: string;
  youtube_url: string;
  m3u8_url?: string;
  stream_type?: string;
  is_live: boolean;
  access_code?: string;
  max_viewers?: number;
}

interface Viewer {
  id: string;
  username: string;
  is_online: boolean;
  is_banned: boolean;
  last_seen: string;
}

interface AutoEndTimer {
  serverId: string;
  endTime: number; // timestamp
}

export function AdminPanel() {
  const [servers, setServers] = useState<StreamSetting[]>([]);
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [tab, setTab] = useState<'settings' | 'viewers' | 'shows' | 'lineup'>('settings');
  const [accessCode, setAccessCode] = useState('');
  const [autoEndTimers, setAutoEndTimers] = useState<AutoEndTimer[]>([]);
  const [autoEndInputs, setAutoEndInputs] = useState<Record<string, string>>({});
  const [countdowns, setCountdowns] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchServers();
    fetchViewers();
    const interval = setInterval(fetchViewers, 10000);
    return () => clearInterval(interval);
  }, []);

  // Countdown display + auto-end logic
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const newCountdowns: Record<string, string> = {};
      const expired: string[] = [];

      autoEndTimers.forEach(timer => {
        const remaining = timer.endTime - now;
        if (remaining <= 0) {
          expired.push(timer.serverId);
        } else {
          const h = Math.floor(remaining / 3600000);
          const m = Math.floor((remaining % 3600000) / 60000);
          const s = Math.floor((remaining % 60000) / 1000);
          newCountdowns[timer.serverId] = `${h > 0 ? h + ':' : ''}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        }
      });

      setCountdowns(newCountdowns);

      if (expired.length > 0) {
        expired.forEach(async (serverId) => {
          await supabase.from('stream_settings').update({ is_live: false }).eq('id', serverId);
          toast.success('Stream otomatis dimatikan');
        });
        setAutoEndTimers(prev => prev.filter(t => !expired.includes(t.serverId)));
        fetchServers();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [autoEndTimers]);

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
    await supabase.from('stream_settings').update(updates as any).eq('id', id);
    fetchServers();
  };

  const updateAccessCode = async () => {
    for (const server of servers) {
      await supabase.from('stream_settings').update({ access_code: accessCode } as any).eq('id', server.id);
    }
    toast.success('Kode akses diperbarui');
  };

  const toggleBan = async (viewerId: string, currentBanned: boolean) => {
    await supabase.from('viewers').update({ is_banned: !currentBanned }).eq('id', viewerId);
    fetchViewers();
  };

  const clearStreamUrl = async (id: string) => {
    await supabase.from('stream_settings').update({ youtube_url: '', m3u8_url: '', is_live: false } as any).eq('id', id);
    fetchServers();
  };

  const setAutoEnd = (serverId: string) => {
    const minutes = parseInt(autoEndInputs[serverId] || '0');
    if (minutes <= 0) {
      toast.error('Masukkan durasi dalam menit');
      return;
    }
    const endTime = Date.now() + minutes * 60000;
    setAutoEndTimers(prev => [...prev.filter(t => t.serverId !== serverId), { serverId, endTime }]);
    setAutoEndInputs(prev => ({ ...prev, [serverId]: '' }));
    toast.success(`Auto end dalam ${minutes} menit`);
  };

  const cancelAutoEnd = (serverId: string) => {
    setAutoEndTimers(prev => prev.filter(t => t.serverId !== serverId));
    toast.info('Auto end dibatalkan');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const onlineCount = viewers.filter(v => v.is_online && !v.is_banned).length;
  const totalViewers = viewers.length;
  const bannedCount = viewers.filter(v => v.is_banned).length;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-lg mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary/50 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Settings className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-base font-heading font-bold text-foreground">Admin Panel</h1>
              <p className="text-[10px] text-muted-foreground">FOUR48 Management</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-xl">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-card/40 backdrop-blur-sm rounded-xl border border-border/20 p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Eye className="w-3 h-3" />
              <span className="text-[9px] font-heading">Online</span>
            </div>
            <p className="text-lg font-heading font-bold text-green-400">{onlineCount}</p>
          </div>
          <div className="bg-card/40 backdrop-blur-sm rounded-xl border border-border/20 p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Users className="w-3 h-3" />
              <span className="text-[9px] font-heading">Total</span>
            </div>
            <p className="text-lg font-heading font-bold text-foreground">{totalViewers}</p>
          </div>
          <div className="bg-card/40 backdrop-blur-sm rounded-xl border border-border/20 p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Ban className="w-3 h-3" />
              <span className="text-[9px] font-heading">Banned</span>
            </div>
            <p className="text-lg font-heading font-bold text-destructive">{bannedCount}</p>
          </div>
        </div>

        {/* Server status cards */}
        <div className="space-y-2">
          {servers.map((server) => {
            const maxV = (server as any).max_viewers || 50;
            const hasTimer = autoEndTimers.some(t => t.serverId === server.id);
            return (
              <div key={server.id} className="bg-card/40 backdrop-blur-sm rounded-xl border border-border/20 px-3 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {server.is_live ? <Radio className="w-3 h-3 text-primary live-pulse" /> : <Server className="w-3 h-3 text-muted-foreground" />}
                  <span className="text-xs font-heading font-semibold text-foreground">{server.server_name}</span>
                  <span className={`text-[8px] font-heading font-bold px-1.5 py-0.5 rounded-full ${server.is_live ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    {server.is_live ? 'LIVE' : 'OFF'}
                  </span>
                  {hasTimer && countdowns[server.id] && (
                    <span className="text-[9px] font-heading font-bold text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                      <Timer className="w-2.5 h-2.5" />
                      {countdowns[server.id]}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Eye className="w-3 h-3" />
                  <span className="text-[10px] font-medium tabular-nums">{onlineCount}/{maxV}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap">
          {(['settings', 'shows', 'lineup', 'viewers'] as const).map((t) => (
            <Button
              key={t}
              variant={tab === t ? 'default' : 'secondary'}
              onClick={() => setTab(t)}
              className={`flex-1 font-heading rounded-xl h-10 ${tab === t ? 'shadow-lg shadow-primary/20' : ''}`}
              size="sm"
            >
              {t === 'settings' && <Tv className="w-4 h-4 mr-1.5" />}
              {t === 'shows' && <Calendar className="w-4 h-4 mr-1.5" />}
              {t === 'lineup' && <UserCircle className="w-4 h-4 mr-1.5" />}
              {t === 'viewers' && <Users className="w-4 h-4 mr-1.5" />}
              {t === 'settings' ? 'Stream' : t === 'shows' ? 'Shows' : t === 'lineup' ? 'Lineup' : `(${onlineCount})`}
            </Button>
          ))}
        </div>

        {tab === 'settings' && (
          <div className="space-y-3">
            {/* Access Code */}
            <div className="bg-card/40 backdrop-blur-sm rounded-xl border border-border/20 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-primary" />
                <h3 className="font-heading font-semibold text-foreground text-sm">Kode Akses</h3>
              </div>
              <div className="flex gap-2">
                <Input placeholder="Kosongkan jika tidak perlu..." value={accessCode} onChange={(e) => setAccessCode(e.target.value)} className="bg-muted/30 border-border/20 text-foreground text-sm rounded-xl" />
                <Button size="sm" onClick={updateAccessCode} className="rounded-xl shrink-0">Simpan</Button>
              </div>
            </div>

            {/* Server settings */}
            {servers.map((server) => {
              const hasTimer = autoEndTimers.some(t => t.serverId === server.id);
              return (
                <div key={server.id} className="bg-card/40 backdrop-blur-sm rounded-xl border border-border/20 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading font-semibold text-foreground text-sm">{server.server_name}</h3>
                    <div className="flex items-center gap-2.5">
                      <span className={`text-[10px] font-heading font-semibold px-2 py-0.5 rounded-full ${server.is_live ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        {server.is_live ? 'LIVE' : 'OFF'}
                      </span>
                      <Switch checked={server.is_live} onCheckedChange={(checked) => updateServer(server.id, { is_live: checked })} />
                    </div>
                  </div>

                  {/* Auto End Live */}
                  {server.is_live && (
                    <div className="bg-yellow-400/5 border border-yellow-400/20 rounded-xl p-3 space-y-2">
                      <div className="flex items-center gap-1.5">
                        <Timer className="w-3.5 h-3.5 text-yellow-400" />
                        <span className="text-[11px] font-heading font-semibold text-yellow-400">Auto End Live</span>
                      </div>
                      {hasTimer && countdowns[server.id] ? (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-heading font-bold text-yellow-400 tabular-nums">{countdowns[server.id]}</span>
                          <button onClick={() => cancelAutoEnd(server.id)} className="flex items-center gap-1 text-[10px] text-destructive hover:text-destructive/80 font-heading font-semibold transition-colors">
                            <TimerOff className="w-3 h-3" />
                            Batalkan
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="Menit..."
                            value={autoEndInputs[server.id] || ''}
                            onChange={(e) => setAutoEndInputs(prev => ({ ...prev, [server.id]: e.target.value }))}
                            className="bg-muted/30 border-border/20 text-foreground text-sm rounded-lg h-8 flex-1"
                            min="1"
                          />
                          <Button size="sm" onClick={() => setAutoEnd(server.id)} className="rounded-lg h-8 text-[10px] px-3">
                            <Timer className="w-3 h-3 mr-1" /> Set
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Max viewers */}
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="text-[10px] text-muted-foreground shrink-0">Max Viewer:</span>
                    <Input type="number" value={(server as any).max_viewers || 50} onChange={(e) => updateServer(server.id, { max_viewers: parseInt(e.target.value) || 50 } as any)} className="bg-muted/30 border-border/20 text-foreground text-sm rounded-lg h-8 w-20" min="1" max="10000" />
                  </div>

                  {/* Stream type */}
                  <select value={server.stream_type || 'youtube'} onChange={(e) => updateServer(server.id, { stream_type: e.target.value } as any)} className="w-full bg-muted/30 text-foreground text-sm rounded-xl h-9 px-3 border border-border/20">
                    <option value="youtube">YouTube</option>
                    <option value="m3u8">M3U8/HLS</option>
                  </select>

                  <div className="flex gap-2">
                    {(server.stream_type || 'youtube') === 'youtube' ? (
                      <Input placeholder="YouTube URL..." value={server.youtube_url || ''} onChange={(e) => updateServer(server.id, { youtube_url: e.target.value })} className="bg-muted/30 border-border/20 text-foreground text-sm rounded-xl" />
                    ) : (
                      <Input placeholder="M3U8 URL..." value={server.m3u8_url || ''} onChange={(e) => updateServer(server.id, { m3u8_url: e.target.value } as any)} className="bg-muted/30 border-border/20 text-foreground text-sm rounded-xl" />
                    )}
                    <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl" onClick={() => clearStreamUrl(server.id)} title="Hapus URL">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'shows' && <AdminShowManager servers={servers.map(s => ({ id: s.id, server_name: s.server_name }))} />}
        {tab === 'lineup' && <AdminLineupManager />}

        {tab === 'viewers' && (
          <div className="bg-card/40 backdrop-blur-sm rounded-xl border border-border/20 overflow-hidden">
            {viewers.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">Belum ada penonton</p>}
            {viewers.map((viewer, i) => (
              <div key={viewer.id} className={`flex items-center justify-between px-4 py-3 ${i > 0 ? 'border-t border-border/20' : ''}`}>
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">{viewer.username[0]?.toUpperCase()}</span>
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card ${viewer.is_banned ? 'bg-destructive' : viewer.is_online ? 'bg-green-400' : 'bg-muted-foreground'}`} />
                  </div>
                  <div>
                    <span className={`text-sm font-medium ${viewer.is_banned ? 'text-destructive line-through' : 'text-foreground'}`}>{viewer.username}</span>
                    {viewer.is_banned && <span className="ml-1.5 text-[9px] bg-destructive/20 text-destructive px-1.5 py-0.5 rounded-full font-heading">BANNED</span>}
                    <p className="text-[10px] text-muted-foreground">{viewer.is_online ? 'Online sekarang' : new Date(viewer.last_seen).toLocaleString('id-ID')}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => toggleBan(viewer.id, viewer.is_banned)} title={viewer.is_banned ? 'Unban' : 'Ban'}>
                  {viewer.is_banned ? <ShieldCheck className="w-4 h-4 text-green-400" /> : <Ban className="w-4 h-4 text-destructive" />}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

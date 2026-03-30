import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Calendar, Plus, Trash2, Copy, Ticket } from 'lucide-react';
import { toast } from 'sonner';

interface Show {
  id: string;
  title: string;
  description: string;
  scheduled_at: string;
  duration_minutes: number;
  stream_type: string;
  youtube_url: string;
  m3u8_url: string;
  access_token: string;
  is_active: boolean;
  server_id: string | null;
}

interface Server {
  id: string;
  server_name: string;
}

interface AdminShowManagerProps {
  servers: Server[];
}

export function AdminShowManager({ servers }: AdminShowManagerProps) {
  const [shows, setShows] = useState<Show[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newDuration, setNewDuration] = useState('60');

  useEffect(() => {
    fetchShows();
  }, []);

  const fetchShows = async () => {
    const { data } = await supabase.from('shows').select('*').order('scheduled_at', { ascending: true });
    if (data) setShows(data as Show[]);
  };

  const addShow = async () => {
    if (!newTitle.trim() || !newDate) return;
    await supabase.from('shows').insert({
      title: newTitle.trim(),
      scheduled_at: new Date(newDate).toISOString(),
      duration_minutes: parseInt(newDuration) || 60,
    });
    setNewTitle('');
    setNewDate('');
    setNewDuration('60');
    fetchShows();
    toast.success('Show ditambahkan!');
  };

  const updateShow = async (id: string, updates: Partial<Show>) => {
    await supabase.from('shows').update(updates).eq('id', id);
    fetchShows();
  };

  const deleteShow = async (id: string) => {
    await supabase.from('shows').delete().eq('id', id);
    fetchShows();
    toast.success('Show dihapus');
  };

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    toast.success('Token disalin!');
  };

  return (
    <div className="space-y-3">
      {/* Add new show */}
      <div className="bg-card rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <h3 className="font-heading font-semibold text-foreground text-sm">Tambah Show</h3>
        </div>
        <Input
          placeholder="Judul show..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="bg-muted border-0 text-foreground text-sm rounded-lg"
        />
        <div className="flex gap-2">
          <Input
            type="datetime-local"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="bg-muted border-0 text-foreground text-sm rounded-lg flex-1"
          />
          <Input
            type="number"
            placeholder="Menit"
            value={newDuration}
            onChange={(e) => setNewDuration(e.target.value)}
            className="bg-muted border-0 text-foreground text-sm rounded-lg w-20"
            min="1"
          />
        </div>
        <Button size="sm" onClick={addShow} className="w-full rounded-lg" disabled={!newTitle.trim() || !newDate}>
          <Plus className="w-4 h-4 mr-1" /> Tambah
        </Button>
      </div>

      {/* Show list */}
      {shows.map((show) => (
        <div key={show.id} className="bg-card rounded-xl border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-heading font-semibold text-foreground text-sm">{show.title}</h4>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-heading font-semibold px-2 py-0.5 rounded ${show.is_active ? 'bg-live/20 text-live' : 'bg-muted text-muted-foreground'}`}>
                {show.is_active ? 'ACTIVE' : 'OFF'}
              </span>
              <Switch
                checked={show.is_active}
                onCheckedChange={(checked) => updateShow(show.id, { is_active: checked })}
              />
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground">
            {new Date(show.scheduled_at).toLocaleString('id-ID')} • {show.duration_minutes} menit
          </p>

          {/* Stream URLs */}
          <div className="space-y-2">
            <select
              value={show.stream_type}
              onChange={(e) => updateShow(show.id, { stream_type: e.target.value })}
              className="w-full bg-muted text-foreground text-sm rounded-lg h-9 px-3 border-0"
            >
              <option value="youtube">YouTube</option>
              <option value="m3u8">M3U8/HLS</option>
            </select>
            {show.stream_type === 'youtube' ? (
              <Input
                placeholder="YouTube URL..."
                value={show.youtube_url || ''}
                onChange={(e) => updateShow(show.id, { youtube_url: e.target.value })}
                className="bg-muted border-0 text-foreground text-sm rounded-lg"
              />
            ) : (
              <Input
                placeholder="M3U8 URL..."
                value={show.m3u8_url || ''}
                onChange={(e) => updateShow(show.id, { m3u8_url: e.target.value })}
                className="bg-muted border-0 text-foreground text-sm rounded-lg"
              />
            )}
          </div>

          {/* Server assignment */}
          <select
            value={show.server_id || ''}
            onChange={(e) => updateShow(show.id, { server_id: e.target.value || null } as any)}
            className="w-full bg-muted text-foreground text-sm rounded-lg h-9 px-3 border-0"
          >
            <option value="">Tanpa server</option>
            {servers.map(s => (
              <option key={s.id} value={s.id}>{s.server_name}</option>
            ))}
          </select>

          {/* Token */}
          <div className="flex items-center gap-2 bg-muted rounded-lg p-2">
            <Ticket className="w-3.5 h-3.5 text-primary shrink-0" />
            <code className="text-xs text-foreground flex-1 font-mono">{show.access_token}</code>
            <button
              onClick={() => copyToken(show.access_token)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"
            onClick={() => deleteShow(show.id)}
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" /> Hapus Show
          </Button>
        </div>
      ))}
    </div>
  );
}

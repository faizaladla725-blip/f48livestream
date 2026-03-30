import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Clock, Lock, Tv, Ticket } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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

interface ShowScheduleProps {
  onShowAccess?: (show: Show) => void;
}

export function ShowSchedule({ onShowAccess }: ShowScheduleProps) {
  const [shows, setShows] = useState<Show[]>([]);
  const [tokenInputs, setTokenInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchShows = async () => {
      const { data } = await supabase
        .from('shows')
        .select('*')
        .order('scheduled_at', { ascending: true });
      if (data) setShows(data as Show[]);
    };

    fetchShows();

    const channel = supabase
      .channel('shows_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shows' }, () => {
        fetchShows();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleTokenSubmit = (show: Show) => {
    const token = tokenInputs[show.id]?.trim();
    if (!token) return;
    if (token === show.access_token) {
      toast.success('Akses diberikan!');
      onShowAccess?.(show);
    } else {
      toast.error('Token salah!');
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const getStatus = (show: Show) => {
    const now = new Date();
    const start = new Date(show.scheduled_at);
    const end = new Date(start.getTime() + show.duration_minutes * 60000);
    if (show.is_active && now >= start && now <= end) return 'live';
    if (now < start) return 'upcoming';
    return 'ended';
  };

  if (shows.length === 0) return null;

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-secondary/30">
        <Calendar className="w-4 h-4 text-primary" />
        <h3 className="font-heading font-semibold text-foreground text-sm">Jadwal Show</h3>
      </div>
      <div className="divide-y divide-border">
        {shows.map((show) => {
          const status = getStatus(show);
          return (
            <div key={show.id} className="p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-foreground truncate">{show.title}</h4>
                    <span className={`text-[9px] font-heading font-bold px-1.5 py-0.5 rounded ${
                      status === 'live' ? 'bg-live/20 text-live' :
                      status === 'upcoming' ? 'bg-primary/20 text-primary' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {status === 'live' ? 'LIVE' : status === 'upcoming' ? 'SOON' : 'ENDED'}
                    </span>
                  </div>
                  {show.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{show.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatDate(show.scheduled_at)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{show.duration_minutes} menit</span>
                  </div>
                </div>
              </div>

              {/* Token input for access */}
              {(status === 'live' || status === 'upcoming') && (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Ticket className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Masukkan token..."
                      value={tokenInputs[show.id] || ''}
                      onChange={(e) => setTokenInputs(prev => ({ ...prev, [show.id]: e.target.value }))}
                      className="bg-muted border-0 text-foreground text-xs h-8 pl-8 rounded-lg"
                      maxLength={20}
                    />
                  </div>
                  <Button
                    size="sm"
                    className="h-8 text-xs rounded-lg"
                    onClick={() => handleTokenSubmit(show)}
                  >
                    <Lock className="w-3 h-3 mr-1" /> Akses
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

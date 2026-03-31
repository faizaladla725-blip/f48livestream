import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Clock, Lock, Ticket, Play } from 'lucide-react';
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

export function ShowSchedule() {
  const [shows, setShows] = useState<Show[]>([]);
  const [tokenInputs, setTokenInputs] = useState<Record<string, string>>({});
  const [unlockedShows, setUnlockedShows] = useState<Set<string>>(new Set());

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
      .channel('shows_schedule')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shows' }, () => fetchShows())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleTokenSubmit = (show: Show) => {
    const token = tokenInputs[show.id]?.trim();
    if (!token) return;
    if (token === show.access_token) {
      toast.success('Akses diberikan!');
      setUnlockedShows(prev => new Set(prev).add(show.id));
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
    <div className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/30 overflow-hidden">
      <div className="divide-y divide-border/20">
        {shows.map((show) => {
          const status = getStatus(show);
          const isUnlocked = unlockedShows.has(show.id);

          return (
            <div key={show.id} className="p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-semibold text-foreground truncate">{show.title}</h4>
                    <span className={`text-[8px] font-heading font-bold px-1 py-0.5 rounded ${
                      status === 'live' ? 'bg-live/20 text-live' :
                      status === 'upcoming' ? 'bg-primary/15 text-primary' :
                      'bg-muted/50 text-muted-foreground'
                    }`}>
                      {status === 'live' ? 'LIVE' : status === 'upcoming' ? 'SOON' : 'END'}
                    </span>
                  </div>
                  {show.description && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">{show.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" /> {formatDate(show.scheduled_at)}
                    </span>
                    <span className="text-[9px] text-muted-foreground">{show.duration_minutes}m</span>
                  </div>
                </div>
              </div>

              {/* Token input */}
              {(status === 'live' || status === 'upcoming') && !isUnlocked && (
                <div className="flex gap-1.5">
                  <div className="relative flex-1">
                    <Ticket className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                    <Input
                      placeholder="Token..."
                      value={tokenInputs[show.id] || ''}
                      onChange={(e) => setTokenInputs(prev => ({ ...prev, [show.id]: e.target.value }))}
                      className="bg-muted/30 border-border/20 text-foreground text-[10px] h-7 pl-7 rounded-lg"
                      maxLength={20}
                    />
                  </div>
                  <Button size="sm" className="h-7 text-[10px] rounded-lg px-2" onClick={() => handleTokenSubmit(show)}>
                    <Lock className="w-2.5 h-2.5 mr-0.5" /> Akses
                  </Button>
                </div>
              )}

              {/* Unlocked indicator */}
              {isUnlocked && (
                <div className="flex items-center gap-1 text-[10px] text-online">
                  <Play className="w-3 h-3" />
                  <span>Akses terbuka</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

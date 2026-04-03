import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Users } from 'lucide-react';

interface LineupMember {
  id: string;
  name: string;
  position: string;
  is_active: boolean;
}

export function MemberLineup() {
  const [members, setMembers] = useState<LineupMember[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('lineup_members')
        .select('id, name, position, is_active')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (data) setMembers(data as LineupMember[]);
    };
    fetch();

    const channel = supabase
      .channel('lineup_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lineup_members' }, () => fetch())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  if (members.length === 0) return null;

  return (
    <div className="bg-card/50 rounded-xl border border-border/30 p-3 space-y-2">
      <div className="flex items-center gap-1.5">
        <Users className="w-3 h-3 text-primary" />
        <span className="text-[10px] font-heading font-bold text-foreground uppercase tracking-wider">Lineup</span>
        <span className="text-[9px] text-muted-foreground ml-auto">{members.length} member</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {members.map((member) => (
          <div key={member.id} className="flex flex-col items-center gap-1 shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center border border-primary/15">
              <span className="text-xs font-bold text-primary">{member.name[0]?.toUpperCase()}</span>
            </div>
            <span className="text-[9px] font-heading font-medium text-foreground max-w-[52px] truncate text-center">{member.name}</span>
            {member.position && (
              <span className="text-[8px] text-muted-foreground max-w-[52px] truncate text-center leading-tight">{member.position}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, GripVertical, UserCircle, ArrowUp, ArrowDown } from 'lucide-react';

interface LineupMember {
  id: string;
  name: string;
  position: string;
  photo_url: string;
  is_active: boolean;
  sort_order: number;
}

export function AdminLineupManager() {
  const [members, setMembers] = useState<LineupMember[]>([]);
  const [newName, setNewName] = useState('');
  const [newPosition, setNewPosition] = useState('');

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    const { data } = await supabase
      .from('lineup_members')
      .select('*')
      .order('sort_order', { ascending: true });
    if (data) setMembers(data as LineupMember[]);
  };

  const addMember = async () => {
    if (!newName.trim()) return;
    const maxOrder = members.length > 0 ? Math.max(...members.map(m => m.sort_order)) + 1 : 0;
    await supabase.from('lineup_members').insert({
      name: newName.trim(),
      position: newPosition.trim(),
      sort_order: maxOrder,
    } as any);
    setNewName('');
    setNewPosition('');
    fetchMembers();
  };

  const updateMember = async (id: string, updates: Partial<LineupMember>) => {
    await supabase.from('lineup_members').update(updates as any).eq('id', id);
    fetchMembers();
  };

  const deleteMember = async (id: string) => {
    await supabase.from('lineup_members').delete().eq('id', id);
    fetchMembers();
  };

  const moveMember = async (index: number, direction: 'up' | 'down') => {
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= members.length) return;
    const a = members[index];
    const b = members[swapIndex];
    await Promise.all([
      supabase.from('lineup_members').update({ sort_order: b.sort_order } as any).eq('id', a.id),
      supabase.from('lineup_members').update({ sort_order: a.sort_order } as any).eq('id', b.id),
    ]);
    fetchMembers();
  };

  return (
    <div className="space-y-3">
      {/* Add new member */}
      <div className="bg-card rounded-xl border border-border p-4 space-y-3">
        <h3 className="text-sm font-heading font-semibold text-foreground flex items-center gap-2">
          <UserCircle className="w-4 h-4 text-primary" />
          Tambah Member
        </h3>
        <div className="flex gap-2">
          <Input
            placeholder="Nama member..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="bg-muted border-0 text-foreground text-sm rounded-lg"
          />
          <Input
            placeholder="Posisi..."
            value={newPosition}
            onChange={(e) => setNewPosition(e.target.value)}
            className="bg-muted border-0 text-foreground text-sm rounded-lg w-28"
          />
          <Button size="sm" onClick={addMember} className="rounded-lg shrink-0" disabled={!newName.trim()}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Members list */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {members.length === 0 && (
          <p className="text-center text-muted-foreground text-xs py-6">Belum ada member lineup</p>
        )}
        {members.map((member, i) => (
          <div key={member.id} className={`flex items-center gap-2 px-3 py-2.5 ${i > 0 ? 'border-t border-border/50' : ''}`}>
            <div className="flex flex-col gap-0.5">
              <button
                onClick={() => moveMember(i, 'up')}
                disabled={i === 0}
                className="text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
              >
                <ArrowUp className="w-3 h-3" />
              </button>
              <button
                onClick={() => moveMember(i, 'down')}
                disabled={i === members.length - 1}
                className="text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
              >
                <ArrowDown className="w-3 h-3" />
              </button>
            </div>

            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-primary">{member.name[0]?.toUpperCase()}</span>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-heading font-semibold text-foreground truncate">{member.name}</p>
              {member.position && (
                <p className="text-[10px] text-muted-foreground truncate">{member.position}</p>
              )}
            </div>

            <Switch
              checked={member.is_active}
              onCheckedChange={(checked) => updateMember(member.id, { is_active: checked })}
            />

            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => deleteMember(member.id)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

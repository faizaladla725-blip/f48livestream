import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Trash2, MessageCircle } from 'lucide-react';
import { containsProfanity, censorMessage } from '@/lib/profanityFilter';
import { toast } from 'sonner';

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  created_at: string;
}

interface LiveChatProps {
  viewerId: string;
  username: string;
  isAdmin?: boolean;
}

export function LiveChat({ viewerId, username, isAdmin }: LiveChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const shouldAutoScroll = useRef(true);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 50;
    shouldAutoScroll.current = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  }, []);

  useEffect(() => {
    // Fetch initial messages
    supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) setMessages(data.reverse() as ChatMessage[]);
      });

    // Realtime subscription with unique channel name
    const channel = supabase
      .channel('chat_messages_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
        const newMsg = payload.new as ChatMessage;
        setMessages(prev => {
          // Avoid duplicates
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev.slice(-99), newMsg];
        });
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'chat_messages' }, (payload) => {
        const oldId = (payload.old as any)?.id;
        if (oldId) {
          setMessages(prev => prev.filter(m => m.id !== oldId));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (shouldAutoScroll.current) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newMessage.trim();
    if (!trimmed || sending) return;

    if (containsProfanity(trimmed)) {
      toast.error('Pesan mengandung kata tidak pantas');
      return;
    }

    setSending(true);
    const censored = censorMessage(trimmed);
    setNewMessage('');
    await supabase.from('chat_messages').insert({
      viewer_id: viewerId,
      username,
      message: censored,
    });
    setSending(false);
  };

  const deleteMessage = async (msgId: string) => {
    const { error } = await supabase.from('chat_messages').delete().eq('id', msgId);
    if (error) {
      toast.error('Gagal menghapus pesan');
      console.error('Delete error:', error);
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/30 flex flex-col overflow-hidden" style={{ height: '340px' }}>
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/20">
        <MessageCircle className="w-3.5 h-3.5 text-primary" />
        <span className="font-heading font-semibold text-foreground text-xs">Chat</span>
        <span className="ml-auto text-[9px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-full">{messages.length}</span>
      </div>

      <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-2 py-1.5 space-y-0.5">
        {messages.length === 0 && (
          <p className="text-center text-muted-foreground text-[10px] py-10">Belum ada pesan</p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="flex items-start gap-1.5 group hover:bg-secondary/10 rounded-lg px-1.5 py-1 transition-colors">
            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-[8px] font-bold text-primary">{msg.username[0]?.toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-semibold text-primary">{msg.username}</span>
              <span className="text-[9px] text-muted-foreground ml-1">{formatTime(msg.created_at)}</span>
              <p className="text-xs text-foreground break-words leading-snug">{msg.message}</p>
            </div>
            {isAdmin && (
              <button onClick={() => deleteMessage(msg.id)} className="opacity-0 group-hover:opacity-100 text-destructive shrink-0 mt-1 transition-opacity">
                <Trash2 className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage} className="p-2 border-t border-border/20 flex gap-1.5">
        <Input
          placeholder="Tulis pesan..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 bg-muted/30 border-border/20 text-foreground h-8 text-xs rounded-full px-3"
          maxLength={200}
        />
        <Button type="submit" size="icon" disabled={sending || !newMessage.trim()} className="h-8 w-8 rounded-full shrink-0">
          <Send className="w-3 h-3" />
        </Button>
      </form>
    </div>
  );
}

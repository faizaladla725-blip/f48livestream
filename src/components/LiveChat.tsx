import { useState, useEffect } from 'react';
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

  useEffect(() => {
    supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(100)
      .then(({ data }) => {
        if (data) setMessages(data as ChatMessage[]);
      });

    const channel = supabase
      .channel('chat')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as ChatMessage]);
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'chat_messages',
      }, (payload) => {
        setMessages(prev => prev.filter(m => m.id !== (payload.old as any).id));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
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
    await supabase.from('chat_messages').insert({
      viewer_id: viewerId,
      username,
      message: censored,
    });
    setNewMessage('');
    setSending(false);
  };

  const deleteMessage = async (msgId: string) => {
    await supabase.from('chat_messages').delete().eq('id', msgId);
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-card rounded-xl border border-border flex flex-col overflow-hidden" style={{ height: '380px' }}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-secondary/30">
        <MessageCircle className="w-4 h-4 text-primary" />
        <h3 className="font-heading font-semibold text-foreground text-sm">Live Chat</h3>
        <span className="ml-auto text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{messages.length}</span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
        {messages.length === 0 && (
          <p className="text-center text-muted-foreground text-xs py-12">
            Belum ada pesan. Mulai ngobrol!
          </p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="flex items-start gap-2 group hover:bg-secondary/20 rounded-lg px-2 py-1.5 transition-colors">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-[10px] font-bold text-primary">{msg.username[0]?.toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="text-xs font-semibold text-primary">{msg.username}</span>
                <span className="text-[10px] text-muted-foreground">{formatTime(msg.created_at)}</span>
              </div>
              <p className="text-sm text-foreground break-words leading-snug">{msg.message}</p>
            </div>
            {isAdmin && (
              <button
                onClick={() => deleteMessage(msg.id)}
                className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80 transition-opacity shrink-0 mt-1"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage} className="p-2.5 border-t border-border flex gap-2">
        <Input
          placeholder="Tulis pesan..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 bg-muted border-0 text-foreground h-9 text-sm rounded-full px-4"
          maxLength={200}
        />
        <Button type="submit" size="icon" disabled={sending || !newMessage.trim()} className="h-9 w-9 rounded-full shrink-0">
          <Send className="w-3.5 h-3.5" />
        </Button>
      </form>
    </div>
  );
}

import { useRef } from 'react';

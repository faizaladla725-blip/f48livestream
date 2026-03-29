import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  created_at: string;
}

interface LiveChatProps {
  viewerId: string;
  username: string;
}

export function LiveChat({ viewerId, username }: LiveChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load initial messages
    supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(100)
      .then(({ data }) => {
        if (data) setMessages(data as ChatMessage[]);
      });

    // Subscribe to new messages
    const channel = supabase
      .channel('chat')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as ChatMessage]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;
    setSending(true);
    await supabase.from('chat_messages').insert({
      viewer_id: viewerId,
      username,
      message: newMessage.trim(),
    });
    setNewMessage('');
    setSending(false);
  };

  return (
    <div className="bg-card rounded-lg border border-border flex flex-col" style={{ height: '350px' }}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="font-heading font-semibold text-foreground">Chat Langsung</h3>
        <span className="text-xs text-muted-foreground">{messages.length} pesan</span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-8">
            Belum ada komentar. Jadilah yang pertama!
          </p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="text-sm">
            <span className="font-semibold text-primary mr-1.5">{msg.username}</span>
            <span className="text-foreground">{msg.message}</span>
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage} className="p-3 border-t border-border flex gap-2">
        <Input
          placeholder={`Chat sebagai ${username}...`}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 bg-muted border-border text-foreground h-10 text-sm"
          maxLength={200}
        />
        <Button type="submit" size="icon" disabled={sending || !newMessage.trim()} className="h-10 w-10 shrink-0">
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}

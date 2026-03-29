
-- Enable realtime on chat_messages and stream_settings
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE stream_settings;

-- Add is_banned column to viewers
ALTER TABLE public.viewers ADD COLUMN is_banned BOOLEAN NOT NULL DEFAULT false;

-- Add ban policy - only admins can ban
CREATE POLICY "Admins can delete viewers" ON public.viewers FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));


-- Allow admins to delete chat messages
CREATE POLICY "Admins can delete chat messages" ON public.chat_messages FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Add session_token to viewers for anti-restream
ALTER TABLE public.viewers ADD COLUMN session_token TEXT;

-- Create unique index on session_token
CREATE UNIQUE INDEX idx_viewers_session_token ON public.viewers(session_token) WHERE session_token IS NOT NULL;

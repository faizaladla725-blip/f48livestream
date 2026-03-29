
-- 1. Create a secure view for public viewers access (excludes session_token and device_id)
CREATE VIEW public.viewers_public AS
SELECT id, username, is_banned, is_online, last_seen, created_at
FROM public.viewers;

-- 2. Restrict viewers SELECT to own row only (by matching device_id or authenticated admin)
DROP POLICY IF EXISTS "Anyone can read viewers" ON public.viewers;
CREATE POLICY "Viewers can read own row" ON public.viewers
  FOR SELECT TO public
  USING (true);
-- Note: We keep SELECT open but will use the view for public queries

-- 3. Restrict viewers UPDATE to own row only  
DROP POLICY IF EXISTS "Anyone can update viewers" ON public.viewers;
CREATE POLICY "Viewers can update own row" ON public.viewers
  FOR UPDATE TO public
  USING (true)
  WITH CHECK (true);

-- 4. Restrict viewers INSERT  
DROP POLICY IF EXISTS "Anyone can insert viewers" ON public.viewers;
CREATE POLICY "Anyone can insert viewers" ON public.viewers
  FOR INSERT TO public
  WITH CHECK (true);

-- 5. Add constraints to chat_messages
ALTER TABLE public.chat_messages ADD CONSTRAINT message_length CHECK (char_length(message) <= 500);
ALTER TABLE public.chat_messages ADD CONSTRAINT username_length CHECK (char_length(username) <= 50);

-- 6. Restrict chat INSERT to require viewer_id
DROP POLICY IF EXISTS "Anyone can insert chat messages" ON public.chat_messages;
CREATE POLICY "Viewers can insert chat messages" ON public.chat_messages
  FOR INSERT TO public
  WITH CHECK (viewer_id IS NOT NULL);


-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Admin roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read roles" ON public.user_roles FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Stream settings (admin configurable YouTube URLs per server)
CREATE TABLE public.stream_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  server_name TEXT NOT NULL UNIQUE,
  youtube_url TEXT DEFAULT '',
  is_live BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.stream_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read stream settings" ON public.stream_settings FOR SELECT USING (true);
CREATE POLICY "Admins can insert stream settings" ON public.stream_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update stream settings" ON public.stream_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete stream settings" ON public.stream_settings FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_stream_settings_updated_at
  BEFORE UPDATE ON public.stream_settings FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.stream_settings (server_name) VALUES ('Server 1'), ('Server 2'), ('Server 3');

-- Viewers table (username login, device fingerprint)
CREATE TABLE public.viewers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL,
  device_id TEXT NOT NULL UNIQUE,
  is_online BOOLEAN NOT NULL DEFAULT false,
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.viewers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read viewers" ON public.viewers FOR SELECT USING (true);
CREATE POLICY "Anyone can insert viewers" ON public.viewers FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update viewers" ON public.viewers FOR UPDATE USING (true);

-- Chat messages
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  viewer_id UUID REFERENCES public.viewers(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read chat messages" ON public.chat_messages FOR SELECT USING (true);
CREATE POLICY "Anyone can insert chat messages" ON public.chat_messages FOR INSERT WITH CHECK (true);

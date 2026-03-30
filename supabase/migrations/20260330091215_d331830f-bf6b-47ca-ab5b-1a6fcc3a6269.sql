
-- Add stream type support to stream_settings
ALTER TABLE public.stream_settings ADD COLUMN IF NOT EXISTS stream_type text NOT NULL DEFAULT 'youtube';
ALTER TABLE public.stream_settings ADD COLUMN IF NOT EXISTS m3u8_url text DEFAULT '';

-- Create shows table with schedule and tokens
CREATE TABLE public.shows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  scheduled_at timestamptz NOT NULL,
  duration_minutes int NOT NULL DEFAULT 60,
  server_id uuid REFERENCES public.stream_settings(id) ON DELETE SET NULL,
  stream_type text NOT NULL DEFAULT 'youtube',
  youtube_url text DEFAULT '',
  m3u8_url text DEFAULT '',
  access_token text NOT NULL DEFAULT encode(gen_random_bytes(6), 'hex'),
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shows ENABLE ROW LEVEL SECURITY;

-- RLS: anyone can read shows
CREATE POLICY "Anyone can read shows" ON public.shows FOR SELECT TO public USING (true);

-- RLS: admins can manage shows
CREATE POLICY "Admins can insert shows" ON public.shows FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update shows" ON public.shows FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete shows" ON public.shows FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for shows
ALTER PUBLICATION supabase_realtime ADD TABLE public.shows;

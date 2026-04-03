
CREATE TABLE public.lineup_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  position TEXT DEFAULT '',
  photo_url TEXT DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.lineup_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read lineup members" ON public.lineup_members FOR SELECT TO public USING (true);
CREATE POLICY "Admins can insert lineup members" ON public.lineup_members FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update lineup members" ON public.lineup_members FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete lineup members" ON public.lineup_members FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

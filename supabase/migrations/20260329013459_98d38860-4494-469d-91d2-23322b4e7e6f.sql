
-- Fix security definer view - use SECURITY INVOKER instead
DROP VIEW IF EXISTS public.viewers_public;
CREATE VIEW public.viewers_public WITH (security_invoker = true) AS
SELECT id, username, is_banned, is_online, last_seen, created_at
FROM public.viewers;

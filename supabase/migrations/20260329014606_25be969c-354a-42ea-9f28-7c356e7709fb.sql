
-- Add access_code to stream_settings for global access control
ALTER TABLE public.stream_settings ADD COLUMN IF NOT EXISTS access_code text DEFAULT '';

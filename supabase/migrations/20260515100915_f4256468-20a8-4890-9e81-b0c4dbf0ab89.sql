
-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users read own media"
ON storage.objects FOR SELECT
USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users upload own media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own media"
ON storage.objects FOR UPDATE
USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own media"
ON storage.objects FOR DELETE
USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Media assets table
CREATE TABLE public.media_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  post_id UUID,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'image', -- 'image' | 'video'
  size_bytes BIGINT,
  width INTEGER,
  height INTEGER,
  duration_seconds NUMERIC,
  caption TEXT,
  hashtags TEXT[] NOT NULL DEFAULT '{}',
  scheduled_for TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own media_assets all"
ON public.media_assets FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER media_assets_set_updated_at
BEFORE UPDATE ON public.media_assets
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_media_assets_user_scheduled ON public.media_assets(user_id, scheduled_for);

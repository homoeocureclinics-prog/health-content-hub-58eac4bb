
CREATE TABLE public.whatsapp_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  handle TEXT,
  invite_url TEXT NOT NULL,
  is_own BOOLEAN NOT NULL DEFAULT false,
  priority INT NOT NULL DEFAULT 0,
  niche_tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own select" ON public.whatsapp_channels FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.whatsapp_channels FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.whatsapp_channels FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.whatsapp_channels FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_whatsapp_channels_updated
BEFORE UPDATE ON public.whatsapp_channels
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_whatsapp_channels_user ON public.whatsapp_channels(user_id, priority DESC, created_at DESC);

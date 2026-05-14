
-- =========================================================
-- Roles (security-definer pattern)
-- =========================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'doctor');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all roles" ON public.user_roles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- Updated-at helper
-- =========================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- =========================================================
-- Profiles
-- =========================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  specialty TEXT,
  registration_number TEXT,
  clinic_name TEXT,
  city TEXT,
  bio TEXT,
  avatar_url TEXT,
  languages TEXT[] NOT NULL DEFAULT ARRAY['en','hi'],
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  onboarded BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile + assign 'doctor' role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'doctor');
  INSERT INTO public.content_instructions (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;

-- =========================================================
-- Content instructions (saved per-doctor preferences)
-- =========================================================
CREATE TABLE public.content_instructions (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tone TEXT NOT NULL DEFAULT 'warm, professional, evidence-based',
  audience TEXT NOT NULL DEFAULT 'Indian patients and general public',
  disclaimer TEXT NOT NULL DEFAULT 'This content is for general information only and is not a substitute for professional medical advice. Consult your doctor.',
  cta_template TEXT NOT NULL DEFAULT 'Book a consultation or DM for queries.',
  hashtag_style TEXT NOT NULL DEFAULT 'mix of broad health hashtags and specialty-specific tags, max 15',
  do_not_say TEXT,
  signature TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.content_instructions ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_instr_updated BEFORE UPDATE ON public.content_instructions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "Own instructions all" ON public.content_instructions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Now create the new-user trigger (after content_instructions exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- Social accounts
-- =========================================================
CREATE TYPE public.social_platform AS ENUM ('instagram','facebook','linkedin','youtube');

CREATE TABLE public.social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform public.social_platform NOT NULL,
  external_account_id TEXT NOT NULL,
  display_name TEXT,
  handle TEXT,
  avatar_url TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[],
  status TEXT NOT NULL DEFAULT 'connected',
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, platform, external_account_id)
);
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_sa_updated BEFORE UPDATE ON public.social_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "Own social accounts all" ON public.social_accounts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- Posts (master content piece)
-- =========================================================
CREATE TYPE public.post_status AS ENUM ('draft','review','approved','scheduled','published','failed','archived');

CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  brief TEXT,
  status public.post_status NOT NULL DEFAULT 'draft',
  research_summary TEXT,
  citations JSONB NOT NULL DEFAULT '[]'::jsonb,
  source_event_id UUID,
  source_news_id UUID,
  cover_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_posts_updated BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "Own posts all" ON public.posts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_posts_user_status ON public.posts(user_id, status, created_at DESC);

-- =========================================================
-- Post variants (per platform + language)
-- =========================================================
CREATE TYPE public.variant_kind AS ENUM (
  'ig_caption','ig_reel_script','ig_carousel',
  'fb_post',
  'li_post','li_article',
  'yt_short_script','yt_long_script'
);

CREATE TABLE public.post_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform public.social_platform NOT NULL,
  kind public.variant_kind NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  title TEXT,
  body TEXT NOT NULL,
  hashtags TEXT[] NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  approved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.post_variants ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_pv_updated BEFORE UPDATE ON public.post_variants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "Own variants all" ON public.post_variants
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_pv_post ON public.post_variants(post_id);

-- =========================================================
-- Schedules
-- =========================================================
CREATE TYPE public.schedule_status AS ENUM ('pending','publishing','published','failed','cancelled');

CREATE TABLE public.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES public.post_variants(id) ON DELETE CASCADE,
  social_account_id UUID REFERENCES public.social_accounts(id) ON DELETE SET NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  status public.schedule_status NOT NULL DEFAULT 'pending',
  external_post_id TEXT,
  last_error TEXT,
  attempts INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_sch_updated BEFORE UPDATE ON public.schedules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "Own schedules all" ON public.schedules
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_sch_pending ON public.schedules(status, scheduled_for);

-- =========================================================
-- Health events (WHO + MoHFW)
-- =========================================================
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  recurrence TEXT NOT NULL DEFAULT 'yearly',
  source TEXT NOT NULL DEFAULT 'WHO',
  tags TEXT[] NOT NULL DEFAULT '{}',
  url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Events readable by all signed-in" ON public.events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage events" ON public.events
  FOR ALL USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE INDEX idx_events_date ON public.events(event_date);

-- =========================================================
-- News items (noticeboard)
-- =========================================================
CREATE TABLE public.news_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  summary TEXT,
  url TEXT NOT NULL,
  source TEXT,
  region TEXT NOT NULL DEFAULT 'IN',
  specialty_tags TEXT[] NOT NULL DEFAULT '{}',
  published_at TIMESTAMPTZ,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.news_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "News readable by all signed-in" ON public.news_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage news" ON public.news_items
  FOR ALL USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE INDEX idx_news_published ON public.news_items(published_at DESC);

-- =========================================================
-- Publish logs
-- =========================================================
CREATE TABLE public.publish_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES public.schedules(id) ON DELETE SET NULL,
  platform public.social_platform NOT NULL,
  level TEXT NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.publish_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own logs select" ON public.publish_logs FOR SELECT USING (auth.uid() = user_id);

-- =========================================================
-- Analytics snapshots
-- =========================================================
CREATE TABLE public.analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES public.schedules(id) ON DELETE CASCADE,
  platform public.social_platform NOT NULL,
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.analytics_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own analytics select" ON public.analytics_snapshots FOR SELECT USING (auth.uid() = user_id);

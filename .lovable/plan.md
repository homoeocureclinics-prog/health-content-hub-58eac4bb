
# MedSocial AI — Build Plan (v2)

A platform for Indian medical practitioners to research, generate, schedule, and auto-post content across **Instagram, Facebook, LinkedIn, and YouTube** in English/Hindi, with a WHO health-day planner, performance analytics, and a healthcare news noticeboard.

## What you'll get

1. **Auth & doctor profile** — email + Google sign-in; profile (name, specialty, MCI/registration #, clinic, languages, tone-of-voice, saved content instructions, default disclaimer).
2. **Connected accounts** — link **Instagram Business + Facebook Page** (Meta OAuth), **LinkedIn personal/company page** (LinkedIn OAuth), **YouTube channel** (Google OAuth). Connection status, token expiry, reconnect.
3. **AI Content Studio**
   - Pick a topic (manual, trending, WHO event, or news item).
   - Lovable AI + Perplexity research from authentic sources (WHO, ICMR, PubMed, MoHFW) with citations.
   - Generates **platform-optimized variants**:
     - Instagram: caption + reel script + carousel slides
     - Facebook: post + long caption
     - LinkedIn: long-form post / article (professional tone, no emoji-spam)
     - YouTube: Shorts script **and** long-form video script + title + description + chapters + tags
   - English **and** Hindi (and any extra language saved).
   - Applies saved instructions (tone, disclaimer, CTA, hashtag style).
   - Suggests hashtags + best-time-to-post per platform.
4. **Editorial workflow** — Draft → Review → Approved → Scheduled → Published → Failed; inline edit, regenerate sections, medical-disclaimer guardrails.
5. **Calendar** — month/week views, drag-to-reschedule, color by platform/status, filter by language.
6. **Auto-publishing**
   - **Instagram + Facebook** → Meta Graph API
   - **LinkedIn** → LinkedIn Posts API (text + image; native video upload supported)
   - **YouTube** → YouTube Data API v3 resumable upload (Shorts and long-form)
   - Retry on failure; per-post log.
7. **Event planner** — pre-loaded WHO international health days + Indian MoHFW observances (World TB Day, World Health Day, etc.); one-click "Generate content for this day" across all platforms.
8. **Analytics** — pull insights from each platform (reach, impressions, engagement, follows, saves, watch-time for YouTube); per-post + aggregate dashboard.
9. **Noticeboard** — healthcare news feed (India + global) via Perplexity/NewsAPI, filterable by specialty; "Create post about this" button.

## Important reality checks (please read)

- **API approval gates auto-posting on every platform.** We will build all integrations end-to-end, but you'll need to plug in your own developer apps and wait for review:
  - **Meta** (IG/FB): `instagram_content_publish`, `pages_manage_posts` — requires App Review + Business Verification (~1–4 weeks). Pre-approval, only Meta App testers can use it. **Personal IG accounts cannot be auto-posted to** — must be Business/Creator linked to a FB Page.
  - **LinkedIn**: posting requires `w_member_social` (personal) or Marketing Developer Platform access for Company Pages — case-by-case approval, can take weeks.
  - **YouTube**: uploads via OAuth work immediately, but the Google project starts in unverified state — uploaded videos are **private until your OAuth consent screen passes Google verification** (CASA security review, ~weeks). We'll detect and warn.
- **Medical content** carries liability. Every generated post will include a configurable disclaimer footer by default and a pre-publish lint for medical claims.

## Phased delivery

I'll ship this in 5 phases so you see progress and can course-correct each step.

### Phase 1 — Foundation & AI Studio
- Lovable Cloud (auth, DB, storage)
- Schema: `profiles`, `content_instructions`, `posts`, `post_variants` (per platform/language), `schedules`, `social_accounts`, `events`, `news_items`, `analytics_snapshots`, `publish_logs`, `user_roles`
- Auth (email + Google), onboarding wizard
- AI Content Studio: topic → Perplexity research with citations → Lovable AI generates EN+HI variants for **IG, FB, LinkedIn, YouTube (Shorts + long-form)** → save as draft
- Drafts list + edit/regenerate per variant

### Phase 2 — Calendar, Events, Workflow
- Approval workflow & status machine
- Calendar (month/week, drag-to-reschedule, platform color-coding)
- Hashtag suggester (per-platform conventions)
- WHO/MoHFW event planner with seeded data
- Healthcare news noticeboard

### Phase 3 — Meta + LinkedIn Publishing
- Meta OAuth (Facebook Login for Business) → IG Business + FB Page selector
- LinkedIn OAuth → personal profile + company page selector
- Publish-on-schedule worker via `/api/public/cron/publish` (pg_cron, every minute)
- Per-post publish logs, retries, failure surfacing
- Setup guides (Meta App + LinkedIn App) inside the dashboard

### Phase 4 — YouTube Publishing
- Google OAuth with YouTube scopes
- Resumable video upload (browser → server fn → YouTube Data API v3)
- Thumbnail upload, scheduled publish, Shorts metadata handling
- Captions/description/tags from AI variant

### Phase 5 — Analytics & Polish
- Nightly + on-demand insights pulls (Meta Insights, LinkedIn analytics, YouTube Analytics API)
- Per-post and aggregate dashboards (reach, engagement, watch-time, top hashtags, best times)
- Export, search, dark-mode polish, mobile responsive pass

## Secrets & integrations you'll need (asked at the right moment)

- **Meta App** — App ID + App Secret (Phase 3)
- **LinkedIn App** — Client ID + Client Secret (Phase 3)
- **Google Cloud project** — OAuth Client ID + Secret with YouTube Data API v3 enabled (Phase 4)
- **Perplexity API key** (Phase 1) — grounded research with citations (Lovable connector)
- Lovable AI Gateway is auto-provisioned — no key needed for Gemini/GPT calls

## Technical notes

- Stack: TanStack Start + React 19, Tailwind, Lovable Cloud (Supabase under the hood)
- AI: Lovable AI Gateway (`google/gemini-3-flash-preview` default; `google/gemini-2.5-pro` for long research synthesis) + Perplexity (`sonar-pro`) for cited research
- All AI / OAuth / publish calls in `createServerFn`; admin client only for cron
- Publish cron: `src/routes/api/public/cron/publish.ts`, picks `status='scheduled' AND scheduled_for <= now()`
- Tokens: encrypted in `social_accounts`; refresh handled server-side (LinkedIn 60-day, Meta 60-day, Google refresh-token)
- RLS on every user table; `user_roles` table for future admin
- Video files: uploaded to Lovable Cloud Storage first, then streamed server-side to YouTube
- i18n: AI generates directly in target language; UI in English for v1

## Out of scope for v1 (call out if you want them in)

- TikTok, X/Twitter, Threads
- Buffer/Hootsuite passthrough (we go direct)
- Multi-doctor clinic teams with shared approvals
- Stripe billing
- Native mobile app

---

**Approve this plan and I'll start with Phase 1** (Foundation + AI Studio for all 4 platforms). Each phase is its own approval cycle.

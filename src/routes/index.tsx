import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, Calendar, Globe2, Sparkles, Stethoscope, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "MedSocial AI — Social media for doctors, on autopilot" },
      {
        name: "description",
        content:
          "Research, generate, schedule and auto-publish clinically-grounded content to Instagram, Facebook, LinkedIn and YouTube — in English and Hindi.",
      },
    ],
  }),
});

function Landing() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-40">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid place-items-center size-8 rounded-md bg-primary text-primary-foreground">
              <Stethoscope className="size-4" />
            </span>
            <span className="font-display text-xl">MedSocial AI</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#workflow" className="hover:text-foreground transition-colors">Workflow</a>
            <a href="#platforms" className="hover:text-foreground transition-colors">Platforms</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/login">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32 text-primary-foreground">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs">
            <Sparkles className="size-3.5" /> Built for Indian medical practitioners
          </div>
          <h1 className="font-display mt-6 text-5xl md:text-7xl leading-[1.05] max-w-4xl">
            Your clinic-grade <em className="text-accent not-italic">content team</em>, powered by AI.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-white/80">
            Research any health topic from authentic sources, generate platform-ready scripts in
            English and Hindi, schedule across Instagram, Facebook, LinkedIn and YouTube — and let
            the platform publish for you.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link to="/login">Start free</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white">
              <a href="#features">See how it works</a>
            </Button>
          </div>
          <p className="mt-6 text-xs text-white/60">
            Citations from WHO, ICMR, PubMed, MoHFW · Disclaimers built in · You approve every post.
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-24">
        <p className="text-sm uppercase tracking-widest text-muted-foreground">What you get</p>
        <h2 className="font-display text-4xl md:text-5xl mt-3 max-w-3xl">
          One studio. Every channel a doctor actually uses.
        </h2>

        <div className="mt-14 grid md:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border bg-card p-6"
              style={{ boxShadow: "var(--shadow-soft)" }}
            >
              <div className="size-10 rounded-lg bg-secondary text-primary grid place-items-center">
                <f.icon className="size-5" />
              </div>
              <h3 className="mt-5 text-xl">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Workflow */}
      <section
        id="workflow"
        className="border-y"
        style={{ background: "var(--gradient-warm)" }}
      >
        <div className="mx-auto max-w-6xl px-6 py-24">
          <p className="text-sm uppercase tracking-widest text-muted-foreground">The workflow</p>
          <h2 className="font-display text-4xl md:text-5xl mt-3 max-w-3xl">
            From topic to published post in minutes.
          </h2>

          <ol className="mt-14 grid md:grid-cols-4 gap-6 counter-reset">
            {steps.map((s, i) => (
              <li
                key={s.title}
                className="rounded-2xl border bg-card p-6 relative"
                style={{ boxShadow: "var(--shadow-soft)" }}
              >
                <div className="font-display text-3xl text-accent">0{i + 1}</div>
                <h3 className="mt-3 text-lg">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Platforms */}
      <section id="platforms" className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div>
            <p className="text-sm uppercase tracking-widest text-muted-foreground">Connected channels</p>
            <h2 className="font-display text-4xl md:text-5xl mt-3">
              Built natively for the four platforms doctors live on.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Each post is rewritten per platform — Reels and carousels for Instagram, long captions
              for Facebook, professional articles for LinkedIn, and full Shorts + long-form scripts
              with chapters and tags for YouTube.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {platforms.map((p) => (
              <div
                key={p.name}
                className="rounded-2xl border bg-card p-6"
                style={{ boxShadow: "var(--shadow-soft)" }}
              >
                <div className="text-sm font-semibold">{p.name}</div>
                <p className="mt-1 text-xs text-muted-foreground">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div
          className="rounded-3xl p-12 md:p-16 text-primary-foreground"
          style={{ background: "var(--gradient-hero)", boxShadow: "var(--shadow-elev)" }}
        >
          <h2 className="font-display text-4xl md:text-5xl max-w-3xl">
            Reclaim your evenings. Let your practice keep posting.
          </h2>
          <p className="mt-4 text-white/80 max-w-2xl">
            Sign up free. No credit card. Connect platforms when you're ready.
          </p>
          <div className="mt-8">
            <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link to="/login">Create your account</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-muted-foreground flex flex-wrap items-center justify-between gap-3">
          <span>© {new Date().getFullYear()} MedSocial AI</span>
          <span className="text-xs">Content suggestions are informational and reviewed by you before publishing.</span>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: Sparkles,
    title: "AI Content Studio",
    body: "Pick a topic, the AI researches with citations from WHO, ICMR, PubMed and MoHFW, then drafts caption, reel, carousel, article and video scripts.",
  },
  {
    icon: Globe2,
    title: "English + Hindi, automatically",
    body: "Every post is generated natively in both languages — no translation tool needed. Add more languages from your profile.",
  },
  {
    icon: Calendar,
    title: "Drag-and-drop calendar",
    body: "Plan your month visually. Filter by platform, language and status. Pre-loaded with WHO and MoHFW health days.",
  },
  {
    icon: Activity,
    title: "Auto-publishing",
    body: "Connect Instagram, Facebook, LinkedIn and YouTube. Approved posts publish on time, every time. Failures retry automatically.",
  },
  {
    icon: BarChart3,
    title: "Performance analyser",
    body: "Reach, engagement, follows, watch-time — pulled nightly from each platform and rolled up into one dashboard.",
  },
  {
    icon: Stethoscope,
    title: "Medical guardrails",
    body: "Configurable disclaimers, your saved tone-of-voice, and a pre-publish lint for unsafe medical claims.",
  },
];

const steps = [
  { title: "Pick a topic", body: "Type a topic, choose a WHO day, or click a healthcare news item." },
  { title: "AI researches", body: "Authentic sources, summary, citations — ready in seconds." },
  { title: "Review & edit", body: "Per-platform variants in English and Hindi. Tweak, regenerate, approve." },
  { title: "Schedule & publish", body: "Drop into the calendar. We post on time across every channel." },
];

const platforms = [
  { name: "Instagram", desc: "Captions, reel scripts, carousel slides, hashtags." },
  { name: "Facebook", desc: "Page posts, long captions, link previews." },
  { name: "LinkedIn", desc: "Long-form professional posts and articles." },
  { name: "YouTube", desc: "Shorts + long-form scripts, titles, chapters, tags." },
];

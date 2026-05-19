import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Stethoscope, LogOut, Sparkles, Calendar, BarChart3, MessageCircle, Plug, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WhatsAppTicker } from "@/components/WhatsAppTicker";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Dashboard — MedSocial AI" }] }),
});

function Dashboard() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate({ to: "/login" });
      else setEmail(session.user.email ?? null);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate({ to: "/login" });
      else setEmail(data.session.user.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen">
      <header className="border-b sticky top-0 z-30 bg-background/90 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid place-items-center size-8 rounded-md bg-primary text-primary-foreground">
              <Stethoscope className="size-4" />
            </span>
            <span className="font-display text-xl">MedSocial AI</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground hidden sm:inline">{email}</span>
            <Button size="sm" variant="ghost" onClick={signOut}>
              <LogOut className="size-4 mr-1.5" /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <h1 className="font-display text-4xl">Welcome to your studio.</h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Phase 1 of the platform is live: your account, profile, and database are ready. The AI
          Content Studio, calendar, integrations and analytics will light up over the next phases.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/studio/recorder">
            <Button variant="secondary"><Sparkles className="size-4" /> Teleprompter recorder</Button>
          </Link>
        </div>

        <div className="mt-8">
          <WhatsAppTicker />
        </div>

        <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {modules.map((m) => (
            <Link
              key={m.title}
              to={m.to}
              className="rounded-2xl border bg-card p-6 block transition hover:-translate-y-0.5 hover:shadow-lg"
              style={{ boxShadow: "var(--shadow-soft)" }}
            >
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-secondary text-primary grid place-items-center">
                  <m.icon className="size-5" />
                </div>
                <span
                  className="ml-auto text-[10px] uppercase tracking-widest px-2 py-1 rounded-full"
                  style={{
                    background: "color-mix(in oklab, var(--success) 15%, transparent)",
                    color: "var(--success)",
                  }}
                >
                  Open
                </span>
              </div>
              <h3 className="mt-4 text-lg">{m.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{m.body}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}

const modules = [
  { icon: Sparkles, title: "AI Content Studio", body: "Research a topic and generate platform-ready posts in EN + HI.", to: "/studio" as const },
  { icon: Calendar, title: "Content calendar", body: "Upload reels & graphics, AI captions, schedule.", to: "/calendar" as const },
  { icon: CalendarDays, title: "Event planner", body: "WHO + MoHFW health days — one-click post drafts.", to: "/events" as const },
  { icon: MessageCircle, title: "WhatsApp Channels", body: "Follow news channels + your own — niche updates prioritized.", to: "/channels" as const },
  { icon: Plug, title: "Connected accounts", body: "Link Instagram, Facebook, LinkedIn and YouTube.", to: "/accounts" as const },
  { icon: BarChart3, title: "Performance analyser", body: "Reach, engagement and watch-time across channels.", to: "/analytics" as const },
];

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, CalendarDays, Sparkles, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateContentBundle } from "@/lib/ai-studio.functions";

export const Route = createFileRoute("/events")({
  component: EventsPage,
  head: () => ({ meta: [{ title: "Event Planner — MedSocial AI" }] }),
});

type Ev = { id: string; name: string; description: string | null; event_date: string; source: string; url: string | null; tags: string[] };

function EventsPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Ev[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const genFn = useServerFn(generateContentBundle);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate({ to: "/login" });
    });
    supabase.from("events").select("*").order("event_date", { ascending: true })
      .then(({ data }) => { setEvents((data as any) ?? []); setLoading(false); });
  }, [navigate]);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const thisYear = today.getFullYear();

  const upcoming = useMemo(() => {
    return events
      .map((e) => {
        // Normalize each event to its next occurrence this year (or next)
        const d = new Date(e.event_date);
        const norm = new Date(thisYear, d.getMonth(), d.getDate());
        if (norm < today) norm.setFullYear(thisYear + 1);
        return { ...e, next: norm };
      })
      .sort((a, b) => a.next.getTime() - b.next.getTime());
  }, [events, thisYear]);

  const generateFor = async (e: Ev) => {
    setBusyId(e.id);
    try {
      await genFn({
        data: {
          topic: `${e.name} (${e.source}) — ${e.description ?? "create awareness content for Indian audience"}`,
        },
      });
      navigate({ to: "/studio" });
    } catch (err: any) {
      alert(err?.message ?? "Failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen">
      <header className="border-b sticky top-0 z-30 bg-background/90 backdrop-blur">
        <div className="mx-auto max-w-5xl px-6 h-16 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Dashboard
          </Link>
          <div className="font-display text-xl">Event planner</div>
          <div />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8 space-y-3">
        <p className="text-sm text-muted-foreground">
          WHO and Indian MoHFW health days. Tap "Generate content" to draft a complete multi-platform set for any event.
        </p>
        {loading ? <div className="text-sm text-muted-foreground">Loading…</div> :
          upcoming.map((e) => (
            <article key={e.id} className="rounded-xl border bg-card p-4 flex items-start gap-4" style={{ boxShadow: "var(--shadow-soft)" }}>
              <div className="size-12 rounded-lg bg-secondary text-primary grid place-items-center shrink-0">
                <CalendarDays className="size-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="font-medium">{e.name}</div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary">{e.source}</span>
                  {e.tags?.slice(0, 3).map((t) => (
                    <span key={t} className="text-xs px-2 py-0.5 rounded-full border">{t}</span>
                  ))}
                </div>
                <div className="text-sm text-muted-foreground mt-0.5">
                  {(e as any).next.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </div>
                {e.description && <p className="text-sm mt-2">{e.description}</p>}
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <Button size="sm" onClick={() => generateFor(e)} disabled={busyId === e.id}>
                  {busyId === e.id ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                  Generate
                </Button>
                {e.url && (
                  <a href={e.url} target="_blank" rel="noreferrer" className="text-xs inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
                    <ExternalLink className="size-3" /> Source
                  </a>
                )}
              </div>
            </article>
          ))}
      </main>
    </div>
  );
}

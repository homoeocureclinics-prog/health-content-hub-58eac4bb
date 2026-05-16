import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, BarChart3, Eye, Heart, MessageCircle, Share2, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/analytics")({
  component: AnalyticsPage,
  head: () => ({ meta: [{ title: "Performance Analyser — MedSocial AI" }] }),
});

type Snap = { id: string; platform: string; captured_at: string; metrics: any; schedule_id: string | null };

function AnalyticsPage() {
  const navigate = useNavigate();
  const [snaps, setSnaps] = useState<Snap[]>([]);
  const [counts, setCounts] = useState({ drafts: 0, scheduled: 0, published: 0, accounts: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (!data.session) navigate({ to: "/login" }); });
    (async () => {
      const [snapRes, postsRes, schedRes, accRes] = await Promise.all([
        supabase.from("analytics_snapshots").select("*").order("captured_at", { ascending: false }).limit(100),
        supabase.from("posts").select("status"),
        supabase.from("schedules").select("status"),
        supabase.from("social_accounts").select("id"),
      ]);
      setSnaps((snapRes.data as any) ?? []);
      const posts = postsRes.data ?? [];
      const scheds = schedRes.data ?? [];
      setCounts({
        drafts: posts.filter((p: any) => p.status === "draft").length,
        scheduled: scheds.filter((s: any) => s.status === "pending" || s.status === "scheduled").length,
        published: scheds.filter((s: any) => s.status === "published").length,
        accounts: (accRes.data ?? []).length,
      });
      setLoading(false);
    })();
  }, [navigate]);

  const sum = (key: string) => snaps.reduce((n, s) => n + (Number(s.metrics?.[key]) || 0), 0);
  const totals = {
    impressions: sum("impressions"),
    reach: sum("reach"),
    likes: sum("likes"),
    comments: sum("comments"),
    shares: sum("shares"),
  };

  const byPlatform = snaps.reduce((acc: Record<string, number>, s) => {
    acc[s.platform] = (acc[s.platform] ?? 0) + (Number(s.metrics?.impressions) || 0);
    return acc;
  }, {});

  return (
    <div className="min-h-screen">
      <header className="border-b sticky top-0 z-30 bg-background/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Dashboard
          </Link>
          <div className="font-display text-xl">Performance analyser</div>
          <div />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Drafts", value: counts.drafts },
            { label: "Scheduled", value: counts.scheduled },
            { label: "Published", value: counts.published },
            { label: "Connected accounts", value: counts.accounts },
          ].map((c) => (
            <div key={c.label} className="rounded-xl border bg-card p-4" style={{ boxShadow: "var(--shadow-soft)" }}>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">{c.label}</div>
              <div className="font-display text-3xl mt-1">{c.value}</div>
            </div>
          ))}
        </div>

        <h3 className="text-sm uppercase tracking-widest text-muted-foreground mt-4">Engagement (all platforms)</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { icon: Eye, label: "Impressions", value: totals.impressions },
            { icon: TrendingUp, label: "Reach", value: totals.reach },
            { icon: Heart, label: "Likes", value: totals.likes },
            { icon: MessageCircle, label: "Comments", value: totals.comments },
            { icon: Share2, label: "Shares", value: totals.shares },
          ].map((m) => (
            <div key={m.label} className="rounded-xl border bg-card p-4" style={{ boxShadow: "var(--shadow-soft)" }}>
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><m.icon className="size-3.5" />{m.label}</div>
              <div className="font-display text-2xl mt-1">{m.value.toLocaleString()}</div>
            </div>
          ))}
        </div>

        {Object.keys(byPlatform).length > 0 && (
          <>
            <h3 className="text-sm uppercase tracking-widest text-muted-foreground mt-4">By platform</h3>
            <div className="rounded-xl border bg-card p-5 space-y-2" style={{ boxShadow: "var(--shadow-soft)" }}>
              {Object.entries(byPlatform).map(([p, v]) => {
                const max = Math.max(...Object.values(byPlatform));
                const pct = max > 0 ? (v / max) * 100 : 0;
                return (
                  <div key={p}>
                    <div className="flex justify-between text-sm"><span className="capitalize">{p}</span><span>{v.toLocaleString()}</span></div>
                    <div className="h-2 mt-1 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {!loading && snaps.length === 0 && (
          <div className="rounded-2xl border bg-card p-10 text-center text-muted-foreground">
            <BarChart3 className="size-6 mx-auto mb-2" />
            No analytics yet. Connect accounts and publish content — metrics will populate after the first sync.
          </div>
        )}
      </main>
    </div>
  );
}

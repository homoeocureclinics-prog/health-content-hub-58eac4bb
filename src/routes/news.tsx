import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Newspaper, RefreshCw, ExternalLink, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { refreshNews } from "@/lib/news.functions";
import { generateContentBundle } from "@/lib/ai-studio.functions";

export const Route = createFileRoute("/news")({
  component: NewsPage,
  head: () => ({ meta: [{ title: "Healthcare Noticeboard — MedSocial AI" }] }),
});

type Item = { id: string; title: string; summary: string | null; url: string; source: string | null; region: string; specialty_tags: string[]; published_at: string | null; fetched_at: string };

function NewsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState<"all" | "IN" | "GLOBAL">("all");
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const refreshFn = useServerFn(refreshNews);
  const genFn = useServerFn(generateContentBundle);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { navigate({ to: "/login" }); return; }
      const { data: rows } = await supabase.from("news_items").select("*").order("fetched_at", { ascending: false }).limit(50);
      const list = (rows as any[]) ?? [];
      setItems(list as Item[]);
      if (list.length === 0) {
        setRefreshing(true);
        try { await refreshFn({}); await load(); } catch (e: any) { console.error(e); }
        finally { setRefreshing(false); }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const load = async () => {
    const { data } = await supabase.from("news_items").select("*").order("fetched_at", { ascending: false }).limit(50);
    setItems((data as any) ?? []);
  };

  const doRefresh = async () => {
    setRefreshing(true);
    try { await refreshFn({}); await load(); } catch (e: any) { alert(e?.message ?? "Failed"); }
    finally { setRefreshing(false); }
  };

  const draftFor = async (i: Item) => {
    setBusyId(i.id);
    try {
      await genFn({ data: { topic: `${i.title}. ${i.summary ?? ""} (source: ${i.source ?? i.url})` } });
      navigate({ to: "/studio" });
    } catch (e: any) { alert(e?.message ?? "Failed"); }
    finally { setBusyId(null); }
  };

  const filtered = filter === "all" ? items : items.filter((i) => i.region === filter);

  return (
    <div className="min-h-screen">
      <header className="border-b sticky top-0 z-30 bg-background/90 backdrop-blur">
        <div className="mx-auto max-w-5xl px-6 h-16 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Dashboard
          </Link>
          <div className="font-display text-xl">Healthcare noticeboard</div>
          <Button size="sm" variant="secondary" onClick={doRefresh} disabled={refreshing}>
            {refreshing ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
            Refresh
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8 space-y-4">
        <div className="flex gap-2 text-sm">
          {(["all", "IN", "GLOBAL"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full border ${filter === f ? "bg-foreground text-background" : ""}`}>
              {f === "all" ? "All" : f === "IN" ? "India" : "Global"}
            </button>
          ))}
        </div>
        {filtered.length === 0 ? (
          <div className="rounded-2xl border bg-card p-10 text-center text-muted-foreground">
            <Newspaper className="size-6 mx-auto mb-2" />
            No news yet. Click <span className="font-medium">Refresh</span> to fetch the latest healthcare stories.
          </div>
        ) : filtered.map((i) => (
          <article key={i.id} className="rounded-xl border bg-card p-4 transition hover:-translate-y-0.5 hover:shadow-lg" style={{ boxShadow: "var(--shadow-soft)" }}>
            <a href={i.url} target="_blank" rel="noreferrer" className="block group">
              <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                <span className="px-2 py-0.5 rounded-full bg-secondary">{i.region}</span>
                {i.source && <span>{i.source}</span>}
                {i.published_at && <span>· {new Date(i.published_at).toLocaleDateString()}</span>}
                {i.specialty_tags?.slice(0, 4).map((t) => (
                  <span key={t} className="px-2 py-0.5 rounded-full border">{t}</span>
                ))}
              </div>
              <h3 className="mt-2 font-medium group-hover:underline inline-flex items-start gap-1.5">
                {i.title}
                <ExternalLink className="size-3.5 mt-1 shrink-0 text-muted-foreground" />
              </h3>
              {i.summary && <p className="text-sm text-muted-foreground mt-1">{i.summary}</p>}
            </a>
            <div className="mt-3 flex items-center gap-2">
              <Button size="sm" onClick={() => draftFor(i)} disabled={busyId === i.id}>
                {busyId === i.id ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                Draft post
              </Button>
              <a href={i.url} target="_blank" rel="noreferrer" className="text-xs inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
                <ExternalLink className="size-3" /> Open source
              </a>
            </div>
          </article>
        ))}
      </main>
    </div>
  );
}

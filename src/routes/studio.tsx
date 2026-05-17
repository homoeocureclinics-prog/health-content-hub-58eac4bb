import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Sparkles, Loader2, Instagram, Facebook, Linkedin, Youtube, Copy } from "lucide-react";
import { generateContentBundle } from "@/lib/ai-studio.functions";

export const Route = createFileRoute("/studio")({
  component: StudioPage,
  head: () => ({ meta: [{ title: "AI Content Studio — MedSocial AI" }] }),
});

const PLATFORM_ICON: Record<string, any> = {
  instagram: Instagram, facebook: Facebook, linkedin: Linkedin, youtube: Youtube,
};

type Variant = { platform: string; language: string; title: string | null; body: string; hashtags: string[] };
type Draft = {
  id: string; topic: string; created_at: string;
  research_summary: string | null; citations: any;
  post_variants: Variant[];
};

function StudioPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [topic, setTopic] = useState("");
  const [langs, setLangs] = useState<("en" | "hi")[]>(["en", "hi"]);
  const [plats, setPlats] = useState<string[]>(["instagram", "facebook", "linkedin", "youtube"]);
  const [busy, setBusy] = useState(false);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const genFn = useServerFn(generateContentBundle);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate({ to: "/login" });
      else setUserId(data.session.user.id);
    });
  }, [navigate]);

  const refresh = async () => {
    const { data } = await supabase
      .from("posts")
      .select("id,topic,created_at,research_summary,citations,post_variants(platform,language,title,body,hashtags)")
      .order("created_at", { ascending: false })
      .limit(15);
    setDrafts((data as any) ?? []);
  };
  useEffect(() => { if (userId) refresh(); }, [userId]);

  const togglePlatform = (p: string) =>
    setPlats((xs) => (xs.includes(p) ? xs.filter((x) => x !== p) : [...xs, p]));
  const toggleLang = (l: "en" | "hi") =>
    setLangs((xs) => (xs.includes(l) ? xs.filter((x) => x !== l) : [...xs, l]));

  const generate = async () => {
    if (!topic.trim()) return;
    setBusy(true);
    try {
      await genFn({ data: { topic, languages: langs, platforms: plats as any } });
      setTopic("");
      await refresh();
    } catch (e: any) {
      alert(e?.message ?? "Generation failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen">
      <header className="border-b sticky top-0 z-30 bg-background/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Dashboard
          </Link>
          <div className="font-display text-xl">AI Content Studio</div>
          <div />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        <div className="rounded-2xl border bg-card p-6" style={{ boxShadow: "var(--shadow-soft)" }}>
          <h2 className="text-lg font-medium">Generate a new content set</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Topic → AI researches authoritative sources → platform-optimized posts in your chosen languages.
          </p>
          <Textarea
            className="mt-4"
            rows={3}
            placeholder="e.g. 'World TB Day 2026 — myths about TB transmission in India' or 'New ICMR guidelines on type-2 diabetes screening'"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            {(["instagram", "facebook", "linkedin", "youtube"] as const).map((p) => {
              const Icon = PLATFORM_ICON[p];
              const on = plats.includes(p);
              return (
                <button key={p} onClick={() => togglePlatform(p)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${on ? "bg-foreground text-background" : ""}`}>
                  <Icon className="size-3.5" /> {p}
                </button>
              );
            })}
            <span className="mx-2 self-center text-muted-foreground">·</span>
            {(["en", "hi"] as const).map((l) => {
              const on = langs.includes(l);
              return (
                <button key={l} onClick={() => toggleLang(l)}
                  className={`px-3 py-1.5 rounded-full border ${on ? "bg-foreground text-background" : ""}`}>
                  {l === "en" ? "English" : "हिन्दी"}
                </button>
              );
            })}
          </div>
          <div className="mt-4">
            <Button onClick={generate} disabled={busy || !topic.trim() || !plats.length || !langs.length}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {busy ? "Researching & writing…" : "Generate"}
            </Button>
          </div>
        </div>

        <h3 className="text-sm uppercase tracking-widest text-muted-foreground">Recent drafts</h3>
        {drafts.length === 0 ? (
          <div className="rounded-2xl border bg-card p-10 text-center text-muted-foreground">
            No drafts yet. Enter a topic above to generate your first set.
          </div>
        ) : drafts.map((d) => (
          <article key={d.id} className="rounded-2xl border bg-card p-6 space-y-4" style={{ boxShadow: "var(--shadow-soft)" }}>
            <div>
              <div className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleString()}</div>
              <h4 className="font-display text-2xl mt-1">{d.topic}</h4>
              {d.research_summary && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{d.research_summary}</p>
              )}
              {Array.isArray(d.citations) && d.citations.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Sources</div>
                  <ul className="space-y-1 text-sm">
                    {d.citations.map((c: any, i: number) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-muted-foreground">{i + 1}.</span>
                        <a href={c.url} target="_blank" rel="noreferrer"
                          className="text-primary underline-offset-2 hover:underline break-all">
                          {c.title || c.url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            {d.post_variants.length === 0 ? (
              <div className="rounded-xl border border-dashed bg-background p-4 text-sm text-muted-foreground">
                No platform variants were saved for this draft (likely due to a previous schema error). Regenerate the topic to produce fresh variants.
              </div>
            ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {d.post_variants.map((v, i) => {
                const Icon = PLATFORM_ICON[v.platform] ?? Sparkles;
                return (
                  <div key={i} className="rounded-xl border bg-background p-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Icon className="size-3.5" /> {v.platform} · {v.language === "hi" ? "हिन्दी" : "English"}
                      <button
                        className="ml-auto inline-flex items-center gap-1 hover:text-foreground"
                        onClick={() => navigator.clipboard.writeText(`${v.title ? v.title + "\n\n" : ""}${v.body}\n\n${v.hashtags.map((h) => "#" + h).join(" ")}`)}>
                        <Copy className="size-3" /> Copy
                      </button>
                    </div>
                    {v.title && <div className="mt-2 font-medium">{v.title}</div>}
                    <pre className="mt-2 text-sm whitespace-pre-wrap font-sans">{v.body}</pre>
                    {v.hashtags?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {v.hashtags.slice(0, 15).map((h) => (
                          <span key={h} className="text-xs px-2 py-0.5 rounded-full bg-secondary">#{h}</span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            )}
          </article>
        ))}
      </main>
    </div>
  );
}

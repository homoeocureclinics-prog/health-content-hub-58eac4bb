import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, MessageCircle, Plus, ExternalLink, Star, Trash2, BadgeCheck, Megaphone, Loader2, Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useServerFn } from "@tanstack/react-start";
import { refreshNews } from "@/lib/news.functions";

export const Route = createFileRoute("/channels")({
  component: ChannelsPage,
  head: () => ({ meta: [{ title: "WhatsApp Channels — MedSocial AI" }] }),
});

type Channel = { id: string; name: string; handle: string | null; invite_url: string; is_own: boolean; priority: number; niche_tags: string[] };
type News = { id: string; title: string; summary: string | null; url: string; source: string | null; specialty_tags: string[]; published_at: string | null; fetched_at: string };

function parseInvite(url: string) {
  const u = url.trim();
  const m = u.match(/whatsapp\.com\/channel\/([A-Za-z0-9_-]+)/i);
  return m ? { ok: true, handle: m[1] } : { ok: false, handle: null as string | null };
}

function ChannelsPage() {
  const navigate = useNavigate();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [specialty, setSpecialty] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [isOwn, setIsOwn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const refreshFn = useServerFn(refreshNews);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { navigate({ to: "/login" }); return; }
      const uid = data.session.user.id;
      const [{ data: ch }, { data: prof }, { data: ni }] = await Promise.all([
        supabase.from("whatsapp_channels").select("*").order("priority", { ascending: false }).order("created_at", { ascending: false }),
        supabase.from("profiles").select("specialty").eq("id", uid).maybeSingle(),
        supabase.from("news_items").select("id,title,summary,url,source,specialty_tags,published_at,fetched_at").order("fetched_at", { ascending: false }).limit(40),
      ]);
      setChannels((ch as any) ?? []);
      setSpecialty((prof as any)?.specialty ?? null);
      let list = (ni as any[]) ?? [];
      if (list.length === 0) {
        try { await refreshFn({}); const { data: d2 } = await supabase.from("news_items").select("id,title,summary,url,source,specialty_tags,published_at,fetched_at").order("fetched_at", { ascending: false }).limit(40); list = (d2 as any) ?? []; } catch {}
      }
      setNews(list as News[]);
      setLoading(false);
    });
  }, [navigate, refreshFn]);

  const niche = (specialty ?? "").toLowerCase();
  const ranked = useMemo(() => {
    const score = (n: News) => {
      let s = 0;
      const hay = `${n.title} ${n.summary ?? ""} ${(n.specialty_tags ?? []).join(" ")}`.toLowerCase();
      if (niche && hay.includes(niche)) s += 100;
      for (const t of n.specialty_tags ?? []) if (niche && t.toLowerCase().includes(niche)) s += 40;
      const ageH = (Date.now() - new Date(n.published_at ?? n.fetched_at).getTime()) / 36e5;
      s += Math.max(0, 30 - ageH);
      return s;
    };
    return [...news].sort((a, b) => score(b) - score(a));
  }, [news, niche]);

  const add = async () => {
    const { ok, handle } = parseInvite(url);
    if (!name.trim() || !ok) { alert("Paste a valid WhatsApp channel invite link (whatsapp.com/channel/...)"); return; }
    setBusy(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user.id;
      if (!uid) return;
      const { error } = await supabase.from("whatsapp_channels").insert({
        user_id: uid, name: name.trim().slice(0, 80), handle, invite_url: url.trim(),
        is_own: isOwn, priority: isOwn ? 100 : 0,
      });
      if (error) throw error;
      setName(""); setUrl(""); setIsOwn(false);
      const { data: ch } = await supabase.from("whatsapp_channels").select("*").order("priority", { ascending: false }).order("created_at", { ascending: false });
      setChannels((ch as any) ?? []);
    } catch (e: any) { alert(e?.message ?? "Failed"); }
    finally { setBusy(false); }
  };

  const remove = async (id: string) => {
    await supabase.from("whatsapp_channels").delete().eq("id", id);
    setChannels((c) => c.filter((x) => x.id !== id));
  };

  const pin = async (c: Channel) => {
    const next = c.priority >= 50 ? 0 : 100;
    await supabase.from("whatsapp_channels").update({ priority: next }).eq("id", c.id);
    setChannels((cs) => [...cs.map((x) => x.id === c.id ? { ...x, priority: next } : x)].sort((a, b) => b.priority - a.priority));
  };

  return (
    <div className="min-h-screen">
      <header className="border-b sticky top-0 z-30 bg-background/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Dashboard
          </Link>
          <div className="font-display text-xl flex items-center gap-2">
            <span className="size-7 grid place-items-center rounded-md text-white" style={{ background: "#25D366" }}>
              <MessageCircle className="size-4" />
            </span>
            WhatsApp Channels
          </div>
          <div className="text-xs text-muted-foreground hidden sm:block">{specialty ? `Niche: ${specialty}` : "Set specialty in profile to prioritize"}</div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8 grid lg:grid-cols-[360px_1fr] gap-6">
        {/* WhatsApp-style channel list */}
        <section className="rounded-2xl border bg-card overflow-hidden" style={{ boxShadow: "var(--shadow-soft)" }}>
          <div className="px-4 py-3 border-b flex items-center justify-between" style={{ background: "color-mix(in oklab, #25D366 8%, transparent)" }}>
            <div className="text-sm font-medium">Your channels</div>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{channels.length}</span>
          </div>

          <div className="p-3 border-b space-y-2">
            <Input placeholder="Channel name (e.g. Dr. Mehta Updates)" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="https://whatsapp.com/channel/..." value={url} onChange={(e) => setUrl(e.target.value)} />
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input type="checkbox" checked={isOwn} onChange={(e) => setIsOwn(e.target.checked)} />
              This is my own channel (pin to top)
            </label>
            <Button size="sm" className="w-full" onClick={add} disabled={busy}>
              {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />} Follow channel
            </Button>
            <p className="text-[11px] text-muted-foreground">
              Open WhatsApp → Channels → tap the channel → Share link → paste here.
            </p>
          </div>

          <ul className="divide-y max-h-[60vh] overflow-auto">
            {channels.length === 0 && (
              <li className="p-6 text-center text-sm text-muted-foreground">No channels yet. Paste a link above.</li>
            )}
            {channels.map((c) => (
              <li key={c.id} className="p-3 flex items-center gap-3 hover:bg-secondary/50 transition">
                <div className="size-10 rounded-full grid place-items-center text-white shrink-0" style={{ background: "#25D366" }}>
                  <Megaphone className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium truncate">{c.name}</span>
                    {c.is_own && <BadgeCheck className="size-3.5 text-primary shrink-0" />}
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">@{c.handle ?? "channel"}</div>
                </div>
                <button onClick={() => pin(c)} title="Pin" className="p-1.5 rounded hover:bg-secondary">
                  <Star className={`size-3.5 ${c.priority >= 50 ? "fill-current text-amber-500" : "text-muted-foreground"}`} />
                </button>
                <a href={c.invite_url} target="_blank" rel="noreferrer" title="Open in WhatsApp" className="p-1.5 rounded hover:bg-secondary">
                  <ExternalLink className="size-3.5" />
                </a>
                <button onClick={() => remove(c.id)} title="Remove" className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-destructive">
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* Niche-prioritized feed styled like WhatsApp messages */}
        <section className="rounded-2xl border bg-card overflow-hidden" style={{ boxShadow: "var(--shadow-soft)" }}>
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <div className="text-sm font-medium flex items-center gap-2">
              <Newspaper className="size-4 text-primary" /> Priority updates for you
            </div>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{niche || "all"}</span>
          </div>
          <div className="p-4 space-y-3" style={{ background: "color-mix(in oklab, #25D366 4%, transparent)" }}>
            {loading && <div className="text-center text-sm text-muted-foreground py-10">Loading…</div>}
            {!loading && ranked.length === 0 && <div className="text-center text-sm text-muted-foreground py-10">No updates yet.</div>}
            {ranked.slice(0, 20).map((n, i) => {
              const hot = niche && (`${n.title} ${(n.specialty_tags ?? []).join(" ")}`).toLowerCase().includes(niche);
              return (
                <a key={n.id} href={n.url} target="_blank" rel="noreferrer"
                  className="block rounded-xl rounded-tl-sm bg-background border p-3 max-w-[92%] hover:shadow-md transition animate-in fade-in slide-in-from-bottom-1"
                  style={{ animationDelay: `${i * 30}ms` }}>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="font-medium text-foreground">{n.source ?? "Channel"}</span>
                    {hot && <span className="px-1.5 py-0.5 rounded-full text-[9px] uppercase tracking-widest" style={{ background: "#25D366", color: "white" }}>For you</span>}
                    {n.published_at && <span>· {new Date(n.published_at).toLocaleDateString()}</span>}
                  </div>
                  <div className="text-sm font-medium mt-1">{n.title}</div>
                  {n.summary && <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.summary}</div>}
                  <div className="mt-2 flex items-center gap-1 text-[11px] text-primary">
                    <ExternalLink className="size-3" /> Open
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}

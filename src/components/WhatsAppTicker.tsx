import { useEffect, useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { refreshNews } from "@/lib/news.functions";
import { MessageCircle, Megaphone, ExternalLink } from "lucide-react";

type News = { id: string; title: string; url: string; source: string | null; specialty_tags: string[]; published_at: string | null; fetched_at: string };

export function WhatsAppTicker() {
  const [items, setItems] = useState<News[]>([]);
  const [channels, setChannels] = useState<number>(0);
  const [specialty, setSpecialty] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const refreshFn = useServerFn(refreshNews);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) return;
      const uid = sess.session.user.id;
      const [{ data: ni }, { data: ch }, { data: prof }] = await Promise.all([
        supabase.from("news_items").select("id,title,url,source,specialty_tags,published_at,fetched_at").order("fetched_at", { ascending: false }).limit(30),
        supabase.from("whatsapp_channels").select("id", { count: "exact", head: false }),
        supabase.from("profiles").select("specialty").eq("id", uid).maybeSingle(),
      ]);
      if (cancelled) return;
      let list = (ni as News[]) ?? [];
      if (list.length === 0) {
        try { await refreshFn({}); const { data: d2 } = await supabase.from("news_items").select("id,title,url,source,specialty_tags,published_at,fetched_at").order("fetched_at", { ascending: false }).limit(30); list = (d2 as any) ?? []; } catch {}
      }
      if (cancelled) return;
      setItems(list);
      setChannels((ch as any[])?.length ?? 0);
      setSpecialty((prof as any)?.specialty ?? null);
    })();
    return () => { cancelled = true; };
  }, [refreshFn]);

  const niche = (specialty ?? "").toLowerCase();
  const ranked = useMemo(() => {
    const s = (n: News) => {
      const hay = `${n.title} ${(n.specialty_tags ?? []).join(" ")}`.toLowerCase();
      let v = 0;
      if (niche && hay.includes(niche)) v += 100;
      const ageH = (Date.now() - new Date(n.published_at ?? n.fetched_at).getTime()) / 36e5;
      v += Math.max(0, 30 - ageH);
      return v;
    };
    return [...items].sort((a, b) => s(b) - s(a)).slice(0, 10);
  }, [items, niche]);

  useEffect(() => {
    if (ranked.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % ranked.length), 4500);
    return () => clearInterval(t);
  }, [ranked.length]);

  const item = ranked[idx];

  return (
    <Link to="/channels" className="block rounded-xl border overflow-hidden hover:shadow-md transition" style={{ background: "color-mix(in oklab, #25D366 6%, var(--card))" }}>
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="size-9 rounded-full grid place-items-center text-white shrink-0" style={{ background: "#25D366" }}>
          <MessageCircle className="size-4" />
        </div>
        <div className="shrink-0">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">WhatsApp Channels</div>
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Megaphone className="size-3" /> {channels} following · {niche || "set niche"}
          </div>
        </div>
        {item ? (
          <div key={item.id} className="flex-1 min-w-0 animate-in fade-in slide-in-from-right-2 duration-500">
            <div className="text-sm truncate font-medium">{item.title}</div>
            <div className="text-[11px] text-muted-foreground truncate">{item.source ?? "Channel update"}</div>
          </div>
        ) : (
          <div className="flex-1 text-sm text-muted-foreground">Add a channel to see priority updates →</div>
        )}
        <ExternalLink className="size-3.5 text-muted-foreground shrink-0" />
      </div>
    </Link>
  );
}

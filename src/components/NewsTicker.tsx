import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { refreshNews } from "@/lib/news.functions";
import { Newspaper, ExternalLink } from "lucide-react";

type Item = { id: string; title: string; url: string; source: string | null; region: string };

export function NewsTicker() {
  const [items, setItems] = useState<Item[]>([]);
  const [idx, setIdx] = useState(0);
  const refreshFn = useServerFn(refreshNews);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) return;
      const { data } = await supabase
        .from("news_items")
        .select("id,title,url,source,region")
        .order("fetched_at", { ascending: false })
        .limit(20);
      if (cancelled) return;
      let list = (data as Item[]) ?? [];
      if (list.length === 0) {
        try {
          await refreshFn({});
          const { data: d2 } = await supabase
            .from("news_items")
            .select("id,title,url,source,region")
            .order("fetched_at", { ascending: false })
            .limit(20);
          list = (d2 as Item[]) ?? [];
        } catch (e) { console.error(e); }
      }
      if (!cancelled) setItems(list);
    })();
    return () => { cancelled = true; };
  }, [refreshFn]);

  useEffect(() => {
    if (items.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % items.length), 5000);
    return () => clearInterval(t);
  }, [items.length]);

  if (items.length === 0) return null;
  const item = items[idx];

  return (
    <div className="rounded-xl border bg-card overflow-hidden" style={{ boxShadow: "var(--shadow-soft)" }}>
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="size-8 rounded-md bg-secondary text-primary grid place-items-center shrink-0">
          <Newspaper className="size-4" />
        </div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground shrink-0">
          {item.region} · {item.source ?? "News"}
        </div>
        <a
          key={item.id}
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="flex-1 min-w-0 truncate text-sm hover:underline animate-in fade-in slide-in-from-right-2 duration-500"
          title={item.title}
        >
          {item.title}
        </a>
        <a href={item.url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground shrink-0">
          <ExternalLink className="size-3.5" />
        </a>
      </div>
      <div className="flex gap-1 px-4 pb-2">
        {items.slice(0, Math.min(items.length, 10)).map((_, i) => (
          <span key={i} className={`h-0.5 flex-1 rounded ${i === idx % 10 ? "bg-foreground" : "bg-border"}`} />
        ))}
      </div>
    </div>
  );
}

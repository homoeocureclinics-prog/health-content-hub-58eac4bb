import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Upload, Sparkles, Calendar as CalendarIcon, Trash2, Loader2 } from "lucide-react";
import { generateCaption } from "@/lib/ai-caption.functions";

export const Route = createFileRoute("/calendar")({
  component: CalendarPage,
  head: () => ({ meta: [{ title: "Content Calendar — MedSocial AI" }] }),
});

type Asset = {
  id: string;
  storage_path: string;
  mime_type: string;
  kind: "image" | "video";
  caption: string | null;
  hashtags: string[];
  scheduled_for: string | null;
  created_at: string;
  signedUrl?: string;
};

function CalendarPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [topic, setTopic] = useState("");
  const [filter, setFilter] = useState<"all" | "scheduled" | "drafts">("all");
  const captionFn = useServerFn(generateCaption);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate({ to: "/login" });
      else setUserId(session.user.id);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate({ to: "/login" });
      else setUserId(data.session.user.id);
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const refresh = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("media_assets")
      .select("*")
      .order("scheduled_for", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });
    const rows = (data ?? []) as Asset[];
    // sign URLs
    const withUrls = await Promise.all(
      rows.map(async (a) => {
        const { data: s } = await supabase.storage.from("media").createSignedUrl(a.storage_path, 3600);
        return { ...a, signedUrl: s?.signedUrl };
      }),
    );
    setAssets(withUrls);
    setLoading(false);
  };

  useEffect(() => {
    if (userId) refresh();
  }, [userId]);

  const onUpload = async (files: FileList | null) => {
    if (!files || !userId) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const kind: "image" | "video" = file.type.startsWith("video") ? "video" : "image";
        const ext = file.name.split(".").pop() ?? (kind === "video" ? "mp4" : "jpg");
        const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("media")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (upErr) throw upErr;
        const { error: insErr } = await supabase.from("media_assets").insert({
          user_id: userId,
          storage_path: path,
          mime_type: file.type,
          kind,
          size_bytes: file.size,
        });
        if (insErr) throw insErr;
      }
      await refresh();
    } catch (e: any) {
      alert(e?.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const aiCaption = async (a: Asset) => {
    const t = topic.trim() || (a.caption ?? "Health awareness post");
    try {
      const res = await captionFn({
        data: { topic: t, mediaKind: a.kind, platform: "instagram", language: "en" },
      });
      await supabase
        .from("media_assets")
        .update({ caption: res.caption, hashtags: res.hashtags })
        .eq("id", a.id);
      await refresh();
    } catch (e: any) {
      alert(e?.message ?? "AI generation failed");
    }
  };

  const updateField = async (id: string, patch: Partial<Asset>) => {
    await supabase.from("media_assets").update(patch as any).eq("id", id);
    setAssets((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  };

  const remove = async (a: Asset) => {
    if (!confirm("Delete this asset?")) return;
    await supabase.storage.from("media").remove([a.storage_path]);
    await supabase.from("media_assets").delete().eq("id", a.id);
    setAssets((xs) => xs.filter((x) => x.id !== a.id));
  };

  const grouped = useMemo(() => {
    const filtered = assets.filter((a) =>
      filter === "all" ? true : filter === "scheduled" ? !!a.scheduled_for : !a.scheduled_for,
    );
    const map = new Map<string, Asset[]>();
    for (const a of filtered) {
      const key = a.scheduled_for
        ? new Date(a.scheduled_for).toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })
        : "Unscheduled";
      const arr = map.get(key) ?? [];
      arr.push(a);
      map.set(key, arr);
    }
    return Array.from(map.entries());
  }, [assets, filter]);

  return (
    <div className="min-h-screen">
      <header className="border-b sticky top-0 z-30 bg-background/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Dashboard
          </Link>
          <div className="font-display text-xl">Content calendar</div>
          <div />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        {/* Upload card */}
        <div className="rounded-2xl border bg-card p-6" style={{ boxShadow: "var(--shadow-soft)" }}>
          <h2 className="text-lg font-medium">Upload content</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Reels, long-form videos, carousel images or graphics. Captions and hashtags are generated by AI.
          </p>

          <div className="mt-4 grid sm:grid-cols-[1fr_auto] gap-3">
            <Input
              placeholder="Optional topic / context for the AI (e.g. 'World TB Day 2026 awareness')"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
            <label className="inline-flex">
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                className="sr-only"
                onChange={(e) => onUpload(e.target.files)}
              />
              <span className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-primary text-primary-foreground cursor-pointer hover:bg-primary/90">
                {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                {uploading ? "Uploading…" : "Upload files"}
              </span>
            </label>
          </div>

          <div className="mt-4 flex gap-2 text-sm">
            {(["all", "scheduled", "drafts"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full border ${filter === f ? "bg-foreground text-background" : "bg-transparent"}`}
              >
                {f[0].toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Asset groups */}
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : grouped.length === 0 ? (
          <div className="rounded-2xl border bg-card p-10 text-center text-muted-foreground">
            No content yet. Upload your first reel, video or graphic above.
          </div>
        ) : (
          grouped.map(([day, items]) => (
            <section key={day} className="space-y-3">
              <div className="flex items-center gap-2 text-sm uppercase tracking-widest text-muted-foreground">
                <CalendarIcon className="size-4" /> {day}
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {items.map((a) => (
                  <article key={a.id} className="rounded-2xl border bg-card overflow-hidden" style={{ boxShadow: "var(--shadow-soft)" }}>
                    <div className="aspect-video bg-black grid place-items-center">
                      {a.signedUrl && (a.kind === "video" ? (
                        <video src={a.signedUrl} controls className="w-full h-full object-contain" />
                      ) : (
                        <img src={a.signedUrl} alt="" className="w-full h-full object-contain" />
                      ))}
                    </div>
                    <div className="p-4 space-y-3">
                      <Textarea
                        placeholder="Caption…"
                        value={a.caption ?? ""}
                        onChange={(e) => setAssets((xs) => xs.map((x) => x.id === a.id ? { ...x, caption: e.target.value } : x))}
                        onBlur={(e) => updateField(a.id, { caption: e.target.value })}
                        rows={4}
                      />
                      <Input
                        placeholder="hashtag1, hashtag2, …"
                        value={a.hashtags.join(", ")}
                        onChange={(e) =>
                          setAssets((xs) => xs.map((x) => x.id === a.id ? { ...x, hashtags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) } : x))
                        }
                        onBlur={(e) =>
                          updateField(a.id, {
                            hashtags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                          })
                        }
                      />
                      {a.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {a.hashtags.slice(0, 12).map((h) => (
                            <span key={h} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                              #{h}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Input
                          type="datetime-local"
                          value={a.scheduled_for ? new Date(a.scheduled_for).toISOString().slice(0, 16) : ""}
                          onChange={(e) => {
                            const v = e.target.value ? new Date(e.target.value).toISOString() : null;
                            updateField(a.id, { scheduled_for: v });
                          }}
                          className="flex-1"
                        />
                        <Button size="sm" variant="secondary" onClick={() => aiCaption(a)}>
                          <Sparkles className="size-4 mr-1" /> AI caption
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => remove(a)} aria-label="Delete">
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))
        )}
      </main>
    </div>
  );
}

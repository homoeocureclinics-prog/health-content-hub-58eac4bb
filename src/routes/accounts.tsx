import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Instagram, Facebook, Linkedin, Youtube, Plug, Trash2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/accounts")({
  component: AccountsPage,
  head: () => ({ meta: [{ title: "Connected Accounts — MedSocial AI" }] }),
});

const PLATFORMS = [
  { id: "instagram", label: "Instagram Business", icon: Instagram, note: "Requires Meta App Review + IG Business account linked to a Facebook Page." },
  { id: "facebook", label: "Facebook Page", icon: Facebook, note: "Manage a Page you administer. Requires Meta App Review." },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin, note: "Personal profile or company page. Requires LinkedIn Marketing API access." },
  { id: "youtube", label: "YouTube channel", icon: Youtube, note: "Google OAuth + YouTube Data API v3. Requires Google verification for production." },
] as const;

type Account = { id: string; platform: string; display_name: string | null; handle: string | null; status: string; created_at: string };

function AccountsPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [adding, setAdding] = useState<string | null>(null);
  const [handle, setHandle] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate({ to: "/login" });
      else { setUserId(data.session.user.id); load(); }
    });
  }, [navigate]);

  const load = async () => {
    const { data } = await supabase.from("social_accounts").select("*").order("created_at", { ascending: false });
    setAccounts((data as any) ?? []);
  };

  const saveAccount = async (platform: string) => {
    if (!userId || !handle.trim()) return;
    const { error } = await supabase.from("social_accounts").insert({
      user_id: userId,
      platform: platform as any,
      external_account_id: handle.trim(),
      handle: handle.trim(),
      display_name: name.trim() || handle.trim(),
      status: "pending_oauth",
    });
    if (error) { alert(error.message); return; }
    setAdding(null); setHandle(""); setName(""); await load();
  };

  const remove = async (id: string) => {
    if (!confirm("Disconnect this account?")) return;
    await supabase.from("social_accounts").delete().eq("id", id);
    await load();
  };

  return (
    <div className="min-h-screen">
      <header className="border-b sticky top-0 z-30 bg-background/90 backdrop-blur">
        <div className="mx-auto max-w-5xl px-6 h-16 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Dashboard
          </Link>
          <div className="font-display text-xl">Connected accounts</div>
          <div />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8 space-y-6">
        <div className="rounded-xl border bg-secondary/40 p-4 text-sm">
          <strong>Heads up:</strong> Full one-click OAuth for Meta (IG/FB), LinkedIn and YouTube requires platform app-review.
          You can register your handles now to organize the workspace; auto-publishing will activate once OAuth review is complete.
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {PLATFORMS.map((p) => {
            const connected = accounts.filter((a) => a.platform === p.id);
            return (
              <div key={p.id} className="rounded-2xl border bg-card p-5" style={{ boxShadow: "var(--shadow-soft)" }}>
                <div className="flex items-start gap-3">
                  <div className="size-10 rounded-lg bg-secondary text-primary grid place-items-center">
                    <p.icon className="size-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{p.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{p.note}</div>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {connected.length === 0 && <div className="text-sm text-muted-foreground">No accounts linked.</div>}
                  {connected.map((a) => (
                    <div key={a.id} className="flex items-center gap-2 text-sm border rounded-lg px-3 py-2">
                      <CheckCircle2 className="size-4 text-success" />
                      <div className="flex-1 min-w-0">
                        <div className="truncate">{a.display_name ?? a.handle}</div>
                        <div className="text-xs text-muted-foreground truncate">@{a.handle} · {a.status}</div>
                      </div>
                      <button onClick={() => remove(a.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {adding === p.id ? (
                  <div className="mt-3 space-y-2">
                    <Input placeholder="Handle / username" value={handle} onChange={(e) => setHandle(e.target.value)} />
                    <Input placeholder="Display name (optional)" value={name} onChange={(e) => setName(e.target.value)} />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => saveAccount(p.id)}>Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => { setAdding(null); setHandle(""); setName(""); }}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <Button size="sm" variant="secondary" className="mt-3" onClick={() => setAdding(p.id)}>
                    <Plug className="size-4" /> Add account
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

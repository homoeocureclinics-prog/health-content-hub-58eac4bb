import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const refreshNews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Authorize: only admins may refresh the global news feed
    const { data: isAdmin, error: roleErr } = await context.supabase
      .rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (roleErr) {
      console.error("[refreshNews] role check failed", roleErr);
      throw new Error("Authorization check failed");
    }
    if (!isAdmin) throw new Error("Forbidden: admin role required");

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Lovable AI key missing");


    const sys = `You curate healthcare news for Indian doctors. Return 8 recent, real, high-signal items from authoritative sources (WHO, MoHFW, ICMR, The Lancet, NEJM, The Hindu Health, Times of India Health). Mix India + global. Return STRICT JSON {"items":[{"title":string,"summary":string,"url":string,"source":string,"region":"IN"|"GLOBAL","specialty_tags":string[],"published_at":string|null}]}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: "Latest healthcare news this week." },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      console.error("[refreshNews] gateway", res.status, txt);
      throw new Error(`AI gateway returned ${res.status}`);
    }
    const json = await res.json();
    let raw = (json.choices?.[0]?.message?.content ?? "{}") as string;
    // Strip markdown fences if the model wrapped JSON
    raw = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
    let parsed: { items?: any[] } = {};
    try { parsed = JSON.parse(raw); } catch (e) {
      console.error("[refreshNews] JSON parse failed", e, raw.slice(0, 400));
    }

    const safeDate = (v: any): string | null => {
      if (!v) return null;
      const d = new Date(v);
      return isNaN(d.getTime()) ? null : d.toISOString();
    };

    const items = (parsed.items ?? []).slice(0, 12).map((i) => ({
      title: String(i.title ?? "").slice(0, 300),
      summary: i.summary ? String(i.summary).slice(0, 1000) : null,
      url: String(i.url ?? ""),
      source: i.source ? String(i.source).slice(0, 120) : null,
      region: i.region === "GLOBAL" ? "GLOBAL" : "IN",
      specialty_tags: Array.isArray(i.specialty_tags) ? i.specialty_tags.slice(0, 8).map(String) : [],
      published_at: safeDate(i.published_at),
    })).filter((i) => i.title && /^https?:\/\//i.test(i.url));

    if (items.length) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error } = await supabaseAdmin.from("news_items").insert(items as any);
      if (error) {
        console.error("[refreshNews] insert failed", error);
        throw new Error(`Could not save news: ${error.message}`);
      }
    }

    return { inserted: items.length };
  });

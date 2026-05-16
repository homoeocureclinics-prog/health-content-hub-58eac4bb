import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const refreshNews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
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
    if (!res.ok) throw new Error(`AI gateway: ${res.status}`);
    const json = await res.json();
    let parsed: { items?: any[] } = {};
    try { parsed = JSON.parse(json.choices?.[0]?.message?.content ?? "{}"); } catch { /* */ }
    const items = (parsed.items ?? []).slice(0, 12).map((i) => ({
      title: String(i.title ?? "").slice(0, 300),
      summary: i.summary ? String(i.summary).slice(0, 1000) : null,
      url: String(i.url ?? ""),
      source: i.source ? String(i.source).slice(0, 120) : null,
      region: i.region === "GLOBAL" ? "GLOBAL" : "IN",
      specialty_tags: Array.isArray(i.specialty_tags) ? i.specialty_tags.slice(0, 8) : [],
      published_at: i.published_at ?? null,
    })).filter((i) => i.title && i.url);

    if (items.length) {
      await supabaseAdmin.from("news_items").insert(items as any);
    }
    return { inserted: items.length };
  });

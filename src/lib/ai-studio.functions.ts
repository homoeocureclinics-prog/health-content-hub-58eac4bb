import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Input = {
  topic: string;
  languages?: ("en" | "hi")[];
  platforms?: ("instagram" | "facebook" | "linkedin" | "youtube")[];
};

type Variant = {
  platform: "instagram" | "facebook" | "linkedin" | "youtube";
  language: "en" | "hi";
  title: string | null;
  body: string;
  hashtags: string[];
};

// Must match the variant_kind enum in Postgres:
// ig_caption | ig_reel_script | ig_carousel | fb_post | li_post | li_article | yt_short_script | yt_long_script
const KIND_MAP: Record<string, string> = {
  instagram: "ig_caption",
  facebook: "fb_post",
  linkedin: "li_article",
  youtube: "yt_long_script",
};

export const generateContentBundle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: Input) => {
    if (!input?.topic || input.topic.trim().length < 3) throw new Error("Topic required");
    return {
      topic: input.topic.trim().slice(0, 800),
      languages: (input.languages?.length ? input.languages : ["en", "hi"]) as ("en" | "hi")[],
      platforms: (input.platforms?.length
        ? input.platforms
        : ["instagram", "facebook", "linkedin", "youtube"]) as Input["platforms"],
    };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Lovable AI key missing");

    const { data: instr } = await supabase
      .from("content_instructions")
      .select("tone,audience,disclaimer,cta_template,hashtag_style,signature,do_not_say")
      .eq("user_id", userId)
      .maybeSingle();

    const sys = `You are a senior health-communications writer for an Indian medical doctor.
Produce platform-optimized posts grounded in authoritative sources (WHO, ICMR, MoHFW, peer-reviewed).
Tone: ${instr?.tone ?? "warm, professional, evidence-based"}.
Audience: ${instr?.audience ?? "Indian patients and general public"}.
Hashtag style: ${instr?.hashtag_style ?? "max 15, mix broad health + specialty"}.
${instr?.do_not_say ? `Avoid: ${instr.do_not_say}` : ""}
Always end each post with the disclaimer: "${instr?.disclaimer ?? "General information, not medical advice."}" and CTA: "${instr?.cta_template ?? "Book a consultation."}".

Generate variants for these platforms (per language): ${data.platforms!.join(", ")}.
Languages: ${data.languages.join(", ")} (hi = Hindi in Devanagari).

Platform rules:
- instagram: 1500-2200 chars, hook in first line, emojis OK, hashtags as array (no #).
- facebook: 600-1200 chars, conversational.
- linkedin: 1200-1800 chars, professional, no emojis, end with 1 thoughtful question.
- youtube: a long-form script of 350-600 words with [INTRO], [BODY], [CTA] sections. Title <= 70 chars.

Return STRICT JSON:
{"research_summary": string, "citations": [{"title": string, "url": string}], "variants": [{"platform": string, "language": "en"|"hi", "title": string|null, "body": string, "hashtags": string[]}]}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: `Topic: ${data.topic}` },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`AI gateway: ${res.status} ${t.slice(0, 200)}`);
    }
    const json = await res.json();
    const content = json.choices?.[0]?.message?.content ?? "{}";
    let parsed: { research_summary?: string; citations?: any[]; variants?: Variant[] } = {};
    try { parsed = JSON.parse(content); } catch { /* */ }

    const variants = (parsed.variants ?? []).filter((v) =>
      data.platforms!.includes(v.platform as any) && data.languages.includes(v.language),
    );

    // Persist as a post with variants
    const { data: post, error: postErr } = await supabase
      .from("posts")
      .insert({
        user_id: userId,
        topic: data.topic,
        status: "draft",
        research_summary: parsed.research_summary ?? null,
        citations: parsed.citations ?? [],
      })
      .select("id")
      .single();
    if (postErr) throw postErr;

    if (variants.length) {
      const rows = variants.map((v) => ({
        user_id: userId,
        post_id: post.id,
        platform: v.platform,
        kind: KIND_MAP[v.platform] ?? "ig_caption",
        language: v.language,
        title: v.title ?? null,
        body: v.body,
        hashtags: Array.isArray(v.hashtags) ? v.hashtags : [],
      }));
      const { error: vErr } = await supabase.from("post_variants").insert(rows as any);
      if (vErr) throw vErr;
    }

    return {
      postId: post.id,
      research_summary: parsed.research_summary ?? "",
      citations: parsed.citations ?? [],
      variants,
    };
  });

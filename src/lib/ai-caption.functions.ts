import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Input = {
  topic: string;
  mediaKind: "image" | "video";
  platform?: "instagram" | "facebook" | "linkedin" | "youtube";
  language?: "en" | "hi";
};

export const generateCaption = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: Input) => {
    if (!input || typeof input.topic !== "string" || input.topic.length < 2) {
      throw new Error("Topic is required");
    }
    return {
      topic: input.topic.slice(0, 500),
      mediaKind: input.mediaKind === "video" ? "video" : "image",
      platform: input.platform ?? "instagram",
      language: input.language === "hi" ? "hi" : "en",
    } as Required<Input>;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: instr } = await supabase
      .from("content_instructions")
      .select("tone,disclaimer,cta_template,hashtag_style,audience")
      .eq("user_id", userId)
      .maybeSingle();

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Lovable AI key missing");

    const sys = `You are a social media writer for an Indian medical doctor.
Write a caption for ${data.platform} (${data.mediaKind}) in ${data.language === "hi" ? "Hindi (Devanagari)" : "English"}.
Tone: ${instr?.tone ?? "warm, professional, evidence-based"}.
Audience: ${instr?.audience ?? "Indian patients"}.
Hashtag style: ${instr?.hashtag_style ?? "mix of broad health and specialty tags, max 15"}.
End with this disclaimer on a new line: "${instr?.disclaimer ?? "General information, not medical advice."}"
Then a CTA: "${instr?.cta_template ?? "Book a consultation."}"

Return STRICT JSON: {"caption": string, "hashtags": string[]}. Hashtags WITHOUT the # symbol.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: `Topic / context: ${data.topic}` },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) throw new Error(`AI gateway error: ${res.status}`);
    const json = await res.json();
    const content = json.choices?.[0]?.message?.content ?? "{}";
    let parsed: { caption?: string; hashtags?: string[] } = {};
    try { parsed = JSON.parse(content); } catch { parsed = { caption: content }; }
    return {
      caption: parsed.caption ?? "",
      hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags.slice(0, 20) : [],
    };
  });

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  text_ar: z.string().min(1).max(2000),
  text_en: z.string().max(2000).nullable().optional(),
  author: z.string().max(200).nullable().optional(),
  locale: z.enum(["ar", "en"]).default("ar"),
});

export const explainQuote = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const system =
      data.locale === "ar"
        ? "أنت مرشد حكيم يشرح الحكم والاقتباسات بلغة عربية أنيقة وموجزة. تعطي: (1) تفسيراً موجزاً في جملتين، (2) خطوة عملية واحدة لتطبيقها اليوم، (3) سؤالاً واحداً للتأمل. رد بصيغة JSON فقط بالمفاتيح: explanation, action, reflection."
        : "You are a wise mentor who explains quotes in elegant, concise English. Give (1) a two-sentence explanation, (2) one practical action step, (3) one reflective question. Respond as JSON only with keys: explanation, action, reflection.";

    const user = `Quote: "${data.text_ar}"${data.text_en ? `\nEnglish: "${data.text_en}"` : ""}${
      data.author ? `\nAuthor: ${data.author}` : ""
    }`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      throw new Error(`AI error ${res.status}: ${t.slice(0, 200)}`);
    }

    const json = await res.json();
    const content = json.choices?.[0]?.message?.content ?? "{}";
    try {
      const parsed = JSON.parse(content);
      return {
        explanation: String(parsed.explanation ?? ""),
        action: String(parsed.action ?? ""),
        reflection: String(parsed.reflection ?? ""),
      };
    } catch {
      return { explanation: String(content), action: "", reflection: "" };
    }
  });

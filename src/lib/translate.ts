import Anthropic from "@anthropic-ai/sdk";
import { arToEnMany, hasArabic, titleCase } from "./translateCore.mjs";
// الإدارة تكتب بالعربية فقط، والنسخة الإنجليزية تُولَّد تلقائيًا عند الحفظ (بدون أي إعداد أو مفتاح).
// المحرك: ترجمة مجانية (lib/translateCore.mjs). إن ضُبط ANTHROPIC_API_KEY تُستخدم Claude لجودة أعلى، ويُرجع للمجاني عند أي فشل.
// أي فشل لا يمنع الحفظ أبدًا: تبقى الإنجليزية السابقة، وإن لم توجد يظهر النص العربي للزائر.
const hasClaude = () => !!(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
const SYSTEM = `You translate Arabic catalog text into English for DYLLU, a Saudi company selling professional power tools and equipment.
- Concise, natural retail English. Product and category names in Title Case, short like a catalog title.
- Keep model numbers, SKUs, units and measurements (20V, 4.0Ah, 115mm, RPM, kg), and brand names (DYLLU) exactly as written.
- Return every key you receive, with only the translated text as its value.`;
let client: Anthropic | null = null;
async function claude(texts: string[]): Promise<(string | null)[] | null> {
  if (!hasClaude() || !texts.length) return null;
  const ids = texts.map((_, i) => `k${i}`);
  try {
    client ??= new Anthropic({ timeout: 45_000, maxRetries: 1 });
    const res = await client.beta.messages.create({
      model: "claude-opus-5-5", max_tokens: 16000, betas: ["server-side-fallback-2026-07-01"], fallbacks: "default",
      output_config: { effort: "low", format: { type: "json_schema", schema: { type: "object", properties: Object.fromEntries(ids.map((id) => [id, { type: "string" }])), required: ids, additionalProperties: false } } },
      system: SYSTEM, messages: [{ role: "user", content: `Translate into English:\n${JSON.stringify(Object.fromEntries(ids.map((id, i) => [id, texts[i]])))}` }],
    });
    if (res.stop_reason === "refusal" || res.stop_reason === "max_tokens") return null;
    const text = res.content.find((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")?.text;
    const out = text ? (JSON.parse(text) as Record<string, unknown>) : {};
    return ids.map((id) => (typeof out[id] === "string" && (out[id] as string).trim() ? (out[id] as string).trim() : null));
  } catch (e) { console.error("[translate]", (e as Error).message); return null; }
}

// مهمة ترجمة: النص العربي الحالي + (اختياريًا) العربي والإنجليزي المحفوظين سابقًا
export type Job = { ar?: string | null; prevAr?: string | null; prevEn?: string | null; title?: boolean };
// يرجع الإنجليزية لكل مهمة: "" إن كان العربي فارغًا، الإنجليزية السابقة إن لم يتغير العربي، وإلا ترجمة جديدة.
// عند فشل الترجمة: الإنجليزية السابقة إن وُجدت، وإلا "" (فيظهر العربي للزائر الإنجليزي)
export async function englishFor(jobs: Job[]): Promise<string[]> {
  const out = jobs.map((j) => { const ar = (j.ar ?? "").trim(); if (!ar) return ""; if (!hasArabic(ar)) return ar; if (j.prevEn?.trim() && (j.prevAr ?? "").trim() === ar) return j.prevEn.trim(); return null; });
  const need = out.flatMap((v, i) => (v === null ? [i] : []));
  if (need.length) {
    const texts = need.map((i) => (jobs[i].ar ?? "").trim());
    const viaClaude = await claude(texts), free = viaClaude && viaClaude.every(Boolean) ? null : await arToEnMany(texts);
    need.forEach((i, k) => { const t = viaClaude?.[k] ?? free?.[k] ?? null; out[i] = t ? (jobs[i].title ? titleCase(t) : t) : (jobs[i].prevEn ?? "").trim(); });
  }
  return out as string[];
}
// ترجمة نص واحد (للنصوص الحرة)
export const toEnglish = async (ar: string, title = false) => (await englishFor([{ ar, title }]))[0];

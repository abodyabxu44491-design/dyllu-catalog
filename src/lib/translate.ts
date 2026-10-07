import Anthropic from "@anthropic-ai/sdk";
// ترجمة تلقائية بين العربية والإنجليزية عبر Claude. تعمل فقط إذا ضُبط ANTHROPIC_API_KEY في .env،
// وأي فشل (لا يوجد مفتاح، انقطاع، رفض) يرجع بدون ترجمة ولا يمنع الحفظ أبدًا.
export const canTranslate = () => !!(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
const SYSTEM = `You translate catalog text for DYLLU, a Saudi company selling professional power tools and equipment.
- Translate each value into the requested language. Arabic output: clear Modern Standard Arabic as used in Saudi retail. English output: concise, natural retail English.
- Keep model numbers, SKUs, units and measurements (20V, 4.0Ah, 115mm, RPM, kg), and brand names (DYLLU) exactly as written.
- Product names stay short like a catalog title; do not add words that are not in the source.
- Return every key you receive, with only the translated text as its value.`;
let client: Anthropic | null = null;
// texts: { مفتاح: نص } ← نفس المفاتيح مترجمة. المفاتيح الفارغة تُتجاهل
export async function translate(texts: Record<string, string>, to: "en" | "ar"): Promise<Record<string, string>> {
  const entries = Object.entries(texts).map(([k, v]) => [k, v.trim()] as const).filter(([, v]) => v);
  if (!entries.length || !canTranslate()) return {};
  // مفاتيح آمنة للمخطط (k0, k1, ...) ثم نعيدها لأسمائها الأصلية
  const ids = entries.map((_, i) => `k${i}`), input = Object.fromEntries(entries.map(([, v], i) => [ids[i], v]));
  try {
    client ??= new Anthropic({ timeout: 45_000, maxRetries: 1 });
    const res = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low", format: { type: "json_schema", schema: { type: "object", properties: Object.fromEntries(ids.map((id) => [id, { type: "string" }])), required: ids, additionalProperties: false } } },
      system: SYSTEM,
      messages: [{ role: "user", content: `Translate into ${to === "en" ? "English" : "Arabic"}:\n${JSON.stringify(input)}` }],
    });
    if (res.stop_reason === "refusal" || res.stop_reason === "max_tokens") return {};
    const text = res.content.find((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")?.text;
    const out = text ? (JSON.parse(text) as Record<string, unknown>) : {};
    return Object.fromEntries(entries.flatMap(([k], i) => (typeof out[ids[i]] === "string" && (out[ids[i]] as string).trim() ? [[k, (out[ids[i]] as string).trim()]] : [])));
  } catch (e) {
    console.error("[translate]", e instanceof Anthropic.APIError ? `${e.status} ${e.message}` : (e as Error).message);
    return {};
  }
}
// يملأ الحقل الفارغ من كل زوج (عربي/إنجليزي) بترجمة الحقل الآخر. pairs: [مفتاح العربي، مفتاح الإنجليزي]
export async function fillPairs<T extends Record<string, unknown>>(obj: T, pairs: [keyof T & string, keyof T & string][]): Promise<T> {
  const toEn: Record<string, string> = {}, toAr: Record<string, string> = {}, s = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  for (const [ar, en] of pairs) { if (s(obj[ar]) && !s(obj[en])) toEn[en] = s(obj[ar]); else if (s(obj[en]) && !s(obj[ar])) toAr[ar] = s(obj[en]); }
  const [a, b] = await Promise.all([translate(toEn, "en"), translate(toAr, "ar")]);
  return { ...obj, ...a, ...b };
}

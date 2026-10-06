// حد بسيط للمحاولات (في الذاكرة): يكفي لسيرفر واحد. للإنتاج متعدد السيرفرات استخدم Redis/Upstash.
const hits = new Map<string, number[]>();
export function limited(key: string, max: number, windowMs: number) {
  const now = Date.now(), a = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  a.push(now); hits.set(key, a); return a.length > max;
}
export const ipOf = (req: Request) => req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "local";

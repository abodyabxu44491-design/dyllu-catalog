// جلسة الأدمن: كوكي موقّع HMAC (يعمل في middleware و API)
const enc = new TextEncoder();
async function hmac(data: string) {
  const k = await crypto.subtle.importKey("raw", enc.encode(process.env.ADMIN_SESSION_SECRET ?? ""), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return Array.from(new Uint8Array(await crypto.subtle.sign("HMAC", k, enc.encode(data)))).map((b) => b.toString(16).padStart(2, "0")).join("");
}
// رموز موقّعة عامة (مثل كوكي الجملة): kind.id.exp.sig
export async function signToken(kind: string, id: number, days = 30) { const p = `${kind}.${id}.${Date.now() + days * 864e5}`; return `${p}.${await hmac(p)}`; }
export async function verifyToken(kind: string, t?: string) {
  if (!t || !process.env.ADMIN_SESSION_SECRET) return null;
  const [k, id, exp, sig] = t.split(".");
  return k === kind && Number(exp) > Date.now() && sig === (await hmac(`${k}.${id}.${exp}`)) ? Number(id) : null;
}
export const SESSION_COOKIE = "dyllu_admin";
// الصيغة: userId.sessionVersion.exp.sig — رفع sessionVersion في قاعدة البيانات يُبطل كل جلسات المستخدم (الخروج/تغيير كلمة المرور)
export async function signSession(userId: number, ver: number) { const p = `${userId}.${ver}.${Date.now() + 7 * 864e5}`; return `${p}.${await hmac(p)}`; }
// يتحقق من التوقيع والصلاحية فقط (يعمل في middleware). التحقق من وجود المستخدم ونسخة الجلسة في lib/adminAuth.ts
export async function verifySession(t?: string) {
  if (!t || !process.env.ADMIN_SESSION_SECRET) return null;
  const [id, ver, exp, sig] = t.split(".");
  return Number(exp) > Date.now() && sig === (await hmac(`${id}.${ver}.${exp}`)) ? { id: Number(id), ver: Number(ver) } : null;
}

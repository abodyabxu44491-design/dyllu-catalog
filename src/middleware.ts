import { NextResponse, type NextRequest } from "next/server";
import { REP_COOKIE, SESSION_COOKIE, verifyRepSession, verifySession } from "@/lib/session";
// حماية /admin (جلسة الأدمن) و /rep (جلسة المندوب). التحقق الكامل من قاعدة البيانات في adminAuth / repAuth
// الدومين الرسمي: أي زيارة لرابط قديم (dyllu.onrender.com أو رابط vercel.app الرئيسي) تُحوَّل له بنفس المسار،
// فتبقى رموز QR والروابط المطبوعة القديمة شغالة وتفتح على الدومين الجديد. روابط معاينة Vercel لا تتأثر
const MAIN_HOST = (process.env.MAIN_DOMAIN || "dyllusa.com").replace(/^https?:\/\//, "").replace(/\/.*$/, "");
function oldHost(host: string) {
  if (!MAIN_HOST || host === MAIN_HOST) return false;
  return host.endsWith(".onrender.com") || (host.endsWith(".vercel.app") && process.env.VERCEL_ENV === "production");
}
export async function middleware(req: NextRequest) {
  const host = (req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "").split(",")[0].trim().split(":")[0];
  if ((req.method === "GET" || req.method === "HEAD") && oldHost(host)) {
    const u = new URL(req.nextUrl.pathname + req.nextUrl.search, `https://${MAIN_HOST}`);
    return NextResponse.redirect(u, 308);
  }
  const p = req.nextUrl.pathname, api = p.startsWith("/api");
  const guarded = /^\/(api\/)?(admin|rep)(\/|$)/.test(p);
  if (!guarded) return NextResponse.next();
  // الدخول والخروج متاحان دائمًا: الخروج يجب أن يعمل حتى لو كانت الجلسة منتهية أو غير صالحة
  if (/^\/api\/(admin|rep)\/(login|logout)$/.test(p)) return NextResponse.next();
  const rep = p.startsWith("/rep") || p.startsWith("/api/rep");
  const ok = rep ? await verifyRepSession(req.cookies.get(REP_COOKIE)?.value) : await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (ok) return NextResponse.next();
  return api ? NextResponse.json({ error: "unauthorized" }, { status: 401 }) : NextResponse.redirect(new URL(rep ? "/rep-login" : `/admin-login${p === "/admin" ? "" : `?next=${encodeURIComponent(p + req.nextUrl.search)}`}`, req.url));
}
// كل الصفحات (لتحويل الروابط القديمة) ما عدا ملفات Next الثابتة. الحماية تبقى على /admin و /rep فقط
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };

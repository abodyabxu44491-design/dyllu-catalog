import { NextResponse, type NextRequest } from "next/server";
import { REP_COOKIE, SESSION_COOKIE, verifyRepSession, verifySession } from "@/lib/session";
// حماية /admin (جلسة الأدمن) و /rep (جلسة المندوب). التحقق الكامل من قاعدة البيانات في adminAuth / repAuth
export async function middleware(req: NextRequest) {
  const p = req.nextUrl.pathname, api = p.startsWith("/api");
  if (p === "/api/admin/login" || p === "/api/rep/login") return NextResponse.next();
  const rep = p.startsWith("/rep") || p.startsWith("/api/rep");
  const ok = rep ? await verifyRepSession(req.cookies.get(REP_COOKIE)?.value) : await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (ok) return NextResponse.next();
  return api ? NextResponse.json({ error: "unauthorized" }, { status: 401 }) : NextResponse.redirect(new URL(rep ? "/rep-login" : "/admin-login", req.url));
}
export const config = { matcher: ["/admin/:path*", "/api/admin/:path*", "/rep", "/rep/:path*", "/api/rep/:path*"] };

import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname === "/api/admin/login") return NextResponse.next();
  if (await verifySession(req.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next();
  return req.nextUrl.pathname.startsWith("/api") ? NextResponse.json({ error: "unauthorized" }, { status: 401 }) : NextResponse.redirect(new URL("/admin-login", req.url));
}
export const config = { matcher: ["/admin/:path*", "/api/admin/:path*"] };

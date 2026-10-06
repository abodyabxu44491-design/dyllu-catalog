import { NextResponse } from "next/server";
export async function POST(req: Request) { const r = NextResponse.redirect(new URL("/admin-login", req.url), 303); r.cookies.delete("dyllu_admin"); return r; }

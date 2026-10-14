// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ipOf, limited } from "@/lib/ratelimit";
import { signToken } from "@/lib/session";
import { WS_COOKIE } from "@/lib/wholesale";
export async function POST(req: Request) {
  if (limited(`ws:${ipOf(req)}`, 6, 60_000)) return NextResponse.json({ error: "محاولات كثيرة، انتظر دقيقة" }, { status: 429 });
  const { code } = await req.json().catch(() => ({ code: "" }));
  const c = await db.wholesaleCode.findUnique({
    where: {
      code: String(code ?? "")
        .trim()
        .toUpperCase(),
    },
  });
  if (!c || !c.isActive) return NextResponse.json({ error: "الكود غير صحيح" }, { status: 401 });
  const res = NextResponse.json({ ok: true, name: c.name });
  res.cookies.set(WS_COOKIE, await signToken("ws", c.id, 30), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 30 * 86400,
  });
  return res;
}
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(WS_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}

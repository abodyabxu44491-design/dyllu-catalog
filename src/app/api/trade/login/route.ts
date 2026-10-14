// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { TRADE_COOKIE } from "@/lib/session";
import { currentTrade } from "@/lib/tradeAuth";
// Called by the app after it is opened from the shop's private link: remembers the key in a cookie,
// so the installed app opens straight in even when started without the link.
export async function POST(req: Request) {
  const { key } = await req.json().catch(() => ({ key: "" }));
  const shop = await currentTrade(String(key ?? ""));
  if (!shop) return NextResponse.json({ error: "الرابط غير صالح" }, { status: 401 });
  await db.wholesaleCode.update({ where: { id: shop.id }, data: { lastUsedAt: new Date() } });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(TRADE_COOKIE, String(key), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 400 * 86400,
  });
  return res;
}

// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { NextResponse } from "next/server";
import { assignedRep } from "@/lib/orders";
import { isPhone } from "@/lib/phone";
import { ipOf, limited } from "@/lib/ratelimit";
export const dynamic = "force-dynamic";
// Which rep a returning customer belongs to, so checkout shows only that rep
export async function GET(req: Request) {
  if (limited(`assigned:${ipOf(req)}`, 30, 60_000)) return NextResponse.json({ repId: null }, { status: 429 });
  const phone = new URL(req.url).searchParams.get("phone") ?? "";
  if (!isPhone(phone)) return NextResponse.json({ repId: null });
  const rep = await assignedRep(phone);
  return NextResponse.json({ repId: rep?.id ?? null }, { headers: { "Cache-Control": "no-store" } });
}
